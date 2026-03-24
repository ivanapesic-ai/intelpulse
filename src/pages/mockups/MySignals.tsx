import { useMemo, useState } from "react";
import { Eye, TrendingUp, TrendingDown, Activity, ArrowRight, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { WatchToggle } from "@/components/intelligence/WatchToggle";
import { NewsTimelineChart } from "@/components/intelligence/NewsTimelineChart";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useSignalSnapshots, computeDeltas, type SignalSnapshot, type SignalDelta } from "@/hooks/useSignalSnapshots";
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
        isPositive ? "border-emerald-500/30 text-emerald-500" : "border-red-500/30 text-red-500"
      )}
    >
      <Icon className="h-3 w-3" />
      {isPositive ? "+" : ""}{value}{suffix}
    </Badge>
  );
}

function buildChartData(snapshots: SignalSnapshot[]) {
  return snapshots.map((s) => ({
    date: new Date(s.snapshot_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    composite: Number(s.composite_score) || 0,
    companies: s.company_count || 0,
    patents: s.total_patents || 0,
    news: s.news_mention_count || 0,
  }));
}

function SignalHistoryChart({ snapshots }: { snapshots: SignalSnapshot[] }) {
  const data = useMemo(() => buildChartData(snapshots), [snapshots]);

  if (data.length < 2) {
    return (
      <p className="text-xs text-muted-foreground italic text-center py-4">
        Not enough snapshots yet — historical chart appears after 2+ data points.
      </p>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 'auto']} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line yAxisId="right" type="monotone" dataKey="composite" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Composite" />
          <Line yAxisId="left" type="monotone" dataKey="companies" stroke="hsl(var(--chart-2))" strokeWidth={1.5} dot={false} name="Companies" />
          <Line yAxisId="left" type="monotone" dataKey="patents" stroke="hsl(var(--chart-3))" strokeWidth={1.5} dot={false} name="Patents" />
          <Line yAxisId="left" type="monotone" dataKey="news" stroke="hsl(var(--chart-4))" strokeWidth={1.5} dot={false} name="News" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function SignalCard({
  tech,
  delta,
  snapshots,
}: {
  tech: TechnologyIntelligence;
  delta: SignalDelta | undefined;
  snapshots: SignalSnapshot[];
}) {
  const [expanded, setExpanded] = useState(true);
  const d = delta?.deltas;
  const keywordSnapshots = useMemo(
    () => snapshots.filter((s) => s.keyword_id === tech.keywordId).sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date)),
    [snapshots, tech.keywordId]
  );

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
          <div className="flex items-center gap-1">
            <WatchToggle keywordId={tech.keywordId} />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
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
              <p className="text-xs text-muted-foreground mb-1">Investment</p>
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

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
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

                {/* Historical signal chart */}
                <div className="mt-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Signal History</p>
                  <SignalHistoryChart snapshots={keywordSnapshots} />
                </div>

                {/* News timeline */}
                <div className="mt-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">News Activity (weekly)</p>
                  <NewsTimelineChart keywordId={tech.keywordId} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function MySignals() {
  const { watchedKeywordIds, isLoading: watchLoading } = useWatchlist();
  const { data: technologies, isLoading: techLoading } = useTechnologyIntelligence();
  const { data: snapshots, isLoading: snapLoading } = useSignalSnapshots(watchedKeywordIds, 12);

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
                Your personalised watchlist with historical signal tracking.
                Charts show how each technology's metrics evolve over time.
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
                snapshots={snapshots || []}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
