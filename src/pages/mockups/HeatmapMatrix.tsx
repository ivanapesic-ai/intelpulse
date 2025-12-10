import { useState, useEffect, useRef } from "react";
import { Download, Filter, ArrowUpDown, ChevronDown, ChevronRight, Map, BarChart3, Grid3X3, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { technologies, Technology, TechnologyQuadrant, getStats, formatFunding } from "@/data/technologies";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis, Treemap } from "recharts";

const columns = [
  { key: "trl", label: "TRL", description: "Technology Readiness Level" },
  { key: "marketScore", label: "Market", description: "Market Adoption Score" },
  { key: "innovationScore", label: "Innovation", description: "Innovation Activity" },
  { key: "euAlignmentScore", label: "EU Align", description: "EU Strategic Alignment" },
  { key: "compositeScore", label: "Overall", description: "Composite Score" },
];

const getScoreColor = (score: number): string => {
  if (score >= 8.5) return "hsl(160 72% 30%)";
  if (score >= 8) return "hsl(160 72% 38%)";
  if (score >= 7.5) return "hsl(160 60% 45%)";
  if (score >= 7) return "hsl(170 50% 50%)";
  if (score >= 6.5) return "hsl(180 45% 50%)";
  if (score >= 6) return "hsl(190 50% 50%)";
  if (score >= 5) return "hsl(38 92% 50%)";
  if (score >= 4) return "hsl(25 90% 50%)";
  if (score >= 3) return "hsl(15 85% 50%)";
  if (score >= 2) return "hsl(0 72% 55%)";
  return "hsl(0 72% 45%)";
};

const getScoreBg = (score: number): string => {
  if (score >= 8.5) return "bg-[hsl(160_72%_30%)] text-white";
  if (score >= 8) return "bg-[hsl(160_72%_38%)] text-white";
  if (score >= 7.5) return "bg-[hsl(160_60%_45%)] text-white";
  if (score >= 7) return "bg-[hsl(170_50%_50%)] text-white";
  if (score >= 6.5) return "bg-[hsl(180_45%_50%)] text-white";
  if (score >= 6) return "bg-[hsl(190_50%_50%)] text-white";
  if (score >= 5) return "bg-[hsl(38_92%_50%)] text-foreground";
  if (score >= 4) return "bg-[hsl(25_90%_50%)] text-white";
  if (score >= 3) return "bg-[hsl(15_85%_50%)] text-white";
  if (score >= 2) return "bg-[hsl(0_72%_55%)] text-white";
  return "bg-[hsl(0_72%_45%)] text-white";
};

const quadrantColors: Record<TechnologyQuadrant, string> = {
  Cloud: "hsl(214 100% 49%)",
  Edge: "hsl(270 60% 50%)",
  IoT: "hsl(160 72% 35%)",
  "AI/ML": "hsl(350 70% 50%)",
};

// EU Country data for geographic visualization
const euCountryData = [
  { country: "Germany", code: "DE", lat: 51.1657, lng: 10.4515, techCount: 28, funding: 4500000000, focus: "Automotive AI" },
  { country: "France", code: "FR", lat: 46.2276, lng: 2.2137, techCount: 22, funding: 3200000000, focus: "Edge Computing" },
  { country: "Netherlands", code: "NL", lat: 52.1326, lng: 5.2913, techCount: 18, funding: 2100000000, focus: "IoT Infrastructure" },
  { country: "Sweden", code: "SE", lat: 60.1282, lng: 18.6435, techCount: 15, funding: 1800000000, focus: "V2X Communication" },
  { country: "Finland", code: "FI", lat: 61.9241, lng: 25.7482, techCount: 12, funding: 950000000, focus: "Smart Mobility" },
  { country: "Spain", code: "ES", lat: 40.4637, lng: -3.7492, techCount: 14, funding: 1200000000, focus: "Cloud Native" },
  { country: "Italy", code: "IT", lat: 41.8719, lng: 12.5674, techCount: 16, funding: 1400000000, focus: "Digital Twin" },
  { country: "Belgium", code: "BE", lat: 50.5039, lng: 4.4699, techCount: 10, funding: 780000000, focus: "5G Networks" },
  { country: "Austria", code: "AT", lat: 47.5162, lng: 14.5501, techCount: 8, funding: 520000000, focus: "Sensor Networks" },
  { country: "Poland", code: "PL", lat: 51.9194, lng: 19.1451, techCount: 11, funding: 680000000, focus: "Edge AI" },
];

// Treemap data for technology categories
const treemapData = technologies.reduce((acc, tech) => {
  const quadrant = acc.find(q => q.name === tech.quadrant);
  if (quadrant) {
    quadrant.children.push({
      name: tech.name,
      size: tech.compositeScore * 10,
      color: quadrantColors[tech.quadrant],
    });
  } else {
    acc.push({
      name: tech.quadrant,
      children: [{
        name: tech.name,
        size: tech.compositeScore * 10,
        color: quadrantColors[tech.quadrant as TechnologyQuadrant],
      }],
    });
  }
  return acc;
}, [] as Array<{ name: string; children: Array<{ name: string; size: number; color: string }> }>);

export default function HeatmapMatrix() {
  const [sortColumn, setSortColumn] = useState<string>("compositeScore");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedCell, setSelectedCell] = useState<{ row: string; col: string } | null>(null);
  const [activeView, setActiveView] = useState<"matrix" | "geo" | "bubble" | "treemap">("matrix");
  
  const stats = getStats();

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const sortedData = [...technologies].sort((a, b) => {
    const aVal = a[sortColumn as keyof Technology] as number;
    const bVal = b[sortColumn as keyof Technology] as number;
    return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
  });

  // Bubble chart data - Innovation vs Market with TRL as size
  const bubbleData = technologies.map(tech => ({
    name: tech.name,
    x: tech.marketScore,
    y: tech.innovationScore,
    z: tech.trl * 10,
    quadrant: tech.quadrant,
    color: quadrantColors[tech.quadrant],
  }));

  return (
    <div className="min-h-screen bg-background">
      <PlatformHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-display text-foreground mb-2">Heatmap & Visualization</h1>
            <p className="text-muted-foreground">
              Multi-dimensional technology maturity analysis across {technologies.length} technologies
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
                      {sortedData.slice(0, 15).map((tech) => (
                        <tr key={tech.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ background: quadrantColors[tech.quadrant] }} />
                              <div>
                                <p className="font-medium text-foreground">{tech.name}</p>
                                <p className="text-xs text-muted-foreground">{tech.quadrant} • {tech.ring}</p>
                              </div>
                            </div>
                          </td>
                          {columns.map((col) => {
                            const score = tech[col.key as keyof Technology] as number;
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
                                      {score.toFixed(1)}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-semibold text-foreground">{tech.name}</p>
                                    <p className="text-muted-foreground">{col.description}: {score.toFixed(1)}/9.0</p>
                                  </TooltipContent>
                                </Tooltip>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Sidebar */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Score Legend</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { label: "8.5 - 9.0 (Excellent)", color: "bg-[hsl(160_72%_30%)]" },
                      { label: "8.0 - 8.4 (High)", color: "bg-[hsl(160_72%_38%)]" },
                      { label: "7.5 - 7.9 (Good+)", color: "bg-[hsl(160_60%_45%)]" },
                      { label: "7.0 - 7.4 (Good)", color: "bg-[hsl(170_50%_50%)]" },
                      { label: "6.0 - 6.9 (Above Avg)", color: "bg-[hsl(190_50%_50%)]" },
                      { label: "5.0 - 5.9 (Moderate)", color: "bg-[hsl(38_92%_50%)]" },
                      { label: "4.0 - 4.9 (Below Avg)", color: "bg-[hsl(25_90%_50%)]" },
                      { label: "0.0 - 3.9 (Low)", color: "bg-[hsl(0_72%_50%)]" },
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
                      <span className="text-sm font-medium text-foreground">{technologies.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Avg. Score</span>
                      <span className="text-sm font-medium text-foreground">{stats.avgTrl}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">High Maturity</span>
                      <span className="text-sm font-medium text-success">{technologies.filter(t => t.compositeScore >= 7.5).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Needs Assessment</span>
                      <span className="text-sm font-medium text-warning">{technologies.filter(t => t.compositeScore < 5).length}</span>
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
                  {/* Simplified EU Map visualization using a grid */}
                  <div className="relative h-[400px] bg-muted/20 rounded-lg overflow-hidden border border-border">
                    <div className="absolute inset-0 p-6">
                      {/* Grid-based EU representation */}
                      <div className="grid grid-cols-5 gap-4 h-full">
                        {euCountryData.map((country) => {
                          const sizeClass = country.techCount > 20 ? "col-span-2 row-span-2" : 
                                           country.techCount > 12 ? "col-span-1 row-span-2" : "col-span-1";
                          const funding = country.funding / 1000000000;
                          return (
                            <Tooltip key={country.code}>
                              <TooltipTrigger asChild>
                                <div 
                                  className={cn(
                                    "rounded-lg flex flex-col items-center justify-center p-3 cursor-pointer transition-all hover:scale-105",
                                    sizeClass
                                  )}
                                  style={{ 
                                    background: `hsl(214 100% 49% / ${0.2 + (country.techCount / 30) * 0.6})`,
                                    border: "1px solid hsl(214 100% 49% / 0.3)"
                                  }}
                                >
                                  <span className="text-lg font-bold text-foreground">{country.code}</span>
                                  <span className="text-xs text-muted-foreground">{country.techCount} tech</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  <p className="font-semibold text-foreground">{country.country}</p>
                                  <p className="text-sm text-muted-foreground">{country.techCount} technologies tracked</p>
                                  <p className="text-sm text-muted-foreground">€{funding.toFixed(1)}B funding</p>
                                  <p className="text-xs text-primary">Focus: {country.focus}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </div>
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
                      {euCountryData
                        .sort((a, b) => b.techCount - a.techCount)
                        .slice(0, 6)
                        .map((country, i) => (
                          <div key={country.code} className="flex items-center gap-3">
                            <span className="text-sm font-medium text-muted-foreground w-4">{i + 1}</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-foreground">{country.country}</span>
                                <span className="text-xs text-muted-foreground">{country.techCount}</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{ width: `${(country.techCount / 28) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Funding by Region</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={150}>
                      <BarChart data={euCountryData.slice(0, 5)} layout="vertical">
                        <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
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
                <CardTitle className="text-foreground">Innovation vs Market Adoption</CardTitle>
                <CardDescription>Bubble size represents Technology Readiness Level (TRL)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={500}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Market Score" 
                      domain={[4, 10]}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      label={{ value: "Market Score", position: "bottom", offset: 20, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Innovation Score"
                      domain={[5, 10]}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      label={{ value: "Innovation Score", angle: -90, position: "insideLeft", offset: -10, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <ZAxis type="number" dataKey="z" range={[50, 300]} name="TRL" />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-semibold text-foreground">{data.name}</p>
                              <p className="text-sm text-muted-foreground">Market: {data.x.toFixed(1)}</p>
                              <p className="text-sm text-muted-foreground">Innovation: {data.y.toFixed(1)}</p>
                              <p className="text-sm text-muted-foreground">TRL: {data.z / 10}</p>
                              <Badge variant="outline" className="mt-1">{data.quadrant}</Badge>
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
                  {(Object.entries(quadrantColors) as [TechnologyQuadrant, string][]).map(([quadrant, color]) => (
                    <div key={quadrant} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                      <span className="text-sm text-foreground">{quadrant}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Treemap View */}
          <TabsContent value="treemap" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Technology Portfolio Treemap</CardTitle>
                <CardDescription>Proportional visualization by quadrant and composite score</CardDescription>
              </CardHeader>
              <CardContent>
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
                  {(Object.entries(quadrantColors) as [TechnologyQuadrant, string][]).map(([quadrant, color]) => (
                    <div key={quadrant} className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded" style={{ background: color }} />
                      <span className="text-sm text-foreground">{quadrant}</span>
                      <Badge variant="outline" className="text-xs">{stats.quadrantCounts[quadrant]}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}