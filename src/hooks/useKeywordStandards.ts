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

export function useKeywordStandards(keywordId: string | null) {
  return useQuery({
    queryKey: ["keyword-standards", keywordId],
    queryFn: async () => {
      if (!keywordId) return [];
      const { data, error } = await supabase
        .from("keyword_standards")
        .select("*")
        .eq("keyword_id", keywordId)
        .order("issuing_body", { ascending: true });
      if (error) throw error;
      return (data || []) as KeywordStandard[];
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
