import { TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Technology, formatFunding } from "@/data/technologies";
import { cn } from "@/lib/utils";

interface TechnologyCardProps {
  technology: Technology;
  onClick?: () => void;
  compact?: boolean;
}

const quadrantColors: Record<string, string> = {
  Cloud: "bg-primary/10 text-primary border-primary/20",
  Edge: "bg-primary/10 text-primary border-primary/20",
  IoT: "bg-success/10 text-success border-success/20",
  "AI/ML": "bg-warning/10 text-warning border-warning/20",
};

const ringColors: Record<string, string> = {
  Adopt: "bg-success/10 text-success border-success/20",
  Trial: "bg-primary/10 text-primary border-primary/20",
  Assess: "bg-warning/10 text-warning border-warning/20",
  Hold: "bg-destructive/10 text-destructive border-destructive/20",
};

export function TechnologyCard({ technology, onClick, compact = false }: TechnologyCardProps) {
  const TrendIcon = technology.trend === "up" ? TrendingUp : technology.trend === "down" ? TrendingDown : Minus;
  const trendColor = technology.trend === "up" ? "text-success" : technology.trend === "down" ? "text-destructive" : "text-muted-foreground";

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-all cursor-pointer group",
          onClick && "hover:bg-muted/50"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col min-w-0">
            <span className="font-medium truncate text-foreground">{technology.name}</span>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className={cn("text-xs", quadrantColors[technology.quadrant])}>
                {technology.quadrant}
              </Badge>
              <Badge variant="outline" className={cn("text-xs", ringColors[technology.ring])}>
                {technology.ring}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xl font-bold font-mono text-foreground">{technology.compositeScore.toFixed(1)}</p>
            <TrendIcon className={cn("h-3 w-3 ml-auto", trendColor)} />
          </div>
          {onClick && <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-all cursor-pointer group",
        onClick && "hover:bg-muted/50 hover:shadow-subtle"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate group-hover:text-primary transition-colors text-foreground">{technology.name}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{technology.description}</p>
        </div>
        <div className="text-right ml-4 shrink-0">
          <p className="text-2xl font-bold font-mono text-foreground">{technology.compositeScore.toFixed(1)}</p>
          <div className="flex items-center gap-1 justify-end">
            <TrendIcon className={cn("h-3 w-3", trendColor)} />
            <span className={cn("text-xs", trendColor)}>
              {technology.trend === "up" ? "Rising" : technology.trend === "down" ? "Declining" : "Stable"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <Badge variant="outline" className={cn(quadrantColors[technology.quadrant])}>
          {technology.quadrant}
        </Badge>
        <Badge variant="outline" className={cn(ringColors[technology.ring])}>
          {technology.ring}
        </Badge>
        <Badge variant="outline" className="text-muted-foreground">
          TRL {technology.trl}
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div className="p-2 rounded bg-muted/50">
          <p className="font-mono font-semibold text-foreground">{technology.trl}</p>
          <p className="text-muted-foreground">TRL</p>
        </div>
        <div className="p-2 rounded bg-muted/50">
          <p className="font-mono font-semibold text-foreground">{technology.marketScore.toFixed(1)}</p>
          <p className="text-muted-foreground">Market</p>
        </div>
        <div className="p-2 rounded bg-muted/50">
          <p className="font-mono font-semibold text-foreground">{technology.innovationScore.toFixed(1)}</p>
          <p className="text-muted-foreground">Innovation</p>
        </div>
        <div className="p-2 rounded bg-muted/50">
          <p className="font-mono font-semibold text-foreground">{technology.euAlignmentScore.toFixed(1)}</p>
          <p className="text-muted-foreground">EU</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>{technology.patents.toLocaleString()} patents</span>
        <span>{formatFunding(technology.fundingEur)} funding</span>
      </div>
    </div>
  );
}