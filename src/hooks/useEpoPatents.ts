import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PatentResult {
  publicationNumber: string;
  title: string;
  applicant: string;
  filingDate: string;
  publicationDate: string;
  ipcCodes: string[];
  abstract?: string;
}

export interface CompanyPatentSummary {
  companyName: string;
  patentCount: number;
  patents: PatentResult[];
  ipcDistribution: Record<string, number>;
  recentFilings: number;
}

export interface BatchSearchResult {
  summaries: CompanyPatentSummary[];
}

// IPC codes relevant to automotive/mobility technologies
export const AUTOMOTIVE_IPC_CODES: Record<string, string> = {
  "B60W": "Conjoint control of vehicle sub-units",
  "B60L": "Electric propulsion of vehicles",
  "B60R": "Vehicles, vehicle fittings, or vehicle parts",
  "G01S": "Radio/optical navigation/detection (LiDAR, radar)",
  "G05D": "Systems for controlling vehicles",
  "G06V": "Image/video recognition",
  "H01M": "Batteries",
  "H02J": "Circuit arrangements for charging batteries",
  "H04W": "Wireless communication networks (V2X)",
  "G08G": "Traffic control systems",
};

// Map technology keywords to IPC codes for keyword-first patent search
export const KEYWORD_TO_IPC_MAP: Record<string, string[]> = {
  "lidar": ["G01S"],
  "radar": ["G01S"],
  "camera": ["G06V", "H04N"],
  "sensor fusion": ["G01S", "G06V"],
  "autonomous driving": ["B60W", "G05D"],
  "autonomous vehicle": ["B60W", "G05D"],
  "self-driving": ["B60W", "G05D"],
  "adas": ["B60W", "G01S"],
  "electric vehicle": ["B60L", "H01M"],
  "ev": ["B60L", "H01M"],
  "bev": ["B60L", "H01M"],
  "battery": ["H01M"],
  "battery management": ["H01M", "H02J"],
  "ev charging": ["H02J", "B60L"],
  "charging infrastructure": ["H02J"],
  "v2x": ["H04W", "G08G"],
  "vehicle to everything": ["H04W", "G08G"],
  "connected car": ["H04W", "G08G"],
  "connectivity": ["H04W"],
  "software defined vehicle": ["B60W", "G05D"],
  "sdv": ["B60W", "G05D"],
  "fleet management": ["G08G", "G06Q"],
  "traffic management": ["G08G"],
  "smart mobility": ["G08G", "B60W"],
  "telematics": ["H04W", "G08G"],
  "infotainment": ["B60R", "H04W"],
  "hmi": ["B60K", "G06F"],
  "digital cockpit": ["B60K", "B60R"],
  "ota updates": ["G06F", "H04L"],
  "cybersecurity": ["H04L", "G06F"],
  "edge computing": ["G06F", "H04L"],
  "5g": ["H04W"],
  "computer vision": ["G06V"],
  "machine learning": ["G06N"],
  "ai": ["G06N"],
};

export function useEpoCompanySearch() {
  return useMutation({
    mutationFn: async (companyName: string): Promise<CompanyPatentSummary> => {
      const { data, error } = await supabase.functions.invoke("epo-patent-lookup", {
        body: { action: "search_company", companyName },
      });

      if (error) throw error;
      return data;
    },
  });
}

export function useEpoBatchSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (companyNames: string[]): Promise<BatchSearchResult> => {
      const { data, error } = await supabase.functions.invoke("epo-patent-lookup", {
        body: { action: "batch_search", companyNames },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epo-patents"] });
    },
  });
}

export interface TechnologyPatentResult {
  keyword: string;
  ipcCodes: string[];
  totalPatents: number;
  topApplicants: Array<{ name: string; count: number }>;
  recentPatents: PatentResult[];
}

export function useEpoIpcSearch() {
  return useMutation({
    mutationFn: async (ipcCode: string) => {
      const { data, error } = await supabase.functions.invoke("epo-patent-lookup", {
        body: { action: "search_ipc", ipcCode },
      });

      if (error) throw error;
      return data;
    },
  });
}

// Search patents by technology keyword (maps to IPC codes)
export function useEpoKeywordSearch() {
  return useMutation({
    mutationFn: async (keyword: string): Promise<TechnologyPatentResult> => {
      const normalizedKeyword = keyword.toLowerCase().trim();
      
      // Find matching IPC codes
      let matchedIpcCodes: string[] = [];
      for (const [kw, codes] of Object.entries(KEYWORD_TO_IPC_MAP)) {
        if (normalizedKeyword.includes(kw) || kw.includes(normalizedKeyword)) {
          matchedIpcCodes = [...new Set([...matchedIpcCodes, ...codes])];
        }
      }
      
      // If no keyword match, try direct IPC code
      if (matchedIpcCodes.length === 0) {
        const upperKeyword = keyword.toUpperCase();
        if (AUTOMOTIVE_IPC_CODES[upperKeyword]) {
          matchedIpcCodes = [upperKeyword];
        }
      }
      
      if (matchedIpcCodes.length === 0) {
        return {
          keyword,
          ipcCodes: [],
          totalPatents: 0,
          topApplicants: [],
          recentPatents: [],
        };
      }
      
      // Search all matched IPC codes
      const allPatents: PatentResult[] = [];
      for (const ipcCode of matchedIpcCodes.slice(0, 3)) {
        const { data, error } = await supabase.functions.invoke("epo-patent-lookup", {
          body: { action: "search_ipc_detailed", ipcCode, maxResults: 30 },
        });
        
        if (!error && data?.patents) {
          allPatents.push(...data.patents);
        }
        // Rate limiting
        await new Promise(r => setTimeout(r, 300));
      }
      
      // Extract and count applicants (companies)
      const applicantCounts: Record<string, number> = {};
      for (const patent of allPatents) {
        if (patent.applicant) {
          // Clean company name
          const cleanName = patent.applicant
            .replace(/\s+(Inc|Corp|Ltd|LLC|GmbH|AG|SA|BV|NV|SE|PLC|S\.A\.|Co\.|Company)\.?$/i, "")
            .trim();
          applicantCounts[cleanName] = (applicantCounts[cleanName] || 0) + 1;
        }
      }
      
      // Sort by count
      const topApplicants = Object.entries(applicantCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([name, count]) => ({ name, count }));
      
      return {
        keyword,
        ipcCodes: matchedIpcCodes,
        totalPatents: allPatents.length,
        topApplicants,
        recentPatents: allPatents.slice(0, 10),
      };
    },
  });
}

export function useEpoPatentDetails() {
  return useMutation({
    mutationFn: async (publicationNumber: string): Promise<PatentResult | null> => {
      const { data, error } = await supabase.functions.invoke("epo-patent-lookup", {
        body: { action: "get_details", publicationNumber },
      });

      if (error) throw error;
      return data;
    },
  });
}

// Enrich Crunchbase companies with patent counts
export function useEnrichWithPatents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options?: { limit?: number }): Promise<{
      enriched: number;
      total: number;
      results: Array<{ name: string; patentCount: number }>;
    }> => {
      // Get companies needing EPO enrichment (0 or NULL patents)
      const { data: companies, error: fetchError } = await supabase
        .from("crunchbase_companies")
        .select("id, organization_name, patents_count")
        .or("patents_count.is.null,patents_count.eq.0")
        .order("total_funding_usd", { ascending: false })
        .limit(options?.limit || 20);

      if (fetchError) throw fetchError;
      if (!companies || companies.length === 0) {
        return { enriched: 0, total: 0, results: [] };
      }

      const companyNames = companies.map((c) => c.organization_name);

      // Batch search patents
      const { data, error } = await supabase.functions.invoke("epo-patent-lookup", {
        body: { action: "batch_search", companyNames },
      });

      if (error) throw error;

      const summaries = data.summaries as CompanyPatentSummary[];
      const results: Array<{ name: string; patentCount: number }> = [];
      let enriched = 0;

      // Update companies with patent counts
      for (let i = 0; i < companies.length; i++) {
        const company = companies[i];
        const summary = summaries.find(
          (s) => s.companyName === company.organization_name
        );

        if (summary) {
          const { error: updateError } = await supabase
            .from("crunchbase_companies")
            .update({ patents_count: summary.patentCount })
            .eq("id", company.id);

          if (!updateError) {
            enriched++;
            results.push({
              name: company.organization_name,
              patentCount: summary.patentCount,
            });
          }
        }
      }

      return { enriched, total: companies.length, results };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crunchbase-companies"] });
      queryClient.invalidateQueries({ queryKey: ["crunchbase-stats"] });
    },
  });
}

// Aggregate patent counts from companies to technology keywords
export function useAggregatePatentScores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{
      keywords_updated: number;
      total_patents_aggregated: number;
    }> => {
      const { data, error } = await supabase.rpc("aggregate_patent_scores");

      if (error) throw error;
      
      // RPC returns array, get first row
      const result = Array.isArray(data) ? data[0] : data;
      return {
        keywords_updated: result?.keywords_updated || 0,
        total_patents_aggregated: result?.total_patents_aggregated || 0,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technologies"] });
    },
  });
}

// Aggregate all Crunchbase signals (funding, patents, employees) to keywords
export function useAggregateCrunchbaseSignals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{
      keywords_processed: number;
      total_funding_aggregated: number;
      total_patents_aggregated: number;
      companies_with_data: number;
    }> => {
      const { data, error } = await supabase.rpc("aggregate_crunchbase_signals");

      if (error) throw error;
      
      const result = Array.isArray(data) ? data[0] : data;
      return {
        keywords_processed: result?.keywords_processed || 0,
        total_funding_aggregated: result?.total_funding_aggregated || 0,
        total_patents_aggregated: result?.total_patents_aggregated || 0,
        companies_with_data: result?.companies_with_data || 0,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technologies"] });
      queryClient.invalidateQueries({ queryKey: ["technology-intelligence"] });
    },
  });
}
