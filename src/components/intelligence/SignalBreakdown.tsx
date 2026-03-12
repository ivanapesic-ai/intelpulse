import { motion } from "framer-motion";
import { TrendingUp, FileText, Newspaper, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { TechnologyIntelligence } from "@/hooks/useTechnologyIntelligence";

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

// Tender-aligned 3-signal model
const SIGNAL_DEFINITIONS = {
  investment: {
    name: "Signal 1: Investment",
    indicator: "Investment",
    source: "Market Data",
    description: "Venture capital funding, growth stage, and capital raised by ecosystem companies",
  },
  patents: {
    name: "Signal 2: Patents",
    indicator: "Patent – granted? Applied for?",
    source: "PATSTAT / EPO",
    description: "Patent filings, grants, and innovation activity tracked via European Patent Office",
  },
  media: {
    name: "Signal 3: Market Response",
    indicator: "Market/media response",
    source: "Tech coverage",
    description: "Document mentions, news coverage, and market visibility from CEI sources",
  },
};

export function SignalBreakdown({ technology }: SignalBreakdownProps) {
  // Calculate signal scores (0-2 scale for internal use)
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
      score: technology.totalPatents >= 100 ? 2 : technology.totalPatents >= 20 ? 1 : 0,
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
          3-signal model for technology maturity assessment
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
            Composite of Investment, Patents, and Market Response signals
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
