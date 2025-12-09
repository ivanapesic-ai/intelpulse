import { useState } from "react";
import { ArrowLeft, Download, Filter, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Technology {
  id: string;
  name: string;
  quadrant: "cloud" | "edge" | "iot" | "ai";
  ring: "adopt" | "trial" | "assess" | "hold";
  score: number;
  description: string;
}

const sampleTechnologies: Technology[] = [
  { id: "1", name: "Kubernetes", quadrant: "cloud", ring: "adopt", score: 8.5, description: "Container orchestration platform" },
  { id: "2", name: "Edge AI Inference", quadrant: "edge", ring: "trial", score: 6.8, description: "On-device ML inference" },
  { id: "3", name: "V2X Communication", quadrant: "iot", ring: "assess", score: 4.5, description: "Vehicle-to-everything protocols" },
  { id: "4", name: "LLM Fine-tuning", quadrant: "ai", ring: "trial", score: 7.2, description: "Domain-specific language models" },
  { id: "5", name: "Serverless Functions", quadrant: "cloud", ring: "adopt", score: 8.1, description: "Event-driven compute" },
  { id: "6", name: "MEC Platforms", quadrant: "edge", ring: "assess", score: 5.2, description: "Multi-access edge computing" },
  { id: "7", name: "Digital Twin", quadrant: "iot", ring: "trial", score: 6.5, description: "Virtual asset representation" },
  { id: "8", name: "Computer Vision", quadrant: "ai", ring: "adopt", score: 8.3, description: "Image/video analysis" },
  { id: "9", name: "Service Mesh", quadrant: "cloud", ring: "trial", score: 6.9, description: "Microservices networking" },
  { id: "10", name: "Edge Orchestration", quadrant: "edge", ring: "hold", score: 3.2, description: "Distributed edge management" },
  { id: "11", name: "LoRaWAN", quadrant: "iot", ring: "adopt", score: 7.8, description: "Long-range IoT connectivity" },
  { id: "12", name: "AutoML", quadrant: "ai", ring: "assess", score: 5.5, description: "Automated machine learning" },
];

const ringRadii = {
  adopt: 0.2,
  trial: 0.4,
  assess: 0.6,
  hold: 0.8,
};

const quadrantAngles = {
  cloud: { start: -Math.PI / 2, end: 0 },
  edge: { start: 0, end: Math.PI / 2 },
  iot: { start: Math.PI / 2, end: Math.PI },
  ai: { start: Math.PI, end: (3 * Math.PI) / 2 },
};

const ringColors = {
  adopt: "bg-emerald-500",
  trial: "bg-sky-500",
  assess: "bg-amber-500",
  hold: "bg-rose-500",
};

const quadrantColors = {
  cloud: "text-sky-400",
  edge: "text-violet-400",
  iot: "text-emerald-400",
  ai: "text-rose-400",
};

export default function TechnologyRadar() {
  const [selectedTech, setSelectedTech] = useState<Technology | null>(null);
  const [activeQuadrants, setActiveQuadrants] = useState<Set<string>>(
    new Set(["cloud", "edge", "iot", "ai"])
  );

  const toggleQuadrant = (quadrant: string) => {
    const newActive = new Set(activeQuadrants);
    if (newActive.has(quadrant)) {
      newActive.delete(quadrant);
    } else {
      newActive.add(quadrant);
    }
    setActiveQuadrants(newActive);
  };

  const getPosition = (tech: Technology, index: number) => {
    const radius = ringRadii[tech.ring];
    const angles = quadrantAngles[tech.quadrant];
    const angleRange = angles.end - angles.start;
    const techsInQuadrantRing = sampleTechnologies.filter(
      (t) => t.quadrant === tech.quadrant && t.ring === tech.ring
    );
    const techIndex = techsInQuadrantRing.findIndex((t) => t.id === tech.id);
    const angleOffset = (angleRange / (techsInQuadrantRing.length + 1)) * (techIndex + 1);
    const angle = angles.start + angleOffset;

    const jitter = (radius * 0.15) * ((index % 3) - 1);
    const finalRadius = radius + jitter;

    return {
      x: 50 + Math.cos(angle) * finalRadius * 45,
      y: 50 + Math.sin(angle) * finalRadius * 45,
    };
  };

  const filteredTechnologies = sampleTechnologies.filter((tech) =>
    activeQuadrants.has(tech.quadrant)
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/mockups">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Technology Radar</h1>
              <p className="text-sm text-muted-foreground">ML-SDV Sphere • Q4 2024</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Radar Visualization */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-square max-w-2xl mx-auto p-8">
                {/* Radar Background */}
                <svg viewBox="0 0 100 100" className="w-full h-full">
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
                    return (
                      <Tooltip key={tech.id}>
                        <TooltipTrigger asChild>
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r={selectedTech?.id === tech.id ? 2.5 : 1.8}
                            className={`cursor-pointer transition-all duration-200 ${
                              selectedTech?.id === tech.id
                                ? "fill-primary stroke-primary"
                                : `fill-current ${quadrantColors[tech.quadrant]} hover:stroke-primary`
                            }`}
                            strokeWidth={selectedTech?.id === tech.id ? 1 : 0}
                            onClick={() => setSelectedTech(tech)}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            <p className="font-semibold">{tech.name}</p>
                            <p className="text-muted-foreground">{tech.description}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </svg>

                {/* Ring labels */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Adopt
                  </span>
                </div>
                <div className="absolute top-[30%] left-1/2 -translate-x-1/2 text-center">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Trial
                  </span>
                </div>
                <div className="absolute top-[18%] left-1/2 -translate-x-1/2 text-center">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Assess
                  </span>
                </div>
                <div className="absolute top-[6%] left-1/2 -translate-x-1/2 text-center">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Hold
                  </span>
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
          <div className="space-y-6">
            {/* Quadrant Filters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Quadrants</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {(["cloud", "edge", "iot", "ai"] as const).map((quadrant) => (
                  <Button
                    key={quadrant}
                    variant={activeQuadrants.has(quadrant) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleQuadrant(quadrant)}
                    className="capitalize"
                  >
                    {quadrant === "ai" ? "AI/ML" : quadrant}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Ring Legend */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Maturity Rings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(["adopt", "trial", "assess", "hold"] as const).map((ring) => (
                  <div key={ring} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${ringColors[ring]}`} />
                    <span className="text-sm capitalize font-medium">{ring}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {ring === "adopt" && "7.5-9.0"}
                      {ring === "trial" && "5.0-7.4"}
                      {ring === "assess" && "3.0-4.9"}
                      {ring === "hold" && "0.0-2.9"}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Selected Technology */}
            {selectedTech && (
              <Card className="border-primary/50 glow-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedTech.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedTech.description}
                      </p>
                    </div>
                    <Badge className={ringColors[selectedTech.ring]}>
                      {selectedTech.ring}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Quadrant</p>
                      <p className={`text-sm font-medium capitalize ${quadrantColors[selectedTech.quadrant]}`}>
                        {selectedTech.quadrant === "ai" ? "AI/ML" : selectedTech.quadrant}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Score</p>
                      <p className="text-sm font-medium">{selectedTech.score.toFixed(1)}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <Button variant="outline" size="sm" className="w-full">
                      <Info className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Technology List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Technologies ({filteredTechnologies.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-64 overflow-y-auto space-y-1">
                {filteredTechnologies.map((tech) => (
                  <button
                    key={tech.id}
                    onClick={() => setSelectedTech(tech)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedTech?.id === tech.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{tech.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {tech.score.toFixed(1)}
                      </Badge>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
