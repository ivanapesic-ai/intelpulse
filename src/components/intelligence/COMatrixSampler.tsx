import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TechnologyIntelligence } from "@/hooks/useTechnologyIntelligence";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatFundingEur } from "@/types/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

interface COMatrixSamplerProps {
  technologies: TechnologyIntelligence[];
  onSelectTechnology?: (tech: TechnologyIntelligence) => void;
  selectedId?: string | null;
}

// Derive C-O scores from existing signals when database scores are null
function deriveScoresFromSignals(tech: TechnologyIntelligence): {
  challenge: number;
  opportunity: number;
} {
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

function getScores(tech: TechnologyIntelligence) {
  if (tech.challengeScore !== null && tech.opportunityScore !== null) {
    return { challenge: tech.challengeScore, opportunity: tech.opportunityScore };
  }
  return deriveScoresFromSignals(tech);
}

// Cell colors for 3x3 grid - gradient from red (bad) to green (good)
const CELL_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  "0-0": { bg: "bg-rose-500/30", text: "text-rose-300", label: "Avoid" },
  "0-1": { bg: "bg-amber-500/25", text: "text-amber-300", label: "Monitor" },
  "0-2": { bg: "bg-sky-500/25", text: "text-sky-300", label: "Big Bet" },
  "1-0": { bg: "bg-orange-500/20", text: "text-orange-300", label: "Deprioritize" },
  "1-1": { bg: "bg-slate-500/20", text: "text-slate-300", label: "Balanced" },
  "1-2": { bg: "bg-emerald-500/25", text: "text-emerald-300", label: "Invest" },
  "2-0": { bg: "bg-amber-600/20", text: "text-amber-400", label: "Quick Fix" },
  "2-1": { bg: "bg-teal-500/25", text: "text-teal-300", label: "Quick Win" },
  "2-2": { bg: "bg-emerald-500/40", text: "text-emerald-200", label: "Priority" },
};

const CHALLENGE_LABELS = ["Severe (0)", "Manageable (1)", "No Major (2)"];
const OPPORTUNITY_LABELS = ["Limited (0)", "Promising (1)", "High (2)"];

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION 1: 3×3 Grid Heatmap
// ═══════════════════════════════════════════════════════════════════════════════
function GridHeatmap({ 
  technologies, 
  onSelectTechnology, 
  selectedId 
}: COMatrixSamplerProps) {
  const grouped = useMemo(() => {
    const grid: Record<string, TechnologyIntelligence[]> = {};
    for (let c = 0; c <= 2; c++) {
      for (let o = 0; o <= 2; o++) {
        grid[`${c}-${o}`] = [];
      }
    }
    technologies.filter(isSDVRelevant).forEach(tech => {
      const { challenge, opportunity } = getScores(tech);
      const key = `${challenge}-${opportunity}`;
      if (grid[key]) grid[key].push(tech);
    });
    return grid;
  }, [technologies]);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">Option 1: Grid Heatmap</h3>
      <div className="relative">
        {/* Y-axis label */}
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
          Opportunity →
        </div>
        
        <div className="ml-4 grid grid-cols-3 gap-1">
          {/* Grid cells - iterate opportunity (rows) from high to low, challenge (cols) from low to high */}
          {[2, 1, 0].map(opp => (
            [0, 1, 2].map(chal => {
              const key = `${chal}-${opp}`;
              const techs = grouped[key];
              const config = CELL_COLORS[key];
              
              return (
                <TooltipProvider key={key}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        className={cn(
                          "relative h-20 rounded-lg border border-border/50 p-2 cursor-pointer transition-all",
                          config.bg,
                          techs.length > 0 && "hover:scale-[1.02] hover:border-primary/50"
                        )}
                        whileHover={{ scale: techs.length > 0 ? 1.02 : 1 }}
                      >
                        <div className={cn("text-[9px] font-medium", config.text)}>
                          {config.label}
                        </div>
                        <div className="absolute bottom-2 right-2 text-lg font-bold text-foreground/80">
                          {techs.length}
                        </div>
                        {/* Mini dots for technologies */}
                        <div className="flex flex-wrap gap-0.5 mt-1">
                          {techs.slice(0, 6).map(t => (
                            <div 
                              key={t.id} 
                              className={cn(
                                "w-2 h-2 rounded-full bg-foreground/60",
                                selectedId === t.id && "ring-1 ring-primary"
                              )}
                              onClick={() => onSelectTechnology?.(t)}
                            />
                          ))}
                          {techs.length > 6 && (
                            <span className="text-[8px] text-muted-foreground">+{techs.length - 6}</span>
                          )}
                        </div>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-1">
                        <p className="font-semibold">{config.label}</p>
                        <p className="text-xs text-muted-foreground">
                          Challenge: {CHALLENGE_LABELS[chal]} | Opportunity: {OPPORTUNITY_LABELS[opp]}
                        </p>
                        {techs.length > 0 && (
                          <div className="text-xs">
                            {techs.slice(0, 5).map(t => t.name).join(", ")}
                            {techs.length > 5 && ` +${techs.length - 5} more`}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })
          ))}
        </div>
        
        {/* X-axis label */}
        <div className="text-center mt-2 text-[10px] font-medium text-muted-foreground">
          Challenge (Low Barrier) →
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION 2: Scatter Bubbles with Jitter
// ═══════════════════════════════════════════════════════════════════════════════
function ScatterBubbles({ 
  technologies, 
  onSelectTechnology, 
  selectedId 
}: COMatrixSamplerProps) {
  const positioned = useMemo(() => {
    const filtered = technologies.filter(isSDVRelevant);
    // Group by cell first
    const cells: Record<string, TechnologyIntelligence[]> = {};
    filtered.forEach(tech => {
      const { challenge, opportunity } = getScores(tech);
      const key = `${challenge}-${opportunity}`;
      if (!cells[key]) cells[key] = [];
      cells[key].push(tech);
    });

    // Position each tech within its cell with jitter
    return filtered.map(tech => {
      const { challenge, opportunity } = getScores(tech);
      const key = `${challenge}-${opportunity}`;
      const cellTechs = cells[key];
      const idx = cellTechs.indexOf(tech);
      const total = cellTechs.length;
      
      // Base position (center of cell)
      const baseX = (challenge / 2) * 100;
      const baseY = (1 - opportunity / 2) * 100;
      
      // Jitter within cell (spiral pattern for many items)
      const angle = (idx / Math.max(total, 1)) * Math.PI * 2;
      const radius = Math.min(12, 4 + idx * 2);
      const jitterX = Math.cos(angle) * radius;
      const jitterY = Math.sin(angle) * radius;
      
      // Size based on funding
      const fundingScore = Math.min(tech.totalFundingEur / 100_000_000, 1);
      const size = 16 + fundingScore * 24;
      
      return {
        tech,
        x: baseX + jitterX,
        y: baseY + jitterY,
        size,
        key,
      };
    });
  }, [technologies]);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">Option 2: Scatter Bubbles</h3>
      <div className="relative h-64 border border-border/50 rounded-lg bg-muted/20">
        {/* Grid lines */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
          {[0, 1, 2].map(row => (
            [0, 1, 2].map(col => (
              <div 
                key={`${col}-${row}`} 
                className={cn(
                  "border border-border/20",
                  CELL_COLORS[`${col}-${2-row}`]?.bg
                )}
              />
            ))
          ))}
        </div>
        
        {/* Bubbles */}
        {positioned.map(({ tech, x, y, size, key }) => {
          const config = CELL_COLORS[key];
          return (
            <TooltipProvider key={tech.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    className={cn(
                      "absolute rounded-full cursor-pointer flex items-center justify-center text-[8px] font-bold text-white shadow-lg border-2 border-white/20",
                      selectedId === tech.id && "ring-2 ring-primary z-10"
                    )}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: size,
                      height: size,
                      transform: "translate(-50%, -50%)",
                      backgroundColor: `hsl(var(--${config.text.replace('text-', '').replace('-300', '-500').replace('-400', '-500').replace('-200', '-500')}))`,
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.3, zIndex: 20 }}
                    onClick={() => onSelectTechnology?.(tech)}
                  >
                    {tech.name.slice(0, 2).toUpperCase()}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{tech.name}</p>
                  <p className="text-xs text-muted-foreground">
                    💰 {formatFundingEur(tech.totalFundingEur)}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
        
        {/* Axis labels */}
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground">
          Challenge (Low Barrier) →
        </div>
        <div className="absolute -left-5 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-muted-foreground">
          Opportunity →
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION 3: Ranked Table with Signal Bars
// ═══════════════════════════════════════════════════════════════════════════════
function RankedTable({ 
  technologies, 
  onSelectTechnology, 
  selectedId 
}: COMatrixSamplerProps) {
  const ranked = useMemo(() => {
    return technologies
      .filter(isSDVRelevant)
      .map(tech => {
        const { challenge, opportunity } = getScores(tech);
        const composite = (challenge + opportunity) / 2;
        const key = `${challenge}-${opportunity}`;
        return { tech, challenge, opportunity, composite, key };
      })
      .sort((a, b) => b.composite - a.composite)
      .slice(0, 10);
  }, [technologies]);

  const ScoreBar = ({ value, max = 2 }: { value: number; max?: number }) => (
    <div className="flex items-center gap-1">
      <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full",
            value === 2 ? "bg-emerald-500" : value === 1 ? "bg-amber-500" : "bg-rose-500"
          )}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
      <span className="text-xs font-mono w-4">{value}</span>
    </div>
  );

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground">Option 3: Ranked Table</h3>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-8 text-xs">#</TableHead>
              <TableHead className="text-xs">Technology</TableHead>
              <TableHead className="text-xs w-24">Challenge</TableHead>
              <TableHead className="text-xs w-24">Opportunity</TableHead>
              <TableHead className="text-xs w-16">Zone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranked.map(({ tech, challenge, opportunity, key }, i) => {
              const config = CELL_COLORS[key];
              return (
                <TableRow 
                  key={tech.id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedId === tech.id && "bg-primary/10"
                  )}
                  onClick={() => onSelectTechnology?.(tech)}
                >
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {i + 1}
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {tech.name}
                  </TableCell>
                  <TableCell>
                    <ScoreBar value={challenge} />
                  </TableCell>
                  <TableCell>
                    <ScoreBar value={opportunity} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[10px]", config.text, config.bg)}>
                      {config.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAMPLER: Shows all 3 options
// ═══════════════════════════════════════════════════════════════════════════════
export function COMatrixSampler(props: COMatrixSamplerProps) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold">3×3 Challenge-Opportunity Matrix Options</h2>
        <p className="text-sm text-muted-foreground">
          Choose a visualization style for your discrete 0-2 scoring system
        </p>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Grid Heatmap</CardTitle>
            <p className="text-xs text-muted-foreground">
              Clear 9-zone layout. Shows count per zone. Click to drill down.
            </p>
          </CardHeader>
          <CardContent>
            <GridHeatmap {...props} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Scatter Bubbles</CardTitle>
            <p className="text-xs text-muted-foreground">
              Each tech as a bubble. Size = funding. Position shows zone.
            </p>
          </CardHeader>
          <CardContent>
            <ScatterBubbles {...props} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ranked Table</CardTitle>
            <p className="text-xs text-muted-foreground">
              Sorted by composite score. Signal bars show C-O breakdown.
            </p>
          </CardHeader>
          <CardContent>
            <RankedTable {...props} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
