import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// EU member states (27) + EEA countries
const EU_COUNTRIES = new Set([
  "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Czechia",
  "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary",
  "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands",
  "Poland", "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden",
  // EEA
  "Norway", "Iceland", "Liechtenstein",
]);

interface TechnologyRegionStats {
  keywordId: string;
  euCompanyCount: number;
  euFunding: number;
  euEmployees: number;
  globalCompanyCount: number;
  globalFunding: number;
  globalEmployees: number;
}

export function useTechnologyRegionStats() {
  return useQuery({
    queryKey: ["technology-region-stats"],
    queryFn: async () => {
      // Get all keyword-company mappings from Crunchbase with company details
      const { data: mappings, error: mappingError } = await supabase
        .from("crunchbase_keyword_mapping")
        .select(`
          keyword_id,
          company:crunchbase_companies (
            id,
            hq_country,
            total_funding_usd,
            number_of_employees
          )
        `);

      if (mappingError) throw mappingError;

      // Aggregate stats by keyword
      const statsMap = new Map<string, TechnologyRegionStats>();

      for (const mapping of mappings || []) {
        const keywordId = mapping.keyword_id;
        const company = mapping.company as {
          id: string;
          hq_country: string | null;
          total_funding_usd: number | null;
          number_of_employees: string | null;
        } | null;

        if (!keywordId || !company) continue;

        if (!statsMap.has(keywordId)) {
          statsMap.set(keywordId, {
            keywordId,
            euCompanyCount: 0,
            euFunding: 0,
            euEmployees: 0,
            globalCompanyCount: 0,
            globalFunding: 0,
            globalEmployees: 0,
          });
        }

        const stats = statsMap.get(keywordId)!;
        // Convert USD to EUR (approximate rate 0.92)
        const fundingUsd = Number(company.total_funding_usd) || 0;
        const fundingEur = fundingUsd * 0.92;
        // Parse employee count (Crunchbase stores as string range like "51-100")
        const employees = parseEmployeeCount(company.number_of_employees);
        const isEU = company.hq_country && EU_COUNTRIES.has(company.hq_country);

        // Global always includes everything
        stats.globalCompanyCount++;
        stats.globalFunding += fundingEur;
        stats.globalEmployees += employees;

        // EU only includes EU countries
        if (isEU) {
          stats.euCompanyCount++;
          stats.euFunding += fundingEur;
          stats.euEmployees += employees;
        }
      }

      return Array.from(statsMap.values());
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Parse Crunchbase employee count strings (e.g., "51-100", "1001-5000")
function parseEmployeeCount(value: string | null): number {
  if (!value) return 0;
  
  // Handle numeric strings
  const num = parseInt(value, 10);
  if (!isNaN(num)) return num;
  
  // Handle ranges like "51-100" - take midpoint
  const rangeMatch = value.match(/(\d+)-(\d+)/);
  if (rangeMatch) {
    const low = parseInt(rangeMatch[1], 10);
    const high = parseInt(rangeMatch[2], 10);
    return Math.round((low + high) / 2);
  }
  
  // Handle "10001+" style
  const plusMatch = value.match(/(\d+)\+/);
  if (plusMatch) {
    return parseInt(plusMatch[1], 10);
  }
  
  return 0;
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

  if (region === "eu") {
    return {
      companyCount: stats.euCompanyCount,
      funding: stats.euFunding,
      employees: stats.euEmployees,
    };
  }

  return {
    companyCount: stats.globalCompanyCount,
    funding: stats.globalFunding,
    employees: stats.globalEmployees,
  };
}
