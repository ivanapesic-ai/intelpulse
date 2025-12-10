import { useState, useMemo } from "react";
import { Download, TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { QuadrantFilter } from "@/components/mockups/QuadrantFilter";
import { SignalIndicator } from "@/components/mockups/SignalIndicator";
import { technologies, Technology, TechnologyQuadrant, TechnologyRing, formatFunding, getStats } from "@/data/technologies";
import { cn } from "@/lib/utils";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell, PieChart, Pie } from "recharts";

const ringRadii: Record<TechnologyRing, number> = {
  Adopt: 0.22,
  Trial: 0.42,
  Assess: 0.62,
  Hold: 0.82,
};

const quadrantAngles: Record<TechnologyQuadrant, { start: number; end: number }> = {
  Cloud: { start: -Math.PI / 2, end: 0 },
  Edge: { start: 0, end: Math.PI / 2 },
  IoT: { start: Math.PI / 2, end: Math.PI },
  "AI/ML": { start: Math.PI, end: (3 * Math.PI) / 2 },
};

const ringColors: Record<TechnologyRing, { bg: string; text: string }> = {
  Adopt: { bg: "hsl(160 72% 35%)", text: "text-success" },
  Trial: { bg: "hsl(214 100% 49%)", text: "text-primary" },
  Assess: { bg: "hsl(38 92% 45%)", text: "text-warning" },
  Hold: { bg: "hsl(0 72% 50%)", text: "text-destructive" },
};

const quadrantColors: Record<TechnologyQuadrant, string> = {
  Cloud: "hsl(214 100% 49%)",
  Edge: "hsl(270 60% 50%)",
  IoT: "hsl(160 72% 35%)",
  "AI/ML": "hsl(350 70% 50%)",
};

export default function TechnologyRadar() {
  const [selectedTech, setSelectedTech] = useState<Technology | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [hoveredTech, setHoveredTech] = useState<string | null>(null);
  const [activeQuadrants, setActiveQuadrants] = useState<Set<TechnologyQuadrant>>(
    new Set(["Cloud", "Edge", "IoT", "AI/ML"])
  );

  const stats = getStats();

  const toggleQuadrant = (quadrant: TechnologyQuadrant) => {
    const newActive = new Set(activeQuadrants);
    if (newActive.has(quadrant)) {
      if (newActive.size > 1) newActive.delete(quadrant);
    } else {
      newActive.add(quadrant);
    }
    setActiveQuadrants(newActive);
  };

  const openDetails = (tech: Technology) => {
    setSelectedTech(tech);
    setDetailDialogOpen(true);
  };

  const filteredTechnologies = useMemo(() => {
    return technologies.filter((tech) => activeQuadrants.has(tech.quadrant));
  }, [activeQuadrants]);

  const getPosition = (tech: Technology, index: number) => {
    const radius = ringRadii[tech.ring];
    const angles = quadrantAngles[tech.quadrant];
    const angleRange = angles.end - angles.start;
    const techsInQuadrantRing = technologies.filter(
      (t) => t.quadrant === tech.quadrant && t.ring === tech.ring
    );
    const techIndex = techsInQuadrantRing.findIndex((t) => t.id === tech.id);
    const angleOffset = (angleRange / (techsInQuadrantRing.length + 1)) * (techIndex + 1);
    const angle = angles.start + angleOffset;
    const jitter = (radius * 0.08) * ((index % 3) - 1);
    const finalRadius = radius + jitter;

    return {
      x: 50 + Math.cos(angle) * finalRadius * 46,
      y: 50 + Math.sin(angle) * finalRadius * 46,
    };
  };

  const quadrantDistributionData = Object.entries(stats.quadrantCounts).map(([name, value]) => ({
    name,
    value,
    color: quadrantColors[name as TechnologyQuadrant],
  }));

  const ringDistributionData = Object.entries(stats.ringCounts).map(([name, value]) => ({
    name,
    value,
    color: ringColors[name as TechnologyRing].bg,
  }));

  const topTechData = filteredTechnologies
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 8)
    .map((tech) => ({
      name: tech.name.length > 15 ? tech.name.slice(0, 15) + "..." : tech.name,
      score: tech.compositeScore,
      color: quadrantColors[tech.quadrant],
    }));

  const radarChartData = selectedTech ? [
    { dimension: "TRL", value: selectedTech.trl, fullMark: 9 },
    { dimension: "Market", value: selectedTech.marketScore, fullMark: 9 },
    { dimension: "Innovation", value: selectedTech.innovationScore, fullMark: 9 },
    { dimension: "EU Align", value: selectedTech.euAlignmentScore, fullMark: 9 },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      <PlatformHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-display text-foreground mb-2">Technology Radar</h1>
            <p className="text-muted-foreground">
              {filteredTechnologies.length} technologies across maturity rings and domain quadrants
            </p>
          </div>
          <div className="flex items-center gap-3">
            <QuadrantFilter activeQuadrants={activeQuadrants} onToggle={toggleQuadrant} />
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
                    {/* Background quadrants */}
                    <path d="M50,50 L50,4 A46,46 0 0,1 96,50 Z" fill="hsl(214 100% 49% / 0.06)" stroke="hsl(var(--border))" strokeWidth="0.2" />
                    <path d="M50,50 L96,50 A46,46 0 0,1 50,96 Z" fill="hsl(270 60% 50% / 0.06)" stroke="hsl(var(--border))" strokeWidth="0.2" />
                    <path d="M50,50 L50,96 A46,46 0 0,1 4,50 Z" fill="hsl(160 72% 35% / 0.06)" stroke="hsl(var(--border))" strokeWidth="0.2" />
                    <path d="M50,50 L4,50 A46,46 0 0,1 50,4 Z" fill="hsl(350 70% 50% / 0.06)" stroke="hsl(var(--border))" strokeWidth="0.2" />

                    {/* Ring circles */}
                    {[0.82, 0.62, 0.42, 0.22].map((radius, i) => (
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

                    {/* Axis lines */}
                    <line x1="50" y1="4" x2="50" y2="96" stroke="hsl(var(--border))" strokeWidth="0.3" />
                    <line x1="4" y1="50" x2="96" y2="50" stroke="hsl(var(--border))" strokeWidth="0.3" />

                    {/* Technology dots */}
                    {filteredTechnologies.map((tech, index) => {
                      const pos = getPosition(tech, index);
                      const isSelected = selectedTech?.id === tech.id;
                      const isHovered = hoveredTech === tech.id;
                      const isHighlighted = isSelected || isHovered;

                      return (
                        <g key={tech.id}>
                          {isHighlighted && (
                            <circle
                              cx={pos.x}
                              cy={pos.y}
                              r="3.5"
                              fill={quadrantColors[tech.quadrant]}
                              opacity="0.2"
                            />
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={isHighlighted ? 2 : 1.5}
                                fill={quadrantColors[tech.quadrant]}
                                className="cursor-pointer transition-all duration-200"
                                stroke={isHighlighted ? "hsl(var(--foreground))" : "none"}
                                strokeWidth={isHighlighted ? 0.4 : 0}
                                onClick={() => setSelectedTech(tech)}
                                onMouseEnter={() => setHoveredTech(tech.id)}
                                onMouseLeave={() => setHoveredTech(null)}
                                onDoubleClick={() => openDetails(tech)}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="font-semibold text-foreground">{tech.name}</p>
                                  <span className="font-mono font-bold text-primary">{tech.compositeScore.toFixed(1)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">{tech.description}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">{tech.quadrant}</Badge>
                                  <Badge variant="outline" className="text-xs">{tech.ring}</Badge>
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
                    <span className="text-[10px] text-success font-medium uppercase tracking-wide">Adopt</span>
                  </div>
                  <div className="absolute top-[30%] left-1/2 -translate-x-1/2">
                    <span className="text-[10px] text-primary font-medium uppercase tracking-wide">Trial</span>
                  </div>
                  <div className="absolute top-[18%] left-1/2 -translate-x-1/2">
                    <span className="text-[10px] text-warning font-medium uppercase tracking-wide">Assess</span>
                  </div>
                  <div className="absolute top-[8%] left-1/2 -translate-x-1/2">
                    <span className="text-[10px] text-destructive font-medium uppercase tracking-wide">Hold</span>
                  </div>

                  {/* Quadrant labels */}
                  <div className="absolute top-3 right-3 text-xs font-semibold text-primary">Cloud</div>
                  <div className="absolute bottom-3 right-3 text-xs font-semibold" style={{ color: "hsl(270 60% 50%)" }}>Edge</div>
                  <div className="absolute bottom-3 left-3 text-xs font-semibold text-success">IoT</div>
                  <div className="absolute top-3 left-3 text-xs font-semibold" style={{ color: "hsl(350 70% 50%)" }}>AI/ML</div>
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
                      <XAxis type="number" domain={[0, 9]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={80} />
                      <RechartsTooltip 
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
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

              {/* Distribution Pie Charts */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground text-center mb-2">By Quadrant</p>
                      <ResponsiveContainer width="100%" height={100}>
                        <PieChart>
                          <Pie
                            data={quadrantDistributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={25}
                            outerRadius={40}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {quadrantDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground text-center mb-2">By Maturity</p>
                      <ResponsiveContainer width="100%" height={100}>
                        <PieChart>
                          <Pie
                            data={ringDistributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={25}
                            outerRadius={40}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {ringDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
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
                  <p className="text-2xl font-bold text-foreground">{stats.avgTrl}</p>
                  <p className="text-xs text-muted-foreground">Avg TRL</p>
                </div>
              </CardContent>
            </Card>

            {/* Maturity Rings */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Maturity Rings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(["Adopt", "Trial", "Assess", "Hold"] as TechnologyRing[]).map((ring) => (
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
                    <span className="font-mono font-bold text-lg text-primary">{selectedTech.compositeScore.toFixed(1)}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{selectedTech.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{selectedTech.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{selectedTech.quadrant}</Badge>
                    <Badge variant="outline">{selectedTech.ring}</Badge>
                    <Badge variant="outline">TRL {selectedTech.trl}</Badge>
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

                  <SignalIndicator signals={selectedTech.signals} showLabels size="sm" />

                  <Button className="w-full" size="sm" onClick={() => openDetails(selectedTech)}>
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
                  {filteredTechnologies
                    .sort((a, b) => b.compositeScore - a.compositeScore)
                    .map((tech) => (
                      <button
                        key={tech.id}
                        onClick={() => setSelectedTech(tech)}
                        onDoubleClick={() => openDetails(tech)}
                        className={cn(
                          "w-full flex items-center justify-between p-2 rounded text-left text-sm hover:bg-muted/50 transition-colors",
                          selectedTech?.id === tech.id && "bg-primary/10"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ringColors[tech.ring].bg }} />
                          <span className="truncate text-foreground">{tech.name}</span>
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">{tech.compositeScore.toFixed(1)}</span>
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
              
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-foreground">{selectedTech.trl}</p>
                  <p className="text-xs text-muted-foreground">TRL</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-foreground">{selectedTech.marketScore.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Market</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-foreground">{selectedTech.innovationScore.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Innovation</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-foreground">{selectedTech.euAlignmentScore.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">EU Align</p>
                </div>
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
                    {selectedTech.keyPlayers.map((player) => (
                      <Badge key={player} variant="outline" className="text-xs">{player}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Metrics</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>{selectedTech.patents.toLocaleString()} patents</p>
                    <p>{formatFunding(selectedTech.fundingEur)} funding</p>
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