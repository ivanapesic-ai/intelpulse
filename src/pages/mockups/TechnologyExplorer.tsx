import { useState, useMemo } from "react";
import { Search, TrendingUp, TrendingDown, Minus, FileText, DollarSign, Users, Calendar, Building2, Newspaper, ExternalLink, Target, Globe, Tag } from "lucide-react";
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

type SortOption = "composite" | "funding" | "employees" | "companies";
type RegionFilter = "global" | "eu";

export default function TechnologyExplorer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("composite");
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("global");
  const [selectedTech, setSelectedTech] = useState<(Technology & { keyword?: TechnologyKeyword }) | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: technologies, isLoading, error } = useTechnologies();
  const { data: regionStats } = useTechnologyRegionStats();

  // Helper to get display values based on region filter
  const getDisplayStats = (tech: Technology) => {
    const stats = getRegionStats(regionStats, tech.keywordId, regionFilter);
    return {
      companyCount: stats.companyCount > 0 ? stats.companyCount : tech.dealroomCompanyCount,
      funding: stats.funding > 0 ? stats.funding : tech.totalFundingEur,
      employees: stats.employees > 0 ? stats.employees : tech.totalEmployees,
    };
  };

  const filteredTechnologies = useMemo(() => {
    if (!technologies) return [];
    
    return technologies
      .filter((tech) => {
        const matchesSearch =
          tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tech.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        // If EU filter is active, only show technologies with EU companies
        if (regionFilter === "eu" && regionStats) {
          const stats = getRegionStats(regionStats, tech.keywordId, "eu");
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

  // 3-Dimension scoring: Investment, Employees, TRL
  const radarData = selectedTech
    ? [
        { dimension: "Investment", value: selectedTech.investmentScore, fullMark: 2 },
        { dimension: "Employees", value: selectedTech.employeesScore, fullMark: 2 },
        { dimension: "TRL", value: selectedTech.trlScore, fullMark: 2 },
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
          <h1 className="text-2xl font-bold text-foreground mb-2">Technology Explorer</h1>
          <p className="text-muted-foreground">
            Browse and analyze {technologies?.length || 0} technologies powered by Crunchbase data
          </p>
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
                  <ToggleGroupItem value="global" aria-label="Global">
                    <Globe className="h-4 w-4 mr-1" />
                    Global
                  </ToggleGroupItem>
                  <ToggleGroupItem value="eu" aria-label="EU Only">
                    🇪🇺 EU
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
            Showing {filteredTechnologies.length} of {technologies?.length || 0} technologies
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
              return (
                <Card 
                  key={tech.id} 
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => openDetail(tech)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-foreground">{tech.name}</h3>
                      <Badge 
                        variant="outline" 
                        className={`${getScoreColor(tech.compositeScore)} border-current`}
                      >
                        {tech.compositeScore.toFixed(1)}/2
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {tech.description || "Technology area tracked via Crunchbase market data"}
                    </p>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded bg-muted/50">
                        <Building2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">{displayStats.companyCount}</p>
                        <p className="text-xs text-muted-foreground">
                          {regionFilter === "eu" ? "EU Co." : "Companies"}
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
          {selectedTech && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-2xl text-foreground">{selectedTech.name}</span>
                  <Badge 
                    variant="outline" 
                    className={`${getScoreColor(selectedTech.compositeScore)} border-current text-lg px-3 py-1`}
                  >
                    {selectedTech.compositeScore.toFixed(2)}/2
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
                        {selectedTech.description ? (
                          <p className="text-muted-foreground mb-3">{selectedTech.description}</p>
                        ) : selectedTech.keyword?.aliases && selectedTech.keyword.aliases.length > 0 ? (
                          <div className="flex items-start gap-2 mb-3 p-3 rounded-lg bg-muted/50 border border-border">
                            <Tag className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">Company metrics include: </span>
                              {selectedTech.keyword.aliases.slice(0, 5).join(", ")}
                              {selectedTech.keyword.aliases.length > 5 && ` +${selectedTech.keyword.aliases.length - 5} more`}
                            </p>
                          </div>
                        ) : null}
                        
                        {/* If has description AND aliases, show aliases as secondary info */}
                        {selectedTech.description && selectedTech.keyword?.aliases && selectedTech.keyword.aliases.length > 0 && (
                          <div className="flex items-start gap-2 mb-3 p-3 rounded-lg bg-muted/50 border border-border">
                            <Tag className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">Company metrics include: </span>
                              {selectedTech.keyword.aliases.slice(0, 5).join(", ")}
                              {selectedTech.keyword.aliases.length > 5 && ` +${selectedTech.keyword.aliases.length - 5} more`}
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
                      {selectedTech.keyPlayers && selectedTech.keyPlayers.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm text-foreground flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Key Players
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {selectedTech.keyPlayers.map((player) => (
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
                            <p className="text-2xl font-bold text-foreground">{selectedTech.dealroomCompanyCount}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Total Funding</span>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{formatFundingEur(selectedTech.totalFundingEur)}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Total Employees</span>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{formatNumber(selectedTech.totalEmployees)}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Patents</span>
                            </div>
                            {selectedTech.totalPatents > 0 ? (
                              <p className="text-2xl font-bold text-foreground">{formatNumber(selectedTech.totalPatents)}</p>
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
                              { label: "Investment", score: selectedTech.investmentScore, tooltip: "Crunchbase funding signals" },
                              { label: "Employees", score: selectedTech.employeesScore, tooltip: "Crunchbase employee data" },
                              { label: "TRL (Readiness)", score: selectedTech.trlScore, tooltip: selectedTech.avgTrlMentioned ? `Avg TRL ${selectedTech.avgTrlMentioned.toFixed(1)}` : "No TRL data" },
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
                            <span>Visibility: {selectedTech.documentMentionCount} doc mentions</span>
                            {selectedTech.newsMentionCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Newspaper className="h-3 w-3" />
                                {selectedTech.newsMentionCount} news
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
                          {selectedTech.recentNews && selectedTech.recentNews.length > 0 ? (
                            <div className="space-y-2">
                              {selectedTech.recentNews.slice(0, 3).map((news, index) => (
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
                          Last updated: {selectedTech.lastUpdated ? new Date(selectedTech.lastUpdated).toLocaleDateString() : "N/A"}
                        </span>
                        <span className="flex items-center gap-1">
                          Trend:{" "}
                          {selectedTech.trend === "up" ? (
                            <TrendingUp className="h-3 w-3 text-emerald-500" />
                          ) : selectedTech.trend === "down" ? (
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
                  keywordId={selectedTech.keywordId} 
                  technologyName={selectedTech.name} 
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
