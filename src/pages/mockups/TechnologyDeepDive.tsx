import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, TrendingUp, Users, FileText, Eye, Cpu, Newspaper, Shield, Microscope, Building2, Globe, ExternalLink, Loader2, AlertTriangle, Lightbulb, EyeIcon, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { SignalBreakdown } from "@/components/intelligence/SignalBreakdown";
import { StandardsSection } from "@/components/intelligence/StandardsSection";
import { MarketIntelligence } from "@/components/mockups/MarketIntelligence";
import { useTechnologyBySlug } from "@/hooks/useTechnologyBySlug";
import { useCompaniesForTechnology } from "@/hooks/useCompaniesForTechnology";
import { useResearchSignalForKeyword } from "@/hooks/useResearchSignals";
import { useNewsForKeyword } from "@/hooks/useNews";
import { useEpoKeywordSearch } from "@/hooks/useEpoPatents";
import { useSignalLineage } from "@/hooks/useSignalLineage";
import { SignalLineageTimeline } from "@/components/intelligence/SignalLineageTimeline";
import { useCooccurrences } from "@/hooks/useCooccurrences";
import { useWatchlist, useToggleWatch } from "@/hooks/useWatchlist";
import { formatFundingEur, formatFundingUsd, formatNumber } from "@/types/database";
import { cn } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────

function scoreBadgeColor(score: number) {
  if (score >= 1.5) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (score >= 0.5) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  return "bg-red-500/20 text-red-400 border-red-500/30";
}

function scoreLabel(score: number) {
  if (score >= 1.5) return "Strong";
  if (score >= 0.5) return "Moderate";
  return "Challenging";
}

type RegionFilter = "all" | "eu" | "us" | "china";

function classifyRegion(country: string | undefined): "EU" | "US" | "China" | "Other" {
  if (!country) return "Other";
  const eu = ["Germany","France","Netherlands","Belgium","Spain","Italy","Sweden","Finland","Denmark","Ireland","Austria","Poland","Portugal","Czech Republic","Czechia","Hungary","Romania","Bulgaria","Greece","Slovakia","Croatia","Slovenia","Lithuania","Latvia","Estonia","Luxembourg","Malta","Cyprus","Norway","Switzerland"];
  if (eu.includes(country)) return "EU";
  if (country === "United States") return "US";
  if (country === "China") return "China";
  return "Other";
}

// C-O label configs
const CHALLENGE_LABELS: Record<number, { label: string; color: string; description: string }> = {
  0: { label: "High Barriers", color: "border-red-500/50 bg-red-500/10", description: "Significant adoption challenges" },
  1: { label: "Moderate Barriers", color: "border-amber-500/50 bg-amber-500/10", description: "Some challenges to overcome" },
  2: { label: "Few Barriers", color: "border-emerald-500/50 bg-emerald-500/10", description: "Ready for adoption" },
};

const OPPORTUNITY_LABELS: Record<number, { label: string; color: string; description: string }> = {
  0: { label: "Limited Opportunity", color: "border-red-500/50 bg-red-500/10", description: "Niche or saturated market" },
  1: { label: "Moderate Opportunity", color: "border-amber-500/50 bg-amber-500/10", description: "Growing market potential" },
  2: { label: "High Opportunity", color: "border-emerald-500/50 bg-emerald-500/10", description: "Strong market potential" },
};

// ── Score Card ──────────────────────────────────────────

function ScoreCard({ label, score, raw, icon: Icon }: { label: string; score: number; raw: string; icon: React.ElementType }) {
  const color = score >= 1.5 ? "text-emerald-400" : score >= 0.5 ? "text-amber-400" : "text-red-400";
  const bg = score >= 1.5 ? "border-emerald-500/20" : score >= 0.5 ? "border-amber-500/20" : "border-red-500/20";
  return (
    <Card className={cn("border", bg)}>
      <CardContent className="p-4 text-center">
        <Icon className={cn("h-5 w-5 mx-auto mb-2", color)} />
        <p className={cn("text-2xl font-bold font-mono", color)}>{score}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
        <p className="text-sm font-medium text-foreground mt-1">{raw}</p>
      </CardContent>
    </Card>
  );
}

// ── TRL Distribution Bars ────────────────────────────────

function TrlBars({ dist }: { dist: { low: number; mid: number; high: number; unknown: number } }) {
  const total = dist.low + dist.mid + dist.high + dist.unknown || 1;
  const items = [
    { label: "TRL 1-3 (Low)", count: dist.low, color: "bg-red-500" },
    { label: "TRL 4-6 (Mid)", count: dist.mid, color: "bg-amber-500" },
    { label: "TRL 7-9 (High)", count: dist.high, color: "bg-emerald-500" },
    { label: "Unknown", count: dist.unknown, color: "bg-muted-foreground/40" },
  ];
  return (
    <div className="space-y-2">
      {items.map(i => (
        <div key={i.label} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-28 shrink-0">{i.label}</span>
          <div className="flex-1 h-4 rounded bg-muted overflow-hidden">
            <div className={cn("h-full rounded", i.color)} style={{ width: `${(i.count / total) * 100}%` }} />
          </div>
          <span className="text-xs font-mono text-foreground w-8 text-right">{i.count}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────

export default function TechnologyDeepDive() {
  const { slug } = useParams<{ slug: string }>();
  const { data: tech, isLoading, error } = useTechnologyBySlug(slug);
  const { data: companies } = useCompaniesForTechnology(tech?.keywordId);
  const { data: research } = useResearchSignalForKeyword(tech?.keywordId ?? null);
  const { data: news } = useNewsForKeyword(tech?.keywordId ?? null, { limit: 10 });
  const { data: cooccurrences } = useCooccurrences(tech?.keywordId);
  const { watchedKeywordIds } = useWatchlist();
  const toggleWatch = useToggleWatch();

  const [companyRegionFilter, setCompanyRegionFilter] = useState<RegionFilter>("all");
  const [openSheet, setOpenSheet] = useState<"news" | "patents" | "research" | null>(null);

  const patentSearch = useEpoKeywordSearch();

  const isWatched = tech ? watchedKeywordIds.includes(tech.keywordId) : false;

  // Fire patent search on mount
  useEffect(() => {
    if (tech?.keyword && !patentSearch.data && !patentSearch.isPending) {
      patentSearch.mutate(tech.keyword);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tech?.keyword]);

  // Region filtering
  const filteredCompanies = useMemo(() => {
    if (!companies) return [];
    if (companyRegionFilter === "all") return companies;
    const regionMap: Record<RegionFilter, string> = { all: "", eu: "EU", us: "US", china: "China" };
    const target = regionMap[companyRegionFilter];
    return companies.filter(c => classifyRegion(c.hqCountry) === target);
  }, [companies, companyRegionFilter]);

  const totalCompanies = companies?.length || 0;

  // Build a TechnologyIntelligence-like object for SignalBreakdown
  const techIntelligence = useMemo(() => {
    if (!tech) return null;
    return {
      id: tech.keywordId,
      name: tech.displayName,
      description: tech.description || "",
      keywordId: tech.keywordId,
      investmentScore: tech.investmentScore as 0 | 1 | 2,
      employeesScore: tech.employeesScore as 0 | 1 | 2,
      trlScore: tech.trlScore as 0 | 1 | 2,
      visibilityScore: tech.visibilityScore as 0 | 1 | 2,
      patentsScore: tech.patentsScore as 0 | 1 | 2,
      euAlignmentScore: 0 as 0 | 1 | 2,
      compositeScore: tech.compositeScore,
      trend: tech.trend as any,
      totalPatents: tech.totalPatents,
      totalFundingEur: tech.totalFundingEur,
      totalEmployees: tech.totalEmployees,
      dealroomCompanyCount: tech.dealroomCompanyCount,
      documentMentionCount: tech.documentMentionCount,
      policyMentionCount: 0,
      avgTrlMentioned: tech.avgTrlMentioned,
      newsMentionCount: tech.newsMentionCount,
      researchScore: tech.researchScore as 0 | 1 | 2,
      recentNews: [],
      keyPlayers: [],
      lastUpdated: "",
      createdAt: "",
      challengeScore: tech.challengeScore,
      opportunityScore: tech.opportunityScore,
      sectorTags: [],
      marketSignals: {},
      documentInsights: {},
    };
  }, [tech]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PlatformHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !tech) {
    return (
      <div className="min-h-screen bg-background">
        <PlatformHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Technology not found</h1>
          <p className="text-muted-foreground mb-6">No keyword matches "{slug}"</p>
          <Link to="/explorer">
            <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Explorer</Button>
          </Link>
        </div>
      </div>
    );
  }

  const challengeConfig = CHALLENGE_LABELS[tech.challengeScore ?? 0];
  const opportunityConfig = OPPORTUNITY_LABELS[tech.opportunityScore ?? 0];

  return (
    <div className="min-h-screen bg-background">
      <PlatformHeader />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back */}
        <Link to="/explorer" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Explorer
        </Link>

        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h1 className="text-3xl font-bold text-foreground">{tech.displayName}</h1>
            <Badge className={cn("text-sm border", scoreBadgeColor(tech.compositeScore))}>
              {tech.compositeScore.toFixed(2)} — {scoreLabel(tech.compositeScore)}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => toggleWatch.mutate({ keywordId: tech.keywordId, watched: isWatched })}
              disabled={toggleWatch.isPending}
            >
              {isWatched ? (
                <><EyeOff className="h-4 w-4" /> Watching</>
              ) : (
                <><EyeIcon className="h-4 w-4" /> Add to Signals</>
              )}
            </Button>
          </div>
        </div>

        {/* ── Score Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-10">
          <ScoreCard label="Investment" score={tech.investmentScore} raw={formatFundingEur(tech.totalFundingEur)} icon={TrendingUp} />
          <ScoreCard label="Employees" score={tech.employeesScore} raw={formatNumber(tech.totalEmployees)} icon={Users} />
          <ScoreCard label="Patents" score={tech.patentsScore} raw={`${tech.totalPatents} patents`} icon={FileText} />
          <ScoreCard label="TRL" score={tech.trlScore} raw={tech.avgTrlMentioned ? `TRL ${tech.avgTrlMentioned.toFixed(1)}` : "N/A"} icon={Cpu} />
          <ScoreCard label="Visibility" score={tech.visibilityScore} raw={`${tech.newsMentionCount + tech.documentMentionCount} mentions`} icon={Eye} />
        </div>

        {/* ── Standards ── */}
        <div className="mb-10">
          <StandardsSection keywordId={tech.keywordId} />
        </div>

        <Separator className="mb-10" />

        {/* ── Strategic Assessment (stacked C-O + wide signal) ── */}
        <h2 className="text-xl font-bold text-foreground mb-6">Strategic Assessment</h2>
        <div className="grid lg:grid-cols-3 gap-4 mb-10">
          <div className="lg:col-span-1 flex flex-col gap-4">
            <Card className={cn("border-2 flex-1", challengeConfig?.color || "border-border")}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-semibold">Challenge</span>
                </div>
                <p className="text-base font-bold">{challengeConfig?.label || "Not assessed"}</p>
                <p className="text-xs text-muted-foreground">{challengeConfig?.description || "Parse documents to assess"}</p>
              </CardContent>
            </Card>
            <Card className={cn("border-2 flex-1", opportunityConfig?.color || "border-border")}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb className="h-4 w-4" />
                  <span className="text-sm font-semibold">Opportunity</span>
                </div>
                <p className="text-base font-bold">{opportunityConfig?.label || "Not assessed"}</p>
                <p className="text-xs text-muted-foreground">{opportunityConfig?.description || "Parse documents to assess"}</p>
              </CardContent>
            </Card>
          </div>
          {techIntelligence && (
            <div className="lg:col-span-2">
              <SignalBreakdown technology={techIntelligence as any} />
            </div>
          )}
        </div>

        <Separator className="mb-10" />

        {/* ── Three Horizons (clickable summary cards) ── */}
        <h2 className="text-xl font-bold text-foreground mb-6">Three Horizons</h2>
        <div className="grid lg:grid-cols-3 gap-6 mb-10">

          {/* H1 — News */}
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setOpenSheet("news")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Newspaper className="h-4 w-4 text-primary" />
                  Today — News
                </span>
                <Badge variant="secondary" className="text-xs">{news?.length || 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!news || news.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent news</p>
              ) : (
                <div className="space-y-2">
                  {news.slice(0, 3).map((item: any) => (
                    <p key={item.id} className="text-sm text-foreground line-clamp-1">{item.title}</p>
                  ))}
                  {news.length > 3 && (
                    <p className="text-xs text-primary">+ {news.length - 3} more →</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* H2 — Patents */}
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setOpenSheet("patents")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-400" />
                  Tomorrow — Patents
                </span>
                <Badge variant="secondary" className="text-xs">
                  {patentSearch.isPending ? "…" : patentSearch.data?.totalPatents || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patentSearch.isPending ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching EPO…
                </div>
              ) : patentSearch.data ? (
                <div className="space-y-2">
                  {patentSearch.data.topApplicants.slice(0, 3).map((a: any) => (
                    <div key={a.name} className="flex justify-between text-sm">
                      <span className="text-foreground truncate">{a.name}</span>
                      <span className="text-muted-foreground font-mono">{a.count}</span>
                    </div>
                  ))}
                  {patentSearch.data.topApplicants.length > 3 && (
                    <p className="text-xs text-primary">+ more →</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No patent data</p>
              )}
            </CardContent>
          </Card>

          {/* H3 — Research */}
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setOpenSheet("research")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Microscope className="h-4 w-4 text-emerald-400" />
                  Future — Research
                </span>
                <Badge variant="secondary" className="text-xs">
                  {research ? formatNumber(research.totalWorks) : 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {research ? (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">YoY Growth</p>
                    <p className={cn("font-mono font-bold", research.growthRateYoy > 0 ? "text-emerald-400" : "text-red-400")}>
                      {research.growthRateYoy > 0 ? "+" : ""}{research.growthRateYoy.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Citations</p>
                    <p className="font-mono font-bold text-foreground">{formatNumber(research.citationCount)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No research signals</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Horizon Detail Sheets ── */}

        {/* News Sheet */}
        <Sheet open={openSheet === "news"} onOpenChange={(open) => !open && setOpenSheet(null)}>
          <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-primary" /> Recent News
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {!news || news.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent news for this technology.</p>
              ) : (
                news.map((item: any) => (
                  <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="block group border-b border-border pb-3 last:border-0">
                    <p className="text-sm text-foreground group-hover:text-primary">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.source_name} · {item.published_at ? new Date(item.published_at).toLocaleDateString() : ""}
                    </p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    )}
                  </a>
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Patents Sheet */}
        <Sheet open={openSheet === "patents"} onOpenChange={(open) => !open && setOpenSheet(null)}>
          <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-400" /> Patent Analysis
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              {patentSearch.isPending ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading patents…
                </div>
              ) : patentSearch.data ? (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total patents found</span>
                    <span className="font-mono font-bold text-foreground">{patentSearch.data.totalPatents}</span>
                  </div>
                  {patentSearch.data.ipcCodes?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-2">IPC Codes</p>
                      <div className="flex flex-wrap gap-1">
                        {patentSearch.data.ipcCodes.map((c: string) => (
                          <Badge key={c} variant="outline" className="text-xs font-mono">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {patentSearch.data.recentPatents?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-2">Recent Patents</p>
                      <div className="space-y-3">
                        {patentSearch.data.recentPatents.slice(0, 20).map((p: any, i: number) => (
                          <div key={i} className="border-b border-border pb-2 last:border-0">
                            <p className="text-sm text-foreground">{p.title || p.applicationNumber || `Patent ${i + 1}`}</p>
                            {p.applicant && <p className="text-xs text-muted-foreground mt-0.5">{p.applicant}</p>}
                            {p.publicationDate && <p className="text-xs text-muted-foreground">{p.publicationDate}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {patentSearch.data.topApplicants?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-2">Top Applicants</p>
                      <div className="space-y-1.5">
                        {patentSearch.data.topApplicants.map((a: any) => (
                          <div key={a.name} className="flex justify-between text-sm">
                            <span className="text-foreground truncate">{a.name}</span>
                            <span className="text-muted-foreground font-mono">{a.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No patent data available.</p>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Research Sheet */}
        <Sheet open={openSheet === "research"} onOpenChange={(open) => !open && setOpenSheet(null)}>
          <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Microscope className="h-5 w-5 text-emerald-400" /> Research Signals
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              {research ? (
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total works</p>
                      <p className="font-mono font-bold text-foreground text-lg">{formatNumber(research.totalWorks)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">YoY Growth</p>
                      <p className={cn("font-mono font-bold text-lg", research.growthRateYoy > 0 ? "text-emerald-400" : "text-red-400")}>
                        {research.growthRateYoy > 0 ? "+" : ""}{research.growthRateYoy.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Citations</p>
                      <p className="font-mono font-bold text-foreground text-lg">{formatNumber(research.citationCount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">h-index</p>
                      <p className="font-mono font-bold text-foreground text-lg">{research.hIndex}</p>
                    </div>
                  </div>
                  {research.topPapers && research.topPapers.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-2">Top Papers</p>
                      <div className="space-y-3">
                        {research.topPapers.slice(0, 15).map((paper: any, i: number) => (
                          <div key={i} className="border-b border-border pb-2 last:border-0">
                            {paper.doi ? (
                              <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer" className="text-sm text-foreground hover:text-primary flex items-start gap-1">
                                {paper.title || `Paper ${i + 1}`}
                                <ExternalLink className="h-3 w-3 mt-0.5 shrink-0" />
                              </a>
                            ) : (
                              <p className="text-sm text-foreground">{paper.title || `Paper ${i + 1}`}</p>
                            )}
                            <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                              {paper.year && <span>{paper.year}</span>}
                              {paper.cited_by_count != null && <span>{paper.cited_by_count} citations</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {research.topInstitutions?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-2">Top Institutions</p>
                      <div className="space-y-1">
                        {research.topInstitutions.slice(0, 8).map((inst: any, i: number) => (
                          <p key={i} className="text-sm text-foreground truncate">{inst.name} <span className="text-muted-foreground">({inst.country})</span></p>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No research signals available.</p>
              )}
            </div>
          </SheetContent>
        </Sheet>

        <Separator className="mb-10" />

        {/* ── Company Landscape ── */}
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" /> Company Landscape
        </h2>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-muted-foreground">Region:</span>
          <ToggleGroup
            type="single"
            value={companyRegionFilter}
            onValueChange={(v) => v && setCompanyRegionFilter(v as RegionFilter)}
            size="sm"
          >
            <ToggleGroupItem value="all" aria-label="All">
              <Globe className="h-4 w-4 mr-1" /> All
            </ToggleGroupItem>
            <ToggleGroupItem value="eu" aria-label="EU">🇪🇺 EU</ToggleGroupItem>
            <ToggleGroupItem value="us" aria-label="US">🇺🇸 US</ToggleGroupItem>
            <ToggleGroupItem value="china" aria-label="China">🇨🇳 China</ToggleGroupItem>
          </ToggleGroup>
          <span className="text-xs text-muted-foreground ml-auto">
            {filteredCompanies.length} of {totalCompanies} companies
          </span>
        </div>

        <div className="mb-10">
          {filteredCompanies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No companies {companyRegionFilter !== "all" ? "in this region" : "mapped to this technology"}.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 text-muted-foreground font-medium">Company</th>
                    <th className="pb-2 text-muted-foreground font-medium">Investment</th>
                    <th className="pb-2 text-muted-foreground font-medium">Employees</th>
                    <th className="pb-2 text-muted-foreground font-medium">HQ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.slice(0, 15).map(c => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 text-foreground font-medium">
                        {c.website ? (
                          <a href={c.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary flex items-center gap-1">
                            {c.name} <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : c.name}
                      </td>
                      <td className="py-2 font-mono text-foreground">{formatFundingUsd(c.totalFundingUsd)}</td>
                      <td className="py-2 text-foreground">{c.employeesCount}</td>
                      <td className="py-2 text-muted-foreground">{c.hqCountry || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Separator className="mb-10" />

        {/* ── Market Intelligence (Investors, Geo, Funding Stages) ── */}
        <MarketIntelligence
          keywordId={tech.keywordId}
          technologyName={tech.displayName}
          summary={{
            totalCompanies: tech.dealroomCompanyCount,
            totalFunding: tech.totalFundingEur,
            totalEmployees: tech.totalEmployees,
          }}
        />

        <Separator className="my-10" />

        {/* ── Related Technologies ── */}
        {cooccurrences && cooccurrences.length > 0 && (
          <>
            <h2 className="text-xl font-bold text-foreground mb-4">Related Technologies</h2>
            <div className="flex flex-wrap gap-2 mb-10">
              {cooccurrences.map(co => (
                <Link key={co.keywordId} to={`/technology/${co.keyword}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 hover:border-primary/40 transition-colors">
                    {co.displayName}
                    <span className="ml-1.5 text-muted-foreground font-mono text-xs">×{co.count}</span>
                  </Badge>
                </Link>
              ))}
            </div>
            <Separator className="mb-10" />
          </>
        )}

      </div>
    </div>
  );
}
