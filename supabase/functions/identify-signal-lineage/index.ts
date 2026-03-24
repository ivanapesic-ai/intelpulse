import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface LineageLink {
  source_type: string;
  source_id: string;
  source_title: string;
  source_date: string | null;
  target_type: string;
  target_id: string;
  target_title: string;
  target_date: string | null;
  confidence: number;
  relationship_description: string;
}

async function analyzeKeyword(
  supabase: any,
  keywordId: string,
  keywordName: string,
  lovableApiKey: string
): Promise<{ keyword: string; links: number; error?: string }> {
  try {
    // 1. Fetch research papers
    const { data: researchRows } = await supabase
      .from("research_signals")
      .select("top_papers, snapshot_date")
      .eq("keyword_id", keywordId)
      .order("snapshot_date", { ascending: false })
      .limit(1);

    const topPapers: any[] = researchRows?.[0]?.top_papers || [];
    const researchItems = topPapers.slice(0, 20).map((p: any, i: number) => ({
      id: p.doi || `research_${i}`,
      title: p.title || "Untitled",
      year: p.publication_year || p.year || null,
      authors: p.authors || [],
      citations: p.cited_by_count || p.citations || 0,
    }));

    // 2. Fetch news articles
    const { data: newsMatches } = await supabase
      .from("news_keyword_matches")
      .select("news_id, news_items!inner(id, title, published_at, description, source_name)")
      .eq("keyword_id", keywordId)
      .order("created_at", { ascending: false })
      .limit(20);

    const newsItems = (newsMatches || []).map((m: any) => ({
      id: m.news_items.id,
      title: m.news_items.title,
      date: m.news_items.published_at,
      description: (m.news_items.description || "").slice(0, 200),
      source: m.news_items.source_name || "",
    }));

    // 3. Fetch patents via EPO edge function (cached or fresh)
    let patentItems: any[] = [];
    try {
      const { data: epoData } = await supabase.functions.invoke("epo-patent-lookup", {
        body: { action: "keyword_search", keyword: keywordName },
      });
      if (epoData?.patents) {
        patentItems = epoData.patents.slice(0, 20).map((p: any) => ({
          id: p.publicationNumber || `patent_${Math.random().toString(36).slice(2)}`,
          title: p.title || "Untitled Patent",
          applicant: p.applicant || "",
          filingDate: p.filingDate || null,
          abstract: (p.abstract || "").slice(0, 200),
        }));
      }
    } catch {
      // Patents optional — continue without them
    }

    // Skip if we don't have enough data
    const totalItems = researchItems.length + newsItems.length + patentItems.length;
    if (totalItems < 3) {
      return { keyword: keywordName, links: 0, error: "Insufficient data" };
    }

    // 4. Call Gemini Flash for matching
    const prompt = `You are analyzing technology signals for "${keywordName}". Below are research papers, patents, and news articles related to this technology.

Identify conceptual links where:
- A research paper likely influenced or is related to a patent (shared concepts, authors, or technology area)
- A patent is referenced or related to news coverage
- A research concept appears across multiple signal types

Only return high-confidence links (confidence > 0.6). Each link should explain the relationship in one sentence.

RESEARCH PAPERS:
${JSON.stringify(researchItems, null, 2)}

PATENTS:
${JSON.stringify(patentItems, null, 2)}

NEWS ARTICLES:
${JSON.stringify(newsItems, null, 2)}`;

    const aiResponse = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a technology intelligence analyst. Identify conceptual links between research papers, patents, and news articles. Be precise and only flag genuine connections.",
          },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_lineage_links",
              description:
                "Report identified conceptual links between research, patents, and news signals.",
              parameters: {
                type: "object",
                properties: {
                  links: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        source_type: {
                          type: "string",
                          enum: ["research", "patent", "news"],
                        },
                        source_id: { type: "string" },
                        source_title: { type: "string" },
                        source_date: { type: "string", description: "ISO date or year" },
                        target_type: {
                          type: "string",
                          enum: ["research", "patent", "news"],
                        },
                        target_id: { type: "string" },
                        target_title: { type: "string" },
                        target_date: { type: "string", description: "ISO date or year" },
                        confidence: { type: "number", minimum: 0, maximum: 1 },
                        relationship_description: { type: "string" },
                      },
                      required: [
                        "source_type",
                        "source_id",
                        "source_title",
                        "target_type",
                        "target_id",
                        "target_title",
                        "confidence",
                        "relationship_description",
                      ],
                    },
                  },
                },
                required: ["links"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_lineage_links" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return { keyword: keywordName, links: 0, error: `AI error: ${aiResponse.status}` };
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return { keyword: keywordName, links: 0, error: "No tool call in AI response" };
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const links: LineageLink[] = parsed.links || [];

    // 5. Upsert into signal_lineage
    if (links.length > 0) {
      // Clear previous lineage for this keyword
      await supabase.from("signal_lineage").delete().eq("keyword_id", keywordId);

      const normalizeDate = (d: string | null): string | null => {
        if (!d) return null;
        // Year-only like "2025" → "2025-01-01"
        if (/^\d{4}$/.test(d)) return `${d}-01-01`;
        // Already ISO-ish date
        if (/^\d{4}-\d{2}/.test(d)) return d.slice(0, 10);
        return null;
      };

      const rows = links.map((l) => ({
        keyword_id: keywordId,
        source_type: l.source_type,
        source_id: l.source_id,
        source_title: l.source_title,
        source_date: normalizeDate(l.source_date),
        target_type: l.target_type,
        target_id: l.target_id,
        target_title: l.target_title,
        target_date: normalizeDate(l.target_date),
        confidence: l.confidence,
        relationship_description: l.relationship_description,
      }));

      const { error: insertError } = await supabase
        .from("signal_lineage")
        .insert(rows);

      if (insertError) {
        console.error("Insert error:", insertError);
        return {
          keyword: keywordName,
          links: 0,
          error: insertError.message,
        };
      }
    }

    return { keyword: keywordName, links: links.length };
  } catch (err: any) {
    console.error(`Error analyzing ${keywordName}:`, err);
    return { keyword: keywordName, links: 0, error: err.message };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, keyword_id } = await req.json();

    if (action === "analyze_keyword" && keyword_id) {
      // Single keyword
      const { data: kw } = await supabase
        .from("technology_keywords")
        .select("id, keyword, display_name")
        .eq("id", keyword_id)
        .single();

      if (!kw) {
        return new Response(JSON.stringify({ error: "Keyword not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const result = await analyzeKeyword(
        supabase,
        kw.id,
        kw.display_name || kw.keyword,
        lovableApiKey
      );

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "analyze_all") {
      const { data: keywords } = await supabase
        .from("technology_keywords")
        .select("id, keyword, display_name")
        .eq("is_active", true);

      const results: any[] = [];
      for (const kw of keywords || []) {
        const result = await analyzeKeyword(
          supabase,
          kw.id,
          kw.display_name || kw.keyword,
          lovableApiKey
        );
        results.push(result);
        // Rate limit: 2s between calls
        await new Promise((r) => setTimeout(r, 2000));
      }

      return new Response(
        JSON.stringify({
          success: true,
          analyzed: results.length,
          total_links: results.reduce((s, r) => s + r.links, 0),
          results,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use analyze_keyword or analyze_all" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Signal lineage error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
