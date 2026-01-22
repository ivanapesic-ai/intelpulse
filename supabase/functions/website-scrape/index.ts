import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeRequest {
  website: 'ceisphere' | 'eucloudedgeiot';
  scrapeType: 'publications' | 'news' | 'projects' | 'all';
}

interface ScrapedPage {
  url: string;
  title?: string;
  markdown?: string;
  scrapedAt: string;
  pdfLinks?: string[];
}

// Target URLs for each website
const WEBSITE_CONFIGS = {
  ceisphere: {
    baseUrl: 'https://ceisphere.eu',
    paths: {
      publications: '/publications',
      news: '/news',
      projects: '/market-insights',
    }
  },
  eucloudedgeiot: {
    baseUrl: 'https://eucloudedgeiot.eu',
    paths: {
      publications: '/papers',
      news: '/news',
      projects: '/projects',
    }
  }
};

// Patterns to detect PDF links
const PDF_PATTERNS = [
  /https?:\/\/zenodo\.org\/records?\/\d+\/files\/[^"'\s<>]+\.pdf/gi,
  /https?:\/\/[^"'\s<>]+\.pdf(?:\?[^"'\s<>]*)?/gi,
  /https?:\/\/zenodo\.org\/api\/records\/\d+\/files-archive/gi,
];

// Extract PDF links from content
function extractPdfLinks(markdown: string, html?: string): string[] {
  const content = markdown + (html || '');
  const links = new Set<string>();
  
  for (const pattern of PDF_PATTERNS) {
    const matches = content.matchAll(new RegExp(pattern));
    for (const match of matches) {
      // Clean up the URL
      let url = match[0].replace(/['"<>].*$/, '');
      if (url.endsWith('.pdf') || url.includes('zenodo.org')) {
        links.add(url);
      }
    }
  }
  
  // Also look for Zenodo record pages (not direct PDF links)
  const zenodoRecordPattern = /https?:\/\/zenodo\.org\/records?\/(\d+)/gi;
  const zenodoMatches = content.matchAll(zenodoRecordPattern);
  for (const match of zenodoMatches) {
    // Add the record URL for later processing
    links.add(match[0]);
  }
  
  return [...links];
}

// Download PDF from URL
async function downloadPdf(url: string): Promise<{ buffer: ArrayBuffer; filename: string } | null> {
  try {
    console.log(`Attempting to download PDF from: ${url}`);
    
    // Handle Zenodo record pages - fetch the record and find the PDF
    if (url.includes('zenodo.org/record') && !url.includes('/files/')) {
      const recordMatch = url.match(/zenodo\.org\/records?\/(\d+)/);
      if (recordMatch) {
        const recordId = recordMatch[1];
        // Fetch record metadata to get file links
        const metaResponse = await fetch(`https://zenodo.org/api/records/${recordId}`, {
          headers: { 'Accept': 'application/json' },
        });
        
        if (metaResponse.ok) {
          const metadata = await metaResponse.json();
          const pdfFile = metadata.files?.find((f: any) => f.key?.endsWith('.pdf'));
          if (pdfFile) {
            url = pdfFile.links?.self || `https://zenodo.org/records/${recordId}/files/${pdfFile.key}`;
            console.log(`Resolved Zenodo record to PDF: ${url}`);
          } else {
            console.log(`No PDF found in Zenodo record ${recordId}`);
            return null;
          }
        }
      }
    }
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/pdf,*/*' },
      redirect: 'follow',
    });
    
    if (!response.ok) {
      console.error(`Failed to download PDF: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('pdf') && !url.endsWith('.pdf')) {
      console.log(`Skipping non-PDF content type: ${contentType}`);
      return null;
    }
    
    const buffer = await response.arrayBuffer();
    
    // Skip if too large (> 20MB)
    if (buffer.byteLength > 20 * 1024 * 1024) {
      console.log(`Skipping PDF larger than 20MB: ${buffer.byteLength} bytes`);
      return null;
    }
    
    // Extract filename from URL or use timestamp
    let filename = url.split('/').pop()?.split('?')[0] || `document-${Date.now()}.pdf`;
    if (!filename.endsWith('.pdf')) {
      filename += '.pdf';
    }
    
    console.log(`Successfully downloaded PDF: ${filename} (${buffer.byteLength} bytes)`);
    return { buffer, filename };
  } catch (error) {
    console.error(`Error downloading PDF from ${url}:`, error);
    return null;
  }
}

// Extract text from PDF using Lovable AI (Gemini multimodal)
async function extractPdfText(
  pdfBuffer: ArrayBuffer,
  filename: string,
  apiKey: string
): Promise<string | null> {
  try {
    console.log(`Extracting text from PDF: ${filename}`);
    
    // Convert to base64
    const uint8Array = new Uint8Array(pdfBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    
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
                type: 'file',
                file: {
                  filename: filename,
                  file_data: `data:application/pdf;base64,${base64}`,
                },
              },
              {
                type: 'text',
                text: 'Extract and return all text content from this PDF document. Preserve the document structure with headers, paragraphs, and any lists. Focus on the main content.',
              },
            ],
          },
        ],
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI API error: ${response.status} - ${errorText}`);
      return null;
    }
    
    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content;
    
    if (extractedText) {
      console.log(`Extracted ${extractedText.length} characters from PDF`);
    }
    
    return extractedText || null;
  } catch (error) {
    console.error(`Error extracting PDF text:`, error);
    return null;
  }
}

// Parse document content for technology mentions (reused from parse-document)
async function parseDocumentContent(
  documentId: string,
  content: string,
  supabase: any,
  apiKey: string
): Promise<number> {
  try {
    // Fetch active keywords
    const { data: keywords } = await supabase
      .from('technology_keywords')
      .select('id, keyword, display_name, aliases')
      .eq('is_active', true);

    if (!keywords?.length) {
      console.log('No active keywords found for parsing');
      return 0;
    }

    const keywordList = keywords.map((k: any) => 
      `${k.display_name}${k.aliases?.length ? ` (also: ${k.aliases.join(', ')})` : ''}`
    ).join('\n- ');

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
            content: `You are an expert at extracting technology references from documents. Analyze the document content and identify mentions of these technologies:
- ${keywordList}

For each mention found, extract:
1. The exact technology name (must match one from the list above)
2. A brief context quote (max 200 chars) showing how it's mentioned
3. TRL level if mentioned (1-9), otherwise null
4. Confidence score (0.0-1.0) based on how clearly it's referenced
5. Any policy references or EU initiative mentions

Return JSON array of mentions. Only include genuine, substantive mentions, not passing references.`
          },
          {
            role: 'user',
            content: `Extract technology mentions from this document:\n\n${content.slice(0, 15000)}`
          }
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) return 0;

    const aiResult = await response.json();
    const aiContent = aiResult.choices?.[0]?.message?.content;
    if (!aiContent) return 0;

    const parsed = JSON.parse(aiContent);
    const mentions = parsed.mentions || parsed.technologies || parsed.results || [];

    let mentionsCreated = 0;
    for (const mention of mentions) {
      const matchedKeyword = keywords.find(
        (k: any) => 
          k.display_name.toLowerCase() === mention.keyword?.toLowerCase() ||
          k.display_name.toLowerCase() === mention.technology?.toLowerCase() ||
          k.keyword.toLowerCase() === mention.keyword?.toLowerCase()
      );

      if (matchedKeyword) {
        await supabase.from('document_technology_mentions').insert({
          document_id: documentId,
          keyword_id: matchedKeyword.id,
          mention_context: mention.context?.slice(0, 500),
          trl_mentioned: mention.trl_mentioned || mention.trl,
          confidence_score: mention.confidence || mention.confidence_score || 0.7,
          policy_reference: mention.policy_reference,
        });
        mentionsCreated++;
      }
    }

    // Update document status
    await supabase
      .from('cei_documents')
      .update({
        parse_status: 'completed',
        parsed_content: { 
          summary: `Extracted ${mentionsCreated} technology mentions`,
          processedAt: new Date().toISOString()
        },
      })
      .eq('id', documentId);

    return mentionsCreated;
  } catch (error) {
    console.error('Error parsing document content:', error);
    return 0;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

  if (!firecrawlKey) {
    return new Response(
      JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { website, scrapeType }: ScrapeRequest = await req.json();

    if (!website || !WEBSITE_CONFIGS[website]) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid website. Use "ceisphere" or "eucloudedgeiot"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = WEBSITE_CONFIGS[website];
    const pathsToScrape = scrapeType === 'all' 
      ? Object.values(config.paths) 
      : [config.paths[scrapeType]];

    console.log(`Starting scrape for ${website}: ${pathsToScrape.join(', ')}`);

    // Create a scrape log entry
    const { data: scrapeLog, error: logError } = await supabase
      .from('website_scrape_logs')
      .insert({
        website,
        scrape_type: scrapeType,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to create scrape log:', logError);
    }

    const scrapedPages: ScrapedPage[] = [];
    let totalMentionsExtracted = 0;
    let totalPdfsProcessed = 0;

    for (const path of pathsToScrape) {
      const fullUrl = `${config.baseUrl}${path}`;
      console.log(`Scraping: ${fullUrl}`);

      // First, map the page to find all links
      const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: fullUrl,
          limit: 50,
          includeSubdomains: false,
        }),
      });

      const mapData = await mapResponse.json();
      const links = mapData.links || [fullUrl];
      console.log(`Found ${links.length} links on ${path}`);

      // Scrape each page
      for (const pageUrl of links.slice(0, 20)) { // Limit to 20 pages per section
        try {
          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: pageUrl,
              formats: ['markdown', 'html', 'links'],
              onlyMainContent: true,
            }),
          });

          const scrapeData = await scrapeResponse.json();
          
          if (scrapeData.success && scrapeData.data?.markdown) {
            // Extract PDF links from the page content
            const pdfLinks = extractPdfLinks(
              scrapeData.data.markdown, 
              scrapeData.data.html
            );
            
            const pageContent: ScrapedPage = {
              url: pageUrl,
              title: scrapeData.data?.metadata?.title,
              markdown: scrapeData.data.markdown,
              scrapedAt: new Date().toISOString(),
              pdfLinks,
            };
            scrapedPages.push(pageContent);

            // Store in database
            await supabase
              .from('scraped_web_content')
              .upsert({
                url: pageUrl,
                website,
                page_type: scrapeType === 'all' ? 'mixed' : scrapeType,
                title: pageContent.title,
                markdown_content: pageContent.markdown,
                scraped_at: pageContent.scrapedAt,
                pdf_links: pdfLinks,
              }, { onConflict: 'url' });

            // Extract technology mentions from web content
            if (lovableApiKey && pageContent.markdown) {
              const mentions = await extractTechMentions(
                pageContent.markdown,
                pageUrl,
                lovableApiKey,
                supabase
              );
              totalMentionsExtracted += mentions;
            }

            // Queue PDF links for later processing (instead of inline processing)
            if (pdfLinks.length > 0) {
              console.log(`Found ${pdfLinks.length} PDF links on ${pageUrl}, queueing for processing`);
              
              // Get the source page ID for linking
              const { data: sourcePage } = await supabase
                .from('scraped_web_content')
                .select('id')
                .eq('url', pageUrl)
                .maybeSingle();

              for (const pdfUrl of pdfLinks) {
                try {
                  // Determine source type and extract Zenodo record ID if applicable
                  const isZenodo = pdfUrl.includes('zenodo.org');
                  const zenodoRecordMatch = pdfUrl.match(/zenodo\.org\/records?\/(\d+)/);
                  const zenodoRecordId = zenodoRecordMatch ? zenodoRecordMatch[1] : null;

                  // Queue the PDF for processing (upsert to avoid duplicates)
                  await supabase
                    .from('pdf_processing_queue')
                    .upsert({
                      url: pdfUrl,
                      source_page_id: sourcePage?.id || null,
                      source_type: isZenodo ? 'zenodo' : 'direct',
                      zenodo_record_id: zenodoRecordId,
                      status: 'pending',
                    }, { onConflict: 'url', ignoreDuplicates: true });

                  totalPdfsProcessed++; // Count as queued
                } catch (queueError) {
                  console.error(`Error queueing PDF ${pdfUrl}:`, queueError);
                }
              }

              // Update scraped content with PDF count found
              await supabase
                .from('scraped_web_content')
                .update({ pdfs_processed: pdfLinks.length })
                .eq('url', pageUrl);
            }
          }
        } catch (pageError) {
          console.error(`Error scraping ${pageUrl}:`, pageError);
        }
      }
    }

    // Aggregate news mentions per technology keyword
    await aggregateNewsToTechnologies(supabase, scrapedPages);

    // Update scrape log
    if (scrapeLog?.id) {
      await supabase
        .from('website_scrape_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          pages_scraped: scrapedPages.length,
          mentions_extracted: totalMentionsExtracted,
          pdfs_processed: totalPdfsProcessed,
        })
        .eq('id', scrapeLog.id);
    }

    console.log(`Scrape complete: ${scrapedPages.length} pages, ${totalPdfsProcessed} PDFs, ${totalMentionsExtracted} mentions`);

    return new Response(
      JSON.stringify({
        success: true,
        website,
        pagesScraped: scrapedPages.length,
        pdfsProcessed: totalPdfsProcessed,
        mentionsExtracted: totalMentionsExtracted,
        pages: scrapedPages.map(p => ({ 
          url: p.url, 
          title: p.title,
          pdfLinks: p.pdfLinks?.length || 0
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Scrape error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Scrape failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Aggregate news from scraped pages to technologies table
async function aggregateNewsToTechnologies(supabase: any, scrapedPages: ScrapedPage[]): Promise<void> {
  try {
    // Get all technology keywords with their web mentions
    const { data: keywords } = await supabase
      .from('technology_keywords')
      .select('id, display_name')
      .eq('is_active', true);

    if (!keywords?.length) return;

    for (const keyword of keywords) {
      // Count web mentions for this keyword
      const { count: mentionCount } = await supabase
        .from('web_technology_mentions')
        .select('*', { count: 'exact', head: true })
        .eq('keyword_id', keyword.id);

      // Get recent news items (pages that mention this technology)
      const { data: mentions } = await supabase
        .from('web_technology_mentions')
        .select('source_url, mention_context, created_at')
        .eq('keyword_id', keyword.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Build recent news array from scraped pages
      const recentNews = [];
      for (const mention of mentions || []) {
        const matchingPage = scrapedPages.find(p => p.url === mention.source_url);
        recentNews.push({
          title: matchingPage?.title || mention.source_url.split('/').pop() || 'Article',
          url: mention.source_url,
          date: mention.created_at,
          source: mention.source_url.includes('ceisphere') ? 'CEI-Sphere' : 
                  mention.source_url.includes('eucloudedgeiot') ? 'EUCloudEdgeIoT' : 'Web',
        });
      }

      // Update the technology with news data
      await supabase
        .from('technologies')
        .update({
          news_mention_count: mentionCount || 0,
          recent_news: recentNews,
        })
        .eq('keyword_id', keyword.id);
    }

    console.log(`Aggregated news for ${keywords.length} technologies`);
  } catch (error) {
    console.error('Error aggregating news to technologies:', error);
  }
}

// Extract technology mentions from web content (simplified version)
async function extractTechMentions(
  markdown: string,
  sourceUrl: string,
  apiKey: string,
  supabase: any
): Promise<number> {
  try {
    // Fetch active keywords
    const { data: keywords } = await supabase
      .from('technology_keywords')
      .select('id, keyword, display_name')
      .eq('is_active', true);

    if (!keywords?.length) return 0;

    const keywordList = keywords.map((k: any) => k.display_name).join(', ');

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
            content: `You are a technology analyst. Extract mentions of these technologies from web content: ${keywordList}. 
            
Return a JSON array of objects with:
- keyword: the technology name (must match one from the list)
- context: a brief quote showing how it's mentioned (max 200 chars)
- trl_mentioned: TRL level if mentioned (1-9), or null
- confidence: confidence score 0.0-1.0

Only include actual mentions, not speculation. Return empty array if no matches.`
          },
          {
            role: 'user',
            content: `Extract technology mentions from this content:\n\n${markdown.slice(0, 8000)}`
          }
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) return 0;

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;
    if (!content) return 0;

    const parsed = JSON.parse(content);
    const mentions = parsed.mentions || parsed.technologies || [];

    // Store mentions in database
    for (const mention of mentions) {
      const matchedKeyword = keywords.find(
        (k: any) => k.display_name.toLowerCase() === mention.keyword?.toLowerCase()
      );
      
      if (matchedKeyword) {
        await supabase.from('web_technology_mentions').insert({
          keyword_id: matchedKeyword.id,
          source_url: sourceUrl,
          mention_context: mention.context,
          trl_mentioned: mention.trl_mentioned,
          confidence_score: mention.confidence || 0.7,
        });
      }
    }

    return mentions.length;
  } catch (error) {
    console.error('AI extraction error:', error);
    return 0;
  }
}
