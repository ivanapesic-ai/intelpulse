import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, X, Check, ArrowRight, Eye, Search } from "lucide-react";
import { useTechnologyIntelligence, type TechnologyIntelligence } from "@/hooks/useTechnologyIntelligence";
import { useSignalSnapshots, computeDeltas } from "@/hooks/useSignalSnapshots";
import { loadStances, setStance, signalStrength, strengthBand, fmtFunding, loadWorkspace, toggleWorkspace, type Stance } from "./lib";
import { cn } from "@/lib/utils";

type StanceRecord = ReturnType<typeof loadStances>;

export default function CompassSignals() {
  const { data: techs = [] } = useTechnologyIntelligence();
  const keywordIds = useMemo(() => techs.map((t) => t.keywordId).filter(Boolean), [techs]);
  const { data: snaps = [] } = useSignalSnapshots(keywordIds, 12);
  const [stances, setStances] = useState<StanceRecord>(loadStances());
  const [workspace, setWorkspace] = useState<string[]>(loadWorkspace());

  useEffect(() => {
    const hs = () => setStances(loadStances());
    const hw = () => setWorkspace(loadWorkspace());
    window.addEventListener("n1:stance-changed", hs);
    window.addEventListener("n1:workspace-changed", hw);
    return () => {
      window.removeEventListener("n1:stance-changed", hs);
      window.removeEventListener("n1:workspace-changed", hw);
    };
  }, []);

  const deltas = useMemo(() => computeDeltas(snaps, keywordIds), [snaps, keywordIds]);
  const deltaMap = useMemo(() => Object.fromEntries(deltas.map((d) => [d.keywordId, d])), [deltas]);

  const bullish = useMemo(() => techs.filter((t) => stances[t.keywordId]?.stance === "bullish"), [techs, stances]);
  const bearish = useMemo(() => techs.filter((t) => stances[t.keywordId]?.stance === "bearish"), [techs, stances]);
  const untaken = techs.filter((t) => !stances[t.keywordId]).slice(0, 20);

  const apply = (kid: string, s: Stance | null) => { setStance(kid, s); setStances(loadStances()); };

  return (
    <div className="space-y-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Watchlist with conviction</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">My Signals</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Mark technologies you expect to accelerate as <span className="text-emerald-600 dark:text-emerald-300">bullish</span>,
            and those you think are over-hyped or stalling as <span className="text-rose-600 dark:text-rose-300">bearish</span>.
            We'll check your conviction against momentum.
          </p>
        </div>
        <Link
          to="/compass/explore"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary"
        >
          <Search className="h-3.5 w-3.5" /> Advanced search
        </Link>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <StanceColumn
          title="Bullish" icon={TrendingUp} accent="emerald" items={bullish}
          stances={stances} deltaMap={deltaMap} workspace={workspace}
          onClear={(kid) => apply(kid, null)}
          onWorkspace={(kid) => { toggleWorkspace(kid); setWorkspace(loadWorkspace()); }}
          emptyHint="Mark technologies you expect to accelerate."
        />
        <StanceColumn
          title="Bearish" icon={TrendingDown} accent="rose" items={bearish}
          stances={stances} deltaMap={deltaMap} workspace={workspace}
          onClear={(kid) => apply(kid, null)}
          onWorkspace={(kid) => { toggleWorkspace(kid); setWorkspace(loadWorkspace()); }}
          emptyHint="No bearish calls yet."
        />
      </div>

      <section>
        <h2 className="mb-4 text-sm uppercase tracking-[0.2em] text-muted-foreground">Take a stance</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-normal">Technology</th>
                <th className="px-4 py-3 font-normal text-right">Strength</th>
                <th className="px-4 py-3 font-normal text-right">Investment</th>
                <th className="px-4 py-3 font-normal text-right">Patents</th>
                <th className="px-4 py-3 font-normal text-right w-48">Your call</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {untaken.map((t) => {
                const s = signalStrength(t);
                const band = strengthBand(s);
                return (
                  <tr key={t.id} className="transition-colors hover:bg-secondary/40">
                    <td className="px-4 py-3">
                      <Link to={`/compass/technology/${t.keyword || t.id}`} className="hover:text-primary">{t.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-right"><span className={cn("tabular-nums", band.color)}>{s}</span></td>
                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">{fmtFunding(t.totalFundingEur)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">{t.totalPatents.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => apply(t.keywordId, "bullish")}
                          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20">Bullish</button>
                        <button onClick={() => apply(t.keywordId, "bearish")}
                          className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-600 dark:text-rose-300 hover:bg-rose-500/20">Bearish</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MiniSpark({ values, positive }: { values: number[]; positive: boolean }) {
  if (values.length < 2) return null;
  const w = 120, h = 28;
  const min = Math.min(...values), max = Math.max(...values);
  const span = Math.max(1, max - min);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / span) * h}`).join(" ");
  const color = positive ? "hsl(160 84% 39%)" : "hsl(0 70% 50%)";
  const fill = positive ? "hsl(160 84% 39% / 0.15)" : "hsl(0 70% 50% / 0.15)";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full">
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={fill} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.4} />
    </svg>
  );
}

function StanceColumn({
  title, icon: Icon, accent, items, stances, deltaMap, workspace, onClear, onWorkspace, emptyHint,
}: {
  title: string;
  icon: any;
  accent: "emerald" | "rose";
  items: TechnologyIntelligence[];
  stances: StanceRecord;
  deltaMap: Record<string, any>;
  workspace: string[];
  onClear: (kid: string) => void;
  onWorkspace: (kid: string) => void;
  emptyHint: string;
}) {
  const colors = accent === "emerald"
    ? { ring: "border-emerald-500/30", text: "text-emerald-600 dark:text-emerald-300", chip: "bg-emerald-500/10" }
    : { ring: "border-rose-500/30", text: "text-rose-600 dark:text-rose-300", chip: "bg-rose-500/10" };

  return (
    <div className={cn("rounded-2xl border bg-card p-5", colors.ring)}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("rounded-md p-1.5", colors.chip)}>
            <Icon className={cn("h-4 w-4", colors.text)} />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <span className="text-xs text-muted-foreground">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-xs text-muted-foreground">{emptyHint}</p>
      ) : (
        <div className="space-y-2">
          {items.map((t) => {
            const s = signalStrength(t);
            const d = deltaMap[t.keywordId];
            const dComp = d?.deltas.composite || 0;
            const stanceAgrees = (accent === "emerald" && dComp >= 0) || (accent === "rose" && dComp < 0);
            const inWs = workspace.includes(t.keywordId);
            return (
              <div key={t.id} className="group rounded-lg border border-border bg-background/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/compass/technology/${t.keyword || t.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground">Strength {s} · {fmtFunding(t.totalFundingEur)}</p>
                  </Link>
                  <button onClick={() => onClear(t.keywordId)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {d?.current && (
                    <span className={cn(
                      "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium",
                      stanceAgrees ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "bg-amber-500/10 text-amber-600 dark:text-amber-300"
                    )}>
                      {stanceAgrees ? <Check className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
                      {stanceAgrees ? `Confirms ${accent === "emerald" ? "bullish" : "bearish"}` : "Diverges"}
                    </span>
                  )}
                  {Math.abs(dComp) > 0.1 && (
                    <span className="text-[10px] tabular-nums text-muted-foreground">{dComp >= 0 ? "+" : ""}{dComp.toFixed(1)}</span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => onWorkspace(t.keywordId)} disabled={inWs}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                      inWs ? "bg-primary/15 text-primary cursor-default" : "bg-foreground text-background hover:opacity-90"
                    )}>
                    {inWs ? <><Check className="h-3 w-3" /> In Workspace</> : <><ArrowRight className="h-3 w-3" /> To Workspace</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
