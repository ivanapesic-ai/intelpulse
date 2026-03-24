import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, TrendingUp, TrendingDown, Minus, Coins, Users, Building2, Globe, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { useTechnologies } from "@/hooks/useTechnologies";
import { useTechnologyRegionStats, getRegionStats } from "@/hooks/useTechnologyRegionStats";
import { formatFundingEur, formatNumber, MATURITY_SCORE_CONFIG } from "@/types/database";
import { cn } from "@/lib/utils";

type RegionFilter = "all" | "europe" | "usa" | "china";

export default function TechnologyExplorer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

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

  const getDisplayStats = (tech: any) => {
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
      .sort((a, b) => b.compositeScore - a.compositeScore);
  }, [technologies, searchQuery, regionFilter, regionStats]);

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
                  <ToggleGroupItem value="all" aria-label="All">
                    <Globe className="h-4 w-4 mr-1" />
                    All
                  </ToggleGroupItem>
                  <ToggleGroupItem value="europe" aria-label="Europe">
                    🇪🇺 Europe
                  </ToggleGroupItem>
                  <ToggleGroupItem value="usa" aria-label="USA">
                    🇺🇸 USA
                  </ToggleGroupItem>
                  <ToggleGroupItem value="china" aria-label="China">
                    🇨🇳 China
                  </ToggleGroupItem>
                </ToggleGroup>
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
                  onClick={() => navigate(`/technology/${tech.keyword?.keyword || tech.keywordId}`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="font-semibold text-foreground">
                          {tech.name}
                        </span>
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

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded bg-muted/50">
                        <Building2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">{displayStats.companyCount}</p>
                        <p className="text-xs text-muted-foreground">
                          {regionFilter === "europe" ? "EU Co." : regionFilter === "usa" ? "US Co." : regionFilter === "china" ? "CN Co." : "Companies"}
                        </p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <Coins className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">{formatFundingEur(displayStats.funding)}</p>
                        <p className="text-xs text-muted-foreground">{regionFilter === "europe" ? "EU Investment" : regionFilter === "usa" ? "US Investment" : regionFilter === "china" ? "CN Investment" : "Investment"}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">{formatNumber(displayStats.employees)}</p>
                        <p className="text-xs text-muted-foreground">{regionFilter === "europe" ? "EU Emp." : regionFilter === "usa" ? "US Emp." : regionFilter === "china" ? "CN Emp." : "Employees"}</p>
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
    </div>
  );
}
