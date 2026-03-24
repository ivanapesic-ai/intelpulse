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
// Extended to cover ALL active technology keywords in the taxonomy
export const KEYWORD_TO_IPC_MAP: Record<string, string[]> = {
  // === Autonomous Driving & Perception ===
  "lidar": ["G01S17"], // LiDAR-specific
  "radar": ["G01S13"], // Radar-specific
  "av radar": ["G01S13", "G01S7"],
  "av camera": ["G06V20", "H04N7", "G06T7"],
  "camera": ["G06V", "H04N"],
  "sensor fusion": ["G01S", "G06V", "G05D"],
  "autonomous driving": ["B60W60", "G05D1", "B60W30"],
  "autonomous vehicle": ["B60W60", "G05D1"],
  "self-driving": ["B60W60", "G05D1"],
  "self-driving vehicles": ["B60W60", "G05D1", "B60W30"],
  "adas": ["B60W30", "G01S", "B60W50"],
  "av software": ["G05D1", "B60W60", "G06N"],
  "av simulation": ["G06F30", "G05B17", "G06N3"],
  "av labeling": ["G06V10", "G06N20", "G06F18"],
  "autonomous mobile robots": ["B25J9", "G05D1", "B62D57"],
  
  // === Electric Mobility ===
  "electric vehicle": ["B60L", "H01M10"],
  "ev": ["B60L", "H01M10"],
  "bev": ["B60L", "H01M10"],
  "electric mobility": ["B60L", "H01M", "B60K"],
  "ev battery": ["H01M10", "H01M50", "H02J7"],
  "ev motor": ["H02K", "B60K1", "H02P"],
  "ev services": ["G06Q50", "B60L53", "G08G"],
  "sustainable mobility": ["B60K", "B60L", "G06Q50"],
  
  // === Battery & Energy Storage ===
  "battery": ["H01M"],
  "battery management": ["H01M10", "H02J7", "G01R31"],
  "battery management systems": ["H02J7", "G01R31", "H01M10"],
  "storage battery systems": ["H01M10", "H02J3", "H02J7"],
  "sbs": ["H01M10", "H02J3"],
  
  // === Charging Infrastructure ===
  "ev charging": ["H02J7", "B60L53"],
  "charging infrastructure": ["H02J7", "B60L53", "H02J3"],
  "smart recharging": ["H02J7", "H02J3", "G05F1"],
  "bidirectional charging": ["H02J7", "B60L55", "H02J3"],
  "v2g": ["B60L55", "H02J3", "H02J7"],
  "vehicle to grid": ["B60L55", "H02J3"],
  
  // === Grid & Energy Management ===
  "micro grid": ["H02J3", "H02J13", "G05F1"],
  "ems": ["G05F1", "H02J3", "G06Q50"],
  "energy management systems": ["G05F1", "H02J3", "H02J13"],
  
  // === Connectivity & V2X ===
  "v2x": ["H04W4", "G08G1"],
  "vehicle to everything": ["H04W4", "G08G1", "H04L67"],
  "connected car": ["H04W4", "G08G", "B60W"],
  "connectivity": ["H04W"],
  "telematics": ["H04W4", "G08G1", "G07C5"],
  "5g": ["H04W"],
  
  // === Software & Computing ===
  "software defined vehicle": ["B60W60", "G05D1", "G06F"],
  "sdv": ["B60W60", "G05D1", "G06F9"],
  "vehicle as software": ["B60W60", "G06F9", "G05D1"],
  "vas": ["B60W60", "G06F9"],
  "teledriving": ["G05D1", "H04W4", "B60W60"],
  "ota updates": ["G06F8/65", "H04L67"],
  "cybersecurity": ["H04L9", "G06F21"],
  "edge computing": ["G06F9", "H04L67"],
  
  // === AI & Vision ===
  "computer vision": ["G06V"],
  "machine learning": ["G06N"],
  "ai": ["G06N"],
  
  // === Vehicle Systems ===
  "infotainment": ["B60R16", "H04W4"],
  "hmi": ["B60K35", "G06F3"],
  "digital cockpit": ["B60K35", "B60R16"],
  "fleet management": ["G08G1", "G06Q10"],
  "traffic management": ["G08G1"],
  "smart mobility": ["G08G1", "B60W"],
  "smart logistics": ["G06Q10", "G08G1", "B65G"],
  
  // === Smart Infrastructure ===
  "smart city": ["G08G1", "H04L67", "G06Q50"],
  "smart cities": ["G08G1", "H04L67", "G06Q50"],
  "smart grid": ["H02J3", "H02J13", "G05F1"],
  "logistics tech": ["G06Q10", "B65G", "G08G1"],
  "supply chain": ["G06Q10", "G06Q30"],
  "supply chain management": ["G06Q10", "G06Q30", "G06Q50"],
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

      const payload = companies
        .filter((c) => !!c.organization_name)
        .map((c) => ({ id: c.id, name: c.organization_name }));

      const { data, error } = await supabase.functions.invoke("epo-patent-lookup", {
        body: { action: "enrich_companies", companies: payload },
      });

      if (error) throw error;

      const rawResults = (data?.results || []) as Array<{
        id: string;
        name: string;
        patentCount: number;
      }>;

      return {
        enriched: Number(data?.enriched ?? rawResults.length ?? 0),
        total: Number(data?.total ?? companies.length ?? 0),
        results: rawResults.map((r) => ({ name: r.name, patentCount: r.patentCount })),
      };
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
      queryClient.invalidateQueries({ queryKey: ["technology-intelligence"] });
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
