import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Download, Filter, ArrowUpDown, Map, BarChart3, Grid3X3, Globe, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { EUMap } from "@/components/mockups/EUMap";
import { useTechnologies } from "@/hooks/useTechnologies";
import { useEUCountryStats } from "@/hooks/useCompaniesForTechnology";
import { Technology, MATURITY_SCORE_CONFIG, formatFundingEur } from "@/types/database";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis, Treemap } from "recharts";

// Updated columns for 0-2 scoring model
const columns = [
  { key: "investmentScore", label: "Investment", description: "Market investment signals (0-2)" },
  { key: "employeesScore", label: "Employees", description: "Workforce growth signals (0-2)" },
  { key: "trlScore", label: "TRL", description: "Technology Readiness Level (0-2)" },
  { key: "visibilityScore", label: "Visibility", description: "Document/web mentions (0-2)" },
  { key: "compositeScore", label: "Overall", description: "Composite Score (0-2)" },
];

// Updated color scale for 0-2 range
const getScoreColor = (score: number): string => {
  if (score >= 1.8) return "hsl(160 72% 30%)";
  if (score >= 1.5) return "hsl(160 72% 38%)";
  if (score >= 1.2) return "hsl(160 60% 45%)";
  if (score >= 1.0) return "hsl(170 50% 50%)";
  if (score >= 0.8) return "hsl(180 45% 50%)";
  if (score >= 0.5) return "hsl(38 92% 50%)";
  if (score >= 0.3) return "hsl(25 90% 50%)";
  return "hsl(0 72% 50%)";
};

const getScoreBg = (score: number): string => {
  if (score >= 1.8) return "bg-[hsl(160_72%_30%)] text-white";
  if (score >= 1.5) return "bg-[hsl(160_72%_38%)] text-white";
  if (score >= 1.2) return "bg-[hsl(160_60%_45%)] text-white";
  if (score >= 1.0) return "bg-[hsl(170_50%_50%)] text-white";
  if (score >= 0.8) return "bg-[hsl(180_45%_50%)] text-white";
  if (score >= 0.5) return "bg-[hsl(38_92%_50%)] text-foreground";
  if (score >= 0.3) return "bg-[hsl(25_90%_50%)] text-white";
  return "bg-[hsl(0_72%_50%)] text-white";
};

type MaturityRing = "Strong" | "Moderate" | "Emerging";

function getMaturityRing(compositeScore: number): MaturityRing {
  if (compositeScore >= 1.5) return "Strong";
  if (compositeScore >= 0.5) return "Moderate";
  return "Emerging";
}

const ringColors: Record<MaturityRing, string> = {
  Strong: "hsl(160 72% 35%)",
  Moderate: "hsl(38 92% 50%)",
  Emerging: "hsl(0 72% 50%)",
};

// EU Country data now comes from useEUCountryStats hook

export default function HeatmapMatrix() {
  const [sortColumn, setSortColumn] = useState<string>("compositeScore");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedCell, setSelectedCell] = useState<{ row: string; col: string } | null>(null);
  const [activeView, setActiveView] = useState<"matrix" | "geo" | "bubble" | "treemap">("matrix");
  
  const { data: technologies, isLoading, error } = useTechnologies();
  const { data: euCountryData, isLoading: countryLoading } = useEUCountryStats();
  
  // Fallback for EU country data
  const countryData = euCountryData || [];

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const sortedData = useMemo(() => {
    if (!technologies) return [];
    return [...technologies].sort((a, b) => {
      const aVal = (a[sortColumn as keyof Technology] as number) || 0;
      const bVal = (b[sortColumn as keyof Technology] as number) || 0;
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [technologies, sortColumn, sortDirection]);

  // Stats for sidebar
  const stats = useMemo(() => {
    if (!technologies || technologies.length === 0) {
      return {
        totalTechnologies: 0,
        avgCompositeScore: 0,
        highMaturityCount: 0,
        needsAssessmentCount: 0,
        ringCounts: { Strong: 0, Moderate: 0, Emerging: 0 },
      };
    }

    const avgCompositeScore = technologies.reduce((sum, t) => sum + (t.compositeScore || 0), 0) / technologies.length;
    const ringCounts: Record<MaturityRing, number> = { Strong: 0, Moderate: 0, Emerging: 0 };
    technologies.forEach((t) => {
      const ring = getMaturityRing(t.compositeScore || 0);
      ringCounts[ring]++;
    });

    return {
      totalTechnologies: technologies.length,
      avgCompositeScore,
      highMaturityCount: technologies.filter(t => (t.compositeScore || 0) >= 1.5).length,
      needsAssessmentCount: technologies.filter(t => (t.compositeScore || 0) < 0.5).length,
      ringCounts,
    };
  }, [technologies]);

  // Bubble chart data - Investment vs TRL with Employees as size
  const bubbleData = useMemo(() => {
    if (!technologies) return [];
    return technologies.map(tech => ({
      name: tech.name,
      x: (tech.investmentScore || 0),
      y: (tech.trlScore || 0),
      z: ((tech.employeesScore || 0) + 0.5) * 100,
      ring: getMaturityRing(tech.compositeScore || 0),
      color: ringColors[getMaturityRing(tech.compositeScore || 0)],
      composite: tech.compositeScore || 0,
    }));
  }, [technologies]);

  // Treemap data grouped by maturity ring
  const treemapData = useMemo(() => {
    if (!technologies) return [];
    const grouped: Record<MaturityRing, Array<{ name: string; size: number; color: string }>> = {
      Strong: [],
      Moderate: [],
      Emerging: [],
    };

    technologies.forEach(tech => {
      const ring = getMaturityRing(tech.compositeScore || 0);
      grouped[ring].push({
        name: tech.name,
        size: ((tech.compositeScore || 0) + 0.5) * 50,
        color: ringColors[ring],
      });
    });

    return Object.entries(grouped)
      .filter(([_, children]) => children.length > 0)
      .map(([name, children]) => ({ name, children }));
  }, [technologies]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <p className="text-destructive">Error loading technologies: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Temporarily hidden - user is rethinking visualizations
  return (
    <div className="min-h-screen bg-background">
      <PlatformHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Grid3X3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Visualization Coming Soon</h1>
          <p className="text-muted-foreground max-w-md">
            We're reimagining the heatmap and visualization experience. Check back soon for new ways to explore technology maturity data.
          </p>
        </div>
      </div>
    </div>
  );

  // Original implementation preserved below for when ready
  return (
    <div className="min-h-screen bg-background hidden">
      <PlatformHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-display text-foreground mb-2">Heatmap & Visualization</h1>
            <p className="text-muted-foreground">
              Multi-dimensional technology maturity analysis across {isLoading ? "..." : technologies?.length || 0} technologies (0-2 scale)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* View Tabs */}
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="matrix" className="gap-2">
              <Grid3X3 className="h-4 w-4" />
              Matrix
            </TabsTrigger>
            <TabsTrigger value="geo" className="gap-2">
              <Globe className="h-4 w-4" />
              Geographic
            </TabsTrigger>
            <TabsTrigger value="bubble" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Bubble
            </TabsTrigger>
            <TabsTrigger value="treemap" className="gap-2">
              <Map className="h-4 w-4" />
              Treemap
            </TabsTrigger>
          </TabsList>

          {/* Matrix View */}
          <TabsContent value="matrix" className="space-y-6">
            <div className="grid lg:grid-cols-[1fr_280px] gap-6">
              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  {isLoading ? (
                    <div className="p-6 space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="p-3 text-left font-semibold text-sm text-foreground w-64">Technology</th>
                          {columns.map((col) => (
                            <th key={col.key} className="p-3 text-center w-24">
                              <button
                                onClick={() => handleSort(col.key)}
                                className="flex items-center justify-center gap-1 mx-auto font-semibold text-sm hover:text-primary transition-colors text-foreground"
                              >
                                {col.label}
                                <ArrowUpDown className={cn("h-3 w-3", sortColumn === col.key ? "text-primary" : "text-muted-foreground")} />
                              </button>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedData.slice(0, 15).map((tech) => {
                          const maturityRing = getMaturityRing(tech.compositeScore || 0);
                          return (
                            <tr key={tech.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ background: ringColors[maturityRing] }} />
                                  <div>
                                    <Link to={`/technology/${tech.keyword?.keyword || tech.keywordId}`} className="font-medium text-foreground hover:text-primary hover:underline">
                                      {tech.name}
                                    </Link>
                                    <p className="text-xs text-muted-foreground">{maturityRing} • {formatFundingEur(tech.totalFundingEur || 0)}</p>
                                  </div>
                                </div>
                              </td>
                              {columns.map((col) => {
                                const score = (tech[col.key as keyof Technology] as number) || 0;
                                const isSelected = selectedCell?.row === tech.id && selectedCell?.col === col.key;
                                return (
                                  <td key={col.key} className="p-1">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={() => setSelectedCell({ row: tech.id, col: col.key })}
                                          className={cn(
                                            "w-full h-10 rounded flex items-center justify-center font-mono text-sm font-semibold transition-all",
                                            getScoreBg(score),
                                            isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                          )}
                                        >
                                          {score.toFixed(2)}
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="font-semibold text-foreground">{tech.name}</p>
                                        <p className="text-muted-foreground">{col.description}: {score.toFixed(2)}/2.0</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>

              {/* Sidebar */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Score Legend (0-2)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { label: "1.8 - 2.0 (Excellent)", color: "bg-[hsl(160_72%_30%)]" },
                      { label: "1.5 - 1.7 (Strong)", color: "bg-[hsl(160_72%_38%)]" },
                      { label: "1.2 - 1.4 (Good+)", color: "bg-[hsl(160_60%_45%)]" },
                      { label: "1.0 - 1.1 (Good)", color: "bg-[hsl(170_50%_50%)]" },
                      { label: "0.8 - 0.9 (Above Avg)", color: "bg-[hsl(180_45%_50%)]" },
                      { label: "0.5 - 0.7 (Moderate)", color: "bg-[hsl(38_92%_50%)]" },
                      { label: "0.3 - 0.4 (Below Avg)", color: "bg-[hsl(25_90%_50%)]" },
                      { label: "0.0 - 0.2 (Challenging)", color: "bg-[hsl(0_72%_50%)]" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span className={cn("w-6 h-3 rounded", item.color)} />
                        <span className="text-xs text-foreground">{item.label}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Technologies</span>
                      <span className="text-sm font-medium text-foreground">{stats.totalTechnologies}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Avg. Score</span>
                      <span className="text-sm font-medium text-foreground">{stats.avgCompositeScore.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Strong Maturity</span>
                      <span className="text-sm font-medium text-success">{stats.highMaturityCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Needs Assessment</span>
                      <span className="text-sm font-medium text-warning">{stats.needsAssessmentCount}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Geographic View */}
          <TabsContent value="geo" className="space-y-6">
            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">EU Technology Hub Distribution</CardTitle>
                  <CardDescription>Technology activity concentration across European Union member states</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative h-[450px] rounded-lg overflow-hidden border border-border">
                    {countryLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <EUMap data={countryData} />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Country Stats */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Top EU Hubs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(countryData.length > 0 ? [...countryData].sort((a, b) => b.techCount - a.techCount).slice(0, 6) : []).map((country, i) => {
                        const maxCount = countryData.reduce((max, c) => Math.max(max, c.techCount), 1);
                        return (
                          <div key={country.code} className="flex items-center gap-3">
                            <span className="text-sm font-medium text-muted-foreground w-4">{i + 1}</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-foreground">{country.country}</span>
                                <span className="text-xs text-muted-foreground">{country.techCount} companies</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{ width: `${(country.techCount / maxCount) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {countryData.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Run Dealroom sync to populate country data
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Funding by Region</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={150}>
                      <BarChart data={[...countryData].sort((a, b) => b.funding - a.funding).slice(0, 5)} layout="vertical">
                        <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `€${(v / 1e6).toFixed(0)}M`} />
                        <YAxis type="category" dataKey="code" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={30} />
                        <Bar dataKey="funding" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Bubble Chart View */}
          <TabsContent value="bubble" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Investment vs TRL Maturity</CardTitle>
                <CardDescription>Bubble size represents Employees Score (0-2 scale)</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[500px] w-full" />
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={500}>
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          type="number" 
                          dataKey="x" 
                          name="Investment Score" 
                          domain={[0, 2.2]}
                          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                          label={{ value: "Investment Score", position: "bottom", offset: 20, fill: "hsl(var(--muted-foreground))" }}
                        />
                        <YAxis 
                          type="number" 
                          dataKey="y" 
                          name="TRL Score"
                          domain={[0, 2.2]}
                          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                          label={{ value: "TRL Score", angle: -90, position: "insideLeft", offset: -10, fill: "hsl(var(--muted-foreground))" }}
                        />
                        <ZAxis type="number" dataKey="z" range={[50, 300]} name="Employees" />
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                                  <p className="font-semibold text-foreground">{data.name}</p>
                                  <p className="text-sm text-muted-foreground">Investment: {data.x.toFixed(2)}</p>
                                  <p className="text-sm text-muted-foreground">TRL: {data.y.toFixed(2)}</p>
                                  <p className="text-sm text-muted-foreground">Composite: {data.composite.toFixed(2)}</p>
                                  <Badge variant="outline" className="mt-1">{data.ring}</Badge>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Scatter data={bubbleData}>
                          {bubbleData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.7} stroke={entry.color} strokeWidth={1} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>

                    {/* Legend */}
                    <div className="flex flex-wrap justify-center gap-6 mt-4 pt-4 border-t border-border">
                      {(Object.entries(ringColors) as [MaturityRing, string][]).map(([ring, color]) => (
                        <div key={ring} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                          <span className="text-sm text-foreground">{ring}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Treemap View */}
          <TabsContent value="treemap" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Technology Portfolio Treemap</CardTitle>
                <CardDescription>Proportional visualization by maturity ring and composite score</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[500px] w-full" />
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={500}>
                      <Treemap
                        data={treemapData}
                        dataKey="size"
                        aspectRatio={4 / 3}
                        stroke="hsl(var(--background))"
                      />
                    </ResponsiveContainer>

                    {/* Legend */}
                    <div className="flex flex-wrap justify-center gap-6 mt-4 pt-4 border-t border-border">
                      {(Object.entries(ringColors) as [MaturityRing, string][]).map(([ring, color]) => (
                        <div key={ring} className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded" style={{ background: color }} />
                          <span className="text-sm text-foreground">{ring}</span>
                          <Badge variant="outline" className="text-xs">{stats.ringCounts[ring]}</Badge>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
