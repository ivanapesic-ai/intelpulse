import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MaturityScore, TrendDirection, NewsItem } from "@/types/database";

// Extended intelligence data with C-O matrix
export interface TechnologyIntelligence {
  id: string;
  name: string;
  description: string;
  keywordId: string;
  investmentScore: MaturityScore;
  employeesScore: MaturityScore;
  trlScore: MaturityScore;
  visibilityScore: MaturityScore;
  euAlignmentScore: MaturityScore;
  compositeScore: number;
  trend: TrendDirection;
  totalPatents: number;
  patentsScore: MaturityScore;
  totalFundingEur: number;
  totalEmployees: number;
  dealroomCompanyCount: number;
  documentMentionCount: number;
  policyMentionCount: number;
  avgTrlMentioned: number | null;
  newsMentionCount: number;
  researchScore: MaturityScore;
  recentNews: NewsItem[];
  keyPlayers: string[];
  lastUpdated: string;
  createdAt: string;
  aliases?: string[];
  keyword?: string;
  avgSemanticScore?: number;
  networkCentrality?: number;
  corpusRarityScore?: number;
  weightedFrequencyScore?: number;
  avgRelevanceScore?: number;
  documentDiversity?: number;
  // C-O Matrix fields
  challengeScore: number | null;
  opportunityScore: number | null;
  sectorTags: string[];
  marketSignals: {
    funding_mentions?: string[];
    adoption_rates?: string[];
  };
  documentInsights: {
    mention_contexts?: Array<{
      context: string;
      trl: number | null;
      confidence: number;
      policy: string | null;
    }>;
    policy_references?: string[];
    source_count?: number;
  };
  // Domain info
  domainName?: string;
  domainId?: number;
  maturityScore?: number;
}

// Challenge-Opportunity score descriptions
export const CHALLENGE_LABELS: Record<number, { label: string; description: string; color: string }> = {
  2: { 
    label: "No Major Challenge", 
    description: "No significant barriers to entering the market. Standard processes apply.",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30"
  },
  1: { 
    label: "Manageable Challenge", 
    description: "Some challenges exist but there are clear, actionable steps to overcome them.",
    color: "text-amber-500 bg-amber-500/10 border-amber-500/30"
  },
  0: { 
    label: "Severe Challenge", 
    description: "Major obstacles present that could seriously impede or block market success.",
    color: "text-red-500 bg-red-500/10 border-red-500/30"
  },
};

export const OPPORTUNITY_LABELS: Record<number, { label: string; description: string; color: string }> = {
  2: { 
    label: "High Opportunity", 
    description: "Significant value, readily achievable, closely aligned with strategic goals.",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30"
  },
  1: { 
    label: "Promising Opportunity", 
    description: "Reasonable value, achievable with moderate effort and existing resources.",
    color: "text-amber-500 bg-amber-500/10 border-amber-500/30"
  },
  0: { 
    label: "Limited Opportunity", 
    description: "Low potential value, difficult realization, weak strategic fit.",
    color: "text-red-500 bg-red-500/10 border-red-500/30"
  },
};

export const SECTOR_COLORS: Record<string, string> = {
  mobility: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  energy: "bg-green-500/10 text-green-600 border-green-500/30",
  manufacturing: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  general: "bg-gray-500/10 text-gray-600 border-gray-500/30",
};

function mapRowToIntelligence(row: any): TechnologyIntelligence {
  return {
    id: row.technology_id,
    name: row.name,
    description: row.tech_description || "",
    keywordId: row.keyword_id,
    investmentScore: (row.investment_score ?? 0) as MaturityScore,
    employeesScore: (row.employees_score ?? 0) as MaturityScore,
    compositeScore: Number(row.log_composite_score) || Number(row.composite_score) || 0,
    trend: (row.trend || "stable") as TrendDirection,
    totalPatents: row.total_patents ?? 0,
    patentsScore: (row.patents_score ?? 0) as MaturityScore,
    totalFundingEur: Number(row.total_funding_eur) || 0,
    totalEmployees: row.total_employees ?? 0,
    dealroomCompanyCount: row.company_count ?? 0,
    documentMentionCount: row.document_mention_count ?? 0,
    lastUpdated: row.refreshed_at,
    createdAt: row.refreshed_at,
    keyPlayers: row.key_players || [],
    visibilityScore: (row.visibility_score ?? 0) as MaturityScore,
    trlScore: (row.trl_score ?? 0) as MaturityScore,
    euAlignmentScore: (row.eu_alignment_score ?? 0) as MaturityScore,
    avgTrlMentioned: row.avg_trl_mentioned ? Number(row.avg_trl_mentioned) : null,
    policyMentionCount: row.policy_mention_count ?? 0,
    newsMentionCount: row.news_mention_count ?? 0,
    researchScore: (row.research_score ?? 0) as MaturityScore,
    recentNews: (Array.isArray(row.recent_news) ? row.recent_news : []) as unknown as NewsItem[],
    avgSemanticScore: row.avg_semantic_score ? Number(row.avg_semantic_score) : undefined,
    networkCentrality: row.network_centrality ? Number(row.network_centrality) : undefined,
    corpusRarityScore: row.corpus_rarity_score ? Number(row.corpus_rarity_score) : undefined,
    weightedFrequencyScore: row.weighted_frequency_score ? Number(row.weighted_frequency_score) : undefined,
    avgRelevanceScore: row.avg_relevance_score ? Number(row.avg_relevance_score) : undefined,
    documentDiversity: row.document_diversity ?? undefined,
    aliases: row.aliases || [],
    keyword: row.slug || undefined,
    challengeScore: row.challenge_score,
    opportunityScore: row.opportunity_score,
    sectorTags: row.sector_tags || [],
    marketSignals: (row.market_signals as TechnologyIntelligence["marketSignals"]) || {},
    documentInsights: (row.document_insights as TechnologyIntelligence["documentInsights"]) || {},
    domainName: row.domain_name || undefined,
    domainId: row.domain_id || undefined,
    maturityScore: row.maturity_score ? Number(row.maturity_score) : undefined,
  };
}

// Fetch all technologies with full intelligence data from materialized view
export function useTechnologyIntelligence() {
  return useQuery({
    queryKey: ["technology-intelligence"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("technology_intelligence")
        .select("*")
        .order("composite_score", { ascending: false });

      if (error) throw error;

      return (data || []).map(mapRowToIntelligence);
    },
  });
}

// Fetch single technology intelligence by keyword ID
export function useSingleTechnologyIntelligence(keywordId: string | null) {
  return useQuery({
    queryKey: ["technology-intelligence", "keyword", keywordId],
    queryFn: async () => {
      if (!keywordId) return null;

      const { data, error } = await supabase
        .from("technology_intelligence")
        .select("*")
        .eq("keyword_id", keywordId)
        .single();

      if (error) throw error;

      return mapRowToIntelligence(data);
    },
    enabled: !!keywordId,
  });
}

// Trigger aggregation of document insights for a technology
export function useAggregateDocumentInsights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keywordId: string) => {
      const { error } = await supabase.rpc("aggregate_document_insights", {
        tech_keyword_id: keywordId,
      });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technology-intelligence"] });
    },
  });
}

// Trigger C-O score calculation for all technologies
export function useCalculateAllCOScores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: scores, error: scoreError } = await supabase.rpc(
        "score_all_technologies"
      );

      if (scoreError) throw scoreError;

      let updated = 0;
      for (const score of scores || []) {
        const { error: updateError } = await supabase
          .from("technologies")
          .update({
            challenge_score: score.challenge_score,
            opportunity_score: score.opportunity_score,
            last_updated: new Date().toISOString(),
          })
          .eq("keyword_id", score.keyword_id);

        if (!updateError) updated++;
      }

      // Refresh the materialized view after updating scores
      await supabase.rpc("refresh_technology_intelligence");

      return { processed: updated };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technology-intelligence"] });
    },
  });
}
