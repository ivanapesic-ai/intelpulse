import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { X, ExternalLink, AlertTriangle, Lightbulb, FileText, Building2, TrendingUp, Users, Zap, Tag, Newspaper, ChevronRight, BookOpen } from "lucide-react";
import { WatchToggle } from "./WatchToggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { 
  TechnologyIntelligence, 
  CHALLENGE_LABELS, 
  OPPORTUNITY_LABELS,
  SECTOR_COLORS 
} from "@/hooks/useTechnologyIntelligence";
import { formatFundingEur, formatNumber } from "@/types/database";
import { SignalBreakdown } from "./SignalBreakdown";
import { useNewsForKeyword } from "@/hooks/useNews";
import { useResearchSignalForKeyword } from "@/hooks/useResearchSignals";
import { NewsTimelineChart } from "./NewsTimelineChart";
import { StandardsSection } from "./StandardsSection";

interface TechnologyDetailPanelProps {
  technology: TechnologyIntelligence | null;
  onClose: () => void;
}

export function TechnologyDetailPanel({ technology, onClose }: TechnologyDetailPanelProps) {
  const { data: relatedNews, isLoading: newsLoading } = useNewsForKeyword(technology?.keywordId ?? null);
  const { data: allNews } = useNewsForKeyword(technology?.keywordId ?? null, { limit: 200, deduplicate: false });
  const { data: researchSignal } = useResearchSignalForKeyword(technology?.keywordId ?? null);
  const [showAllNews, setShowAllNews] = useState(false);

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
            <div className="flex items-center gap-2">
              <Link to={`/technology/${technology.keyword || technology.name.toLowerCase().replace(/\s+/g, '_')}`} className="text-xl font-bold text-foreground mb-2 hover:text-primary transition-colors">{technology.name}</Link>
              <WatchToggle keywordId={technology.keywordId} />
            </div>
            
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
                    <p className="text-xs text-muted-foreground">Funding</p>
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
 
               {/* International Standards */}
               <StandardsSection keywordId={technology.keywordId} aliases={technology.aliases} />

               {/* Research Signal (H3) */}
               {researchSignal && (
                 <div>
                   <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                     <BookOpen className="h-4 w-4 text-violet-500" />
                     Research Signal (H3 — Vision)
                     <Badge variant="outline" className="text-[10px] ml-auto">
                       {researchSignal.researchScore === 2 ? "Strong" : researchSignal.researchScore === 1 ? "Moderate" : "Emerging"}
                     </Badge>
                   </h3>
                   <div className="grid grid-cols-3 gap-2 mb-3">
                     <div className="text-center p-2 rounded-lg bg-violet-500/10">
                       <p className="text-sm font-bold text-foreground">
                         {researchSignal.worksLast5y >= 1_000_000
                           ? `${(researchSignal.worksLast5y / 1_000_000).toFixed(1)}M`
                           : researchSignal.worksLast5y >= 1_000
                           ? `${(researchSignal.worksLast5y / 1_000).toFixed(1)}K`
                           : researchSignal.worksLast5y}
                       </p>
                       <p className="text-[10px] text-muted-foreground">Papers (5yr)</p>
                     </div>
                     <div className="text-center p-2 rounded-lg bg-violet-500/10">
                       <p className="text-sm font-bold text-foreground">{researchSignal.citationCount.toLocaleString()}</p>
                       <p className="text-[10px] text-muted-foreground">Citations</p>
                     </div>
                     <div className="text-center p-2 rounded-lg bg-violet-500/10">
                       <p className={cn("text-sm font-bold", researchSignal.growthRateYoy >= 0 ? "text-emerald-500" : "text-red-500")}>
                         {researchSignal.growthRateYoy >= 0 ? "+" : ""}{researchSignal.growthRateYoy}%
                       </p>
                       <p className="text-[10px] text-muted-foreground">YoY Growth</p>
                     </div>
                   </div>
                    <h4 className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                      <FileText className="h-3.5 w-3.5" /> Latest Papers
                    </h4>
                    {researchSignal.topPapers.length > 0 && (
                      <div className="space-y-1.5">
                        {researchSignal.topPapers.slice(0, 3).map((paper, i) => {
                          const paperUrl = paper.doi
                            ? `https://doi.org/${paper.doi.replace("https://doi.org/", "")}`
                            : paper.id?.startsWith("https://openalex.org/")
                              ? paper.id.replace("https://openalex.org/", "https://openalex.org/works/")
                              : null;
                          return (
                            <a
                              key={i}
                              href={paperUrl || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "block p-2 rounded bg-muted/30 border border-border transition-colors",
                                paperUrl && "hover:bg-muted/60 hover:border-primary/30 cursor-pointer"
                              )}
                              onClick={(e) => !paperUrl && e.preventDefault()}
                            >
                              <p className="text-xs font-medium text-foreground line-clamp-2">{paper.title}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
                                <span>{paper.authors.slice(0, 2).join(", ")}{paper.authors.length > 2 ? " et al." : ""}</span>
                                <span>·</span>
                                <span>{paper.year}</span>
                                <span>·</span>
                                <Badge variant="outline" className="text-[9px] px-1 py-0 text-emerald-500 border-emerald-500/30">
                                  {paper.citations} citations
                                </Badge>
                                {paper.source && <span className="truncate max-w-[120px]">{paper.source}</span>}
                              </div>
                            </a>
                          );
                        })}
                     </div>
                   )}
                 </div>
               )}

               <Separator />

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

              <Separator />

               {/* News Timeline */}
               {technology.keywordId && (
                 <div>
                   <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                     <TrendingUp className="h-4 w-4" />
                     News Mentions (12 weeks)
                   </h3>
                   <NewsTimelineChart keywordId={technology.keywordId} />
                 </div>
               )}

               <Separator />

               {/* Related News */}
               <div>
                 <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                   <Newspaper className="h-4 w-4" />
                   Related News
                   {relatedNews && relatedNews.length > 0 && (
                     <Badge variant="secondary" className="text-[10px] ml-auto">
                       {allNews?.length ?? relatedNews.length} total
                     </Badge>
                   )}
                 </h3>
                {newsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                  </div>
                ) : relatedNews && relatedNews.length > 0 ? (
                  <div className="space-y-2">
                    {relatedNews.slice(0, 5).map((news) => (
                      <a
                        key={news.id}
                        href={news.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
                      >
                        <p className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                          {news.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{news.source_name}</span>
                          {news.published_at && (
                            <>
                              <span>•</span>
                              <span>{new Date(news.published_at).toLocaleDateString()}</span>
                            </>
                          )}
                          {'match_confidence' in news && (
                            <Badge variant="outline" className={cn(
                              "text-[10px] ml-1",
                              (news as any).match_confidence >= 0.9 ? "border-emerald-500/40 text-emerald-600" :
                              (news as any).match_confidence >= 0.7 ? "border-amber-500/40 text-amber-600" :
                              "border-muted-foreground/30"
                            )}>
                              {Math.round((news as any).match_confidence * 100)}%
                            </Badge>
                          )}
                          <ExternalLink className="h-3 w-3 ml-auto" />
                        </div>
                      </a>
                    ))}
                    {(allNews?.length ?? 0) > 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs gap-1 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowAllNews(true)}
                      >
                        View all {allNews?.length} articles
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No related news yet. Fetch RSS feeds from the Admin panel.
                  </p>
                )}
              </div>

              {/* All News Dialog */}
              <Dialog open={showAllNews} onOpenChange={setShowAllNews}>
                <DialogContent className="max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
                  <DialogHeader className="shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                      <Newspaper className="h-5 w-5" />
                      All News — {technology.name}
                    </DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
                    <div className="space-y-2 pb-4">
                      {(allNews ?? []).map((news) => (
                        <a
                          key={news.id}
                          href={news.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
                        >
                          <p className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                            {news.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span className="font-medium">{news.source_name}</span>
                            {news.published_at && (
                              <>
                                <span>•</span>
                                <span>{new Date(news.published_at).toLocaleDateString()}</span>
                              </>
                            )}
                            {'match_confidence' in news && (
                              <Badge variant="outline" className={cn(
                                "text-[10px]",
                                (news as any).match_confidence >= 0.9 ? "border-emerald-500/40 text-emerald-600" :
                                (news as any).match_confidence >= 0.7 ? "border-amber-500/40 text-amber-600" :
                                "border-muted-foreground/30"
                              )}>
                                {Math.round((news as any).match_confidence * 100)}%
                              </Badge>
                            )}
                            <ExternalLink className="h-3 w-3 ml-auto flex-shrink-0" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
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