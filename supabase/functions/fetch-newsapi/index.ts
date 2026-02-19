import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// SDV-targeted search queries
const SDV_QUERIES = [
  '"autonomous driving" OR "self-driving" OR "autonomous vehicle"',
  '"electric vehicle" OR "EV battery" OR "battery technology"',
  '"connected car" OR "V2X" OR "vehicle-to-everything"',
  '"ADAS" OR "advanced driver assistance"',
  '"automotive software" OR "software-defined vehicle"',
  '"lidar" OR "sensor fusion" OR "computer vision" AND automotive',
  '"automotive cybersecurity" OR "vehicle security"',
  '"HD mapping" OR "high-definition map" AND automotive',
  '"automotive ethernet" OR "in-vehicle network"',
  '"bidirectional charging" OR "vehicle-to-grid"',
];

interface NewsAPIArticle {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: { id: string | null; name: string };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("NEWS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "NEWS_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body for optional overrides
    let customQuery: string | null = null;
    let maxPages = 2; // 2 pages × up to 5 queries = ~200 articles max
    try {
      const body = await req.json();
      customQuery = body?.query || null;
      maxPages = body?.maxPages || 2;
    } catch {
      // No body, use defaults
    }

    // Get active technology keywords for matching
    const { data: keywords, error: keywordsError } = await supabase
      .from("technology_keywords")
      .select("id, keyword, display_name, aliases")
      .eq("is_active", true);

    if (keywordsError) throw keywordsError;

    const results = {
      queriesRun: 0,
      articlesFetched: 0,
      articlesInserted: 0,
      matchesCreated: 0,
      errors: [] as string[],
    };

    const queries = customQuery ? [customQuery] : SDV_QUERIES;

    for (const query of queries) {
      for (let page = 1; page <= maxPages; page++) {
        try {
          const params = new URLSearchParams({
            q: query,
            language: "en",
            sortBy: "publishedAt",
            pageSize: "50",
            page: String(page),
          });

          console.log(`NewsAPI query: ${query} (page ${page})`);

          const response = await fetch(
            `https://newsapi.org/v2/everything?${params}`,
            { headers: { "X-Api-Key": apiKey } }
          );

          if (!response.ok) {
            const errBody = await response.text();
            results.errors.push(`Query "${query.substring(0, 40)}..." page ${page}: HTTP ${response.status} - ${errBody}`);
            break; // Skip remaining pages for this query
          }

          const data = await response.json();
          const articles: NewsAPIArticle[] = data.articles || [];
          results.articlesFetched += articles.length;
          results.queriesRun++;

          if (articles.length === 0) break; // No more results

          for (const article of articles) {
            if (!article.title || article.title === "[Removed]") continue;

            const { data: newsItem, error: insertError } = await supabase
              .from("news_items")
              .upsert({
                title: article.title,
                description: article.description?.substring(0, 500) || null,
                url: article.url,
                source_feed: "newsapi",
                source_name: article.source?.name || "NewsAPI",
                published_at: article.publishedAt,
                image_url: article.urlToImage,
              }, { onConflict: "url" })
              .select("id")
              .single();

            if (insertError) {
              if (!insertError.message.includes("duplicate")) {
                console.error(`Insert error: ${insertError.message}`);
              }
              continue;
            }

            results.articlesInserted++;

            // Match against technology keywords (word-boundary aware)
            const titleLower = article.title.toLowerCase();
            const descLower = (article.description || "").toLowerCase();
            const combinedText = `${titleLower} ${descLower}`;

            for (const kw of keywords!) {
              const searchTerms = [
                kw.keyword.toLowerCase().replace(/[_-]/g, ' '),
                kw.display_name.toLowerCase(),
                ...(kw.aliases || []).map((a: string) => a.toLowerCase()),
              ];

              const matched = searchTerms.some(term => {
                if (term.length <= 4) {
                  const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                  return regex.test(combinedText);
                }
                const variants = [term, term.replace(/\s+/g, '-'), term.replace(/-/g, ' ')];
                return variants.some(v => combinedText.includes(v));
              });

              if (matched) {
                const titleMatched = searchTerms.some(t => titleLower.includes(t));
                const confidence = titleMatched ? 1.0 : 0.7;

                const { error: matchError } = await supabase
                  .from("news_keyword_matches")
                  .upsert({
                    news_id: newsItem.id,
                    keyword_id: kw.id,
                    match_confidence: confidence,
                    match_source: titleLower.includes(searchTerms[0]) ? "title_match" : "description_match",
                  }, { onConflict: "news_id,keyword_id" });

                if (!matchError) results.matchesCreated++;
              }
            }
          }
        } catch (fetchError) {
          results.errors.push(`Query "${query.substring(0, 40)}...": ${fetchError instanceof Error ? fetchError.message : "Unknown error"}`);
        }
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("NewsAPI fetch error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
