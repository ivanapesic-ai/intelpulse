import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus, BookmarkPlus, Bookmark, RefreshCw, ArrowUp, ArrowDown, Sparkles, ArrowRight } from "lucide-react";
import { useTechnologyIntelligence, type TechnologyIntelligence } from "@/hooks/useTechnologyIntelligence";
import { useSignalSnapshots, computeDeltas } from "@/hooks/useSignalSnapshots";
import {
  signalStrength, strengthBand, fmtFunding, loadWorkspace, toggleWorkspace,
  getLastVisit, touchLastVisit, getQuadrant, QUADRANT_META, type Quadrant,
} from "./lib";
import { cn } from "@/lib/utils";

function timeAgo(d: Date | null) {
  if (!d) return "your first visit";
  const ms = Date.now() - d.getTime();
  const h = Math.floor(ms / 3600_000);
  if (h < 1) return "moments ago";
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

export default function CompassHome() {
  const { data: techs = [], isLoading } = useTechnologyIntelligence();
  const keywordIds = useMemo(() => techs.map((t) => t.keywordId).filter(Boolean), [techs]);
  const { data: snaps = [] } = useSignalSnapshots(keywordIds, 6);
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

  // Briefing: top 3 movers by absolute composite delta
  const movers = [...deltas]
    .filter((d) => d.deltas.composite !== null)
    .sort((a, b) => Math.abs(b.deltas.composite || 0) - Math.abs(a.deltas.composite || 0))
    .slice(0, 3)
    .map((d) => ({ d, t: techs.find((x) => x.keywordId === d.keywordId) }))
    .filter((x) => x.t);

  const ranked = [...techs]
    .map((t) => ({ t, s: signalStrength(t) }))
    .sort((a, b) => b.s - a.s);

  // Bucket techs by quadrant
  const buckets: Record<Quadrant, TechnologyIntelligence[]> = { qw: [], bb: [], wt: [], rt: [] };
  techs.forEach((t) => { const q = getQuadrant(t); if (q) buckets[q].push(t); });

  const totalSignals = techs.length;
  const moverCount = movers.length;

  return (
    <div className="space-y-12">
      {/* Briefing hero */}
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
              const Icon = change === 0 ? Minus : up ? ArrowUp : ArrowDown;
              return (
                <li key={t!.keywordId}>
                  <Link
                    to={`/technology/${t!.keyword || t!.id}`}
                    className="group block rounded-xl border border-border bg-background/60 backdrop-blur-sm p-4 transition-all hover:border-primary/30 hover:bg-background"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                        up ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                           : "bg-rose-500/15 text-rose-600 dark:text-rose-300"
                      )}>
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

      {/* Strategy matrix — Quadrants */}
      <section>
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">Strategy matrix</p>
            <h2 className="mt-1.5 text-lg font-semibold">Market position of every tracked technology</h2>
            <p className="mt-1 text-xs text-muted-foreground">Bucketed by Opportunity × Challenge scores from the live intelligence engine.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {(["qw","bb","wt","rt"] as Quadrant[]).map((q) => {
            const meta = QUADRANT_META[q];
            const items = buckets[q];
            return (
              <div key={q} className={cn("rounded-xl border p-5", meta.ring, meta.bg)}>
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <p className={cn("text-[10px] font-semibold uppercase tracking-[0.18em]", meta.text)}>{meta.horizon} · {meta.action}</p>
                    <h3 className="mt-1 text-base font-semibold">{meta.label}</h3>
                    <p className="text-[11px] text-muted-foreground">{meta.sub}</p>
                  </div>
                  <span className="text-2xl font-light tabular-nums text-muted-foreground">{items.length}</span>
                </div>
                {items.length === 0 ? (
                  <p className="mt-4 text-[11px] text-muted-foreground italic">No technologies scored in this quadrant.</p>
                ) : (
                  <ul className="mt-4 space-y-1">
                    {items.slice(0, 6).map((t) => {
                      const s = signalStrength(t);
                      return (
                        <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                          <Link to={`/technology/${t.keyword || t.id}`} className="truncate hover:text-primary">{t.name}</Link>
                          <span className="text-xs text-muted-foreground tabular-nums">{s}</span>
                        </li>
                      );
                    })}
                    {items.length > 6 && (
                      <li className="text-[11px] text-muted-foreground italic pt-1">+{items.length - 6} more</li>
                    )}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Signal Strength grid */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-[10.5px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">Signal strength</p>
            <h2 className="mt-1.5 text-lg font-semibold">Composite 0–100 across investment, research, patents, and market</h2>
          </div>
          <Link to="/compass/signals" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
            View My Signals <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl border border-border bg-card" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ranked.slice(0, 12).map(({ t, s }) => {
              const band = strengthBand(s);
              const d = deltaMap[t.keywordId];
              const inWs = workspace.includes(t.keywordId);
              const dComp = d?.deltas.composite;
              return (
                <div key={t.id} className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm">
                  <div className="flex items-start justify-between">
                    <Link to={`/technology/${t.keyword || t.id}`} className="flex-1 min-w-0">
                      <h3 className="truncate text-base font-medium">{t.name}</h3>
                      <p className={cn("mt-0.5 text-[11px] uppercase tracking-wider", band.color)}>{band.label}</p>
                    </Link>
                    <button
                      onClick={() => { toggleWorkspace(t.keywordId); setWorkspace(loadWorkspace()); }}
                      className={cn(
                        "ml-2 rounded-md p-1.5 transition-colors",
                        inWs ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                      title={inWs ? "Remove from workspace" : "Add to workspace"}
                    >
                      {inWs ? <Bookmark className="h-3.5 w-3.5" fill="currentColor" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <div className="mt-5 flex items-baseline gap-2">
                    <span className="text-5xl font-light tracking-tight tabular-nums">{s}</span>
                    <span className="text-sm text-muted-foreground">/ 100</span>
                    {dComp !== null && dComp !== undefined && Math.abs(dComp) > 0.1 && (
                      <span className={cn("ml-auto text-xs", dComp >= 0 ? "text-emerald-500 dark:text-emerald-300" : "text-rose-500 dark:text-rose-300")}>
                        {dComp >= 0 ? "▲" : "▼"} {Math.abs(dComp).toFixed(1)}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-1.5">
                    {[
                      { label: "Inv", v: t.investmentScore },
                      { label: "Res", v: t.researchScore },
                      { label: "Pat", v: t.patentsScore },
                      { label: "Mkt", v: t.visibilityScore },
                    ].map((b) => (
                      <div key={b.label} title={`${b.label}: ${b.v}/2`}>
                        <div className="h-1 overflow-hidden rounded-full bg-secondary">
                          <div className={cn("h-full rounded-full transition-all", band.bar)} style={{ width: `${((b.v || 0) / 2) * 100}%`, opacity: 0.85 }} />
                        </div>
                        <p className="mt-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground">{b.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>{fmtFunding(t.totalFundingEur)}</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span>{t.totalPatents.toLocaleString()} patents</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span>{t.dealroomCompanyCount} cos</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
