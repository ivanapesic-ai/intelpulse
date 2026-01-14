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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { documentId, content } = await req.json();

    if (!documentId) {
      throw new Error("documentId is required");
    }

    // Update document status to parsing
    await supabase
      .from("cei_documents")
      .update({ parse_status: "parsing" })
      .eq("id", documentId);

    // Get all active keywords for matching
    const { data: keywords, error: keywordsError } = await supabase
      .from("technology_keywords")
      .select("id, keyword, display_name, aliases")
      .eq("is_active", true);

    if (keywordsError) {
      throw new Error(`Failed to fetch keywords: ${keywordsError.message}`);
    }

    const keywordList = keywords?.map(k => ({
      id: k.id,
      terms: [k.keyword, k.display_name, ...(k.aliases || [])],
    })) || [];

    // Build prompt for AI extraction
    const systemPrompt = `You are an expert at extracting technology information from documents about Cloud, Edge, IoT, and AI/ML technologies in the European context.

Your task is to analyze the document content and extract:
1. Technology mentions - identify which technologies from the provided list are mentioned
2. TRL (Technology Readiness Level) - if mentioned, extract the TRL level (1-9)
3. Policy references - extract any EU policy, regulation, or initiative references

For each technology mention, provide:
- keyword_id: The ID of the matched keyword
- mention_context: A brief quote or summary of how the technology is mentioned (max 200 chars)
- trl_mentioned: The TRL level if mentioned (1-9), or null
- policy_reference: Any related policy/regulation mentioned, or null
- confidence_score: How confident you are in this match (0.0-1.0)
- page_number: The page number if available, or null

Respond with a JSON object in this exact format:
{
  "mentions": [
    {
      "keyword_id": "uuid-here",
      "mention_context": "brief quote or summary",
      "trl_mentioned": 7,
      "policy_reference": "EU AI Act",
      "confidence_score": 0.95,
      "page_number": 1
    }
  ],
  "summary": "Brief overall summary of the document's technology focus"
}`;

    const userPrompt = `Here are the technology keywords to look for:
${JSON.stringify(keywordList, null, 2)}

Please analyze this document content and extract technology mentions:

${content}`;

    // Call Lovable AI for extraction
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error("Rate limit exceeded, please try again later");
      }
      if (aiResponse.status === 402) {
        throw new Error("Payment required, please add credits to Lovable AI");
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const responseContent = aiData.choices?.[0]?.message?.content;

    if (!responseContent) {
      throw new Error("No response from AI");
    }

    // Parse AI response
    let extractedData: { mentions: Array<{
      keyword_id: string;
      mention_context: string;
      trl_mentioned: number | null;
      policy_reference: string | null;
      confidence_score: number;
      page_number: number | null;
    }>; summary: string };

    try {
      extractedData = JSON.parse(responseContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseContent);
      throw new Error("Failed to parse AI extraction results");
    }

    // Insert technology mentions
    const mentions = extractedData.mentions || [];
    let mentionsCreated = 0;

    for (const mention of mentions) {
      // Validate keyword_id exists
      const validKeyword = keywords?.find(k => k.id === mention.keyword_id);
      if (!validKeyword) {
        console.warn(`Invalid keyword_id: ${mention.keyword_id}`);
        continue;
      }

      const { error: mentionError } = await supabase
        .from("document_technology_mentions")
        .insert({
          document_id: documentId,
          keyword_id: mention.keyword_id,
          mention_context: mention.mention_context?.slice(0, 500) || null,
          trl_mentioned: mention.trl_mentioned || null,
          policy_reference: mention.policy_reference || null,
          confidence_score: Math.min(1, Math.max(0, mention.confidence_score || 0.5)),
          page_number: mention.page_number || null,
        });

      if (mentionError) {
        console.error("Error inserting mention:", mentionError);
      } else {
        mentionsCreated++;
      }
    }

    // Update document with parsed content and status
    await supabase
      .from("cei_documents")
      .update({
        parse_status: "completed",
        parsed_content: {
          summary: extractedData.summary,
          mentions_count: mentionsCreated,
          extracted_at: new Date().toISOString(),
        },
      })
      .eq("id", documentId);

    // Update technology document_mention_count for affected keywords
    const affectedKeywordIds = [...new Set(mentions.map(m => m.keyword_id).filter(Boolean))];
    
    for (const keywordId of affectedKeywordIds) {
      const { count } = await supabase
        .from("document_technology_mentions")
        .select("*", { count: "exact", head: true })
        .eq("keyword_id", keywordId);

      await supabase
        .from("technologies")
        .update({ document_mention_count: count || 0 })
        .eq("keyword_id", keywordId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        mentionsCreated,
        summary: extractedData.summary,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Document parsing error:", error);

    // Try to update document status to failed
    try {
      const { documentId } = await req.json().catch(() => ({}));
      if (documentId) {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
          const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
          await supabase
            .from("cei_documents")
            .update({ parse_status: "failed" })
            .eq("id", documentId);
        }
      }
    } catch {
      // Ignore cleanup errors
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
