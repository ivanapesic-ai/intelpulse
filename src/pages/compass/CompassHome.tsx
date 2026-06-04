import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
} from "recharts";
import {
  Bookmark, ArrowUp, ArrowDown, Sparkles, RefreshCw, Info, Send, FolderOpen,
  Plus, Check,
} from "lucide-react";
import { useTechnologyIntelligence, type TechnologyIntelligence } from "@/hooks/useTechnologyIntelligence";
import { useSignalSnapshots, computeDeltas, type SignalSnapshot } from "@/hooks/useSignalSnapshots";
import { useLatestNews } from "@/hooks/useNews";
import { GartnerMatrixSampler } from "@/components/intelligence/GartnerMatrixSampler";
import {
  signalStrength, fmtFunding, getQuadrant, QUADRANT_META,
  loadWorkspace, toggleWorkspace, getLastVisit, touchLastVisit, getTechnologySlug, type Quadrant,
} from "./lib";
import { useWorkspace } from "./hooks/use-prototype-state";
import { addToWorkspace } from "./lib/prototype-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function timeAgo(d: Date | null) {
  if (!d) return "your first visit";
  const ms = Date.now() - d.getTime();
  const h = Math.floor(ms / 3600_000);
  if (h < 1) return "moments ago";
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Momentum (Lab) — real snapshots
// ──────────────────────────────────────────────────────────────────────────────

const DRIVER_LABELS: Record<string, string> = {
  inv: "Investments", pat: "Patents", news: "News", res: "Research",
};
const DRIVER_WEIGHTS: Record<string, number> = { inv: 0.3, pat: 0.25, news: 0.25, res: 0.2 };
const PERIODS = [
  { key: "30", label: "30d", days: 30 },
  { key: "90", label: "90d", days: 90 },
  { key: "180", label: "6m", days: 180 },
  { key: "365", label: "1y", days: 365 },
] as const;

const COLORS = ["hsl(214 100% 49%)", "hsl(160 72% 40%)", "hsl(38 92% 50%)", "hsl(350 70% 50%)", "hsl(270 70% 55%)", "hsl(190 80% 45%)"];

function driverValue(s: SignalSnapshot, d: string): number {
  // Normalize each driver to a 0-100 contribution
  switch (d) {
    case "inv":  return ((s.investment_score ?? 0) / 2) * 100;
    case "pat":  return ((s.patents_score ?? 0) / 2) * 100;
    case "news": return ((s.visibility_score ?? 0) / 2) * 100;
    case "res":  return ((s.composite_score ?? 0) / 2) * 100; // proxy
    default:     return 0;
  }
}

function composite(s: SignalSnapshot, drivers: string[]): number {
  const totalW = drivers.reduce((a, d) => a + (DRIVER_WEIGHTS[d] || 0), 0) || 1;
  const v = drivers.reduce((a, d) => a + driverValue(s, d) * (DRIVER_WEIGHTS[d] || 0), 0) / totalW;
  return Math.round(v);
}

// ──────────────────────────────────────────────────────────────────────────────

export default function CompassHome() {
  const { data: techs = [], isLoading } = useTechnologyIntelligence();
  const navigate = useNavigate();
  const keywordIds = useMemo(() => techs.map((t) => t.keywordId).filter(Boolean), [techs]);
  const { data: snaps = [] } = useSignalSnapshots(keywordIds, 12);
  const { data: latestNews = [] } = useLatestNews(4);
  const { items: wsItems } = useWorkspace();
  const wsCount = wsItems.length;

  const [lastVisit] = useState(() => getLastVisit());
  const [workspace, setWorkspace] = useState<string[]>(loadWorkspace());
  useEffect(() => {
    const h = () => setWorkspace(loadWorkspace());
    window.addEventListener("n1:workspace-changed", h);
    return () => {
      window.removeEventListener("n1:workspace-changed", h);
      touchLastVisit();
    };
  }, []);

  const deltas = useMemo(() => computeDeltas(snaps, keywordIds), [snaps, keywordIds]);
  const deltaMap = useMemo(() => Object.fromEntries(deltas.map((d) => [d.keywordId, d])), [deltas]);
  const techByKid = useMemo(() => Object.fromEntries(techs.map((t) => [t.keywordId, t])), [techs]);

  // Movers for briefing
  const movers = [...deltas]
    .filter((d) => d.deltas.composite !== null)
    .sort((a, b) => Math.abs(b.deltas.composite || 0) - Math.abs(a.deltas.composite || 0))
    .slice(0, 3)
    .map((d) => ({ d, t: techByKid[d.keywordId] }))
    .filter((x) => x.t);

  // Action map rows: group by quadrant
  const quadGroups = useMemo(() => {
    const g: Record<Quadrant, TechnologyIntelligence[]> = { qw: [], bb: [], wt: [], rt: [] };
    for (const t of techs) {
      const q = getQuadrant(t);
      if (q) g[q].push(t);
    }
    for (const k of Object.keys(g) as Quadrant[]) {
      g[k].sort((a, b) => signalStrength(b) - signalStrength(a));
    }
    return g;
  }, [techs]);

  // Insights — data-driven
  const insights = useMemo(() => {
    const out: string[] = [];
    const topFunded = [...techs].sort((a, b) => b.totalFundingEur - a.totalFundingEur)[0];
    if (topFunded) out.push(`${topFunded.name} leads tracked investment at ${fmtFunding(topFunded.totalFundingEur)} across ${topFunded.dealroomCompanyCount} companies.`);
    const topPatents = [...techs].sort((a, b) => b.totalPatents - a.totalPatents)[0];
    if (topPatents) out.push(`${topPatents.name} dominates patent filings with ${topPatents.totalPatents.toLocaleString()} on record.`);
    const moverUp = movers.find((m) => (m.d.deltas.composite || 0) > 0);
    if (moverUp) out.push(`${moverUp.t!.name} is gaining momentum (composite +${(moverUp.d.deltas.composite || 0).toFixed(1)} vs last snapshot).`);
    return out.slice(0, 3);
  }, [techs, movers]);

  // ── Momentum chart state ────────────────────────────────────────────────
  const [labOpen, setLabOpen] = useState(false);
  const [period, setPeriod] = useState<typeof PERIODS[number]["key"]>("90");
  const [drivers, setDrivers] = useState<string[]>(["inv", "pat", "news", "res"]);
  const defaultMomentumIds = useMemo(() => movers.slice(0, 4).map((m) => m.t!.keywordId), [movers]);
  const [selectedKids, setSelectedKids] = useState<string[]>([]);
  useEffect(() => { if (selectedKids.length === 0 && defaultMomentumIds.length) setSelectedKids(defaultMomentumIds); }, [defaultMomentumIds, selectedKids.length]);

  const activeKids = labOpen ? selectedKids : defaultMomentumIds;
  const periodDays = PERIODS.find((p) => p.key === period)!.days;

  const chartData = useMemo(() => {
    if (!snaps.length || !activeKids.length) return [];
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - periodDays);
    const byDate = new Map<string, Record<string, number | string>>();
    for (const s of snaps) {
      if (!activeKids.includes(s.keyword_id)) continue;
      if (new Date(s.snapshot_date) < cutoff) continue;
      const row = byDate.get(s.snapshot_date) ?? { label: s.snapshot_date.slice(5) };
      row[s.keyword_id] = composite(s, drivers);
      byDate.set(s.snapshot_date, row);
    }
    return [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([, r]) => r);
  }, [snaps, activeKids, periodDays, drivers]);

  function toggleDriver(d: string) {
    setDrivers((prev) => prev.includes(d) ? (prev.length > 1 ? prev.filter((x) => x !== d) : prev) : [...prev, d]);
  }
  function toggleKid(kid: string) {
    setSelectedKids((prev) => prev.includes(kid) ? (prev.length > 1 ? prev.filter((x) => x !== kid) : prev) : [...prev, kid]);
  }
  function sendChartToWorkspace() {
    const periodLabel = PERIODS.find((p) => p.key === period)!.label;
    const techNames = activeKids.map((k) => techByKid[k]?.name).filter(Boolean).join(", ");
    const driverLabels = drivers.map((d) => DRIVER_LABELS[d]).join(" · ");
    addToWorkspace({
      kind: "chart",
      refId: `momentum-${period}-${activeKids.join("-")}-${drivers.join("-")}`,
      title: `Momentum · ${periodLabel}`,
      subtitle: `${techNames} — ${driverLabels}`,
      payload: { period, techs: activeKids, drivers },
    });
    toast.success("Chart added to Workspace", { description: `${periodLabel} · ${activeKids.length} techs` });
  }

  const totalSignals = techs.length;
  const moverCount = movers.length;

  return (
    <div className="space-y-12">
      {/* ── Briefing hero ───────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/[0.05] p-6 sm:p-9">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-primary">
                Strategic briefing · since {timeAgo(lastVisit)}
              </p>
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight leading-[1.15]">
              {moverCount === 0 ? (
                <>Markets are quiet. <span className="text-muted-foreground">No material shifts across tracked technologies.</span></>
              ) : (
                <>
                  <span className="text-foreground">{movers[0]?.t?.name}</span>
                  <span className="text-muted-foreground"> is moving</span>
                  {movers[1] && <>, with <span className="text-foreground">{movers[1].t!.name}</span> close behind</>}
                  {movers[2] && <> and <span className="text-foreground">{movers[2].t!.name}</span> drawing fresh signal</>}.
                </>
              )}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {moverCount} of {totalSignals} tracked technologies shifted since the last snapshot.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-border bg-background px-3 py-1.5">
            <RefreshCw className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Live · {new Date().toLocaleDateString("en-GB", { month: "short", day: "numeric" })}</span>
          </div>
        </div>

        {movers.length > 0 && (
          <ul className="mt-7 grid gap-3 sm:grid-cols-3">
            {movers.map(({ d, t }) => {
              const change = d.deltas.composite || 0;
              const up = change >= 0;
              const Icon = up ? ArrowUp : ArrowDown;
              return (
                <li key={t!.keywordId}>
                  <Link to={`/compass/technology/${getTechnologySlug(t!)}`}
                    className="group block rounded-xl border border-border bg-background/60 backdrop-blur-sm p-4 transition-all hover:border-primary/30 hover:bg-background">
                    <div className="flex items-center gap-2">
                      <span className={cn("inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                        up ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" : "bg-rose-500/15 text-rose-600 dark:text-rose-300")}>
                        <Icon className="h-2.5 w-2.5" strokeWidth={2.5} />
                        {Math.abs(change).toFixed(1)}
                      </span>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {up ? "Moved up" : "Moved down"}
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-medium">{t!.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {d.deltas.funding ? `+${fmtFunding(d.deltas.funding)} investment` : `${Math.abs(d.deltas.patents ?? 0)} patent change`} · {Math.abs(d.deltas.news ?? 0)} news
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Strategy matrix + right rail ─────────────────────────────── */}
      <section>
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">Strategy matrix</p>
            <h2 className="mt-1.5 text-lg font-semibold">Market position of every tracked technology</h2>
            <p className="mt-1 text-xs text-muted-foreground">Plotted by Opportunity × Challenge from the live intelligence engine.</p>
          </div>
          <div className="hidden items-center gap-3 text-[10.5px] text-muted-foreground sm:flex">
            <span className="inline-flex items-center gap-1"><ArrowUp className="h-2.5 w-2.5 text-emerald-500" strokeWidth={2.5} /> up</span>
            <span className="inline-flex items-center gap-1"><ArrowDown className="h-2.5 w-2.5 text-rose-500" strokeWidth={2.5} /> down</span>
            <span className="inline-flex items-center gap-1"><Bookmark className="h-2.5 w-2.5 fill-amber-500 text-amber-500" /> workspace</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
            <GartnerMatrixSampler
              technologies={techs}
              onSelectTechnology={(t) => navigate(`/compass/technology/${getTechnologySlug(t)}`)}
            />
          </div>

          <div className="flex flex-col gap-3">
            {/* Hot news */}
            <div className="rounded-2xl border border-border bg-card p-4 flex-1">
              <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase mb-3">Hot news</p>
              {latestNews.length === 0 ? (
                <p className="text-xs text-muted-foreground">No news available yet.</p>
              ) : latestNews.map((n) => {
                const added = wsItems.some((i) => i.kind === "news" && i.refId === n.id);
                return (
                  <div key={n.id} className="flex items-start gap-2 py-2 border-b border-border/60 last:border-0">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 bg-secondary text-foreground">
                      {(n.source_name || "NEWS").slice(0, 6).toUpperCase()}
                    </span>
                    <a href={n.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground leading-snug flex-1 hover:text-foreground line-clamp-2">
                      {n.title}
                    </a>
                    <button
                      onClick={() => {
                        if (added) return;
                        addToWorkspace({ kind: "news", refId: n.id, title: n.title, subtitle: n.source_name || "News" });
                        toast.success("Added to Workspace");
                      }}
                      title={added ? "Added to Workspace" : "Add to Workspace"}
                      className={cn("shrink-0 rounded p-1 transition-colors",
                        added ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                    >
                      {added ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Key insights */}
            <div className="rounded-2xl border border-border bg-card p-4 flex-1">
              <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase mb-3">Key insights</p>
              {insights.length === 0 ? (
                <p className="text-xs text-muted-foreground">Computing insights from live data…</p>
              ) : insights.map((text, i) => {
                const refId = `home:insight:${i}:${text.slice(0, 24)}`;
                const added = wsItems.some((it) => it.kind === "insight" && it.refId === refId);
                return (
                  <div key={text} className="flex items-start gap-2 py-2 text-xs text-muted-foreground leading-snug border-b border-border/60 last:border-0">
                    <span className="text-primary shrink-0">→</span>
                    <span className="flex-1">{text}</span>
                    <button
                      onClick={() => {
                        if (added) return;
                        addToWorkspace({ kind: "insight", refId, title: text, subtitle: "Auto-generated insight" });
                        toast.success("Added to Workspace");
                      }}
                      title={added ? "Added" : "Add to Workspace"}
                      className={cn("shrink-0 rounded p-1 transition-colors",
                        added ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                    >
                      {added ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Action map table ─────────────────────────────────────────── */}
      <section>
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">Action map</p>
            <h2 className="mt-1.5 text-lg font-semibold">What to do — per technology</h2>
            <p className="mt-1 text-xs text-muted-foreground">Grouped by recommended action and horizon. Bar shows signal strength (0–100).</p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[10.5px] text-muted-foreground cursor-help"
            title="Signal strength = composite 0–100 from investment, patents, news and research. Higher = stronger evidence."
          >
            <Info className="h-3 w-3" /> What is signal strength?
          </span>
        </div>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-[160px_88px_1fr] gap-x-6 px-6 py-3 border-b border-border bg-secondary/40">
            <span className="text-[10px] font-medium tracking-[0.14em] uppercase text-muted-foreground">Action</span>
            <span className="text-[10px] font-medium tracking-[0.14em] uppercase text-muted-foreground">Horizon</span>
            <span className="text-[10px] font-medium tracking-[0.14em] uppercase text-muted-foreground">Technology · signal strength</span>
          </div>
          <div className="divide-y divide-border">
            {(["qw", "bb", "wt", "rt"] as Quadrant[]).map((q) => {
              const meta = QUADRANT_META[q];
              const list = quadGroups[q];
              return (
                <div key={q} className="grid grid-cols-[160px_88px_1fr] gap-x-6 px-6 py-4 items-start hover:bg-secondary/20 transition-colors">
                  <div className="flex flex-col gap-1.5">
                    <span className={cn("self-start text-[11px] font-medium px-2 py-1 rounded", meta.bg, meta.text)}>
                      {meta.label}
                    </span>
                    <span className="self-start text-[10px] text-muted-foreground">{meta.action}</span>
                  </div>
                  <div className="pt-1 text-[12px] text-muted-foreground">{meta.horizon}</div>
                  <div className="flex flex-col gap-2">
                    {list.length === 0 ? (
                      <span className="text-[11px] text-muted-foreground italic">No technologies in this quadrant.</span>
                    ) : list.slice(0, 6).map((t) => {
                      const score = signalStrength(t);
                      const inWs = workspace.includes(t.keywordId);
                      const dComp = deltaMap[t.keywordId]?.deltas.composite;
                      const moved = dComp !== null && dComp !== undefined && Math.abs(dComp) > 0.1;
                      const up = (dComp || 0) >= 0;
                      const bar = q === "qw" ? "bg-emerald-500" : q === "bb" ? "bg-sky-500" : q === "wt" ? "bg-amber-500" : "bg-rose-500";
                      return (
                        <div key={t.id} className="grid grid-cols-[1fr_140px_44px] items-center gap-3">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {inWs && <Bookmark className="h-3 w-3 shrink-0 fill-amber-500 text-amber-500" />}
                            <Link to={`/compass/technology/${getTechnologySlug(t)}`}
                              className={cn("truncate text-[12px] hover:text-foreground", inWs ? "font-medium text-foreground" : "text-muted-foreground")}>
                              {t.name}
                            </Link>
                            {moved && (
                              <span className={cn("inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-semibold",
                                up ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" : "bg-rose-500/15 text-rose-600 dark:text-rose-300")}>
                                {up ? <ArrowUp className="h-2.5 w-2.5" strokeWidth={2.5} /> : <ArrowDown className="h-2.5 w-2.5" strokeWidth={2.5} />}
                              </span>
                            )}
                          </div>
                          <div className="h-1.5 rounded bg-secondary" title={`Signal strength ${score}/100`}>
                            <div className={cn("h-1.5 rounded transition-all", bar)} style={{ width: `${score}%` }} />
                          </div>
                          <span className="text-[11px] font-medium tabular-nums text-right text-muted-foreground">{score}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Momentum chart + Lab ─────────────────────────────────────── */}
      <section>
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">Momentum</p>
            <h2 className="mt-1.5 text-lg font-semibold">How the story is unfolding</h2>
            <p className="mt-1 text-xs text-muted-foreground">Rate of change in signal strength. Open the lab to compose a chart and send it to Workspace.</p>
          </div>
          <Link to="/compass/studio"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground">
            <FolderOpen className="h-3.5 w-3.5" />
            {wsCount} in Workspace · ready for report
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border bg-secondary/40">
            <div className="min-w-0">
              <p className="text-sm font-medium">Signal momentum — top movers ({PERIODS.find((p) => p.key === period)!.label})</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Composite: investments · patents · news · research</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {labOpen && (
                <button
                  onClick={sendChartToWorkspace}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
                  title="Send the current chart to Workspace"
                >
                  <Send className="h-3.5 w-3.5" /> Send chart to Workspace
                </button>
              )}
              <button
                onClick={() => setLabOpen((v) => !v)}
                className={cn("flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-90",
                  labOpen ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground")}
              >
                {labOpen ? "✕ Close lab" : <><Sparkles className="h-3.5 w-3.5" /> Open the lab</>}
              </button>
            </div>
          </div>

          <div className="p-5">
            {labOpen && (
              <div className="flex flex-col gap-3 mb-5 pb-4 border-b border-border">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Period:</span>
                  {PERIODS.map((p) => (
                    <button key={p.key} onClick={() => setPeriod(p.key)}
                      className={cn("text-xs px-3 py-1.5 rounded-md border transition-all",
                        period === p.key ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-secondary/60")}>
                      {p.label}
                    </button>
                  ))}
                  <span className="text-xs text-muted-foreground ml-3">Drivers:</span>
                  {Object.entries(DRIVER_LABELS).map(([k, v]) => (
                    <button key={k} onClick={() => toggleDriver(k)}
                      className={cn("text-xs px-3 py-1.5 rounded-md border transition-all",
                        drivers.includes(k) ? "bg-primary/10 text-primary border-primary/40" : "bg-card text-muted-foreground border-border hover:bg-secondary/60")}>
                      {v}
                    </button>
                  ))}
                </div>
                <div className="flex items-start gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground mt-1">Technologies:</span>
                  {techs.slice(0, 16).map((t) => (
                    <button key={t.keywordId} onClick={() => toggleKid(t.keywordId)}
                      className={cn("text-xs px-2.5 py-1 rounded-md border transition-all",
                        selectedKids.includes(t.keywordId) ? "bg-foreground text-background border-foreground" : "bg-card text-muted-foreground border-border hover:bg-secondary/60")}>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[68fr_32fr] gap-4">
              <div>
                <div className="flex flex-wrap gap-3 mb-3">
                  {activeKids.map((kid, i) => {
                    const t = techByKid[kid];
                    if (!t) return null;
                    return (
                      <span key={kid} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length], display: "inline-block" }} />
                        {t.name}
                      </span>
                    );
                  })}
                </div>
                {chartData.length === 0 ? (
                  <div className="flex h-[240px] items-center justify-center text-xs text-muted-foreground">
                    {isLoading ? "Loading momentum…" : "Not enough snapshot history yet for the selected window."}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <ReTooltip
                        contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      {activeKids.map((kid, i) => {
                        const t = techByKid[kid];
                        if (!t) return null;
                        return (
                          <Line key={kid} type="monotone" dataKey={kid} name={t.name}
                            stroke={COLORS[i % COLORS.length]} strokeWidth={2}
                            dot={{ r: 2, fill: COLORS[i % COLORS.length] }} activeDot={{ r: 4 }} />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">Top risers</p>
                {movers.filter((m) => (m.d.deltas.composite || 0) >= 0).slice(0, 2).map(({ d, t }) => (
                  <MoverCard key={t!.keywordId} name={t!.name} score={Number((d.deltas.composite || 0).toFixed(1))} positive
                    driver={d.deltas.funding ? "Investments" : d.deltas.patents ? "Patents" : "News"}
                    onAdd={() => { toggleWorkspace(t!.keywordId); setWorkspace(loadWorkspace()); }}
                    inWs={workspace.includes(t!.keywordId)} />
                ))}
                <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase mt-1">Top decliners</p>
                {movers.filter((m) => (m.d.deltas.composite || 0) < 0).slice(0, 2).map(({ d, t }) => (
                  <MoverCard key={t!.keywordId} name={t!.name} score={Number((d.deltas.composite || 0).toFixed(1))} positive={false}
                    driver={d.deltas.funding ? "Investments" : d.deltas.patents ? "Patents" : "News"}
                    onAdd={() => { toggleWorkspace(t!.keywordId); setWorkspace(loadWorkspace()); }}
                    inWs={workspace.includes(t!.keywordId)} />
                ))}
                {movers.filter((m) => (m.d.deltas.composite || 0) < 0).length === 0 && (
                  <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground">No decliners in window.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MoverCard({ name, score, positive, driver, onAdd, inWs }: {
  name: string; score: number; positive: boolean; driver: string; onAdd: () => void; inWs: boolean;
}) {
  return (
    <div className="rounded-lg border border-border p-3 bg-card">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="text-xs font-medium truncate">{name}</div>
        <button onClick={onAdd} title={inWs ? "In Workspace" : "Add to Workspace"}
          className={cn("rounded p-1 transition-colors", inWs ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
          {inWs ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        </button>
      </div>
      <div className={cn("text-lg font-medium", positive ? "text-emerald-500 dark:text-emerald-300" : "text-rose-500 dark:text-rose-300")}>
        {positive ? "+" : ""}{score} <span className="text-xs font-normal text-muted-foreground">pts</span>
      </div>
      <div className="text-xs text-muted-foreground mb-2">Driver: {driver}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 rounded bg-secondary">
          <div className={cn("h-1 rounded", positive ? "bg-primary" : "bg-rose-500")} style={{ width: `${Math.min(100, Math.abs(score) * 8)}%` }} />
        </div>
      </div>
    </div>
  );
}
