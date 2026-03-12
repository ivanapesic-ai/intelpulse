import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SignalSnapshot {
  keyword_id: string;
  snapshot_date: string;
  company_count: number;
  total_funding_usd: number;
  total_patents: number;
  total_employees: number;
  news_mention_count: number;
  composite_score: number;
  investment_score: number;
  patents_score: number;
  visibility_score: number;
}

export interface SignalDelta {
  keywordId: string;
  current: SignalSnapshot | null;
  previous: SignalSnapshot | null;
  deltas: {
    patents: number | null;
    funding: number | null;
    companies: number | null;
    employees: number | null;
    news: number | null;
    composite: number | null;
  };
}

export function useSignalSnapshots(keywordIds: string[], months = 6) {
  return useQuery({
    queryKey: ["signal-snapshots", keywordIds, months],
    queryFn: async () => {
      if (!keywordIds.length) return [];
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - months);
      
      const { data, error } = await supabase
        .from("keyword_signal_snapshots")
        .select("*")
        .in("keyword_id", keywordIds)
        .gte("snapshot_date", cutoff.toISOString().split("T")[0])
        .order("snapshot_date", { ascending: true });
      
      if (error) throw error;
      return (data || []) as SignalSnapshot[];
    },
    enabled: keywordIds.length > 0,
  });
}

/** Compute deltas between latest and previous snapshot per keyword */
export function computeDeltas(snapshots: SignalSnapshot[], keywordIds: string[]): SignalDelta[] {
  return keywordIds.map((kid) => {
    const kSnaps = snapshots
      .filter((s) => s.keyword_id === kid)
      .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));

    const current = kSnaps.length > 0 ? kSnaps[kSnaps.length - 1] : null;
    const previous = kSnaps.length > 1 ? kSnaps[kSnaps.length - 2] : null;

    const delta = (field: keyof SignalSnapshot) => {
      if (!current || !previous) return null;
      return (Number(current[field]) || 0) - (Number(previous[field]) || 0);
    };

    return {
      keywordId: kid,
      current,
      previous,
      deltas: {
        patents: delta("total_patents"),
        funding: delta("total_funding_usd"),
        companies: delta("company_count"),
        employees: delta("total_employees"),
        news: delta("news_mention_count"),
        composite: delta("composite_score"),
      },
    };
  });
}
