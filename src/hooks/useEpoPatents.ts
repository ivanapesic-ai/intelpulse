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
      // Get companies without patent data
      const { data: companies, error: fetchError } = await supabase
        .from("crunchbase_companies")
        .select("id, organization_name, patents_count")
        .is("patents_count", null)
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
