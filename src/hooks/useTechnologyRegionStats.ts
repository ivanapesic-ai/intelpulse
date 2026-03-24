import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 1000;

// European countries list (EU27 + UK, Norway, Switzerland, Iceland)
const EUROPE_COUNTRIES = [
  "Germany", "France", "Netherlands", "Belgium", "Italy", "Spain", "Sweden", "Finland",
  "Denmark", "Ireland", "Austria", "Poland", "Portugal", "Czech Republic", "Czechia",
  "Hungary", "Romania", "Bulgaria", "Greece", "Slovakia", "Croatia", "Slovenia",
  "Lithuania", "Latvia", "Estonia", "Luxembourg", "Malta", "Cyprus",
  "United Kingdom", "Norway", "Switzerland", "Iceland", "Liechtenstein", "The Netherlands"
].map((country) => country.toLowerCase());

const USA_COUNTRIES = ["United States", "USA", "US"].map((country) => country.toLowerCase());

const CHINA_COUNTRIES = ["China", "People's Republic of China", "PRC", "Hong Kong", "Macau"].map((country) => country.toLowerCase());

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

interface RegionMappingRow {
  keyword_id: string | null;
  company_id: string | null;
  crunchbase_companies: {
    hq_country: string | null;
    total_funding_usd: number | null;
    number_of_employees: string | null;
  } | null;
}

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

function normalizeCountry(country: string | null): string {
  return (country || "").trim().toLowerCase();
}

async function fetchAllRegionMappings() {
  const allMappings: RegionMappingRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
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
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    const page = (data ?? []) as RegionMappingRow[];
    allMappings.push(...page);

    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allMappings;
}

/**
 * This hook fetches company data and aggregates stats by region.
 * Client-side filtering based on hq_country.
 */
export function useTechnologyRegionStats() {
  return useQuery({
    queryKey: ["technology-region-stats"],
    queryFn: async () => {
      const mappings = await fetchAllRegionMappings();
      const statsMap = new Map<string, TechnologyRegionStats>();

      for (const mapping of mappings) {
        if (!mapping.keyword_id || !mapping.crunchbase_companies) continue;

        const company = mapping.crunchbase_companies;
        const country = normalizeCountry(company.hq_country);
        const fundingEur = (company.total_funding_usd || 0) * 0.92;
        const employees = parseEmployeeCount(company.number_of_employees);

        const isEurope = EUROPE_COUNTRIES.includes(country);
        const isUSA = USA_COUNTRIES.includes(country);
        const isChina = CHINA_COUNTRIES.includes(country);

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
            chinaCompanyCount: 0,
            chinaFunding: 0,
            chinaEmployees: 0,
            globalCompanyCount: 0,
            globalFunding: 0,
            globalEmployees: 0,
          };
          statsMap.set(mapping.keyword_id, stats);
        }

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

        if (isChina) {
          stats.chinaCompanyCount++;
          stats.chinaFunding += fundingEur;
          stats.chinaEmployees += employees;
        }
      }

      return Array.from(statsMap.values());
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function getRegionStats(
  allStats: TechnologyRegionStats[] | undefined,
  keywordId: string | undefined,
  region: "all" | "europe" | "usa" | "china"
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

  if (region === "china") {
    return {
      companyCount: stats.chinaCompanyCount,
      funding: stats.chinaFunding,
      employees: stats.chinaEmployees,
    };
  }

  return {
    companyCount: stats.globalCompanyCount,
    funding: stats.globalFunding,
    employees: stats.globalEmployees,
  };
}
