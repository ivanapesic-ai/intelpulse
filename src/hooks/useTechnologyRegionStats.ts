import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// European countries list (EU27 + UK, Norway, Switzerland, Iceland)
const EUROPE_COUNTRIES = [
  "Germany", "France", "Netherlands", "Belgium", "Italy", "Spain", "Sweden", "Finland",
  "Denmark", "Ireland", "Austria", "Poland", "Portugal", "Czech Republic", "Czechia",
  "Hungary", "Romania", "Bulgaria", "Greece", "Slovakia", "Croatia", "Slovenia",
  "Lithuania", "Latvia", "Estonia", "Luxembourg", "Malta", "Cyprus",
  "United Kingdom", "Norway", "Switzerland", "Iceland", "Liechtenstein"
];

const USA_COUNTRIES = ["United States", "USA", "US"];

const CHINA_COUNTRIES = ["China", "People's Republic of China", "PRC", "Hong Kong", "Macau"];

interface TechnologyRegionStats {
  keywordId: string;
  europeCompanyCount: number;
  europeFunding: number;
  europeEmployees: number;
  usaCompanyCount: number;
  usaFunding: number;
  usaEmployees: number;
  chinaCompanyCount: number;
  chinaFunding: number;
  chinaEmployees: number;
  globalCompanyCount: number;
  globalFunding: number;
  globalEmployees: number;
}

// Parse employee count string to number (e.g., "51-100" -> 75)
function parseEmployeeCount(employeeStr: string | null): number {
  if (!employeeStr) return 0;
  const ranges: Record<string, number> = {
    "1-10": 5,
    "11-50": 30,
    "51-100": 75,
    "101-250": 175,
    "251-500": 375,
    "501-1000": 750,
    "1001-5000": 3000,
    "5001-10000": 7500,
    "10001+": 15000,
  };
  return ranges[employeeStr] || 0;
}

/**
 * This hook fetches company data and aggregates stats by region (Europe, USA, Both).
 * Client-side filtering based on hq_country.
 */
export function useTechnologyRegionStats() {
  return useQuery({
    queryKey: ["technology-region-stats"],
    queryFn: async () => {
      // Fetch all keyword mappings with company details
      const { data: mappings, error: mappingError } = await supabase
        .from("crunchbase_keyword_mapping")
        .select(`
          keyword_id,
          company_id,
          crunchbase_companies!inner (
            hq_country,
            total_funding_usd,
            number_of_employees
          )
        `)
        .limit(10000);

      if (mappingError) throw mappingError;

      // Build stats map by keyword
      const statsMap = new Map<string, TechnologyRegionStats>();

      for (const mapping of mappings || []) {
        if (!mapping.keyword_id || !mapping.crunchbase_companies) continue;

        const company = mapping.crunchbase_companies as {
          hq_country: string | null;
          total_funding_usd: number | null;
          number_of_employees: string | null;
        };

        const country = company.hq_country || "";
        const fundingEur = (company.total_funding_usd || 0) * 0.92; // USD to EUR
        const employees = parseEmployeeCount(company.number_of_employees);

        const isEurope = EUROPE_COUNTRIES.some(c => 
          country.toLowerCase() === c.toLowerCase()
        );
        const isUSA = USA_COUNTRIES.some(c => 
          country.toLowerCase() === c.toLowerCase()
        );

        // Get or create stats entry
        let stats = statsMap.get(mapping.keyword_id);
        if (!stats) {
          stats = {
            keywordId: mapping.keyword_id,
            europeCompanyCount: 0,
            europeFunding: 0,
            europeEmployees: 0,
            usaCompanyCount: 0,
            usaFunding: 0,
            usaEmployees: 0,
            globalCompanyCount: 0,
            globalFunding: 0,
            globalEmployees: 0,
          };
          statsMap.set(mapping.keyword_id, stats);
        }

        // Aggregate by region
        stats.globalCompanyCount++;
        stats.globalFunding += fundingEur;
        stats.globalEmployees += employees;

        if (isEurope) {
          stats.europeCompanyCount++;
          stats.europeFunding += fundingEur;
          stats.europeEmployees += employees;
        }

        if (isUSA) {
          stats.usaCompanyCount++;
          stats.usaFunding += fundingEur;
          stats.usaEmployees += employees;
        }
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
  region: "all" | "europe" | "usa"
): { companyCount: number; funding: number; employees: number } {
  if (!allStats || !keywordId) {
    return { companyCount: 0, funding: 0, employees: 0 };
  }

  const stats = allStats.find((s) => s.keywordId === keywordId);
  if (!stats) {
    return { companyCount: 0, funding: 0, employees: 0 };
  }

  if (region === "europe") {
    return {
      companyCount: stats.europeCompanyCount,
      funding: stats.europeFunding,
      employees: stats.europeEmployees,
    };
  }

  if (region === "usa") {
    return {
      companyCount: stats.usaCompanyCount,
      funding: stats.usaFunding,
      employees: stats.usaEmployees,
    };
  }

  // "all" in UI means "Both" (Europe + USA), not worldwide totals.
  return {
    companyCount: stats.europeCompanyCount + stats.usaCompanyCount,
    funding: stats.europeFunding + stats.usaFunding,
    employees: stats.europeEmployees + stats.usaEmployees,
  };
}
