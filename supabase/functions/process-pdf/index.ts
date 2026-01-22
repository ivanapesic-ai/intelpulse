import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PdfQueueRow {
  id: string;
  url: string;
  source_type: string;
  zenodo_record_id: string | null;
  status: string;
  retry_count: number;
}

interface TechKeyword {
  id: string;
  keyword: string;
  display_name: string;
  aliases: string[] | null;
}

// Zenodo API to get direct download URL
// Zenodo API with retry logic
async function getZenodoDownloadUrl(recordId: string, apiToken: string): Promise<string | null> {
  const maxRetries = 3;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delayMs = Math.pow(2, attempt) * 3000; // 3s, 6s, 12s
        console.log(`Zenodo API retry ${attempt + 1}, waiting ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
      const response = await fetch(`https://zenodo.org/api/records/${recordId}`, {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json',
        },
      });

      if (response.status === 503 || response.status === 429) {
        console.log(`Zenodo API returned ${response.status}, will retry...`);
        continue;
      }

      if (!response.ok) {
        console.error(`Zenodo API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const files = data.files || [];
      
      // Find the first PDF file
      const pdfFile = files.find((f: any) => 
        f.key?.toLowerCase().endsWith('.pdf') || f.type === 'pdf'
      );

      if (pdfFile) {
        // Use the links.self to get direct download URL
        const downloadUrl = pdfFile.links?.self || pdfFile.links?.download || null;
        console.log(`Resolved Zenodo ${recordId} to: ${downloadUrl}`);
        return downloadUrl;
      }

      console.log(`No PDF found in Zenodo record ${recordId}`);
      return null;
    } catch (error) {
      console.error('Zenodo API error:', error);
      if (attempt === maxRetries - 1) return null;
    }
  }
  
  return null;
}

// Download PDF with retry logic and exponential backoff
async function downloadPdfWithRetry(
  url: string, 
  maxRetries: number = 5,
  zenodoToken?: string
): Promise<{ buffer: ArrayBuffer; filename: string; size: number } | null> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Longer exponential backoff for Zenodo rate limits
      if (attempt > 0) {
        const delayMs = Math.min(Math.pow(2, attempt) * 2000, 30000); // 2s, 4s, 8s, 16s, 30s
        console.log(`Waiting ${delayMs}ms before retry ${attempt + 1}...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (compatible; BluSpecs-Radar/1.0; research-platform)',
        'Accept': 'application/pdf,*/*',
      };

      // Add Zenodo auth if available
      if (zenodoToken && url.includes('zenodo.org')) {
        headers['Authorization'] = `Bearer ${zenodoToken}`;
      }

      console.log(`Attempt ${attempt + 1}: Downloading ${url}`);
      const response = await fetch(url, { headers, redirect: 'follow' });

      if (response.status === 503) {
        console.log(`Attempt ${attempt + 1}: 503 Service Unavailable, will retry...`);
        continue;
      }

      if (response.status === 429) {
        console.log(`Attempt ${attempt + 1}: 429 Rate Limited, will retry with longer delay...`);
        // Extra delay for rate limiting
        await new Promise(resolve => setTimeout(resolve, 10000));
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('pdf') && !contentType.includes('octet-stream')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      const buffer = await response.arrayBuffer();
      
      // Validate it's actually a PDF
      const header = new Uint8Array(buffer.slice(0, 5));
      const pdfMagic = String.fromCharCode(...header);
      if (!pdfMagic.startsWith('%PDF')) {
        throw new Error('Not a valid PDF file');
      }

      // Extract filename from URL
      const urlPath = new URL(url).pathname;
      const filename = decodeURIComponent(urlPath.split('/').pop() || 'document.pdf');

      console.log(`Successfully downloaded: ${filename} (${buffer.byteLength} bytes)`);
      return { buffer, filename, size: buffer.byteLength };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`Attempt ${attempt + 1} failed:`, lastError.message);
    }
  }

  console.error('All download attempts failed:', lastError?.message);
  return null;
}

// Extract text from PDF using Gemini
async function extractPdfText(
  pdfBuffer: ArrayBuffer, 
  filename: string,
  apiKey: string
): Promise<string | null> {
  try {
    const base64Pdf = btoa(
      new Uint8Array(pdfBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract all readable text from this PDF document. Focus on technology names, TRL levels, research findings, and policy references. Return the extracted text content only.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64Pdf}`,
                },
              },
            ],
          },
        ],
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error('PDF text extraction error:', error);
    return null;
  }
}

// Enhanced system prompt for TRL, policy, and Headai-style scoring extraction
const EXTRACTION_SYSTEM_PROMPT = `You are an expert technology analyst specializing in EU research and innovation policy. Your task is to extract technology mentions from documents with a focus on:

1. **Technology Readiness Level (TRL) Assessment**
   Explicitly identify TRL levels (1-9) using these definitions:
   - TRL 1-3 (Research): "basic research", "concept", "proof of concept", "laboratory studies", "theoretical"
   - TRL 4-5 (Validation): "validation", "laboratory environment", "relevant environment", "component testing"
   - TRL 6 (Prototype): "prototype", "demonstration", "pilot system", "simulated environment"
   - TRL 7-8 (Proven): "operational environment", "system complete", "qualified", "proven in operational"
   - TRL 9 (Commercial): "commercial", "market ready", "deployed", "production", "operational system"

2. **EU Policy and Framework References**
   Identify mentions of these EU policies and frameworks:
   - Horizon Europe, Horizon 2020
   - EU AI Act, AI Regulation
   - IPCEI (Important Projects of Common European Interest)
   - EU Chips Act, European Chips Act
   - Data Act, Data Governance Act
   - GDPR, Digital Services Act (DSA)
   - Cyber Resilience Act (CRA)
   - CEI-SPHERE, EUCloudEdgeIoT
   - European Data Strategy
   - Digital Decade, Digital Compass
   - European Green Deal (tech context)
   - GAIA-X, European Cloud Initiative

3. **Position Weight (Headai-style)**
   Assess WHERE in the document the technology appears:
   - "title" = 4 (appears in document title or main heading)
   - "heading" = 3 (appears in section headings or subheadings)
   - "abstract" = 3 (appears in abstract, executive summary, or introduction)
   - "conclusion" = 2 (appears in conclusions or recommendations)
   - "body" = 1 (appears in regular body text)
   - "footnote" = 0.5 (appears in footnotes, references, or appendices)

4. **Relevance Score (Headai-style)**
   Assess HOW CENTRAL the technology is to the document topic:
   - 0.8-1.0 = CENTRAL: The technology is a main focus, discussed in depth, or is the primary subject
   - 0.5-0.7 = SIGNIFICANT: The technology is meaningfully discussed but not the main focus
   - 0.2-0.4 = MENTIONED: The technology is referenced in passing or as background
   - 0.1 = TANGENTIAL: Barely mentioned, possibly only in a list or reference

5. **Context Extraction**
   Capture the surrounding text (1-2 sentences) that provides evidence for the TRL assessment or policy connection.

Return a JSON array with your findings. Be thorough but only include technologies from the provided list.`;

// Parse extracted text for technology mentions
async function extractTechMentions(
  content: string,
  sourceUrl: string,
  keywords: TechKeyword[],
  apiKey: string,
  supabase: any
): Promise<number> {
  try {
    const keywordList = keywords.map(k => ({
      id: k.id,
      name: k.display_name,
      aliases: k.aliases || [],
    }));

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: EXTRACTION_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: `Analyze this document for mentions of these technologies:
${JSON.stringify(keywordList, null, 2)}

Document content:
${content.slice(0, 15000)}

For each technology mention found, extract:
- keyword_id: The exact ID from the list above
- context: The evidence text (1-2 sentences max, 200 chars)
- trl: The TRL level if identifiable (1-9), or null
- trl_evidence: Brief note on why you assigned this TRL (e.g., "mentions prototype testing")
- policy_reference: Any EU policy/framework mentioned in connection (e.g., "Horizon Europe", "EU AI Act"), or null
- position: Where in the document ("title", "heading", "abstract", "conclusion", "body", "footnote")
- relevance: How central is this technology to the document topic (0.1-1.0)
- confidence: Your confidence score (0.0-1.0)

Return ONLY a JSON array: [{"keyword_id": "uuid", "context": "...", "trl": 5, "trl_evidence": "...", "policy_reference": "Horizon Europe", "position": "heading", "relevance": 0.8, "confidence": 0.85}]`,
          },
        ],
        max_tokens: 6000,
      }),
    });

    if (!response.ok) {
      console.error('Tech extraction API error:', response.status);
      return 0;
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return 0;

    const mentions = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(mentions) || mentions.length === 0) return 0;

    console.log(`Extracted ${mentions.length} potential mentions, validating...`);

    // Map position strings to numeric weights (Headai-style)
    const positionWeightMap: Record<string, number> = {
      title: 4,
      heading: 3,
      abstract: 3,
      conclusion: 2,
      body: 1,
      footnote: 1, // Using integer, 0.5 rounds to 1
    };

    // Insert mentions into web_technology_mentions with Headai-style scoring
    const validMentions = mentions
      .filter((m: any) => m.keyword_id && keywords.some(k => k.id === m.keyword_id))
      .map((m: any) => ({
        keyword_id: m.keyword_id,
        source_url: sourceUrl,
        mention_context: m.context?.slice(0, 500),
        trl_mentioned: m.trl,
        policy_reference: m.policy_reference || null,
        position_weight: positionWeightMap[m.position] || 1,
        relevance_score: Math.min(1, Math.max(0.1, m.relevance || 0.5)),
        confidence_score: m.confidence || 0.7,
      }));

    console.log(`Valid mentions to insert: ${validMentions.length}`);
    if (validMentions.length > 0) {
      console.log(`TRL values: ${validMentions.map(m => m.trl_mentioned).join(', ')}`);
      console.log(`Policy refs: ${validMentions.filter(m => m.policy_reference).length}`);
      console.log(`Avg position weight: ${(validMentions.reduce((sum, m) => sum + m.position_weight, 0) / validMentions.length).toFixed(1)}`);
      console.log(`Avg relevance: ${(validMentions.reduce((sum, m) => sum + m.relevance_score, 0) / validMentions.length).toFixed(2)}`);
    }

    if (validMentions.length > 0) {
      const { error } = await supabase
        .from('web_technology_mentions')
        .insert(validMentions);

      if (error) {
        console.error('Error inserting mentions:', error);
        return 0;
      }
    }

    return validMentions.length;
  } catch (error) {
    console.error('Tech extraction error:', error);
    return 0;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfId } = await req.json();

    if (!pdfId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing pdfId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const zenodoToken = Deno.env.get('ZENODO_API_TOKEN');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the PDF queue item
    const { data: pdfItem, error: fetchError } = await supabase
      .from('pdf_processing_queue')
      .select('*')
      .eq('id', pdfId)
      .single();

    if (fetchError || !pdfItem) {
      return new Response(
        JSON.stringify({ success: false, error: 'PDF not found in queue' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pdf = pdfItem as PdfQueueRow;

    // Update status to processing
    await supabase
      .from('pdf_processing_queue')
      .update({ status: 'processing' })
      .eq('id', pdfId);

    let downloadUrl = pdf.url;

    // For Zenodo, resolve the direct download URL
    if (pdf.source_type === 'zenodo' && pdf.zenodo_record_id && zenodoToken) {
      const resolvedUrl = await getZenodoDownloadUrl(pdf.zenodo_record_id, zenodoToken);
      if (resolvedUrl) {
        downloadUrl = resolvedUrl;
        console.log('Resolved Zenodo URL:', resolvedUrl);
      }
    }

    // Download the PDF
    const downloadResult = await downloadPdfWithRetry(downloadUrl, 3, zenodoToken);

    if (!downloadResult) {
      await supabase
        .from('pdf_processing_queue')
        .update({
          status: 'failed',
          error_message: 'Download failed after retries',
          retry_count: pdf.retry_count + 1,
        })
        .eq('id', pdfId);

      return new Response(
        JSON.stringify({ success: false, error: 'Download failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check file size (20MB limit)
    if (downloadResult.size > 20 * 1024 * 1024) {
      await supabase
        .from('pdf_processing_queue')
        .update({
          status: 'skipped',
          error_message: 'File too large (>20MB)',
          file_size_bytes: downloadResult.size,
          filename: downloadResult.filename,
        })
        .eq('id', pdfId);

      return new Response(
        JSON.stringify({ success: false, error: 'File too large' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract text from PDF
    const extractedText = await extractPdfText(downloadResult.buffer, downloadResult.filename, lovableApiKey);

    if (!extractedText) {
      await supabase
        .from('pdf_processing_queue')
        .update({
          status: 'failed',
          error_message: 'Text extraction failed',
          file_size_bytes: downloadResult.size,
          filename: downloadResult.filename,
          retry_count: pdf.retry_count + 1,
        })
        .eq('id', pdfId);

      return new Response(
        JSON.stringify({ success: false, error: 'Text extraction failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch keywords for matching
    const { data: keywords } = await supabase
      .from('technology_keywords')
      .select('id, keyword, display_name, aliases')
      .eq('is_active', true);

    // Extract technology mentions
    const mentionsCount = await extractTechMentions(
      extractedText,
      pdf.url,
      keywords || [],
      lovableApiKey,
      supabase
    );

    // Update queue item as completed
    await supabase
      .from('pdf_processing_queue')
      .update({
        status: 'completed',
        file_size_bytes: downloadResult.size,
        filename: downloadResult.filename,
        mentions_extracted: mentionsCount,
        processed_at: new Date().toISOString(),
      })
      .eq('id', pdfId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        mentionsExtracted: mentionsCount,
        filename: downloadResult.filename,
        fileSize: downloadResult.size,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Process PDF error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
