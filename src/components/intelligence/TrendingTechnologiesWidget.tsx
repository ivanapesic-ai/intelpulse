import { TrendingUp, TrendingDown, Minus, Flame, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNewsTrends } from "@/hooks/useNewsTrends";
import { cn } from "@/lib/utils";

const directionConfig = {
  rising: { icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  falling: { icon: TrendingDown, color: "text-red-500", bg: "bg-red-500/10" },
  stable: { icon: Minus, color: "text-muted-foreground", bg: "bg-muted" },
};

export function TrendingTechnologiesWidget() {
  const { data: trends, isLoading } = useNewsTrends(7, 20);

  return (
    <Card className="card-hover">
      <CardHeader>
        <div>
          <CardTitle className="font-display flex items-center gap-2 text-foreground">
            <Flame className="h-5 w-5 text-orange-500" />
            News Momentum
          </CardTitle>
          <CardDescription>Technologies by mention frequency (7 days)</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[340px] overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)
        ) : trends && trends.length > 0 ? (
          trends.map((trend, i) => {
            const config = directionConfig[trend.trend_direction] || directionConfig.stable;
            const Icon = config.icon;
            return (
              <div
                key={trend.keyword_id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className={cn("p-1.5 rounded-md", config.bg)}>
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">{trend.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {trend.current_count} mentions this period • {trend.total_all_time} all-time
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {trend.trend_velocity !== 0 && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-mono",
                        trend.trend_direction === "rising" && "border-emerald-500/30 text-emerald-500",
                        trend.trend_direction === "falling" && "border-red-500/30 text-red-500"
                      )}
                    >
                      {trend.trend_velocity > 0 ? "+" : ""}
                      {trend.trend_velocity === 100 ? "NEW" : `${trend.trend_velocity}%`}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No news trend data yet. Fetch RSS feeds from Admin to populate.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
