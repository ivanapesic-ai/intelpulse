import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keywordIds, mode = "single" } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch DYNAMIC taxonomy from database - grouped by type
    const { data: taxonomyData, error: taxonomyError } = await supabase
      .from("dealroom_taxonomy")
      .select("name, taxonomy_type")
      .eq("is_active", true);

    if (taxonomyError) {
      console.warn("Failed to fetch taxonomy, using fallback:", taxonomyError);
    }

    // Group taxonomy by type
    const industries: string[] = [];
    const subIndustries: string[] = [];
    const techTags: string[] = [];
    
    (taxonomyData || []).forEach(t => {
      if (t.taxonomy_type === "industry") industries.push(t.name);
      else if (t.taxonomy_type === "sub_industry") subIndustries.push(t.name);
      else if (t.taxonomy_type === "technology") techTags.push(t.name);
    });

    console.log(`Loaded taxonomy: ${industries.length} industries, ${subIndustries.length} sub-industries, ${techTags.length} tech tags`);

    // Fetch keywords to map
    let query = supabase
      .from("technology_keywords")
      .select("id, keyword, display_name, source, description");

    if (mode === "single" && keywordIds?.length) {
      query = query.in("id", keywordIds);
    } else if (mode === "unmapped") {
      // Fetch keywords missing ALL types of mappings
      query = query.or("dealroom_tags.is.null,dealroom_tags.eq.{}");
    }

    const { data: keywords, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    if (!keywords || keywords.length === 0) {
      return new Response(
        JSON.stringify({ message: "No keywords to map", mappings: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${keywords.length} keywords for AI tag mapping`);

    // Build prompt for AI with structured taxonomy
    const keywordList = keywords.map(k => 
      `- "${k.display_name}" (keyword: ${k.keyword}, description: ${k.description || "N/A"})`
    ).join("\n");

    const systemPrompt = `You are an expert at mapping technology taxonomy terms to Dealroom's company classification system.
Your task is to suggest the most relevant Dealroom industries, sub-industries, AND technology tags for each CEI-SPHERE keyword.

AVAILABLE DEALROOM TAXONOMY:

INDUSTRIES (${industries.length} total):
${industries.slice(0, 50).join(", ")}${industries.length > 50 ? `... and ${industries.length - 50} more` : ""}

SUB-INDUSTRIES (${subIndustries.length} total):
${subIndustries.slice(0, 80).join(", ")}${subIndustries.length > 80 ? `... and ${subIndustries.length - 80} more` : ""}

TECHNOLOGY TAGS (${techTags.length} total):
${techTags.slice(0, 100).join(", ")}${techTags.length > 100 ? `... and ${techTags.length - 100} more` : ""}

RULES:
1. For EACH keyword, suggest:
   - 1-2 industries (broad categories like "transportation", "energy")
   - 1-3 sub-industries (specific sectors like "electric vehicles", "energy storage")
   - 1-4 technology tags (granular terms like "battery technology", "charging infrastructure")
2. Prefer specific, relevant terms over generic ones
3. Consider the keyword's domain context (automotive, energy, IoT, AI, etc.)
4. All suggested terms must be EXACT matches from the available lists
5. Return structured JSON only, no explanations`;

    const userPrompt = `Map these CEI-SPHERE technology keywords to Dealroom taxonomy:

${keywordList}

Return a JSON array with this structure:
[
  { 
    "keyword_id": "<id>", 
    "industries": ["industry1", "industry2"],
    "sub_industries": ["sub1", "sub2"],
    "tags": ["tag1", "tag2", "tag3"]
  },
  ...
]`;

    // Call Lovable AI with structured tool
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "map_keywords_to_taxonomy",
              description: "Map technology keywords to Dealroom industries, sub-industries, and tags",
              parameters: {
                type: "object",
                properties: {
                  mappings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        keyword_id: { type: "string" },
                        industries: { 
                          type: "array", 
                          items: { type: "string" },
                          description: "Broad industry categories"
                        },
                        sub_industries: { 
                          type: "array", 
                          items: { type: "string" },
                          description: "Specific sub-industry sectors"
                        },
                        tags: { 
                          type: "array", 
                          items: { type: "string" },
                          description: "Granular technology tags"
                        }
                      },
                      required: ["keyword_id", "industries", "sub_industries", "tags"]
                    }
                  }
                },
                required: ["mappings"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "map_keywords_to_taxonomy" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    console.log("AI response:", JSON.stringify(aiResult, null, 2));

    // Extract mappings from tool call
    interface Mapping {
      keyword_id: string;
      industries: string[];
      sub_industries: string[];
      tags: string[];
    }
    let mappings: Mapping[] = [];
    
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      mappings = parsed.mappings || [];
    }

    // Validate against our loaded taxonomy (case-insensitive)
    const validIndustries = new Set(industries.map(t => t.toLowerCase()));
    const validSubIndustries = new Set(subIndustries.map(t => t.toLowerCase()));
    const validTags = new Set(techTags.map(t => t.toLowerCase()));

    mappings = mappings.map(m => ({
      ...m,
      industries: m.industries.filter(t => validIndustries.has(t.toLowerCase())),
      sub_industries: m.sub_industries.filter(t => validSubIndustries.has(t.toLowerCase())),
      tags: m.tags.filter(t => validTags.has(t.toLowerCase()))
    }));

    // Update database with new mappings (all three columns)
    let updated = 0;
    for (const mapping of mappings) {
      const hasContent = mapping.industries.length > 0 || mapping.sub_industries.length > 0 || mapping.tags.length > 0;
      if (hasContent) {
        const { error: updateError } = await supabase
          .from("technology_keywords")
          .update({ 
            dealroom_industries: mapping.industries,
            dealroom_sub_industries: mapping.sub_industries,
            dealroom_tags: mapping.tags 
          })
          .eq("id", mapping.keyword_id);

        if (updateError) {
          console.error(`Failed to update ${mapping.keyword_id}:`, updateError);
        } else {
          updated++;
        }
      }
    }

    console.log(`Successfully mapped ${updated}/${keywords.length} keywords`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: keywords.length,
        updated,
        mappings: mappings.map(m => ({
          keywordId: m.keyword_id,
          keyword: keywords.find(k => k.id === m.keyword_id)?.display_name,
          industries: m.industries,
          subIndustries: m.sub_industries,
          tags: m.tags
        }))
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI tag mapper error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
