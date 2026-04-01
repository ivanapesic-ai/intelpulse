// src/hooks/useCordisProjects.ts
// Hook for fetching CORDIS EU R&D project data per technology keyword

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CordisProject {
  id: string;
  cordis_id: string;
  acronym: string | null;
  title: string;
  total_cost_eur: number | null;
  eu_contribution_eur: number | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  framework_programme: string | null;
  call_identifier: string | null;
  keyword_id: string;
  keyword: string;
  cordis_url: string | null;
  fetched_at: string;
}

export interface CordisKeywordSummary {
  keyword_id: string;
  keyword: string;
  display_name: string;
  project_count: number;
  total_project_cost_eur: number;
  total_eu_funding_eur: number;
  active_projects: number;
  completed_projects: number;
  programme_count: number;
  earliest_project: string | null;
  latest_project: string | null;
  last_fetched: string | null;
}

/**
 * Fetch CORDIS projects for a specific keyword
 */
export function useCordisProjects(keywordId: string | null) {
  return useQuery({
    queryKey: ["cordis-projects", keywordId],
    queryFn: async () => {
      if (!keywordId) return [];
      const { data, error } = await supabase
        .from("cordis_eu_projects")
        .select("*")
        .eq("keyword_id", keywordId)
        .order("total_cost_eur", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data || []) as CordisProject[];
    },
    enabled: !!keywordId,
  });
}

/**
 * Fetch aggregated CORDIS summary per keyword (from the view)
 */
export function useCordisKeywordSummary() {
  return useQuery({
    queryKey: ["cordis-keyword-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cordis_keyword_summary")
        .select("*")
        .order("total_eu_funding_eur", {
          ascending: false,
          nullsFirst: false,
        });
      if (error) throw error;
      return (data || []) as CordisKeywordSummary[];
    },
  });
}

/**
 * Fetch top CORDIS projects across all keywords (for dashboard widget)
 */
export function useTopCordisProjects(limit = 10) {
  return useQuery({
    queryKey: ["cordis-top-projects", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cordis_eu_projects")
        .select("*")
        .not("total_cost_eur", "is", null)
        .order("total_cost_eur", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as CordisProject[];
    },
  });
}

/**
 * Fetch CORDIS projects grouped by framework programme
 */
export function useCordisFrameworkBreakdown() {
  return useQuery({
    queryKey: ["cordis-framework-breakdown"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cordis_eu_projects")
        .select("framework_programme, total_cost_eur, eu_contribution_eur, status");
      if (error) throw error;

      const frameworks = new Map<
        string,
        {
          name: string;
          count: number;
          total_cost: number;
          eu_funding: number;
          active: number;
          closed: number;
        }
      >();

      for (const row of data || []) {
        const fw = row.framework_programme || "Unknown";
        const existing = frameworks.get(fw) || {
          name: fw,
          count: 0,
          total_cost: 0,
          eu_funding: 0,
          active: 0,
          closed: 0,
        };
        existing.count++;
        existing.total_cost += row.total_cost_eur || 0;
        existing.eu_funding += row.eu_contribution_eur || 0;
        if (row.status === "SIGNED") existing.active++;
        if (row.status === "CLOSED") existing.closed++;
        frameworks.set(fw, existing);
      }

      return Array.from(frameworks.values()).sort(
        (a, b) => b.eu_funding - a.eu_funding
      );
    },
  });
}

/**
 * Trigger CORDIS fetch for a single keyword or all keywords
 */
export async function fetchCordisProjects(
  keywordId?: string,
  keyword?: string,
  dryRun = false
) {
  const body: Record<string, any> = { dry_run: dryRun };
  if (keywordId && keyword) {
    body.keyword_id = keywordId;
    body.keyword = keyword;
  }

  const { data, error } = await supabase.functions.invoke(
    "fetch-cordis-projects",
    { body }
  );

  if (error) throw error;
  return data;
}
