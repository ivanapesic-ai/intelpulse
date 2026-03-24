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

function getQuadrant(challenge: number, opportunity: number): string {
  if (challenge >= 1.5 && opportunity >= 1.5) return "Strategic Investment";
  if (challenge < 0.5 && opportunity >= 1.5) return "High-Risk High-Reward";
  if (challenge >= 1.5 && opportunity < 0.5) return "Mature Low-Growth";
  return "Monitor";
}

function getMaturityStage(score: number): string {
  if (score >= 1.5) return "Mature";
  if (score >= 1.0) return "Growth";
  return "Emerging";
}

// Domain overview aggregated from technology_intelligence
export function useDomainOverview() {
  return useQuery({
    queryKey: ["technology-intelligence", "domains"],
    queryFn: async (): Promise<DomainOverview[]> => {
      const { data, error } = await supabase
        .from("technology_intelligence")
        .select("*");

      if (error) throw error;

      // Group by domain
      const domainMap = new Map<number, {
        name: string;
        rows: any[];
      }>();

      for (const row of data || []) {
        const domainId = row.domain_id;
        if (!domainId) continue;
        
        if (!domainMap.has(domainId)) {
          domainMap.set(domainId, { name: row.domain_name || "Unknown", rows: [] });
        }
        domainMap.get(domainId)!.rows.push(row);
      }

      const domains: DomainOverview[] = [];
      for (const [id, { name, rows }] of domainMap) {
        const totalCompanies = rows.reduce((s, r) => s + (r.company_count || 0), 0);
        const totalFunding = rows.reduce((s, r) => s + (Number(r.total_funding_eur) || 0), 0);
        const totalPatents = rows.reduce((s, r) => s + (r.total_patents || 0), 0);
        const avgChallenge = rows.reduce((s, r) => s + (Number(r.challenge_score) || 0), 0) / rows.length;
        const avgOpportunity = rows.reduce((s, r) => s + (Number(r.opportunity_score) || 0), 0) / rows.length;
        const avgMaturity = rows.reduce((s, r) => s + (Number(r.maturity_score) || 0), 0) / rows.length;

        domains.push({
          id,
          name,
          description: null,
          challengeScore: avgChallenge,
          opportunityScore: avgOpportunity,
          maturityStage: getMaturityStage(avgMaturity),
          companyCount: totalCompanies,
          euCompanyCount: 0,
          totalFundingUsd: totalFunding,
          totalPatents,
          displayOrder: 0,
          strategicQuadrant: getQuadrant(avgChallenge, avgOpportunity),
        });
      }

      return domains.sort((a, b) => b.companyCount - a.companyCount);
    },
  });
}

// Keyword overview from technology_intelligence — each row IS a keyword
export function useKeywordOverview(domainId?: number) {
  return useQuery({
    queryKey: ["technology-intelligence", "keywords", domainId],
    queryFn: async (): Promise<KeywordOverview[]> => {
      let query = supabase
        .from("technology_intelligence")
        .select("*")
        .order("company_count", { ascending: false });

      if (domainId) {
        query = query.eq("domain_id", domainId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((row: any) => ({
        keywordId: row.keyword_id,
        keyword: row.slug,
        displayName: row.name,
        description: row.tech_description,
        aliases: row.aliases || [],
        domainId: row.domain_id,
        domainName: row.domain_name || "Unknown",
        domainChallenge: Number(row.challenge_score) || 0,
        domainOpportunity: Number(row.opportunity_score) || 0,
        companyCount: row.company_count || 0,
        totalFundingUsd: Number(row.total_funding_eur) || 0,
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
