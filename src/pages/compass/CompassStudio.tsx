import { useMemo, useRef, useState } from "react";
import {
  FileText, Download, Sparkles, X, Loader2, FlaskConical, MessageSquare,
  CheckCircle2, Send, Cpu, Bookmark, Paperclip, Plus,
} from "lucide-react";
import { useTechnologyIntelligence } from "@/hooks/useTechnologyIntelligence";
import { loadWorkspace, toggleWorkspace, signalStrength, strengthBand, fmtFunding, loadStances } from "./lib";
import { cn } from "@/lib/utils";

type Mode = "report" | "hypothesis" | "chat";
type TemplateId = "executive" | "deep-dive" | "momentum" | "watchlist";

const TEMPLATES: Array<{ id: TemplateId; label: string; description: string; audience: string; length: string; prompt: string }> = [
  { id: "executive", label: "Executive Brief", description: "Leadership-ready summary: key moves, risks and asks.", audience: "Leadership", length: "~1 page",
    prompt: "Draft a 1-page executive brief. Lead with the top movements, then risks, then a single recommended action." },
  { id: "deep-dive", label: "Technology Deep Dive", description: "Detailed analysis with momentum, standards and interop.", audience: "Analysts", length: "~4 pages",
    prompt: "Produce a deep dive covering momentum, drivers, related standards and interoperability impact." },
  { id: "momentum", label: "Momentum Update", description: "What moved up, what moved down, and why.", audience: "Strategy", length: "~2 pages",
    prompt: "Summarize momentum across the selected items. Group by rising, stable and declining; call out the strongest driver for each." },
  { id: "watchlist", label: "Watchlist Review", description: "Stance check on bullish vs bearish items.", audience: "Owners", length: "~2 pages",
    prompt: "Review each item. Confirm or challenge the stance based on the selected signals." },
];

const MODES: Array<{ id: Mode; label: string; icon: typeof FileText; hint: string }> = [
  { id: "report", label: "Compose Report", icon: FileText, hint: "Pick a template and generate a structured report." },
  { id: "hypothesis", label: "Test Hypothesis", icon: FlaskConical, hint: "State a thesis. The analyst weighs evidence." },
  { id: "chat", label: "Ask Analyst", icon: MessageSquare, hint: "Free-form Q&A grounded in your selected items." },
];

export default function CompassStudio() {
  const { data: techs = [] } = useTechnologyIntelligence();
  const [workspace, setWorkspace] = useState<string[]>(loadWorkspace());
  const [imports, setImports] = useState<{ name: string; size: number }[]>([]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<Mode>("report");
  const [templateId, setTemplateId] = useState<TemplateId>("executive");
  const [prompt, setPrompt] = useState(TEMPLATES[0].prompt);
  const [hypothesis, setHypothesis] = useState("");
  const [chatDraft, setChatDraft] = useState("");
  const [chatLog, setChatLog] = useState<{ role: "user" | "assistant"; text: string }[]>([
    { role: "assistant", text: "I can see every item in your workspace. Ask anything — comparisons, summaries, or a deep follow-up on any technology." },
  ]);
  const [report, setReport] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const items = useMemo(
    () => workspace.map((kid) => techs.find((t) => t.keywordId === kid)).filter(Boolean),
    [workspace, techs]
  );
  const included = items.filter((t) => !excluded.has(t!.keywordId));
  const stances = loadStances();

  const generate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 700));
    const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const tpl = TEMPLATES.find((t) => t.id === templateId)!;
    const avg = Math.round(included.reduce((a, t: any) => a + signalStrength(t), 0) / Math.max(included.length, 1));
    const totalFunding = included.reduce((a, t: any) => a + (t.totalFundingEur || 0), 0);

    let md = "";
    if (mode === "hypothesis") {
      md = [
        `# Hypothesis Test — ${date}`, "",
        `**Hypothesis:** ${hypothesis || "(no hypothesis stated)"}`, "",
        `## Evidence For`,
        ...included.filter((t: any) => signalStrength(t) >= 60).map((t: any) =>
          `- **${t.name}** (${signalStrength(t)}/100) — ${fmtFunding(t.totalFundingEur)} invested across ${t.dealroomCompanyCount} companies; ${t.totalPatents.toLocaleString()} patents.`),
        "",
        `## Evidence Against`,
        ...included.filter((t: any) => signalStrength(t) < 60).map((t: any) =>
          `- **${t.name}** (${signalStrength(t)}/100) — signal below conviction threshold; ${t.newsMentionCount} news mentions (12mo).`),
        "",
        `## Verdict`,
        `${included.filter((t: any) => signalStrength(t) >= 60).length} of ${included.length} items support the hypothesis.`,
      ].join("\n");
    } else {
      md = [
        `# ${tpl.label} — ${date}`, "",
        `_Template: ${tpl.label} · ${tpl.audience} · ${tpl.length}_`, "",
        `${prompt}`, "",
        `## Executive summary`,
        `${included.length} technologies under review. Average Signal Strength: **${avg}/100**. Combined tracked investment: **${fmtFunding(totalFunding)}**.`,
        imports.length ? `\n${imports.length} uploaded file${imports.length === 1 ? "" : "s"} attached: ${imports.map((i) => i.name).join(", ")}.` : "",
        "",
        `## Per-technology read`,
        ...included.map((t: any) => {
          const s = signalStrength(t);
          const band = strengthBand(s).label;
          const stance = stances[t.keywordId]?.stance;
          return [
            `### ${t.name} — ${s}/100 (${band})`,
            stance ? `_Stance: ${stance === "bullish" ? "Bullish 🟢" : "Bearish 🔴"}_` : "",
            ``,
            `- Investment: ${fmtFunding(t.totalFundingEur)} across ${t.dealroomCompanyCount} companies`,
            `- Patents: ${t.totalPatents.toLocaleString()}`,
            `- News mentions (12mo): ${t.newsMentionCount}`,
            t.description ? `\n${t.description.slice(0, 280)}${t.description.length > 280 ? "…" : ""}` : "",
          ].filter(Boolean).join("\n");
        }),
        "",
        `---`,
        `*Generated by N1 Signal · Workspace · Data is real, narrative is currently rule-based.*`,
      ].join("\n");
    }
    setReport(md);
    setGenerating(false);
  };

  const sendChat = () => {
    const text = chatDraft.trim();
    if (!text) return;
    const top = [...included].sort((a, b) => signalStrength(b as any) - signalStrength(a as any))[0] as any;
    const reply = top
      ? `Looking across your ${included.length} workspace items, **${top.name}** is the standout (${signalStrength(top)}/100 — ${fmtFunding(top.totalFundingEur)} invested). To answer "${text}": this is best evaluated by combining momentum and conviction. The strongest evidence comes from investment and research signals.`
      : `Your workspace is empty — add a few technologies first and I can compare them.`;
    setChatLog((p) => [...p, { role: "user", text }, { role: "assistant", text: reply }]);
    setChatDraft("");
  };

  const download = () => {
    if (!report) return;
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `n1signal-${mode}-${Date.now()}.md`; a.click();
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
              Everything you pinned converges here. Your analyst reads it all — compose a report, test a hypothesis, or just ask a question.
            </p>
          </div>
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-medium",
            included.length > 0 ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
          )}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            {included.length}/{items.length} items ready for the analyst
          </span>
        </div>
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
              <>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {TEMPLATES.map((t) => (
                    <button key={t.id} onClick={() => { setTemplateId(t.id); setPrompt(t.prompt); setReport(null); }}
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
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3}
                  className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
              </>
            )}

            {mode === "hypothesis" && (
              <textarea value={hypothesis} onChange={(e) => setHypothesis(e.target.value)} rows={3}
                placeholder="e.g. 'SDV middleware will consolidate around 2 vendors by 2027'"
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
            )}

            {mode === "chat" && (
              <div className="space-y-3">
                <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-border bg-secondary/30 p-3">
                  {chatLog.map((m, i) => (
                    <div key={i} className={cn("rounded-lg px-3 py-2 text-[12.5px]", m.role === "user" ? "ml-8 bg-primary/10 text-foreground" : "mr-8 bg-card border border-border")}>
                      {m.text}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={chatDraft} onChange={(e) => setChatDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()}
                    placeholder="Ask the analyst about your workspace…"
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                  <button onClick={sendChat} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90">
                    <Send className="h-3.5 w-3.5" /> Send
                  </button>
                </div>
              </div>
            )}

            {mode !== "chat" && (
              <button onClick={generate} disabled={included.length === 0 || generating}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generating ? "Synthesising…" : mode === "hypothesis" ? "Run test" : "Generate"}
              </button>
            )}

            {/* Output */}
            {report && (
              <div className="mt-2 rounded-xl border border-border">
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <p className="text-xs font-medium">Generated · {mode}</p>
                  <button onClick={download} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-secondary">
                    <Download className="h-3 w-3" /> Download .md
                  </button>
                </div>
                <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap p-4 text-[12.5px] leading-relaxed text-muted-foreground">{report}</pre>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
