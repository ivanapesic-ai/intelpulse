// src/hooks/useCharinTests.ts
// Hooks for CharIN interoperability test data

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CharinEvent {
  id: string;
  event_name: string;
  event_type: string;
  location: string | null;
  country: string | null;
  start_date: string | null;
  end_date: string | null;
  organizer: string;
  total_test_hours: number | null;
  total_pairings: number | null;
  total_individual_tests: number | null;
  total_evs: number | null;
  total_evses: number | null;
  total_test_systems: number | null;
  total_attendees: number | null;
  report_url: string | null;
  // From view join
  loaded_test_count?: number;
  protocols_tested?: number;
  overall_pass_rate?: number;
}

export interface CharinTestResult {
  id: string;
  event_id: string;
  test_scenario: string;
  test_category: string | null;
  protocol: string | null;
  ev_model: string | null;
  ev_manufacturer: string | null;
  evse_model: string | null;
  evse_manufacturer: string | null;
  result: "PASS" | "FAIL" | "PARTIAL" | "INCONCLUSIVE" | "NOT_TESTED";
  result_detail: string | null;
  uses_iso15118: boolean;
  uses_plug_and_charge: boolean;
  is_bidirectional: boolean;
  is_dc: boolean;
  is_megawatt: boolean;
  charging_power_kw: number | null;
  keyword_id: string | null;
  keyword: string | null;
}

export interface CharinEquipment {
  id: string;
  equipment_type: string;
  manufacturer: string;
  model: string;
  category: string | null;
  supports_iso15118: boolean | null;
  supports_plug_and_charge: boolean | null;
  supports_bidirectional: boolean | null;
  max_power_kw: number | null;
  events_participated: number;
  total_tests: number;
  pass_rate: number | null;
}

export interface CharinProtocolSummary {
  protocol: string;
  total_tests: number;
  passed: number;
  failed: number;
  partial: number;
  pass_rate_pct: number;
}

/**
 * Fetch all test events (with overview stats)
 */
export function useCharinEvents() {
  return useQuery({
    queryKey: ["charin-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("charin_event_overview")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return (data || []) as CharinEvent[];
    },
  });
}

/**
 * Fetch test results for a specific event
 */
export function useCharinTestResults(eventId: string | null) {
  return useQuery({
    queryKey: ["charin-results", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from("charin_test_results")
        .select("*")
        .eq("event_id", eventId)
        .order("test_category", { ascending: true });
      if (error) throw error;
      return (data || []) as CharinTestResult[];
    },
    enabled: !!eventId,
  });
}

/**
 * Fetch test results for a specific keyword (cross-event)
 */
export function useCharinResultsByKeyword(keywordId: string | null) {
  return useQuery({
    queryKey: ["charin-results-keyword", keywordId],
    queryFn: async () => {
      if (!keywordId) return [];
      const { data, error } = await supabase
        .from("charin_test_results")
        .select("*, charin_test_events(event_name, start_date)")
        .eq("keyword_id", keywordId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!keywordId,
  });
}

/**
 * Fetch protocol pass-rate summary
 */
export function useCharinProtocolSummary() {
  return useQuery({
    queryKey: ["charin-protocol-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("charin_protocol_summary")
        .select("*");
      if (error) throw error;
      return (data || []) as CharinProtocolSummary[];
    },
  });
}

/**
 * Fetch equipment registry
 */
export function useCharinEquipment(type?: "EV" | "EVSE" | "TEST_SYSTEM") {
  return useQuery({
    queryKey: ["charin-equipment", type],
    queryFn: async () => {
      let query = supabase
        .from("charin_equipment")
        .select("*")
        .order("manufacturer", { ascending: true });
      if (type) query = query.eq("equipment_type", type);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CharinEquipment[];
    },
  });
}

/**
 * Fetch keyword-level CharIN summary
 */
export function useCharinKeywordSummary() {
  return useQuery({
    queryKey: ["charin-keyword-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("charin_keyword_summary")
        .select("*")
        .order("total_tests", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data || [];
    },
  });
}

/**
 * Trigger CharIN data operations
 */
export async function fetchCharinData(
  mode: "scrape_events" | "extract_pdf" | "seed_known",
  documentId?: string
) {
  const body: Record<string, any> = { mode };
  if (documentId) body.document_id = documentId;

  const { data, error } = await supabase.functions.invoke(
    "fetch-charin-data",
    { body }
  );

  if (error) throw error;
  return data;
}
