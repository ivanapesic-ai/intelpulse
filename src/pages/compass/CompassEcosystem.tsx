import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Network, LayoutGrid } from "lucide-react";
import { useTechnologyIntelligence } from "@/hooks/useTechnologyIntelligence";
import { signalStrength, strengthBand, fmtFunding, getQuadrant, QUADRANT_META } from "./lib";
import EcosystemRelationships from "./components/EcosystemRelationships";
import { cn } from "@/lib/utils";

export default function CompassEcosystem() {
  const { data: techs = [], isLoading } = useTechnologyIntelligence();
  const [mode, setMode] = useState<"map" | "list">("map");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return techs;
    return techs.filter((t) => t.name.toLowerCase().includes(q));
  }, [techs, query]);

  // Group by domainName for the map view
  const domains = useMemo(() => {
    const map = new Map<string, typeof techs>();
    filtered.forEach((t) => {
      const d = t.domainName || "Other";
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(t);
    });
    return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
  }, [filtered]);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Catalog & Ecosystem</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Ecosystem</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          See how technologies connect, or switch to the list to scan signal strength and momentum.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full border border-border bg-card p-1">
          <button onClick={() => setMode("map")} aria-pressed={mode === "map"}
            className={cn("inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              mode === "map" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>
            <Network className="h-3.5 w-3.5" /> Ecosystem map
          </button>
          <button onClick={() => setMode("list")} aria-pressed={mode === "list"}
            className={cn("inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              mode === "list" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>
            <LayoutGrid className="h-3.5 w-3.5" /> Technology list
          </button>
        </div>
        <div className="relative ml-auto w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search technology…"
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none" />
        </div>
      </div>

      {isLoading ? (
        <div className="h-72 animate-pulse rounded-2xl border border-border bg-card" />
      ) : mode === "map" ? (
        <div className="space-y-8">
          {domains.map((d) => (
            <section key={d.name}>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-sm font-semibold">{d.name}</h2>
                <span className="text-[11px] text-muted-foreground">{d.items.length} technologies</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {d.items.map((t) => {
                  const s = signalStrength(t);
                  const band = strengthBand(s);
                  const q = getQuadrant(t);
                  return (
                    <Link key={t.id} to={`/technology/${t.keyword || t.id}`}
                      className={cn(
                        "group inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs transition-all hover:border-primary/40 hover:shadow-sm",
                        q ? QUADRANT_META[q].ring : "border-border"
                      )}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", band.bar)} />
                      <span className="font-medium">{t.name}</span>
                      <span className="tabular-nums text-muted-foreground">{s}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
            const s = signalStrength(t);
            const band = strengthBand(s);
            const q = getQuadrant(t);
            const meta = q ? QUADRANT_META[q] : null;
            return (
              <Link key={t.id} to={`/technology/${t.keyword || t.id}`}
                className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">{t.domainName || "—"}</p>
                    <h3 className="mt-0.5 truncate text-sm font-semibold">{t.name}</h3>
                  </div>
                  {meta && (
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", meta.bg, meta.text)}>
                      {meta.label}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-semibold tabular-nums">{s}</span>
                    <span className="text-[11px] text-muted-foreground">/100</span>
                  </div>
                  <span className={cn("text-[11px]", band.color)}>{band.label}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-[11px]">
                  <div><div className="font-semibold tabular-nums">{t.dealroomCompanyCount}</div><div className="text-muted-foreground text-[9.5px] uppercase tracking-wider">Cos</div></div>
                  <div><div className="font-semibold tabular-nums">{fmtFunding(t.totalFundingEur)}</div><div className="text-muted-foreground text-[9.5px] uppercase tracking-wider">Funding</div></div>
                  <div><div className="font-semibold tabular-nums">{t.totalPatents.toLocaleString()}</div><div className="text-muted-foreground text-[9.5px] uppercase tracking-wider">Patents</div></div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
