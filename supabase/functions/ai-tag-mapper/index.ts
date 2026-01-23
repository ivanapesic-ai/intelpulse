import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Known Dealroom tags for the mobility/automotive/cloud-edge-iot space
const DEALROOM_TAXONOMY = [
  // Mobility & Automotive
  "electric mobility", "electric vehicles", "automotive", "autonomous vehicles", 
  "autonomous driving", "connected car", "mobility", "car sharing", "ride sharing",
  "fleet management", "logistics", "last mile delivery", "micro mobility",
  "charging infrastructure", "battery technology", "energy storage",
  
  // Cloud & Edge Computing
  "cloud computing", "edge computing", "data center", "infrastructure",
  "cloud infrastructure", "serverless", "containers", "kubernetes",
  "hybrid cloud", "multi-cloud", "cloud security", "cloud management",
  
  // IoT & Connectivity  
  "internet of things", "iot", "industrial iot", "smart cities", "smart home",
  "sensors", "embedded systems", "connectivity", "5g", "telecommunications",
  "wireless", "networking", "m2m", "telematics",
  
  // AI & Machine Learning
  "artificial intelligence", "machine learning", "deep learning", "computer vision",
  "natural language processing", "nlp", "robotics", "autonomous mobile robots",
  "automation", "predictive analytics", "ai infrastructure",
  
  // Hardware & Components
  "semiconductors", "chips", "lidar", "radar", "camera systems", "hardware",
  "electronic components", "power electronics", "thermal management",
  
  // Data & Analytics
  "big data", "data analytics", "data management", "data infrastructure",
  "business intelligence", "data visualization", "data engineering",
  
  // Security & Compliance
  "cybersecurity", "automotive cybersecurity", "data privacy", "identity management",
  "security", "compliance", "encryption",
  
  // Energy & Sustainability
  "cleantech", "renewable energy", "solar", "wind", "smart grid", "energy management",
  "sustainability", "carbon footprint", "green technology", "v2g", "vehicle to grid",
  
  // Software & Platforms
  "saas", "paas", "software", "platform", "enterprise software", "developer tools",
  "api", "integration", "middleware", "operating systems",
  
  // Industry Verticals
  "transportation", "supply chain", "manufacturing", "industrial", "aerospace",
  "defense", "healthcare", "fintech", "insurtech", "proptech"
];

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

AVAILABLE DEALROOM TAGS:
${DEALROOM_TAXONOMY.join(", ")}

RULES:
1. Select 1-4 most relevant tags per keyword
2. Prefer specific tags over generic ones
3. Consider the keyword's domain context (automotive, cloud, IoT, AI, etc.)
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

    // Validate tags against our known taxonomy
    const validTaxonomy = new Set(DEALROOM_TAXONOMY.map(t => t.toLowerCase()));
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
