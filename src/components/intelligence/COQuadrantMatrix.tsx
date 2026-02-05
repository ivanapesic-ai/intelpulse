 import { useMemo, useState } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { cn } from "@/lib/utils";
 import { TechnologyIntelligence } from "@/hooks/useTechnologyIntelligence";
 import { Badge } from "@/components/ui/badge";
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
 import { formatFundingEur } from "@/types/database";
 
 interface COQuadrantMatrixProps {
   technologies: TechnologyIntelligence[];
   onSelectTechnology?: (tech: TechnologyIntelligence) => void;
   selectedId?: string | null;
 }
 
 // Quadrant definitions matching the workshop diagram
 const QUADRANTS = {
   quickWins: {
     label: "Quick Wins",
     description: "Low challenge, high opportunity — act now",
     color: "from-emerald-500/20 to-emerald-600/10",
     borderColor: "border-emerald-500/30",
     textColor: "text-emerald-400",
     bgDot: "bg-emerald-500",
   },
   bigBets: {
     label: "Big Bets",
     description: "High challenge, high opportunity — strategic investment",
     color: "from-blue-500/20 to-blue-600/10",
     borderColor: "border-blue-500/30",
     textColor: "text-blue-400",
     bgDot: "bg-blue-500",
   },
   fillIn: {
     label: "Fill-in / Do Later",
     description: "Low challenge, low opportunity — opportunistic",
     color: "from-sky-500/10 to-sky-600/5",
     borderColor: "border-sky-500/20",
     textColor: "text-sky-400",
     bgDot: "bg-sky-400",
   },
   rethink: {
     label: "Rethink",
     description: "High challenge, low opportunity — reconsider strategy",
     color: "from-amber-500/15 to-orange-500/10",
     borderColor: "border-amber-500/30",
     textColor: "text-amber-400",
     bgDot: "bg-amber-500",
   },
 } as const;
 
 type QuadrantKey = keyof typeof QUADRANTS;
 
 function getQuadrant(tech: TechnologyIntelligence): QuadrantKey {
   const challenge = tech.challengeScore ?? 1;
   const opportunity = tech.opportunityScore ?? 1;
   
   // High opportunity (2) + Low challenge (2) = Quick Wins
   // High opportunity (2) + High challenge (0) = Big Bets
   // Low opportunity (0,1) + Low challenge (2) = Fill-in
   // Low opportunity (0,1) + High challenge (0) = Rethink
   
   const isHighOpportunity = opportunity === 2;
   const isLowChallenge = challenge >= 1; // 1 or 2 = manageable/no challenge
   
   if (isHighOpportunity && isLowChallenge) return "quickWins";
   if (isHighOpportunity && !isLowChallenge) return "bigBets";
   if (!isHighOpportunity && isLowChallenge) return "fillIn";
   return "rethink";
 }
 
 function TechDot({ 
   tech, 
   quadrant, 
   index, 
   total,
   isSelected,
   onClick 
 }: { 
   tech: TechnologyIntelligence; 
   quadrant: QuadrantKey;
   index: number;
   total: number;
   isSelected: boolean;
   onClick: () => void;
 }) {
   const config = QUADRANTS[quadrant];
   
   // Calculate position within quadrant grid
   const cols = Math.ceil(Math.sqrt(total));
   const row = Math.floor(index / cols);
   const col = index % cols;
   
   // Add some randomness for organic feel
   const offsetX = (col / Math.max(cols - 1, 1)) * 80 + 10 + (Math.random() * 5 - 2.5);
   const offsetY = (row / Math.max(Math.ceil(total / cols) - 1, 1)) * 80 + 10 + (Math.random() * 5 - 2.5);
   
   // Size based on funding (larger = more funding)
   const fundingScore = Math.min(tech.totalFundingEur / 100000000, 1); // Cap at €100M
   const size = 24 + fundingScore * 24; // 24-48px
 
   return (
     <TooltipProvider>
       <Tooltip delayDuration={0}>
         <TooltipTrigger asChild>
           <motion.div
             initial={{ scale: 0, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ delay: index * 0.02, type: "spring", stiffness: 300 }}
             className={cn(
               "absolute cursor-pointer rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg transition-all duration-200",
               config.bgDot,
               isSelected && "ring-2 ring-white ring-offset-2 ring-offset-background z-20 scale-125"
             )}
             style={{
               left: `${offsetX}%`,
               top: `${offsetY}%`,
               width: size,
               height: size,
               transform: "translate(-50%, -50%)",
             }}
             onClick={onClick}
             whileHover={{ scale: 1.2, zIndex: 10 }}
           >
             {tech.name.slice(0, 2).toUpperCase()}
           </motion.div>
         </TooltipTrigger>
         <TooltipContent side="top" className="max-w-xs">
           <div className="space-y-1">
             <p className="font-semibold">{tech.name}</p>
             <div className="flex gap-2 text-xs text-muted-foreground">
               <span>💰 {formatFundingEur(tech.totalFundingEur)}</span>
               <span>📊 {tech.dealroomCompanyCount} companies</span>
             </div>
             <p className="text-xs opacity-70">Click for details</p>
           </div>
         </TooltipContent>
       </Tooltip>
     </TooltipProvider>
   );
 }
 
 export function COQuadrantMatrix({ technologies, onSelectTechnology, selectedId }: COQuadrantMatrixProps) {
   const [hoveredQuadrant, setHoveredQuadrant] = useState<QuadrantKey | null>(null);
   
   const groupedTech = useMemo(() => {
     const groups: Record<QuadrantKey, TechnologyIntelligence[]> = {
       quickWins: [],
       bigBets: [],
       fillIn: [],
       rethink: [],
     };
     
     technologies.forEach(tech => {
       const quadrant = getQuadrant(tech);
       groups[quadrant].push(tech);
     });
     
     return groups;
   }, [technologies]);
 
   const renderQuadrant = (key: QuadrantKey, position: string) => {
     const config = QUADRANTS[key];
     const techs = groupedTech[key];
     const isHovered = hoveredQuadrant === key;
     
     return (
       <motion.div
         className={cn(
           "relative rounded-xl border-2 p-4 bg-gradient-to-br transition-all duration-300",
           config.color,
           config.borderColor,
           position,
           isHovered && "border-opacity-100 scale-[1.01]"
         )}
         onMouseEnter={() => setHoveredQuadrant(key)}
         onMouseLeave={() => setHoveredQuadrant(null)}
       >
         {/* Label */}
         <div className="absolute top-3 left-3 z-10">
           <h3 className={cn("text-sm font-bold", config.textColor)}>{config.label}</h3>
           <p className="text-xs text-muted-foreground max-w-[150px]">{config.description}</p>
         </div>
         
         {/* Count badge */}
         <Badge 
           variant="secondary" 
           className={cn("absolute top-3 right-3 z-10", config.textColor)}
         >
           {techs.length}
         </Badge>
         
         {/* Tech dots container */}
         <div className="absolute inset-0 pt-16 pb-4 px-4">
           <div className="relative w-full h-full">
             {techs.map((tech, i) => (
               <TechDot
                 key={tech.id}
                 tech={tech}
                 quadrant={key}
                 index={i}
                 total={techs.length}
                 isSelected={selectedId === tech.id}
                 onClick={() => onSelectTechnology?.(tech)}
               />
             ))}
           </div>
         </div>
       </motion.div>
     );
   };
 
   return (
     <div className="space-y-4">
       {/* Axis Labels */}
       <div className="relative">
         {/* Y-axis label */}
         <div className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-medium text-muted-foreground whitespace-nowrap">
           ← Low Opportunity — High Opportunity →
         </div>
         
         {/* Matrix Grid */}
         <div className="grid grid-cols-2 gap-3 min-h-[500px] ml-6">
           {/* Top row: High Opportunity */}
           {renderQuadrant("quickWins", "")}
           {renderQuadrant("bigBets", "")}
           
           {/* Bottom row: Low Opportunity */}
           {renderQuadrant("fillIn", "")}
           {renderQuadrant("rethink", "")}
         </div>
         
         {/* X-axis label */}
         <div className="text-center mt-4 text-sm font-medium text-muted-foreground">
           ← Low Challenge — High Challenge →
         </div>
       </div>
       
       {/* Legend */}
       <div className="flex flex-wrap justify-center gap-4 pt-4 border-t border-border">
         {(Object.keys(QUADRANTS) as QuadrantKey[]).map(key => {
           const config = QUADRANTS[key];
           return (
             <div key={key} className="flex items-center gap-2">
               <div className={cn("w-3 h-3 rounded-full", config.bgDot)} />
               <span className="text-xs text-muted-foreground">{config.label}</span>
               <span className="text-xs font-mono text-foreground">({groupedTech[key].length})</span>
             </div>
           );
         })}
       </div>
     </div>
   );
 }