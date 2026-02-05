import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// IPC codes mapped to technology keywords for direct EPO searches
export const TECHNOLOGY_IPC_MAP: Record<string, string[]> = {
  // Perception & Sensing
  "lidar": ["G01S17", "G01S7/48"],
  "radar": ["G01S13", "G01S7/02"],
  "camera": ["H04N", "G06V"],
  "sensor fusion": ["G01S13", "G01S17", "G06V"],
  
  // Autonomous & ADAS
  "autonomous driving": ["B60W60", "G05D1"],
  "autonomous vehicle": ["B60W60", "G05D1"],
  "adas": ["B60W30", "B60W50"],
  "advanced driver assistance": ["B60W30", "B60W50"],
  
  // Electric & Battery
  "electric vehicle": ["B60L", "B60K1"],
  "battery electric vehicle": ["B60L50", "H01M10"],
  "battery": ["H01M10", "H01M50"],
  "battery management": ["H01M10/42", "H02J7"],
  "battery management systems": ["H01M10/42", "H02J7"],
  "ev charging": ["H02J7", "B60L53"],
  "charging infrastructure": ["H02J7", "B60L53"],
  
  // Connectivity & V2X
  "v2x": ["H04W4/40", "H04W4/46"],
  "vehicle to everything": ["H04W4/40", "H04W4/46"],
  "connected car": ["H04W4/40", "B60R16/023"],
  "connectivity": ["H04W4", "H04L67"],
  "telematics": ["G08G1", "H04W4/02"],
  
  // Software & Architecture
  "software defined vehicle": ["B60W60", "G06F9"],
  "sdv": ["B60W60", "G06F9"],
  "ota updates": ["G06F8/65", "H04L67"],
  "over the air updates": ["G06F8/65", "H04L67"],
  "digital cockpit": ["B60K35", "G06F3"],
  "infotainment": ["B60K35", "G06F3"],
  "hmi": ["G06F3", "B60K35"],
  
  // Computing & AI
  "edge computing": ["G06F9/50", "H04L67/10"],
  "computer vision": ["G06V", "G06T7"],
  "machine learning": ["G06N3", "G06N20"],
  "artificial intelligence": ["G06N3", "G06N5"],
  
  // Safety & Security
  "cybersecurity": ["H04L9", "G06F21"],
  "functional safety": ["B60W50", "G05B9"],
  
  // Fleet & Mobility
  "fleet management": ["G08G1", "G06Q10/08"],
  "mobility as a service": ["G06Q50/30", "G08G1"],
  "smart mobility": ["G08G1", "B60W"],
  "traffic management": ["G08G1"],
  
  // Other SDV-related
  "digital twin": ["G06F30", "G05B17"],
  "cloud platform": ["H04L67", "G06F9/50"],
  "5g": ["H04W72", "H04W88"],
};

interface TechnologyEnrichmentResult {
  keywordId: string;
  keywordName: string;
  ipcCodes: string[];
  patentCount: number;
  topApplicants: Array<{ name: string; count: number }>;
}

interface EnrichmentSummary {
  technologiesEnriched: number;
  totalPatentsFound: number;
  results: TechnologyEnrichmentResult[];
}

// Enrich a single technology keyword with EPO patent data via IPC search
export function useEpoEnrichTechnology() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keywordId: string): Promise<TechnologyEnrichmentResult | null> => {
      // Get keyword details
      const { data: keyword, error: kwError } = await supabase
        .from("technology_keywords")
        .select("id, keyword, display_name")
        .eq("id", keywordId)
        .single();

      if (kwError || !keyword) {
        console.error("Keyword not found:", keywordId);
        return null;
      }

      // Find matching IPC codes
      const normalizedKeyword = keyword.keyword.toLowerCase().trim();
      let matchedIpcCodes: string[] = [];
      
      for (const [kw, codes] of Object.entries(TECHNOLOGY_IPC_MAP)) {
        if (normalizedKeyword.includes(kw) || kw.includes(normalizedKeyword)) {
          matchedIpcCodes = [...new Set([...matchedIpcCodes, ...codes])];
        }
      }

      if (matchedIpcCodes.length === 0) {
        console.log(`No IPC mapping for: ${keyword.display_name}`);
        return {
          keywordId: keyword.id,
          keywordName: keyword.display_name,
          ipcCodes: [],
          patentCount: 0,
          topApplicants: [],
        };
      }

      // Search EPO for each IPC code and aggregate results
      let totalPatents = 0;
      const applicantCounts: Record<string, number> = {};

      for (const ipcCode of matchedIpcCodes.slice(0, 2)) { // Limit to avoid rate limits
        try {
          const { data, error } = await supabase.functions.invoke("epo-patent-lookup", {
            body: { action: "search_ipc_detailed", ipcCode, maxResults: 50 },
          });

          if (!error && data) {
            totalPatents += data.totalCount || data.patents?.length || 0;
            
            // Count applicants
            for (const patent of data.patents || []) {
              if (patent.applicant) {
                const cleanName = patent.applicant
                  .replace(/\s+(Inc|Corp|Ltd|LLC|GmbH|AG|SA|BV|NV|SE|PLC|S\.A\.|Co\.|Company)\.?$/i, "")
                  .trim();
                applicantCounts[cleanName] = (applicantCounts[cleanName] || 0) + 1;
              }
            }
          }
        } catch (err) {
          console.error(`EPO search failed for ${ipcCode}:`, err);
        }
        
        // Rate limiting
        await new Promise(r => setTimeout(r, 400));
      }

      // Update technologies table
      const { error: updateError } = await supabase
        .from("technologies")
        .update({
          total_patents: totalPatents,
          patents_score: totalPatents >= 100 ? 2 : totalPatents >= 20 ? 1 : 0,
          last_updated: new Date().toISOString(),
        })
        .eq("keyword_id", keywordId);

      if (updateError) {
        console.error("Failed to update technology:", updateError);
      }

      const topApplicants = Object.entries(applicantCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

      return {
        keywordId: keyword.id,
        keywordName: keyword.display_name,
        ipcCodes: matchedIpcCodes,
        patentCount: totalPatents,
        topApplicants,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technologies"] });
      queryClient.invalidateQueries({ queryKey: ["technology-intelligence"] });
    },
  });
}

// Batch enrich multiple technologies with EPO patent data
export function useEpoBatchEnrichTechnologies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options?: { limit?: number }): Promise<EnrichmentSummary> => {
      // Get technologies needing enrichment (0 or low patent counts)
      const { data: technologies, error: fetchError } = await supabase
        .from("technologies")
        .select("keyword_id, name")
        .or("total_patents.is.null,total_patents.eq.0,total_patents.lt.10")
        .limit(options?.limit || 10);

      if (fetchError) throw fetchError;
      if (!technologies || technologies.length === 0) {
        return { technologiesEnriched: 0, totalPatentsFound: 0, results: [] };
      }

      const results: TechnologyEnrichmentResult[] = [];
      let totalPatentsFound = 0;

      for (const tech of technologies) {
        if (!tech.keyword_id) continue;

        // Get keyword details
        const { data: keyword } = await supabase
          .from("technology_keywords")
          .select("keyword, display_name")
          .eq("id", tech.keyword_id)
          .single();

        if (!keyword) continue;

        // Find matching IPC codes
        const normalizedKeyword = keyword.keyword.toLowerCase().trim();
        let matchedIpcCodes: string[] = [];
        
        for (const [kw, codes] of Object.entries(TECHNOLOGY_IPC_MAP)) {
          if (normalizedKeyword.includes(kw) || kw.includes(normalizedKeyword)) {
            matchedIpcCodes = [...new Set([...matchedIpcCodes, ...codes])];
          }
        }

        if (matchedIpcCodes.length === 0) continue;

        // Search EPO
        let patentCount = 0;
        for (const ipcCode of matchedIpcCodes.slice(0, 2)) {
          try {
            const { data, error } = await supabase.functions.invoke("epo-patent-lookup", {
              body: { action: "search_ipc_detailed", ipcCode, maxResults: 50 },
            });

            if (!error && data) {
              patentCount += data.totalCount || data.patents?.length || 0;
            }
          } catch (err) {
            console.error(`EPO search failed for ${ipcCode}:`, err);
          }
          await new Promise(r => setTimeout(r, 400));
        }

        // Update technologies table
        await supabase
          .from("technologies")
          .update({
            total_patents: patentCount,
            patents_score: patentCount >= 100 ? 2 : patentCount >= 20 ? 1 : 0,
            last_updated: new Date().toISOString(),
          })
          .eq("keyword_id", tech.keyword_id);

        totalPatentsFound += patentCount;
        results.push({
          keywordId: tech.keyword_id,
          keywordName: keyword.display_name,
          ipcCodes: matchedIpcCodes,
          patentCount,
          topApplicants: [],
        });

        // Rate limiting between technologies
        await new Promise(r => setTimeout(r, 500));
      }

      return {
        technologiesEnriched: results.length,
        totalPatentsFound,
        results,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technologies"] });
      queryClient.invalidateQueries({ queryKey: ["technology-intelligence"] });
    },
  });
}

// Get enrichment status - how many technologies need EPO data
export function useEpoEnrichmentStatus() {
  return useMutation({
    mutationFn: async (): Promise<{
      needsEnrichment: number;
      alreadyEnriched: number;
      unmapped: number;
    }> => {
      const { data: technologies } = await supabase
        .from("technologies")
        .select("keyword_id, total_patents, name");

      if (!technologies) return { needsEnrichment: 0, alreadyEnriched: 0, unmapped: 0 };

      let needsEnrichment = 0;
      let alreadyEnriched = 0;
      let unmapped = 0;

      for (const tech of technologies) {
        // Check if keyword has IPC mapping
        const { data: keyword } = await supabase
          .from("technology_keywords")
          .select("keyword")
          .eq("id", tech.keyword_id)
          .single();

        if (!keyword) {
          unmapped++;
          continue;
        }

        const normalizedKeyword = keyword.keyword.toLowerCase().trim();
        const hasMapping = Object.keys(TECHNOLOGY_IPC_MAP).some(
          kw => normalizedKeyword.includes(kw) || kw.includes(normalizedKeyword)
        );

        if (!hasMapping) {
          unmapped++;
        } else if (tech.total_patents && tech.total_patents > 0) {
          alreadyEnriched++;
        } else {
          needsEnrichment++;
        }
      }

      return { needsEnrichment, alreadyEnriched, unmapped };
    },
  });
}
