import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Newspaper, FileText, BookOpen, TrendingUp, TrendingDown, Search, ChevronDown } from "lucide-react";
import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useTechnologyIntelligence, type TechnologyIntelligence } from "@/hooks/useTechnologyIntelligence";
import { useResearchSignals, type ResearchSignal } from "@/hooks/useResearchSignals";
import { useSignalLineage } from "@/hooks/useSignalLineage";
import { SignalLineageTimeline } from "@/components/intelligence/SignalLineageTimeline";

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

const HORIZONS = [
  {
    id: "h1",
    label: "H1 — Now",
    subtitle: "0–6 months",
    icon: Newspaper,
    color: "from-amber-500/20 to-amber-500/5",
    border: "border-amber-500/30",
    badge: "bg-amber-500/10 text-amber-600",
    description: "News mentions, media visibility, market response",
  },
  {
    id: "h2",
    label: "H2 — Emerging",
    subtitle: "1–3 years",
    icon: FileText,
    color: "from-blue-500/20 to-blue-500/5",
    border: "border-blue-500/30",
    badge: "bg-blue-500/10 text-blue-600",
    description: "Patents filed, venture investment, company formation",
  },
  {
    id: "h3",
    label: "H3 — Vision",
    subtitle: "3–10 years",
    icon: BookOpen,
    color: "from-violet-500/20 to-violet-500/5",
    border: "border-violet-500/30",
    badge: "bg-violet-500/10 text-violet-600",
    description: "Academic research intensity, growth trends",
  },
];

interface HorizonTech {
  name: string;
  keywordId: string;
  h1Score: number;
  h1Value: string;
  h2Score: number;
  h2Value: string;
  h3Score: number;
  h3Value: string;
  h3Growth: number;
  dominantHorizon: "h1" | "h2" | "h3";
}

export default function HorizonsPage() {
  const [search, setSearch] = useState("");
  const [expandedKeywordId, setExpandedKeywordId] = useState<string | null>(null);
  const { data: technologies, isLoading: techLoading } = useTechnologyIntelligence();
  const { data: researchSignals, isLoading: researchLoading } = useResearchSignals();

  const isLoading = techLoading || researchLoading;

  // Merge technology and research data
  const horizonData = useMemo(() => {
    if (!technologies) return [];
    const researchMap = new Map<string, ResearchSignal>();
    researchSignals?.forEach(s => researchMap.set(s.keywordId, s));

    return technologies
      .map((tech): HorizonTech => {
        const rs = researchMap.get(tech.keywordId);

        const h1Score = tech.visibilityScore ?? 0;
        const h1Value = `${tech.documentMentionCount + (tech.newsMentionCount ?? 0)} mentions`;

        const h2Score = Math.max(
          tech.investmentScore ?? 0,
          tech.totalPatents >= 100 ? 2 : tech.totalPatents >= 20 ? 1 : 0
        );
        const h2Value = `${fmt(tech.totalFundingEur)}€ · ${fmt(tech.totalPatents)} patents`;

        const h3Score = rs?.researchScore ?? 0;
        const h3Value = rs ? `${fmt(rs.worksLast5y)} papers` : "—";
        const h3Growth = rs?.growthRateYoy ?? 0;

        // Dominant horizon = highest score; tie-break: H3 > H2 > H1 (longer-term wins)
        const scores = { h1: h1Score, h2: h2Score, h3: h3Score };
        const dominant = (
          h3Score >= h2Score && h3Score >= h1Score ? "h3" :
          h2Score >= h1Score ? "h2" : "h1"
        ) as "h1" | "h2" | "h3";

        return { name: tech.name, keywordId: tech.keywordId, h1Score, h1Value, h2Score, h2Value, h3Score, h3Value, h3Growth, dominantHorizon: dominant };
      })
      .filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const aTotal = a.h1Score + a.h2Score + a.h3Score;
        const bTotal = b.h1Score + b.h2Score + b.h3Score;
        return bTotal - aTotal;
      });
  }, [technologies, researchSignals, search]);

  // Horizon summaries
  const horizonSummaries = useMemo(() => {
    if (!horizonData.length) return { h1: 0, h2: 0, h3: 0 };
    return {
      h1: horizonData.filter(t => t.dominantHorizon === "h1").length,
      h2: horizonData.filter(t => t.dominantHorizon === "h2").length,
      h3: horizonData.filter(t => t.dominantHorizon === "h3").length,
    };
  }, [horizonData]);

  const scoreColor = (score: number) => {
    if (score === 2) return "bg-emerald-500";
    if (score === 1) return "bg-amber-500";
    return "bg-muted-foreground/30";
  };

  const scoreLabel = (score: number) => {
    if (score === 2) return "Strong";
    if (score === 1) return "Moderate";
    return "Emerging";
  };

  return (
    <div className="min-h-screen bg-background">
      <PlatformHeader />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Technology Horizons</h1>
          <p className="text-muted-foreground max-w-2xl">
            Three-horizon framework mapping technology maturity across time. H1 tracks current market signals, 
            H2 captures emerging IP and investment, and H3 reveals long-term research trajectories.
          </p>
        </div>

        {/* Horizon Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {HORIZONS.map((h, i) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={cn("relative overflow-hidden", h.border)}>
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", h.color)} />
                <CardContent className="relative pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn("p-2.5 rounded-xl", h.badge)}>
                      <h.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{h.label}</h3>
                      <p className="text-xs text-muted-foreground">{h.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{h.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">
                      {h.id === "h1" ? horizonSummaries.h1 : h.id === "h2" ? horizonSummaries.h2 : horizonSummaries.h3}
                    </span>
                    <span className="text-sm text-muted-foreground">technologies dominant</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search technologies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Horizon Grid */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-muted-foreground font-medium">Technology</th>
                      <th className="text-center p-4 text-muted-foreground font-medium">
                        <div className="flex items-center justify-center gap-1">
                          <Newspaper className="h-3.5 w-3.5 text-amber-500" />
                          H1 — Now
                        </div>
                      </th>
                      <th className="text-center p-4 text-muted-foreground font-medium">
                        <div className="flex items-center justify-center gap-1">
                          <FileText className="h-3.5 w-3.5 text-blue-500" />
                          H2 — Emerging
                        </div>
                      </th>
                      <th className="text-center p-4 text-muted-foreground font-medium">
                        <div className="flex items-center justify-center gap-1">
                          <BookOpen className="h-3.5 w-3.5 text-violet-500" />
                          H3 — Vision
                        </div>
                      </th>
                      <th className="text-center p-4 text-muted-foreground font-medium">Growth</th>
                      <th className="text-center p-4 text-muted-foreground font-medium">Dominant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {horizonData.map((tech, idx) => {
                      const isExpanded = expandedKeywordId === tech.keywordId;
                      return (
                        <React.Fragment key={tech.keywordId}>
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.02 }}
                            className={cn(
                              "border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer",
                              isExpanded && "bg-muted/20"
                            )}
                            onClick={() => setExpandedKeywordId(isExpanded ? null : tech.keywordId)}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
                                <span className="font-medium text-foreground">{tech.name}</span>
                              </div>
                            </td>
                            {/* H1 */}
                            <td className="p-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex gap-0.5">
                                  {[0, 1].map(i => (
                                    <div key={i} className={cn("h-2 w-5 rounded-full", i < tech.h1Score ? "bg-amber-500" : "bg-muted")} />
                                  ))}
                                </div>
                                <span className="text-[10px] text-muted-foreground">{tech.h1Value}</span>
                              </div>
                            </td>
                            {/* H2 */}
                            <td className="p-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex gap-0.5">
                                  {[0, 1].map(i => (
                                    <div key={i} className={cn("h-2 w-5 rounded-full", i < tech.h2Score ? "bg-blue-500" : "bg-muted")} />
                                  ))}
                                </div>
                                <span className="text-[10px] text-muted-foreground">{tech.h2Value}</span>
                              </div>
                            </td>
                            {/* H3 */}
                            <td className="p-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex gap-0.5">
                                  {[0, 1].map(i => (
                                    <div key={i} className={cn("h-2 w-5 rounded-full", i < tech.h3Score ? "bg-violet-500" : "bg-muted")} />
                                  ))}
                                </div>
                                <span className="text-[10px] text-muted-foreground">{tech.h3Value}</span>
                              </div>
                            </td>
                            {/* Growth */}
                            <td className="p-4 text-center">
                              {tech.h3Growth !== 0 ? (
                                <span className={cn(
                                  "inline-flex items-center gap-0.5 text-xs font-medium",
                                  tech.h3Growth >= 0 ? "text-emerald-500" : "text-red-500"
                                )}>
                                  {tech.h3Growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                  {Math.abs(tech.h3Growth).toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                            {/* Dominant */}
                            <td className="p-4 text-center">
                              <Badge variant="outline" className={cn("text-[10px]",
                                tech.dominantHorizon === "h1" ? "text-amber-500 border-amber-500/40" :
                                tech.dominantHorizon === "h2" ? "text-blue-500 border-blue-500/40" :
                                "text-violet-500 border-violet-500/40"
                              )}>
                                {tech.dominantHorizon === "h1" ? "Now" : tech.dominantHorizon === "h2" ? "Emerging" : "Vision"}
                              </Badge>
                            </td>
                          </motion.tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={6} className="p-0">
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="px-4 py-4 bg-muted/10 border-b border-border"
                                >
                                  <ExpandedLineage keywordId={tech.keywordId} />
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <div className="mt-6 flex items-center gap-6 text-xs text-muted-foreground">
          <span className="font-medium">Signal Strength:</span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-5 rounded-full bg-muted inline-block" /> Emerging (0)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-5 rounded-full bg-amber-500 inline-block" /> Moderate (1)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="flex gap-0.5"><span className="h-2 w-5 rounded-full bg-emerald-500 inline-block" /><span className="h-2 w-5 rounded-full bg-emerald-500 inline-block" /></span> Strong (2)
          </span>
          <span className="ml-4 font-medium">Click a row to expand signal lineage</span>
        </div>
      </div>
    </div>
  );
}

function ExpandedLineage({ keywordId }: { keywordId: string }) {
  const { data: links, isLoading } = useSignalLineage(keywordId);
  return <SignalLineageTimeline links={links || []} isLoading={isLoading} />;
}
