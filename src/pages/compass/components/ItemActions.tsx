import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Bookmark, Check, Plus, TrendingDown, TrendingUp, X } from "lucide-react";
import { useWatchlistItems, useWorkspace } from "../hooks/use-prototype-state";
import type { WorkspaceItem, WorkspaceItemKind } from "../lib/prototype-store";

type Size = "xs" | "sm" | "md";

const sizeBtn: Record<Size, string> = {
  xs: "h-6 px-1.5 text-[10.5px] gap-1",
  sm: "h-7 px-2 text-[11.5px] gap-1.5",
  md: "h-8 px-2.5 text-[12.5px] gap-1.5",
};
const sizeIcon: Record<Size, string> = {
  xs: "h-3 w-3", sm: "h-3.5 w-3.5", md: "h-4 w-4",
};

export function WatchlistButton({
  techId, size = "sm", label = false, className,
}: { techId: string; size?: Size; label?: boolean; className?: string }) {
  const { stanceOf, add, remove } = useWatchlistItems();
  const stance = stanceOf(techId);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const tone =
    stance === "bullish"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15"
      : stance === "bearish"
        ? "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/15"
        : "border-border bg-card text-muted-foreground hover:bg-secondary/60";

  return (
    <div ref={ref} className={["relative inline-block", className ?? ""].join(" ")}>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        aria-haspopup="menu"
        aria-expanded={open}
        title={stance ? `Already tracking · ${stance === "bullish" ? "Bullish" : "Bearish"}` : "Track in Watchlist"}
        className={["inline-flex items-center rounded-md border font-medium transition-colors", sizeBtn[size], tone].join(" ")}
      >
        <Bookmark className={[sizeIcon[size], stance ? "fill-current" : ""].join(" ")} />
        {label && <span>{stance === "bullish" ? "Bullish" : stance === "bearish" ? "Bearish" : "Watchlist"}</span>}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+6px)] z-50 w-44 overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
          <div className="border-b border-border px-3 py-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {stance ? "Watchlist stance" : "Add to watchlist"}
            </p>
          </div>
          <StanceRow label="Bullish" description="Expect signal to rise" active={stance === "bullish"} tone="positive"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); add(techId, "bullish"); toast.success("Added to Watchlist", { description: "Stance: Bullish" }); setOpen(false); }} />
          <StanceRow label="Bearish" description="Expect signal to fall" active={stance === "bearish"} tone="negative"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); add(techId, "bearish"); toast.success("Added to Watchlist", { description: "Stance: Bearish" }); setOpen(false); }} />
          {stance && (
            <button type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(techId); toast("Removed from Watchlist"); setOpen(false); }}
              className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-[12px] text-muted-foreground hover:bg-secondary/60">
              <X className="h-3.5 w-3.5" /> Remove from watchlist
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StanceRow({ label, description, active, tone, onClick }: {
  label: string; description: string; active: boolean; tone: "positive" | "negative"; onClick: (e: React.MouseEvent) => void;
}) {
  const Icon = tone === "positive" ? TrendingUp : TrendingDown;
  const color = tone === "positive" ? "text-emerald-500" : "text-rose-500";
  return (
    <button type="button" role="menuitemradio" aria-checked={active} onClick={onClick}
      className={["flex w-full items-start gap-2 px-3 py-2 text-left transition-colors", active ? "bg-secondary/50" : "hover:bg-secondary/40"].join(" ")}>
      <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${color}`} />
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-medium text-foreground">{label}</span>
        <span className="block text-[10.5px] leading-snug text-muted-foreground">{description}</span>
      </span>
      {active && <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-foreground" />}
    </button>
  );
}

const KIND_LABEL: Record<WorkspaceItemKind, string> = {
  technology: "technology", chart: "chart", insight: "insight", news: "news",
  standard: "standard", relationship: "relationship", import: "import",
};

export function WorkspaceButton({
  kind, refId, title, subtitle, techId, payload, size = "sm", label = false, className,
}: {
  kind: WorkspaceItemKind; refId: string; title: string; subtitle?: string; techId?: string;
  payload?: WorkspaceItem["payload"]; size?: Size; label?: boolean; className?: string;
}) {
  const { hasItem, add, remove } = useWorkspace();
  const id = `${kind}:${refId}`;
  const added = hasItem(kind, refId);

  return (
    <button type="button"
      onClick={(e) => {
        e.preventDefault(); e.stopPropagation();
        if (added) { remove(id); toast(`Removed ${KIND_LABEL[kind]} from Workspace`); }
        else { add({ kind, refId, title, subtitle, techId, payload }); toast.success("Added to Workspace", { description: `${title} · ready for report` }); }
      }}
      title={added ? "Added to Workspace" : `Add ${KIND_LABEL[kind]} to Workspace`}
      aria-pressed={added}
      className={[
        "inline-flex items-center rounded-md border font-medium transition-colors",
        sizeBtn[size],
        added ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15" : "border-border bg-card text-muted-foreground hover:bg-secondary/60",
        className ?? "",
      ].join(" ")}>
      {added ? <Check className={sizeIcon[size]} /> : <Plus className={sizeIcon[size]} />}
      {label && <span>{added ? "Added" : "Workspace"}</span>}
    </button>
  );
}

export function TechItemActions({ techId, techName, size = "sm", label = false, className }: {
  techId: string; techName: string; size?: Size; label?: boolean; className?: string;
}) {
  return (
    <div className={["inline-flex items-center gap-1.5", className ?? ""].join(" ")}>
      <WatchlistButton techId={techId} size={size} label={label} />
      <WorkspaceButton kind="technology" refId={techId} title={techName} techId={techId} size={size} label={label} />
    </div>
  );
}
