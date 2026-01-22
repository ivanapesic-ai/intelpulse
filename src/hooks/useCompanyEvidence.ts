import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CompanyTechnologyEvidence, TechnologyIntelligence } from "@/types/database";
import { toast } from "sonner";

// Fetch evidence for a specific company
export function useCompanyEvidence(companyId?: string) {
  return useQuery({
    queryKey: ["company-evidence", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from("company_technology_evidence")
        .select(`
          *,
          keyword:technology_keywords(display_name, keyword)
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((row): CompanyTechnologyEvidence & { keyword?: { displayName: string; keyword: string } } => ({
        id: row.id,
        companyId: row.company_id,
        keywordId: row.keyword_id,
        sourceType: row.source_type as 'document' | 'web' | 'dealroom',
        sourceReference: row.source_reference,
        trlMentioned: row.trl_mentioned ?? undefined,
        policyReference: row.policy_reference ?? undefined,
        context: row.context ?? undefined,
        confidenceScore: Number(row.confidence_score) || 0.7,
        createdAt: row.created_at,
        keyword: row.keyword ? {
          displayName: row.keyword.display_name,
          keyword: row.keyword.keyword
        } : undefined
      }));
    },
    enabled: !!companyId,
  });
}

// Fetch evidence for a specific technology keyword
export function useTechnologyEvidence(keywordId?: string) {
  return useQuery({
    queryKey: ["technology-evidence", keywordId],
    queryFn: async () => {
      if (!keywordId) return [];
      
      const { data, error } = await supabase
        .from("company_technology_evidence")
        .select(`
          *,
          company:dealroom_companies(name, hq_country, total_funding_eur)
        `)
        .eq("keyword_id", keywordId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((row) => ({
        id: row.id,
        companyId: row.company_id,
        keywordId: row.keyword_id,
        sourceType: row.source_type as 'document' | 'web' | 'dealroom',
        sourceReference: row.source_reference,
        trlMentioned: row.trl_mentioned ?? undefined,
        policyReference: row.policy_reference ?? undefined,
        context: row.context ?? undefined,
        confidenceScore: Number(row.confidence_score) || 0.7,
        createdAt: row.created_at,
        company: row.company ? {
          name: row.company.name,
          hqCountry: row.company.hq_country,
          totalFundingEur: Number(row.company.total_funding_eur) || 0
        } : undefined
      }));
    },
    enabled: !!keywordId,
  });
}

// Fetch aggregated evidence stats
export function useEvidenceStats() {
  return useQuery({
    queryKey: ["evidence-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_technology_evidence")
        .select("id, source_type, trl_mentioned, policy_reference");

      if (error) throw error;

      const records = data || [];
      return {
        totalEvidence: records.length,
        bySource: {
          document: records.filter(r => r.source_type === 'document').length,
          web: records.filter(r => r.source_type === 'web').length,
          dealroom: records.filter(r => r.source_type === 'dealroom').length,
        },
        withTrl: records.filter(r => r.trl_mentioned !== null).length,
        withPolicy: records.filter(r => r.policy_reference !== null).length,
      };
    },
  });
}

// Fetch technology intelligence from materialized view
export function useTechnologyIntelligence() {
  return useQuery({
    queryKey: ["technology-intelligence"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("technology_intelligence")
        .select("*")
        .order("composite_score", { ascending: false });

      if (error) {
        console.error("Error fetching technology intelligence:", error);
        throw error;
      }

      return (data || []).map((row): TechnologyIntelligence => ({
        id: row.id,
        keywordId: row.keyword_id,
        name: row.name,
        displayName: row.display_name,
        keywordDescription: row.keyword_description ?? undefined,
        dealroomCompanyCount: row.dealroom_company_count || 0,
        totalFundingEur: Number(row.total_funding_eur) || 0,
        totalEmployees: row.total_employees || 0,
        totalPatents: row.total_patents || 0,
        keyPlayers: row.key_players || [],
        documentMentionCount: row.document_mention_count || 0,
        avgTrlMentioned: row.avg_trl_mentioned ? Number(row.avg_trl_mentioned) : undefined,
        policyMentionCount: row.policy_mention_count || 0,
        documentDiversity: row.document_diversity || 0,
        compositeScore: Number(row.composite_score) || 0,
        avgSemanticScore: row.avg_semantic_score ? Number(row.avg_semantic_score) : undefined,
        networkCentrality: row.network_centrality ? Number(row.network_centrality) : undefined,
        corpusRarityScore: row.corpus_rarity_score ? Number(row.corpus_rarity_score) : undefined,
        avgRelevanceScore: row.avg_relevance_score ? Number(row.avg_relevance_score) : undefined,
        weightedFrequencyScore: row.weighted_frequency_score ? Number(row.weighted_frequency_score) : undefined,
        visibilityScore: row.visibility_score || 0,
        trlScore: row.trl_score || 0,
        euAlignmentScore: row.eu_alignment_score || 0,
        investmentScore: row.investment_score ?? undefined,
        employeesScore: row.employees_score ?? undefined,
        companyNames: row.company_names || [],
        trlDistribution: row.trl_distribution as { low: number; mid: number; high: number; unknown: number } || { low: 0, mid: 0, high: 0, unknown: 0 },
        evidenceBySource: row.evidence_by_source as { document: number; web: number; dealroom: number } || { document: 0, web: 0, dealroom: 0 },
        lastUpdated: row.last_updated,
        trend: row.trend as 'up' | 'down' | 'stable' || 'stable',
      }));
    },
  });
}

// Populate evidence from existing mentions
export function usePopulateEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("populate_company_evidence");
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["evidence-stats"] });
      queryClient.invalidateQueries({ queryKey: ["company-evidence"] });
      queryClient.invalidateQueries({ queryKey: ["technology-evidence"] });
      toast.success(`Created evidence records`, {
        description: `Linked companies to technologies`
      });
    },
    onError: (error) => {
      toast.error("Failed to populate evidence", {
        description: error.message
      });
    },
  });
}

// Refresh the technology intelligence materialized view
export function useRefreshIntelligence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("refresh_technology_intelligence");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technology-intelligence"] });
      toast.success("Technology intelligence refreshed");
    },
    onError: (error) => {
      toast.error("Failed to refresh intelligence", {
        description: error.message
      });
    },
  });
}
