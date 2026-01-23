import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CompanyForTechnology {
  id: string;
  dealroomId: string;
  name: string;
  tagline?: string;
  website?: string;
  hqCountry?: string;
  hqCity?: string;
  foundedYear?: number;
  employeesCount: number;
  totalFundingEur: number;
  growthStage?: string;
  status?: string;
  acquiredBy?: string;
  industries: string[];
  relevanceScore?: number;
}

// Fetch companies linked to a specific technology keyword
export function useCompaniesForTechnology(keywordId?: string) {
  return useQuery({
    queryKey: ["companies-for-technology", keywordId],
    queryFn: async () => {
      if (!keywordId) return [];

      // First get company IDs from the mapping
      const { data: mappings, error: mappingError } = await supabase
        .from("keyword_company_mapping")
        .select("company_id, relevance_score")
        .eq("keyword_id", keywordId);

      if (mappingError) throw mappingError;
      if (!mappings || mappings.length === 0) return [];

      const companyIds = mappings.map(m => m.company_id).filter(Boolean) as string[];
      const relevanceMap = new Map(mappings.map(m => [m.company_id, m.relevance_score]));

      // Fetch company details
      const { data: companies, error: companyError } = await supabase
        .from("dealroom_companies")
        .select("*")
        .in("id", companyIds)
        .order("total_funding_eur", { ascending: false });

      if (companyError) throw companyError;

      return (companies || []).map((row): CompanyForTechnology => ({
        id: row.id,
        dealroomId: row.dealroom_id,
        name: row.name,
        tagline: row.tagline || undefined,
        website: row.website || undefined,
        hqCountry: row.hq_country || undefined,
        hqCity: row.hq_city || undefined,
        foundedYear: row.founded_year || undefined,
        employeesCount: row.employees_count || 0,
        totalFundingEur: Number(row.total_funding_eur) || 0,
        growthStage: row.growth_stage || undefined,
        status: row.status || "active",
        acquiredBy: row.acquired_by || undefined,
        industries: row.industries || [],
        relevanceScore: relevanceMap.get(row.id) || undefined,
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
