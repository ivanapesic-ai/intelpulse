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
      toast({
        title: "AI mapping complete",
        description: `Successfully mapped ${data.updated}/${data.processed} keywords to Dealroom tags.`,
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

// Fetch all active keywords (including dealroom_tags for mapping)
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

      return (data || []).map((row): TechnologyKeyword => ({
        id: row.id,
        keyword: row.keyword,
        source: row.source as KeywordSource,
        displayName: row.display_name,
        description: row.description || undefined,
        parentKeywordId: row.parent_keyword_id || undefined,
        aliases: row.aliases || undefined,
        dealroomTags: row.dealroom_tags || [],
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
          dealroom_tags: tags,
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
      toast({
        title: "Tags updated",
        description: "Dealroom tags have been saved successfully.",
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

// Fetch all technologies with their keyword info
export function useTechnologies() {
  return useQuery({
    queryKey: ["technologies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("technologies")
        .select(`
          *,
          technology_keywords (
            id,
            keyword,
            source,
            display_name
          )
        `)
        .order("composite_score", { ascending: false });

      if (error) throw error;

      return (data || []).map((row): Technology & { keyword?: TechnologyKeyword } => {
        const rowAny = row as Record<string, unknown>;
        return {
          id: row.id,
          keywordId: row.keyword_id,
          name: row.name,
          description: row.description || "",
          investmentScore: (row.investment_score || 0) as 0 | 1 | 2,
          employeesScore: (row.employees_score || 0) as 0 | 1 | 2,
          trlScore: ((rowAny.trl_score as number) || 0) as 0 | 1 | 2,
          euAlignmentScore: ((rowAny.eu_alignment_score as number) || 0) as 0 | 1 | 2,
          visibilityScore: ((rowAny.visibility_score as number) || 0) as 0 | 1 | 2,
          compositeScore: Number(row.composite_score) || 0,
          avgTrlMentioned: (rowAny.avg_trl_mentioned as number) || undefined,
          policyMentionCount: ((rowAny.policy_mention_count as number) || 0),
          // News aggregation
          newsMentionCount: ((rowAny.news_mention_count as number) || 0),
          recentNews: ((rowAny.recent_news as Array<{ title: string; url: string; date: string; source: string }>) || []),
          // H11 Hybrid Scoring (KeyBERT + TextRank + TF-IDF + Position)
          avgSemanticScore: Number(rowAny.avg_semantic_score) || undefined,
          networkCentrality: Number(rowAny.network_centrality) || undefined,
          corpusRarityScore: Number(rowAny.corpus_rarity_score) || undefined,
          weightedFrequencyScore: Number(rowAny.weighted_frequency_score) || 0,
          avgRelevanceScore: Number(rowAny.avg_relevance_score) || 0,
          documentDiversity: (rowAny.document_diversity as number) || 0,
          trend: (row.trend || "stable") as "up" | "down" | "stable",
          keyPlayers: row.key_players || [],
          totalPatents: row.total_patents || 0,
          totalFundingEur: Number(row.total_funding_eur) || 0,
          totalEmployees: row.total_employees || 0,
          dealroomCompanyCount: row.dealroom_company_count || 0,
          documentMentionCount: row.document_mention_count || 0,
          lastUpdated: row.last_updated,
          createdAt: row.created_at,
          keyword: row.technology_keywords ? {
            id: row.technology_keywords.id,
            keyword: row.technology_keywords.keyword,
            source: row.technology_keywords.source as KeywordSource,
            displayName: row.technology_keywords.display_name,
            isActive: true,
            createdAt: "",
            updatedAt: "",
          } : undefined,
        };
      });
    },
  });
}

// Get technology by ID
export function useTechnology(id: string) {
  return useQuery({
    queryKey: ["technology", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("technologies")
        .select(`
          *,
          technology_keywords (*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      const dataAny = data as Record<string, unknown>;
      return {
        id: data.id,
        keywordId: data.keyword_id,
        name: data.name,
        description: data.description || "",
        investmentScore: (data.investment_score || 0) as 0 | 1 | 2,
        employeesScore: (data.employees_score || 0) as 0 | 1 | 2,
        trlScore: ((dataAny.trl_score as number) || 0) as 0 | 1 | 2,
        euAlignmentScore: ((dataAny.eu_alignment_score as number) || 0) as 0 | 1 | 2,
        visibilityScore: ((dataAny.visibility_score as number) || 0) as 0 | 1 | 2,
        compositeScore: Number(data.composite_score) || 0,
        avgTrlMentioned: (dataAny.avg_trl_mentioned as number) || undefined,
        policyMentionCount: ((dataAny.policy_mention_count as number) || 0),
        // News aggregation
        newsMentionCount: ((dataAny.news_mention_count as number) || 0),
        recentNews: ((dataAny.recent_news as Array<{ title: string; url: string; date: string; source: string }>) || []),
        // H11 Hybrid Scoring (KeyBERT + TextRank + Position)
        avgSemanticScore: Number(dataAny.avg_semantic_score) || undefined,
        networkCentrality: Number(dataAny.network_centrality) || undefined,
        corpusRarityScore: Number(dataAny.corpus_rarity_score) || undefined,
        weightedFrequencyScore: Number(dataAny.weighted_frequency_score) || 0,
        avgRelevanceScore: Number(dataAny.avg_relevance_score) || 0,
        documentDiversity: (dataAny.document_diversity as number) || 0,
        trend: (data.trend || "stable") as "up" | "down" | "stable",
        keyPlayers: data.key_players || [],
        totalPatents: data.total_patents || 0,
        totalFundingEur: Number(data.total_funding_eur) || 0,
        totalEmployees: data.total_employees || 0,
        dealroomCompanyCount: data.dealroom_company_count || 0,
        documentMentionCount: data.document_mention_count || 0,
        lastUpdated: data.last_updated,
        createdAt: data.created_at,
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
        .from("technologies")
        .select("composite_score, total_funding_eur, total_patents, total_employees");

      if (techError) throw techError;

      const sourceCount = (keywords || []).reduce((acc, k) => {
        acc[k.source] = (acc[k.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalFunding = (technologies || []).reduce((sum, t) => sum + (Number(t.total_funding_eur) || 0), 0);
      const totalPatents = (technologies || []).reduce((sum, t) => sum + (t.total_patents || 0), 0);
      const totalEmployees = (technologies || []).reduce((sum, t) => sum + (t.total_employees || 0), 0);
      const avgCompositeScore = technologies?.length
        ? (technologies || []).reduce((sum, t) => sum + (Number(t.composite_score) || 0), 0) / technologies.length
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
