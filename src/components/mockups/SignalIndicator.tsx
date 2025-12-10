import { cn } from "@/lib/utils";
import { TrendingUp, FileText, Newspaper } from "lucide-react";

interface SignalIndicatorProps {
  signals: {
    investment: number;
    patents: number;
    media: number;
  };
  showLabels?: boolean;
  size?: "sm" | "md" | "lg";
}

export function SignalIndicator({ signals, showLabels = false, size = "md" }: SignalIndicatorProps) {
  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const getColor = (value: number) => {
    if (value >= 80) return "bg-emerald-500";
    if (value >= 60) return "bg-sky-500";
    if (value >= 40) return "bg-amber-500";
    return "bg-rose-500";
  };

  const signalData = [
    { key: "investment", label: "Investment", value: signals.investment, icon: TrendingUp },
    { key: "patents", label: "Patents", value: signals.patents, icon: FileText },
    { key: "media", label: "Media", value: signals.media, icon: Newspaper },
  ];

  return (
    <div className="space-y-2">
      {signalData.map((signal) => (
        <div key={signal.key} className="flex items-center gap-2">
          {showLabels && (
            <div className="flex items-center gap-1.5 w-24 shrink-0">
              <signal.icon className={cn(iconSizes[size], "text-muted-foreground")} />
              <span className="text-xs text-muted-foreground">{signal.label}</span>
            </div>
          )}
          <div className="flex-1 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(sizeClasses[size], "rounded-full transition-all", getColor(signal.value))}
              style={{ width: `${signal.value}%` }}
            />
          </div>
          {showLabels && <span className="text-xs font-mono w-8 text-right">{signal.value}</span>}
        </div>
      ))}
    </div>
  );
}
