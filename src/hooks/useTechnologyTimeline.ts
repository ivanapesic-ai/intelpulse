import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TimelinePoint {
  year: number;
  news: number;          // news mentions that year
  companies: number;     // companies founded that year
  fundingUsd: number;    // sum of last_funding_usd booked that year
  cordis: number;        // EU projects started that year
  papers: number;        // top research papers that year (proxy)
  github: number;        // OSS repos created that year
}

const startYear = 2015;

export function useTechnologyTimeline(keywordId?: string) {
  return useQuery({
    queryKey: ["technology-timeline", keywordId],
    enabled: !!keywordId,
    queryFn: async (): Promise<TimelinePoint[]> => {
      if (!keywordId) return [];
      const cutoff = `${startYear}-01-01`;
      const thisYear = new Date().getFullYear();

      // Init year buckets
      const map = new Map<number, TimelinePoint>();
      for (let y = startYear; y <= thisYear; y++) {
        map.set(y, { year: y, news: 0, companies: 0, fundingUsd: 0, cordis: 0, papers: 0, github: 0 });
      }
      const bump = (y: number, field: keyof TimelinePoint, by = 1) => {
        if (y < startYear || y > thisYear) return;
        const p = map.get(y);
        if (!p) return;
        (p as any)[field] += by;
      };

      const [
        newsRes,
        mappingRes,
        cordisRes,
        researchRes,
        githubRes,
      ] = await Promise.all([
        // News mentions per year
        supabase
          .from("news_keyword_matches")
          .select("news_id, news_items!inner(published_at)")
          .eq("keyword_id", keywordId)
          .gte("news_items.published_at", cutoff)
          .limit(5000),
        // Companies linked to keyword
        supabase
          .from("crunchbase_keyword_mapping")
          .select("company_id")
          .eq("keyword_id", keywordId)
          .limit(2000),
        // CORDIS projects per year
        supabase
          .from("cordis_eu_projects")
          .select("start_date")
          .eq("keyword_id", keywordId)
          .gte("start_date", cutoff)
          .limit(2000),
        // Research top papers (years are inside JSON)
        supabase
          .from("research_signals")
          .select("top_papers")
          .eq("keyword_id", keywordId)
          .order("snapshot_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
        // GitHub OSS repos
        supabase
          .from("github_oss_activity")
          .select("created_at_gh")
          .eq("keyword_id", keywordId)
          .gte("created_at_gh", cutoff)
          .limit(1000),
      ]);

      // News
      for (const row of (newsRes.data as any[]) || []) {
        const d = row.news_items?.published_at;
        if (!d) continue;
        bump(new Date(d).getFullYear(), "news");
      }

      // Companies — fetch founded_date + last_funding_date + total_funding
      const ids = ((mappingRes.data as any[]) || []).map((m) => m.company_id).filter(Boolean) as string[];
      if (ids.length) {
        const batches: string[][] = [];
        for (let i = 0; i < ids.length; i += 200) batches.push(ids.slice(i, i + 200));
        const companyRows = (await Promise.all(
          batches.map((b) =>
            supabase
              .from("crunchbase_companies")
              .select("founded_date, last_funding_date, total_funding_usd, funding_rounds_count")
              .in("id", b),
          ),
        )).flatMap((r) => (r.data as any[]) || []);

        for (const c of companyRows) {
          if (c.founded_date) bump(new Date(c.founded_date).getFullYear(), "companies");
          if (c.last_funding_date && c.total_funding_usd) {
            const y = new Date(c.last_funding_date).getFullYear();
            // Distribute total across rounds count if available, else book full to last_funding year
            const rounds = Math.max(1, Number(c.funding_rounds_count) || 1);
            bump(y, "fundingUsd", Number(c.total_funding_usd) / rounds);
          }
        }
      }

      // CORDIS
      for (const row of (cordisRes.data as any[]) || []) {
        if (row.start_date) bump(new Date(row.start_date).getFullYear(), "cordis");
      }

      // Papers
      const papers = (researchRes.data?.top_papers as any[]) || [];
      for (const p of papers) {
        if (typeof p?.year === "number") bump(p.year, "papers");
      }

      // GitHub
      for (const row of (githubRes.data as any[]) || []) {
        if (row.created_at_gh) bump(new Date(row.created_at_gh).getFullYear(), "github");
      }

      return Array.from(map.values()).sort((a, b) => a.year - b.year);
    },
  });
}
