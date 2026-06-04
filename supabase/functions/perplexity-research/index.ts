// Perplexity-grounded web research for the Studio workspace.
// POST body: { topics: string[], recency?: 'day'|'week'|'month'|'year', mode?: 'overview'|'milestones'|'deep' }
// Returns { content: string, citations: string[] }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "PERPLEXITY_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { topics, recency = "month", mode = "overview" } = await req.json();
    if (!Array.isArray(topics) || topics.length === 0) {
      return new Response(JSON.stringify({ error: "topics array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const topicList = topics.slice(0, 12).map((t) => `"${t}"`).join(", ");

    const prompts: Record<string, string> = {
      overview:
        `Provide a tight executive brief on what has happened in the past ${recency} across these technologies: ${topicList}. ` +
        `Focus on: (1) major investment rounds / M&A, (2) regulatory or standards milestones, (3) breakthroughs or productisation, ` +
        `(4) notable failures or pullbacks. Be terse. Use bold subheads per technology. Cite sources inline.`,
      milestones:
        `List concrete, dated milestones (ratifications, standards releases, regulatory approvals, major product launches) ` +
        `from the past 24 months for: ${topicList}. Use the format: **DD Mon YYYY** — [event]. One bullet per milestone. Cite sources.`,
      deep:
        `Write an in-depth analyst note synthesising the current state, momentum, and competitive landscape ` +
        `for these technologies: ${topicList}. Cover incumbents vs. challengers, capital flows, regulatory tailwinds/headwinds, ` +
        `and a forward 12-month outlook. Cite sources.`,
    };

    const userPrompt = prompts[mode] || prompts.overview;

    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: "You are a precise technology intelligence analyst. Cite every claim. No fluff." },
          { role: "user", content: userPrompt },
        ],
        search_recency_filter: recency,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return new Response(JSON.stringify({ error: `Perplexity ${res.status}: ${text.slice(0, 300)}` }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content || "";
    const citations: string[] = Array.isArray(data?.citations) ? data.citations : [];

    return new Response(JSON.stringify({ content, citations, model: data?.model }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
