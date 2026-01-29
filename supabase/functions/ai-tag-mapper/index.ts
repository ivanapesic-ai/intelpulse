import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Blacklist of generic enabling technologies that should NEVER be suggested
// unless the CEI keyword itself is specifically that technology
const BLACKLISTED_GENERIC_TERMS = [
  "artificial intelligence",
  "machine learning",
  "ai/ml",
  "software",
  "cloud computing",
  "cloud",
  "automation",
  "iot",
  "internet of things",
  "robotics",
  "robots",
  "sustainability",
  "cleantech",
  "climate tech",
  "data analytics",
  "big data",
  "computer vision",
  "deep learning",
  "automotive",
  "transportation",
  "energy",
  "technology",
  "hardware",
  "saas",
];

// Check if a term is in the blacklist
function isGenericTerm(term: string): boolean {
  return BLACKLISTED_GENERIC_TERMS.includes(term.toLowerCase().trim());
}

// Check if the keyword itself is the generic term (then it's allowed)
function keywordMatchesGenericTerm(keyword: string, term: string): boolean {
  const kwLower = keyword.toLowerCase().trim();
  const termLower = term.toLowerCase().trim();
  return kwLower.includes(termLower) || termLower.includes(kwLower);
}

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

    // Also fetch Dealroom-source keywords as verified mapping targets
    const { data: dealroomKeywords } = await supabase
      .from("technology_keywords")
      .select("keyword, display_name")
      .eq("source", "dealroom")
      .eq("is_active", true);

    const verifiedDealroomTerms = (dealroomKeywords || []).map(k => k.display_name);

    console.log(`Loaded taxonomy: ${industries.length} industries, ${subIndustries.length} sub-industries, ${techTags.length} tech tags, ${verifiedDealroomTerms.length} verified Dealroom keywords`);

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

    // Build prompt for AI with STRICT matching rules
    const keywordList = keywords.map(k => 
      `- "${k.display_name}" (keyword: ${k.keyword}, description: ${k.description || "N/A"})`
    ).join("\n");

    const systemPrompt = `You are a STRICT taxonomy mapper for Dealroom company discovery. 
Your task is to suggest ONLY the most precisely relevant Dealroom terms for each CEI-SPHERE keyword.

CRITICAL RULES - FOLLOW EXACTLY:

1. ONLY suggest terms that describe the EXACT SAME technology/domain as the keyword
   - The term must be so specific that searching it would return ONLY companies in that exact domain
   
2. NEVER suggest generic enabling technologies unless the CEI keyword IS that technology:
   - FORBIDDEN: artificial intelligence, machine learning, software, cloud, IoT, robotics, automation, sustainability, cleantech
   - WRONG: "Autonomous Driving" -> "artificial intelligence" (would match ANY AI company!)
   - RIGHT: "Autonomous Driving" -> "autonomous driving", "autonomous vehicles", "ADAS", "LiDAR"
   - EXCEPTION: If keyword IS "Artificial Intelligence", then "artificial intelligence" is allowed

3. NEVER suggest overly broad industry terms:
   - FORBIDDEN for most keywords: "automotive", "transportation", "energy", "technology"
   - These match too many unrelated companies

4. PREFER exact or near-exact matches from Dealroom's verified terms:
   VERIFIED DEALROOM TERMS (prioritize these): ${verifiedDealroomTerms.slice(0, 40).join(", ")}

5. QUALITY TEST: Ask yourself "Would searching this tag find ONLY companies in the ${keywords[0]?.display_name || 'target'} domain?"
   - If NO (would match other domains), DON'T include it
   - If YES (specific to this domain), include it

6. BE CONSERVATIVE: It's better to have 1-2 precise matches than 5 vague ones

AVAILABLE DEALROOM TAXONOMY:

INDUSTRIES (use sparingly - most are too broad): ${industries.slice(0, 30).join(", ")}

SUB-INDUSTRIES (more specific - good for matching): ${subIndustries.slice(0, 60).join(", ")}

TECHNOLOGY TAGS (most specific - best for matching): ${techTags.slice(0, 80).join(", ")}

EXAMPLES OF CORRECT MAPPINGS:

"Autonomous Driving" ->
  industries: [] (none - "automotive" too broad)
  sub_industries: ["Autonomous vehicles"]
  tags: ["Autonomous driving", "ADAS", "LiDAR", "AV Software"]

"Battery Electric Vehicle" ->
  industries: []
  sub_industries: ["Electric vehicles"]
  tags: ["EV", "Electric mobility", "EV Battery"]

"Smart Grid" ->
  industries: []
  sub_industries: []
  tags: ["Smart grid", "Grid balancing", "Demand response"]

"Vehicle to Grid" ->
  industries: []
  sub_industries: []
  tags: ["Vehicle-to-grid", "V2X", "Bidirectional charging", "EV Charging"]`;

    const userPrompt = `Map these CEI-SPHERE technology keywords to Dealroom taxonomy with STRICT precision:

${keywordList}

Return a JSON array. Be VERY selective - only include terms that precisely match the domain:
[
  { 
    "keyword_id": "<id>", 
    "industries": ["only if highly specific match"],
    "sub_industries": ["prefer these for domain matching"],
    "tags": ["most specific terms only"]
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
              description: "Map technology keywords to Dealroom industries, sub-industries, and tags with strict precision",
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
                          description: "Broad industry categories - use sparingly, most are too broad"
                        },
                        sub_industries: { 
                          type: "array", 
                          items: { type: "string" },
                          description: "Specific sub-industry sectors - good for domain matching"
                        },
                        tags: { 
                          type: "array", 
                          items: { type: "string" },
                          description: "Granular technology tags - most specific, best for matching"
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
    console.log("AI response received, processing mappings...");

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

    // Apply strict validation + blacklist filtering
    mappings = mappings.map(m => {
      const keyword = keywords.find(k => k.id === m.keyword_id);
      const keywordText = keyword?.keyword || "";
      
      // Filter function that removes blacklisted terms unless keyword matches
      const filterBlacklisted = (term: string) => {
        if (isGenericTerm(term)) {
          // Only allow if the keyword itself is the generic term
          return keywordMatchesGenericTerm(keywordText, term);
        }
        return true;
      };

      return {
        ...m,
        industries: m.industries
          .filter(t => validIndustries.has(t.toLowerCase()))
          .filter(filterBlacklisted),
        sub_industries: m.sub_industries
          .filter(t => validSubIndustries.has(t.toLowerCase()))
          .filter(filterBlacklisted),
        tags: m.tags
          .filter(t => validTags.has(t.toLowerCase()))
          .filter(filterBlacklisted)
      };
    });

    // Log filtering results for debugging
    mappings.forEach(m => {
      const keyword = keywords.find(k => k.id === m.keyword_id);
      console.log(`${keyword?.display_name}: ${m.industries.length} industries, ${m.sub_industries.length} sub-industries, ${m.tags.length} tags`);
    });

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

    console.log(`Successfully mapped ${updated}/${keywords.length} keywords with strict filtering`);

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
