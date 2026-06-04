import { useMemo, useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Bookmark, TrendingUp, TrendingDown, Minus,
  ExternalLink, Building2, Banknote, FileText, Newspaper, Sparkles,
  Network as NetworkIcon, ShieldCheck, BarChart3, FlaskConical, Layers,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, Area, AreaChart, ComposedChart, Bar, Legend,
} from "recharts";
import { useTechnologyIntelligence } from "@/hooks/useTechnologyIntelligence";
import { useSignalSnapshots } from "@/hooks/useSignalSnapshots";
import { useNewsForKeyword } from "@/hooks/useNews";
import { useCompaniesForTechnology } from "@/hooks/useCompaniesForTechnology";
import { useResearchSignalForKeyword } from "@/hooks/useResearchSignals";
import { useKeywordStandards } from "@/hooks/useKeywordStandards";
import { useTechnologyTimeline } from "@/hooks/useTechnologyTimeline";
import {
  signalStrength, strengthBand, fmtFunding, getQuadrant, QUADRANT_META,
  loadWorkspace, toggleWorkspace, loadStances, setStance,
} from "./lib";
import { RELATIONSHIPS, getTechById } from "./data/technologies";
import { cn } from "@/lib/utils";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

type TabId = "overview" | "signals" | "trends" | "news" | "standards" | "related" | "interop";
const TABS: Array<{ id: TabId; label: string; hint: string }> = [
  { id: "overview", label: "Overview", hint: "Snapshot, momentum, and what's pushing the signal." },
  { id: "signals", label: "Signals", hint: "Inspect each signal stream — investment, research, patents, visibility." },
  { id: "trends", label: "Trends", hint: "Capital flows, research output, and the company landscape." },
  { id: "news", label: "News", hint: "Latest headlines mentioning this technology." },
  { id: "standards", label: "Standards", hint: "Governing standards and consortia shaping this space." },
  { id: "related", label: "Related Techs", hint: "Adjacent technologies and ecosystem relationships." },
  { id: "interop", label: "Interop", hint: "Interoperability surface — how this connects to the wider stack." },
];

const SIGNAL_LABELS = {
  investment: { label: "Investment", icon: Banknote, color: "hsl(140 55% 45%)" },
  research:   { label: "Research",   icon: FlaskConical, color: "hsl(265 55% 55%)" },
  patents:    { label: "Patents",    icon: FileText, color: "hsl(32 70% 50%)" },
  visibility: { label: "Visibility", icon: Newspaper, color: "hsl(210 75% 55%)" },
} as const;
type SignalKey = keyof typeof SIGNAL_LABELS;

export default function CompassTechnology() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { data: techs = [], isLoading } = useTechnologyIntelligence();

  const tech = useMemo(() => {
    const s = String(slug || "").toLowerCase();
    return techs.find((t) => {
      const kw = typeof t.keyword === "string" ? t.keyword.toLowerCase() : "";
      return kw === s || t.id === s || slugify(t.name) === s;
    });
  }, [techs, slug]);

  const staticTech = useMemo(() => getTechById(slug), [slug]);
  const keywordId = tech?.keywordId || "";

  const { data: snapshots = [] } = useSignalSnapshots(keywordId ? [keywordId] : [], 12);
  const { data: news = [] } = useNewsForKeyword(keywordId || null, { limit: 30 });
  const { data: companies = [] } = useCompaniesForTechnology(keywordId);
  const { data: research } = useResearchSignalForKeyword(keywordId || null);
  const { data: standards = [] } = useKeywordStandards(keywordId || null);
  const { data: timeline = [] } = useTechnologyTimeline(keywordId);

  const [tab, setTab] = useState<TabId>("overview");
  const [ws, setWs] = useState<string[]>(() => loadWorkspace());
  const [stances, setStances] = useState(() => loadStances());
  useEffect(() => {
    const refresh = () => { setWs(loadWorkspace()); setStances(loadStances()); };
    window.addEventListener("n1:workspace-changed", refresh);
    window.addEventListener("n1:stance-changed", refresh);
    return () => {
      window.removeEventListener("n1:workspace-changed", refresh);
      window.removeEventListener("n1:stance-changed", refresh);
    };
  }, []);

  const trend = useMemo(() => {
    if (!snapshots.length) return [] as any[];
    return snapshots.map((s) => ({
      label: new Date(s.snapshot_date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      composite: Number(s.composite_score) || 0,
      investment: Number(s.investment_score) || 0,
      research: Number((s as any).research_score) || 0,
      patents: Number(s.patents_score) || 0,
      visibility: Number(s.visibility_score) || 0,
    }));
  }, [snapshots]);

  const related = useMemo(() => {
    const matchId = staticTech?.id ?? slug;
    return RELATIONSHIPS
      .filter((r) => r.source === matchId || r.target === matchId)
      .map((r) => {
        const otherId = r.source === matchId ? r.target : r.source;
        const other = getTechById(otherId);
        return other ? { rel: r, other } : null;
      })
      .filter(Boolean) as { rel: typeof RELATIONSHIPS[number]; other: NonNullable<ReturnType<typeof getTechById>> }[];
  }, [staticTech, slug]);

  if (isLoading) return <div className="h-96 animate-pulse rounded-2xl border border-border bg-card" />;

  if (!tech && !staticTech) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">No technology found for "{slug}".</p>
        <button onClick={() => navigate(-1)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
      </div>
    );
  }

  const name = tech?.name ?? staticTech!.name;
  const domain = tech?.domainName ?? "—";
  const description = tech?.description ?? staticTech?.description ?? "";
  const s100 = tech ? signalStrength(tech) : 50;
  const band = strengthBand(s100);
  const q = tech ? getQuadrant(tech) : (staticTech?.quadrant as any);
  const meta = q ? QUADRANT_META[q] : null;
  const inWs = keywordId ? ws.includes(keywordId) : false;
  const stance = keywordId ? stances[keywordId]?.stance : undefined;

  const signals: { key: SignalKey; v: number }[] = tech ? [
    { key: "investment", v: tech.investmentScore ?? 0 },
    { key: "research",   v: tech.researchScore ?? 0 },
    { key: "patents",    v: tech.patentsScore ?? 0 },
    { key: "visibility", v: tech.visibilityScore ?? 0 },
  ] : [];

  // Composite delta = latest vs first snapshot
  const delta = trend.length >= 2 ? Math.round(trend[trend.length - 1].composite - trend[0].composite) : 0;

  // Drivers / blockers from signal scores
  const sortedSignals = [...signals].sort((a, b) => b.v - a.v);
  const drivers = sortedSignals.slice(0, 2).filter((s) => s.v >= 1);
  const blockers = [...sortedSignals].reverse().slice(0, 2).filter((s) => s.v < 1);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <Link to="/compass/ecosystem" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Technologies
        </Link>
        <span>/</span>
        <span className="text-foreground">{name}</span>
      </div>

      {/* Hero */}
      <header className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{domain}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">{name}</h1>
              {meta && (
                <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide", meta.bg, meta.text)}>
                  {meta.label} · {meta.horizon}
                </span>
              )}
            </div>
            {description && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Pill>{tech?.dealroomCompanyCount ?? 0} companies</Pill>
              <Pill>{fmtFunding(tech?.totalFundingEur ?? 0)} invested</Pill>
              <Pill>{(tech?.totalPatents ?? 0).toLocaleString()} patents</Pill>
              <Pill>{(tech?.newsMentionCount ?? 0).toLocaleString()} mentions</Pill>
            </div>
          </div>

          {/* Score */}
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-[10.5px] font-medium uppercase tracking-widest text-muted-foreground">Signal strength</p>
              <div className="mt-1 flex items-baseline justify-end gap-1">
                <span className="text-4xl font-semibold tabular-nums">{s100}</span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
              <p className={cn("text-xs font-medium", band.color)}>{band.label}</p>
              {delta !== 0 && (
                <p className={cn("mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium",
                  delta > 0 ? "text-emerald-500" : "text-rose-500")}>
                  {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {delta > 0 ? "+" : ""}{delta} pts
                </p>
              )}
            </div>
            <div className="h-1.5 w-44 rounded-full bg-secondary">
              <div className={cn("h-full rounded-full", band.bar)} style={{ width: `${s100}%` }} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          {keywordId && (
            <>
              <button
                onClick={() => { toggleWorkspace(keywordId); setWs(loadWorkspace()); }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                  inWs ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-secondary"
                )}
              >
                <Bookmark className={cn("h-3.5 w-3.5", inWs && "fill-current")} />
                {inWs ? "In Workspace" : "Add to Workspace"}
              </button>
              <div className="inline-flex rounded-md border border-border bg-background p-0.5">
                <button
                  onClick={() => { setStance(keywordId, stance === "bullish" ? null : "bullish"); setStances(loadStances()); }}
                  className={cn("inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium",
                    stance === "bullish" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" : "text-muted-foreground hover:text-foreground")}
                >
                  <TrendingUp className="h-3 w-3" /> Bullish
                </button>
                <button
                  onClick={() => { setStance(keywordId, stance === "bearish" ? null : "bearish"); setStances(loadStances()); }}
                  className={cn("inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium",
                    stance === "bearish" ? "bg-rose-500/15 text-rose-600 dark:text-rose-300" : "text-muted-foreground hover:text-foreground")}
                >
                  <TrendingDown className="h-3 w-3" /> Bearish
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Tab nav */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/85 px-4 backdrop-blur sm:-mx-6 sm:px-6">
        <nav role="tablist" className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const active = t.id === tab;
            const count =
              t.id === "news" ? news.length :
              t.id === "standards" ? standards.length :
              t.id === "related" ? related.length :
              t.id === "trends" ? companies.length :
              undefined;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={cn(
                  "whitespace-nowrap border-b-2 px-3 py-3 text-[13px] font-medium transition-colors",
                  active ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                {t.label}
                {count !== undefined && count > 0 && (
                  <span className="ml-1.5 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">{count}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
      <p className="text-[12px] text-muted-foreground">{TABS.find((t) => t.id === tab)!.hint}</p>

      {/* Tab content */}
      <div>
        {tab === "overview" && (
          <OverviewTab tech={tech} s100={s100} trend={trend} signals={signals} drivers={drivers} blockers={blockers} news={news} onJump={setTab} />
        )}
        {tab === "signals" && <SignalsTab signals={signals} trend={trend} />}
        {tab === "trends" && <TrendsTab tech={tech} companies={companies} research={research ?? null} timeline={timeline} />}
        {tab === "news" && <NewsTab news={news} />}
        {tab === "standards" && <StandardsTab standards={standards} />}
        {tab === "related" && <RelatedTab related={related} />}
        {tab === "interop" && <InteropTab standards={standards} related={related} />}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Tab components
// ──────────────────────────────────────────────────────────────────────────────

function OverviewTab({
  tech, s100, trend, signals, drivers, blockers, news, onJump,
}: any) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="grid gap-5 sm:grid-cols-[1fr_220px]">
          <div className="min-w-0">
            <p className="text-[10.5px] font-medium uppercase tracking-widest text-muted-foreground">Composite score · last {trend.length || 0} snapshots</p>
            {trend.length < 2 ? (
              <div className="mt-3 flex h-40 items-center justify-center text-xs text-muted-foreground">
                Not enough snapshot history yet.
              </div>
            ) : (
              <div className="mt-2 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ovGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={28} />
                    <ReTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="composite" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#ovGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            <button onClick={() => onJump("signals")} className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline">
              Inspect signals <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-1">
            <MiniStat label="Score" value={`${s100}/100`} />
            <MiniStat label="Companies" value={(tech?.dealroomCompanyCount ?? 0).toLocaleString()} />
            <MiniStat label="Investment" value={fmtFunding(tech?.totalFundingEur ?? 0)} />
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="What's driving and blocking this signal" />
        <div className="grid gap-4 lg:grid-cols-2">
          <ExplainCard title="Drivers" tone="positive" items={drivers} />
          <ExplainCard title="Blockers" tone="negative" items={blockers} />
        </div>
      </section>

      <section>
        <SectionHeader
          title="Latest headlines"
          action={<button onClick={() => onJump("news")} className="text-[12px] font-medium text-primary hover:underline">Open News →</button>}
        />
        <NewsGrid items={news.slice(0, 4)} />
      </section>
    </div>
  );
}

function SignalsTab({ signals, trend }: { signals: { key: SignalKey; v: number }[]; trend: any[] }) {
  const [active, setActive] = useState<SignalKey | "composite">("composite");
  const dataKey = active;
  const meta = active === "composite" ? { label: "Composite", color: "hsl(var(--primary))" } : SIGNAL_LABELS[active];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold">Signal streams</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Viewing <span className="font-medium text-foreground">{meta.label}</span> over snapshot history.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(["composite", ...Object.keys(SIGNAL_LABELS)] as const).map((s) => (
              <button
                key={s}
                onClick={() => setActive(s as SignalKey | "composite")}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors",
                  active === s ? "border-foreground bg-foreground text-background" : "border-border bg-background text-muted-foreground hover:bg-secondary"
                )}
              >
                {s === "composite" ? "Composite" : SIGNAL_LABELS[s as SignalKey].label}
              </button>
            ))}
          </div>
        </div>

        {trend.length < 2 ? (
          <div className="mt-6 flex h-60 items-center justify-center text-xs text-muted-foreground">
            Not enough snapshot history yet.
          </div>
        ) : (
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 6, right: 6, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <ReTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey={dataKey} stroke={meta.color as string} strokeWidth={2.2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-[15px] font-semibold">Signal breakdown</h2>
        <ul className="mt-4 space-y-3">
          {signals.length === 0 && <li className="text-xs text-muted-foreground">No signal scores available.</li>}
          {signals.map((s) => {
            const m = SIGNAL_LABELS[s.key];
            const Icon = m.icon;
            const pct = Math.round((s.v / 2) * 100);
            const b = strengthBand(pct);
            return (
              <li key={s.key}>
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Icon className="h-3.5 w-3.5" style={{ color: m.color }} /> {m.label}
                  </span>
                  <span className={cn("font-semibold tabular-nums", b.color)}>{pct}</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-secondary">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: m.color }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function TrendsTab({ tech, companies, research, timeline }: { tech: any; companies: any[]; research: any; timeline: any[] }) {
  const topCompanies = companies.slice(0, 12);
  const topInst = (research?.topInstitutions || []).slice(0, 8);
  const hasTimeline = (timeline || []).some((p) => p.news || p.companies || p.fundingUsd || p.cordis || p.papers || p.github);

  return (
    <div className="space-y-6">
      {/* Historical timeline */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionHeader title="Historical timeline" subtitle="Yearly footprint across news, companies, funding, EU research and open source" />
        {!hasTimeline ? (
          <p className="mt-3 text-xs text-muted-foreground">Not enough historical data yet for this technology.</p>
        ) : (
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timeline} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={32} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={48}
                  tickFormatter={(v) => v >= 1e9 ? `$${(v/1e9).toFixed(1)}B` : v >= 1e6 ? `$${(v/1e6).toFixed(0)}M` : ""} />
                <ReTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any, name: string) => name === "Funding" ? [fmtFunding(Number(v)), name] : [v, name]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="news" name="News" fill="hsl(210 75% 55%)" radius={[3, 3, 0, 0]} />
                <Bar yAxisId="left" dataKey="companies" name="Companies founded" fill="hsl(265 55% 55%)" radius={[3, 3, 0, 0]} />
                <Bar yAxisId="left" dataKey="cordis" name="EU projects" fill="hsl(32 70% 50%)" radius={[3, 3, 0, 0]} />
                <Bar yAxisId="left" dataKey="github" name="OSS repos" fill="hsl(140 55% 45%)" radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="fundingUsd" name="Funding" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Companies */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionHeader title="Top companies by funding" subtitle={`${companies.length} companies linked to this technology`} />
        {topCompanies.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">No companies matched yet.</p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {topCompanies.map((c) => (
              <a key={c.id} href={c.website || undefined} target="_blank" rel="noopener noreferrer"
                className="group flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-3 hover:border-primary/40">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold">{c.name}</p>
                  {c.tagline && <p className="mt-0.5 line-clamp-2 text-[11.5px] text-muted-foreground">{c.tagline}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10.5px] text-muted-foreground">
                    {c.hqCountry && <span>{c.hqCountry}</span>}
                    {c.employeesCount && c.employeesCount !== "Unknown" && <span>· {c.employeesCount} emp</span>}
                    {c.foundedDate && <span>· founded {c.foundedDate.slice(0, 4)}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[12.5px] font-semibold tabular-nums">{fmtFunding(c.totalFundingUsd * 0.92)}</p>
                  {c.website && <ExternalLink className="ml-auto mt-1 h-3 w-3 text-muted-foreground group-hover:text-foreground" />}
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Research */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionHeader title="Research output" subtitle={research ? `${research.totalWorks.toLocaleString()} works · ${research.citationCount.toLocaleString()} citations · h-index ${research.hIndex}` : ""} />
        {!research ? (
          <p className="mt-3 text-xs text-muted-foreground">No research signals available.</p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat label="Total works" value={research.totalWorks.toLocaleString()} />
              <MiniStat label="Last 5y" value={research.worksLast5y.toLocaleString()} />
              <MiniStat label="Last 2y" value={research.worksLast2y.toLocaleString()} />
              <MiniStat label="YoY growth" value={`${research.growthRateYoy > 0 ? "+" : ""}${Math.round(research.growthRateYoy * 100)}%`} />
            </div>
            {topInst.length > 0 && (
              <div className="mt-5">
                <p className="text-[10.5px] font-medium uppercase tracking-widest text-muted-foreground">Top institutions</p>
                <ul className="mt-2 space-y-1.5">
                  {topInst.map((i: any, idx: number) => (
                    <li key={idx} className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-1.5 text-[12px]">
                      <span className="truncate"><span className="font-medium">{i.name}</span>{i.country && <span className="ml-1.5 text-muted-foreground">· {i.country}</span>}</span>
                      <span className="tabular-nums text-muted-foreground">{i.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(research.topPapers || []).slice(0, 5).length > 0 && (
              <div className="mt-5">
                <p className="text-[10.5px] font-medium uppercase tracking-widest text-muted-foreground">Most cited papers</p>
                <ul className="mt-2 space-y-1.5">
                  {research.topPapers.slice(0, 5).map((p: any) => (
                    <li key={p.id || p.title}>
                      <a href={p.doi ? `https://doi.org/${p.doi}` : "#"} target="_blank" rel="noopener noreferrer"
                        className="block rounded-md border border-border bg-background px-3 py-2 text-[12px] hover:bg-secondary">
                        <p className="line-clamp-2 font-medium">{p.title}</p>
                        <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                          {p.year} · {p.citations?.toLocaleString() || 0} citations
                          {p.source && ` · ${p.source}`}
                        </p>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      {/* Key players from intelligence */}
      {tech?.keyPlayers?.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <SectionHeader title="Key players" subtitle="Companies tagged in research and patents" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tech.keyPlayers.slice(0, 30).map((p: string) => (
              <span key={p} className="rounded-full border border-border bg-background px-2.5 py-1 text-[11.5px]">{p}</span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function NewsTab({ news }: { news: any[] }) {
  if (news.length === 0) {
    return <div className="rounded-2xl border border-dashed border-border p-10 text-center text-xs text-muted-foreground">No news matched yet.</div>;
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {news.map((n) => (
        <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer"
          className="group block rounded-xl border border-border bg-card p-4 hover:border-primary/40">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-[13px] font-medium leading-snug">{n.title}</p>
            <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground group-hover:text-foreground" />
          </div>
          {n.description && <p className="mt-1.5 line-clamp-2 text-[11.5px] text-muted-foreground">{n.description}</p>}
          <p className="mt-2 text-[10.5px] text-muted-foreground">
            {n.source_name || "Source"}{n.published_at ? ` · ${new Date(n.published_at).toLocaleDateString()}` : ""}
          </p>
        </a>
      ))}
    </div>
  );
}

function StandardsTab({ standards }: { standards: any[] }) {
  if (standards.length === 0) {
    return <div className="rounded-2xl border border-dashed border-border p-10 text-center text-xs text-muted-foreground">No standards mapped to this technology yet.</div>;
  }
  const sdo = standards.filter((s) => s.body_type === "sdo");
  const consortia = standards.filter((s) => s.body_type === "consortia");
  return (
    <div className="space-y-6">
      {sdo.length > 0 && (
        <section>
          <SectionHeader title="Standards bodies (SDO)" subtitle={`${sdo.length} formal standards`} />
          <StandardsList items={sdo} />
        </section>
      )}
      {consortia.length > 0 && (
        <section>
          <SectionHeader title="Industry consortia" subtitle={`${consortia.length} consortium-led specs`} />
          <StandardsList items={consortia} />
        </section>
      )}
    </div>
  );
}

function StandardsList({ items }: { items: any[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((s) => (
        <li key={s.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider">{s.issuing_body}</span>
                <p className="text-[13px] font-semibold">{s.standard_code}</p>
              </div>
              <p className="mt-1.5 text-[13px] font-medium">{s.standard_title}</p>
              {s.description && <p className="mt-1 line-clamp-3 text-[12px] text-muted-foreground">{s.description}</p>}
            </div>
            {s.url && (
              <a href={s.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] hover:bg-secondary">
                Read <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function RelatedTab({ related }: { related: any[] }) {
  if (related.length === 0) {
    return <div className="rounded-2xl border border-dashed border-border p-10 text-center text-xs text-muted-foreground">No mapped relationships.</div>;
  }
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {related.map(({ rel, other }: any) => (
        <Link key={rel.id} to={`/compass/technology/${other.id}`}
          className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40">
          <span className="mt-1 h-3 w-3 shrink-0 rounded-sm" style={{ background: other.color }} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[13px] font-semibold">{other.name}</p>
              <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{rel.type}</span>
            </div>
            {rel.note && <p className="mt-1 line-clamp-2 text-[11.5px] text-muted-foreground">{rel.note}</p>}
            <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary opacity-70 group-hover:opacity-100">
              Open deep dive <ArrowRight className="h-3 w-3" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function InteropTab({ standards, related }: { standards: any[]; related: any[] }) {
  const interopRels = related.filter((r: any) => r.rel.type === "interoperability" || r.rel.type === "requires" || r.rel.type === "depends-on");
  const interopStandards = standards.filter((s) =>
    /interop|protocol|comm|ISO 15118|OPC UA|MQTT|charging/i.test(`${s.standard_code} ${s.standard_title} ${s.description ?? ""}`)
  );
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionHeader title="Interoperability surface" subtitle="How this technology connects to the wider stack" />
        {interopRels.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">No interoperability relationships mapped.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {interopRels.map(({ rel, other }: any) => (
              <li key={rel.id} className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
                <NetworkIcon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link to={`/compass/technology/${other.id}`} className="text-[13px] font-semibold hover:text-primary">{other.name}</Link>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{rel.type}</span>
                  </div>
                  {rel.note && <p className="mt-1 text-[11.5px] text-muted-foreground">{rel.note}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionHeader title="Interop-relevant standards" subtitle="Protocols and specifications shaping cross-vendor compatibility" />
        {interopStandards.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">No interop-flagged standards yet — see the Standards tab for the full list.</p>
        ) : (
          <StandardsList items={interopStandards} />
        )}
      </section>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Shared building blocks
// ──────────────────────────────────────────────────────────────────────────────

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">{children}</span>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-[15px] font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[11.5px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function ExplainCard({ title, tone, items }: { title: string; tone: "positive" | "negative"; items: { key: SignalKey; v: number }[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        {tone === "positive" ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> : <TrendingDown className="h-3.5 w-3.5 text-rose-500" />}
        <h3 className="text-[13px] font-semibold">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-[11.5px] text-muted-foreground">
          {tone === "positive" ? "No standout drivers — all signals are middling." : "No clear blockers — every signal is reasonably strong."}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((s) => {
            const m = SIGNAL_LABELS[s.key];
            const pct = Math.round((s.v / 2) * 100);
            return (
              <li key={s.key} className="flex items-center gap-3">
                <m.icon className="h-3.5 w-3.5 shrink-0" style={{ color: m.color }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="font-medium">{m.label}</span>
                    <span className={cn("tabular-nums font-semibold", tone === "positive" ? "text-emerald-500" : "text-rose-500")}>{pct}/100</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {tone === "positive"
                      ? `${m.label} is a relative strength versus the other signals.`
                      : `${m.label} is the weakest signal — limits the composite score.`}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function NewsGrid({ items }: { items: any[] }) {
  if (items.length === 0) return <p className="text-xs text-muted-foreground">No news yet.</p>;
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {items.map((n) => (
        <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer"
          className="group block rounded-lg border border-border bg-card p-3 hover:border-primary/40">
          <p className="line-clamp-2 text-[12.5px] font-medium leading-snug">{n.title}</p>
          <p className="mt-1.5 text-[10.5px] text-muted-foreground">
            {n.source_name || "Source"}{n.published_at ? ` · ${new Date(n.published_at).toLocaleDateString()}` : ""}
          </p>
        </a>
      ))}
    </div>
  );
}
