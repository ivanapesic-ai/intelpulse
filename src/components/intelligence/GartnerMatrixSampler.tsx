import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TechnologyIntelligence } from "@/hooks/useTechnologyIntelligence";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatFundingEur } from "@/types/database";

// Noise keywords to exclude from SDV ecosystem visualization
const EXCLUDED_KEYWORDS = [
  "smart city",
  "smart cities",
  "fleet management",
  "logistics",
  "maritime",
  "micromobility",
  "shipping",
  "aviation",
  "freight",
];

function isSDVRelevant(tech: TechnologyIntelligence): boolean {
  const name = tech.name.toLowerCase();
  return !EXCLUDED_KEYWORDS.some(keyword => name.includes(keyword));
}

interface GartnerMatrixSamplerProps {
  technologies: TechnologyIntelligence[];
  onSelectTechnology?: (tech: TechnologyIntelligence) => void;
  selectedId?: string | null;
}

// Get scores - use database values or derive from signals
function getScores(tech: TechnologyIntelligence): { challenge: number; opportunity: number } {
  if (tech.challengeScore !== null && tech.opportunityScore !== null) {
    return { challenge: tech.challengeScore, opportunity: tech.opportunityScore };
  }
  
  // Derive from signals
  let opportunityPoints = 0;
  if (tech.totalFundingEur > 50_000_000) opportunityPoints += 2;
  else if (tech.totalFundingEur > 10_000_000) opportunityPoints += 1;
  if (tech.dealroomCompanyCount > 50) opportunityPoints += 2;
  else if (tech.dealroomCompanyCount > 10) opportunityPoints += 1;
  if (tech.euAlignmentScore === 2) opportunityPoints += 2;
  else if (tech.euAlignmentScore === 1) opportunityPoints += 1;
  if (tech.documentMentionCount > 5) opportunityPoints += 1;
  const opportunity = opportunityPoints >= 5 ? 2 : opportunityPoints >= 3 ? 1 : 0;
  
  let challengePoints = 0;
  if (tech.trlScore === 2) challengePoints += 3;
  else if (tech.trlScore === 1) challengePoints += 1;
  if (tech.visibilityScore === 2) challengePoints += 2;
  else if (tech.visibilityScore === 1) challengePoints += 1;
  if (tech.totalPatents > 100) challengePoints -= 1;
  else if (tech.totalPatents < 10) challengePoints += 1;
  if (tech.totalEmployees > 10000) challengePoints += 1;
  const challenge = challengePoints >= 4 ? 2 : challengePoints >= 2 ? 1 : 0;
  
  return { challenge, opportunity };
}

// ============================================================================
// STYLE 1: Classic 2×2 Gartner Magic Quadrant
// ============================================================================
const QUADRANTS_2X2 = {
  leaders: { label: "Leaders", description: "High opportunity, low barriers", x: "right", y: "top" },
  challengers: { label: "Challengers", description: "Low opportunity, low barriers", x: "left", y: "top" },
  visionaries: { label: "Visionaries", description: "High opportunity, high barriers", x: "right", y: "bottom" },
  niche: { label: "Niche Players", description: "Low opportunity, high barriers", x: "left", y: "bottom" },
};

function Classic2x2Quadrant({ 
  technologies, 
  onSelectTechnology, 
  selectedId 
}: GartnerMatrixSamplerProps) {
  const positioned = useMemo(() => {
    const filtered = technologies.filter(isSDVRelevant);
    
    return filtered.map(tech => {
      const { challenge, opportunity } = getScores(tech);
      
      // Map 0-2 to position (0-100%)
      // Challenge: 0 = bottom (high barrier), 2 = top (low barrier)
      // Opportunity: 0 = left (low), 2 = right (high)
      const baseX = (opportunity / 2) * 100;
      const baseY = (challenge / 2) * 100;
      
      // Add jitter for overlap prevention
      const jitterX = (Math.random() - 0.5) * 15;
      const jitterY = (Math.random() - 0.5) * 15;
      
      return {
        tech,
        x: Math.max(5, Math.min(95, baseX + jitterX)),
        y: Math.max(5, Math.min(95, baseY + jitterY)),
        challenge,
        opportunity,
      };
    });
  }, [technologies]);

  return (
    <div className="relative w-full aspect-square max-w-2xl mx-auto">
      {/* Background gradient quadrants */}
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 rounded-xl overflow-hidden">
        {/* Top-left: Challengers */}
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-r border-b border-border/30 p-4">
          <span className="text-sm font-semibold text-amber-400">Challengers</span>
          <p className="text-xs text-muted-foreground">Low barriers, limited opportunity</p>
        </div>
        {/* Top-right: Leaders */}
        <div className="bg-gradient-to-br from-emerald-500/25 to-emerald-600/15 border-b border-border/30 p-4">
          <span className="text-sm font-semibold text-emerald-400">Leaders</span>
          <p className="text-xs text-muted-foreground">Low barriers, high opportunity</p>
        </div>
        {/* Bottom-left: Niche Players */}
        <div className="bg-gradient-to-br from-slate-500/15 to-slate-600/10 border-r border-border/30 p-4">
          <span className="text-sm font-semibold text-slate-400">Niche Players</span>
          <p className="text-xs text-muted-foreground">High barriers, limited opportunity</p>
        </div>
        {/* Bottom-right: Visionaries */}
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-4">
          <span className="text-sm font-semibold text-blue-400">Visionaries</span>
          <p className="text-xs text-muted-foreground">High barriers, high opportunity</p>
        </div>
      </div>

      {/* Axis labels */}
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-medium text-muted-foreground whitespace-nowrap">
        Ability to Execute →
      </div>
      <div className="absolute bottom-[-2rem] left-1/2 -translate-x-1/2 text-xs font-medium text-muted-foreground">
        Completeness of Vision →
      </div>

      {/* Tech bubbles */}
      <TooltipProvider>
        {positioned.map(({ tech, x, y }, i) => {
          const size = 28 + Math.min(tech.totalFundingEur / 50_000_000, 1) * 20;
          const isSelected = selectedId === tech.id;
          
          return (
            <Tooltip key={tech.id} delayDuration={0}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className={cn(
                    "absolute cursor-pointer rounded-full bg-primary/80 flex items-center justify-center text-[9px] font-bold text-primary-foreground shadow-lg hover:scale-110 transition-transform z-10",
                    isSelected && "ring-2 ring-white ring-offset-2 ring-offset-background scale-125 z-20"
                  )}
                  style={{
                    left: `${x}%`,
                    bottom: `${y}%`,
                    width: size,
                    height: size,
                    transform: "translate(-50%, 50%)",
                  }}
                  onClick={() => onSelectTechnology?.(tech)}
                >
                  {tech.name.slice(0, 2).toUpperCase()}
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">{tech.name}</p>
                <p className="text-xs text-muted-foreground">{formatFundingEur(tech.totalFundingEur)}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}

// ============================================================================
// STYLE 2: Extended 3×3 with Gartner Styling
// ============================================================================
const ZONES_3X3 = [
  { c: 2, o: 2, label: "Priority", color: "from-emerald-500/30 to-emerald-600/20", text: "text-emerald-400" },
  { c: 2, o: 1, label: "Grow", color: "from-emerald-500/20 to-emerald-600/10", text: "text-emerald-300" },
  { c: 1, o: 2, label: "Invest", color: "from-blue-500/25 to-blue-600/15", text: "text-blue-400" },
  { c: 1, o: 1, label: "Maintain", color: "from-sky-500/20 to-sky-600/10", text: "text-sky-400" },
  { c: 2, o: 0, label: "Harvest", color: "from-amber-500/15 to-amber-600/10", text: "text-amber-300" },
  { c: 0, o: 2, label: "Bet", color: "from-violet-500/25 to-violet-600/15", text: "text-violet-400" },
  { c: 1, o: 0, label: "Phase Out", color: "from-slate-500/15 to-slate-600/10", text: "text-slate-400" },
  { c: 0, o: 1, label: "Evaluate", color: "from-orange-500/20 to-orange-600/10", text: "text-orange-400" },
  { c: 0, o: 0, label: "Avoid", color: "from-rose-500/20 to-rose-600/10", text: "text-rose-400" },
];

function Extended3x3Grid({ 
  technologies, 
  onSelectTechnology, 
  selectedId 
}: GartnerMatrixSamplerProps) {
  const grouped = useMemo(() => {
    const cells: Record<string, TechnologyIntelligence[]> = {};
    technologies.filter(isSDVRelevant).forEach(tech => {
      const { challenge, opportunity } = getScores(tech);
      const key = `${challenge}-${opportunity}`;
      if (!cells[key]) cells[key] = [];
      cells[key].push(tech);
    });
    return cells;
  }, [technologies]);

  return (
    <div className="relative">
      {/* Axis labels */}
      <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-medium text-muted-foreground whitespace-nowrap">
        Challenge (Barriers) →
      </div>
      
      <div className="grid grid-cols-3 gap-2 ml-4">
        {/* Render from top-left to bottom-right, but logically C=2,O=0 is top-left */}
        {[2, 1, 0].map(c => (
          [0, 1, 2].map(o => {
            const zone = ZONES_3X3.find(z => z.c === c && z.o === o)!;
            const key = `${c}-${o}`;
            const techs = grouped[key] || [];
            
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "relative rounded-lg border border-border/30 p-3 min-h-[120px]",
                  "bg-gradient-to-br",
                  zone.color
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("text-xs font-semibold", zone.text)}>{zone.label}</span>
                  <Badge variant="secondary" className="text-[10px]">{techs.length}</Badge>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  <TooltipProvider>
                    {techs.slice(0, 8).map(tech => (
                      <Tooltip key={tech.id} delayDuration={0}>
                        <TooltipTrigger asChild>
                          <motion.div
                            whileHover={{ scale: 1.15 }}
                            className={cn(
                              "w-7 h-7 rounded-full bg-foreground/80 flex items-center justify-center text-[8px] font-bold text-background cursor-pointer",
                              selectedId === tech.id && "ring-2 ring-primary"
                            )}
                            onClick={() => onSelectTechnology?.(tech)}
                          >
                            {tech.name.slice(0, 2).toUpperCase()}
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-semibold">{tech.name}</p>
                          <p className="text-xs">{formatFundingEur(tech.totalFundingEur)}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {techs.length > 8 && (
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                        +{techs.length - 8}
                      </div>
                    )}
                  </TooltipProvider>
                </div>
              </motion.div>
            );
          })
        ))}
      </div>
      
      <div className="text-center mt-4 text-xs font-medium text-muted-foreground">
        Opportunity (Value) →
      </div>
    </div>
  );
}

// ============================================================================
// STYLE 3: Radar-Style with Quadrant Overlay
// ============================================================================
function HybridRadarQuadrant({ 
  technologies, 
  onSelectTechnology, 
  selectedId 
}: GartnerMatrixSamplerProps) {
  const positioned = useMemo(() => {
    const filtered = technologies.filter(isSDVRelevant);
    const centerX = 50;
    const centerY = 50;
    
    return filtered.map((tech, i) => {
      const { challenge, opportunity } = getScores(tech);
      
      // Convert to polar-ish coordinates
      // Angle based on opportunity (0 = left, 2 = right, wrapping around)
      const angle = (opportunity / 2) * Math.PI - Math.PI / 2;
      // Distance based on challenge (2 = center/mature, 0 = outer/emerging)
      const distance = 15 + (2 - challenge) * 15;
      
      // Add some spread based on index
      const spreadAngle = angle + ((i % 5) - 2) * 0.15;
      const spreadDist = distance + ((i % 3) - 1) * 5;
      
      const x = centerX + Math.cos(spreadAngle) * spreadDist;
      const y = centerY + Math.sin(spreadAngle) * spreadDist;
      
      return { tech, x, y, challenge, opportunity };
    });
  }, [technologies]);

  const rings = [
    { r: 15, label: "Mature" },
    { r: 30, label: "Scaling" },
    { r: 45, label: "Emerging" },
  ];

  return (
    <div className="relative w-full aspect-square max-w-xl mx-auto">
      {/* Quadrant backgrounds */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        {/* Quadrant fills */}
        <path d="M50,50 L50,5 A45,45 0 0,1 95,50 Z" fill="hsl(var(--emerald-500) / 0.15)" />
        <path d="M50,50 L95,50 A45,45 0 0,1 50,95 Z" fill="hsl(142 76% 36% / 0.1)" />
        <path d="M50,50 L50,95 A45,45 0 0,1 5,50 Z" fill="hsl(var(--slate-500) / 0.1)" />
        <path d="M50,50 L5,50 A45,45 0 0,1 50,5 Z" fill="hsl(var(--blue-500) / 0.1)" />
        
        {/* Rings */}
        {rings.map(({ r }, i) => (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
        ))}
        
        {/* Cross lines */}
        <line x1="50" y1="5" x2="50" y2="95" stroke="hsl(var(--border))" strokeWidth="0.5" />
        <line x1="5" y1="50" x2="95" y2="50" stroke="hsl(var(--border))" strokeWidth="0.5" />
      </svg>

      {/* Quadrant labels */}
      <div className="absolute top-2 right-4 text-xs font-semibold text-emerald-400">Leaders</div>
      <div className="absolute bottom-4 right-4 text-xs font-semibold text-emerald-300/70">Visionaries</div>
      <div className="absolute bottom-4 left-4 text-xs font-semibold text-slate-400">Niche</div>
      <div className="absolute top-2 left-4 text-xs font-semibold text-blue-400">Challengers</div>

      {/* Ring labels */}
      {rings.map(({ r, label }, i) => (
        <div 
          key={i}
          className="absolute text-[10px] text-muted-foreground/60"
          style={{ 
            left: `${50 + r}%`, 
            top: "48%",
            transform: "translateX(-50%)"
          }}
        >
          {label}
        </div>
      ))}

      {/* Tech bubbles */}
      <TooltipProvider>
        {positioned.map(({ tech, x, y }, i) => {
          const size = 24 + Math.min(tech.totalFundingEur / 50_000_000, 1) * 16;
          const isSelected = selectedId === tech.id;
          
          return (
            <Tooltip key={tech.id} delayDuration={0}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    "absolute cursor-pointer rounded-full bg-primary flex items-center justify-center text-[8px] font-bold text-primary-foreground shadow-md hover:scale-110 transition-transform",
                    isSelected && "ring-2 ring-white scale-125 z-20"
                  )}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    width: size,
                    height: size,
                    transform: "translate(-50%, -50%)",
                  }}
                  onClick={() => onSelectTechnology?.(tech)}
                >
                  {tech.name.slice(0, 2).toUpperCase()}
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">{tech.name}</p>
                <p className="text-xs">{formatFundingEur(tech.totalFundingEur)}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}

// ============================================================================
// MAIN SAMPLER COMPONENT
// ============================================================================
export function GartnerMatrixSampler(props: GartnerMatrixSamplerProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Gartner-Style Visualization Samples</CardTitle>
        <p className="text-sm text-muted-foreground">
          Compare different strategic positioning views for Challenge-Opportunity scoring
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="classic" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="classic">Classic 2×2</TabsTrigger>
            <TabsTrigger value="extended">Extended 3×3</TabsTrigger>
            <TabsTrigger value="hybrid">Hybrid Radar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="classic" className="mt-0">
            <div className="text-center mb-4">
              <Badge variant="outline">Magic Quadrant Style</Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Scores collapsed to High/Low for clean 4-zone layout
              </p>
            </div>
            <Classic2x2Quadrant {...props} />
          </TabsContent>
          
          <TabsContent value="extended" className="mt-0">
            <div className="text-center mb-4">
              <Badge variant="outline">9-Zone Strategic Grid</Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Full 0-2 scoring with action-oriented zone labels
              </p>
            </div>
            <Extended3x3Grid {...props} />
          </TabsContent>
          
          <TabsContent value="hybrid" className="mt-0">
            <div className="text-center mb-4">
              <Badge variant="outline">Radar + Quadrant Fusion</Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Maturity rings with strategic positioning overlay
              </p>
            </div>
            <HybridRadarQuadrant {...props} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
