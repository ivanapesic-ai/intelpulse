import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface StandardResult {
  standard_code: string;
  standard_title: string;
  issuing_body: string;
  body_type: "sdo" | "consortia";
  url?: string;
  description?: string;
}

const VALID_SDO = ["ISO", "IEC", "ITU", "ETSI", "IEEE", "SAE", "UNECE", "CEN/CENELEC"];
const VALID_CONSORTIA = ["CharIN", "AUTOSAR", "COVESA", "5GAA", "GENIVI", "OMA", "FIWARE", "Eclipse Foundation"];

function classifyBody(body: string): { issuing_body: string; body_type: "sdo" | "consortia" } | null {
  const upper = body.toUpperCase().trim();
  for (const sdo of VALID_SDO) {
    if (upper === sdo.toUpperCase() || upper.includes(sdo.toUpperCase())) {
      return { issuing_body: sdo, body_type: "sdo" };
    }
  }
  for (const c of VALID_CONSORTIA) {
    if (upper === c.toUpperCase() || upper.includes(c.toUpperCase())) {
      return { issuing_body: c, body_type: "consortia" };
    }
  }
  return null;
}

async function searchStandards(keywordName: string, aliases: string[]): Promise<StandardResult[]> {
  if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY not configured");

  const aliasContext = aliases.length > 0 ? ` (also known as: ${aliases.join(", ")})` : "";
  const prompt = `List all major international standards (ISO, IEC, IEEE, ETSI, ITU, SAE, UNECE, CEN/CENELEC) and private consortia specifications (CharIN, AUTOSAR, COVESA, 5GAA, etc.) that are directly relevant to the automotive/SDV technology "${keywordName}"${aliasContext}.

For each standard, provide:
1. The exact standard code (e.g., "ISO 15118", "IEEE 802.11p")
2. The full title of the standard
3. The issuing body (e.g., "ISO", "IEEE", "CharIN")
4. Whether it's an SDO standard or consortia specification
5. The official URL if available

Focus only on standards that are DIRECTLY relevant to this technology. Do not include general standards. Return ONLY standards you are confident about.`;

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "system",
          content: `You are an expert in automotive and SDV (Software-Defined Vehicle) international standards. Return your answer as a JSON array of objects with fields: standard_code, standard_title, issuing_body, body_type ("sdo" or "consortia"), url (optional), description (optional, one sentence on relevance). Only return the JSON array, no other text.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Perplexity error:", response.status, errText);
    if (response.status === 429) throw new Error("Rate limited by Perplexity. Please try again later.");
    if (response.status === 402) throw new Error("Perplexity credits exhausted.");
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  // Extract JSON array from response
  let parsed: any[];
  try {
    // Try direct parse first
    parsed = JSON.parse(content);
  } catch {
    // Try extracting JSON from markdown code block
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("Could not parse standards from response:", content);
      return [];
    }
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("Failed to parse extracted JSON:", jsonMatch[0]);
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  // Validate and normalize results
  return parsed
    .filter((s) => s.standard_code && s.standard_title && s.issuing_body)
    .map((s) => {
      const classified = classifyBody(s.issuing_body);
      return {
        standard_code: String(s.standard_code).trim(),
        standard_title: String(s.standard_title).trim(),
        issuing_body: classified?.issuing_body || String(s.issuing_body).trim(),
        body_type: classified?.body_type || (s.body_type === "consortia" ? "consortia" : "sdo"),
        url: s.url ? String(s.url).trim() : undefined,
        description: s.description ? String(s.description).trim() : undefined,
      };
    });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword_ids } = await req.json();

    if (!keyword_ids || !Array.isArray(keyword_ids) || keyword_ids.length === 0) {
      return new Response(JSON.stringify({ error: "keyword_ids array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch keyword details
    const { data: keywords, error: kwError } = await supabase
      .from("technology_keywords")
      .select("id, display_name, aliases")
      .in("id", keyword_ids);

    if (kwError) throw kwError;
    if (!keywords || keywords.length === 0) {
      return new Response(JSON.stringify({ error: "No keywords found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { keyword_id: string; keyword_name: string; added: number; skipped: number; errors: string[] }[] = [];

    for (const kw of keywords) {
      const kwResult = { keyword_id: kw.id, keyword_name: kw.display_name, added: 0, skipped: 0, errors: [] as string[] };

      try {
        // Rate limit: 1 request per 2 seconds for bulk
        if (keywords.length > 1) {
          await new Promise((r) => setTimeout(r, 2000));
        }

        const standards = await searchStandards(kw.display_name, kw.aliases || []);

        for (const std of standards) {
          // Check for existing (upsert by keyword_id + standard_code)
          const { data: existing } = await supabase
            .from("keyword_standards")
            .select("id")
            .eq("keyword_id", kw.id)
            .eq("standard_code", std.standard_code)
            .maybeSingle();

          if (existing) {
            kwResult.skipped++;
            continue;
          }

          const { error: insertError } = await supabase.from("keyword_standards").insert({
            keyword_id: kw.id,
            standard_code: std.standard_code,
            standard_title: std.standard_title,
            issuing_body: std.issuing_body,
            body_type: std.body_type,
            url: std.url || null,
            description: std.description || null,
            status: "ai_suggested",
          });

          if (insertError) {
            if (insertError.message?.includes("duplicate")) {
              kwResult.skipped++;
            } else {
              kwResult.errors.push(`${std.standard_code}: ${insertError.message}`);
            }
          } else {
            kwResult.added++;
          }
        }
      } catch (err: any) {
        kwResult.errors.push(err.message || "Unknown error");
      }

      results.push(kwResult);
    }

    const totalAdded = results.reduce((s, r) => s + r.added, 0);
    const totalSkipped = results.reduce((s, r) => s + r.skipped, 0);

    return new Response(
      JSON.stringify({
        success: true,
        summary: { total_added: totalAdded, total_skipped: totalSkipped, keywords_processed: results.length },
        details: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("enrich-standards error:", err);
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
