import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DomainOverview {
  id: number;
  name: string;
  description: string | null;
  challengeScore: number;
  opportunityScore: number;
  maturityStage: string;
  companyCount: number;
  euCompanyCount: number;
  totalFundingUsd: number;
  totalPatents: number;
  displayOrder: number;
  strategicQuadrant: string;
}

export interface KeywordOverview {
  keywordId: string;
  keyword: string;
  displayName: string;
  description: string | null;
  aliases: string[];
  domainId: number;
  domainName: string;
  domainChallenge: number;
  domainOpportunity: number;
  companyCount: number;
  totalFundingUsd: number;
  totalPatents: number;
}

export const QUADRANT_CONFIG: Record<string, { color: string; bgColor: string; icon: string }> = {
  "Strategic Investment": { 
    color: "text-emerald-600", 
    bgColor: "bg-emerald-500/10 border-emerald-500/30", 
    icon: "🚀" 
  },
  "High-Risk High-Reward": { 
    color: "text-amber-600", 
    bgColor: "bg-amber-500/10 border-amber-500/30", 
    icon: "⚡" 
  },
  "Balanced Growth": { 
    color: "text-blue-600", 
    bgColor: "bg-blue-500/10 border-blue-500/30", 
    icon: "📈" 
  },
  "Mature Low-Growth": { 
    color: "text-slate-600", 
    bgColor: "bg-slate-500/10 border-slate-500/30", 
    icon: "🏛️" 
  },
  "Monitor": { 
    color: "text-gray-500", 
    bgColor: "bg-gray-500/10 border-gray-500/30", 
    icon: "👁️" 
  },
};

export const MATURITY_CONFIG: Record<string, { color: string; label: string }> = {
  "Emerging": { color: "text-purple-600 bg-purple-500/10", label: "Emerging" },
  "Growth": { color: "text-blue-600 bg-blue-500/10", label: "Growth" },
  "Mature": { color: "text-green-600 bg-green-500/10", label: "Mature" },
  "Declining": { color: "text-orange-600 bg-orange-500/10", label: "Declining" },
};

export function useDomainOverview() {
  return useQuery({
    queryKey: ["domain-overview"],
    queryFn: async (): Promise<DomainOverview[]> => {
      const { data, error } = await supabase
        .from("domain_overview")
        .select("*")
        .order("company_count", { ascending: false });

      if (error) throw error;

      return (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        challengeScore: Number(row.challenge_score) || 0,
        opportunityScore: Number(row.opportunity_score) || 0,
        maturityStage: row.maturity_stage || "Emerging",
        companyCount: row.company_count || 0,
        euCompanyCount: row.eu_company_count || 0,
        totalFundingUsd: Number(row.total_funding_usd) || 0,
        totalPatents: row.total_patents || 0,
        displayOrder: row.display_order || 0,
        strategicQuadrant: row.strategic_quadrant || "Monitor",
      }));
    },
  });
}

export function useKeywordOverview(domainId?: number) {
  return useQuery({
    queryKey: ["keyword-overview", domainId],
    queryFn: async (): Promise<KeywordOverview[]> => {
      let query = supabase
        .from("keyword_overview")
        .select("*")
        .order("company_count", { ascending: false });

      if (domainId) {
        query = query.eq("domain_id", domainId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((row) => ({
        keywordId: row.keyword_id,
        keyword: row.keyword,
        displayName: row.display_name,
        description: row.description,
        aliases: row.aliases || [],
        domainId: row.domain_id,
        domainName: row.domain_name,
        domainChallenge: Number(row.domain_challenge) || 0,
        domainOpportunity: Number(row.domain_opportunity) || 0,
        companyCount: row.company_count || 0,
        totalFundingUsd: Number(row.total_funding_usd) || 0,
        totalPatents: row.total_patents || 0,
      }));
    },
  });
}

// Format large numbers for display
export function formatCompactNumber(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toString();
}
