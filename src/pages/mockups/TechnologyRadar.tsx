import { useState, useMemo } from "react";
import { Download, TrendingUp, TrendingDown, Minus, FileText, DollarSign, Users, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { QuadrantFilter } from "@/components/mockups/QuadrantFilter";
import { SignalIndicator } from "@/components/mockups/SignalIndicator";
import { ScoreBadge } from "@/components/mockups/ScoreBadge";
import { technologies, Technology, TechnologyQuadrant, TechnologyRing, formatFunding, getStats } from "@/data/technologies";
import { cn } from "@/lib/utils";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";

const ringRadii: Record<TechnologyRing, number> = {
  Adopt: 0.2,
  Trial: 0.4,
  Assess: 0.6,
  Hold: 0.8,
};

const quadrantAngles: Record<TechnologyQuadrant, { start: number; end: number }> = {
  Cloud: { start: -Math.PI / 2, end: 0 },
  Edge: { start: 0, end: Math.PI / 2 },
  IoT: { start: Math.PI / 2, end: Math.PI },
  "AI/ML": { start: Math.PI, end: (3 * Math.PI) / 2 },
};

const ringColors: Record<TechnologyRing, string> = {
  Adopt: "bg-emerald-500",
  Trial: "bg-sky-500",
  Assess: "bg-amber-500",
  Hold: "bg-rose-500",
};

const ringTextColors: Record<TechnologyRing, string> = {
  Adopt: "text-emerald-500",
  Trial: "text-sky-500",
  Assess: "text-amber-500",
  Hold: "text-rose-500",
};

const quadrantColors: Record<TechnologyQuadrant, string> = {
  Cloud: "text-sky-400",
  Edge: "text-violet-400",
  IoT: "text-emerald-400",
  "AI/ML": "text-rose-400",
};

const quadrantFillColors: Record<TechnologyQuadrant, string> = {
  Cloud: "fill-sky-400",
  Edge: "fill-violet-400",
  IoT: "fill-emerald-400",
  "AI/ML": "fill-rose-400",
};

const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) => {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-rose-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
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

    const jitter = (radius * 0.12) * ((index % 3) - 1);
    const finalRadius = radius + jitter;

    return {
      x: 50 + Math.cos(angle) * finalRadius * 45,
      y: 50 + Math.sin(angle) * finalRadius * 45,
    };
  };

  const radarChartData = selectedTech ? [
    { dimension: "TRL", value: selectedTech.trl },
    { dimension: "Market", value: selectedTech.marketScore },
    { dimension: "Innovation", value: selectedTech.innovationScore },
    { dimension: "EU Align", value: selectedTech.euAlignmentScore },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      <PlatformHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Technology Radar</h1>
            <p className="text-muted-foreground">
              Visualizing {filteredTechnologies.length} technologies across maturity rings and domain quadrants
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

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* Radar Visualization */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-square max-w-2xl mx-auto p-6">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Quadrant background fills */}
                  <path d="M50,50 L50,5 A45,45 0 0,1 95,50 Z" fill="hsl(200 80% 50% / 0.05)" />
                  <path d="M50,50 L95,50 A45,45 0 0,1 50,95 Z" fill="hsl(270 80% 50% / 0.05)" />
                  <path d="M50,50 L50,95 A45,45 0 0,1 5,50 Z" fill="hsl(150 80% 50% / 0.05)" />
                  <path d="M50,50 L5,50 A45,45 0 0,1 50,5 Z" fill="hsl(350 80% 50% / 0.05)" />

                  {/* Ring circles */}
                  {[0.8, 0.6, 0.4, 0.2].map((radius, i) => (
                    <circle
                      key={i}
                      cx="50"
                      cy="50"
                      r={radius * 45}
                      fill="none"
                      stroke="hsl(var(--border))"
                      strokeWidth="0.3"
                      strokeDasharray={i === 0 ? "2,2" : "none"}
                    />
                  ))}

                  {/* Quadrant lines */}
                  <line x1="50" y1="5" x2="50" y2="95" stroke="hsl(var(--border))" strokeWidth="0.3" />
                  <line x1="5" y1="50" x2="95" y2="50" stroke="hsl(var(--border))" strokeWidth="0.3" />

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
                            r="4"
                            className="fill-primary/20 animate-pulse"
                          />
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <circle
                              cx={pos.x}
                              cy={pos.y}
                              r={isHighlighted ? 2.5 : 1.8}
                              className={cn(
                                "cursor-pointer transition-all duration-300",
                                isHighlighted
                                  ? "fill-primary stroke-primary"
                                  : cn("fill-current hover:stroke-primary", quadrantColors[tech.quadrant])
                              )}
                              strokeWidth={isHighlighted ? 1 : 0}
                              onClick={() => setSelectedTech(tech)}
                              onMouseEnter={() => setHoveredTech(tech.id)}
                              onMouseLeave={() => setHoveredTech(null)}
                              onDoubleClick={() => openDetails(tech)}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-semibold">{tech.name}</p>
                                <div className="flex items-center gap-1">
                                  <TrendIcon trend={tech.trend} />
                                  <ScoreBadge score={tech.compositeScore} size="sm" />
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">{tech.description}</p>
                              <div className="flex items-center gap-2 pt-1 border-t border-border">
                                <Badge className={cn("text-xs", ringColors[tech.ring])}>
                                  {tech.ring}
                                </Badge>
                                <span className={cn("text-xs font-medium", quadrantColors[tech.quadrant])}>
                                  {tech.quadrant}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground italic">Double-click for details</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>

                        {isHovered && !isSelected && (
                          <text
                            x={pos.x}
                            y={pos.y - 4}
                            textAnchor="middle"
                            className="fill-foreground text-[2.5px] font-medium pointer-events-none"
                          >
                            {tech.name}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Ring labels */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <span className="text-xs text-emerald-500 font-medium uppercase tracking-wider">Adopt</span>
                </div>
                <div className="absolute top-[30%] left-1/2 -translate-x-1/2 text-center">
                  <span className="text-xs text-sky-500 font-medium uppercase tracking-wider">Trial</span>
                </div>
                <div className="absolute top-[18%] left-1/2 -translate-x-1/2 text-center">
                  <span className="text-xs text-amber-500 font-medium uppercase tracking-wider">Assess</span>
                </div>
                <div className="absolute top-[6%] left-1/2 -translate-x-1/2 text-center">
                  <span className="text-xs text-rose-500 font-medium uppercase tracking-wider">Hold</span>
                </div>

                {/* Quadrant labels */}
                <div className="absolute top-4 right-4 text-sky-400 font-semibold text-sm">Cloud</div>
                <div className="absolute bottom-4 right-4 text-violet-400 font-semibold text-sm">Edge</div>
                <div className="absolute bottom-4 left-4 text-emerald-400 font-semibold text-sm">IoT</div>
                <div className="absolute top-4 left-4 text-rose-400 font-semibold text-sm">AI/ML</div>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Overview</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{stats.totalTechnologies}</p>
                  <p className="text-xs text-muted-foreground">Technologies</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{stats.avgTrl}</p>
                  <p className="text-xs text-muted-foreground">Avg TRL</p>
                </div>
              </CardContent>
            </Card>

            {/* Ring Legend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Maturity Rings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(["Adopt", "Trial", "Assess", "Hold"] as TechnologyRing[]).map((ring) => (
                  <div key={ring} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-3 h-3 rounded-full", ringColors[ring])} />
                      <span className="text-sm">{ring}</span>
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
                    <CardTitle className="text-sm font-medium">Selected Technology</CardTitle>
                    <ScoreBadge score={selectedTech.compositeScore} size="md" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-1">{selectedTech.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{selectedTech.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={quadrantColors[selectedTech.quadrant]}>
                      {selectedTech.quadrant}
                    </Badge>
                    <Badge className={ringColors[selectedTech.ring]}>{selectedTech.ring}</Badge>
                    <Badge variant="outline">TRL {selectedTech.trl}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 rounded bg-muted/50">
                      <p className="font-mono font-semibold">{selectedTech.marketScore.toFixed(1)}</p>
                      <p className="text-muted-foreground">Market</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="font-mono font-semibold">{selectedTech.innovationScore.toFixed(1)}</p>
                      <p className="text-muted-foreground">Innovation</p>
                    </div>
                  </div>

                  <SignalIndicator signals={selectedTech.signals} showLabels size="sm" />

                  <Button className="w-full" size="sm" onClick={() => openDetails(selectedTech)}>
                    View Full Details
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">Click a technology dot to see details</p>
                </CardContent>
              </Card>
            )}

            {/* Technology List */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">All Technologies ({filteredTechnologies.length})</CardTitle>
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
                          <span className={cn("w-2 h-2 rounded-full shrink-0", ringColors[tech.ring])} />
                          <span className="truncate">{tech.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <TrendIcon trend={tech.trend} />
                          <span className="font-mono text-xs">{tech.compositeScore.toFixed(1)}</span>
                        </div>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedTech && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-2xl">{selectedTech.name}</span>
                  <ScoreBadge score={selectedTech.compositeScore} size="lg" />
                </DialogTitle>
              </DialogHeader>

              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-6">
                  <div>
                    <p className="text-muted-foreground mb-4">{selectedTech.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{selectedTech.quadrant}</Badge>
                      <Badge className={ringColors[selectedTech.ring]}>{selectedTech.ring}</Badge>
                      <Badge variant="outline">{selectedTech.category}</Badge>
                      <Badge variant="outline">TRL {selectedTech.trl}</Badge>
                    </div>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Score Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarChartData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="dimension" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                            <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                            <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Key Players
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedTech.keyPlayers.map((player) => (
                          <Badge key={player} variant="secondary">{player}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Signal Strength</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SignalIndicator signals={selectedTech.signals} showLabels size="md" />
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Patents</span>
                        </div>
                        <p className="text-2xl font-bold">{selectedTech.patents.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Funding</span>
                        </div>
                        <p className="text-2xl font-bold">{formatFunding(selectedTech.fundingEur)}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Challenge-Opportunity Matrix</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 rounded bg-muted/50">
                          <p className="text-2xl font-bold">{selectedTech.challengeScore}/2</p>
                          <p className="text-xs text-muted-foreground">Challenge Score</p>
                          <p className="text-xs mt-1">
                            {selectedTech.challengeScore === 2 ? "No Major Barriers" : selectedTech.challengeScore === 1 ? "Manageable" : "Severe"}
                          </p>
                        </div>
                        <div className="text-center p-3 rounded bg-muted/50">
                          <p className="text-2xl font-bold">{selectedTech.opportunityScore}/2</p>
                          <p className="text-xs text-muted-foreground">Opportunity Score</p>
                          <p className="text-xs mt-1">
                            {selectedTech.opportunityScore === 2 ? "High Value" : selectedTech.opportunityScore === 1 ? "Promising" : "Limited"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Last updated: {selectedTech.lastUpdated}
                    </span>
                    <span className="flex items-center gap-1">
                      Trend: <TrendIcon trend={selectedTech.trend} />
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
