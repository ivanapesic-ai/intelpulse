import { useMemo, useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Bookmark, TrendingUp, TrendingDown,
  ExternalLink, Building2, Banknote, FileText, Newspaper, Sparkles,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
} from "recharts";
import { useTechnologyIntelligence } from "@/hooks/useTechnologyIntelligence";
import { useSignalSnapshots } from "@/hooks/useSignalSnapshots";
import { useNewsForKeyword } from "@/hooks/useNews";
import { signalStrength, strengthBand, fmtFunding, getQuadrant, QUADRANT_META, loadWorkspace, toggleWorkspace, loadStances, setStance } from "./lib";
import { TECHS, RELATIONSHIPS, getTechById } from "./data/technologies";
import { cn } from "@/lib/utils";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const SIGNAL_LABELS: Record<string, { label: string; icon: any }> = {
  investment: { label: "Investment", icon: Banknote },
  research: { label: "Research", icon: Sparkles },
  patents: { label: "Patents", icon: FileText },
  visibility: { label: "Market visibility", icon: Newspaper },
};

export default function CompassTechnology() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { data: techs = [], isLoading } = useTechnologyIntelligence();

  const tech = useMemo(() => {
    const s = slug.toLowerCase();
    return techs.find((t) =>
      (t.keyword || "").toLowerCase() === s ||
      t.id === s ||
      slugify(t.name) === s
    );
  }, [techs, slug]);

  // Static fallback (for nodes like "sdv", "av" from the map data)
  const staticTech = useMemo(() => getTechById(slug), [slug]);

  const keywordId = tech?.keywordId || "";
  const { data: snapshots = [] } = useSignalSnapshots(keywordId ? [keywordId] : [], 12);
  const { data: news = [] } = useNewsForKeyword(keywordId || null, { limit: 8 });

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

  if (isLoading) {
    return <div className="h-96 animate-pulse rounded-2xl border border-border bg-card" />;
  }

  if (!tech && !staticTech) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">No technology found for “{slug}”.</p>
        <button onClick={() => navigate(-1)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
      </div>
    );
  }

  const name = tech?.name ?? staticTech!.name;
  const domain = tech?.domainName ?? "—";
  const description = tech?.description ?? staticTech?.description ?? "";
  const s100 = tech ? signalStrength(tech) : Math.round(((staticTech?.base?.[3] ?? 50) + 50));
  const band = strengthBand(s100);
  const q = tech ? getQuadrant(tech) : (staticTech?.quadrant as any);
  const meta = q ? QUADRANT_META[q] : null;

  const inWs = keywordId ? ws.includes(keywordId) : false;
  const stance = keywordId ? stances[keywordId]?.stance : undefined;

  // Snapshot trend
  const trend = useMemo(() => {
    if (!snapshots.length) return [] as { label: string; composite: number; investment: number; patents: number; visibility: number }[];
    return snapshots.map((s) => ({
      label: new Date(s.snapshot_date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      composite: Number(s.composite_score) || 0,
      investment: Number(s.investment_score) || 0,
      patents: Number(s.patents_score) || 0,
      visibility: Number(s.visibility_score) || 0,
    }));
  }, [snapshots]);

  // Related techs from static relationships graph
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

  const signals = tech ? [
    { key: "investment", v: tech.investmentScore },
    { key: "research", v: tech.researchScore },
    { key: "patents", v: tech.patentsScore },
    { key: "visibility", v: tech.visibilityScore },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <Link to="/compass/ecosystem" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Ecosystem
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
          </div>

          {/* Signal strength dial */}
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-[10.5px] font-medium uppercase tracking-widest text-muted-foreground">Signal strength</p>
              <div className="mt-1 flex items-baseline justify-end gap-1">
                <span className="text-4xl font-semibold tabular-nums">{s100}</span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
              <p className={cn("text-xs font-medium", band.color)}>{band.label}</p>
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
          <Link to={`/technology/${keywordId || slug}`} className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground">
            Open classic deep dive <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

      {/* KPIs */}
      {tech && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi icon={Building2} label="Companies" value={tech.dealroomCompanyCount.toLocaleString()} />
          <Kpi icon={Banknote} label="Funding" value={fmtFunding(tech.totalFundingEur)} />
          <Kpi icon={FileText} label="Patents" value={tech.totalPatents.toLocaleString()} />
          <Kpi icon={Newspaper} label="News mentions" value={tech.newsMentionCount.toLocaleString()} />
        </div>
      )}

      {/* Signal breakdown + momentum */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Momentum (composite score)</h2>
            <span className="text-[10.5px] text-muted-foreground">last {snapshots.length} snapshots</span>
          </div>
          {trend.length < 2 ? (
            <div className="mt-4 flex h-[220px] items-center justify-center text-xs text-muted-foreground">
              Not enough snapshot history yet.
            </div>
          ) : (
            <div className="mt-3">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <ReTooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="composite" name="Composite" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="investment" name="Investment" stroke="hsl(140 55% 45%)" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="patents" name="Patents" stroke="hsl(32 70% 50%)" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="visibility" name="Visibility" stroke="hsl(210 75% 55%)" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Signal breakdown</h2>
          <ul className="mt-4 space-y-3">
            {signals.length === 0 && <li className="text-xs text-muted-foreground">No signal scores available.</li>}
            {signals.map((s) => {
              const meta = SIGNAL_LABELS[s.key];
              const Icon = meta.icon;
              const pct = Math.round(((s.v ?? 0) / 2) * 100);
              const band2 = strengthBand(pct);
              return (
                <li key={s.key}>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" /> {meta.label}
                    </span>
                    <span className={cn("font-semibold tabular-nums", band2.color)}>{pct}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-secondary">
                    <div className={cn("h-full rounded-full", band2.bar)} style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Related + News */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Related technologies</h2>
          {related.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">No mapped relationships.</p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {related.map(({ rel, other }) => (
                <li key={rel.id}>
                  <Link to={`/compass/technology/${other.id}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-[12.5px] hover:bg-secondary">
                    <span className="inline-flex items-center gap-2 truncate">
                      <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: other.color }} />
                      <span className="truncate font-medium">{other.name}</span>
                    </span>
                    <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {rel.type}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Latest news</h2>
          {news.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">No matched news yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {news.slice(0, 6).map((n: any) => (
                <li key={n.id}>
                  <a href={n.url} target="_blank" rel="noopener noreferrer"
                    className="group block rounded-md border border-border bg-background px-3 py-2 hover:bg-secondary">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-[12.5px] font-medium leading-snug">{n.title}</p>
                      <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground group-hover:text-foreground" />
                    </div>
                    <p className="mt-1 text-[10.5px] text-muted-foreground">
                      {n.source_name || "Source"}{n.published_at ? ` · ${new Date(n.published_at).toLocaleDateString()}` : ""}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Key players */}
      {tech && tech.keyPlayers?.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Key players</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tech.keyPlayers.slice(0, 24).map((p) => (
              <span key={p} className="rounded-full border border-border bg-background px-2.5 py-1 text-[11.5px]">{p}</span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-widest text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className="mt-1.5 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
