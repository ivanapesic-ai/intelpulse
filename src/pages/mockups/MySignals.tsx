import { useMemo, useState } from "react";
import { Eye, TrendingUp, TrendingDown, Minus, Activity, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { WatchToggle } from "@/components/intelligence/WatchToggle";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useSignalSnapshots, computeDeltas, type SignalDelta } from "@/hooks/useSignalSnapshots";
import { useTechnologyIntelligence, type TechnologyIntelligence } from "@/hooks/useTechnologyIntelligence";
import { cn } from "@/lib/utils";

function DeltaBadge({ value, suffix = "" }: { value: number | null; suffix?: string }) {
  if (value === null || value === 0) return null;
  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-mono gap-1",
        isPositive ? "border-emerald-500/30 text-emerald-600" : "border-red-500/30 text-red-500"
      )}
    >
      <Icon className="h-3 w-3" />
      {isPositive ? "+" : ""}{value}{suffix}
    </Badge>
  );
}

function SignalCard({
  tech,
  delta,
}: {
  tech: TechnologyIntelligence;
  delta: SignalDelta | undefined;
}) {
  const d = delta?.deltas;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="card-hover">
        <CardHeader className="pb-3 flex flex-row items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate text-foreground">{tech.name}</CardTitle>
            <CardDescription className="text-xs mt-1">
              Composite: {tech.compositeScore?.toFixed(2) ?? "–"}
              {d?.composite !== null && d?.composite !== undefined && (
                <span className={cn("ml-2", d.composite > 0 ? "text-emerald-600" : "text-red-500")}>
                  ({d.composite > 0 ? "+" : ""}{d.composite.toFixed(2)})
                </span>
              )}
            </CardDescription>
          </div>
          <WatchToggle keywordId={tech.keywordId} />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Companies</p>
              <p className="text-lg font-semibold text-foreground">{tech.dealroomCompanyCount ?? 0}</p>
              <DeltaBadge value={d?.companies ?? null} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Patents</p>
              <p className="text-lg font-semibold text-foreground">{tech.totalPatents ?? 0}</p>
              <DeltaBadge value={d?.patents ?? null} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Funding</p>
              <p className="text-lg font-semibold text-foreground">
                {tech.totalFundingEur ? `€${(tech.totalFundingEur / 1e9).toFixed(1)}B` : "–"}
              </p>
              <DeltaBadge value={d?.funding ? Math.round(d.funding / 1e6) : null} suffix="M" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">News</p>
              <p className="text-lg font-semibold text-foreground">{tech.newsMentionCount ?? 0}</p>
              <DeltaBadge value={d?.news ?? null} />
            </div>
          </div>
          {/* Signal scores bar */}
          <div className="mt-4 flex gap-2">
            {[
              { label: "Investment", score: tech.investmentScore },
              { label: "Patents", score: tech.trlScore },
              { label: "Visibility", score: tech.visibilityScore },
            ].map((s) => (
              <div key={s.label} className="flex-1">
                <p className="text-[10px] text-muted-foreground mb-1">{s.label}</p>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${((s.score ?? 0) / 2) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function MySignals() {
  const { watchedKeywordIds, isLoading: watchLoading } = useWatchlist();
  const { data: technologies, isLoading: techLoading } = useTechnologyIntelligence();
  const { data: snapshots, isLoading: snapLoading } = useSignalSnapshots(watchedKeywordIds, 6);

  const isLoading = watchLoading || techLoading;

  const watchedTechs = useMemo(() => {
    if (!technologies) return [];
    return technologies.filter((t) => watchedKeywordIds.includes(t.keywordId));
  }, [technologies, watchedKeywordIds]);

  const deltas = useMemo(() => {
    if (!snapshots) return [];
    return computeDeltas(snapshots, watchedKeywordIds);
  }, [snapshots, watchedKeywordIds]);

  return (
    <div className="min-h-screen bg-background">
      <PlatformHeader />
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Eye className="h-8 w-8 text-primary" />
                My Signals
              </h1>
              <p className="text-muted-foreground mt-2 max-w-xl">
                Your personalised watchlist of technology keywords with quarterly signal tracking.
                Deltas show changes since the previous snapshot.
              </p>
            </div>
            <Link to="/intelligence">
              <Button variant="outline" className="gap-2">
                Intelligence Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-52" />
            ))}
          </div>
        ) : watchedTechs.length === 0 ? (
          <Card className="py-16">
            <CardContent className="text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No keywords watched yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Head to the Intelligence Dashboard and click the eye icon on any technology to start tracking its signals.
              </p>
              <Link to="/intelligence">
                <Button className="gap-2">
                  <Activity className="h-4 w-4" />
                  Go to Intelligence Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {watchedTechs.map((tech) => (
              <SignalCard
                key={tech.id}
                tech={tech}
                delta={deltas.find((d) => d.keywordId === tech.keywordId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
