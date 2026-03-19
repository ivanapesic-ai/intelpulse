import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus, ChevronRight, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Technology, formatFundingEur, getCompositeScoreLabel } from "@/types/database";
import { cn } from "@/lib/utils";
import { isCentralEcosystem } from "@/lib/taxonomy-filters";

type MaturityRing = "Strong" | "Moderate" | "Challenging";

function getMaturityRing(compositeScore: number): MaturityRing {
  if (compositeScore >= 1.5) return "Strong";
  if (compositeScore >= 0.5) return "Moderate";
  return "Challenging";
}

const ringColors: Record<MaturityRing, string> = {
  Strong: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Moderate: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Challenging: "bg-red-500/10 text-red-500 border-red-500/20",
};

interface TechnologyCardProps {
  technology: Technology & { keyword?: { keyword: string } };
  onClick?: () => void;
  compact?: boolean;
}

export function TechnologyCard({ technology, onClick, compact = false }: TechnologyCardProps) {
  const TrendIcon = technology.trend === "up" ? TrendingUp : technology.trend === "down" ? TrendingDown : Minus;
  const trendColor = technology.trend === "up" ? "text-success" : technology.trend === "down" ? "text-destructive" : "text-muted-foreground";
  const maturityRing = getMaturityRing(technology.compositeScore || 0);
  const { color: scoreColor } = getCompositeScoreLabel(technology.compositeScore || 0);
  const isHub = isCentralEcosystem(technology.name);

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer group",
          isHub 
            ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30 ring-1 ring-primary/20" 
            : "bg-card border-border hover:border-primary/30",
          onClick && "hover:bg-muted/50"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          {isHub && <Star className="h-4 w-4 text-primary fill-primary/30 shrink-0" />}
          <div className="flex flex-col min-w-0">
            <Link to={`/technology/${technology.keyword?.keyword || technology.name.toLowerCase().replace(/\s+/g, '_')}`} className="font-medium truncate text-foreground hover:text-primary transition-colors" onClick={e => e.stopPropagation()}>{technology.name}</Link>
            <div className="flex gap-2 mt-1">
              {isHub && (
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                  Hub
                </Badge>
              )}
              <Badge variant="outline" className={cn("text-xs", ringColors[maturityRing])}>
                {maturityRing}
              </Badge>
              {technology.dealroomCompanyCount > 0 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  {technology.dealroomCompanyCount} tracked
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className={cn("text-xl font-bold font-mono", scoreColor)}>{(technology.compositeScore || 0).toFixed(2)}</p>
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
        "p-4 rounded-lg border transition-all cursor-pointer group",
        isHub 
          ? "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/30 ring-1 ring-primary/20" 
          : "bg-card border-border hover:border-primary/30",
        onClick && "hover:bg-muted/50 hover:shadow-subtle"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isHub && <Star className="h-4 w-4 text-primary fill-primary/30 shrink-0" />}
            <Link to={`/technology/${technology.keyword?.keyword || technology.name.toLowerCase().replace(/\s+/g, '_')}`} className="font-semibold truncate group-hover:text-primary transition-colors text-foreground" onClick={e => e.stopPropagation()}>{technology.name}</Link>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{technology.description}</p>
        </div>
        <div className="text-right ml-4 shrink-0">
          <p className={cn("text-2xl font-bold font-mono", scoreColor)}>{(technology.compositeScore || 0).toFixed(2)}</p>
          <div className="flex items-center gap-1 justify-end">
            <TrendIcon className={cn("h-3 w-3", trendColor)} />
            <span className={cn("text-xs", trendColor)}>
              {technology.trend === "up" ? "Rising" : technology.trend === "down" ? "Declining" : "Stable"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        {isHub && (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            Hub
          </Badge>
        )}
        <Badge variant="outline" className={cn(ringColors[maturityRing])}>
          {maturityRing}
        </Badge>
        {technology.avgTrlMentioned && (
          <Badge variant="outline" className="text-muted-foreground">
            TRL {technology.avgTrlMentioned.toFixed(1)}
          </Badge>
        )}
        {technology.dealroomCompanyCount > 0 && (
          <Badge variant="outline" className="text-muted-foreground">
            {technology.dealroomCompanyCount} tracked
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div className="p-2 rounded bg-muted/50">
          <p className="font-mono font-semibold text-foreground">{(technology.investmentScore || 0).toFixed(1)}</p>
          <p className="text-muted-foreground">Investment</p>
        </div>
        <div className="p-2 rounded bg-muted/50">
          <p className="font-mono font-semibold text-foreground">{(technology.employeesScore || 0).toFixed(1)}</p>
          <p className="text-muted-foreground">Employees</p>
        </div>
        <div className="p-2 rounded bg-muted/50">
          <p className="font-mono font-semibold text-foreground">{(technology.trlScore || 0).toFixed(1)}</p>
          <p className="text-muted-foreground">TRL</p>
        </div>
        <div className="p-2 rounded bg-muted/50">
          <p className="font-mono font-semibold text-foreground">{(technology.euAlignmentScore || 0).toFixed(1)}</p>
          <p className="text-muted-foreground">EU</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>{(technology.totalPatents || 0).toLocaleString()} patents</span>
        <span>{formatFundingEur(technology.totalFundingEur || 0)} funding</span>
      </div>
    </div>
  );
}