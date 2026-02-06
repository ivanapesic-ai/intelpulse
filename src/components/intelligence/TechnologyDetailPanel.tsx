import { motion } from "framer-motion";
import { X, ExternalLink, AlertTriangle, Lightbulb, FileText, Building2, TrendingUp, Users, Zap, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { 
  TechnologyIntelligence, 
  CHALLENGE_LABELS, 
  OPPORTUNITY_LABELS,
  SECTOR_COLORS 
} from "@/hooks/useTechnologyIntelligence";
import { formatFundingEur, formatNumber } from "@/types/database";
import { SignalBreakdown } from "./SignalBreakdown";

interface TechnologyDetailPanelProps {
  technology: TechnologyIntelligence | null;
  onClose: () => void;
}

export function TechnologyDetailPanel({ technology, onClose }: TechnologyDetailPanelProps) {
  if (!technology) return null;

  const challengeConfig = CHALLENGE_LABELS[technology.challengeScore ?? 0];
  const opportunityConfig = OPPORTUNITY_LABELS[technology.opportunityScore ?? 0];

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border shadow-2xl z-50"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground mb-2">{technology.name}</h2>
            
            {/* Aliases/Synonyms */}
            {technology.aliases && technology.aliases.length > 0 && (
              <div className="flex items-center gap-1.5 mb-2 text-sm text-muted-foreground">
                <Tag className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">
                  Also: {technology.aliases.slice(0, 3).join(", ")}
                  {technology.aliases.length > 3 && ` +${technology.aliases.length - 3}`}
                </span>
              </div>
            )}
            
            <div className="flex flex-wrap gap-1.5">
              {technology.sectorTags.length > 0 ? technology.sectorTags.map(sector => (
                <Badge 
                  key={sector} 
                  variant="outline" 
                  className={cn("text-xs capitalize", SECTOR_COLORS[sector] || SECTOR_COLORS.general)}
                >
                  {sector}
                </Badge>
              )) : (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  No sector assigned
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
 
         <ScrollArea className="flex-1 p-6">
           <div className="space-y-6">
             {/* C-O Matrix Summary */}
             <div className="grid grid-cols-2 gap-3">
               <div className={cn("p-4 rounded-xl border-2", challengeConfig?.color || "border-border")}>
                 <div className="flex items-center gap-2 mb-2">
                   <AlertTriangle className="h-4 w-4" />
                   <span className="text-sm font-medium">Challenge</span>
                 </div>
                 <p className="text-lg font-bold">
                   {challengeConfig?.label || "Not assessed"}
                 </p>
                 <p className="text-xs text-muted-foreground mt-1">
                   {challengeConfig?.description || "Parse documents to assess"}
                 </p>
               </div>
 
               <div className={cn("p-4 rounded-xl border-2", opportunityConfig?.color || "border-border")}>
                 <div className="flex items-center gap-2 mb-2">
                   <Lightbulb className="h-4 w-4" />
                   <span className="text-sm font-medium">Opportunity</span>
                 </div>
                 <p className="text-lg font-bold">
                   {opportunityConfig?.label || "Not assessed"}
                 </p>
                 <p className="text-xs text-muted-foreground mt-1">
                   {opportunityConfig?.description || "Parse documents to assess"}
                 </p>
               </div>
             </div>
 
              {/* Key Metrics Grid */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Key Metrics</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <Building2 className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-bold text-foreground">{technology.dealroomCompanyCount}</p>
                    <p className="text-xs text-muted-foreground">Companies</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <TrendingUp className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-bold text-foreground">{formatFundingEur(technology.totalFundingEur)}</p>
                    <p className="text-xs text-muted-foreground">Total Funding</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <Users className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-bold text-foreground">{formatNumber(technology.totalEmployees)}</p>
                    <p className="text-xs text-muted-foreground">Employees</p>
                  </div>
                </div>
                
                {/* Alias enrichment explanation */}
                {technology.aliases && technology.aliases.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-3 italic">
                    <Zap className="h-3 w-3 inline mr-1" />
                    Metrics include companies tagged with: {technology.aliases.slice(0, 4).join(", ")}
                    {technology.aliases.length > 4 && ` +${technology.aliases.length - 4} more`}
                  </p>
                )}
              </div>
 
             <Separator />
 
             {/* Signal Breakdown */}
             <SignalBreakdown technology={technology} />
 
             <Separator />
 
             {/* Document Insights */}
             {technology.documentInsights && Object.keys(technology.documentInsights).length > 0 && (
               <div>
                 <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                   <FileText className="h-4 w-4" />
                   Document Insights
                 </h3>
                 <div className="space-y-3">
                   {technology.documentInsights.mention_contexts?.slice(0, 3).map((ctx, i) => (
                     <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border">
                       <p className="text-sm text-foreground line-clamp-3">{ctx.context}</p>
                       <div className="flex items-center gap-2 mt-2">
                         {ctx.trl && (
                           <Badge variant="outline" className="text-xs">
                             TRL {ctx.trl}
                           </Badge>
                         )}
                         {ctx.policy && (
                           <Badge variant="outline" className="text-xs text-blue-500">
                             {ctx.policy}
                           </Badge>
                         )}
                         <span className="text-xs text-muted-foreground ml-auto">
                           {(ctx.confidence * 100).toFixed(0)}% confidence
                         </span>
                       </div>
                     </div>
                   ))}
                   
                   {(!technology.documentInsights.mention_contexts || 
                     technology.documentInsights.mention_contexts.length === 0) && (
                     <p className="text-sm text-muted-foreground italic">
                       No document insights yet. Upload and parse CEI documents to populate.
                     </p>
                   )}
                 </div>
               </div>
             )}
 
             {/* Key Players */}
             {technology.keyPlayers && technology.keyPlayers.length > 0 && (
               <div>
                 <h3 className="text-sm font-semibold text-foreground mb-3">Key Players</h3>
                 <div className="flex flex-wrap gap-2">
                   {technology.keyPlayers.slice(0, 10).map((player, i) => (
                     <Badge key={i} variant="secondary" className="text-xs">
                       {player}
                     </Badge>
                   ))}
                 </div>
               </div>
             )}
           </div>
         </ScrollArea>
 
         {/* Footer */}
         <div className="p-4 border-t border-border">
           <p className="text-xs text-muted-foreground text-center">
             Last updated: {new Date(technology.lastUpdated).toLocaleDateString()}
           </p>
         </div>
       </div>
     </motion.div>
   );
 }