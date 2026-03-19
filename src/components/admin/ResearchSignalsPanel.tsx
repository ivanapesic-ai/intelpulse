import { useState } from "react";
import { BookOpen, TrendingUp, TrendingDown, Building2, FileText, RefreshCw, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useResearchSignals, ResearchSignal } from "@/hooks/useResearchSignals";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

const scoreLabels: Record<number, { label: string; color: string }> = {
  2: { label: "Strong", color: "text-emerald-500 border-emerald-500/40" },
  1: { label: "Moderate", color: "text-amber-500 border-amber-500/40" },
  0: { label: "Emerging", color: "text-red-500 border-red-500/40" },
};

export function ResearchSignalsPanel() {
  const { data: signals, isLoading, refetch } = useResearchSignals();
  const [isEnriching, setIsEnriching] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<ResearchSignal | null>(null);

  const handleEnrich = async () => {
    setIsEnriching(true);
    try {
      const { error } = await supabase.functions.invoke("fetch-research-signals", { body: {} });
      if (error) throw error;
      toast.success("Research enrichment started — results will appear shortly");
      setTimeout(() => refetch(), 5000);
    } catch (err) {
      console.error("Research enrichment error:", err);
      toast.error("Failed to start research enrichment");
    } finally {
      setIsEnriching(false);
    }
  };

  const totalWorks = signals?.reduce((sum, s) => sum + s.totalWorks, 0) || 0;
  const avgGrowth = signals && signals.length > 0
    ? signals.reduce((sum, s) => sum + s.growthRateYoy, 0) / signals.length
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-violet-500" />
            OpenAlex Research Signals
          </h3>
          <p className="text-sm text-muted-foreground">
            Horizon 3 — Academic research intensity from 250M+ scholarly works
          </p>
        </div>
        <Button onClick={handleEnrich} disabled={isEnriching} size="sm" className="gap-2">
          <RefreshCw className={cn("h-4 w-4", isEnriching && "animate-spin")} />
          {isEnriching ? "Enriching..." : "Fetch All"}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Technologies Enriched</p>
            <p className="text-2xl font-bold text-foreground">{signals?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Research Works</p>
            <p className="text-2xl font-bold text-foreground">{formatCompact(totalWorks)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Avg YoY Growth</p>
            <p className={cn("text-2xl font-bold", avgGrowth >= 0 ? "text-emerald-500" : "text-red-500")}>
              {avgGrowth >= 0 ? "+" : ""}{avgGrowth.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Signals table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-muted-foreground font-medium">Technology</th>
                    <th className="text-right p-3 text-muted-foreground font-medium">Total</th>
                    <th className="text-right p-3 text-muted-foreground font-medium">5yr</th>
                    <th className="text-right p-3 text-muted-foreground font-medium">Citations</th>
                    <th className="text-right p-3 text-muted-foreground font-medium">YoY</th>
                    <th className="text-right p-3 text-muted-foreground font-medium">Score</th>
                    <th className="text-right p-3 text-muted-foreground font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {signals?.map((s) => {
                    const sc = scoreLabels[s.researchScore] || scoreLabels[0];
                    return (
                      <tr
                        key={s.id}
                        className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => setSelectedSignal(s)}
                      >
                        <td className="p-3 font-medium text-foreground">{s.displayName}</td>
                        <td className="p-3 text-right text-muted-foreground">{formatCompact(s.totalWorks)}</td>
                        <td className="p-3 text-right text-muted-foreground">{formatCompact(s.worksLast5y)}</td>
                        <td className="p-3 text-right text-muted-foreground">{formatCompact(s.citationCount)}</td>
                        <td className="p-3 text-right">
                          <span className={cn(
                            "inline-flex items-center gap-0.5 text-xs font-medium",
                            s.growthRateYoy >= 0 ? "text-emerald-500" : "text-red-500"
                          )}>
                            {s.growthRateYoy >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {Math.abs(s.growthRateYoy).toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <Badge variant="outline" className={cn("text-xs", sc.color)}>
                            {sc.label}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedSignal} onOpenChange={(open) => !open && setSelectedSignal(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-violet-500" />
              {selectedSignal?.displayName} — Research
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
            {selectedSignal && (
              <div className="space-y-5 pb-4">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold">{formatCompact(selectedSignal.totalWorks)}</p>
                    <p className="text-xs text-muted-foreground">Total Works</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold">{formatCompact(selectedSignal.citationCount)}</p>
                    <p className="text-xs text-muted-foreground">Citations</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className={cn("text-lg font-bold", selectedSignal.growthRateYoy >= 0 ? "text-emerald-500" : "text-red-500")}>
                      {selectedSignal.growthRateYoy >= 0 ? "+" : ""}{selectedSignal.growthRateYoy}%
                    </p>
                    <p className="text-xs text-muted-foreground">YoY Growth</p>
                  </div>
                </div>

                {/* Top Papers */}
                {selectedSignal.topPapers.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Top Cited Papers (Recent)
                    </h4>
                    <div className="space-y-2">
                      {selectedSignal.topPapers.map((paper, i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border">
                          <p className="text-sm font-medium text-foreground line-clamp-2">{paper.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                            <span>{paper.authors.slice(0, 2).join(", ")}{paper.authors.length > 2 ? " et al." : ""}</span>
                            <span>•</span>
                            <span>{paper.year}</span>
                            <Badge variant="outline" className="text-[10px] text-blue-500 border-blue-500/40">
                              {paper.citations} citations
                            </Badge>
                            {paper.source && (
                              <span className="text-[10px] truncate max-w-[120px]">{paper.source}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Institutions */}
                {selectedSignal.topInstitutions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Top Institutions
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSignal.topInstitutions.slice(0, 8).map((inst, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {inst.name} ({inst.country})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Co-author network summary */}
                {selectedSignal.coAuthorNetwork.nodes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Co-Author Network</h4>
                    <p className="text-xs text-muted-foreground">
                      {selectedSignal.coAuthorNetwork.nodes.length} researchers, {selectedSignal.coAuthorNetwork.edges.length} collaborations
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedSignal.coAuthorNetwork.nodes.slice(0, 10).map((name, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">{name}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
