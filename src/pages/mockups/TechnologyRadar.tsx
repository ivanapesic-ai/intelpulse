import { useState } from "react";
import { ArrowLeft, Download, Filter, Info, TrendingUp, TrendingDown, Minus, ExternalLink, X, Building2, FileText, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface Technology {
  id: string;
  name: string;
  quadrant: "cloud" | "edge" | "iot" | "ai";
  ring: "adopt" | "trial" | "assess" | "hold";
  score: number;
  description: string;
  trend: "up" | "down" | "stable";
  trl: number;
  marketAdoption: number;
  innovationActivity: number;
  euAlignment: number;
  keyPlayers: string[];
  patents: number;
  fundingEur: string;
  lastUpdated: string;
}

const sampleTechnologies: Technology[] = [
  { 
    id: "1", name: "Kubernetes", quadrant: "cloud", ring: "adopt", score: 8.5, 
    description: "Container orchestration platform for automating deployment, scaling, and management of containerized applications",
    trend: "up", trl: 9, marketAdoption: 85, innovationActivity: 72, euAlignment: 80,
    keyPlayers: ["Google", "Red Hat", "VMware", "CNCF"],
    patents: 1250, fundingEur: "€2.3B", lastUpdated: "2024-11-15"
  },
  { 
    id: "2", name: "Edge AI Inference", quadrant: "edge", ring: "trial", score: 6.8, 
    description: "On-device machine learning inference enabling real-time AI processing at the edge without cloud dependency",
    trend: "up", trl: 7, marketAdoption: 45, innovationActivity: 88, euAlignment: 75,
    keyPlayers: ["NVIDIA", "Intel", "Qualcomm", "NXP"],
    patents: 3420, fundingEur: "€4.1B", lastUpdated: "2024-11-20"
  },
  { 
    id: "3", name: "V2X Communication", quadrant: "iot", ring: "assess", score: 4.5, 
    description: "Vehicle-to-everything communication protocols enabling connected and autonomous vehicle ecosystems",
    trend: "up", trl: 5, marketAdoption: 15, innovationActivity: 92, euAlignment: 95,
    keyPlayers: ["Qualcomm", "Huawei", "Continental", "Bosch"],
    patents: 5680, fundingEur: "€1.8B", lastUpdated: "2024-11-18"
  },
  { 
    id: "4", name: "LLM Fine-tuning", quadrant: "ai", ring: "trial", score: 7.2, 
    description: "Domain-specific adaptation of large language models for specialized industry applications",
    trend: "up", trl: 6, marketAdoption: 55, innovationActivity: 95, euAlignment: 70,
    keyPlayers: ["OpenAI", "Anthropic", "Hugging Face", "Mistral AI"],
    patents: 890, fundingEur: "€8.5B", lastUpdated: "2024-11-22"
  },
  { 
    id: "5", name: "Serverless Functions", quadrant: "cloud", ring: "adopt", score: 8.1, 
    description: "Event-driven compute platform enabling scalable application development without infrastructure management",
    trend: "stable", trl: 9, marketAdoption: 78, innovationActivity: 58, euAlignment: 65,
    keyPlayers: ["AWS", "Azure", "Google Cloud", "Cloudflare"],
    patents: 780, fundingEur: "€1.2B", lastUpdated: "2024-11-10"
  },
  { 
    id: "6", name: "MEC Platforms", quadrant: "edge", ring: "assess", score: 5.2, 
    description: "Multi-access edge computing bringing compute and storage closer to end users at network edge",
    trend: "up", trl: 6, marketAdoption: 25, innovationActivity: 78, euAlignment: 85,
    keyPlayers: ["Nokia", "Ericsson", "AWS Wavelength", "Azure Edge"],
    patents: 2150, fundingEur: "€950M", lastUpdated: "2024-11-12"
  },
  { 
    id: "7", name: "Digital Twin", quadrant: "iot", ring: "trial", score: 6.5, 
    description: "Virtual representation of physical assets enabling simulation, monitoring and optimization",
    trend: "up", trl: 7, marketAdoption: 42, innovationActivity: 82, euAlignment: 88,
    keyPlayers: ["Siemens", "GE Digital", "PTC", "Dassault"],
    patents: 4230, fundingEur: "€2.1B", lastUpdated: "2024-11-14"
  },
  { 
    id: "8", name: "Computer Vision", quadrant: "ai", ring: "adopt", score: 8.3, 
    description: "AI-powered image and video analysis for object detection, recognition and scene understanding",
    trend: "stable", trl: 8, marketAdoption: 72, innovationActivity: 85, euAlignment: 75,
    keyPlayers: ["OpenCV", "NVIDIA", "Google Vision", "Amazon Rekognition"],
    patents: 8920, fundingEur: "€3.8B", lastUpdated: "2024-11-19"
  },
  { 
    id: "9", name: "Service Mesh", quadrant: "cloud", ring: "trial", score: 6.9, 
    description: "Infrastructure layer for managing service-to-service communication in microservices architectures",
    trend: "stable", trl: 7, marketAdoption: 48, innovationActivity: 65, euAlignment: 60,
    keyPlayers: ["Istio", "Linkerd", "Consul", "Kong"],
    patents: 420, fundingEur: "€580M", lastUpdated: "2024-11-08"
  },
  { 
    id: "10", name: "Edge Orchestration", quadrant: "edge", ring: "hold", score: 3.2, 
    description: "Distributed management and coordination of workloads across edge infrastructure",
    trend: "down", trl: 4, marketAdoption: 12, innovationActivity: 45, euAlignment: 55,
    keyPlayers: ["KubeEdge", "OpenYurt", "StarlingX"],
    patents: 280, fundingEur: "€120M", lastUpdated: "2024-10-25"
  },
  { 
    id: "11", name: "LoRaWAN", quadrant: "iot", ring: "adopt", score: 7.8, 
    description: "Long-range, low-power wireless protocol for IoT device connectivity in smart city and industrial applications",
    trend: "stable", trl: 9, marketAdoption: 68, innovationActivity: 52, euAlignment: 82,
    keyPlayers: ["Semtech", "The Things Network", "Actility", "Kerlink"],
    patents: 1890, fundingEur: "€450M", lastUpdated: "2024-11-05"
  },
  { 
    id: "12", name: "AutoML", quadrant: "ai", ring: "assess", score: 5.5, 
    description: "Automated machine learning pipelines for model selection, hyperparameter tuning and feature engineering",
    trend: "up", trl: 6, marketAdoption: 32, innovationActivity: 78, euAlignment: 68,
    keyPlayers: ["Google AutoML", "H2O.ai", "DataRobot", "Auto-sklearn"],
    patents: 1560, fundingEur: "€890M", lastUpdated: "2024-11-16"
  },
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

const ringTextColors = {
  adopt: "text-emerald-500",
  trial: "text-sky-500",
  assess: "text-amber-500",
  hold: "text-rose-500",
};

const quadrantColors = {
  cloud: "text-sky-400",
  edge: "text-violet-400",
  iot: "text-emerald-400",
  ai: "text-rose-400",
};

const quadrantBgColors = {
  cloud: "bg-sky-500/10",
  edge: "bg-violet-500/10",
  iot: "bg-emerald-500/10",
  ai: "bg-rose-500/10",
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

  const openDetails = (tech: Technology) => {
    setSelectedTech(tech);
    setDetailDialogOpen(true);
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
                  {/* Quadrant background fills */}
                  <path d="M50,50 L50,5 A45,45 0 0,1 95,50 Z" fill="hsl(var(--primary) / 0.03)" />
                  <path d="M50,50 L95,50 A45,45 0 0,1 50,95 Z" fill="hsl(var(--primary) / 0.05)" />
                  <path d="M50,50 L50,95 A45,45 0 0,1 5,50 Z" fill="hsl(var(--primary) / 0.03)" />
                  <path d="M50,50 L5,50 A45,45 0 0,1 50,5 Z" fill="hsl(var(--primary) / 0.05)" />

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
                        {/* Pulse animation for hovered/selected */}
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
                              className={`cursor-pointer transition-all duration-300 ${
                                isHighlighted
                                  ? "fill-primary stroke-primary"
                                  : `fill-current ${quadrantColors[tech.quadrant]} hover:stroke-primary`
                              }`}
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
                                  <Badge variant="outline" className="text-xs">
                                    {tech.score.toFixed(1)}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">{tech.description}</p>
                              <div className="flex items-center gap-2 pt-1 border-t border-border">
                                <Badge className={`text-xs ${ringColors[tech.ring]}`}>
                                  {tech.ring}
                                </Badge>
                                <span className={`text-xs font-medium capitalize ${quadrantColors[tech.quadrant]}`}>
                                  {tech.quadrant === "ai" ? "AI/ML" : tech.quadrant}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground italic">
                                Double-click for details
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                        
                        {/* Label for hovered tech */}
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
                  <span className="text-xs text-emerald-500 font-medium uppercase tracking-wider">
                    Adopt
                  </span>
                </div>
                <div className="absolute top-[30%] left-1/2 -translate-x-1/2 text-center">
                  <span className="text-xs text-sky-500 font-medium uppercase tracking-wider">
                    Trial
                  </span>
                </div>
                <div className="absolute top-[18%] left-1/2 -translate-x-1/2 text-center">
                  <span className="text-xs text-amber-500 font-medium uppercase tracking-wider">
                    Assess
                  </span>
                </div>
                <div className="absolute top-[6%] left-1/2 -translate-x-1/2 text-center">
                  <span className="text-xs text-rose-500 font-medium uppercase tracking-wider">
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
                    <span className={`text-sm capitalize font-medium ${ringTextColors[ring]}`}>{ring}</span>
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
              <Card className="border-primary/50 glow-primary animate-fade-in">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{selectedTech.name}</CardTitle>
                        <TrendIcon trend={selectedTech.trend} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedTech.description}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 -mt-1 -mr-2"
                      onClick={() => setSelectedTech(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={ringColors[selectedTech.ring]}>
                      {selectedTech.ring}
                    </Badge>
                    <Badge variant="outline" className={quadrantColors[selectedTech.quadrant]}>
                      {selectedTech.quadrant === "ai" ? "AI/ML" : selectedTech.quadrant}
                    </Badge>
                    <Badge variant="secondary" className="ml-auto">
                      TRL {selectedTech.trl}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Score</p>
                      <p className="text-2xl font-bold text-primary">{selectedTech.score.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Patents</p>
                      <p className="text-2xl font-bold">{selectedTech.patents.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Market Adoption</span>
                      <span className="font-medium">{selectedTech.marketAdoption}%</span>
                    </div>
                    <Progress value={selectedTech.marketAdoption} className="h-1.5" />
                  </div>

                  <div className="pt-2 border-t border-border">
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full"
                      onClick={() => openDetails(selectedTech)}
                    >
                      <Info className="h-4 w-4 mr-2" />
                      View Full Details
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
                    onDoubleClick={() => openDetails(tech)}
                    onMouseEnter={() => setHoveredTech(tech.id)}
                    onMouseLeave={() => setHoveredTech(null)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                      selectedTech?.id === tech.id
                        ? "bg-primary/10 text-primary"
                        : hoveredTech === tech.id
                        ? "bg-muted/80"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${ringColors[tech.ring]}`} />
                        <span className="font-medium">{tech.name}</span>
                        <TrendIcon trend={tech.trend} />
                      </div>
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

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedTech && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${quadrantBgColors[selectedTech.quadrant]}`}>
                    <Activity className={`h-5 w-5 ${quadrantColors[selectedTech.quadrant]}`} />
                  </div>
                  <div>
                    <DialogTitle className="text-xl flex items-center gap-2">
                      {selectedTech.name}
                      <TrendIcon trend={selectedTech.trend} />
                    </DialogTitle>
                    <DialogDescription>
                      {selectedTech.quadrant === "ai" ? "AI/ML" : selectedTech.quadrant.toUpperCase()} Quadrant • {selectedTech.ring.toUpperCase()} Ring
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Score Overview */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-3xl font-bold text-primary">{selectedTech.score.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Overall</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-3xl font-bold">{selectedTech.trl}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">TRL</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-3xl font-bold">{selectedTech.patents.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Patents</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{selectedTech.fundingEur}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Funding</p>
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Description
                  </h4>
                  <p className="text-muted-foreground">{selectedTech.description}</p>
                </div>

                {/* Scoring Breakdown */}
                <div>
                  <h4 className="font-semibold mb-4">Scoring Breakdown</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Market Adoption</span>
                        <span className="font-medium">{selectedTech.marketAdoption}%</span>
                      </div>
                      <Progress value={selectedTech.marketAdoption} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Innovation Activity</span>
                        <span className="font-medium">{selectedTech.innovationActivity}%</span>
                      </div>
                      <Progress value={selectedTech.innovationActivity} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>EU Strategic Alignment</span>
                        <span className="font-medium">{selectedTech.euAlignment}%</span>
                      </div>
                      <Progress value={selectedTech.euAlignment} className="h-2" />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Key Players */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Key Players
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTech.keyPlayers.map((player) => (
                      <Badge key={player} variant="secondary" className="text-sm">
                        {player}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border">
                  <span>Last updated: {selectedTech.lastUpdated}</span>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Sources
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
