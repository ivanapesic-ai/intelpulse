import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// H11 Algorithm: Position weight scoring based on document structure
const POSITION_WEIGHTS = {
  title: 3.0,
  executive_summary: 2.5,
  abstract: 2.5,
  introduction: 2.0,
  conclusion: 2.0,
  heading: 1.8,
  body: 1.0,
  footnote: 0.5,
  reference: 0.3,
};

// CEI Sector classification keywords
const SECTOR_PATTERNS = {
  mobility: [
    "mobility", "transport", "vehicle", "automotive", "logistics", "fleet",
    "MaaS", "traffic", "autonomous", "SDV", "software-defined vehicle",
    "EV", "electric vehicle", "charging", "rail", "maritime", "aviation"
  ],
  energy: [
    "energy", "grid", "power", "renewable", "solar", "wind", "battery",
    "smart grid", "electricity", "decarbonization", "green deal",
    "sustainability", "carbon", "emissions", "hydrogen"
  ],
  manufacturing: [
    "manufacturing", "factory", "industrial", "production", "automation",
    "Industry 4.0", "OT", "operational technology", "supply chain",
    "predictive maintenance", "digital twin", "MES", "robotics"
  ],
};

// Expanded EU Policy references for CEI domain
const EU_POLICIES = [
  "Horizon Europe", "Horizon 2020", "EU AI Act", "Data Act", "GDPR",
  "Digital Services Act", "Digital Markets Act", "IPCEI", "EU Chips Act",
  "Cyber Resilience Act", "European Data Strategy", "Digital Decade",
  "CEI-Sphere", "EUCloudEdgeIoT", "O-CEI", "COP-PILOT",
  "Competitiveness Compass", "Draghi report", "AI Factories Initiative",
  "Data Union Strategy", "Digital Networks Act", "Green Deal",
  "Sustainable and Smart Mobility Strategy", "EuroHPC", "ENISA",
  "NIS2", "eIDAS", "Gaia-X", "SIMPL", "European Cloud Federation"
];

// H11: Detect document section for position weighting
function detectSection(context: string, pageNumber: number | null): string {
  const lowerContext = context.toLowerCase();
  
  if (pageNumber === 1 || lowerContext.includes("executive summary")) {
    return "executive_summary";
  }
  if (lowerContext.includes("abstract") || lowerContext.includes("overview")) {
    return "abstract";
  }
  if (lowerContext.includes("introduction") || lowerContext.includes("background")) {
    return "introduction";
  }
  if (lowerContext.includes("conclusion") || lowerContext.includes("summary") || 
      lowerContext.includes("key takeaway")) {
    return "conclusion";
  }
  if (context.match(/^#+\s/) || context.match(/^[A-Z][A-Z\s]+:/)) {
    return "heading";
  }
  if (lowerContext.includes("reference") || lowerContext.includes("bibliography")) {
    return "reference";
  }
  
  return "body";
}

// H11: Calculate position weight score
function getPositionWeight(section: string): number {
  return POSITION_WEIGHTS[section as keyof typeof POSITION_WEIGHTS] || 1.0;
}

// Detect sectors from content
function detectSectors(content: string): string[] {
  const lowerContent = content.toLowerCase();
  const sectors: string[] = [];
  
  for (const [sector, patterns] of Object.entries(SECTOR_PATTERNS)) {
    const matchCount = patterns.filter(p => lowerContent.includes(p.toLowerCase())).length;
    if (matchCount >= 2) {
      sectors.push(sector);
    }
  }
  
  return sectors.length > 0 ? sectors : ["general"];
}

// Extract market signals (funding, adoption rates, etc.)
function extractMarketSignals(content: string): {
  fundingMentions: string[];
  adoptionRates: string[];
  marketSize: string[];
} {
  const fundingPattern = /(?:EUR|€|\$|USD)\s*[\d,.]+\s*(?:billion|million|B|M)/gi;
  const adoptionPattern = /(\d+(?:\.\d+)?%)\s*(?:of|adoption|usage|have adopted|intend)/gi;
  const marketSizePattern = /market\s+(?:size|value|worth|estimated at)\s*(?:of\s*)?(?:EUR|€|\$|USD)?\s*[\d,.]+\s*(?:billion|million)?/gi;
  
  return {
    fundingMentions: content.match(fundingPattern) || [],
    adoptionRates: content.match(adoptionPattern) || [],
    marketSize: content.match(marketSizePattern) || [],
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { documentId, content } = await req.json();

    if (!documentId) {
      throw new Error("documentId is required");
    }

    // Fetch document record to get storage path
    const { data: document, error: docError } = await supabase
      .from("cei_documents")
      .select("storage_path, file_type, filename")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message || "Unknown error"}`);
    }

    // Update document status to parsing
    await supabase
      .from("cei_documents")
      .update({ parse_status: "parsing" })
      .eq("id", documentId);

    // If content wasn't provided, extract it from storage using AI
    let documentContent = content;
    
    if (!documentContent || documentContent.trim().length < 100) {
      console.log(`Extracting content from storage: ${document.storage_path}`);
      
      // Download file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("cei-documents")
        .download(document.storage_path);
      
      if (downloadError || !fileData) {
        throw new Error(`Failed to download document: ${downloadError?.message || "No data"}`);
      }
      
      // Convert to base64 for Gemini
      const arrayBuffer = await fileData.arrayBuffer();
      const base64Content = encodeBase64(arrayBuffer);
      
      // Determine MIME type
      const mimeTypes: Record<string, string> = {
        pdf: "application/pdf",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      };
      const mimeType = mimeTypes[document.file_type] || "application/pdf";
      
      console.log(`Extracting text from ${document.file_type} (${(arrayBuffer.byteLength / 1024).toFixed(1)} KB)...`);
      
      // Use Gemini to extract text from the document
      const extractResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Extract ALL readable text content from this ${document.file_type.toUpperCase()} document titled "${document.filename}".

Focus on capturing:
1. All headings and section titles
2. Body text paragraphs
3. Table contents (format as text)
4. Figure captions and labels
5. Key statistics, percentages, and numbers
6. Any technology names, TRL levels, or policy references

Return the complete extracted text in a structured format, preserving the document's logical flow. Include [HEADING], [TABLE], [FIGURE] markers where appropriate.`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64Content}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 16000,
        }),
      });
      
      if (!extractResponse.ok) {
        const errorText = await extractResponse.text();
        console.error("Text extraction error:", extractResponse.status, errorText);
        throw new Error(`Failed to extract document text: ${extractResponse.status}`);
      }
      
      const extractData = await extractResponse.json();
      documentContent = extractData.choices?.[0]?.message?.content || "";
      
      console.log(`Extracted ${documentContent.length} characters from document`);
      
      if (!documentContent || documentContent.length < 100) {
        throw new Error("Failed to extract meaningful content from document");
      }
    }

    // Pre-analyze document for H11 enrichment (now using actual content)
    const detectedSectors = detectSectors(documentContent);
    const marketSignals = extractMarketSignals(documentContent);
    
    console.log("H11 Pre-analysis:", { 
      sectors: detectedSectors, 
      fundingMentions: marketSignals.fundingMentions.length,
      adoptionRates: marketSignals.adoptionRates.length 
    });

    // Get all active keywords for matching
    const { data: keywords, error: keywordsError } = await supabase
      .from("technology_keywords")
      .select("id, keyword, display_name, aliases")
      .eq("is_active", true);

    if (keywordsError) {
      throw new Error(`Failed to fetch keywords: ${keywordsError.message}`);
    }

    const keywordList = keywords?.map(k => ({
      id: k.id,
      terms: [k.keyword, k.display_name, ...(k.aliases || [])],
    })) || [];

    // Build H11-enhanced prompt for AI extraction
    const systemPrompt = `You are an expert at extracting technology intelligence from CEI-Sphere (Cloud-Edge-IoT) documents in the European context.

## H11 EXTRACTION ALGORITHM

Apply precise scoring using the H11 methodology:

### 1. TECHNOLOGY DETECTION
Identify technologies from the provided keyword list. For each match:
- Extract the specific context where the technology appears
- Note if it appears in title, executive summary, introduction, body, or conclusions
- Higher weight for mentions in titles/summaries (position_weight: title=3.0, summary=2.5, body=1.0)

### 2. TRL ASSESSMENT (Technology Readiness Level)
CRITICAL: Extract TRL with evidence. Look for:
- Explicit: "TRL 6", "TRL 7-9", "technology readiness level 5"
- Implicit indicators:
  * TRL 1-3: "basic research", "concept", "experimental proof", "laboratory"
  * TRL 4-5: "lab validation", "relevant environment", "prototype development"
  * TRL 6: "pilot", "demonstration", "prototype in operational environment"
  * TRL 7-8: "system prototype", "actual system proven", "pre-commercial"
  * TRL 9: "commercial deployment", "market ready", "production", "widely adopted"
- Market context: "X% adoption rate" suggests TRL 8-9

### 3. EU POLICY ALIGNMENT
Detect references to EU policies and initiatives:
${EU_POLICIES.map(p => `- ${p}`).join('\n')}

### 4. SECTOR CLASSIFICATION
Tag each mention with relevant sectors:
- MOBILITY: transport, vehicles, logistics, MaaS, SDV, EV charging
- ENERGY: grids, renewables, smart energy, sustainability
- MANUFACTURING: Industry 4.0, factories, OT, automation, supply chain

### 5. MARKET SIGNALS (Challenge-Opportunity Matrix)
Extract quantitative signals:
- Funding/investment amounts (e.g., "EUR 46.4 billion")
- Adoption rates (e.g., "53.8% have adopted")
- Market size indicators
- Key players mentioned

TRL Level Mapping (if not explicitly stated, infer from context):
- TRL 1-3: Basic research, concept, experimental proof
- TRL 4-5: Lab validation, relevant environment validation
- TRL 6: Prototype demonstration, pilot testing
- TRL 7-8: System prototype, actual system proven
- TRL 9: Commercial deployment, market ready

For each technology mention, provide:
- keyword_id: The ID of the matched keyword
- mention_context: A brief quote showing how the technology is mentioned (max 300 chars, include surrounding context)
- trl_mentioned: The TRL level if mentioned or inferable (1-9), or null if completely unknown
- policy_reference: Related EU policy/regulation (be specific), or null
- confidence_score: Match confidence (0.0-1.0) - higher for explicit matches with context
- position_weight: Document position (title=3.0, executive_summary=2.5, introduction=2.0, body=1.0, reference=0.3)
- sector_tags: Array of sectors ["mobility", "energy", "manufacturing"]
- market_signal: Any quantitative market data near this mention (funding, adoption %, etc.)
- page_number: The page number if available, or null

Respond with a JSON object in this exact format:
{
  "mentions": [
    {
      "keyword_id": "uuid-here",
      "mention_context": "quote with surrounding context showing technology relevance",
      "trl_mentioned": 7,
      "policy_reference": "Horizon Europe",
      "confidence_score": 0.95,
      "position_weight": 2.5,
      "sector_tags": ["mobility", "energy"],
      "market_signal": "EUR 46.4 billion investment",
      "page_number": 1,
      "relevance_score": 0.85
    }
  ],
  "document_analysis": {
    "summary": "Brief summary of document's technology focus",
    "primary_sectors": ["mobility"],
    "key_policies": ["Horizon Europe", "Digital Decade"],
    "market_signals": {
      "total_funding_mentioned": "EUR 46.4 billion",
      "adoption_rates": ["53.8% IoT adoption"],
      "key_players": ["ABB", "Siemens", "AWS"]
    },
    "trl_distribution": {
      "emerging": 3,
      "developing": 5,
      "mature": 2
    }
  }
}`;

    const userPrompt = `## DOCUMENT PRE-ANALYSIS (H11 Algorithm)

Detected sectors: ${detectedSectors.join(", ")}
Funding mentions found: ${marketSignals.fundingMentions.slice(0, 5).join(", ") || "none"}
Adoption rates found: ${marketSignals.adoptionRates.slice(0, 5).join(", ") || "none"}

## TECHNOLOGY KEYWORDS TO MATCH
${JSON.stringify(keywordList, null, 2)}

## DOCUMENT CONTENT
Analyze this document and extract technology mentions with H11 precision scoring:

${documentContent}`;

    // Call Lovable AI for extraction
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error("Rate limit exceeded, please try again later");
      }
      if (aiResponse.status === 402) {
        throw new Error("Payment required, please add credits to Lovable AI");
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const responseContent = aiData.choices?.[0]?.message?.content;

    if (!responseContent) {
      throw new Error("No response from AI");
    }

    // Parse AI response
    let extractedData: { mentions: Array<{
      keyword_id: string;
      mention_context: string;
      trl_mentioned: number | null;
      policy_reference: string | null;
      confidence_score: number;
      position_weight?: number;
      sector_tags?: string[];
      market_signal?: string;
      relevance_score?: number;
      page_number: number | null;
    }>; document_analysis?: {
      summary: string;
      primary_sectors?: string[];
      key_policies?: string[];
      market_signals?: {
        total_funding_mentioned?: string;
        adoption_rates?: string[];
        key_players?: string[];
      };
      trl_distribution?: {
        emerging?: number;
        developing?: number;
        mature?: number;
      };
    }; summary?: string };

    try {
      extractedData = JSON.parse(responseContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseContent);
      throw new Error("Failed to parse AI extraction results");
    }

    // Insert technology mentions
    const mentions = extractedData.mentions || [];
    let mentionsCreated = 0;

    for (const mention of mentions) {
      // Validate keyword_id exists
      const validKeyword = keywords?.find(k => k.id === mention.keyword_id);
      if (!validKeyword) {
        console.warn(`Invalid keyword_id: ${mention.keyword_id}`);
        continue;
      }

      // H11: Calculate composite relevance score
      const positionWeight = mention.position_weight || 1.0;
      const baseConfidence = Math.min(1, Math.max(0, mention.confidence_score || 0.5));
      const relevanceScore = mention.relevance_score || (baseConfidence * positionWeight);
      
      // Normalize to 0-1 range
      const normalizedRelevance = Math.min(1, relevanceScore / 3.0);

      const { error: mentionError } = await supabase
        .from("document_technology_mentions")
        .insert({
          document_id: documentId,
          keyword_id: mention.keyword_id,
          mention_context: mention.mention_context?.slice(0, 500) || null,
          trl_mentioned: mention.trl_mentioned || null,
          policy_reference: mention.policy_reference || null,
          confidence_score: baseConfidence,
          position_weight: positionWeight,
          relevance_score: normalizedRelevance,
          page_number: mention.page_number || null,
        });

      if (mentionError) {
        console.error("Error inserting mention:", mentionError);
      } else {
        mentionsCreated++;
      }
    }

    // Build enriched parsed content with H11 analysis
    const docAnalysis = extractedData.document_analysis || { summary: extractedData.summary || "" };
    
    // Update document with parsed content and status
    await supabase
      .from("cei_documents")
      .update({
        parse_status: "completed",
        parsed_content: {
          summary: docAnalysis.summary || extractedData.summary,
          mentions_count: mentionsCreated,
          extracted_at: new Date().toISOString(),
          h11_analysis: {
            sectors: docAnalysis.primary_sectors || detectedSectors,
            key_policies: docAnalysis.key_policies || [],
            market_signals: docAnalysis.market_signals || marketSignals,
            trl_distribution: docAnalysis.trl_distribution || null,
          },
        },
      })
      .eq("id", documentId);

    // Update technology document_mention_count for affected keywords
    const affectedKeywordIds = [...new Set(mentions.map(m => m.keyword_id).filter(Boolean))];
    
    for (const keywordId of affectedKeywordIds) {
      const { count } = await supabase
        .from("document_technology_mentions")
        .select("*", { count: "exact", head: true })
        .eq("keyword_id", keywordId);

      await supabase
        .from("technologies")
        .update({ document_mention_count: count || 0 })
        .eq("keyword_id", keywordId);
      
      // Trigger C-O score aggregation for this keyword
      try {
        await supabase.rpc("aggregate_document_insights", { 
          tech_keyword_id: keywordId 
        });
      } catch (aggError) {
        console.warn(`Failed to aggregate insights for ${keywordId}:`, aggError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        mentionsCreated,
        summary: docAnalysis.summary || extractedData.summary,
        h11_analysis: {
          sectors: docAnalysis.primary_sectors || detectedSectors,
          policies_detected: docAnalysis.key_policies?.length || 0,
          market_signals: Object.keys(docAnalysis.market_signals || {}).length,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Document parsing error:", error);

    // Try to update document status to failed
    try {
      const { documentId } = await req.json().catch(() => ({}));
      if (documentId) {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
          const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
          await supabase
            .from("cei_documents")
            .update({ parse_status: "failed" })
            .eq("id", documentId);
        }
      }
    } catch {
      // Ignore cleanup errors
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
