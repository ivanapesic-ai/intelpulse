import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Cooccurrence {
  keywordId: string;
  keyword: string;
  displayName: string;
  count: number;
}

export function useCooccurrences(keywordId: string | undefined) {
  return useQuery({
    queryKey: ["cooccurrences", keywordId],
    queryFn: async (): Promise<Cooccurrence[]> => {
      if (!keywordId) return [];

      const { data, error } = await supabase
        .from("technology_cooccurrences")
        .select("keyword_id_a, keyword_id_b, cooccurrence_count")
        .or(`keyword_id_a.eq.${keywordId},keyword_id_b.eq.${keywordId}`)
        .order("cooccurrence_count", { ascending: false })
        .limit(20);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Collect the "other" keyword IDs
      const otherIds = data.map(row =>
        row.keyword_id_a === keywordId ? row.keyword_id_b : row.keyword_id_a
      );
      const countMap = new Map(
        data.map(row => [
          row.keyword_id_a === keywordId ? row.keyword_id_b : row.keyword_id_a,
          row.cooccurrence_count || 1,
        ])
      );

      // Fetch display names
      const { data: keywords, error: kwError } = await supabase
        .from("technology_keywords")
        .select("id, keyword, display_name")
        .in("id", otherIds);

      if (kwError) throw kwError;

      return (keywords || [])
        .map(kw => ({
          keywordId: kw.id,
          keyword: kw.keyword,
          displayName: kw.display_name,
          count: countMap.get(kw.id) || 1,
        }))
        .sort((a, b) => b.count - a.count);
    },
    enabled: !!keywordId,
  });
}
