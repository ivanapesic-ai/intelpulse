import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface KeywordStandard {
  id: string;
  keyword_id: string;
  standard_code: string;
  standard_title: string;
  issuing_body: string;
  body_type: "sdo" | "consortia";
  url: string | null;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStandardInput {
  keyword_id: string;
  standard_code: string;
  standard_title: string;
  issuing_body: string;
  body_type: "sdo" | "consortia";
  url?: string;
  description?: string;
  status?: string;
}

const ISSUING_BODIES_SDO = ["ISO", "IEC", "ITU", "ETSI", "IEEE", "SAE", "UNECE", "CEN/CENELEC"] as const;
const ISSUING_BODIES_CONSORTIA = ["CharIN", "AUTOSAR", "COVESA", "5GAA", "GENIVI", "OMA", "FIWARE", "Eclipse Foundation"] as const;

export const ISSUING_BODIES = {
  sdo: ISSUING_BODIES_SDO,
  consortia: ISSUING_BODIES_CONSORTIA,
};

export function useKeywordStandards(keywordId: string | null, aliases?: string[]) {
  return useQuery({
    queryKey: ["keyword-standards", keywordId, aliases],
    queryFn: async () => {
      if (!keywordId) return [];

      // 1. Fetch standards for the main keyword
      const { data: mainStandards, error: mainErr } = await supabase
        .from("keyword_standards")
        .select("*")
        .eq("keyword_id", keywordId)
        .order("issuing_body", { ascending: true });
      if (mainErr) throw mainErr;

      let allStandards = (mainStandards || []) as KeywordStandard[];

      // 2. If aliases exist, find excluded child keywords whose display_name is in our aliases
      if (aliases && aliases.length > 0) {
        const { data: childKeywords } = await supabase
          .from("technology_keywords")
          .select("id")
          .in("display_name", aliases)
          .eq("excluded_from_sdv", true)
          .neq("id", keywordId);

        if (childKeywords && childKeywords.length > 0) {
          const childIds = childKeywords.map((k) => k.id);
          const { data: childStandards } = await supabase
            .from("keyword_standards")
            .select("*")
            .in("keyword_id", childIds)
            .order("issuing_body", { ascending: true });

          if (childStandards) {
            // Deduplicate by standard_code
            const seen = new Set(allStandards.map((s) => s.standard_code));
            for (const cs of childStandards) {
              if (!seen.has(cs.standard_code)) {
                seen.add(cs.standard_code);
                allStandards.push(cs as KeywordStandard);
              }
            }
          }
        }
      }

      return allStandards;
    },
    enabled: !!keywordId,
  });
}

export function useAllStandards() {
  return useQuery({
    queryKey: ["keyword-standards-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("keyword_standards")
        .select("*, technology_keywords!inner(display_name)")
        .order("issuing_body", { ascending: true });
      if (error) throw error;
      return (data || []) as (KeywordStandard & { technology_keywords: { display_name: string } })[];
    },
  });
}

export function useCreateStandard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateStandardInput) => {
      const { data, error } = await supabase
        .from("keyword_standards")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["keyword-standards", vars.keyword_id] });
      qc.invalidateQueries({ queryKey: ["keyword-standards-all"] });
    },
  });
}

export function useDeleteStandard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, keywordId }: { id: string; keywordId: string }) => {
      const { error } = await supabase.from("keyword_standards").delete().eq("id", id);
      if (error) throw error;
      return { id, keywordId };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["keyword-standards", result.keywordId] });
      qc.invalidateQueries({ queryKey: ["keyword-standards-all"] });
    },
  });
}
