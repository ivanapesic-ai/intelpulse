import { useState, useMemo } from "react";
import { Search, TrendingUp, TrendingDown, Minus, FileText, DollarSign, Users, Calendar, Building2, Loader2, Gauge, BarChart3, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { useTechnologies } from "@/hooks/useTechnologies";
import { formatFundingEur, formatNumber, MATURITY_SCORE_CONFIG, type Technology } from "@/types/database";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

type SortOption = "composite" | "funding" | "employees" | "companies";

export default function TechnologyExplorer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("composite");
  const [selectedTech, setSelectedTech] = useState<Technology | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: technologies, isLoading, error } = useTechnologies();

  const filteredTechnologies = useMemo(() => {
    if (!technologies) return [];
    
    return technologies
      .filter((tech) => {
        const matchesSearch =
          tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tech.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "funding":
            return b.totalFundingEur - a.totalFundingEur;
          case "employees":
            return b.totalEmployees - a.totalEmployees;
          case "companies":
            return b.dealroomCompanyCount - a.dealroomCompanyCount;
          default:
            return b.compositeScore - a.compositeScore;
        }
      });
  }, [technologies, searchQuery, sortBy]);

  const openDetail = (tech: Technology) => {
    setSelectedTech(tech);
    setDetailOpen(true);
  };

  // 4-Dimension scoring per proposal: Investment, Employees, TRL, EU Alignment
  const radarData = selectedTech
    ? [
        { dimension: "Investment", value: selectedTech.investmentScore, fullMark: 2 },
        { dimension: "Employees", value: selectedTech.employeesScore, fullMark: 2 },
        { dimension: "TRL", value: selectedTech.trlScore, fullMark: 2 },
        { dimension: "EU Align", value: selectedTech.euAlignmentScore, fullMark: 2 },
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
            Browse and analyze {technologies?.length || 0} technologies powered by Dealroom data
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
            {filteredTechnologies.map((tech) => (
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
                    {tech.description || "Technology area tracked via Dealroom data"}
                  </p>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded bg-muted/50">
                      <Building2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">{tech.dealroomCompanyCount}</p>
                      <p className="text-xs text-muted-foreground">Companies</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <DollarSign className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">{formatFundingEur(tech.totalFundingEur)}</p>
                      <p className="text-xs text-muted-foreground">Funding</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">{formatNumber(tech.totalEmployees)}</p>
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
                      <Badge 
                        variant="outline" 
                        className={MATURITY_SCORE_CONFIG[tech.euAlignmentScore as 0|1|2]?.color || ""}
                        title="EU Alignment Score"
                      >
                        EU: {tech.euAlignmentScore}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

              <div className="grid md:grid-cols-2 gap-6 mt-4">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <p className="text-muted-foreground mb-4">
                      {selectedTech.description || `Technology area with ${selectedTech.dealroomCompanyCount} companies tracked from Dealroom.`}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="capitalize">{selectedTech.trend} trend</Badge>
                      <Badge variant="outline">{selectedTech.dealroomCompanyCount} companies</Badge>
                      {selectedTech.documentMentionCount > 0 && (
                        <Badge variant="outline">{selectedTech.documentMentionCount} doc mentions</Badge>
                      )}
                    </div>
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
                        <p className="text-2xl font-bold text-foreground">{selectedTech.totalPatents}</p>
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
                          { label: "Investment", score: selectedTech.investmentScore, tooltip: "Dealroom funding signals" },
                          { label: "Employees", score: selectedTech.employeesScore, tooltip: "Dealroom employee count" },
                          { label: "TRL (Readiness)", score: selectedTech.trlScore, tooltip: selectedTech.avgTrlMentioned ? `Avg TRL ${selectedTech.avgTrlMentioned.toFixed(1)}` : "No TRL data" },
                          { label: "EU Alignment", score: selectedTech.euAlignmentScore, tooltip: `${selectedTech.policyMentionCount} policy mentions` },
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
                      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                        Visibility: {selectedTech.documentMentionCount} doc mentions
                      </p>
                    </CardContent>
                  </Card>

                  {/* H11 Hybrid Scoring */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-foreground flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        H11 Relevance Signals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="text-center p-3 bg-muted/50 rounded-lg" title="KeyBERT semantic similarity between technology and document context">
                          <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
                          <p className="text-lg font-bold text-foreground">
                            {selectedTech.avgSemanticScore?.toFixed(2) || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">Semantic Match</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg" title="TextRank network centrality based on technology co-occurrences">
                          <BarChart3 className="h-5 w-5 mx-auto mb-1 text-primary" />
                          <p className="text-lg font-bold text-foreground">
                            {selectedTech.networkCentrality?.toFixed(2) || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">Network Score</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <Gauge className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-lg font-bold text-foreground">
                            {selectedTech.weightedFrequencyScore?.toFixed(1) || "0.0"}
                          </p>
                          <p className="text-xs text-muted-foreground">Weighted Freq</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <Target className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-lg font-bold text-foreground">
                            {selectedTech.avgRelevanceScore?.toFixed(2) || "0.50"}
                          </p>
                          <p className="text-xs text-muted-foreground">Avg Relevance</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <FileText className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-lg font-bold text-foreground">
                            {selectedTech.documentDiversity || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Sources</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                        H11 scoring: KeyBERT + TextRank + Position across {selectedTech.documentMentionCount} mentions
                      </p>
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
