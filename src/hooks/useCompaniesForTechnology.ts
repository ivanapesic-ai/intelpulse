import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CompanyForTechnology {
  id: string;
  name: string;
  tagline?: string;
  website?: string;
  hqCountry?: string;
  hqLocation?: string;
  foundedDate?: string;
  employeesCount: string;
  totalFundingUsd: number;
  industries: string[];
  operatingStatus?: string;
  matchConfidence?: number;
}

// Fetch companies linked to a specific technology keyword
export function useCompaniesForTechnology(keywordId?: string) {
  return useQuery({
    queryKey: ["companies-for-technology", keywordId],
    queryFn: async () => {
      if (!keywordId) return [];

      // Get company IDs from crunchbase_keyword_mapping
      const { data: mappings, error: mappingError } = await supabase
        .from("crunchbase_keyword_mapping")
        .select("company_id, match_confidence")
        .eq("keyword_id", keywordId);

      if (mappingError) throw mappingError;
      if (!mappings || mappings.length === 0) return [];

      const companyIds = mappings.map(m => m.company_id).filter(Boolean) as string[];
      const confidenceMap = new Map(mappings.map(m => [m.company_id, m.match_confidence]));

      // Fetch company details in batches to avoid URL length limits
      const batchSize = 100;
      const chunks: string[][] = [];
      for (let i = 0; i < companyIds.length; i += batchSize) {
        chunks.push(companyIds.slice(i, i + batchSize));
      }
      const batchResults = await Promise.all(
        chunks.map(async (chunk) => {
          const { data, error } = await supabase
            .from("crunchbase_companies")
            .select("*")
            .in("id", chunk);
          if (error) throw error;
          return data || [];
        }),
      );
      const companies = batchResults.flat().sort((a, b) => 
        (Number(b.total_funding_usd) || 0) - (Number(a.total_funding_usd) || 0)
      );

      return (companies || []).map((row): CompanyForTechnology => ({
        id: row.id,
        name: row.organization_name,
        tagline: row.description || undefined,
        website: row.website || undefined,
        hqCountry: row.hq_country || undefined,
        hqLocation: row.hq_location || undefined,
        foundedDate: row.founded_date || undefined,
        employeesCount: row.number_of_employees || "Unknown",
        totalFundingUsd: Number(row.total_funding_usd) || 0,
        industries: row.industries || [],
        operatingStatus: row.operating_status || "Active",
        matchConfidence: confidenceMap.get(row.id) || undefined,
      }));
    },
    enabled: !!keywordId,
  });
}

// Fetch EU country statistics from real dealroom data
export function useEUCountryStats() {
  return useQuery({
    queryKey: ["eu-country-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dealroom_companies")
        .select("hq_country, total_funding_eur, employees_count");

      if (error) throw error;

      // Map country names to ISO codes
      const countryCodeMap: Record<string, string> = {
        "Germany": "DE",
        "France": "FR",
        "United Kingdom": "GB",
        "Netherlands": "NL",
        "Belgium": "BE",
        "Spain": "ES",
        "Italy": "IT",
        "Sweden": "SE",
        "Finland": "FI",
        "Denmark": "DK",
        "Ireland": "IE",
        "Austria": "AT",
        "Poland": "PL",
        "Portugal": "PT",
        "Czech Republic": "CZ",
        "Czechia": "CZ",
        "Hungary": "HU",
        "Romania": "RO",
        "Bulgaria": "BG",
        "Greece": "GR",
        "Slovakia": "SK",
        "Croatia": "HR",
        "Slovenia": "SI",
        "Lithuania": "LT",
        "Latvia": "LV",
        "Estonia": "EE",
        "Luxembourg": "LU",
        "Malta": "MT",
        "Cyprus": "CY",
        "Norway": "NO",
        "Switzerland": "CH",
      };

      // Focus areas by country (simplified mapping)
      const focusMap: Record<string, string> = {
        "DE": "AI & Industrial",
        "FR": "AI & Energy",
        "GB": "FinTech & AI",
        "NL": "AgriTech & Green",
        "BE": "Biotech & Clean",
        "ES": "Renewables",
        "IT": "Manufacturing",
        "SE": "CleanTech",
        "FI": "Gaming & IoT",
        "DK": "GreenTech",
        "IE": "Tech & Pharma",
        "AT": "DeepTech",
        "PL": "IT Services",
        "PT": "Travel & SaaS",
        "CZ": "Cybersecurity",
        "HU": "Software",
        "RO": "IT Services",
        "BG": "Outsourcing",
        "GR": "Tourism Tech",
        "SK": "Automotive",
        "HR": "IT & Tourism",
        "SI": "Manufacturing",
        "LT": "FinTech",
        "LV": "Logistics",
        "EE": "Digital ID",
        "LU": "FinTech",
        "MT": "iGaming",
        "CY": "Shipping Tech",
        "NO": "Energy & Maritime",
        "CH": "Biotech & Finance",
      };

      const stats = (data || []).reduce((acc, company) => {
        const country = company.hq_country || "Unknown";
        if (!acc[country]) {
          acc[country] = { companyCount: 0, totalFunding: 0, totalEmployees: 0 };
        }
        acc[country].companyCount++;
        acc[country].totalFunding += Number(company.total_funding_eur) || 0;
        acc[country].totalEmployees += company.employees_count || 0;
        return acc;
      }, {} as Record<string, { companyCount: number; totalFunding: number; totalEmployees: number }>);

      return Object.entries(stats)
        .filter(([country]) => countryCodeMap[country]) // Only EU countries
        .map(([country, data]) => ({
          country,
          code: countryCodeMap[country],
          techCount: data.companyCount, // Using company count as proxy for tech activity
          funding: data.totalFunding,
          focus: focusMap[countryCodeMap[country]] || "Technology",
          employees: data.totalEmployees,
        }))
        .sort((a, b) => b.techCount - a.techCount);
    },
  });
}
