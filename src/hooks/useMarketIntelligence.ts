 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 
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
 
export function useMarketIntelligence(keywordId?: string) {
  return useQuery({
    queryKey: ["market-intelligence", keywordId],
    queryFn: async (): Promise<MarketIntelligenceData> => {
      const empty: MarketIntelligenceData = {
        totalCompanies: 0,
        totalFunding: 0,
        totalEmployees: 0,
        euCompanies: 0,
        euPercentage: 0,
        topInvestors: [],
        countryDistribution: [],
        stageDistribution: [],
      };

      if (!keywordId) return empty;

      // Get company IDs from Crunchbase keyword mapping
      const { data: mappings, error: mappingError } = await supabase
        .from("crunchbase_keyword_mapping")
        .select("company_id")
        .eq("keyword_id", keywordId);

      if (mappingError) throw mappingError;
      if (!mappings || mappings.length === 0) return empty;

      const companyIds = mappings.map(m => m.company_id).filter(Boolean) as string[];

      // Fetch Crunchbase company details in batches to avoid URL length limits
      const BATCH_SIZE = 100;
      const chunks: string[][] = [];
      for (let i = 0; i < companyIds.length; i += BATCH_SIZE) {
        chunks.push(companyIds.slice(i, i + BATCH_SIZE));
      }
      const batchResults = await Promise.all(
        chunks.map(async (chunk) => {
          const { data, error } = await supabase
            .from("crunchbase_companies")
            .select("organization_name, description, hq_country, total_funding_usd, number_of_employees, top_5_investors, lead_investors, last_funding_type, operating_status")
            .in("id", chunk);
          if (error) throw error;
          return data || [];
        }),
      );
      const companies = batchResults.flat();

      if (companies.length === 0) return empty;
 
       // Calculate totals
       const totalCompanies = companies.length;
       // Convert USD to EUR (approximate rate 0.92)
       const totalFundingUsd = companies.reduce((sum, c) => sum + (Number(c.total_funding_usd) || 0), 0);
       const totalFunding = Math.round(totalFundingUsd * 0.92);
       const totalEmployees = companies.reduce((sum, c) => sum + parseEmployeeCount(c.number_of_employees), 0);
       const euCompanies = companies.filter(c => EU_COUNTRIES.includes(c.hq_country || "")).length;
       const euPercentage = totalCompanies > 0 ? Math.round((euCompanies / totalCompanies) * 100) : 0;
 
       // Aggregate investors across all companies (combine top_5 and lead investors)
       const investorMap = new Map<string, number>();
       companies.forEach(c => {
         const allInvestors = [
           ...(c.top_5_investors || []),
           ...(c.lead_investors || []),
         ];
         // Dedupe per company
         const uniqueInvestors = [...new Set(allInvestors)];
         uniqueInvestors.forEach(investor => {
           if (investor && investor.trim()) {
             investorMap.set(investor, (investorMap.get(investor) || 0) + 1);
           }
         });
       });
       const topInvestors: InvestorCount[] = Array.from(investorMap.entries())
         .map(([name, count]) => ({ name, count }))
         .filter(inv => inv.count >= 1)
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
 
       // Funding stage distribution (using last_funding_type)
       const stageMap = new Map<string, number>();
       companies.forEach(c => {
         const stage = c.last_funding_type || "Unknown";
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
         topInvestors,
         countryDistribution,
         stageDistribution,
       };
     },
     enabled: !!keywordId,
   });
 }