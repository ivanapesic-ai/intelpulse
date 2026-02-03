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

interface MappingResult {
  dealroom_term: string;
  term_type: "industry" | "sub_industry" | "tag";
  relationship: "primary" | "related" | "tangential";
  confidence: number;
  reasoning: string;
}

interface KeywordMappingResponse {
  keyword_id: string;
  mappings: MappingResult[];
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

    console.log(`Processing ${keywords.length} keywords for AI tag mapping with confidence scoring`);

    // Build comprehensive taxonomy list for AI
    const allTerms = [
      ...industries.map(t => `[industry] ${t}`),
      ...subIndustries.map(t => `[sub_industry] ${t}`),
      ...techTags.map(t => `[tag] ${t}`),
    ].join("\n");

    // Process each keyword individually for detailed mapping
    const allMappings: Array<{
      keywordId: string;
      keyword: string;
      mappings: MappingResult[];
    }> = [];

    for (const keyword of keywords) {
      const systemPrompt = `You are an expert technology taxonomy mapper specializing in automotive and energy technology domains.

Your task is to map CEI-SPHERE technology keywords to Dealroom taxonomy terms with:
1. Relationship strength (primary/related/tangential)
2. Confidence score (0-100)
3. Clear reasoning for each mapping

RELATIONSHIP DEFINITIONS:
- primary: The Dealroom term is a DIRECT synonym or describes the EXACT same technology
- related: The Dealroom term is in the same domain and companies with this tag would likely work on the keyword's technology
- tangential: The Dealroom term has some connection but is not a primary focus area

CONFIDENCE SCORING:
- 90-100: Exact match or near-synonym (e.g., "EV Charging" → "EV charging infrastructure")
- 70-89: Strong domain match (e.g., "Autonomous Driving" → "ADAS")
- 50-69: Related domain (e.g., "Battery Electric Vehicle" → "Electric mobility")
- 30-49: Tangential connection (use sparingly)
- 0-29: Do not include these

STRICT RULES:
1. NEVER map to generic enabling technologies unless keyword IS that technology
   - FORBIDDEN unless keyword matches: artificial intelligence, machine learning, IoT, robotics, automation, sustainability
2. NEVER map to overly broad industry terms: automotive, transportation, energy, technology
3. BE CONSERVATIVE: 3-8 high-confidence mappings are better than 15 weak ones
4. Each mapping MUST have clear reasoning explaining WHY it's relevant

VERIFIED DEALROOM TERMS (prioritize these):
${verifiedDealroomTerms.slice(0, 40).join(", ")}`;

      const userPrompt = `Map this CEI-SPHERE keyword to Dealroom taxonomy:

KEYWORD: "${keyword.display_name}"
Description: ${keyword.description || "N/A"}

AVAILABLE DEALROOM TERMS:
${allTerms}

For each semantically related term, provide:
1. The exact term name (must match the list above)
2. Term type (industry/sub_industry/tag)
3. Relationship strength (primary/related/tangential)
4. Confidence score (0-100)
5. Brief reasoning (1 sentence)

Only include mappings with confidence >= 40.`;

      // Call Lovable AI with structured tool for this keyword
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
                name: "map_keyword_to_dealroom",
                description: "Map a CEI keyword to Dealroom taxonomy terms with confidence and reasoning",
                parameters: {
                  type: "object",
                  properties: {
                    keyword_id: { type: "string" },
                    mappings: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          dealroom_term: { 
                            type: "string",
                            description: "Exact Dealroom taxonomy term name"
                          },
                          term_type: { 
                            type: "string", 
                            enum: ["industry", "sub_industry", "tag"],
                            description: "Type of Dealroom term"
                          },
                          relationship: { 
                            type: "string", 
                            enum: ["primary", "related", "tangential"],
                            description: "How closely related the term is to the keyword"
                          },
                          confidence: { 
                            type: "number",
                            minimum: 0,
                            maximum: 100,
                            description: "Confidence score 0-100"
                          },
                          reasoning: { 
                            type: "string",
                            description: "Brief explanation of why this mapping is relevant"
                          }
                        },
                        required: ["dealroom_term", "term_type", "relationship", "confidence", "reasoning"]
                      }
                    }
                  },
                  required: ["keyword_id", "mappings"]
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "map_keyword_to_dealroom" } }
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.error("Rate limit hit for keyword:", keyword.display_name);
          continue; // Skip this keyword, try next
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        continue; // Skip this keyword
      }

      const aiResult = await response.json();
      
      // Extract mappings from tool call
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        try {
          const parsed: KeywordMappingResponse = JSON.parse(toolCall.function.arguments);
          
          // Validate against our loaded taxonomy (case-insensitive)
          const validIndustries = new Set(industries.map(t => t.toLowerCase()));
          const validSubIndustries = new Set(subIndustries.map(t => t.toLowerCase()));
          const validTags = new Set(techTags.map(t => t.toLowerCase()));

          // Filter and validate mappings
          const validatedMappings = (parsed.mappings || []).filter(m => {
            const termLower = m.dealroom_term.toLowerCase();
            
            // Check if term exists in correct category
            let isValid = false;
            if (m.term_type === "industry") isValid = validIndustries.has(termLower);
            else if (m.term_type === "sub_industry") isValid = validSubIndustries.has(termLower);
            else if (m.term_type === "tag") isValid = validTags.has(termLower);
            
            // Apply blacklist filter
            if (isGenericTerm(m.dealroom_term)) {
              if (!keywordMatchesGenericTerm(keyword.keyword, m.dealroom_term)) {
                console.log(`Filtered blacklisted term: ${m.dealroom_term} for ${keyword.display_name}`);
                return false;
              }
            }
            
            // Minimum confidence threshold
            if (m.confidence < 40) return false;
            
            return isValid;
          });

          allMappings.push({
            keywordId: keyword.id,
            keyword: keyword.display_name,
            mappings: validatedMappings
          });

          console.log(`${keyword.display_name}: ${validatedMappings.length} validated mappings`);
        } catch (parseError) {
          console.error(`Failed to parse AI response for ${keyword.display_name}:`, parseError);
        }
      }

      // Small delay between requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Store mappings in cei_dealroom_mappings table
    let storedCount = 0;
    for (const keywordMapping of allMappings) {
      for (const mapping of keywordMapping.mappings) {
        const { error: insertError } = await supabase
          .from("cei_dealroom_mappings")
          .upsert({
            keyword_id: keywordMapping.keywordId,
            dealroom_term: mapping.dealroom_term,
            term_type: mapping.term_type,
            relationship_type: mapping.relationship,
            confidence_score: Math.round(mapping.confidence),
            reasoning: mapping.reasoning,
            mapped_by: "gemini-ai",
            verified: false
          }, {
            onConflict: "keyword_id,dealroom_term,term_type"
          });

        if (insertError) {
          console.error(`Failed to store mapping:`, insertError);
        } else {
          storedCount++;
        }
      }

      // Also update the legacy dealroom_tags column for backward compatibility
      const primaryTags = keywordMapping.mappings
        .filter(m => m.term_type === "tag" && m.relationship === "primary")
        .map(m => m.dealroom_term);
      const relatedTags = keywordMapping.mappings
        .filter(m => m.term_type === "tag" && m.relationship === "related")
        .map(m => m.dealroom_term);
      const allTags = [...primaryTags, ...relatedTags];

      const primarySubIndustries = keywordMapping.mappings
        .filter(m => m.term_type === "sub_industry" && m.confidence >= 60)
        .map(m => m.dealroom_term);

      const primaryIndustries = keywordMapping.mappings
        .filter(m => m.term_type === "industry" && m.confidence >= 70)
        .map(m => m.dealroom_term);

      if (allTags.length > 0 || primarySubIndustries.length > 0 || primaryIndustries.length > 0) {
        await supabase
          .from("technology_keywords")
          .update({
            dealroom_tags: allTags,
            dealroom_sub_industries: primarySubIndustries,
            dealroom_industries: primaryIndustries
          })
          .eq("id", keywordMapping.keywordId);
      }
    }

    console.log(`Successfully stored ${storedCount} mappings for ${allMappings.length} keywords`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: keywords.length,
        keywordsMapped: allMappings.length,
        totalMappingsStored: storedCount,
        mappings: allMappings.map(m => ({
          keywordId: m.keywordId,
          keyword: m.keyword,
          mappingCount: m.mappings.length,
          primaryMappings: m.mappings.filter(x => x.relationship === "primary").length,
          relatedMappings: m.mappings.filter(x => x.relationship === "related").length,
          avgConfidence: m.mappings.length > 0 
            ? Math.round(m.mappings.reduce((sum, x) => sum + x.confidence, 0) / m.mappings.length)
            : 0,
          topMappings: m.mappings.slice(0, 5).map(x => ({
            term: x.dealroom_term,
            type: x.term_type,
            relationship: x.relationship,
            confidence: x.confidence,
            reasoning: x.reasoning
          }))
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
