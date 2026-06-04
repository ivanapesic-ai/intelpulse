// Compass Analyst — streaming AI analyst grounded in the user's workspace.
// Modes: chat | hypothesis | report
// Returns SSE stream of text chunks.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_PERSONA =
  "You are a sober, executive-grade technology intelligence analyst. " +
  "You reason ONLY from the workspace data the user provides (signal scores, investment, patents, news, stances). " +
  "If the data doesn't support a claim, say so explicitly. Be terse, structured, no fluff. " +
  "Use short markdown: bold headings, bullets, no preamble.";

interface Item {
  name: string;
  signal: number;
  band: string;
  stance?: string;
  funding: number;
  companies: number;
  patents: number;
  news: number;
  description?: string;
}

function fmtFunding(eur: number) {
  if (!eur) return "—";
  if (eur >= 1e9) return `€${(eur / 1e9).toFixed(1)}B`;
  if (eur >= 1e6) return `€${(eur / 1e6).toFixed(0)}M`;
  if (eur >= 1e3) return `€${(eur / 1e3).toFixed(0)}K`;
  return `€${eur}`;
}

function buildWorkspaceContext(items: Item[]): string {
  if (!items.length) return "WORKSPACE: (empty)";
  const lines = items.map((it, i) =>
    `${i + 1}. ${it.name} — Signal ${it.signal}/100 (${it.band})` +
    (it.stance ? ` [user stance: ${it.stance}]` : "") +
    ` | Investment: ${fmtFunding(it.funding)} | Companies: ${it.companies} | Patents: ${it.patents} | News (12mo): ${it.news}` +
    (it.description ? `\n   ${it.description.slice(0, 200)}` : "")
  );
  return `WORKSPACE (${items.length} items):\n${lines.join("\n")}`;
}

function buildUserPrompt(mode: string, payload: any, ctx: string): string {
  if (mode === "hypothesis") {
    return `${ctx}\n\nHYPOTHESIS: "${payload.hypothesis}"\n\nWeigh the evidence in the workspace. Structure your reply as:\n**Verdict**: Supported / Rejected / Inconclusive (with confidence %).\n**Evidence for**: bullets referencing specific items.\n**Evidence against**: bullets referencing specific items.\n**What would change your mind**: 1-2 lines.`;
  }
  if (mode === "report") {
    return `${ctx}\n\nREPORT BRIEF: ${payload.brief}\nTEMPLATE: ${payload.template} (audience: ${payload.audience})\n\nWrite the analytical narrative for this report. Don't restate the raw numbers — interpret them. Lead with the headline insight, then 3-5 themed sections, end with a single recommended action.`;
  }
  // chat
  return `${ctx}\n\nUSER: ${payload.message}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode, persona, payload, items, history } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = (persona?.trim() || DEFAULT_PERSONA) +
      "\n\nAlways ground specific claims in the workspace data. Never invent companies, funding figures, or scores.";

    const ctx = buildWorkspaceContext(items || []);
    const userPrompt = buildUserPrompt(mode, payload || {}, ctx);

    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: system },
    ];
    if (mode === "chat" && Array.isArray(history)) {
      for (const m of history.slice(-10)) {
        if (m?.role && m?.text) messages.push({ role: m.role, content: m.text });
      }
    }
    messages.push({ role: "user", content: userPrompt });

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages,
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return new Response(JSON.stringify({ error: `Gateway ${upstream.status}: ${text}` }), {
        status: upstream.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
