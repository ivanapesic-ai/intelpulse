import { motion } from "framer-motion";
import { TrendingUp, FileText, Newspaper, Info, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { TechnologyIntelligence } from "@/hooks/useTechnologyIntelligence";
import { useResearchSignalForKeyword } from "@/hooks/useResearchSignals";

// Format large numbers compactly (e.g., 88839900000 -> €88.8B)
function formatCompactNumber(value: number, prefix = ""): string {
  if (value >= 1_000_000_000) {
    return `${prefix}${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${prefix}${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${prefix}${(value / 1_000).toFixed(1)}K`;
  }
  return `${prefix}${value}`;
}

interface SignalBreakdownProps {
  technology: TechnologyIntelligence;
}

const SIGNAL_DEFINITIONS = {
  investment: {
    name: "Investment",
    indicator: "Investment",
    source: "Market Data",
    description: "Venture capital funding, growth stage, and capital raised by ecosystem companies",
  },
  research: {
    name: "Research",
    indicator: "Academic research intensity",
    source: "OpenAlex",
    description: "Scholarly publications, citation velocity, and research growth from 250M+ academic works",
  },
  patents: {
    name: "Patents",
    indicator: "Patent – granted? Applied for?",
    source: "PATSTAT / EPO",
    description: "Patent filings, grants, and innovation activity tracked via European Patent Office",
  },
  media: {
    name: "Market Response",
    indicator: "Market/media response",
    source: "Tech coverage",
    description: "Document mentions, news coverage, and market visibility from CEI sources",
  },
};

export function SignalBreakdown({ technology }: SignalBreakdownProps) {
  const { data: researchSignal } = useResearchSignalForKeyword(technology.keywordId);

  // Use percentile-ranked scores from DB directly (not hardcoded thresholds)
  const signals = [
    {
      key: "investment",
      ...SIGNAL_DEFINITIONS.investment,
      score: technology.investmentScore ?? 0,
      maxScore: 2,
      icon: TrendingUp,
      color: "bg-emerald-500",
      lightColor: "bg-emerald-500/20",
      textColor: "text-emerald-500",
      rawValue: technology.totalFundingEur > 0 
        ? formatCompactNumber(technology.totalFundingEur, "€")
        : "—",
      rawLabel: "Total Raised",
      secondaryValue: technology.dealroomCompanyCount > 0 ? `${technology.dealroomCompanyCount} companies` : null,
    },
    {
      key: "patents",
      ...SIGNAL_DEFINITIONS.patents,
      score: technology.patentsScore ?? 0,
      maxScore: 2,
      icon: FileText,
      color: "bg-blue-500",
      lightColor: "bg-blue-500/20",
      textColor: "text-blue-500",
      rawValue: technology.totalPatents > 0 
        ? technology.totalPatents.toLocaleString()
        : "—",
      rawLabel: "Patents Filed",
      secondaryValue: null,
    },
    {
      key: "media",
      ...SIGNAL_DEFINITIONS.media,
      score: technology.visibilityScore ?? 0,
      maxScore: 2,
      icon: Newspaper,
      color: "bg-purple-500",
      lightColor: "bg-purple-500/20",
      textColor: "text-purple-500",
      rawValue: (technology.documentMentionCount + (technology.newsMentionCount ?? 0)).toString(),
      rawLabel: "Mentions",
      secondaryValue: technology.documentMentionCount > 0 ? `${technology.documentMentionCount} documents` : null,
    },
    {
      key: "research",
      ...SIGNAL_DEFINITIONS.research,
      score: technology.researchScore ?? researchSignal?.researchScore ?? 0,
      maxScore: 2,
      icon: BookOpen,
      color: "bg-violet-500",
      lightColor: "bg-violet-500/20",
      textColor: "text-violet-500",
      rawValue: researchSignal
        ? formatCompactNumber(researchSignal.worksLast5y)
        : "—",
      rawLabel: "Papers (5yr)",
      secondaryValue: researchSignal && researchSignal.growthRateYoy !== 0
        ? `${researchSignal.growthRateYoy >= 0 ? "+" : ""}${researchSignal.growthRateYoy}% YoY growth`
        : null,
    },
  ];

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

  // Calculate composite from the 3 tender signals
  const compositeScore = signals.reduce((acc, s) => acc + s.score, 0) / signals.length;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Early Indicators of New Technologies
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          4-signal model: H1 Now · H2 Emerging · H3 Vision
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <TooltipProvider>
          {signals.map((signal, index) => (
            <motion.div
              key={signal.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              {/* Signal Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded", signal.lightColor)}>
                    <signal.icon className={cn("h-4 w-4", signal.textColor)} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold">{signal.name}</span>
                    <Badge variant="outline" className="text-[9px] ml-1 px-1 py-0">{signal.horizon}</Badge>
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
                {/* Raw value prominently displayed */}
                <div className="text-right">
                  <span className={cn("text-lg font-bold", signal.textColor)}>
                    {signal.rawValue}
                  </span>
                  <span className="text-xs text-muted-foreground block">
                    {signal.rawLabel}
                  </span>
                </div>
              </div>

              {/* Progress Bar with score indicator */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(signal.score / signal.maxScore) * 100}%` }}
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

              {/* Secondary details */}
              {signal.secondaryValue && (
                <p className="text-xs text-muted-foreground pl-9">
                  {signal.secondaryValue}
                </p>
              )}
            </motion.div>
          ))}
        </TooltipProvider>
        
        {/* Composite Score */}
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
            Composite of Investment, Patents, Market Response, and Research signals
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
