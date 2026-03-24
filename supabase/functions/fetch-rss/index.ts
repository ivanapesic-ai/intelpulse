import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RSSItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  enclosure?: { url: string };
}

interface FeedSource {
  id: string;
  name: string;
  url: string;
}

// Simple XML parser for RSS feeds
function parseRSSXML(xmlText: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];
    
    const titleMatch = /<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i.exec(itemXml);
    const linkMatch = /<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i.exec(itemXml);
    const descMatch = /<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i.exec(itemXml);
    const pubDateMatch = /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i.exec(itemXml);
    const enclosureMatch = /<enclosure[^>]*url=["']([^"']+)["'][^>]*>/i.exec(itemXml);
    const mediaMatch = /<media:content[^>]*url=["']([^"']+)["'][^>]*>/i.exec(itemXml);

    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1].trim().replace(/<!\[CDATA\[|\]\]>/g, ''),
        link: linkMatch[1].trim().replace(/<!\[CDATA\[|\]\]>/g, ''),
        description: descMatch ? descMatch[1].trim().replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').substring(0, 500) : undefined,
        pubDate: pubDateMatch ? pubDateMatch[1].trim() : undefined,
        enclosure: enclosureMatch ? { url: enclosureMatch[1] } : mediaMatch ? { url: mediaMatch[1] } : undefined,
      });
    }
  }

  return items;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get active RSS feed sources
    const { data: feeds, error: feedsError } = await supabase
      .from("rss_feed_sources")
      .select("id, name, url")
      .eq("is_active", true);

    if (feedsError) throw feedsError;

    // Get active technology keywords for matching
    const { data: keywords, error: keywordsError } = await supabase
      .from("technology_keywords")
      .select("id, keyword, display_name, aliases")
      .eq("is_active", true);

    if (keywordsError) throw keywordsError;

    // Get company names for mention matching (only names with 4+ chars to avoid false positives)
    const { data: companies, error: companiesError } = await supabase
      .from("crunchbase_companies")
      .select("id, organization_name");

    if (companiesError) {
      console.error("Failed to load companies for mention matching:", companiesError);
    }

    // Build efficient lookup: pre-compile regexes for company names
    const companyMatchers = (companies || [])
      .filter((c: { organization_name: string }) => c.organization_name && c.organization_name.length >= 4)
      .map((c: { id: string; organization_name: string }) => ({
        id: c.id,
        name: c.organization_name,
        regex: new RegExp(`\\b${c.organization_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
      }));

    const results = {
      feedsProcessed: 0,
      itemsFetched: 0,
      itemsInserted: 0,
      matchesCreated: 0,
      companyMentions: 0,
      errors: [] as string[],
    };

    for (const feed of feeds as FeedSource[]) {
      try {
        console.log(`Fetching feed: ${feed.name} (${feed.url})`);
        
        const response = await fetch(feed.url, {
          headers: { "User-Agent": "Pulse11-RSS-Fetcher/1.0" },
        });

        if (!response.ok) {
          results.errors.push(`${feed.name}: HTTP ${response.status}`);
          continue;
        }

        const xmlText = await response.text();
        const items = parseRSSXML(xmlText);
        results.itemsFetched += items.length;

        for (const item of items.slice(0, 20)) { // Limit to 20 items per feed
          // Insert news item (ignore duplicates via ON CONFLICT)
          const { data: newsItem, error: insertError } = await supabase
            .from("news_items")
            .upsert({
              title: item.title,
              description: item.description,
              url: item.link,
              source_feed: feed.url,
              source_name: feed.name,
              published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
              image_url: item.enclosure?.url,
            }, { onConflict: "url" })
            .select("id")
            .single();

          if (insertError) {
            if (!insertError.message.includes("duplicate")) {
              console.error(`Insert error: ${insertError.message}`);
            }
            continue;
          }

          results.itemsInserted++;

          // Match against technology keywords (word-boundary aware)
          const titleLower = item.title.toLowerCase();
          const descLower = (item.description || "").toLowerCase();
          const combinedText = `${titleLower} ${descLower}`;

          for (const kw of keywords!) {
            const searchTerms = [
              kw.keyword.toLowerCase().replace(/[_-]/g, ' '),
              kw.display_name.toLowerCase(),
              ...(kw.aliases || []).map((a: string) => a.toLowerCase()),
            ];

            // Word-boundary matching: term must appear as a whole word/phrase
            const matched = searchTerms.some(term => {
              // Short terms (≤4 chars like "sdv", "adas") need word boundaries
              // Longer terms can use includes since they're specific enough
              if (term.length <= 4) {
                const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                return regex.test(combinedText);
              }
              // Also try hyphenated/spaced variants
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

        // Update last_fetched_at
        await supabase
          .from("rss_feed_sources")
          .update({ last_fetched_at: new Date().toISOString() })
          .eq("id", feed.id);

        results.feedsProcessed++;
      } catch (feedError) {
        results.errors.push(`${feed.name}: ${feedError instanceof Error ? feedError.message : "Unknown error"}`);
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("RSS fetch error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
