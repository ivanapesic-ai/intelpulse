import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * C-O Scoring Engine Hook
 * Implements the Challenge-Opportunity scoring from challenge_opportunity_scorer.py
 */

export interface ScoredTechnology {
  keyword_id: string;
  keyword_name: string;
  challenge_score: number;
  opportunity_score: number;
  quadrant: string;
  company_count: number;
  total_funding: number;
}

export interface ScoringFactors {
  maturity: "Emerging" | "Early Adoption" | "Mainstream";
  regulatory: "Major gaps" | "Some gaps" | "Clear";
  skills_gap: "Severe" | "Moderate" | "Adequate";
  integration: "High" | "Moderate" | "Standard";
  roi_clarity: "Unclear" | "Moderate" | "Clear";
}

// Strategic quadrant definitions matching the Python script
export const QUADRANT_CONFIG = {
  "Strategic Investment": {
    description: "Few barriers + High opportunity - Prime targets for investment",
    color: "bg-emerald-500/20 border-emerald-500/50 text-emerald-400",
    icon: "🎯",
  },
  "High-Risk High-Reward": {
    description: "Major barriers + High opportunity - Worth pursuing with caution",
    color: "bg-amber-500/20 border-amber-500/50 text-amber-400",
    icon: "⚡",
  },
  "Mature Low-Growth": {
    description: "Few barriers + Low opportunity - Stable but limited upside",
    color: "bg-blue-500/20 border-blue-500/50 text-blue-400",
    icon: "📊",
  },
  Monitor: {
    description: "Various combinations - Watch for changes",
    color: "bg-muted border-border text-muted-foreground",
    icon: "👁️",
  },
} as const;

// Fetch all scored technologies
export function useScoredTechnologies() {
  return useQuery({
    queryKey: ["co-scored-technologies"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("score_all_technologies");

      if (error) throw error;

      return (data || []) as ScoredTechnology[];
    },
  });
}

// Apply C-O scores to technologies table
export function useApplyCOScores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Call the scoring function and update technologies
      const { data: scores, error: scoreError } = await supabase.rpc(
        "score_all_technologies"
      );

      if (scoreError) throw scoreError;

      // Update each technology with its scores
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

      return {
        processed: updated,
        total: (scores || []).length,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technology-intelligence"] });
      queryClient.invalidateQueries({ queryKey: ["technologies"] });
      queryClient.invalidateQueries({ queryKey: ["co-scored-technologies"] });
    },
  });
}

// Get quadrant distribution for analytics
export function useQuadrantDistribution() {
  return useQuery({
    queryKey: ["quadrant-distribution"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("technologies")
        .select("challenge_score, opportunity_score, name")
        .not("challenge_score", "is", null)
        .not("opportunity_score", "is", null);

      if (error) throw error;

      const distribution = {
        "Strategic Investment": [] as string[],
        "High-Risk High-Reward": [] as string[],
        "Mature Low-Growth": [] as string[],
        Monitor: [] as string[],
      };

      for (const tech of data || []) {
        const c = tech.challenge_score ?? 0;
        const o = tech.opportunity_score ?? 0;

        let quadrant: keyof typeof distribution;
        if (c >= 1.5 && o >= 1.5) {
          quadrant = "Strategic Investment";
        } else if (c < 0.5 && o >= 1.5) {
          quadrant = "High-Risk High-Reward";
        } else if (c >= 1.5 && o < 0.5) {
          quadrant = "Mature Low-Growth";
        } else {
          quadrant = "Monitor";
        }

        distribution[quadrant].push(tech.name);
      }

      return distribution;
    },
  });
}

// Calculate challenge score client-side (for preview/simulation)
export function calculateChallengeScore(factors: ScoringFactors): number {
  let base = 2.0;

  // Maturity impact
  if (factors.maturity === "Emerging") base -= 0.8;
  else if (factors.maturity === "Early Adoption") base -= 0.4;

  // Regulatory impact
  if (factors.regulatory === "Major gaps") base -= 0.6;
  else if (factors.regulatory === "Some gaps") base -= 0.3;

  // Skills impact
  if (factors.skills_gap === "Severe") base -= 0.4;
  else if (factors.skills_gap === "Moderate") base -= 0.2;

  // Integration impact
  if (factors.integration === "High") base -= 0.4;
  else if (factors.integration === "Moderate") base -= 0.2;

  // ROI impact
  if (factors.roi_clarity === "Unclear") base -= 0.4;
  else if (factors.roi_clarity === "Moderate") base -= 0.2;

  return Math.max(0, Math.min(2, Math.round(base * 10) / 10));
}

// Calculate opportunity score client-side (for preview/simulation)
export function calculateOpportunityScore(
  marketSizeEur: number,
  growthRateYoy: number,
  strategicAlignment: number,
  companyCount: number
): number {
  let base = 0;

  // Market size impact
  if (marketSizeEur > 50_000_000_000) base += 0.7;
  else if (marketSizeEur > 10_000_000_000) base += 0.5;
  else if (marketSizeEur > 1_000_000_000) base += 0.3;
  else base += 0.1;

  // Growth rate impact
  if (growthRateYoy > 20) base += 0.7;
  else if (growthRateYoy > 10) base += 0.5;
  else if (growthRateYoy > 5) base += 0.3;
  else base += 0.1;

  // Strategic alignment impact
  if (strategicAlignment >= 3) base += 0.6;
  else if (strategicAlignment === 2) base += 0.4;
  else if (strategicAlignment === 1) base += 0.2;

  // Ecosystem readiness impact
  if (companyCount > 200) base += 0.5;
  else if (companyCount > 50) base += 0.3;
  else if (companyCount > 10) base += 0.1;

  return Math.max(0, Math.min(2, Math.round(base * 10) / 10));
}

// Get quadrant name from scores
export function getQuadrant(
  challengeScore: number,
  opportunityScore: number
): keyof typeof QUADRANT_CONFIG {
  if (challengeScore >= 1.5 && opportunityScore >= 1.5)
    return "Strategic Investment";
  if (challengeScore < 0.5 && opportunityScore >= 1.5)
    return "High-Risk High-Reward";
  if (challengeScore >= 1.5 && opportunityScore < 0.5) return "Mature Low-Growth";
  return "Monitor";
}
