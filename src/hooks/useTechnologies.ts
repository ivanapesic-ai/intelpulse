import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TechnologyKeyword, Technology, KeywordSource } from "@/types/database";
import { toast } from "@/hooks/use-toast";

// AI-powered tag mapping
export function useAITagMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options: { keywordIds?: string[]; mode?: "single" | "unmapped" }) => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tag-mapper`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            keywordIds: options.keywordIds,
            mode: options.mode || "unmapped",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        if (response.status === 402) {
          throw new Error("AI credits exhausted. Please add funds.");
        }
        throw new Error(errorData.error || "AI mapping failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
      queryClient.invalidateQueries({ queryKey: ["technology-intelligence"] });
      toast({
        title: "AI mapping complete",
         description: `Successfully mapped ${data.updated}/${data.processed} keywords.`,
      });
    },
    onError: (error) => {
      toast({
        title: "AI mapping failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Fetch all active keywords (including all mapping columns)
export function useKeywords(source?: KeywordSource) {
  return useQuery({
    queryKey: ["keywords", source],
    queryFn: async () => {
      let query = supabase
        .from("technology_keywords")
        .select("*")
        .eq("is_active", true)
        .order("display_name");

      if (source) {
        query = query.eq("source", source);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((row): TechnologyKeyword & { 
        dealroomIndustries: string[]; 
        dealroomSubIndustries: string[]; 
      } => ({
        id: row.id,
        keyword: row.keyword,
        source: row.source as KeywordSource,
        displayName: row.display_name,
        description: row.description || undefined,
        parentKeywordId: row.parent_keyword_id || undefined,
        aliases: row.aliases || undefined,
        dealroomTags: row.dealroom_tags || [],
        dealroomIndustries: (row as any).dealroom_industries || [],
        dealroomSubIndustries: (row as any).dealroom_sub_industries || [],
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
  });
}

// Update dealroom_tags for a keyword
export function useUpdateKeywordTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ keywordId, tags }: { keywordId: string; tags: string[] }) => {
      const { data, error } = await supabase
        .from("technology_keywords")
        .update({ 
           aliases: tags,
          updated_at: new Date().toISOString()
        })
        .eq("id", keywordId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
      queryClient.invalidateQueries({ queryKey: ["technology-intelligence"] });
      toast({
        title: "Tags updated",
         description: "Keyword aliases have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update tags",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Fetch all technologies from the technology_intelligence materialized view
export function useTechnologies() {
  return useQuery({
    queryKey: ["technology-intelligence"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("technology_intelligence")
        .select("*")
        .order("log_composite_score", { ascending: false, nullsFirst: false });

      if (error) throw error;

      return (data || []).map((row: any): Technology & { keyword?: TechnologyKeyword } => ({
        id: row.technology_id,
        keywordId: row.keyword_id,
        name: row.name,
        description: row.tech_description || "",
        investmentScore: (row.investment_score || 0) as 0 | 1 | 2,
        employeesScore: (row.employees_score || 0) as 0 | 1 | 2,
        trlScore: (row.trl_score || 0) as 0 | 1 | 2,
        euAlignmentScore: (row.eu_alignment_score || 0) as 0 | 1 | 2,
        visibilityScore: (row.visibility_score || 0) as 0 | 1 | 2,
        compositeScore: Number(row.log_composite_score) || Number(row.composite_score) || 0,
        avgTrlMentioned: row.avg_trl_mentioned ? Number(row.avg_trl_mentioned) : undefined,
        policyMentionCount: row.policy_mention_count || 0,
        newsMentionCount: row.news_mention_count || 0,
        recentNews: (Array.isArray(row.recent_news) ? row.recent_news : []) as Array<{ title: string; url: string; date: string; source: string }>,
        avgSemanticScore: row.avg_semantic_score ? Number(row.avg_semantic_score) : undefined,
        networkCentrality: row.network_centrality ? Number(row.network_centrality) : undefined,
        corpusRarityScore: row.corpus_rarity_score ? Number(row.corpus_rarity_score) : undefined,
        weightedFrequencyScore: Number(row.weighted_frequency_score) || 0,
        avgRelevanceScore: Number(row.avg_relevance_score) || 0,
        documentDiversity: row.document_diversity || 0,
        trend: (row.trend || "stable") as "up" | "down" | "stable",
        keyPlayers: row.key_players || [],
        totalPatents: row.total_patents || 0,
        totalFundingEur: Number(row.total_funding_eur) || 0,
        totalEmployees: row.total_employees || 0,
        dealroomCompanyCount: row.company_count || 0,
        documentMentionCount: row.document_mention_count || 0,
        lastUpdated: row.refreshed_at,
        createdAt: row.refreshed_at,
        keyword: {
          id: row.keyword_id,
          keyword: row.slug,
          source: "cei_sphere" as KeywordSource,
          displayName: row.name,
          aliases: row.aliases || [],
          isActive: true,
          createdAt: "",
          updatedAt: "",
        },
      }));
    },
  });
}

// Get technology by ID — reads from technology_intelligence
export function useTechnology(id: string) {
  return useQuery({
    queryKey: ["technology-intelligence", "single", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("technology_intelligence")
        .select("*")
        .eq("technology_id", id)
        .single();

      if (error) throw error;

      const row = data as any;
      return {
        id: row.technology_id,
        keywordId: row.keyword_id,
        name: row.name,
        description: row.tech_description || "",
        investmentScore: (row.investment_score || 0) as 0 | 1 | 2,
        employeesScore: (row.employees_score || 0) as 0 | 1 | 2,
        trlScore: (row.trl_score || 0) as 0 | 1 | 2,
        euAlignmentScore: (row.eu_alignment_score || 0) as 0 | 1 | 2,
        visibilityScore: (row.visibility_score || 0) as 0 | 1 | 2,
        compositeScore: Number(row.log_composite_score) || Number(row.composite_score) || 0,
        avgTrlMentioned: row.avg_trl_mentioned ? Number(row.avg_trl_mentioned) : undefined,
        policyMentionCount: row.policy_mention_count || 0,
        newsMentionCount: row.news_mention_count || 0,
        recentNews: (Array.isArray(row.recent_news) ? row.recent_news : []) as Array<{ title: string; url: string; date: string; source: string }>,
        avgSemanticScore: row.avg_semantic_score ? Number(row.avg_semantic_score) : undefined,
        networkCentrality: row.network_centrality ? Number(row.network_centrality) : undefined,
        corpusRarityScore: row.corpus_rarity_score ? Number(row.corpus_rarity_score) : undefined,
        weightedFrequencyScore: Number(row.weighted_frequency_score) || 0,
        avgRelevanceScore: Number(row.avg_relevance_score) || 0,
        documentDiversity: row.document_diversity || 0,
        trend: (row.trend || "stable") as "up" | "down" | "stable",
        keyPlayers: row.key_players || [],
        totalPatents: row.total_patents || 0,
        totalFundingEur: Number(row.total_funding_eur) || 0,
        totalEmployees: row.total_employees || 0,
        dealroomCompanyCount: row.company_count || 0,
        documentMentionCount: row.document_mention_count || 0,
        lastUpdated: row.refreshed_at,
        createdAt: row.refreshed_at,
      } as Technology;
    },
    enabled: !!id,
  });
}

// Get keyword statistics
export function useKeywordStats() {
  return useQuery({
    queryKey: ["keyword-stats"],
    queryFn: async () => {
      const { data: keywords, error: keywordsError } = await supabase
        .from("technology_keywords")
        .select("source")
        .eq("is_active", true);

      if (keywordsError) throw keywordsError;

      const { data: technologies, error: techError } = await supabase
        .from("technology_intelligence")
        .select("composite_score, total_funding_eur, total_patents, total_employees");

      if (techError) throw techError;

      const sourceCount = (keywords || []).reduce((acc, k) => {
        acc[k.source] = (acc[k.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalFunding = (technologies || []).reduce((sum, t: any) => sum + (Number(t.total_funding_eur) || 0), 0);
      const totalPatents = (technologies || []).reduce((sum, t: any) => sum + (t.total_patents || 0), 0);
      const totalEmployees = (technologies || []).reduce((sum, t: any) => sum + (t.total_employees || 0), 0);
      const avgCompositeScore = technologies?.length
        ? (technologies || []).reduce((sum, t: any) => sum + (Number(t.composite_score) || 0), 0) / technologies.length
        : 0;

      return {
        totalKeywords: keywords?.length || 0,
        totalTechnologies: technologies?.length || 0,
        ceiSphereCount: sourceCount.cei_sphere || 0,
        dealroomCount: sourceCount.dealroom || 0,
        manualCount: sourceCount.manual || 0,
        totalFunding,
        totalPatents,
        totalEmployees,
        avgCompositeScore,
      };
    },
  });
}
