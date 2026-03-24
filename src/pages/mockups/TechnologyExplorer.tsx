import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, TrendingUp, TrendingDown, Minus, Coins, Users, Building2, Globe, Star, RefreshCw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { useTechnologies } from "@/hooks/useTechnologies";
import { useTechnologyRegionStats, getRegionStats } from "@/hooks/useTechnologyRegionStats";
import { formatFundingEur, formatNumber, MATURITY_SCORE_CONFIG, type Technology, type TechnologyKeyword } from "@/types/database";
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

  const getDisplayStats = (tech: Technology) => {
    if (regionFilter === "all") {
      if (regionStats) {
        return getRegionStats(regionStats, tech.keywordId, "all");
      }
      return {
        companyCount: tech.dealroomCompanyCount,
        funding: tech.totalFundingEur,
        employees: tech.totalEmployees,
      };
    }
    return getRegionStats(regionStats, tech.keywordId, regionFilter);
  };

  const filteredTechnologies = useMemo(() => {
    if (!technologies) return [];
    
    return technologies
      .filter((tech) => {
        const matchesSearch =
          tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tech.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (tech.dealroomCompanyCount === 0 && !tech.totalFundingEur) {
          return false;
        }
        
        if (regionStats) {
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

  const getScoreColor = (score: number) => {
    if (score >= 1.5) return "text-emerald-500";
    if (score >= 0.5) return "text-amber-500";
    return "text-red-500";
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
                Browse and analyze SDV technologies with market intelligence and scoring
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
                  <option value="funding">Investment</option>
                  <option value="employees">Employees</option>
                  <option value="companies">Company Count</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="h-6 w-3/4 mb-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-full mb-2 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
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
                  className="cursor-pointer transition-colors hover:border-primary/50"
                  onClick={() => openDetail(tech)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Link to={`/technology/${tech.keyword?.keyword || tech.keywordId}`} className="font-semibold text-foreground hover:text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                          {tech.name}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`${getScoreColor(tech.compositeScore)} border-current`}
                        >
                          {tech.compositeScore.toFixed(2)}/2
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {tech.description || "Emerging technology area under active monitoring"}
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
                        <Coins className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">{formatFundingEur(displayStats.funding)}</p>
                        <p className="text-xs text-muted-foreground">{regionFilter === "europe" ? "EU Investment" : regionFilter === "usa" ? "US Investment" : "Investment"}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">{formatNumber(displayStats.employees)}</p>
                        <p className="text-xs text-muted-foreground">{regionFilter === "europe" ? "EU Emp." : regionFilter === "usa" ? "US Emp." : "Employees"}</p>
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

      {/* Compact Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          {liveSelectedTech && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-xl text-foreground">{liveSelectedTech.name}</span>
                  <Badge 
                    variant="outline" 
                    className={`${getScoreColor(liveSelectedTech.compositeScore)} border-current`}
                  >
                    {liveSelectedTech.compositeScore.toFixed(2)}/2
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {liveSelectedTech.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">{liveSelectedTech.description}</p>
                )}

                {/* Compact metrics */}
                {(() => {
                  const detailStats = getDisplayStats(liveSelectedTech);
                  const regionLabel = regionFilter === "europe" ? "EU" : regionFilter === "usa" ? "US" : "";
                  return (
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <Building2 className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                        <p className="text-lg font-bold text-foreground">{detailStats.companyCount}</p>
                        <p className="text-xs text-muted-foreground">{regionLabel ? `${regionLabel} Co.` : "Companies"}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <Coins className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                        <p className="text-lg font-bold text-foreground">{formatFundingEur(detailStats.funding)}</p>
                        <p className="text-xs text-muted-foreground">Investment</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <Users className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                        <p className="text-lg font-bold text-foreground">{formatNumber(detailStats.employees)}</p>
                        <p className="text-xs text-muted-foreground">Employees</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Score badges */}
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className={MATURITY_SCORE_CONFIG[liveSelectedTech.investmentScore as 0|1|2]?.color || ""}>
                    Investment: {liveSelectedTech.investmentScore}
                  </Badge>
                  <Badge variant="outline" className={MATURITY_SCORE_CONFIG[liveSelectedTech.employeesScore as 0|1|2]?.color || ""}>
                    Employees: {liveSelectedTech.employeesScore}
                  </Badge>
                  <Badge variant="outline" className={MATURITY_SCORE_CONFIG[liveSelectedTech.trlScore as 0|1|2]?.color || ""}>
                    TRL: {liveSelectedTech.trlScore}
                  </Badge>
                </div>

                {/* Open full view CTA */}
                <Link to={`/technology/${liveSelectedTech.keyword?.keyword || liveSelectedTech.keywordId}`}>
                  <Button variant="default" className="w-full gap-2">
                    Open full view
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
