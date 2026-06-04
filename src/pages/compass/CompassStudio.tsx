import { useMemo, useRef, useState } from "react";
import {
  FileText, Download, Sparkles, X, Loader2, FlaskConical, MessageSquare,
  CheckCircle2, Send, Bookmark, Paperclip, Plus, Printer, TrendingUp, TrendingDown,
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

type ReportItem = {
  id: string; name: string; description?: string;
  signal: number; band: { label: string; color: string };
  stance?: "bullish" | "bearish";
  funding: number; companies: number; patents: number; news: number;
};

type ReportData = {
  kind: "report" | "hypothesis";
  title: string; date: string; subtitle: string; intro: string;
  hypothesis?: string;
  avgSignal: number; totalFunding: number; itemCount: number;
  items: ReportItem[];
  forItems?: ReportItem[]; againstItems?: ReportItem[];
  imports: { name: string; size: number }[];
};

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
  const [report, setReport] = useState<ReportData | null>(null);
  const [generating, setGenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const generate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 600));
    const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const tpl = TEMPLATES.find((t) => t.id === templateId)!;
    const built = included.map((t: any) => buildItem(t));
    const avg = Math.round(built.reduce((a, b) => a + b.signal, 0) / Math.max(built.length, 1));
    const totalFunding = built.reduce((a, b) => a + b.funding, 0);

    if (mode === "hypothesis") {
      setReport({
        kind: "hypothesis",
        title: "Hypothesis Test",
        date, subtitle: "Analyst verdict",
        intro: hypothesis || "(no hypothesis stated)",
        hypothesis: hypothesis || "(no hypothesis stated)",
        avgSignal: avg, totalFunding, itemCount: built.length, items: built,
        forItems: built.filter((b) => b.signal >= 60),
        againstItems: built.filter((b) => b.signal < 60),
        imports,
      });
    } else {
      setReport({
        kind: "report",
        title: tpl.label, date,
        subtitle: `${tpl.audience} · ${tpl.length}`,
        intro: prompt,
        avgSignal: avg, totalFunding, itemCount: built.length, items: built,
        imports,
      });
    }
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

  const downloadPdf = () => {
    if (!report) return;
    const html = renderReportHtml(report);
    const w = window.open("", "_blank", "width=900,height=1100");
    if (!w) return;
    w.document.write(html);
    w.document.close();
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

            {/* Visual Output */}
            {report && (
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

      {report.kind === "hypothesis" && (
        <section className="mt-5 rounded-lg border-l-4 border-primary bg-primary/[0.04] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Hypothesis</p>
          <p className="mt-1.5 text-[15px] font-medium leading-snug">{report.hypothesis}</p>
        </section>
      )}

      {report.kind === "report" && (
        <p className="mt-5 text-[13.5px] leading-relaxed text-muted-foreground">{report.intro}</p>
      )}

      {/* KPI grid */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Kpi label="Technologies" value={report.itemCount.toString()} />
        <Kpi label="Avg signal" value={`${report.avgSignal}/100`} accent={report.avgSignal >= 60 ? "text-emerald-600" : report.avgSignal >= 40 ? "text-amber-600" : "text-rose-600"} />
        <Kpi label="Investment" value={fmtFunding(report.totalFunding)} />
      </div>

      {report.kind === "hypothesis" ? (
        <>
          <Section title={`Evidence for · ${report.forItems!.length}`} accent="emerald">
            {report.forItems!.length ? report.forItems!.map((it) => <ItemRow key={it.id} item={it} />) : <Empty>No items above the 60/100 conviction threshold.</Empty>}
          </Section>
          <Section title={`Evidence against · ${report.againstItems!.length}`} accent="rose">
            {report.againstItems!.length ? report.againstItems!.map((it) => <ItemRow key={it.id} item={it} />) : <Empty>No items below conviction threshold.</Empty>}
          </Section>
          <div className="mt-6 rounded-lg bg-secondary/40 p-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Verdict</p>
            <p className="mt-1 text-lg font-semibold">
              {report.forItems!.length} of {report.items.length} items support the hypothesis
            </p>
          </div>
        </>
      ) : (
        <Section title="Per-technology read">
          {report.items.map((it) => <ItemRow key={it.id} item={it} expanded />)}
        </Section>
      )}

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
        Generated by N1 Signal · Data is real, narrative is rule-based.
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

function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent?: "emerald" | "rose" }) {
  return (
    <section className="mt-6">
      <h2 className={cn(
        "mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]",
        accent === "emerald" ? "text-emerald-700 dark:text-emerald-400" :
        accent === "rose" ? "text-rose-700 dark:text-rose-400" : "text-foreground"
      )}>{title}</h2>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md border border-dashed border-border px-3 py-2 text-[12px] italic text-muted-foreground">{children}</p>;
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

// ─── Self-contained printable HTML (for new window → PDF) ──────────────────
function renderReportHtml(r: ReportData): string {
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
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

  const body = r.kind === "hypothesis"
    ? `
      <div class="hyp">
        <div class="eyebrow">Hypothesis</div>
        <p class="hyp-text">${esc(r.hypothesis!)}</p>
      </div>
      ${kpiHtml(r)}
      <h2 class="sec emerald">Evidence for · ${r.forItems!.length}</h2>
      ${r.forItems!.length ? r.forItems!.map((it) => itemHtml(it)).join("") : `<p class="empty">No items above 60/100 conviction.</p>`}
      <h2 class="sec rose">Evidence against · ${r.againstItems!.length}</h2>
      ${r.againstItems!.length ? r.againstItems!.map((it) => itemHtml(it)).join("") : `<p class="empty">No items below conviction.</p>`}
      <div class="verdict">
        <div class="eyebrow">Verdict</div>
        <p class="verdict-text">${r.forItems!.length} of ${r.items.length} items support the hypothesis</p>
      </div>`
    : `
      <p class="intro">${esc(r.intro)}</p>
      ${kpiHtml(r)}
      <h2 class="sec">Per-technology read</h2>
      ${r.items.map((it) => itemHtml(it, true)).join("")}`;

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(r.title)} — N1 Signal</title>
<style>
  *{box-sizing:border-box}
  body{font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif;color:#0f172a;margin:0;padding:40px;max-width:780px;margin:0 auto;background:#fff}
  header{border-bottom:1px solid #e2e8f0;padding-bottom:20px;margin-bottom:24px}
  .eyebrow{font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#64748b}
  header .eyebrow{color:#4f46e5}
  h1{font-size:30px;font-weight:600;letter-spacing:-0.02em;margin:6px 0 4px}
  .meta{font-size:13px;color:#64748b;margin:0}
  .intro{font-size:13.5px;color:#475569;margin:20px 0}
  .hyp{border-left:4px solid #4f46e5;background:#eef2ff;padding:14px 16px;border-radius:6px;margin:22px 0}
  .hyp-text{font-size:15px;font-weight:500;margin:6px 0 0}
  .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:22px 0}
  .kpi{border:1px solid #e2e8f0;border-radius:8px;padding:12px}
  .kpi-v{font-size:20px;font-weight:600;margin-top:4px;font-variant-numeric:tabular-nums}
  .kpi-v.good{color:#059669}.kpi-v.warn{color:#d97706}.kpi-v.bad{color:#e11d48}
  h2.sec{font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#0f172a;margin:28px 0 12px}
  h2.sec.emerald{color:#047857}h2.sec.rose{color:#be123c}
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
  .empty{font-style:italic;color:#94a3b8;border:1px dashed #e2e8f0;padding:8px 12px;border-radius:6px;font-size:12px}
  .verdict{text-align:center;background:#f1f5f9;border-radius:8px;padding:16px;margin-top:24px}
  .verdict-text{font-size:18px;font-weight:600;margin:4px 0 0}
  footer{border-top:1px solid #e2e8f0;padding-top:12px;margin-top:32px;font-size:10.5px;color:#94a3b8;text-align:center}
  @page{margin:18mm 14mm}
  @media print{body{padding:0;max-width:none}}
</style></head><body>
<header>
  <div class="eyebrow">N1 Signal · Workspace</div>
  <h1>${esc(r.title)}</h1>
  <p class="meta">${esc(r.subtitle)} · ${esc(r.date)}</p>
</header>
${body}
${r.imports.length ? `<h2 class="sec">Attachments</h2><ul>${r.imports.map((f) => `<li>📎 ${esc(f.name)} (${Math.round(f.size / 1024)}KB)</li>`).join("")}</ul>` : ""}
<footer>Generated by N1 Signal · Data is real, narrative is rule-based.</footer>
</body></html>`;
}

function kpiHtml(r: ReportData): string {
  const avgClass = r.avgSignal >= 60 ? "good" : r.avgSignal >= 40 ? "warn" : "bad";
  return `<div class="kpis">
    <div class="kpi"><div class="eyebrow">Technologies</div><div class="kpi-v">${r.itemCount}</div></div>
    <div class="kpi"><div class="eyebrow">Avg signal</div><div class="kpi-v ${avgClass}">${r.avgSignal}/100</div></div>
    <div class="kpi"><div class="eyebrow">Investment</div><div class="kpi-v">${fmtFunding(r.totalFunding)}</div></div>
  </div>`;
}
