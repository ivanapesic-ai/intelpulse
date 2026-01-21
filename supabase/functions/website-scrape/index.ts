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
}

// Target URLs for each website
const WEBSITE_CONFIGS = {
  ceisphere: {
    baseUrl: 'https://ceisphere.eu',
    paths: {
      publications: '/outputs-publications',
      news: '/news',
      projects: '/projects',
    }
  },
  eucloudedgeiot: {
    baseUrl: 'https://eucloudedgeiot.eu',
    paths: {
      publications: '/outputs-publications',
      news: '/news',
      projects: '/projects',
    }
  }
};

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
              formats: ['markdown'],
              onlyMainContent: true,
            }),
          });

          const scrapeData = await scrapeResponse.json();
          
          if (scrapeData.success && scrapeData.data?.markdown) {
            const pageContent: ScrapedPage = {
              url: pageUrl,
              title: scrapeData.data?.metadata?.title,
              markdown: scrapeData.data.markdown,
              scrapedAt: new Date().toISOString(),
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
              }, { onConflict: 'url' });

            // Extract technology mentions using AI
            if (lovableApiKey && pageContent.markdown) {
              const mentions = await extractTechMentions(
                pageContent.markdown,
                lovableApiKey,
                supabase
              );
              totalMentionsExtracted += mentions;
            }
          }
        } catch (pageError) {
          console.error(`Error scraping ${pageUrl}:`, pageError);
        }
      }
    }

    // Update scrape log
    if (scrapeLog?.id) {
      await supabase
        .from('website_scrape_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          pages_scraped: scrapedPages.length,
          mentions_extracted: totalMentionsExtracted,
        })
        .eq('id', scrapeLog.id);
    }

    console.log(`Scrape complete: ${scrapedPages.length} pages, ${totalMentionsExtracted} mentions`);

    return new Response(
      JSON.stringify({
        success: true,
        website,
        pagesScraped: scrapedPages.length,
        mentionsExtracted: totalMentionsExtracted,
        pages: scrapedPages.map(p => ({ url: p.url, title: p.title })),
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

async function extractTechMentions(
  markdown: string,
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

    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
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
          source_url: markdown.slice(0, 500), // Store partial content as reference
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
