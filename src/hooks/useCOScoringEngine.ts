import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * C-O Scoring Engine Hook
 * Simplified — client-side scoring functions removed in favor of canonical SQL functions.
 * All score reads now come from the technology_intelligence materialized view.
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

// Apply C-O scores to technologies table, then refresh materialized view
export function useApplyCOScores() {
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

      // Refresh the materialized view so all consumers get updated data
      await supabase.rpc("refresh_technology_intelligence");

      return {
        processed: updated,
        total: (scores || []).length,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technology-intelligence"] });
    },
  });
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
