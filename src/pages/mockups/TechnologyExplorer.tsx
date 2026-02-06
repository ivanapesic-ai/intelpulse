import { useState, useMemo } from "react";
import { Search, TrendingUp, TrendingDown, Minus, FileText, DollarSign, Users, Calendar, Building2, Newspaper, ExternalLink, Target, Globe, Tag, Star, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { MarketIntelligence } from "@/components/mockups/MarketIntelligence";
import { useTechnologies } from "@/hooks/useTechnologies";
import { useTechnologyRegionStats, getRegionStats } from "@/hooks/useTechnologyRegionStats";
import { formatFundingEur, formatNumber, MATURITY_SCORE_CONFIG, type Technology, type TechnologyKeyword } from "@/types/database";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { isCentralEcosystem } from "@/lib/taxonomy-filters";

type SortOption = "composite" | "funding" | "employees" | "companies";
type RegionFilter = "all" | "europe" | "usa";

export default function TechnologyExplorer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("composite");
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [selectedTech, setSelectedTech] = useState<(Technology & { keyword?: TechnologyKeyword }) | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: technologies,
    isLoading,
    error,
    refetch: refetchTechnologies,
    isFetching: isFetchingTechnologies,
  } = useTechnologies();

  const {
    data: regionStats,
    refetch: refetchRegionStats,
    isFetching: isFetchingRegionStats,
  } = useTechnologyRegionStats();

  const isFetching = isRefreshing || isFetchingTechnologies || isFetchingRegionStats;

  // Helper to get display values based on region filter
  const getDisplayStats = (tech: Technology) => {
    // IMPORTANT: Global totals must come from the canonical aggregated Technology record
    // so cards, dialogs, dashboards, and radars stay aligned.
    if (regionFilter === "all") {
      return {
        companyCount: tech.dealroomCompanyCount,
        funding: tech.totalFundingEur,
        employees: tech.totalEmployees,
      };
    }

    // Region-specific views come from per-company aggregation
    const stats = getRegionStats(regionStats, tech.keywordId, regionFilter);
    return {
      companyCount: stats.companyCount,
      funding: stats.funding,
      employees: stats.employees,
    };
  };

  const filteredTechnologies = useMemo(() => {
    if (!technologies) return [];
    
    return technologies
      .filter((tech) => {
        const matchesSearch =
          tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tech.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Hide technologies with zero companies globally
        if (tech.dealroomCompanyCount === 0 && !tech.totalFundingEur) {
          return false;
        }
        
        // If region filter is active, only show technologies with companies in that region
        if (regionFilter !== "all" && regionStats) {
          const stats = getRegionStats(regionStats, tech.keywordId, regionFilter);
          if (stats.companyCount === 0) return false;
        }
        
        return matchesSearch;
      })
      .sort((a, b) => {
        const statsA = getDisplayStats(a);
        const statsB = getDisplayStats(b);
        
        switch (sortBy) {
          case "funding":
            return statsB.funding - statsA.funding;
          case "employees":
            return statsB.employees - statsA.employees;
          case "companies":
            return statsB.companyCount - statsA.companyCount;
          default:
            return b.compositeScore - a.compositeScore;
        }
      });
  }, [technologies, searchQuery, sortBy, regionFilter, regionStats]);

  const openDetail = (tech: Technology) => {
    setSelectedTech(tech);
    setDetailOpen(true);
  };

  // Get LIVE data for the selected technology from the query results
  // This ensures the dialog always shows current data, not a stale snapshot
  const liveSelectedTech = useMemo(() => {
    if (!selectedTech || !technologies) return selectedTech;
    return technologies.find(t => t.id === selectedTech.id) || selectedTech;
  }, [selectedTech, technologies]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchTechnologies(), refetchRegionStats()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 3-Dimension scoring: Investment, Employees, TRL
  const radarData = liveSelectedTech
    ? [
        { dimension: "Investment", value: liveSelectedTech.investmentScore, fullMark: 2 },
        { dimension: "Employees", value: liveSelectedTech.employeesScore, fullMark: 2 },
        { dimension: "TRL", value: liveSelectedTech.trlScore, fullMark: 2 },
      ]
    : [];

  const getScoreColor = (score: number) => {
    if (score >= 1.5) return "text-emerald-500";
    if (score >= 0.5) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 1.5) return "bg-emerald-500";
    if (score >= 0.5) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-background">
      <PlatformHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Technology Explorer</h1>
              <p className="text-muted-foreground">
                Browse and analyze {filteredTechnologies.length} SDV technologies powered by Crunchbase data
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isFetching}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isFetching ? "animate-spin" : "")} />
              {isFetching ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search technologies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Region:</span>
                <ToggleGroup 
                  type="single" 
                  value={regionFilter} 
                  onValueChange={(value) => value && setRegionFilter(value as RegionFilter)}
                  size="sm"
                >
                  <ToggleGroupItem value="all" aria-label="Both">
                    <Globe className="h-4 w-4 mr-1" />
                    Both
                  </ToggleGroupItem>
                  <ToggleGroupItem value="europe" aria-label="Europe">
                    🇪🇺 Europe
                  </ToggleGroupItem>
                  <ToggleGroupItem value="usa" aria-label="USA">
                    🇺🇸 USA
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="h-9 text-sm rounded border border-border bg-background px-3 text-foreground"
                >
                  <option value="composite">Composite Score</option>
                  <option value="funding">Total Funding</option>
                  <option value="employees">Employees</option>
                  <option value="companies">Company Count</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredTechnologies.length} technologies
          </p>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Error loading technologies: {error.message}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTechnologies.map((tech) => {
              const displayStats = getDisplayStats(tech);
              const isHub = isCentralEcosystem(tech.name);
              return (
                <Card 
                  key={tech.id} 
                  className={cn(
                    "cursor-pointer transition-colors",
                    isHub 
                      ? "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/30 ring-1 ring-primary/20 hover:border-primary/50" 
                      : "hover:border-primary/50"
                  )}
                  onClick={() => openDetail(tech)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {isHub && <Star className="h-4 w-4 text-primary fill-primary/30 shrink-0" />}
                        <h3 className="font-semibold text-foreground">{tech.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {isHub && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                            Hub
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className={`${getScoreColor(tech.compositeScore)} border-current`}
                        >
                          {tech.compositeScore.toFixed(2)}/2
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {tech.description || "Technology area tracked via Crunchbase market data"}
                    </p>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded bg-muted/50">
                        <Building2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">{displayStats.companyCount}</p>
                        <p className="text-xs text-muted-foreground">
                          {regionFilter === "europe" ? "EU Co." : regionFilter === "usa" ? "US Co." : "Companies"}
                        </p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <DollarSign className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">{formatFundingEur(displayStats.funding)}</p>
                        <p className="text-xs text-muted-foreground">Funding</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">{formatNumber(displayStats.employees)}</p>
                        <p className="text-xs text-muted-foreground">Employees</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {tech.trend === "up" ? (
                          <TrendingUp className="h-3 w-3 text-emerald-500" />
                        ) : tech.trend === "down" ? (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                        <span className="capitalize">{tech.trend}</span>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        <Badge 
                          variant="outline" 
                          className={MATURITY_SCORE_CONFIG[tech.investmentScore as 0|1|2]?.color || ""}
                          title="Investment Score"
                        >
                          Inv: {tech.investmentScore}
                        </Badge>
                      <Badge 
                        variant="outline" 
                        className={MATURITY_SCORE_CONFIG[tech.employeesScore as 0|1|2]?.color || ""}
                        title="Employees Score"
                      >
                        Emp: {tech.employeesScore}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={MATURITY_SCORE_CONFIG[tech.trlScore as 0|1|2]?.color || ""}
                        title="TRL Score"
                      >
                        TRL: {tech.trlScore}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}

        {!isLoading && filteredTechnologies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No technologies match your search</p>
            <Button
              variant="ghost"
              className="mt-2"
              onClick={() => setSearchQuery("")}
            >
              Clear search
            </Button>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          {liveSelectedTech && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-2xl text-foreground">{liveSelectedTech.name}</span>
                  <Badge 
                    variant="outline" 
                    className={`${getScoreColor(liveSelectedTech.compositeScore)} border-current text-lg px-3 py-1`}
                  >
                    {liveSelectedTech.compositeScore.toFixed(2)}/2
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="market-intel" className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5" />
                    Market Intelligence
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                      <div>
                        {/* Show description if exists, otherwise show alias explanation */}
                        {liveSelectedTech.description ? (
                          <p className="text-muted-foreground mb-3">{liveSelectedTech.description}</p>
                        ) : liveSelectedTech.keyword?.aliases && liveSelectedTech.keyword.aliases.length > 0 ? (
                          <div className="flex items-start gap-2 mb-3 p-3 rounded-lg bg-muted/50 border border-border">
                            <Tag className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">Company metrics include: </span>
                              {liveSelectedTech.keyword.aliases.slice(0, 5).join(", ")}
                              {liveSelectedTech.keyword.aliases.length > 5 && ` +${liveSelectedTech.keyword.aliases.length - 5} more`}
                            </p>
                          </div>
                        ) : null}
                        
                        {/* If has description AND aliases, show aliases as secondary info */}
                        {liveSelectedTech.description && liveSelectedTech.keyword?.aliases && liveSelectedTech.keyword.aliases.length > 0 && (
                          <div className="flex items-start gap-2 mb-3 p-3 rounded-lg bg-muted/50 border border-border">
                            <Tag className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">Company metrics include: </span>
                              {liveSelectedTech.keyword.aliases.slice(0, 5).join(", ")}
                              {liveSelectedTech.keyword.aliases.length > 5 && ` +${liveSelectedTech.keyword.aliases.length - 5} more`}
                            </p>
                          </div>
                        )}
                        
                      </div>

                      {/* Radar Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm text-foreground">Score Breakdown (0-2 Scale)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart data={radarData}>
                                <PolarGrid stroke="hsl(var(--border))" />
                                <PolarAngleAxis dataKey="dimension" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                                <PolarRadiusAxis domain={[0, 2]} tick={false} axisLine={false} />
                                <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Key Players */}
                      {liveSelectedTech.keyPlayers && liveSelectedTech.keyPlayers.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm text-foreground flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Key Players
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {liveSelectedTech.keyPlayers.map((player) => (
                                <Badge key={player} variant="secondary">
                                  {player}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Companies</span>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{liveSelectedTech.dealroomCompanyCount}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Total Funding</span>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{formatFundingEur(liveSelectedTech.totalFundingEur)}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Total Employees</span>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{formatNumber(liveSelectedTech.totalEmployees)}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Patents</span>
                            </div>
                            {liveSelectedTech.totalPatents > 0 ? (
                              <p className="text-2xl font-bold text-foreground">{formatNumber(liveSelectedTech.totalPatents)}</p>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">No data</p>
                            )}
                            <p className="text-xs text-muted-foreground">Patent count</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Maturity Scores */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm text-foreground">Maturity Assessment (0-2 Scale)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {[
                              { label: "Investment", score: liveSelectedTech.investmentScore, tooltip: "Crunchbase funding signals" },
                              { label: "Employees", score: liveSelectedTech.employeesScore, tooltip: "Crunchbase employee data" },
                              { label: "TRL (Readiness)", score: liveSelectedTech.trlScore, tooltip: liveSelectedTech.avgTrlMentioned ? `Avg TRL ${liveSelectedTech.avgTrlMentioned.toFixed(1)}` : "No TRL data" },
                            ].map((item) => {
                              const config = MATURITY_SCORE_CONFIG[item.score as 0|1|2];
                              return (
                                <div key={item.label} className="flex items-center justify-between" title={item.tooltip}>
                                  <span className="text-sm text-muted-foreground">{item.label}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full ${getScoreBgColor(item.score)}`}
                                        style={{ width: `${(item.score / 2) * 100}%` }}
                                      />
                                    </div>
                                    <Badge variant="outline" className={`${config?.color || ""} min-w-[80px] justify-center`}>
                                      {config?.label || `Score ${item.score}`}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                            <span>Visibility: {liveSelectedTech.documentMentionCount} doc mentions</span>
                            {liveSelectedTech.newsMentionCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Newspaper className="h-3 w-3" />
                                {liveSelectedTech.newsMentionCount} news
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Recent News */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm text-foreground flex items-center gap-2">
                            <Newspaper className="h-4 w-4" />
                            Recent News
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {liveSelectedTech.recentNews && liveSelectedTech.recentNews.length > 0 ? (
                            <div className="space-y-2">
                              {liveSelectedTech.recentNews.slice(0, 3).map((news, index) => (
                                <a
                                  key={index}
                                  href={news.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-start gap-2 p-2 rounded hover:bg-muted/50 transition-colors group"
                                >
                                  <ExternalLink className="h-3 w-3 mt-1 text-muted-foreground group-hover:text-primary shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-sm text-foreground line-clamp-1 group-hover:text-primary">
                                      {news.title}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Badge variant="outline" className="text-xs px-1 py-0">
                                        {news.source}
                                      </Badge>
                                      <span>{new Date(news.date).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </a>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-sm text-muted-foreground">
                                No news data available
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                News data from web scraping
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Last Updated */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Last updated: {liveSelectedTech.lastUpdated ? new Date(liveSelectedTech.lastUpdated).toLocaleDateString() : "N/A"}
                        </span>
                        <span className="flex items-center gap-1">
                          Trend:{" "}
                          {liveSelectedTech.trend === "up" ? (
                            <TrendingUp className="h-3 w-3 text-emerald-500" />
                          ) : liveSelectedTech.trend === "down" ? (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          ) : (
                            <Minus className="h-3 w-3" />
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

              <TabsContent value="market-intel" className="mt-4">
                <MarketIntelligence 
                  keywordId={liveSelectedTech.keywordId} 
                  technologyName={liveSelectedTech.name}
                  summary={{
                    totalCompanies: liveSelectedTech.dealroomCompanyCount || 0,
                    totalFunding: liveSelectedTech.totalFundingEur || 0,
                    totalEmployees: liveSelectedTech.totalEmployees || 0,
                  }}
                />
              </TabsContent>
            </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
