import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// OpenAlex API - completely free, no API key needed
const OPENALEX_BASE = "https://api.openalex.org";
const POLITE_EMAIL = "intelligence@pulse11.com"; // polite pool for better rate limits

interface OpenAlexWork {
  id: string;
  title: string;
  publication_year: number;
  cited_by_count: number;
  doi: string | null;
  authorships: Array<{
    author: { display_name: string; id: string };
    institutions: Array<{ display_name: string; country_code: string; id: string }>;
  }>;
  primary_location?: {
    source?: { display_name: string };
  };
}

interface OpenAlexSearchResult {
  meta: { count: number; per_page: number };
  results: OpenAlexWork[];
  group_by?: Array<{ key: string; count: number }>;
}

async function fetchOpenAlex(path: string, params: Record<string, string> = {}): Promise<any> {
  params["mailto"] = POLITE_EMAIL;
  const url = new URL(`${OPENALEX_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`OpenAlex API error: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

// Build search filter for a keyword
function buildSearchFilter(keyword: string, displayName: string, aliases: string[] = []): string {
  const terms = [displayName, keyword.replace(/[_-]/g, " ")];
  for (const alias of aliases) {
    if (alias && !terms.includes(alias)) terms.push(alias);
  }
  // Use OpenAlex search with OR logic
  return terms.map(t => `"${t}"`).join(" OR ");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Optional: enrich only a specific keyword
    let targetKeywordId: string | null = null;
    try {
      const body = await req.json();
      targetKeywordId = body?.keywordId || null;
    } catch { /* no body */ }

    // Fetch keywords
    let query = supabase
      .from("technology_keywords")
      .select("id, keyword, display_name, aliases")
      .eq("is_active", true);

    if (targetKeywordId) {
      query = query.eq("id", targetKeywordId);
    }

    const { data: keywords, error: kwErr } = await query;
    if (kwErr) throw kwErr;

    const currentYear = new Date().getFullYear();
    const results = {
      enriched: 0,
      skipped: 0,
      totalWorks: 0,
      errors: [] as string[],
      details: [] as Array<{
        keyword: string;
        totalWorks: number;
        worksLast5y: number;
        citations: number;
        score: number;
        growthRate: number;
      }>,
    };

    for (const kw of keywords || []) {
      try {
        const searchQuery = buildSearchFilter(kw.keyword, kw.display_name, kw.aliases || []);
        console.log(`OpenAlex search: ${kw.display_name} → "${searchQuery.substring(0, 60)}..."`);

        // Use title_and_abstract.search for precision (not broad full-text search)
        // This ensures we count papers actually ABOUT the topic, not just mentioning it
        const searchFilter = `type:article|review|preprint,title_and_abstract.search:${searchQuery}`;
        
        // 1. Get total works count
        const totalResult: OpenAlexSearchResult = await fetchOpenAlex("/works", {
          filter: searchFilter,
          per_page: "1",
        });

        const totalWorks = totalResult.meta.count;

        // 2. Get works from last 5 years
        const fiveYearResult: OpenAlexSearchResult = await fetchOpenAlex("/works", {
          filter: `${searchFilter},from_publication_date:${currentYear - 5}-01-01`,
          per_page: "1",
        });
        const worksLast5y = fiveYearResult.meta.count;

        // 3. Get works from last 2 years
        const twoYearResult: OpenAlexSearchResult = await fetchOpenAlex("/works", {
          filter: `${searchFilter},from_publication_date:${currentYear - 2}-01-01`,
          per_page: "1",
        });
        const worksLast2y = twoYearResult.meta.count;

        // 4. Get year-by-year counts for growth rate (last 3 years)
        const yearCounts: Record<number, number> = {};
        for (let y = currentYear - 3; y <= currentYear - 1; y++) {
          const yearResult: OpenAlexSearchResult = await fetchOpenAlex("/works", {
            filter: `${searchFilter},from_publication_date:${y}-01-01,to_publication_date:${y}-12-31`,
            per_page: "1",
          });
          yearCounts[y] = yearResult.meta.count;
          await new Promise(r => setTimeout(r, 150)); // Rate limit
        }

        // Calculate YoY growth rate
        const prevYear = yearCounts[currentYear - 2] || 0;
        const lastYear = yearCounts[currentYear - 1] || 0;
        const growthRate = prevYear > 0 ? ((lastYear - prevYear) / prevYear) * 100 : 0;

        // 5. Get top papers (most cited recent works)
        const topPapersResult: OpenAlexSearchResult = await fetchOpenAlex("/works", {
          search: searchQuery,
          filter: `type:article|review|preprint,from_publication_date:${currentYear - 3}-01-01`,
          sort: "cited_by_count:desc",
          per_page: "5",
        });

        const topPapers = topPapersResult.results.map(w => ({
          id: w.id,
          title: w.title,
          year: w.publication_year,
          citations: w.cited_by_count,
          doi: w.doi,
          source: w.primary_location?.source?.display_name || null,
          authors: w.authorships.slice(0, 3).map(a => a.author.display_name),
        }));

        // Total citations from top papers
        const citationCount = topPapersResult.results.reduce((sum, w) => sum + (w.cited_by_count || 0), 0);

        // 6. Get top institutions
        const institutionMap: Record<string, { name: string; country: string; count: number }> = {};
        for (const paper of topPapersResult.results) {
          for (const authorship of paper.authorships) {
            for (const inst of authorship.institutions) {
              if (!institutionMap[inst.id]) {
                institutionMap[inst.id] = { name: inst.display_name, country: inst.country_code, count: 0 };
              }
              institutionMap[inst.id].count++;
            }
          }
        }
        const topInstitutions = Object.values(institutionMap)
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // 7. Build co-author network from top papers
        const coAuthorEdges: Record<string, { from: string; to: string; weight: number }> = {};
        for (const paper of topPapersResult.results) {
          const authors = paper.authorships.slice(0, 5).map(a => a.author.display_name);
          for (let i = 0; i < authors.length; i++) {
            for (let j = i + 1; j < authors.length; j++) {
              const key = [authors[i], authors[j]].sort().join("|||");
              if (!coAuthorEdges[key]) {
                coAuthorEdges[key] = { from: authors[i], to: authors[j], weight: 0 };
              }
              coAuthorEdges[key].weight++;
            }
          }
        }
        const coAuthorNetwork = {
          nodes: [...new Set(topPapersResult.results.flatMap(p => p.authorships.slice(0, 5).map(a => a.author.display_name)))],
          edges: Object.values(coAuthorEdges).slice(0, 30),
        };

        // Calculate h-index approximation (from top papers)
        const sortedCitations = topPapersResult.results
          .map(w => w.cited_by_count)
          .sort((a, b) => b - a);
        let hIndex = 0;
        for (let i = 0; i < sortedCitations.length; i++) {
          if (sortedCitations[i] >= i + 1) hIndex = i + 1;
        }

        // Score: 0 = limited (<100 works), 1 = moderate (100-1000), 2 = strong (>1000 recent works)
        const researchScore = worksLast5y >= 1000 ? 2 : worksLast5y >= 100 ? 1 : 0;

        // Upsert research signal
        const { error: upsertErr } = await supabase
          .from("research_signals")
          .upsert({
            keyword_id: kw.id,
            snapshot_date: new Date().toISOString().split("T")[0],
            total_works: totalWorks,
            works_last_5y: worksLast5y,
            works_last_2y: worksLast2y,
            citation_count: citationCount,
            h_index: hIndex,
            growth_rate_yoy: Math.round(growthRate * 100) / 100,
            top_institutions: topInstitutions,
            top_papers: topPapers,
            co_author_network: coAuthorNetwork,
            research_score: researchScore,
          }, { onConflict: "keyword_id,snapshot_date" });

        if (upsertErr) {
          console.error(`Failed to upsert research signal for ${kw.display_name}:`, upsertErr);
          results.errors.push(`${kw.display_name}: ${upsertErr.message}`);
          continue;
        }

        // Update technologies table
        await supabase
          .from("technologies")
          .update({
            research_score: researchScore,
            total_research_works: worksLast5y,
            research_growth_rate: Math.round(growthRate * 100) / 100,
            research_citations: citationCount,
            last_updated: new Date().toISOString(),
          })
          .eq("keyword_id", kw.id);

        results.enriched++;
        results.totalWorks += totalWorks;
        results.details.push({
          keyword: kw.display_name,
          totalWorks,
          worksLast5y,
          citations: citationCount,
          score: researchScore,
          growthRate: Math.round(growthRate * 100) / 100,
        });

        console.log(`✓ ${kw.display_name}: ${totalWorks} total, ${worksLast5y} recent, score=${researchScore}, growth=${growthRate.toFixed(1)}%`);

        // Rate limiting for OpenAlex polite pool
        await new Promise(r => setTimeout(r, 200));

      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error(`Error for ${kw.display_name}:`, msg);
        results.errors.push(`${kw.display_name}: ${msg}`);
        results.skipped++;
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Research signals error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
