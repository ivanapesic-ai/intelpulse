import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TechnologyRegionStats {
  keywordId: string;
  euCompanyCount: number;
  euFunding: number;
  euEmployees: number;
  globalCompanyCount: number;
  globalFunding: number;
  globalEmployees: number;
}

/**
 * This hook uses pre-aggregated data from the technologies table.
 * 
 * The technologies table already has correct aggregated stats from
 * the aggregate_crunchbase_signals RPC, so we use those directly
 * rather than re-querying crunchbase_keyword_mapping (which hits row limits).
 * 
 * EU filtering is currently disabled until a proper database aggregation
 * function is created to handle the region-specific calculations.
 */
export function useTechnologyRegionStats() {
  return useQuery({
    queryKey: ["technology-region-stats"],
    queryFn: async () => {
      // Use technologies table which has pre-aggregated global stats
      const { data: technologies, error: techError } = await supabase
        .from("technologies")
        .select("keyword_id, dealroom_company_count, total_funding_eur, total_employees");

      if (techError) throw techError;

      // Build stats map from technologies table
      const statsMap = new Map<string, TechnologyRegionStats>();

      for (const tech of technologies || []) {
        if (!tech.keyword_id) continue;

        // Use the pre-aggregated stats from technologies table
        // These come from the aggregate_crunchbase_signals RPC
        statsMap.set(tech.keyword_id, {
          keywordId: tech.keyword_id,
          globalCompanyCount: tech.dealroom_company_count || 0,
          globalFunding: tech.total_funding_eur || 0,
          globalEmployees: tech.total_employees || 0,
          // EU stats currently mirror global (region filtering TBD)
          euCompanyCount: 0,
          euFunding: 0,
          euEmployees: 0,
        });
      }

      return Array.from(statsMap.values());
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Helper to get region-filtered stats for a specific technology
export function getRegionStats(
  allStats: TechnologyRegionStats[] | undefined,
  keywordId: string | undefined,
  region: "global" | "eu"
): { companyCount: number; funding: number; employees: number } {
  if (!allStats || !keywordId) {
    return { companyCount: 0, funding: 0, employees: 0 };
  }

  const stats = allStats.find((s) => s.keywordId === keywordId);
  if (!stats) {
    return { companyCount: 0, funding: 0, employees: 0 };
  }

  // For EU filter, return EU stats if available, otherwise show a note
  // that EU-specific filtering requires database aggregation
  if (region === "eu") {
    // If EU stats are populated (from future RPC), use them
    if (stats.euCompanyCount > 0) {
      return {
        companyCount: stats.euCompanyCount,
        funding: stats.euFunding,
        employees: stats.euEmployees,
      };
    }
    // Otherwise return zeros to indicate no EU data available
    return { companyCount: 0, funding: 0, employees: 0 };
  }

  return {
    companyCount: stats.globalCompanyCount,
    funding: stats.globalFunding,
    employees: stats.globalEmployees,
  };
}
