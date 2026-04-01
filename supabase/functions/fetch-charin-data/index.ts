// supabase/functions/fetch-charin-data/index.ts
// Processes CharIN interoperability test data from two sources:
// 1. Firecrawl scraping of CharIN event pages (event metadata + participants)
// 2. Gemini extraction from uploaded VOLTS/ChargeX PDF reports (detailed test results)
//
// Usage:
//   { "mode": "scrape_events" }                    — Scrape CharIN event pages via Firecrawl
//   { "mode": "extract_pdf", "document_id": "..." } — Extract test data from uploaded PDF
//   { "mode": "seed_known" }                        — Seed known VOLTS 2023 + ChargeX 2024 data

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CHARIN_EVENT_URLS = [
  {
    url: "https://www.charin.global/events/volts-2023/",
    event_name: "VOLTS 2023",
    event_type: "VOLTS",
    report_url:
      "https://www.charin.global/media/pages/events/volts-2023/b1365217fd-1690895132/volts_testingresults_final_2023.07.25.pdf",
  },
  {
    url: "https://www.charin.global/events/charin-testival-europe-2024-france/",
    event_name: "Testival Europe 2024",
    event_type: "TESTIVAL",
  },
  {
    url: "https://www.charin.global/events/charin-testival-na-2024-california/",
    event_name: "Testival NA 2024 California",
    event_type: "TESTIVAL",
  },
  {
    url: "https://www.charin.global/events/charin-testival-conference-north-america-2024/",
    event_name: "Testival NA 2024 Cleveland",
    event_type: "TESTIVAL",
  },
];

const VOLTS_2023_SEED = {
  event_name: "VOLTS 2023",
  event_type: "VOLTS",
  location: "Long Beach, California",
  country: "US",
  start_date: "2023-05-10",
  end_date: "2023-05-11",
  organizer: "CharIN",
  total_test_hours: 400,
  total_pairings: 174,
  total_individual_tests: 1000,
  total_evs: 21,
  total_evses: 18,
  total_test_systems: 7,
  total_attendees: 400,
  report_url:
    "https://www.charin.global/media/pages/events/volts-2023/b1365217fd-1690895132/volts_testingresults_final_2023.07.25.pdf",
};

const CHARGEX_2024_SEED = {
  event_name: "ChargeX Prescribed Testing 2024",
  event_type: "CHARGEX",
  location: "Cleveland, Ohio",
  country: "US",
  start_date: "2024-06-11",
  end_date: "2024-06-14",
  organizer: "CharIN / Argonne National Lab",
  total_pairings: 43,
  total_evs: 22,
  total_individual_tests: 163,
  report_url: "https://driveelectric.gov/files/prescribed-testing.pdf",
};

const EXTRACTION_PROMPT = `You are extracting EV charging interoperability test data from a CharIN/VOLTS test report.

For each test result you can identify, return a JSON array of objects with these fields:
- test_scenario: name of the test (e.g., "DC Charging Basic", "ISO 15118 Plug & Charge", "Bidirectional Power Transfer")
- test_category: one of: protocol_conformance, communication, energy_flow, metering, grid_services, multi_vendor, cybersecurity
- protocol: the standard tested (e.g., "ISO 15118-2", "DIN 70121", "IEC 61851-1", "OCPP 2.0.1")
- ev_model: EV model name if mentioned
- ev_manufacturer: EV brand
- evse_model: charger model if mentioned
- evse_manufacturer: charger brand
- result: PASS, FAIL, PARTIAL, or INCONCLUSIVE
- result_detail: brief description of what happened
- uses_iso15118: true/false
- uses_plug_and_charge: true/false
- is_bidirectional: true/false
- is_dc: true/false
- is_megawatt: true/false
- charging_power_kw: number if mentioned

Also extract equipment information as a separate array:
- equipment_type: EV, EVSE, or TEST_SYSTEM
- manufacturer: brand name
- model: model name
- category: car, truck, bus, school_bus, charger, test_system
- supports_iso15118: true/false if mentioned
- max_power_kw: number if mentioned

Return JSON: { "test_results": [...], "equipment": [...], "event_stats": { total_tests, total_pairings, pass_count, fail_count } }

Be thorough. Extract every test result and piece of equipment mentioned.`;

async function scrapeCharinEvents(supabaseClient: any) {
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!firecrawlKey) {
    throw new Error("FIRECRAWL_API_KEY not set");
  }

  const results = [];

  for (const event of CHARIN_EVENT_URLS) {
    try {
      const scrapeResponse = await fetch(
        "https://api.firecrawl.dev/v1/scrape",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${firecrawlKey}`,
          },
          body: JSON.stringify({
            url: event.url,
            formats: ["markdown"],
          }),
        }
      );

      if (!scrapeResponse.ok) {
        console.warn(`Firecrawl failed for ${event.url}: ${scrapeResponse.status}`);
        results.push({ event: event.event_name, status: "scrape_failed" });
        continue;
      }

      const scrapeData = await scrapeResponse.json();
      const markdown = scrapeData.data?.markdown || "";

      const geminiKey = Deno.env.get("GEMINI_API_KEY");
      if (geminiKey && markdown.length > 100) {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Extract from this CharIN event page: event name, location, country, dates, number of participants, EVs, EVSEs, test systems, and any test statistics mentioned. Return JSON with fields: location, country, start_date (YYYY-MM-DD), end_date, total_attendees, total_evs, total_evses, total_test_systems, total_pairings, total_individual_tests, total_test_hours.\n\nPage content:\n${markdown.slice(0, 8000)}`,
                    },
                  ],
                },
              ],
              generationConfig: { temperature: 0.1 },
            }),
          }
        );

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const extracted = JSON.parse(jsonMatch[0]);
              const { error } = await supabaseClient
                .from("charin_test_events")
                .upsert(
                  {
                    event_name: event.event_name,
                    event_type: event.event_type,
                    location: extracted.location,
                    country: extracted.country,
                    start_date: extracted.start_date,
                    end_date: extracted.end_date,
                    organizer: "CharIN",
                    total_test_hours: extracted.total_test_hours,
                    total_pairings: extracted.total_pairings,
                    total_individual_tests: extracted.total_individual_tests,
                    total_evs: extracted.total_evs,
                    total_evses: extracted.total_evses,
                    total_test_systems: extracted.total_test_systems,
                    total_attendees: extracted.total_attendees,
                    report_url: event.report_url || null,
                    scraped_from_url: event.url,
                    fetched_at: new Date().toISOString(),
                  },
                  { onConflict: "event_name,start_date" }
                );

              results.push({
                event: event.event_name,
                status: error ? "upsert_failed" : "success",
                extracted,
              });
            } catch {
              results.push({ event: event.event_name, status: "parse_failed" });
            }
          }
        }
      }

      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      results.push({ event: event.event_name, status: "error", error: err.message });
    }
  }

  return results;
}

async function extractFromPdf(supabaseClient: any, documentId: string) {
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiKey) throw new Error("GEMINI_API_KEY not set");

  // Get document — use parsed_content which contains the extracted text
  const { data: doc, error: docError } = await supabaseClient
    .from("cei_documents")
    .select("id, title, parsed_content")
    .eq("id", documentId)
    .single();

  if (docError || !doc) throw new Error(`Document ${documentId} not found`);

  // Extract text from parsed_content JSON
  const parsedContent = doc.parsed_content;
  let text = "";
  if (typeof parsedContent === "string") {
    text = parsedContent;
  } else if (parsedContent?.text) {
    text = parsedContent.text;
  } else if (parsedContent?.pages) {
    text = parsedContent.pages.map((p: any) => p.text || p.content || "").join("\n");
  } else if (parsedContent) {
    text = JSON.stringify(parsedContent);
  }

  if (text.length < 100) throw new Error("Document has insufficient extracted text");

  const maxChunkSize = 15000;
  const chunks = text.length > maxChunkSize
    ? [text.slice(0, maxChunkSize), text.slice(maxChunkSize, maxChunkSize * 2)]
    : [text];

  let allResults: any[] = [];
  let allEquipment: any[] = [];
  let eventStats: any = {};

  for (const chunk of chunks) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${EXTRACTION_PROMPT}\n\nDocument text:\n${chunk}` }] }],
          generationConfig: { temperature: 0.1 },
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.test_results) allResults.push(...parsed.test_results);
          if (parsed.equipment) allEquipment.push(...parsed.equipment);
          if (parsed.event_stats) eventStats = { ...eventStats, ...parsed.event_stats };
        } catch {
          console.warn("Failed to parse Gemini JSON chunk");
        }
      }
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  // Find or create the event
  let eventId: string | null = null;
  const { data: events } = await supabaseClient
    .from("charin_test_events")
    .select("id")
    .ilike("event_name", `%${doc.title?.split(" ").slice(0, 2).join(" ") || "VOLTS"}%`)
    .limit(1);

  if (events?.length) {
    eventId = events[0].id;
  }

  // Insert test results
  let inserted = 0;
  if (allResults.length > 0 && eventId) {
    const { data: keywords } = await supabaseClient
      .from("technology_keywords")
      .select("id, keyword")
      .eq("excluded_from_sdv", false);

    const keywordMap = new Map(
      (keywords || []).map((k: any) => [k.keyword.toLowerCase(), k.id])
    );

    const rows = allResults.map((r: any) => {
      let kwId = null;
      let kwName = null;
      const protocol = (r.protocol || "").toLowerCase();

      if (r.is_bidirectional || protocol.includes("15118-20")) {
        kwId = keywordMap.get("bidirectional_charging") || keywordMap.get("v2g");
        kwName = "bidirectional_charging";
      } else if (protocol.includes("15118")) {
        kwId = keywordMap.get("smart_recharging") || keywordMap.get("ev_charging");
        kwName = "smart_recharging";
      } else if (r.is_megawatt) {
        kwId = keywordMap.get("ev_charging");
        kwName = "ev_charging";
      } else {
        kwId = keywordMap.get("ev_charging");
        kwName = "ev_charging";
      }

      return {
        event_id: eventId,
        test_scenario: r.test_scenario || "Unknown",
        test_category: r.test_category || "protocol_conformance",
        protocol: r.protocol,
        ev_model: r.ev_model,
        ev_manufacturer: r.ev_manufacturer,
        evse_model: r.evse_model,
        evse_manufacturer: r.evse_manufacturer,
        result: r.result || "INCONCLUSIVE",
        result_detail: r.result_detail,
        charging_power_kw: r.charging_power_kw,
        uses_iso15118: r.uses_iso15118 || false,
        uses_plug_and_charge: r.uses_plug_and_charge || false,
        is_bidirectional: r.is_bidirectional || false,
        is_dc: r.is_dc !== false,
        is_megawatt: r.is_megawatt || false,
        keyword_id: kwId,
        keyword: kwName,
      };
    });

    for (let i = 0; i < rows.length; i += 50) {
      const chunk = rows.slice(i, i + 50);
      const { data, error } = await supabaseClient
        .from("charin_test_results")
        .insert(chunk)
        .select("id");
      if (!error) inserted += data?.length || chunk.length;
    }
  }

  // Insert equipment
  let equipmentInserted = 0;
  if (allEquipment.length > 0) {
    const eqRows = allEquipment.map((e: any) => ({
      equipment_type: e.equipment_type || "EVSE",
      manufacturer: e.manufacturer || "Unknown",
      model: e.model || "Unknown",
      category: e.category,
      supports_iso15118: e.supports_iso15118,
      supports_plug_and_charge: e.supports_plug_and_charge,
      supports_bidirectional: e.supports_bidirectional,
      supports_megawatt: e.supports_megawatt,
      max_power_kw: e.max_power_kw,
    }));

    for (const row of eqRows) {
      const { error } = await supabaseClient
        .from("charin_equipment")
        .upsert(row, { onConflict: "equipment_type,manufacturer,model" });
      if (!error) equipmentInserted++;
    }
  }

  return {
    document_id: documentId,
    test_results_extracted: allResults.length,
    test_results_inserted: inserted,
    equipment_extracted: allEquipment.length,
    equipment_inserted: equipmentInserted,
    event_id: eventId,
    event_stats: eventStats,
  };
}

async function seedKnownEvents(supabaseClient: any) {
  const results = [];

  for (const seed of [VOLTS_2023_SEED, CHARGEX_2024_SEED]) {
    const { error } = await supabaseClient
      .from("charin_test_events")
      .upsert(
        { ...seed, fetched_at: new Date().toISOString() },
        { onConflict: "event_name,start_date" }
      );

    results.push({
      event: seed.event_name,
      status: error ? `failed: ${error.message}` : "seeded",
    });
  }

  return results;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.json();
    const { mode, document_id } = body;

    let result: any;

    switch (mode) {
      case "scrape_events":
        result = await scrapeCharinEvents(supabaseClient);
        break;
      case "extract_pdf":
        if (!document_id) throw new Error("document_id required for extract_pdf mode");
        result = await extractFromPdf(supabaseClient, document_id);
        break;
      case "seed_known":
        result = await seedKnownEvents(supabaseClient);
        break;
      default:
        throw new Error(`Unknown mode: ${mode}. Use: scrape_events, extract_pdf, seed_known`);
    }

    return new Response(
      JSON.stringify({ success: true, mode, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("CharIN fetch error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
