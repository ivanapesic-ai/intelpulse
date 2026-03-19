import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ResearchSignal {
  id: string;
  keywordId: string;
  displayName: string;
  snapshotDate: string;
  totalWorks: number;
  worksLast5y: number;
  worksLast2y: number;
  citationCount: number;
  hIndex: number;
  growthRateYoy: number;
  topInstitutions: Array<{ name: string; country: string; count: number }>;
  topPapers: Array<{
    id: string;
    title: string;
    year: number;
    citations: number;
    doi: string | null;
    source: string | null;
    authors: string[];
  }>;
  coAuthorNetwork: {
    nodes: string[];
    edges: Array<{ from: string; to: string; weight: number }>;
  };
  researchScore: number;
}

export function useResearchSignals() {
  return useQuery({
    queryKey: ["research-signals"],
    queryFn: async (): Promise<ResearchSignal[]> => {
      const { data, error } = await supabase
        .from("research_signals")
        .select(`
          id,
          keyword_id,
          snapshot_date,
          total_works,
          works_last_5y,
          works_last_2y,
          citation_count,
          h_index,
          growth_rate_yoy,
          top_institutions,
          top_papers,
          co_author_network,
          research_score,
          technology_keywords!inner(display_name)
        `)
        .order("total_works", { ascending: false });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        id: row.id,
        keywordId: row.keyword_id,
        displayName: row.technology_keywords?.display_name || "Unknown",
        snapshotDate: row.snapshot_date,
        totalWorks: row.total_works || 0,
        worksLast5y: row.works_last_5y || 0,
        worksLast2y: row.works_last_2y || 0,
        citationCount: row.citation_count || 0,
        hIndex: row.h_index || 0,
        growthRateYoy: row.growth_rate_yoy || 0,
        topInstitutions: (row.top_institutions as any[]) || [],
        topPapers: (row.top_papers as any[]) || [],
        coAuthorNetwork: (row.co_author_network as any) || { nodes: [], edges: [] },
        researchScore: row.research_score || 0,
      }));
    },
  });
}

export function useResearchSignalForKeyword(keywordId: string | null) {
  return useQuery({
    queryKey: ["research-signal", keywordId],
    queryFn: async (): Promise<ResearchSignal | null> => {
      if (!keywordId) return null;

      const { data, error } = await supabase
        .from("research_signals")
        .select(`
          id,
          keyword_id,
          snapshot_date,
          total_works,
          works_last_5y,
          works_last_2y,
          citation_count,
          h_index,
          growth_rate_yoy,
          top_institutions,
          top_papers,
          co_author_network,
          research_score,
          technology_keywords!inner(display_name)
        `)
        .eq("keyword_id", keywordId)
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        keywordId: data.keyword_id,
        displayName: (data as any).technology_keywords?.display_name || "Unknown",
        snapshotDate: data.snapshot_date,
        totalWorks: data.total_works || 0,
        worksLast5y: data.works_last_5y || 0,
        worksLast2y: data.works_last_2y || 0,
        citationCount: data.citation_count || 0,
        hIndex: data.h_index || 0,
        growthRateYoy: data.growth_rate_yoy || 0,
        topInstitutions: (data.top_institutions as any[]) || [],
        topPapers: (data.top_papers as any[]) || [],
        coAuthorNetwork: (data.co_author_network as any) || { nodes: [], edges: [] },
        researchScore: data.research_score || 0,
      };
    },
    enabled: !!keywordId,
  });
}
