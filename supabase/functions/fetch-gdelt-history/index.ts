// Backfill historical news mentions from GDELT Doc 2.0 (free, ~2017+ archive).
// POST body: { keyword_ids?: string[], years_back?: number, month_step?: number, max_per_window?: number }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GDELT_URL = "https://api.gdeltproject.org/api/v2/doc/doc";

interface GdeltArticle {
  url: string;
  url_mobile?: string;
  title: string;
  seendate: string; // YYYYMMDDTHHMMSSZ
  socialimage?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
}

function fmtDate(d: Date): string {
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
}

function parseSeenDate(s: string): string | null {
  // 20240315T123000Z -> ISO
  if (!s || s.length < 15) return null;
  const iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}Z`;
  const t = Date.parse(iso);
  return isNaN(t) ? null : new Date(t).toISOString();
}

function buildQuery(keyword: string, displayName: string, aliases: string[] | null): string {
  const terms = new Set<string>();
  const add = (s: string) => {
    const t = s?.trim();
    if (t && t.length > 2) terms.add(t);
  };
  add(displayName);
  add(keyword.replace(/_/g, " "));
  (aliases || []).forEach(add);
  const quoted = [...terms].slice(0, 5).map((t) => (t.includes(" ") ? `"${t}"` : t));
  return quoted.join(" OR ");
}

async function fetchWindow(query: string, start: Date, end: Date, max: number): Promise<GdeltArticle[]> {
  const params = new URLSearchParams({
    query,
    mode: "ArtList",
    format: "json",
    startdatetime: fmtDate(start),
    enddatetime: fmtDate(end),
    maxrecords: String(max),
    sort: "DateDesc",
  });
  const res = await fetch(`${GDELT_URL}?${params.toString()}`);
  if (!res.ok) return [];
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    return Array.isArray(json?.articles) ? json.articles : [];
  } catch {
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const body = await req.json().catch(() => ({}));
  const yearsBack: number = Math.min(body.years_back ?? 5, 8);
  const monthStep: number = Math.max(body.month_step ?? 3, 1); // window size in months
  const maxPerWindow: number = Math.min(body.max_per_window ?? 250, 250);
  const requestedIds: string[] | undefined = body.keyword_ids;

  // Load keywords
  let q = supabase.from("technology_keywords").select("id, keyword, display_name, aliases").eq("is_active", true);
  if (requestedIds?.length) q = q.in("id", requestedIds);
  const { data: keywords, error: kerr } = await q;
  if (kerr) return new Response(JSON.stringify({ error: kerr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const summary = {
    keywords_processed: 0,
    windows_fetched: 0,
    articles_seen: 0,
    articles_inserted: 0,
    matches_created: 0,
    errors: [] as string[],
  };

  // Run in background; respond fast.
  const run = async () => {
    const now = new Date();
    const earliest = new Date(now);
    earliest.setUTCFullYear(now.getUTCFullYear() - yearsBack);

    for (const kw of keywords ?? []) {
      summary.keywords_processed++;
      const query = buildQuery(kw.keyword, kw.display_name, kw.aliases as any);
      if (!query) continue;

      // walk windows newest -> oldest
      let end = new Date(now);
      while (end > earliest) {
        const start = new Date(end);
        start.setUTCMonth(start.getUTCMonth() - monthStep);
        if (start < earliest) start.setTime(earliest.getTime());

        try {
          const articles = await fetchWindow(query, start, end, maxPerWindow);
          summary.windows_fetched++;
          summary.articles_seen += articles.length;

          if (articles.length) {
            const rows = articles
              .map((a) => ({
                title: (a.title || "").slice(0, 1000),
                url: a.url,
                description: null,
                source_feed: "gdelt",
                source_name: a.domain || null,
                image_url: a.socialimage || null,
                published_at: parseSeenDate(a.seendate),
              }))
              .filter((r) => r.title && r.url);

            // Upsert news_items by url (manual: select existing, insert missing)
            const urls = rows.map((r) => r.url);
            const { data: existing } = await supabase
              .from("news_items")
              .select("id, url")
              .in("url", urls);
            const existingMap = new Map((existing ?? []).map((r: any) => [r.url, r.id]));

            const toInsert = rows.filter((r) => !existingMap.has(r.url));
            if (toInsert.length) {
              const { data: inserted, error: ierr } = await supabase
                .from("news_items")
                .insert(toInsert)
                .select("id, url");
              if (ierr) {
                summary.errors.push(`${kw.keyword} insert: ${ierr.message}`);
              } else {
                summary.articles_inserted += inserted?.length ?? 0;
                inserted?.forEach((r: any) => existingMap.set(r.url, r.id));
              }
            }

            // Create matches
            const matchRows = rows
              .map((r) => existingMap.get(r.url))
              .filter(Boolean)
              .map((news_id) => ({
                news_id,
                keyword_id: kw.id,
                match_confidence: 0.9,
                match_source: "gdelt_history",
              }));

            if (matchRows.length) {
              // Avoid duplicate matches
              const newsIds = matchRows.map((m) => m.news_id);
              const { data: existingMatches } = await supabase
                .from("news_keyword_matches")
                .select("news_id")
                .eq("keyword_id", kw.id)
                .in("news_id", newsIds);
              const have = new Set((existingMatches ?? []).map((m: any) => m.news_id));
              const newMatches = matchRows.filter((m) => !have.has(m.news_id));
              if (newMatches.length) {
                const { error: merr } = await supabase.from("news_keyword_matches").insert(newMatches);
                if (merr) summary.errors.push(`${kw.keyword} match: ${merr.message}`);
                else summary.matches_created += newMatches.length;
              }
            }
          }
        } catch (e) {
          summary.errors.push(`${kw.keyword} ${start.toISOString().slice(0,10)}: ${(e as Error).message}`);
        }

        // GDELT rate limit ~1 req/sec
        await new Promise((r) => setTimeout(r, 1100));

        end = start;
      }
    }

    console.log("GDELT backfill complete", summary);
  };

  // @ts-ignore EdgeRuntime
  if (typeof EdgeRuntime !== "undefined") {
    // @ts-ignore
    EdgeRuntime.waitUntil(run());
    return new Response(
      JSON.stringify({ started: true, keywords: keywords?.length ?? 0, years_back: yearsBack, month_step: monthStep }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  await run();
  return new Response(JSON.stringify(summary), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
