import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LineageLink {
  id: string;
  keyword_id: string;
  source_type: "research" | "patent" | "news";
  source_id: string;
  source_title: string;
  source_date: string | null;
  target_type: "research" | "patent" | "news";
  target_id: string;
  target_title: string;
  target_date: string | null;
  confidence: number;
  relationship_description: string | null;
  created_at: string;
}

export function useSignalLineage(keywordId: string | undefined) {
  return useQuery({
    queryKey: ["signal-lineage", keywordId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signal_lineage")
        .select("*")
        .eq("keyword_id", keywordId!)
        .order("confidence", { ascending: false });

      if (error) throw error;
      return (data || []) as LineageLink[];
    },
    enabled: !!keywordId,
  });
}
