import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type DomainId = "sdv" | "quantum" | "energy" | "defence";

export interface DomainMeta {
  id: DomainId;
  name: string;
  short: string;
  tagline: string;
  accent: string;
  populated: boolean;
}

export const DOMAINS: DomainMeta[] = [
  { id: "sdv",     name: "SDV & Mobility", short: "SDV",     tagline: "Software-defined vehicles, energy and autonomy", accent: "hsl(214 100% 49%)", populated: true },
  { id: "quantum", name: "Quantum",        short: "Quantum", tagline: "Quantum compute, sensing and communications",   accent: "hsl(270 70% 55%)",  populated: false },
  { id: "energy",  name: "Energy",         short: "Energy",  tagline: "Grid, storage and clean generation",            accent: "hsl(160 72% 40%)",  populated: false },
  { id: "defence", name: "Defence",        short: "Defence", tagline: "Defence systems and dual-use technologies",     accent: "hsl(220 12% 25%)",  populated: false },
];

const KEY = "n1signal:domain";

export function getDomain(): DomainId {
  try {
    const v = localStorage.getItem(KEY) as DomainId | null;
    if (v && DOMAINS.some((d) => d.id === v)) return v;
  } catch {}
  return "sdv";
}

export function setDomain(id: DomainId) {
  localStorage.setItem(KEY, id);
  window.dispatchEvent(new Event("n1:domain-changed"));
}

export function useDomain() {
  const [id, setId] = useState<DomainId>(() => getDomain());
  useEffect(() => {
    const h = () => setId(getDomain());
    window.addEventListener("n1:domain-changed", h);
    return () => window.removeEventListener("n1:domain-changed", h);
  }, []);
  const meta = DOMAINS.find((d) => d.id === id) ?? DOMAINS[0];
  return { id, meta, setDomain };
}

export default function DomainSelector() {
  const { id, meta } = useDomain();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-secondary/60"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: meta.accent }} />
        <span>{meta.short}</span>
        {!meta.populated && (
          <span className="rounded bg-secondary px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-muted-foreground">
            preview
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="listbox" className="absolute left-0 top-[calc(100%+6px)] z-50 w-72 overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
          <div className="border-b border-border px-3 py-2">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Switch domain</p>
          </div>
          <ul className="max-h-[360px] overflow-auto py-1">
            {DOMAINS.map((d) => {
              const active = d.id === id;
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => { setDomain(d.id); setOpen(false); }}
                    className={["flex w-full items-start gap-2.5 px-3 py-2 text-left text-[13px] transition-colors", active ? "bg-secondary/60" : "hover:bg-secondary/40"].join(" ")}
                  >
                    <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: d.accent }} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground">{d.name}</span>
                        {!d.populated && (
                          <span className="rounded bg-secondary px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                            preview
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] leading-snug text-muted-foreground">{d.tagline}</span>
                    </span>
                    {active && <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-foreground" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export function DomainPreviewBanner() {
  const { meta } = useDomain();
  if (meta.populated) return null;
  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10">
      <div className="mx-auto flex max-w-[1480px] items-center gap-2 px-6 py-1.5 text-[11.5px] text-amber-700 dark:text-amber-300">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: meta.accent }} />
        <span className="font-medium">{meta.name}</span>
        <span className="opacity-80">· preview domain — page structure shown with SDV data while this signal graph is populated.</span>
      </div>
    </div>
  );
}
