import { useState, useMemo } from "react";
import { Search, TrendingUp, TrendingDown, Minus, FileText, DollarSign, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { TechnologyCard } from "@/components/mockups/TechnologyCard";
import { SignalIndicator } from "@/components/mockups/SignalIndicator";
import { ScoreBadge } from "@/components/mockups/ScoreBadge";
import { QuadrantFilter } from "@/components/mockups/QuadrantFilter";
import { technologies, Technology, TechnologyQuadrant, TechnologyRing, formatFunding } from "@/data/technologies";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from "recharts";

const ringOptions: TechnologyRing[] = ["Adopt", "Trial", "Assess", "Hold"];

export default function TechnologyExplorer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuadrants, setActiveQuadrants] = useState<Set<TechnologyQuadrant>>(new Set(["Cloud", "Edge", "IoT", "AI/ML"]));
  const [activeRings, setActiveRings] = useState<Set<TechnologyRing>>(new Set(ringOptions));
  const [sortBy, setSortBy] = useState<"composite" | "trl" | "market" | "innovation" | "eu">("composite");
  const [selectedTech, setSelectedTech] = useState<Technology | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const toggleQuadrant = (quadrant: TechnologyQuadrant) => {
    const next = new Set(activeQuadrants);
    if (next.has(quadrant)) {
      if (next.size > 1) next.delete(quadrant);
    } else {
      next.add(quadrant);
    }
    setActiveQuadrants(next);
  };

  const toggleRing = (ring: TechnologyRing) => {
    const next = new Set(activeRings);
    if (next.has(ring)) {
      if (next.size > 1) next.delete(ring);
    } else {
      next.add(ring);
    }
    setActiveRings(next);
  };

  const filteredTechnologies = useMemo(() => {
    return technologies
      .filter((tech) => {
        const matchesSearch =
          tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tech.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tech.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesQuadrant = activeQuadrants.has(tech.quadrant);
        const matchesRing = activeRings.has(tech.ring);
        return matchesSearch && matchesQuadrant && matchesRing;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "trl":
            return b.trl - a.trl;
          case "market":
            return b.marketScore - a.marketScore;
          case "innovation":
            return b.innovationScore - a.innovationScore;
          case "eu":
            return b.euAlignmentScore - a.euAlignmentScore;
          default:
            return b.compositeScore - a.compositeScore;
        }
      });
  }, [searchQuery, activeQuadrants, activeRings, sortBy]);

  const openDetail = (tech: Technology) => {
    setSelectedTech(tech);
    setDetailOpen(true);
  };

  const radarData = selectedTech
    ? [
        { dimension: "TRL", value: selectedTech.trl, fullMark: 10 },
        { dimension: "Market", value: selectedTech.marketScore, fullMark: 10 },
        { dimension: "Innovation", value: selectedTech.innovationScore, fullMark: 10 },
        { dimension: "EU Align", value: selectedTech.euAlignmentScore, fullMark: 10 },
      ]
    : [];

  const trendData = selectedTech
    ? [
        { month: "Jul", score: selectedTech.compositeScore - 0.8 },
        { month: "Aug", score: selectedTech.compositeScore - 0.5 },
        { month: "Sep", score: selectedTech.compositeScore - 0.3 },
        { month: "Oct", score: selectedTech.compositeScore - 0.1 },
        { month: "Nov", score: selectedTech.compositeScore },
        { month: "Dec", score: selectedTech.compositeScore + 0.1 },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background">
      <PlatformHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Technology Explorer</h1>
          <p className="text-muted-foreground">
            Search, filter, and analyze {technologies.length} technologies in the ML-SDV sphere
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
                    placeholder="Search technologies, categories, or descriptions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <QuadrantFilter activeQuadrants={activeQuadrants} onToggle={toggleQuadrant} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
              <span className="text-sm text-muted-foreground mr-2">Maturity:</span>
              {ringOptions.map((ring) => (
                <Button
                  key={ring}
                  variant={activeRings.has(ring) ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => toggleRing(ring)}
                  className="h-7 text-xs"
                >
                  {ring}
                </Button>
              ))}
              <div className="flex-1" />
              <span className="text-sm text-muted-foreground mr-2">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="h-7 text-xs rounded border border-border bg-background px-2 text-foreground"
              >
                <option value="composite">Composite Score</option>
                <option value="trl">TRL</option>
                <option value="market">Market</option>
                <option value="innovation">Innovation</option>
                <option value="eu">EU Alignment</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredTechnologies.length} of {technologies.length} technologies
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTechnologies.map((tech) => (
            <TechnologyCard key={tech.id} technology={tech} onClick={() => openDetail(tech)} />
          ))}
        </div>

        {filteredTechnologies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No technologies match your filters</p>
            <Button
              variant="ghost"
              className="mt-2"
              onClick={() => {
                setSearchQuery("");
                setActiveQuadrants(new Set(["Cloud", "Edge", "IoT", "AI/ML"]));
                setActiveRings(new Set(ringOptions));
              }}
            >
              Clear filters
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
                  <ScoreBadge score={selectedTech.compositeScore} size="lg" />
                </DialogTitle>
              </DialogHeader>

              <div className="grid md:grid-cols-2 gap-6 mt-4">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <p className="text-muted-foreground mb-4">{selectedTech.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{selectedTech.quadrant}</Badge>
                      <Badge variant="outline">{selectedTech.ring}</Badge>
                      <Badge variant="outline">{selectedTech.category}</Badge>
                      <Badge variant="outline">TRL {selectedTech.trl}</Badge>
                    </div>
                  </div>

                  {/* Radar Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-foreground">Score Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="dimension" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                            <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                            <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Key Players */}
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
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Signals */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-foreground">Signal Strength</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SignalIndicator signals={selectedTech.signals} showLabels size="md" />
                    </CardContent>
                  </Card>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Patents</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{selectedTech.patents.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Funding</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{formatFunding(selectedTech.fundingEur)}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Trend Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-foreground">Score Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trendData}>
                            <XAxis
                              dataKey="month"
                              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} tick={false} axisLine={false} />
                            <Area
                              type="monotone"
                              dataKey="score"
                              stroke="hsl(var(--primary))"
                              fill="hsl(var(--primary))"
                              fillOpacity={0.2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Challenge-Opportunity */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm text-foreground">Challenge-Opportunity Matrix</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 rounded bg-muted/50 border border-border">
                          <p className="text-2xl font-bold text-foreground">{selectedTech.challengeScore}/2</p>
                          <p className="text-xs text-muted-foreground">Challenge Score</p>
                          <p className="text-xs mt-1 text-foreground">
                            {selectedTech.challengeScore === 2
                              ? "No Major Barriers"
                              : selectedTech.challengeScore === 1
                              ? "Manageable"
                              : "Severe"}
                          </p>
                        </div>
                        <div className="text-center p-3 rounded bg-muted/50 border border-border">
                          <p className="text-2xl font-bold text-foreground">{selectedTech.opportunityScore}/2</p>
                          <p className="text-xs text-muted-foreground">Opportunity Score</p>
                          <p className="text-xs mt-1 text-foreground">
                            {selectedTech.opportunityScore === 2
                              ? "High Value"
                              : selectedTech.opportunityScore === 1
                              ? "Promising"
                              : "Limited"}
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
                      Trend:{" "}
                      {selectedTech.trend === "up" ? (
                        <TrendingUp className="h-3 w-3 text-success" />
                      ) : selectedTech.trend === "down" ? (
                        <TrendingDown className="h-3 w-3 text-destructive" />
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
