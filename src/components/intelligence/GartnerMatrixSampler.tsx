import { useMemo } from "react";
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
  "smart recharging",
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

// Maturity ring helper for multiple visualizations
type MaturityRing = "Strong" | "Moderate" | "Challenging";

function getMaturityRingFromComposite(compositeScore: number): MaturityRing {
  if (compositeScore >= 1.5) return "Strong";
  if (compositeScore >= 0.5) return "Moderate";
  return "Challenging";
}

const ringColors: Record<MaturityRing, string> = {
  Strong: "hsl(160 72% 35%)",
  Moderate: "hsl(38 92% 45%)",
  Challenging: "hsl(0 72% 50%)",
};

// ============================================================================
// STYLE 1: Classic 2×2 Gartner Magic Quadrant
// ============================================================================
// Client's C-O Matrix naming convention
// X-axis: Challenge (left=low, right=high)
// Y-axis: Opportunity (bottom=low, top=high)

function Classic2x2Quadrant({ 
  technologies, 
  onSelectTechnology, 
  selectedId 
}: GartnerMatrixSamplerProps) {
  const positioned = useMemo(() => {
    const filtered = technologies.filter(isSDVRelevant);
    
    return filtered.map((tech, index) => {
      const { challenge, opportunity } = getScores(tech);
      
      // Use 3-signal model to spread bubbles within quadrants
      // Signal 1: Investment (0-2) → horizontal micro-offset
      // Signal 2: Patents (0-2) → vertical micro-offset  
      // Signal 3: Media/visibility (0-2) → diagonal offset
      const investmentSignal = tech.investmentScore ?? 0;
      const patentSignal = tech.totalPatents >= 100 ? 2 : tech.totalPatents >= 20 ? 1 : 0;
      const mediaSignal = tech.visibilityScore ?? 0;
      
      // Base position from C-O scores (inverted challenge axis)
      // Challenge 0 (Severe) → RIGHT, Challenge 2 (Easy) → LEFT
      const baseX = 15 + ((2 - challenge) / 2) * 70;
      const baseY = 15 + (opportunity / 2) * 70;
      
      // Signal-based spreading (±10% offset based on actual data)
      const signalOffsetX = ((investmentSignal - 1) / 2) * 15; // -7.5 to +7.5
      const signalOffsetY = ((patentSignal - 1) / 2) * 15;     // -7.5 to +7.5
      const mediaOffset = ((mediaSignal - 1) / 2) * 8;         // diagonal
      
      // Deterministic spread based on index (for consistent layout)
      const indexSpread = ((index % 7) - 3) * 3;
      
      return {
        tech,
        x: Math.max(12, Math.min(88, baseX + signalOffsetX + mediaOffset + indexSpread)),
        y: Math.max(12, Math.min(88, baseY + signalOffsetY + mediaOffset)),
        challenge,
        opportunity,
        investmentSignal,
        patentSignal,
        mediaSignal,
      };
    });
  }, [technologies]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Y-axis label - outside left */}
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-medium text-muted-foreground whitespace-nowrap">
        Low Opportunity ← → High Opportunity
      </div>
      
      {/* Main matrix with aspect ratio */}
      <div className="relative aspect-square ml-4 mb-8">
        {/* Background gradient quadrants - Client naming convention */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 rounded-xl overflow-hidden">
          {/* Top-left: Quick Wins (Low Challenge, High Opportunity) - Yellow */}
          <div className="bg-gradient-to-br from-yellow-400/25 to-yellow-500/15 border-r border-b border-border/30 p-4">
            <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-500">Quick Wins</span>
            <p className="text-xs text-muted-foreground">Low challenge, high opportunity</p>
          </div>
          {/* Top-right: Big Bets (High Challenge, High Opportunity) - Pink */}
          <div className="bg-gradient-to-br from-pink-400/25 to-pink-500/15 border-b border-border/30 p-4">
            <span className="text-sm font-semibold text-pink-600 dark:text-pink-400">Big Bets</span>
            <p className="text-xs text-muted-foreground">High challenge, high opportunity</p>
          </div>
          {/* Bottom-left: Do it if/when there is time (Low Challenge, Low Opportunity) - Blue */}
          <div className="bg-gradient-to-br from-blue-400/20 to-blue-500/10 border-r border-border/30 p-4">
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">When Time Permits</span>
            <p className="text-xs text-muted-foreground">Low challenge, low opportunity</p>
          </div>
          {/* Bottom-right: Rethink (High Challenge, Low Opportunity) - Orange */}
          <div className="bg-gradient-to-br from-orange-400/20 to-orange-500/10 p-4">
            <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">Rethink</span>
            <p className="text-xs text-muted-foreground">High challenge, low opportunity</p>
          </div>
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
      
      {/* X-axis label - outside bottom */}
      <div className="text-center text-xs font-medium text-muted-foreground ml-4">
        Low Challenge ← → High Challenge
      </div>
    </div>
  );
}

// (3×3 Extended Grid removed per user request)

// ============================================================================
// STYLE 3: Radar-Style with Quadrant Overlay
// ============================================================================
// Tender-aligned maturity stages (calculated from TRL data)
// TRL 7-9 = Mainstream (center), TRL 4-6 = Early Adoption (middle), TRL 1-3 = Emerging (outer)
function getMaturityRing(trlScore: number | null): number {
  if (trlScore === null || trlScore === undefined) return 2; // No data = outer ring
  if (trlScore >= 1.5) return 0; // Mainstream (TRL 7-9) = center
  if (trlScore >= 0.5) return 1; // Early Adoption (TRL 4-6) = middle
  return 2; // Emerging (TRL 1-3) = outer
}

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
      
      // Maturity ring from ACTUAL TRL data (not assumed)
      const maturityRing = getMaturityRing(tech.trlScore);
      
      // 3-signal spreading
      const investmentSignal = tech.investmentScore ?? 0;
      const patentSignal = tech.totalPatents >= 100 ? 2 : tech.totalPatents >= 20 ? 1 : 0;
      const mediaSignal = tech.visibilityScore ?? 0;
      
      // Calculate angle based on quadrant (C-O position)
      // INVERT challenge: 0 (Severe) = right side, 2 (Easy) = left side
      const quadrantAngle = Math.atan2(
        opportunity - 1,        // -1 to 1 for Y (normal)
        (2 - challenge) - 1     // Inverted: 0→+1 (right), 2→-1 (left)
      );
      
      // Distance based on ACTUAL maturity (from TRL data in documents)
      // Ring 0 = center (15), Ring 1 = middle (30), Ring 2 = outer (45)
      const baseDistance = 15 + maturityRing * 15;
      
      // Signal-based angle spread (investment affects angular position)
      const signalAngleOffset = ((investmentSignal - 1) / 2) * 0.25;
      // Patent signal affects distance within ring band
      const signalDistOffset = ((patentSignal - 1) / 2) * 6;
      // Media signal adds small angular variation
      const mediaAngleOffset = ((mediaSignal - 1) / 2) * 0.15;
      
      // Index-based deterministic spread (consistent layout)
      const indexAngleSpread = ((i % 11) - 5) * 0.08;
      const indexDistSpread = ((i % 5) - 2) * 2;
      
      const finalAngle = quadrantAngle + signalAngleOffset + mediaAngleOffset + indexAngleSpread;
      const finalDist = Math.max(10, Math.min(44, baseDistance + signalDistOffset + indexDistSpread));
      
      const x = centerX + Math.cos(finalAngle) * finalDist;
      const y = centerY - Math.sin(finalAngle) * finalDist; // Invert Y for SVG
      
      return { tech, x, y, challenge, opportunity, maturityRing };
    });
  }, [technologies]);

  // Tender-aligned terminology
  const rings = [
    { r: 15, label: "Mainstream" },      // TRL 7-9
    { r: 30, label: "Early Adoption" },  // TRL 4-6
    { r: 45, label: "Emerging" },        // TRL 1-3
  ];

  return (
    <div className="relative w-full aspect-square max-w-xl mx-auto">
      {/* Quadrant backgrounds - matching Client C-O colors */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        {/* Quadrant fills - complete circle divided into 4 equal parts */}
        {/* Top-left: Quick Wins (yellow) - from top to left */}
        <path d="M50,50 L50,5 A45,45 0 0,0 5,50 Z" fill="rgba(250, 204, 21, 0.2)" />
        {/* Top-right: Big Bets (pink) - from right to top */}
        <path d="M50,50 L95,50 A45,45 0 0,0 50,5 Z" fill="rgba(236, 72, 153, 0.15)" />
        {/* Bottom-left: When Time Permits (blue) - from left to bottom */}
        <path d="M50,50 L5,50 A45,45 0 0,0 50,95 Z" fill="rgba(96, 165, 250, 0.15)" />
        {/* Bottom-right: Rethink (orange) - from bottom to right */}
        <path d="M50,50 L50,95 A45,45 0 0,0 95,50 Z" fill="rgba(251, 146, 60, 0.15)" />
        
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

      {/* Quadrant labels - matching Client naming */}
      <div className="absolute top-2 left-4 text-xs font-semibold text-yellow-500">Quick Wins</div>
      <div className="absolute top-2 right-4 text-xs font-semibold text-pink-400">Big Bets</div>
      <div className="absolute bottom-4 left-4 text-xs font-semibold text-blue-400">When Time Permits</div>
      <div className="absolute bottom-4 right-4 text-xs font-semibold text-orange-400">Rethink</div>

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
// STYLE 4: Classic Maturity Radar (from TechnologyRadar page)
// ============================================================================
const ringRadii: Record<MaturityRing, number> = {
  Strong: 0.22,
  Moderate: 0.45,
  Challenging: 0.72,
};

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

function MaturityRadar({ 
  technologies, 
  onSelectTechnology, 
  selectedId 
}: GartnerMatrixSamplerProps) {
  const filteredTechs = useMemo(() => technologies.filter(isSDVRelevant), [technologies]);
  
  const getPosition = (tech: TechnologyIntelligence, index: number) => {
    const ring = getMaturityRingFromComposite(tech.compositeScore ?? 0);
    const radius = ringRadii[ring];
    
    // Distribute technologies evenly in a ring
    const techsInRing = filteredTechs.filter(t => getMaturityRingFromComposite(t.compositeScore ?? 0) === ring);
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

  return (
    <div className="relative w-full aspect-square max-w-xl mx-auto">
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
        <TooltipProvider>
          {filteredTechs.map((tech, index) => {
            const pos = getPosition(tech, index);
            const isSelected = selectedId === tech.id;
            const color = getTechColor(index);
            const ring = getMaturityRingFromComposite(tech.compositeScore ?? 0);

            return (
              <g key={tech.id}>
                {isSelected && (
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
                      r={isSelected ? 2 : 1.5}
                      fill={color}
                      className="cursor-pointer transition-all duration-200"
                      stroke={isSelected ? "hsl(var(--foreground))" : "none"}
                      strokeWidth={isSelected ? 0.4 : 0}
                      onClick={() => onSelectTechnology?.(tech)}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-foreground">{tech.name}</p>
                        <span className="font-mono font-bold text-primary">{(tech.compositeScore ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{ring}</Badge>
                        <Badge variant="outline" className="text-xs">{tech.dealroomCompanyCount} companies</Badge>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </g>
            );
          })}
        </TooltipProvider>
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
  );
}

// ============================================================================
// MAIN SAMPLER COMPONENT
// ============================================================================
export function GartnerMatrixSampler(props: GartnerMatrixSamplerProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Technology Intelligence Views</CardTitle>
        <p className="text-sm text-muted-foreground">
          Strategic positioning and maturity analysis
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="classic" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="classic">Strategy Matrix</TabsTrigger>
            <TabsTrigger value="radar">Maturity Radar</TabsTrigger>
            <TabsTrigger value="hybrid">Hybrid View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="classic" className="mt-0">
            <div className="text-center mb-4">
              <Badge variant="outline">Challenge-Opportunity Quadrants</Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Strategic positioning based on barriers and market potential
              </p>
            </div>
            <Classic2x2Quadrant {...props} />
          </TabsContent>
          
          <TabsContent value="radar" className="mt-0">
            <div className="text-center mb-4">
              <Badge variant="outline">Maturity Rings</Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Technologies grouped by composite score maturity
              </p>
            </div>
            <MaturityRadar {...props} />
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
