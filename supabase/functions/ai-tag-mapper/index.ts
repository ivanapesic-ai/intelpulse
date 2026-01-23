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

    // Fetch DYNAMIC taxonomy from database instead of hardcoded list
    const { data: taxonomyData, error: taxonomyError } = await supabase
      .from("dealroom_taxonomy")
      .select("name, taxonomy_type")
      .eq("is_active", true);

    if (taxonomyError) {
      console.warn("Failed to fetch taxonomy, using fallback:", taxonomyError);
    }

    // Build taxonomy list from database (industries, sub-industries, and technology tags)
    const dealroomTaxonomy = taxonomyData?.map(t => t.name) || [];
    
    // If no taxonomy loaded, provide a minimal fallback
    if (dealroomTaxonomy.length === 0) {
      dealroomTaxonomy.push(
        "electric mobility", "electric vehicles", "automotive", "cloud computing",
        "edge computing", "internet of things", "artificial intelligence", 
        "energy storage", "renewable energy", "smart grid", "sustainability"
      );
    }

    console.log(`Loaded ${dealroomTaxonomy.length} taxonomy terms from database`);

    // Fetch keywords to map
    let query = supabase
      .from("technology_keywords")
      .select("id, keyword, display_name, category, source");

    if (mode === "single" && keywordIds?.length) {
      query = query.in("id", keywordIds);
    } else if (mode === "unmapped") {
      // Fetch all unmapped keywords
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

    // Build prompt for AI
    const keywordList = keywords.map(k => 
      `- "${k.display_name}" (keyword: ${k.keyword}, category: ${k.category || "general"})`
    ).join("\n");

    const systemPrompt = `You are an expert at mapping technology taxonomy terms to Dealroom's company tag system. 
Your task is to suggest the most relevant Dealroom tags for each technology keyword.

AVAILABLE DEALROOM TAGS (${dealroomTaxonomy.length} categories - industries, sub-industries, and technology tags):
${dealroomTaxonomy.slice(0, 200).join(", ")}${dealroomTaxonomy.length > 200 ? `... and ${dealroomTaxonomy.length - 200} more` : ""}

RULES:
1. Select 1-4 most relevant tags per keyword
2. Prefer specific tags over generic ones
3. Consider the keyword's domain context (automotive, cloud, IoT, AI, energy, etc.)
4. Tags must be exact matches from the available list
5. Return JSON only, no explanations`;

    const userPrompt = `Map these technology keywords to Dealroom tags:

${keywordList}

Return a JSON array with this structure:
[
  { "keyword_id": "<id>", "tags": ["tag1", "tag2"] },
  ...
]`;

    // Call Lovable AI
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
              name: "map_keywords_to_tags",
              description: "Map technology keywords to Dealroom tags",
              parameters: {
                type: "object",
                properties: {
                  mappings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        keyword_id: { type: "string" },
                        tags: { 
                          type: "array", 
                          items: { type: "string" }
                        }
                      },
                      required: ["keyword_id", "tags"]
                    }
                  }
                },
                required: ["mappings"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "map_keywords_to_tags" } }
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
    let mappings: Array<{ keyword_id: string; tags: string[] }> = [];
    
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      mappings = parsed.mappings || [];
    }

    // Validate tags against our loaded taxonomy (case-insensitive)
    const validTaxonomy = new Set(dealroomTaxonomy.map(t => t.toLowerCase()));
    mappings = mappings.map(m => ({
      ...m,
      tags: m.tags.filter(t => validTaxonomy.has(t.toLowerCase()))
    }));

    // Update database with new mappings
    let updated = 0;
    for (const mapping of mappings) {
      if (mapping.tags.length > 0) {
        const { error: updateError } = await supabase
          .from("technology_keywords")
          .update({ dealroom_tags: mapping.tags })
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
