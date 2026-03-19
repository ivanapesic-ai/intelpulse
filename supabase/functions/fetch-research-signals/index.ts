import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENALEX_BASE = "https://api.openalex.org";
const POLITE_EMAIL = "intelligence@pulse11.com";

// OpenAlex domain IDs (highest level of topic hierarchy)
// Domain 1 = Physical Sciences (includes Engineering, CS, Math, Physics)
// We restrict to this domain to exclude Health Sciences, Life Sciences, Social Sciences
const DOMAIN_FILTER = "topics.domain.id:1";

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
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "").trim();
}

// Build search query from keyword + aliases (no domain context needed — handled by topics filter)
function buildSearchQuery(keyword: string, displayName: string, aliases: string[] = []): string {
  const terms = new Set<string>();
  terms.add(displayName);
  const cleaned = keyword.replace(/[_-]/g, " ");
  if (cleaned !== displayName) terms.add(cleaned);
  for (const alias of aliases) {
    if (alias) terms.add(alias);
  }
  return [...terms].map(t => `"${t}"`).join(" OR ");
}

// Build filter string (type + domain + optional date range)
function buildFilter(dateFilter?: string): string {
  const parts = [`type:article|review|preprint`, DOMAIN_FILTER];
  if (dateFilter) parts.push(dateFilter);
  return parts.join(",");
}

async function fetchOpenAlex(
  path: string,
  params: Record<string, string> = {}
): Promise<any> {
  params["mailto"] = POLITE_EMAIL;
  const url = new URL(`${OPENALEX_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`OpenAlex API error: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let targetKeywordId: string | null = null;
    try {
      const body = await req.json();
      targetKeywordId = body?.keywordId || null;
    } catch { /* no body */ }

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
        const searchQuery = buildSearchQuery(kw.keyword, kw.display_name, kw.aliases || []);
        console.log(`OpenAlex search: ${kw.display_name} → ${searchQuery.substring(0, 80)}`);

        // 1. Total works count
        const totalResult: OpenAlexSearchResult = await fetchOpenAlex("/works", {
          search: searchQuery,
          filter: buildFilter(),
          per_page: "1",
        });
        const totalWorks = totalResult.meta.count;

        // 2. Works last 5 years
        const fiveYearResult: OpenAlexSearchResult = await fetchOpenAlex("/works", {
          search: searchQuery,
          filter: buildFilter(`from_publication_date:${currentYear - 5}-01-01`),
          per_page: "1",
        });
        const worksLast5y = fiveYearResult.meta.count;

        // 3. Works last 2 years
        const twoYearResult: OpenAlexSearchResult = await fetchOpenAlex("/works", {
          search: searchQuery,
          filter: buildFilter(`from_publication_date:${currentYear - 2}-01-01`),
          per_page: "1",
        });
        const worksLast2y = twoYearResult.meta.count;

        // 4. Year-by-year counts for growth rate (last 3 years)
        const yearCounts: Record<number, number> = {};
        for (let y = currentYear - 3; y <= currentYear - 1; y++) {
          const yearResult: OpenAlexSearchResult = await fetchOpenAlex("/works", {
            search: searchQuery,
            filter: buildFilter(`from_publication_date:${y}-01-01,to_publication_date:${y}-12-31`),
            per_page: "1",
          });
          yearCounts[y] = yearResult.meta.count;
          await new Promise(r => setTimeout(r, 150));
        }

        const prevYear = yearCounts[currentYear - 2] || 0;
        const lastYear = yearCounts[currentYear - 1] || 0;
        const growthRate = prevYear > 0 ? ((lastYear - prevYear) / prevYear) * 100 : 0;

        // 5. Top papers — last 12 months, sorted by recency
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
        const recentDateStr = twelveMonthsAgo.toISOString().split("T")[0];

        const topPapersResult: OpenAlexSearchResult = await fetchOpenAlex("/works", {
          search: searchQuery,
          filter: buildFilter(`from_publication_date:${recentDateStr}`),
          sort: "publication_date:desc",
          per_page: "5",
        });

        const topPapers = topPapersResult.results.map(w => ({
          id: w.id,
          title: stripHtml(w.title),
          year: w.publication_year,
          citations: w.cited_by_count,
          doi: w.doi,
          source: w.primary_location?.source?.display_name || null,
          authors: w.authorships.slice(0, 3).map(a => a.author.display_name),
        }));

        const citationCount = topPapersResult.results.reduce(
          (sum, w) => sum + (w.cited_by_count || 0), 0
        );

        // 6. Top institutions from top papers
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

        // 7. Co-author network
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
          nodes: [...new Set(topPapersResult.results.flatMap(
            p => p.authorships.slice(0, 5).map(a => a.author.display_name)
          ))],
          edges: Object.values(coAuthorEdges).slice(0, 30),
        };

        // H-index approximation
        const sortedCitations = topPapersResult.results
          .map(w => w.cited_by_count)
          .sort((a, b) => b - a);
        let hIndex = 0;
        for (let i = 0; i < sortedCitations.length; i++) {
          if (sortedCitations[i] >= i + 1) hIndex = i + 1;
        }

        // Score: 0=emerging, 1=moderate, 2=strong
        const researchScore = worksLast5y >= 5000 ? 2 : worksLast5y >= 500 ? 1 : 0;

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
          console.error(`Upsert failed for ${kw.display_name}:`, upsertErr);
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
