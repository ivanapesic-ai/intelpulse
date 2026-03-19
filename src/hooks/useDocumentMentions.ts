import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DocumentMentionsSummary {
  totalMentions: number;
  trlDistribution: { low: number; mid: number; high: number; unknown: number };
  policyReferences: string[];
  mentions: Array<{
    id: string;
    documentId: string | null;
    mentionContext: string | null;
    trlMentioned: number | null;
    policyReference: string | null;
    confidenceScore: number | null;
  }>;
}

export function useDocumentMentions(keywordId: string | undefined) {
  return useQuery({
    queryKey: ["document-mentions", keywordId],
    queryFn: async (): Promise<DocumentMentionsSummary> => {
      if (!keywordId) {
        return { totalMentions: 0, trlDistribution: { low: 0, mid: 0, high: 0, unknown: 0 }, policyReferences: [], mentions: [] };
      }

      const { data, error } = await supabase
        .from("document_technology_mentions")
        .select("id, document_id, mention_context, trl_mentioned, policy_reference, confidence_score")
        .eq("keyword_id", keywordId)
        .order("confidence_score", { ascending: false })
        .limit(100);

      if (error) throw error;

      const mentions = data || [];
      const trlDist = { low: 0, mid: 0, high: 0, unknown: 0 };
      const policyRefs = new Set<string>();

      for (const m of mentions) {
        if (m.trl_mentioned == null) trlDist.unknown++;
        else if (m.trl_mentioned <= 3) trlDist.low++;
        else if (m.trl_mentioned <= 6) trlDist.mid++;
        else trlDist.high++;

        if (m.policy_reference) policyRefs.add(m.policy_reference);
      }

      return {
        totalMentions: mentions.length,
        trlDistribution: trlDist,
        policyReferences: Array.from(policyRefs),
        mentions: mentions.map(m => ({
          id: m.id,
          documentId: m.document_id,
          mentionContext: m.mention_context,
          trlMentioned: m.trl_mentioned,
          policyReference: m.policy_reference,
          confidenceScore: m.confidence_score,
        })),
      };
    },
    enabled: !!keywordId,
  });
}
