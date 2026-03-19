import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { X, AlertTriangle, Lightbulb, ChevronRight } from "lucide-react";
import { WatchToggle } from "./WatchToggle";
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
import { SignalBreakdown } from "./SignalBreakdown";

interface TechnologyDetailPanelProps {
  technology: TechnologyIntelligence | null;
  onClose: () => void;
}

export function TechnologyDetailPanel({ technology, onClose }: TechnologyDetailPanelProps) {
  if (!technology) return null;

  const challengeConfig = CHALLENGE_LABELS[technology.challengeScore ?? 0];
  const opportunityConfig = OPPORTUNITY_LABELS[technology.opportunityScore ?? 0];
  const deepDiveSlug = technology.keyword || technology.name.toLowerCase().replace(/[\s/]+/g, '_');

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
            <div className="flex items-center gap-2">
              <Link to={`/technology/${deepDiveSlug}`} className="text-xl font-bold text-foreground mb-2 hover:text-primary transition-colors">{technology.name}</Link>
              <WatchToggle keywordId={technology.keywordId} />
            </div>
            
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
 
              <Separator />

              {/* Signal Breakdown */}
              <SignalBreakdown technology={technology} />
 
              <Separator />

              {/* Open Deep-Dive CTA */}
              <Link to={`/technology/${deepDiveSlug}`}>
                <Button variant="default" className="w-full gap-2">
                  Open deep-dive
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
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
