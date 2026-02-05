 import { motion } from "framer-motion";
 import { TrendingUp, FileText, Newspaper, Building2, Users, Zap } from "lucide-react";
 import { cn } from "@/lib/utils";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Progress } from "@/components/ui/progress";
 import { Badge } from "@/components/ui/badge";
 import type { TechnologyIntelligence } from "@/hooks/useTechnologyIntelligence";
 
 interface SignalBreakdownProps {
   technology: TechnologyIntelligence;
 }
 
 export function SignalBreakdown({ technology }: SignalBreakdownProps) {
   // Calculate signal scores as percentages
   const signals = [
     {
       name: "Investment Activity",
       description: "Funding rounds & total raised",
       value: technology.investmentScore,
       maxValue: 2,
       icon: TrendingUp,
       color: "bg-emerald-500",
       details: `€${(technology.totalFundingEur / 1000000).toFixed(1)}M raised`,
     },
     {
       name: "Innovation (Patents)",
       description: "Patent filings & IP activity",
       value: technology.totalPatents > 50 ? 2 : technology.totalPatents > 10 ? 1 : 0,
       maxValue: 2,
       icon: FileText,
       color: "bg-blue-500",
       details: `${technology.totalPatents} patents`,
     },
     {
       name: "Market Response",
       description: "Media & document mentions",
       value: technology.visibilityScore,
       maxValue: 2,
       icon: Newspaper,
       color: "bg-purple-500",
       details: `${technology.documentMentionCount + (technology.newsMentionCount ?? 0)} mentions`,
     },
     {
       name: "Workforce Scale",
       description: "Combined employee count",
       value: technology.employeesScore,
       maxValue: 2,
       icon: Users,
       color: "bg-cyan-500",
       details: `${technology.totalEmployees.toLocaleString()} employees`,
     },
     {
       name: "TRL Maturity",
       description: "Technology Readiness Level",
       value: technology.trlScore,
       maxValue: 2,
       icon: Zap,
       color: "bg-amber-500",
       details: technology.avgTrlMentioned ? `Avg TRL ${technology.avgTrlMentioned.toFixed(1)}` : "Not assessed",
     },
     {
       name: "EU Alignment",
       description: "Policy & strategic fit",
       value: technology.euAlignmentScore,
       maxValue: 2,
       icon: Building2,
       color: "bg-pink-500",
       details: `${technology.policyMentionCount} policy refs`,
     },
   ];
 
   const getScoreLabel = (value: number) => {
     if (value === 2) return "Strong";
     if (value === 1) return "Moderate";
     return "Emerging";
   };
 
   const getScoreColor = (value: number) => {
     if (value === 2) return "text-emerald-500";
     if (value === 1) return "text-amber-500";
     return "text-red-500";
   };
 
   return (
     <Card className="border-border">
       <CardHeader className="pb-2">
         <CardTitle className="text-lg flex items-center gap-2">
           <TrendingUp className="h-5 w-5 text-primary" />
           Signal Breakdown
         </CardTitle>
       </CardHeader>
       <CardContent className="space-y-4">
         {signals.map((signal, index) => (
           <motion.div
             key={signal.name}
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: index * 0.05 }}
             className="space-y-2"
           >
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <signal.icon className="h-4 w-4 text-muted-foreground" />
                 <span className="text-sm font-medium">{signal.name}</span>
               </div>
               <div className="flex items-center gap-2">
                 <span className="text-xs text-muted-foreground">{signal.details}</span>
                 <Badge 
                   variant="outline" 
                   className={cn("text-xs", getScoreColor(signal.value))}
                 >
                   {getScoreLabel(signal.value)}
                 </Badge>
               </div>
             </div>
             <div className="flex items-center gap-2">
               <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                 <motion.div
                   initial={{ width: 0 }}
                   animate={{ width: `${(signal.value / signal.maxValue) * 100}%` }}
                   transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                   className={cn("h-full rounded-full", signal.color)}
                 />
               </div>
               <span className="text-xs font-mono w-8 text-right text-muted-foreground">
                 {signal.value}/{signal.maxValue}
               </span>
             </div>
           </motion.div>
         ))}
         
         {/* Composite Score */}
         <div className="pt-4 border-t border-border">
           <div className="flex items-center justify-between mb-2">
             <span className="text-sm font-bold">Composite Score</span>
             <span className="text-xl font-bold text-primary">
               {technology.compositeScore.toFixed(1)}/2
             </span>
           </div>
           <Progress 
             value={(technology.compositeScore / 2) * 100} 
             className="h-3"
           />
         </div>
       </CardContent>
     </Card>
   );
 }