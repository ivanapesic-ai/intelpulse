import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Acquisition {
  acquirer: string;
  targetName: string;
  targetTagline?: string;
  amount?: number;
  date?: string;
}

interface AcquirerSummary {
  acquirer: string;
  count: number;
}

interface InvestorCount {
  name: string;
  count: number;
}

interface CountryDistribution {
  country: string;
  count: number;
  percentage: number;
}

interface StageDistribution {
  stage: string;
  count: number;
  percentage: number;
}

interface MarketIntelligenceData {
  totalCompanies: number;
  totalFunding: number;
  totalEmployees: number;
  euCompanies: number;
  euPercentage: number;
  acquisitions: Acquisition[];
  acquirerSummary: AcquirerSummary[];
  topInvestors: InvestorCount[];
  countryDistribution: CountryDistribution[];
  stageDistribution: StageDistribution[];
}

const EU_COUNTRIES = [
  "Germany", "France", "Netherlands", "Belgium", "Italy", "Spain", "Sweden", "Finland",
  "Denmark", "Ireland", "Austria", "Poland", "Portugal", "Czech Republic", "Czechia",
  "Hungary", "Romania", "Bulgaria", "Greece", "Slovakia", "Croatia", "Slovenia",
  "Lithuania", "Latvia", "Estonia", "Luxembourg", "Malta", "Cyprus"
];

export function useMarketIntelligence(keywordId?: string) {
  return useQuery({
    queryKey: ["market-intelligence", keywordId],
    queryFn: async (): Promise<MarketIntelligenceData> => {
      if (!keywordId) {
        return {
          totalCompanies: 0,
          totalFunding: 0,
          totalEmployees: 0,
          euCompanies: 0,
          euPercentage: 0,
          acquisitions: [],
          acquirerSummary: [],
          topInvestors: [],
          countryDistribution: [],
          stageDistribution: [],
        };
      }

      // First get company IDs from the mapping
      const { data: mappings, error: mappingError } = await supabase
        .from("keyword_company_mapping")
        .select("company_id")
        .eq("keyword_id", keywordId);

      if (mappingError) throw mappingError;
      if (!mappings || mappings.length === 0) {
        return {
          totalCompanies: 0,
          totalFunding: 0,
          totalEmployees: 0,
          euCompanies: 0,
          euPercentage: 0,
          acquisitions: [],
          acquirerSummary: [],
          topInvestors: [],
          countryDistribution: [],
          stageDistribution: [],
        };
      }

      const companyIds = mappings.map(m => m.company_id).filter(Boolean) as string[];

      // Fetch company details
      const { data: companies, error: companyError } = await supabase
        .from("dealroom_companies")
        .select("name, tagline, hq_country, total_funding_eur, employees_count, investors, growth_stage, status, acquired_by, acquired_date, acquisition_amount_eur")
        .in("id", companyIds);

      if (companyError) throw companyError;
      if (!companies || companies.length === 0) {
        return {
          totalCompanies: 0,
          totalFunding: 0,
          totalEmployees: 0,
          euCompanies: 0,
          euPercentage: 0,
          acquisitions: [],
          acquirerSummary: [],
          topInvestors: [],
          countryDistribution: [],
          stageDistribution: [],
        };
      }

      // Calculate totals
      const totalCompanies = companies.length;
      const totalFunding = companies.reduce((sum, c) => sum + (Number(c.total_funding_eur) || 0), 0);
      const totalEmployees = companies.reduce((sum, c) => sum + (c.employees_count || 0), 0);
      const euCompanies = companies.filter(c => EU_COUNTRIES.includes(c.hq_country || "")).length;
      const euPercentage = totalCompanies > 0 ? Math.round((euCompanies / totalCompanies) * 100) : 0;

      // Extract acquisitions
      const acquisitions: Acquisition[] = companies
        .filter(c => c.acquired_by)
        .map(c => ({
          acquirer: c.acquired_by as string,
          targetName: c.name,
          targetTagline: c.tagline || undefined,
          amount: c.acquisition_amount_eur ? Number(c.acquisition_amount_eur) : undefined,
          date: c.acquired_date || undefined,
        }))
        .sort((a, b) => (b.amount || 0) - (a.amount || 0));

      // Summarize by acquirer
      const acquirerMap = new Map<string, number>();
      acquisitions.forEach(acq => {
        acquirerMap.set(acq.acquirer, (acquirerMap.get(acq.acquirer) || 0) + 1);
      });
      const acquirerSummary: AcquirerSummary[] = Array.from(acquirerMap.entries())
        .map(([acquirer, count]) => ({ acquirer, count }))
        .sort((a, b) => b.count - a.count);

      // Aggregate investors across all companies
      const investorMap = new Map<string, number>();
      companies.forEach(c => {
        const investors = c.investors as string[] | null;
        if (investors && Array.isArray(investors)) {
          investors.forEach(investor => {
            if (investor && investor.trim()) {
              investorMap.set(investor, (investorMap.get(investor) || 0) + 1);
            }
          });
        }
      });
      const topInvestors: InvestorCount[] = Array.from(investorMap.entries())
        .map(([name, count]) => ({ name, count }))
        .filter(inv => inv.count >= 1) // Only investors with at least 1 investment
        .sort((a, b) => b.count - a.count);

      // Country distribution
      const countryMap = new Map<string, number>();
      companies.forEach(c => {
        if (c.hq_country) {
          countryMap.set(c.hq_country, (countryMap.get(c.hq_country) || 0) + 1);
        }
      });
      const countryDistribution: CountryDistribution[] = Array.from(countryMap.entries())
        .map(([country, count]) => ({
          country,
          count,
          percentage: Math.round((count / totalCompanies) * 100),
        }))
        .sort((a, b) => b.count - a.count);

      // Growth stage distribution
      const stageMap = new Map<string, number>();
      companies.forEach(c => {
        const stage = c.growth_stage || "Unknown";
        stageMap.set(stage, (stageMap.get(stage) || 0) + 1);
      });
      const stageDistribution: StageDistribution[] = Array.from(stageMap.entries())
        .map(([stage, count]) => ({
          stage,
          count,
          percentage: Math.round((count / totalCompanies) * 100),
        }))
        .filter(s => s.stage !== "Unknown")
        .sort((a, b) => b.count - a.count);

      return {
        totalCompanies,
        totalFunding,
        totalEmployees,
        euCompanies,
        euPercentage,
        acquisitions,
        acquirerSummary,
        topInvestors,
        countryDistribution,
        stageDistribution,
      };
    },
    enabled: !!keywordId,
  });
}
