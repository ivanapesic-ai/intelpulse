import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { KEYWORD_TO_IPC_MAP } from "@/hooks/useEpoPatents";

// Normalize keyword strings across snake_case / Title Case / hyphenated
const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function matchesKeyword(normalizedInput: string, normalizedMapKey: string) {
  if (!normalizedInput || !normalizedMapKey) return false;

  const short = Math.min(normalizedInput.length, normalizedMapKey.length) <= 3;
  if (short) {
    // Use whole-word semantics for short tokens like "ev", "ai", "5g"
    const reA = new RegExp(`\\b${escapeRegExp(normalizedMapKey)}\\b`, "i");
    const reB = new RegExp(`\\b${escapeRegExp(normalizedInput)}\\b`, "i");
    return reA.test(normalizedInput) || reB.test(normalizedMapKey);
  }

  return (
    normalizedInput.includes(normalizedMapKey) ||
    normalizedMapKey.includes(normalizedInput)
  );
}

function getMatchedIpcCodes(keywordLike: string): string[] {
  const normalized = normalize(keywordLike);
  let matched: string[] = [];

  for (const [kw, codes] of Object.entries(KEYWORD_TO_IPC_MAP)) {
    const normalizedKw = normalize(kw);
    if (matchesKeyword(normalized, normalizedKw)) {
      matched = [...new Set([...matched, ...codes])];
    }
  }

  return matched;
}

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

/**
 * Enrich a single technology with patent totals by IPC.
 * Persistence is handled server-side to avoid any client-side permission/RLS issues.
 */
export function useEpoEnrichTechnology() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keywordId: string): Promise<TechnologyEnrichmentResult | null> => {
      const { data: keyword, error: kwError } = await supabase
        .from("technology_keywords")
        .select("id, keyword, display_name")
        .eq("id", keywordId)
        .single();

      if (kwError || !keyword) {
        console.error("Keyword not found:", keywordId, kwError);
        return null;
      }

      const matchedIpcCodes = getMatchedIpcCodes(keyword.keyword);
      if (matchedIpcCodes.length === 0) {
        return {
          keywordId: keyword.id,
          keywordName: keyword.display_name,
          ipcCodes: [],
          patentCount: 0,
          topApplicants: [],
        };
      }

      const { data, error } = await supabase.functions.invoke("epo-patent-lookup", {
        body: {
          action: "enrich_technology",
          keywordId: keyword.id,
          ipcCodes: matchedIpcCodes,
        },
      });

      if (error) throw error;

      const totalPatents = Number(data?.totalPatents ?? 0);

      return {
        keywordId: keyword.id,
        keywordName: keyword.display_name,
        ipcCodes: matchedIpcCodes,
        patentCount: totalPatents,
        topApplicants: [],
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technologies"] });
      queryClient.invalidateQueries({ queryKey: ["technology-intelligence"] });
    },
  });
}

/**
 * Batch enrich technologies that are missing patent totals.
 * Uses server-side persistence (backend function) for reliability.
 */
export function useEpoBatchEnrichTechnologies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options?: { limit?: number }): Promise<EnrichmentSummary> => {
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

        const { data: keyword } = await supabase
          .from("technology_keywords")
          .select("id, keyword, display_name")
          .eq("id", tech.keyword_id)
          .single();

        if (!keyword) continue;

        const matchedIpcCodes = getMatchedIpcCodes(keyword.keyword);
        if (matchedIpcCodes.length === 0) continue;

        const { data, error } = await supabase.functions.invoke("epo-patent-lookup", {
          body: {
            action: "enrich_technology",
            keywordId: keyword.id,
            ipcCodes: matchedIpcCodes,
          },
        });

        if (error) throw error;

        const patentCount = Number(data?.totalPatents ?? 0);
        totalPatentsFound += patentCount;

        results.push({
          keywordId: keyword.id,
          keywordName: keyword.display_name,
          ipcCodes: matchedIpcCodes,
          patentCount,
          topApplicants: [],
        });

        // Rate limiting between technologies
        await new Promise((r) => setTimeout(r, 500));
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

/**
 * Fast enrichment status check without N+1 queries.
 */
export function useEpoEnrichmentStatus() {
  return useMutation({
    mutationFn: async (): Promise<{
      needsEnrichment: number;
      alreadyEnriched: number;
      unmapped: number;
    }> => {
      const [{ data: technologies }, { data: keywords }] = await Promise.all([
        supabase.from("technologies").select("keyword_id, total_patents"),
        supabase.from("technology_keywords").select("id, keyword"),
      ]);

      if (!technologies || !keywords) {
        return { needsEnrichment: 0, alreadyEnriched: 0, unmapped: 0 };
      }

      const keywordMap = new Map<string, string>();
      for (const k of keywords) {
        if (k?.id && k?.keyword) keywordMap.set(k.id, k.keyword);
      }

      let needsEnrichment = 0;
      let alreadyEnriched = 0;
      let unmapped = 0;

      for (const tech of technologies) {
        const kw = tech.keyword_id ? keywordMap.get(tech.keyword_id) : undefined;
        if (!kw) {
          unmapped++;
          continue;
        }

        const hasMapping = getMatchedIpcCodes(kw).length > 0;
        if (!hasMapping) {
          unmapped++;
        } else if ((tech.total_patents || 0) > 0) {
          alreadyEnriched++;
        } else {
          needsEnrichment++;
        }
      }

      return { needsEnrichment, alreadyEnriched, unmapped };
    },
  });
}
