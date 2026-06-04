import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  FileText, Download, Sparkles, X, Loader2, FlaskConical, MessageSquare,
  CheckCircle2, Send, Paperclip, Plus, Printer, TrendingUp, TrendingDown,
  User, Settings2, StopCircle,
} from "lucide-react";
import { useTechnologyIntelligence } from "@/hooks/useTechnologyIntelligence";
import { loadWorkspace, toggleWorkspace, signalStrength, strengthBand, fmtFunding, loadStances } from "./lib";
import { cn } from "@/lib/utils";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const ANALYST_URL = `${SUPABASE_URL}/functions/v1/compass-analyst`;

type Mode = "report" | "hypothesis" | "chat";
type TemplateId = "executive" | "deep-dive" | "momentum" | "watchlist";

const TEMPLATES: Array<{ id: TemplateId; label: string; description: string; audience: string; length: string; brief: string }> = [
  { id: "executive", label: "Executive Brief", description: "Leadership-ready summary: key moves, risks and asks.", audience: "Leadership", length: "~1 page",
    brief: "1-page executive brief: top movements, risks, single recommended action." },
  { id: "deep-dive", label: "Technology Deep Dive", description: "Detailed analysis with momentum, standards and interop.", audience: "Analysts", length: "~4 pages",
    brief: "Deep dive: momentum, drivers, standards landscape, interoperability impact." },
  { id: "momentum", label: "Momentum Update", description: "What moved up, what moved down, and why.", audience: "Strategy", length: "~2 pages",
    brief: "Momentum summary grouped as rising / stable / declining with strongest driver each." },
  { id: "watchlist", label: "Watchlist Review", description: "Stance check on bullish vs bearish items.", audience: "Owners", length: "~2 pages",
    brief: "Review each watchlist item, confirm or challenge the user's stance based on signals." },
];

const MODES: Array<{ id: Mode; label: string; icon: typeof FileText; hint: string }> = [
  { id: "report", label: "Compose Report", icon: FileText, hint: "Pick a template — the analyst writes the narrative." },
  { id: "hypothesis", label: "Hypothesis", icon: FlaskConical, hint: "State a thesis. The analyst weighs the evidence and delivers a verdict." },
  { id: "chat", label: "Ask Analyst", icon: MessageSquare, hint: "Free-form Q&A grounded in your selected items." },
];

const PERSONA_PRESETS = [
  { id: "analyst", label: "Sober Analyst", text: "You are a sober, executive-grade technology intelligence analyst. Reason only from the workspace data. If data is thin, say so. Be terse, structured, no fluff." },
  { id: "vc", label: "VC Investor", text: "You are a Series-B technology investor. Frame everything in terms of investability: market timing, defensibility, capital efficiency, exit paths. Be opinionated but data-grounded." },
  { id: "oem", label: "OEM Strategy Lead", text: "You are head of strategy at a global OEM. Frame everything in terms of make/buy/partner decisions, supplier risk, time-to-platform, and competitive exposure." },
  { id: "standards", label: "Standards Expert", text: "You are a standards and interoperability expert. Frame everything in terms of consortia momentum, protocol convergence, compliance risk, and ecosystem lock-in." },
];

const PERSONA_KEY = "n1:analyst:persona";

// ─── SSE streaming helper ─────────────────────────────────────────────────
async function streamAnalyst(
  body: Record<string, unknown>,
  onDelta: (chunk: string) => void,
  signal: AbortSignal,
): Promise<void> {
  const res = await fetch(ANALYST_URL, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "apikey": SUPABASE_KEY,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data);
        const delta = json?.choices?.[0]?.delta?.content;
        if (delta) onDelta(delta);
      } catch { /* skip */ }
    }
  }
}

type ReportItem = {
  id: string; name: string; description?: string;
  signal: number; band: { label: string; color: string };
  stance?: "bullish" | "bearish";
  funding: number; companies: number; patents: number; news: number;
};
type ReportData = {
  kind: "report" | "hypothesis";
  title: string; date: string; subtitle: string;
  brief?: string; hypothesis?: string;
  narrative: string; // AI-generated
  avgSignal: number; totalFunding: number; itemCount: number;
  items: ReportItem[];
  imports: { name: string; size: number }[];
};

export default function CompassStudio() {
  const { data: techs = [] } = useTechnologyIntelligence();
  const [workspace, setWorkspace] = useState<string[]>(loadWorkspace());
  const [imports, setImports] = useState<{ name: string; size: number }[]>([]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<Mode>("report");
  const [templateId, setTemplateId] = useState<TemplateId>("executive");
  const [hypothesis, setHypothesis] = useState("");
  const [chatDraft, setChatDraft] = useState("");
  const [chatLog, setChatLog] = useState<{ role: "user" | "assistant"; text: string }[]>([
    { role: "assistant", text: "I have your workspace in context. Ask comparisons, stress-tests, or follow-ups on any item." },
  ]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState(""); // live narrative while generating
  const [showPersona, setShowPersona] = useState(false);
  const [persona, setPersona] = useState<string>(() => {
    if (typeof window === "undefined") return PERSONA_PRESETS[0].text;
    return localStorage.getItem(PERSONA_KEY) || PERSONA_PRESETS[0].text;
  });
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { localStorage.setItem(PERSONA_KEY, persona); }, [persona]);

  const items = useMemo(
    () => workspace.map((kid) => techs.find((t) => t.keywordId === kid)).filter(Boolean),
    [workspace, techs]
  );
  const included = items.filter((t) => !excluded.has(t!.keywordId));
  const stances = loadStances();

  const buildItem = (t: any): ReportItem => {
    const s = signalStrength(t);
    return {
      id: t.keywordId, name: t.name, description: t.description,
      signal: s, band: strengthBand(s),
      stance: stances[t.keywordId]?.stance,
      funding: t.totalFundingEur || 0,
      companies: t.dealroomCompanyCount || 0,
      patents: t.totalPatents || 0,
      news: t.newsMentionCount || 0,
    };
  };

  // AI item payload (compact for prompt)
  const itemsForAI = () => included.map((t: any) => {
    const it = buildItem(t);
    return {
      name: it.name, signal: it.signal, band: it.band.label,
      stance: it.stance, funding: it.funding, companies: it.companies,
      patents: it.patents, news: it.news,
      description: it.description,
    };
  });

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chatLog, streamingText]);

  const stop = () => { abortRef.current?.abort(); abortRef.current = null; setGenerating(false); };

  const generate = async () => {
    if (included.length === 0) return;
    setError(null);
    setGenerating(true);
    setStreamingText("");
    const ac = new AbortController();
    abortRef.current = ac;
    const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const tpl = TEMPLATES.find((t) => t.id === templateId)!;
    const built = included.map((t: any) => buildItem(t));
    const avg = Math.round(built.reduce((a, b) => a + b.signal, 0) / Math.max(built.length, 1));
    const totalFunding = built.reduce((a, b) => a + b.funding, 0);
    let narrative = "";
    try {
      const body = mode === "hypothesis"
        ? { mode: "hypothesis", persona, items: itemsForAI(), payload: { hypothesis: hypothesis || "(none stated)" } }
        : { mode: "report", persona, items: itemsForAI(), payload: { brief: tpl.brief, template: tpl.label, audience: tpl.audience } };
      await streamAnalyst(body, (delta) => {
        narrative += delta;
        setStreamingText(narrative);
      }, ac.signal);
    } catch (e: any) {
      if (e.name !== "AbortError") setError(e.message || "Analyst failed");
    }
    setReport({
      kind: mode === "hypothesis" ? "hypothesis" : "report",
      title: mode === "hypothesis" ? "Hypothesis Stress-test" : tpl.label,
      date, subtitle: mode === "hypothesis" ? "Analyst verdict" : `${tpl.audience} · ${tpl.length}`,
      brief: tpl.brief, hypothesis: mode === "hypothesis" ? hypothesis : undefined,
      narrative, avgSignal: avg, totalFunding, itemCount: built.length, items: built, imports,
    });
    setGenerating(false);
    setStreamingText("");
    abortRef.current = null;
  };

  const sendChat = async () => {
    const text = chatDraft.trim();
    if (!text || generating) return;
    setError(null);
    setChatDraft("");
    const next = [...chatLog, { role: "user" as const, text }];
    setChatLog([...next, { role: "assistant" as const, text: "" }]);
    setGenerating(true);
    const ac = new AbortController();
    abortRef.current = ac;
    let acc = "";
    try {
      await streamAnalyst({
        mode: "chat", persona, items: itemsForAI(),
        history: chatLog, payload: { message: text },
      }, (delta) => {
        acc += delta;
        setChatLog([...next, { role: "assistant", text: acc }]);
      }, ac.signal);
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setError(e.message || "Analyst failed");
        setChatLog([...next, { role: "assistant", text: "_Sorry — analyst unreachable._" }]);
      }
    }
    setGenerating(false);
    abortRef.current = null;
  };

  const downloadPdf = () => {
    if (!report) return;
    const html = renderReportHtml(report);
    const w = window.open("", "_blank", "width=900,height=1100");
    if (!w) return;
    w.document.write(html); w.document.close();
    w.onload = () => { w.focus(); w.print(); };
  };
  const downloadHtml = () => {
    if (!report) return;
    const html = renderReportHtml(report);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `n1signal-${report.kind}-${Date.now()}.html`; a.click();
    URL.revokeObjectURL(url);
  };
  const onImport = (files: FileList | null) => {
    if (!files) return;
    setImports((p) => [...p, ...Array.from(files).map((f) => ({ name: f.name, size: f.size }))]);
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-primary/[0.04] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Workspace</p>
            <h1 className="mt-2 text-xl font-semibold">Where exploration becomes analysis, hypothesis and report</h1>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
              Everything you pinned converges here. Your AI analyst reads it all — compose a report, stress-test a thesis, or just ask.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-medium",
              included.length > 0 ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
            )}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              {included.length}/{items.length} items ready
            </span>
            <button onClick={() => setShowPersona((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/40">
              <User className="h-3 w-3" /> Analyst persona
              <Settings2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {showPersona && (
          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <p className="text-[10.5px] font-medium uppercase tracking-widest text-muted-foreground">Who is the analyst?</p>
            <p className="mt-1 text-[11.5px] text-muted-foreground">Same data, re-framed for the reader. Pick a preset or write your own.</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {PERSONA_PRESETS.map((p) => (
                <button key={p.id} onClick={() => setPersona(p.text)}
                  className={cn("rounded-full border px-3 py-1 text-[11px] transition-colors",
                    persona === p.text ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                  {p.label}
                </button>
              ))}
            </div>
            <textarea value={persona} onChange={(e) => setPersona(e.target.value)} rows={3}
              className="mt-3 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-[12.5px] focus:border-primary focus:outline-none" />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* LEFT — selected items */}
        <aside className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[10.5px] font-medium uppercase tracking-widest text-muted-foreground">Selected items</h3>
            <span className="text-[10.5px] text-muted-foreground">{included.length}/{items.length}</span>
          </div>

          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <FileText className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-3 text-xs text-muted-foreground">Pin technologies from the Briefing using the bookmark icon.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((t: any) => {
                const isOff = excluded.has(t.keywordId);
                const s = signalStrength(t);
                const band = strengthBand(s);
                return (
                  <li key={t.id} className={cn("rounded-lg border p-2.5 transition-colors", isOff ? "border-dashed border-border bg-secondary/30 opacity-60" : "border-border bg-card")}>
                    <div className="flex items-start gap-2">
                      <input type="checkbox" checked={!isOff} onChange={() => setExcluded((p) => { const n = new Set(p); n.has(t.keywordId) ? n.delete(t.keywordId) : n.add(t.keywordId); return n; })}
                        className="mt-0.5 h-3.5 w-3.5 accent-primary" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-medium">{t.name}</p>
                        <p className={cn("text-[10.5px]", band.color)}>{band.label} · {s}/100</p>
                      </div>
                      <button onClick={() => { toggleWorkspace(t.keywordId); setWorkspace(loadWorkspace()); }}
                        className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {imports.length > 0 && (
            <div className="rounded-xl border border-border p-3">
              <p className="mb-2 text-[10.5px] font-medium uppercase tracking-widest text-muted-foreground">Imports</p>
              <ul className="space-y-1">
                {imports.map((f) => (
                  <li key={f.name} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Paperclip className="h-3 w-3" />
                    <span className="truncate">{f.name}</span>
                    <span className="ml-auto tabular-nums">{Math.round(f.size / 1024)}KB</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <input ref={fileRef} type="file" multiple hidden onChange={(e) => { onImport(e.target.files); if (fileRef.current) fileRef.current.value = ""; }} />
          <button onClick={() => fileRef.current?.click()}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-secondary/40 px-3 py-2 text-[11.5px] text-muted-foreground hover:border-primary/40 hover:text-foreground">
            <Plus className="h-3.5 w-3.5" /> Import files
          </button>
        </aside>

        {/* CENTER — Analyst console */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border bg-secondary/30 px-5 pt-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold">What do you want to do with these {included.length} item{included.length === 1 ? "" : "s"}?</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{MODES.find((m) => m.id === mode)?.hint}</p>
              </div>
            </div>
            <div className="mt-3 -mb-px flex gap-1">
              {MODES.map((m) => (
                <button key={m.id} onClick={() => setMode(m.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-[12px] font-medium transition-colors",
                    mode === m.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}>
                  <m.icon className="h-3.5 w-3.5" /> {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 space-y-4">
            {mode === "report" && (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {TEMPLATES.map((t) => (
                  <button key={t.id} onClick={() => { setTemplateId(t.id); setReport(null); }}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-all",
                      templateId === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    )}>
                    <p className="text-[12.5px] font-semibold">{t.label}</p>
                    <p className="mt-1 text-[10.5px] text-muted-foreground line-clamp-2">{t.description}</p>
                    <p className="mt-1.5 text-[10px] text-muted-foreground">{t.audience} · {t.length}</p>
                  </button>
                ))}
              </div>
            )}

            {mode === "hypothesis" && (
              <div>
                <label className="text-[10.5px] font-medium uppercase tracking-widest text-muted-foreground">Your thesis</label>
                <textarea value={hypothesis} onChange={(e) => setHypothesis(e.target.value)} rows={3}
                  placeholder="e.g. 'SDV middleware will consolidate around 2 vendors by 2027'"
                  className="mt-2 w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
              </div>
            )}

            {mode === "chat" && (
              <div className="space-y-3">
                <div ref={chatScrollRef} className="max-h-96 space-y-3 overflow-y-auto rounded-lg border border-border bg-background p-4">
                  {chatLog.map((m, i) => (
                    <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                      {m.role === "assistant" && (
                        <div className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                          <Sparkles className="h-3 w-3" />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/60 text-foreground"
                      )}>
                        {m.role === "assistant"
                          ? (m.text
                              ? <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1.5 [&_ul]:my-1.5 [&_li]:my-0">
                                  <ReactMarkdown>{m.text}</ReactMarkdown>
                                </div>
                              : <span className="inline-flex gap-1 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />thinking…</span>)
                          : m.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={chatDraft} onChange={(e) => setChatDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendChat()}
                    disabled={generating}
                    placeholder={included.length ? "Ask the analyst about your workspace…" : "Pin items first, then ask…"}
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-50" />
                  {generating ? (
                    <button onClick={stop} className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-sm hover:bg-secondary/70">
                      <StopCircle className="h-3.5 w-3.5" /> Stop
                    </button>
                  ) : (
                    <button onClick={sendChat} disabled={!chatDraft.trim() || included.length === 0}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-40">
                      <Send className="h-3.5 w-3.5" /> Send
                    </button>
                  )}
                </div>
              </div>
            )}

            {mode !== "chat" && (
              <div className="flex items-center gap-3">
                <button onClick={generate} disabled={included.length === 0 || generating}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {generating ? "Analyst is writing…" : mode === "hypothesis" ? "Weigh the evidence" : "Generate"}
                </button>
                {generating && (
                  <button onClick={stop} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs hover:bg-secondary">
                    <StopCircle className="h-3.5 w-3.5" /> Stop
                  </button>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-md border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-[12px] text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}

            {/* Live streaming preview while generating reports/hypotheses */}
            {generating && mode !== "chat" && streamingText && (
              <div className="rounded-xl border border-primary/30 bg-primary/[0.03] p-5">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-primary">Analyst is writing…</p>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{streamingText}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Final structured output */}
            {report && !generating && (
              <div className="mt-2 rounded-xl border border-border bg-background">
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <p className="text-xs font-medium">Preview · {report.kind}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={downloadHtml} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-secondary">
                      <Download className="h-3 w-3" /> HTML
                    </button>
                    <button onClick={downloadPdf} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs text-primary-foreground hover:opacity-90">
                      <Printer className="h-3 w-3" /> Download PDF
                    </button>
                  </div>
                </div>
                <div className="max-h-[640px] overflow-auto">
                  <ReportPreview report={report} />
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── Visual report preview (React) ─────────────────────────────────────────
function ReportPreview({ report }: { report: ReportData }) {
  return (
    <article className="mx-auto max-w-3xl p-8 text-foreground">
      <header className="border-b border-border pb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">N1 Signal · Workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{report.title}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{report.subtitle} · {report.date}</p>
      </header>

      {report.kind === "hypothesis" && report.hypothesis && (
        <section className="mt-5 rounded-lg border-l-4 border-primary bg-primary/[0.04] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Hypothesis</p>
          <p className="mt-1.5 text-[15px] font-medium leading-snug">{report.hypothesis}</p>
        </section>
      )}

      {/* AI narrative */}
      {report.narrative && (
        <section className="mt-6 prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{report.narrative}</ReactMarkdown>
        </section>
      )}

      {/* KPI grid */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Kpi label="Technologies" value={report.itemCount.toString()} />
        <Kpi label="Avg signal" value={`${report.avgSignal}/100`} accent={report.avgSignal >= 60 ? "text-emerald-600" : report.avgSignal >= 40 ? "text-amber-600" : "text-rose-600"} />
        <Kpi label="Investment" value={fmtFunding(report.totalFunding)} />
      </div>

      <Section title="Data behind the analysis">
        {report.items.map((it) => <ItemRow key={it.id} item={it} expanded={report.kind === "report"} />)}
      </Section>

      {report.imports.length > 0 && (
        <Section title="Attachments">
          <ul className="space-y-1 text-[12.5px] text-muted-foreground">
            {report.imports.map((f) => (
              <li key={f.name}>📎 {f.name} <span className="tabular-nums">({Math.round(f.size / 1024)}KB)</span></li>
            ))}
          </ul>
        </Section>
      )}

      <footer className="mt-8 border-t border-border pt-4 text-center text-[10.5px] text-muted-foreground">
        Generated by N1 Signal · AI-authored narrative grounded in workspace data.
      </footer>
    </article>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold tabular-nums", accent)}>{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground">{title}</h2>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

function ItemRow({ item, expanded }: { item: ReportItem; expanded?: boolean }) {
  const barColor = item.signal >= 60 ? "bg-emerald-500" : item.signal >= 40 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="rounded-lg border border-border p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-semibold truncate">{item.name}</h3>
            {item.stance === "bullish" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                <TrendingUp className="h-2.5 w-2.5" /> Bullish
              </span>
            )}
            {item.stance === "bearish" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/12 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:text-rose-400">
                <TrendingDown className="h-2.5 w-2.5" /> Bearish
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <div className={cn("h-full rounded-full", barColor)} style={{ width: `${item.signal}%` }} />
            </div>
            <span className={cn("text-[11px] font-semibold tabular-nums", item.band.color)}>{item.signal}/100</span>
            <span className={cn("text-[10px]", item.band.color)}>{item.band.label}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        <Stat label="Investment" value={fmtFunding(item.funding)} />
        <Stat label="Companies" value={item.companies.toLocaleString()} />
        <Stat label="Patents" value={item.patents.toLocaleString()} />
        <Stat label="News 12mo" value={item.news.toLocaleString()} />
      </div>
      {expanded && item.description && (
        <p className="mt-3 border-t border-border pt-3 text-[12px] leading-relaxed text-muted-foreground">
          {item.description.slice(0, 320)}{item.description.length > 320 ? "…" : ""}
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary/40 px-2 py-1.5">
      <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-[11.5px] font-semibold tabular-nums">{value}</p>
    </div>
  );
}

// ─── Self-contained printable HTML ─────────────────────────────────────────
function renderReportHtml(r: ReportData): string {
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
  // crude markdown -> html
  const md = (s: string) => {
    const lines = s.split("\n");
    let html = "", inList = false;
    const closeList = () => { if (inList) { html += "</ul>"; inList = false; } };
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) { closeList(); continue; }
      const h = line.match(/^(#{1,4})\s+(.*)$/);
      if (h) { closeList(); html += `<h${h[1].length}>${esc(h[2])}</h${h[1].length}>`; continue; }
      if (/^[-*]\s+/.test(line)) {
        if (!inList) { html += "<ul>"; inList = true; }
        html += `<li>${esc(line.replace(/^[-*]\s+/, "")).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</li>`;
        continue;
      }
      closeList();
      html += `<p>${esc(line).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</p>`;
    }
    closeList();
    return html;
  };
  const bar = (signal: number) => {
    const color = signal >= 60 ? "#10b981" : signal >= 40 ? "#f59e0b" : "#f43f5e";
    return `<div class="bar"><div class="bar-fill" style="width:${signal}%;background:${color}"></div></div>`;
  };
  const itemHtml = (it: ReportItem, expanded = false) => `
    <div class="item">
      <div class="item-head">
        <h3>${esc(it.name)}</h3>
        ${it.stance === "bullish" ? `<span class="pill bullish">▲ Bullish</span>` : ""}
        ${it.stance === "bearish" ? `<span class="pill bearish">▼ Bearish</span>` : ""}
      </div>
      <div class="signal-row">
        ${bar(it.signal)}
        <span class="signal-num">${it.signal}/100</span>
        <span class="signal-band">${esc(it.band.label)}</span>
      </div>
      <div class="stats">
        <div class="stat"><div class="stat-l">Investment</div><div class="stat-v">${esc(fmtFunding(it.funding))}</div></div>
        <div class="stat"><div class="stat-l">Companies</div><div class="stat-v">${it.companies.toLocaleString()}</div></div>
        <div class="stat"><div class="stat-l">Patents</div><div class="stat-v">${it.patents.toLocaleString()}</div></div>
        <div class="stat"><div class="stat-l">News 12mo</div><div class="stat-v">${it.news.toLocaleString()}</div></div>
      </div>
      ${expanded && it.description ? `<p class="desc">${esc(it.description.slice(0, 320))}${it.description.length > 320 ? "…" : ""}</p>` : ""}
    </div>`;

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(r.title)} — N1 Signal</title>
<style>
  *{box-sizing:border-box}
  body{font:14px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif;color:#0f172a;margin:0;padding:40px;max-width:780px;margin:0 auto;background:#fff}
  header{border-bottom:1px solid #e2e8f0;padding-bottom:20px;margin-bottom:24px}
  .eyebrow{font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#64748b}
  header .eyebrow{color:#4f46e5}
  h1{font-size:30px;font-weight:600;letter-spacing:-0.02em;margin:6px 0 4px}
  .meta{font-size:13px;color:#64748b;margin:0}
  .hyp{border-left:4px solid #4f46e5;background:#eef2ff;padding:14px 16px;border-radius:6px;margin:22px 0}
  .hyp-text{font-size:15px;font-weight:500;margin:6px 0 0}
  .narrative{margin:22px 0;color:#1e293b}
  .narrative h1,.narrative h2,.narrative h3,.narrative h4{margin:18px 0 8px;font-weight:600}
  .narrative h2{font-size:16px}.narrative h3{font-size:14px}
  .narrative p{margin:8px 0}
  .narrative ul{margin:8px 0;padding-left:20px}
  .narrative li{margin:3px 0}
  .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:22px 0}
  .kpi{border:1px solid #e2e8f0;border-radius:8px;padding:12px}
  .kpi-v{font-size:20px;font-weight:600;margin-top:4px;font-variant-numeric:tabular-nums}
  .kpi-v.good{color:#059669}.kpi-v.warn{color:#d97706}.kpi-v.bad{color:#e11d48}
  h2.sec{font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#0f172a;margin:28px 0 12px}
  .item{border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:10px;page-break-inside:avoid}
  .item-head{display:flex;align-items:center;gap:8px}
  .item-head h3{font-size:14px;font-weight:600;margin:0;flex:1}
  .pill{font-size:10px;font-weight:600;padding:2px 8px;border-radius:99px}
  .pill.bullish{background:#d1fae5;color:#065f46}
  .pill.bearish{background:#ffe4e6;color:#9f1239}
  .signal-row{display:flex;align-items:center;gap:8px;margin-top:8px}
  .bar{flex:1;height:6px;background:#f1f5f9;border-radius:99px;overflow:hidden}
  .bar-fill{height:100%;border-radius:99px}
  .signal-num{font-size:11px;font-weight:700;font-variant-numeric:tabular-nums;color:#0f172a}
  .signal-band{font-size:10px;color:#64748b}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}
  .stat{background:#f8fafc;border-radius:5px;padding:6px;text-align:center}
  .stat-l{font-size:9px;font-weight:500;text-transform:uppercase;letter-spacing:.06em;color:#64748b}
  .stat-v{font-size:11.5px;font-weight:600;margin-top:2px;font-variant-numeric:tabular-nums}
  .desc{font-size:12px;color:#475569;border-top:1px solid #e2e8f0;padding-top:10px;margin:10px 0 0;line-height:1.55}
  footer{border-top:1px solid #e2e8f0;padding-top:12px;margin-top:32px;font-size:10.5px;color:#94a3b8;text-align:center}
  @page{margin:18mm 14mm}
  @media print{body{padding:0;max-width:none}}
</style></head><body>
<header>
  <div class="eyebrow">N1 Signal · Workspace</div>
  <h1>${esc(r.title)}</h1>
  <p class="meta">${esc(r.subtitle)} · ${esc(r.date)}</p>
</header>
${r.kind === "hypothesis" && r.hypothesis ? `<div class="hyp"><div class="eyebrow">Hypothesis</div><p class="hyp-text">${esc(r.hypothesis)}</p></div>` : ""}
${r.narrative ? `<div class="narrative">${md(r.narrative)}</div>` : ""}
<div class="kpis">
  <div class="kpi"><div class="eyebrow">Technologies</div><div class="kpi-v">${r.itemCount}</div></div>
  <div class="kpi"><div class="eyebrow">Avg signal</div><div class="kpi-v ${r.avgSignal >= 60 ? "good" : r.avgSignal >= 40 ? "warn" : "bad"}">${r.avgSignal}/100</div></div>
  <div class="kpi"><div class="eyebrow">Investment</div><div class="kpi-v">${fmtFunding(r.totalFunding)}</div></div>
</div>
<h2 class="sec">Data behind the analysis</h2>
${r.items.map((it) => itemHtml(it, r.kind === "report")).join("")}
${r.imports.length ? `<h2 class="sec">Attachments</h2><ul>${r.imports.map((f) => `<li>📎 ${esc(f.name)} (${Math.round(f.size / 1024)}KB)</li>`).join("")}</ul>` : ""}
<footer>Generated by N1 Signal · AI-authored narrative grounded in workspace data.</footer>
</body></html>`;
}
