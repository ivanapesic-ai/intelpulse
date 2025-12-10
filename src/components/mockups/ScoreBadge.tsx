import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  variant?: "filled" | "outline";
}

export function ScoreBadge({ score, size = "md", showLabel = false, variant = "filled" }: ScoreBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30", fill: "bg-emerald-500" };
    if (score >= 6) return { bg: "bg-sky-500/20", text: "text-sky-400", border: "border-sky-500/30", fill: "bg-sky-500" };
    if (score >= 4) return { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30", fill: "bg-amber-500" };
    return { bg: "bg-rose-500/20", text: "text-rose-400", border: "border-rose-500/30", fill: "bg-rose-500" };
  };

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5 min-w-[32px]",
    md: "text-sm px-2 py-1 min-w-[40px]",
    lg: "text-lg px-3 py-1.5 min-w-[52px]",
  };

  const colors = getScoreColor(score);

  if (variant === "outline") {
    return (
      <div className={cn("inline-flex items-center gap-1 rounded border font-mono font-semibold text-center justify-center", sizeClasses[size], colors.bg, colors.text, colors.border)}>
        {score.toFixed(1)}
        {showLabel && <span className="text-xs font-normal opacity-70">/10</span>}
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-1 rounded font-mono font-semibold text-center justify-center text-white", sizeClasses[size], colors.fill)}>
      {score.toFixed(1)}
      {showLabel && <span className="text-xs font-normal opacity-80">/10</span>}
    </div>
  );
}
