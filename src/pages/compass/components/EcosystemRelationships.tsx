import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Link2, X, Plus, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { DOMAINS, TECHS, RELATIONSHIPS, getTechById, getDomain, type DomainId } from "../data/technologies";
import { useTechnologyIntelligence } from "@/hooks/useTechnologyIntelligence";
import { loadWorkspace, toggleWorkspace } from "../lib";
import { cn } from "@/lib/utils";

export type RelType = "requires" | "enables" | "co-occurs" | "depends-on" | "interoperability";

const REL_META: Record<RelType, { label: string; color: string; bg: string; dashed?: boolean }> = {
  requires:          { label: "Requires",         color: "hsl(0 60% 45%)",   bg: "hsl(0 60% 45% / 0.12)" },
  enables:           { label: "Enables",          color: "hsl(140 55% 35%)", bg: "hsl(140 55% 35% / 0.12)" },
  "co-occurs":       { label: "Co-occurs",        color: "hsl(220 10% 50%)", bg: "hsl(220 10% 50% / 0.12)", dashed: true },
  "depends-on":      { label: "Depends on",       color: "hsl(32 70% 38%)",  bg: "hsl(32 70% 38% / 0.12)" },
  interoperability:  { label: "Interoperability", color: "hsl(210 75% 42%)", bg: "hsl(210 75% 42% / 0.12)", dashed: true },
};

const REL_TYPES = Object.keys(REL_META) as RelType[];

type DomainFilter = "all" | DomainId;

export default function EcosystemRelationships() {
  const [domain, setDomain] = useState<DomainFilter>("all");
  const [techFocus, setTechFocus] = useState<string>("all");
  const [activeTypes, setActiveTypes] = useState<Set<RelType>>(new Set(REL_TYPES));
  const [selected, setSelected] = useState<
    | { kind: "node"; id: string }
    | { kind: "edge"; id: string }
    | null
  >(null);

  const visibleTechs = useMemo(
    () => TECHS.filter((t) => domain === "all" || t.domain === domain),
    [domain]
  );
  const visibleTechIds = useMemo(() => new Set(visibleTechs.map((t) => t.id)), [visibleTechs]);
  const visibleRels = useMemo(
    () =>
      RELATIONSHIPS.filter(
        (r) =>
          activeTypes.has(r.type as RelType) &&
          visibleTechIds.has(r.source) &&
          visibleTechIds.has(r.target) &&
          (techFocus === "all" || r.source === techFocus || r.target === techFocus)
      ),
    [activeTypes, visibleTechIds, techFocus]
  );

  // Circular layout
  const W = 720, H = 460, cx = W / 2, cy = H / 2, R = 180;
  const positions = useMemo(() => {
    const n = visibleTechs.length || 1;
    const map = new Map<string, { x: number; y: number }>();
    visibleTechs.forEach((t, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      map.set(t.id, { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R });
    });
    return map;
  }, [visibleTechs]);

  function toggleType(t: RelType) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) { if (next.size > 1) next.delete(t); }
      else next.add(t);
      return next;
    });
  }

  const selectedNode = selected?.kind === "node" ? getTechById(selected.id) : null;
  const selectedEdge = selected?.kind === "edge" ? RELATIONSHIPS.find((r) => r.id === selected.id) : null;
  const focusedNodeId = selected?.kind === "node" ? selected.id : techFocus !== "all" ? techFocus : null;

  return (
    <section>
      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <FilterRow label="Domain">
          <FilterChip active={domain === "all"} onClick={() => setDomain("all")}>All</FilterChip>
          {DOMAINS.map((d) => (
            <FilterChip key={d.id} active={domain === d.id} onClick={() => setDomain(d.id)}>
              {d.short}
            </FilterChip>
          ))}
        </FilterRow>
        <FilterRow label="Tech focus">
          <FilterChip active={techFocus === "all"} onClick={() => setTechFocus("all")}>All</FilterChip>
          {visibleTechs.map((t) => (
            <FilterChip key={t.id} active={techFocus === t.id} onClick={() => setTechFocus(t.id)}>
              {t.shortName ?? t.name}
            </FilterChip>
          ))}
        </FilterRow>
        <FilterRow label="Relationship">
          {REL_TYPES.map((rt) => {
            const meta = REL_META[rt];
            const on = activeTypes.has(rt);
            return (
              <button
                key={rt}
                type="button"
                onClick={() => toggleType(rt)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors",
                  on ? "border-transparent" : "border-border bg-background text-muted-foreground hover:text-foreground"
                )}
                style={on ? { background: meta.bg, color: meta.color, borderColor: meta.color } : undefined}
              >
                <span
                  aria-hidden
                  className="inline-block h-2 w-3 rounded"
                  style={{
                    background: meta.dashed
                      ? `repeating-linear-gradient(90deg, ${meta.color} 0 3px, transparent 3px 6px)`
                      : meta.color,
                  }}
                />
                {meta.label}
              </button>
            );
          })}
        </FilterRow>
      </div>

      {/* Graph + inspector */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <div className="rounded-xl border border-border bg-card p-2">
          <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-auto">
            {visibleRels.map((r) => {
              const s = positions.get(r.source);
              const t = positions.get(r.target);
              if (!s || !t) return null;
              const meta = REL_META[r.type as RelType];
              const isSel = selected?.kind === "edge" && selected.id === r.id;
              const incident = focusedNodeId && (r.source === focusedNodeId || r.target === focusedNodeId);
              const dim = focusedNodeId ? !incident && !isSel : false;
              return (
                <g key={r.id} style={{ opacity: dim ? 0.18 : 1 }}>
                  <line
                    x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                    stroke="transparent" strokeWidth={14}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelected({ kind: "edge", id: r.id })}
                  />
                  <line
                    x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                    stroke={meta.color}
                    strokeWidth={isSel ? 2.5 : 1.4}
                    strokeDasharray={meta.dashed ? "4 4" : undefined}
                    pointerEvents="none"
                  />
                </g>
              );
            })}
            {visibleTechs.map((t) => {
              const p = positions.get(t.id)!;
              const isSel = selected?.kind === "node" && selected.id === t.id;
              const dim = focusedNodeId && focusedNodeId !== t.id
                ? !visibleRels.some((r) =>
                    (r.source === focusedNodeId && r.target === t.id) ||
                    (r.target === focusedNodeId && r.source === t.id))
                : false;
              return (
                <g
                  key={t.id}
                  style={{ cursor: "pointer", opacity: dim ? 0.3 : 1 }}
                  onClick={() => setSelected({ kind: "node", id: t.id })}
                >
                  <circle cx={p.x} cy={p.y} r={isSel ? 15 : 11}
                    fill="hsl(var(--background))" stroke={t.color}
                    strokeWidth={isSel ? 3 : 2}
                  />
                  <circle cx={p.x} cy={p.y} r={4} fill={t.color} />
                  <text
                    x={p.x}
                    y={p.y + (p.y > cy ? 28 : -18)}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight={isSel ? 600 : 500}
                    fill="hsl(var(--foreground))"
                    fontFamily="inherit"
                  >
                    {t.shortName ?? t.name}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="px-3 pb-2 text-[11px] text-muted-foreground">
            {visibleTechs.length} nodes · {visibleRels.length} relationships
          </p>
        </div>

        <aside className="rounded-xl border border-border bg-card p-4 min-h-[260px]">
          {!selected && (
            <div className="text-[13px] text-muted-foreground leading-relaxed">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Inspector</p>
              Select a <strong className="text-foreground">node</strong> to see the technology and its
              incident relationships, or click an <strong className="text-foreground">edge</strong> to
              inspect a single relationship.
            </div>
          )}
          {selectedNode && (
            <NodePanel
              techId={selectedNode.id}
              onClose={() => setSelected(null)}
              onPickEdge={(id) => setSelected({ kind: "edge", id })}
            />
          )}
          {selectedEdge && <EdgePanel rel={selectedEdge} onClose={() => setSelected(null)} />}
        </aside>
      </div>
    </section>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background text-foreground/80 hover:bg-secondary"
      )}
    >
      {children}
    </button>
  );
}

function NodePanel({ techId, onClose, onPickEdge }: { techId: string; onClose: () => void; onPickEdge: (id: string) => void }) {
  const tech = getTechById(techId)!;
  const domain = getDomain(tech.domain)!;
  const incident = RELATIONSHIPS.filter((r) => r.source === techId || r.target === techId);
  return (
    <div>
      <PanelHeader onClose={onClose} eyebrow={domain.short} />
      <div className="flex items-center gap-2 mb-2">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: tech.color }} />
        <h3 className="text-[15px] font-semibold">{tech.name}</h3>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Link
          to={`/compass/technology/${tech.id}`}
          className="inline-flex items-center gap-1 rounded-md bg-foreground px-2.5 py-1.5 text-[11.5px] font-medium text-background hover:opacity-90"
        >
          Open Deep Dive <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
        Incident relationships ({incident.length})
      </p>
      <ul className="flex flex-col gap-1.5">
        {incident.map((r) => {
          const other = r.source === techId ? r.target : r.source;
          const otherTech = getTechById(other);
          const meta = REL_META[r.type as RelType];
          const dir = r.source === techId ? "→" : "←";
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onPickEdge(r.id)}
                className="w-full text-left flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-2 py-1.5 hover:bg-secondary"
              >
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  {meta.label}
                </span>
                <span className="text-[12px] truncate">{dir} {otherTech?.shortName ?? otherTech?.name}</span>
              </button>
            </li>
          );
        })}
        {incident.length === 0 && (
          <li className="text-[12px] text-muted-foreground italic">No relationships defined.</li>
        )}
      </ul>
    </div>
  );
}

function EdgePanel({ rel, onClose }: { rel: typeof RELATIONSHIPS[number]; onClose: () => void }) {
  const meta = REL_META[rel.type as RelType];
  const s = getTechById(rel.source)!;
  const t = getTechById(rel.target)!;
  return (
    <div>
      <PanelHeader onClose={onClose} eyebrow="Relationship" />
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: meta.bg, color: meta.color }}>
          {meta.label}
        </span>
      </div>
      <div className="flex items-center gap-2 text-[14px] font-semibold">
        <Link to={`/compass/technology/${s.id}`} className="inline-flex items-center gap-1.5 rounded px-1 -mx-1 hover:bg-secondary">
          <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
          {s.shortName ?? s.name}
        </Link>
        <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
        <Link to={`/compass/technology/${t.id}`} className="inline-flex items-center gap-1.5 rounded px-1 -mx-1 hover:bg-secondary">
          <span className="h-2 w-2 rounded-sm" style={{ background: t.color }} />
          {t.shortName ?? t.name}
        </Link>
      </div>
      <p className="mt-3 text-[12.5px] text-muted-foreground leading-relaxed">{rel.note}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-border">
        <Link
          to={`/compass/technology/${s.id}`}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11.5px] font-medium hover:bg-secondary"
        >
          {s.shortName ?? s.name} Deep Dive <ArrowRight className="h-3 w-3" />
        </Link>
        <Link
          to={`/compass/technology/${t.id}`}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11.5px] font-medium hover:bg-secondary"
        >
          {t.shortName ?? t.name} Deep Dive <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function PanelHeader({ onClose, eyebrow }: { onClose: () => void; eyebrow: string }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{eyebrow}</p>
      <button
        type="button"
        onClick={onClose}
        className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        aria-label="Close"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
