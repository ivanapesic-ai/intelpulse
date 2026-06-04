// Backfill historical keyword_signal_snapshots by replaying news, companies, and EU
// projects on a monthly cadence. Funding/patents are approximated from cumulative state.
// POST body: { keyword_ids?: string[], months_back?: number }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const body = await req.json().catch(() => ({}));
  const monthsBack: number = Math.min(body.months_back ?? 48, 120);
  const requestedIds: string[] | undefined = body.keyword_ids;

  // Load keywords
  let q = supabase.from("technology_keywords").select("id, keyword, display_name").eq("is_active", true);
  if (requestedIds?.length) q = q.in("id", requestedIds);
  const { data: keywords, error: kerr } = await q;
  if (kerr) {
    return new Response(JSON.stringify({ error: kerr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const summary = {
    keywords_processed: 0,
    months_per_keyword: monthsBack,
    rows_upserted: 0,
    errors: [] as string[],
  };

  const run = async () => {
    const now = new Date();
    const months: Date[] = [];
    for (let i = monthsBack; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      months.push(d);
    }

    for (const kw of keywords ?? []) {
      summary.keywords_processed++;

      // Pull source data once per keyword
      const [newsRes, mapRes, cordisRes] = await Promise.all([
        supabase
          .from("news_keyword_matches")
          .select("news_id, news_items!inner(published_at)")
          .eq("keyword_id", kw.id)
          .gte("news_items.published_at", months[0].toISOString())
          .limit(10000),
        supabase
          .from("crunchbase_keyword_mapping")
          .select("company_id")
          .eq("keyword_id", kw.id)
          .limit(2000),
        supabase
          .from("cordis_eu_projects")
          .select("start_date, eu_contribution_eur")
          .eq("keyword_id", kw.id)
          .gte("start_date", months[0].toISOString().slice(0, 10))
          .limit(2000),
      ]);

      // Companies → fetch founded/last funding date and totals
      const companyIds = ((mapRes.data as any[]) || []).map((r) => r.company_id).filter(Boolean);
      let companies: any[] = [];
      if (companyIds.length) {
        const batches: string[][] = [];
        for (let i = 0; i < companyIds.length; i += 200) batches.push(companyIds.slice(i, i + 200));
        const results = await Promise.all(
          batches.map((b) =>
            supabase
              .from("crunchbase_companies")
              .select("founded_date, last_funding_date, total_funding_usd, number_of_employees, patents_count")
              .in("id", b),
          ),
        );
        companies = results.flatMap((r) => (r.data as any[]) || []);
      }

      const rows: any[] = [];
      for (const monthStart of months) {
        const monthEnd = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0, 23, 59, 59));
        const monthEndIso = monthEnd.toISOString();

        // News mentions in this month
        const newsCount = ((newsRes.data as any[]) || []).filter((r) => {
          const d = r.news_items?.published_at;
          return d && d >= monthStart.toISOString() && d <= monthEndIso;
        }).length;

        // Cumulative: companies founded ≤ monthEnd
        let companyCount = 0;
        let fundingUsd = 0;
        let employees = 0;
        let patents = 0;
        const monthEndDate = monthEndIso.slice(0, 10);
        for (const c of companies) {
          if (c.founded_date && c.founded_date <= monthEndDate) {
            companyCount++;
            // Approximate employees as static current value (best we have)
            const emp = parseEmployees(c.number_of_employees);
            employees += emp;
            patents += Number(c.patents_count) || 0;
            // Only book funding once cumulative funding date has passed
            if (c.last_funding_date && c.last_funding_date <= monthEndDate) {
              fundingUsd += Number(c.total_funding_usd) || 0;
            }
          }
        }

        // EU project funding (cumulative)
        const cordisCount = ((cordisRes.data as any[]) || []).filter(
          (r) => r.start_date && r.start_date <= monthEndDate,
        ).length;

        // Scoring (rough heuristic on a 0–100 scale per dimension)
        const investmentScore = Math.min(100, Math.round(Math.log10(Math.max(1, fundingUsd / 1e6)) * 25));
        const patentsScore = Math.min(100, Math.round(Math.log10(Math.max(1, patents)) * 30));
        const visibilityScore = Math.min(100, Math.round(Math.log10(Math.max(1, newsCount * 3 + cordisCount)) * 25));
        const compositeScore = Math.round(
          (investmentScore * 0.4 + patentsScore * 0.3 + visibilityScore * 0.3) * 10,
        ) / 10;

        rows.push({
          keyword_id: kw.id,
          snapshot_date: monthEndDate,
          company_count: companyCount,
          total_funding_usd: Math.round(fundingUsd),
          total_patents: patents,
          total_employees: employees,
          news_mention_count: newsCount,
          composite_score: compositeScore,
          investment_score: investmentScore,
          patents_score: patentsScore,
          visibility_score: visibilityScore,
        });
      }

      // Upsert in chunks
      for (let i = 0; i < rows.length; i += 100) {
        const chunk = rows.slice(i, i + 100);
        const { error } = await supabase
          .from("keyword_signal_snapshots")
          .upsert(chunk, { onConflict: "keyword_id,snapshot_date" });
        if (error) summary.errors.push(`${kw.keyword}: ${error.message}`);
        else summary.rows_upserted += chunk.length;
      }
    }

    console.log("Snapshot backfill complete", summary);
  };

  // @ts-ignore EdgeRuntime
  if (typeof EdgeRuntime !== "undefined") {
    // @ts-ignore
    EdgeRuntime.waitUntil(run());
    return new Response(
      JSON.stringify({ started: true, keywords: keywords?.length ?? 0, months_back: monthsBack }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  await run();
  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

function parseEmployees(raw: string | null | undefined): number {
  if (!raw) return 0;
  // e.g. "11-50", "1001-5000", "10000+"
  const m = String(raw).match(/(\d[\d,]*)/g);
  if (!m) return 0;
  const nums = m.map((s) => Number(s.replace(/,/g, "")));
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}
