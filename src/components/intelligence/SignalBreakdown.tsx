import { motion } from "framer-motion";
import { TrendingUp, FileText, Newspaper, Info, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { TechnologyIntelligence } from "@/hooks/useTechnologyIntelligence";
import { useResearchSignalForKeyword } from "@/hooks/useResearchSignals";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Format large numbers compactly
function formatCompactNumber(value: number, prefix = ""): string {
  if (value >= 1_000_000_000) return `${prefix}${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${prefix}${(value / 1_000).toFixed(1)}K`;
  return `${prefix}${value}`;
}

// Fallback signal definitions if DB query fails
const FALLBACK_SIGNALS = [
  { signal_key: "investment", label: "Investment", display_order: 1 },
  { signal_key: "research", label: "Research", display_order: 2 },
  { signal_key: "patents", label: "Patents", display_order: 3 },
  { signal_key: "visibility", label: "Market Response", display_order: 4 },
];

function useSignalDefinitions() {
  return useQuery({
    queryKey: ["signal-definitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signal_definitions")
        .select("signal_key, label, display_order")
        .order("display_order");
      if (error) throw error;
      return data || FALLBACK_SIGNALS;
    },
    staleTime: 1000 * 60 * 30, // 30min cache
  });
}

interface SignalBreakdownProps {
  technology: TechnologyIntelligence;
}

const SIGNAL_META: Record<string, {
  indicator: string;
  source: string;
  description: string;
  icon: typeof TrendingUp;
  color: string;
  lightColor: string;
  textColor: string;
}> = {
  investment: {
    indicator: "Investment",
    source: "Market Data",
    description: "Venture capital funding, growth stage, and capital raised by ecosystem companies",
    icon: TrendingUp,
    color: "bg-emerald-500",
    lightColor: "bg-emerald-500/20",
    textColor: "text-emerald-500",
  },
  research: {
    indicator: "Academic research intensity",
    source: "OpenAlex",
    description: "Scholarly publications, citation velocity, and research growth from 250M+ academic works",
    icon: BookOpen,
    color: "bg-violet-500",
    lightColor: "bg-violet-500/20",
    textColor: "text-violet-500",
  },
  patents: {
    indicator: "Patent activity",
    source: "PATSTAT / EPO",
    description: "Patent filings, grants, and innovation activity tracked via European Patent Office",
    icon: FileText,
    color: "bg-blue-500",
    lightColor: "bg-blue-500/20",
    textColor: "text-blue-500",
  },
  visibility: {
    indicator: "Market/media response",
    source: "Tech coverage",
    description: "Document mentions, news coverage, and market visibility from CEI sources",
    icon: Newspaper,
    color: "bg-purple-500",
    lightColor: "bg-purple-500/20",
    textColor: "text-purple-500",
  },
};

export function SignalBreakdown({ technology }: SignalBreakdownProps) {
  const { data: researchSignal } = useResearchSignalForKeyword(technology.keywordId);
  const { data: signalDefs } = useSignalDefinitions();

  const orderedDefs = (signalDefs || FALLBACK_SIGNALS)
    .filter(d => SIGNAL_META[d.signal_key])
    .sort((a, b) => a.display_order - b.display_order);

  const getSignalData = (key: string) => {
    const meta = SIGNAL_META[key];
    if (!meta) return null;

    switch (key) {
      case "investment":
        return {
          ...meta,
          name: orderedDefs.find(d => d.signal_key === key)?.label || "Investment",
          score: technology.investmentScore ?? 0,
          rawValue: technology.totalFundingEur > 0 ? formatCompactNumber(technology.totalFundingEur, "€") : "—",
          rawLabel: "Total Raised",
          secondaryValue: technology.dealroomCompanyCount > 0 ? `${technology.dealroomCompanyCount} companies` : null,
        };
      case "research":
        return {
          ...meta,
          name: orderedDefs.find(d => d.signal_key === key)?.label || "Research",
          score: technology.researchScore ?? researchSignal?.researchScore ?? 0,
          rawValue: researchSignal ? formatCompactNumber(researchSignal.worksLast5y) : "—",
          rawLabel: "Papers (5yr)",
          secondaryValue: researchSignal && researchSignal.growthRateYoy !== 0
            ? `${researchSignal.growthRateYoy >= 0 ? "+" : ""}${researchSignal.growthRateYoy}% YoY growth`
            : null,
        };
      case "patents":
        return {
          ...meta,
          name: orderedDefs.find(d => d.signal_key === key)?.label || "Patents",
          score: technology.patentsScore ?? 0,
          rawValue: technology.totalPatents > 0 ? technology.totalPatents.toLocaleString() : "—",
          rawLabel: "Patents Filed",
          secondaryValue: null,
        };
      case "visibility":
        return {
          ...meta,
          name: orderedDefs.find(d => d.signal_key === key)?.label || "Market Response",
          score: technology.visibilityScore ?? 0,
          rawValue: (technology.documentMentionCount + (technology.newsMentionCount ?? 0)).toString(),
          rawLabel: "Mentions",
          secondaryValue: technology.documentMentionCount > 0 ? `${technology.documentMentionCount} documents` : null,
        };
      default:
        return null;
    }
  };

  const signals = orderedDefs.map(d => getSignalData(d.signal_key)).filter(Boolean) as Array<NonNullable<ReturnType<typeof getSignalData>>>;

  const getScoreLabel = (score: number) => {
    if (score === 2) return "Strong";
    if (score === 1) return "Moderate";
    return "Emerging";
  };

  const getScoreColor = (score: number) => {
    if (score === 2) return "text-emerald-500";
    if (score === 1) return "text-amber-500";
    return "text-red-500";
  };

  const compositeScore = signals.reduce((acc, s) => acc + s.score, 0) / signals.length;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Signal Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <TooltipProvider>
          {signals.map((signal, index) => (
            <motion.div
              key={signal.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded", signal.lightColor)}>
                    <signal.icon className={cn("h-4 w-4", signal.textColor)} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold">{signal.name}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="inline h-3 w-3 ml-1.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="font-semibold mb-1">{signal.indicator}</p>
                        <p className="text-xs">{signal.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">Source: {signal.source}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn("text-lg font-bold", signal.textColor)}>
                    {signal.rawValue}
                  </span>
                  <span className="text-xs text-muted-foreground block">
                    {signal.rawLabel}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(signal.score / 2) * 100}%` }}
                    transition={{ delay: index * 0.1 + 0.2, duration: 0.5, ease: "easeOut" }}
                    className={cn("h-full rounded-full", signal.color)}
                  />
                </div>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getScoreColor(signal.score))}
                >
                  {getScoreLabel(signal.score)}
                </Badge>
              </div>

              {signal.secondaryValue && (
                <p className="text-xs text-muted-foreground pl-9">
                  {signal.secondaryValue}
                </p>
              )}
            </motion.div>
          ))}
        </TooltipProvider>
        
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold">Signal Strength</span>
            <Badge variant="outline" className={cn("text-sm font-semibold", getScoreColor(Math.round(compositeScore)))}>
              {getScoreLabel(Math.round(compositeScore))}
            </Badge>
          </div>
          <Progress 
            value={(compositeScore / 2) * 100} 
            className="h-3"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Composite of Investment, Research, Patents, and Market Response signals
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
