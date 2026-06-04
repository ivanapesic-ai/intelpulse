import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, X } from "lucide-react";
import { useTechnologyIntelligence } from "@/hooks/useTechnologyIntelligence";
import { loadStances, setStance, signalStrength, strengthBand, fmtFunding, type Stance } from "./lib";
import { cn } from "@/lib/utils";

export default function CompassSignals() {
  const { data: techs = [] } = useTechnologyIntelligence();
  const [stances, setStances] = useState<Record<string, Stance>>(loadStances());

  useEffect(() => {
    const h = () => setStances(loadStances());
    window.addEventListener("compass:stance-changed", h);
    return () => window.removeEventListener("compass:stance-changed", h);
  }, []);

  const bullish = useMemo(
    () => techs.filter((t) => stances[t.keywordId] === "bullish"),
    [techs, stances]
  );
  const bearish = useMemo(
    () => techs.filter((t) => stances[t.keywordId] === "bearish"),
    [techs, stances]
  );
  const untaken = techs.filter((t) => !stances[t.keywordId]).slice(0, 16);

  const apply = (kid: string, s: Stance | null) => {
    setStance(kid, s);
    setStances(loadStances());
  };

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Watchlist with conviction</p>
        <h1 className="mt-2 font-display text-3xl text-slate-100">My Signals</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Take a stance. Mark technologies you expect to accelerate as <span className="text-emerald-300">bullish</span>,
          and those you think are over-hyped or stalling as <span className="text-rose-300">bearish</span>.
          Reports and briefings will weight these accordingly.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <StanceColumn
          title="Bullish"
          icon={TrendingUp}
          accent="emerald"
          items={bullish}
          onClear={(kid) => apply(kid, null)}
          emptyHint="Drag conviction here. Start by marking technologies below."
        />
        <StanceColumn
          title="Bearish"
          icon={TrendingDown}
          accent="rose"
          items={bearish}
          onClear={(kid) => apply(kid, null)}
          emptyHint="No bearish calls yet."
        />
      </div>

      <section>
        <h2 className="mb-4 text-sm uppercase tracking-[0.2em] text-slate-500">Take a stance</h2>
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 font-normal">Technology</th>
                <th className="px-4 py-3 font-normal text-right">Strength</th>
                <th className="px-4 py-3 font-normal text-right">Investment</th>
                <th className="px-4 py-3 font-normal text-right w-48">Your call</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {untaken.map((t) => {
                const s = signalStrength(t);
                const band = strengthBand(s);
                return (
                  <tr key={t.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <Link to={`/technology/${t.keyword || t.id}`} className="text-slate-200 hover:text-white">
                        {t.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("tabular-nums", band.color)}>{s}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400 tabular-nums">{fmtFunding(t.totalFundingEur)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => apply(t.keywordId, "bullish")}
                          className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-400/20"
                        >
                          Bullish
                        </button>
                        <button
                          onClick={() => apply(t.keywordId, "bearish")}
                          className="rounded-md border border-rose-400/30 bg-rose-400/10 px-2.5 py-1 text-xs text-rose-300 hover:bg-rose-400/20"
                        >
                          Bearish
                        </button>
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

function StanceColumn({
  title,
  icon: Icon,
  accent,
  items,
  onClear,
  emptyHint,
}: {
  title: string;
  icon: any;
  accent: "emerald" | "rose";
  items: any[];
  onClear: (kid: string) => void;
  emptyHint: string;
}) {
  const colors =
    accent === "emerald"
      ? { ring: "border-emerald-400/20", glow: "bg-emerald-400/5", text: "text-emerald-300", chip: "bg-emerald-400/10" }
      : { ring: "border-rose-400/20", glow: "bg-rose-400/5", text: "text-rose-300", chip: "bg-rose-400/10" };

  return (
    <div className={cn("rounded-2xl border bg-gradient-to-b from-white/[0.03] to-transparent p-5", colors.ring)}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("rounded-md p-1.5", colors.chip)}>
            <Icon className={cn("h-4 w-4", colors.text)} />
          </div>
          <h3 className="font-display text-lg text-slate-100">{title}</h3>
        </div>
        <span className="text-xs text-slate-500">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/5 px-4 py-8 text-center text-xs text-slate-600">
          {emptyHint}
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((t) => {
            const s = signalStrength(t);
            return (
              <div
                key={t.id}
                className="group flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5"
              >
                <Link to={`/technology/${t.keyword || t.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-200">{t.name}</p>
                  <p className="text-[11px] text-slate-500">
                    Strength {s} · {fmtFunding(t.totalFundingEur)}
                  </p>
                </Link>
                <button
                  onClick={() => onClear(t.keywordId)}
                  className="opacity-0 transition-opacity group-hover:opacity-100 text-slate-500 hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
