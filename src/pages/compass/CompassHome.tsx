import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, TrendingUp, TrendingDown, Minus, Plus, BookmarkPlus, Bookmark } from "lucide-react";
import { useTechnologyIntelligence } from "@/hooks/useTechnologyIntelligence";
import { useSignalSnapshots, computeDeltas } from "@/hooks/useSignalSnapshots";
import { signalStrength, strengthBand, fmtFunding, loadWorkspace, toggleWorkspace, getLastVisit, touchLastVisit } from "./lib";
import { cn } from "@/lib/utils";

function timeAgo(d: Date | null) {
  if (!d) return "your first visit";
  const ms = Date.now() - d.getTime();
  const h = Math.floor(ms / 3600_000);
  if (h < 1) return "just now";
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
    window.addEventListener("compass:workspace-changed", h);
    // Update last-visit on unmount so first render uses the previous value
    return () => {
      window.removeEventListener("compass:workspace-changed", h);
      touchLastVisit();
    };
  }, []);

  const deltas = useMemo(() => computeDeltas(snaps, keywordIds), [snaps, keywordIds]);
  const deltaMap = useMemo(() => Object.fromEntries(deltas.map((d) => [d.keywordId, d])), [deltas]);

  // Briefing: top 3 movers by composite delta
  const movers = [...deltas]
    .filter((d) => d.deltas.composite !== null)
    .sort((a, b) => Math.abs(b.deltas.composite || 0) - Math.abs(a.deltas.composite || 0))
    .slice(0, 3)
    .map((d) => ({ d, t: techs.find((x) => x.keywordId === d.keywordId) }))
    .filter((x) => x.t);

  const ranked = [...techs]
    .map((t) => ({ t, s: signalStrength(t) }))
    .sort((a, b) => b.s - a.s);

  return (
    <div className="space-y-12">
      {/* Briefing */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Since {timeAgo(lastVisit)}
          </p>
          <p className="text-xs text-slate-600">{new Date().toLocaleDateString("en-GB", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-indigo-950/40 p-8 shadow-[0_0_60px_-30px_rgba(99,102,241,0.5)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.08),transparent_50%)]" />
          <div className="relative">
            <h1 className="font-display text-3xl leading-tight text-slate-50 md:text-4xl">
              {movers.length === 0 ? (
                <>Markets are quiet. <span className="text-slate-400">No material shifts across tracked technologies.</span></>
              ) : (
                <>
                  <span className="text-slate-400">The story so far:</span>{" "}
                  {movers[0]?.t?.name} is the headline
                  {movers[1] && <>, with <span className="text-slate-200">{movers[1].t!.name}</span> close behind</>}
                  {movers[2] && <> and <span className="text-slate-200">{movers[2].t!.name}</span> drawing fresh signal</>}.
                </>
              )}
            </h1>

            {movers.length > 0 && (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {movers.map(({ d, t }) => {
                  const change = d.deltas.composite || 0;
                  const up = change >= 0;
                  const TrendIcon = change === 0 ? Minus : up ? TrendingUp : TrendingDown;
                  return (
                    <Link
                      key={t!.keywordId}
                      to={`/technology/${t!.keyword || t!.id}`}
                      className="group flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-white/20 hover:bg-white/[0.05]"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-100">{t!.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {d.deltas.funding ? `+${fmtFunding(d.deltas.funding)} investment` : `${d.deltas.patents ?? 0} new patents`}
                        </p>
                      </div>
                      <div className={cn("flex items-center gap-1 text-xs", up ? "text-emerald-300" : "text-rose-300")}>
                        <TrendIcon className="h-3.5 w-3.5" />
                        {Math.abs(change).toFixed(1)}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Signal Strength grid */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl text-slate-100">Signal Strength</h2>
            <p className="mt-1 text-sm text-slate-500">A single composite 0–100 across investment, research, patents, and market response.</p>
          </div>
          <Link to="/compass/signals" className="text-xs text-cyan-400 hover:text-cyan-300">
            View My Signals →
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl border border-white/5 bg-white/[0.02]" />
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
                <div
                  key={t.id}
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 transition-all hover:border-white/20"
                >
                  <div className="flex items-start justify-between">
                    <Link to={`/technology/${t.keyword || t.id}`} className="flex-1 min-w-0">
                      <h3 className="truncate text-base font-medium text-slate-100 group-hover:text-white">
                        {t.name}
                      </h3>
                      <p className={cn("mt-0.5 text-[11px] uppercase tracking-wider", band.color)}>
                        {band.label}
                      </p>
                    </Link>
                    <button
                      onClick={() => {
                        toggleWorkspace(t.keywordId);
                        setWorkspace(loadWorkspace());
                      }}
                      className={cn(
                        "ml-2 rounded-md p-1.5 transition-colors",
                        inWs
                          ? "bg-cyan-400/15 text-cyan-300"
                          : "text-slate-600 hover:bg-white/5 hover:text-slate-300"
                      )}
                      title={inWs ? "Remove from workspace" : "Add to workspace"}
                    >
                      {inWs ? <Bookmark className="h-3.5 w-3.5" fill="currentColor" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  {/* Big score */}
                  <div className="mt-5 flex items-baseline gap-2">
                    <span className="font-display text-5xl font-light tracking-tight text-slate-50 tabular-nums">{s}</span>
                    <span className="text-sm text-slate-500">/ 100</span>
                    {dComp !== null && dComp !== undefined && Math.abs(dComp) > 0.1 && (
                      <span className={cn("ml-auto text-xs", dComp >= 0 ? "text-emerald-300" : "text-rose-300")}>
                        {dComp >= 0 ? "▲" : "▼"} {Math.abs(dComp).toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* 4-bar breakdown */}
                  <div className="mt-4 grid grid-cols-4 gap-1.5">
                    {[
                      { label: "Inv", v: t.investmentScore },
                      { label: "Res", v: t.researchScore },
                      { label: "Pat", v: t.patentsScore },
                      { label: "Mkt", v: t.visibilityScore },
                    ].map((b) => (
                      <div key={b.label} title={`${b.label}: ${b.v}/2`}>
                        <div className="h-1 overflow-hidden rounded-full bg-white/5">
                          <div
                            className={cn("h-full rounded-full transition-all", band.bar)}
                            style={{ width: `${((b.v || 0) / 2) * 100}%`, opacity: 0.85 }}
                          />
                        </div>
                        <p className="mt-1 text-center text-[10px] uppercase tracking-wider text-slate-600">{b.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-3 text-[11px] text-slate-500">
                    <span>{fmtFunding(t.totalFundingEur)}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-700" />
                    <span>{t.totalPatents.toLocaleString()} patents</span>
                    <span className="h-1 w-1 rounded-full bg-slate-700" />
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
