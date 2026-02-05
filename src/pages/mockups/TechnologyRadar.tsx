import { useState, useMemo } from "react";
import { Download, TrendingUp, TrendingDown, Minus, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { SignalIndicator } from "@/components/mockups/SignalIndicator";
import { useTechnologies } from "@/hooks/useTechnologies";
import { cn } from "@/lib/utils";
import { formatFundingEur, MATURITY_SCORE_CONFIG, type MaturityScore } from "@/types/database";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell, PieChart, Pie } from "recharts";

// Map composite score (0-2) to maturity ring
type MaturityRing = "Strong" | "Moderate" | "Challenging";

function getMaturityRing(compositeScore: number): MaturityRing {
  if (compositeScore >= 1.5) return "Strong";
  if (compositeScore >= 0.5) return "Moderate";
  return "Challenging";
}

// Ring radii for positioning (inverted - Strong is center)
const ringRadii: Record<MaturityRing, number> = {
  Strong: 0.22,
  Moderate: 0.45,
  Challenging: 0.72,
};

const ringColors: Record<MaturityRing, { bg: string; text: string }> = {
  Strong: { bg: "hsl(160 72% 35%)", text: "text-success" },
  Moderate: { bg: "hsl(38 92% 45%)", text: "text-warning" },
  Challenging: { bg: "hsl(0 72% 50%)", text: "text-destructive" },
};

// Simple color palette for technologies
const techColors = [
  "hsl(214 100% 49%)", // blue
  "hsl(270 60% 50%)",  // purple
  "hsl(160 72% 35%)",  // green
  "hsl(350 70% 50%)",  // red
  "hsl(38 92% 50%)",   // orange
  "hsl(190 80% 45%)",  // cyan
];

function getTechColor(index: number): string {
  return techColors[index % techColors.length];
}

export default function TechnologyRadar() {
  const { data: technologies = [], isLoading } = useTechnologies();
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [hoveredTechId, setHoveredTechId] = useState<string | null>(null);

  const selectedTech = technologies.find(t => t.id === selectedTechId);

  const openDetails = (techId: string) => {
    setSelectedTechId(techId);
    setDetailDialogOpen(true);
  };

  // Calculate stats from real data
  const stats = useMemo(() => {
    const ringCounts: Record<MaturityRing, number> = {
      Strong: 0,
      Moderate: 0,
      Challenging: 0,
    };

    let totalCompositeScore = 0;

    technologies.forEach(tech => {
      const ring = getMaturityRing(tech.compositeScore);
      ringCounts[ring]++;
      totalCompositeScore += tech.compositeScore;
    });

    return {
      totalTechnologies: technologies.length,
      avgCompositeScore: technologies.length > 0 
        ? (totalCompositeScore / technologies.length).toFixed(1) 
        : "0",
      ringCounts,
    };
  }, [technologies]);

  // Position calculation for radar dots
  const getPosition = (tech: typeof technologies[0], index: number) => {
    const ring = getMaturityRing(tech.compositeScore);
    const radius = ringRadii[ring];
    
    // Distribute technologies evenly in a ring
    const techsInRing = technologies.filter(t => getMaturityRing(t.compositeScore) === ring);
    const techIndex = techsInRing.findIndex(t => t.id === tech.id);
    const angle = (2 * Math.PI / techsInRing.length) * techIndex - Math.PI / 2;
    
    // Add slight jitter for visual separation
    const jitter = (radius * 0.08) * ((index % 3) - 1);
    const finalRadius = radius + jitter;

    return {
      x: 50 + Math.cos(angle) * finalRadius * 46,
      y: 50 + Math.sin(angle) * finalRadius * 46,
    };
  };

  // Charts data from real technologies
  const ringDistributionData = Object.entries(stats.ringCounts).map(([name, value]) => ({
    name,
    value,
    color: ringColors[name as MaturityRing].bg,
  }));

  const topTechData = technologies
    .slice(0, 8)
    .map((tech, index) => ({
      name: tech.name.length > 15 ? tech.name.slice(0, 15) + "..." : tech.name,
      score: tech.compositeScore,
      color: getTechColor(index),
    }));

  // Radar chart data for selected technology (using 0-2 scale)
  const radarChartData = selectedTech ? [
    { dimension: "Investment", value: selectedTech.investmentScore, fullMark: 2 },
    { dimension: "Employees", value: selectedTech.employeesScore, fullMark: 2 },
    { dimension: "TRL", value: selectedTech.trlScore, fullMark: 2 },
    { dimension: "Visibility", value: selectedTech.visibilityScore, fullMark: 2 },
  ] : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PlatformHeader />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PlatformHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-display text-foreground mb-2">Technology Radar</h1>
            <p className="text-muted-foreground">
              {technologies.length} technologies across maturity rings (real data from database)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          {/* Main Radar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-square max-w-2xl mx-auto p-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Background gradient circles */}
                    <circle cx="50" cy="50" r="46" fill="hsl(var(--muted) / 0.3)" />
                    <circle cx="50" cy="50" r="30" fill="hsl(var(--muted) / 0.2)" />
                    <circle cx="50" cy="50" r="15" fill="hsl(var(--muted) / 0.1)" />

                    {/* Ring circles */}
                    {[0.72, 0.45, 0.22].map((radius, i) => (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r={radius * 46}
                        fill="none"
                        stroke="hsl(var(--border))"
                        strokeWidth="0.3"
                        strokeDasharray={i === 0 ? "1.5,1.5" : "none"}
                      />
                    ))}

                    {/* Technology dots */}
                    {technologies.map((tech, index) => {
                      const pos = getPosition(tech, index);
                      const isSelected = selectedTechId === tech.id;
                      const isHovered = hoveredTechId === tech.id;
                      const isHighlighted = isSelected || isHovered;
                      const color = getTechColor(index);

                      return (
                        <g key={tech.id}>
                          {isHighlighted && (
                            <circle
                              cx={pos.x}
                              cy={pos.y}
                              r="3.5"
                              fill={color}
                              opacity="0.2"
                            />
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={isHighlighted ? 2 : 1.5}
                                fill={color}
                                className="cursor-pointer transition-all duration-200"
                                stroke={isHighlighted ? "hsl(var(--foreground))" : "none"}
                                strokeWidth={isHighlighted ? 0.4 : 0}
                                onClick={() => setSelectedTechId(tech.id)}
                                onMouseEnter={() => setHoveredTechId(tech.id)}
                                onMouseLeave={() => setHoveredTechId(null)}
                                onDoubleClick={() => openDetails(tech.id)}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="font-semibold text-foreground">{tech.name}</p>
                                  <span className="font-mono font-bold text-primary">{tech.compositeScore.toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">{tech.description}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">{getMaturityRing(tech.compositeScore)}</Badge>
                                  <Badge variant="outline" className="text-xs">{tech.dealroomCompanyCount} companies</Badge>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Ring labels */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <span className="text-[10px] text-success font-medium uppercase tracking-wide">Strong</span>
                  </div>
                  <div className="absolute top-[30%] left-1/2 -translate-x-1/2">
                    <span className="text-[10px] text-warning font-medium uppercase tracking-wide">Moderate</span>
                  </div>
                  <div className="absolute top-[12%] left-1/2 -translate-x-1/2">
                    <span className="text-[10px] text-destructive font-medium uppercase tracking-wide">Challenging</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Top Technologies Bar Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Top Technologies by Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={topTechData} layout="vertical" margin={{ left: 0, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" domain={[0, 2]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={80} />
                      <RechartsTooltip 
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                        formatter={(value: number) => value.toFixed(2)}
                      />
                      <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                        {topTechData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Distribution Pie Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Distribution by Maturity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="50%" height={120}>
                      <PieChart>
                        <Pie
                          data={ringDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={50}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {ringDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {ringDistributionData.map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                          <span className="text-xs text-muted-foreground">{item.name}: {item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Summary Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Overview</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold text-foreground">{stats.totalTechnologies}</p>
                  <p className="text-xs text-muted-foreground">Technologies</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold text-foreground">{stats.avgCompositeScore}</p>
                  <p className="text-xs text-muted-foreground">Avg Score</p>
                </div>
              </CardContent>
            </Card>

            {/* Maturity Rings */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Maturity Rings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(["Strong", "Moderate", "Challenging"] as MaturityRing[]).map((ring) => (
                  <div key={ring} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: ringColors[ring].bg }} />
                      <span className="text-sm text-foreground">{ring}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {stats.ringCounts[ring]}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Selected Technology */}
            {selectedTech ? (
              <Card className="border-primary/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-foreground">Selected</CardTitle>
                    <span className="font-mono font-bold text-lg text-primary">{selectedTech.compositeScore.toFixed(2)}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{selectedTech.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{selectedTech.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{getMaturityRing(selectedTech.compositeScore)}</Badge>
                    <Badge variant="outline">{selectedTech.dealroomCompanyCount} companies</Badge>
                    {selectedTech.documentMentionCount > 0 && (
                      <Badge variant="outline">{selectedTech.documentMentionCount} doc mentions</Badge>
                    )}
                  </div>

                  {/* Mini Radar Chart */}
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarChartData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <Radar
                          name="Score"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Score breakdown */}
                  <div className="grid grid-cols-5 gap-1 text-center">
                    {[
                      { label: "Inv", value: selectedTech.investmentScore },
                      { label: "Emp", value: selectedTech.employeesScore },
                      { label: "TRL", value: selectedTech.trlScore },
                      { label: "EU", value: selectedTech.euAlignmentScore },
                      { label: "Vis", value: selectedTech.visibilityScore },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-1">
                        <p className={cn("text-sm font-bold", MATURITY_SCORE_CONFIG[value as MaturityScore]?.color || "text-muted-foreground")}>
                          {value}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  </div>

                  <SignalIndicator 
                    signals={{
                      investment: selectedTech.investmentScore * 50,
                      patents: selectedTech.visibilityScore * 50,
                      media: selectedTech.documentMentionCount > 0 ? Math.min(100, selectedTech.documentMentionCount * 20) : 0,
                    }} 
                    showLabels 
                    size="sm" 
                  />

                  <Button className="w-full" size="sm" onClick={() => openDetails(selectedTech.id)}>
                    View Full Details
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">Click a technology to see details</p>
                </CardContent>
              </Card>
            )}

            {/* Technology List */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground">All Technologies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto space-y-1 pr-2">
                  {technologies.map((tech) => (
                    <button
                      key={tech.id}
                      onClick={() => setSelectedTechId(tech.id)}
                      onDoubleClick={() => openDetails(tech.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-2 rounded text-left text-sm hover:bg-muted/50 transition-colors",
                        selectedTechId === tech.id && "bg-primary/10"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ background: ringColors[getMaturityRing(tech.compositeScore)].bg }} 
                        />
                        <span className="truncate text-foreground">{tech.name}</span>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">{tech.compositeScore.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">{selectedTech?.name}</DialogTitle>
          </DialogHeader>
          {selectedTech && (
            <div className="space-y-6">
              <p className="text-muted-foreground">{selectedTech.description}</p>
              
              <div className="grid grid-cols-5 gap-4 text-center">
                {[
                  { label: "Investment", value: selectedTech.investmentScore },
                  { label: "Employees", value: selectedTech.employeesScore },
                  { label: "TRL", value: selectedTech.trlScore },
                  { label: "EU Align", value: selectedTech.euAlignmentScore },
                  { label: "Visibility", value: selectedTech.visibilityScore },
                ].map(({ label, value }) => (
                  <div key={label} className={cn("p-3 rounded-lg", MATURITY_SCORE_CONFIG[value as MaturityScore]?.bgColor || "bg-muted/50")}>
                    <p className={cn("text-2xl font-bold", MATURITY_SCORE_CONFIG[value as MaturityScore]?.color || "text-foreground")}>
                      {value}
                    </p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>

              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarChartData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Key Players</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedTech.keyPlayers && selectedTech.keyPlayers.length > 0 ? (
                      selectedTech.keyPlayers.map((player) => (
                        <Badge key={player} variant="outline" className="text-xs">{player}</Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No key players tracked yet</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Metrics</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>{selectedTech.dealroomCompanyCount} tracked companies</p>
                    <p>{formatFundingEur(selectedTech.totalFundingEur)} funding</p>
                    <p>{selectedTech.totalEmployees.toLocaleString()} employees</p>
                    {selectedTech.documentMentionCount > 0 && (
                      <p>{selectedTech.documentMentionCount} document mentions</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
