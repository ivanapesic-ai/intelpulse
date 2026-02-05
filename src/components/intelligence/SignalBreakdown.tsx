import { motion } from "framer-motion";
import { TrendingUp, FileText, Newspaper, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { TechnologyIntelligence } from "@/hooks/useTechnologyIntelligence";

interface SignalBreakdownProps {
  technology: TechnologyIntelligence;
}

// Tender-aligned 3-signal model
const SIGNAL_DEFINITIONS = {
  investment: {
    name: "Signal 1: Investment",
    indicator: "Investment",
    source: "Crunchbase",
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
  // Calculate signal scores as percentages (0-2 scale from tender)
  const signals = [
    {
      key: "investment",
      ...SIGNAL_DEFINITIONS.investment,
      value: technology.investmentScore ?? 0,
      maxValue: 2,
      icon: TrendingUp,
      color: "bg-emerald-500",
      lightColor: "bg-emerald-500/20",
      textColor: "text-emerald-500",
      details: technology.totalFundingEur > 0 
        ? `€${(technology.totalFundingEur / 1_000_000).toFixed(1)}M raised`
        : "No funding data",
    },
    {
      key: "patents",
      ...SIGNAL_DEFINITIONS.patents,
      value: technology.totalPatents >= 100 ? 2 : technology.totalPatents >= 20 ? 1 : 0,
      maxValue: 2,
      icon: FileText,
      color: "bg-blue-500",
      lightColor: "bg-blue-500/20",
      textColor: "text-blue-500",
      details: technology.totalPatents > 0 
        ? `${technology.totalPatents.toLocaleString()} patents`
        : "No patent data",
    },
    {
      key: "media",
      ...SIGNAL_DEFINITIONS.media,
      value: technology.visibilityScore ?? 0,
      maxValue: 2,
      icon: Newspaper,
      color: "bg-purple-500",
      lightColor: "bg-purple-500/20",
      textColor: "text-purple-500",
      details: `${technology.documentMentionCount + (technology.newsMentionCount ?? 0)} mentions`,
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

  // Calculate composite from the 3 tender signals
  const compositeScore = signals.reduce((acc, s) => acc + s.value, 0) / signals.length;

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
                <Badge 
                  variant="outline" 
                  className={cn("text-xs font-semibold", getScoreColor(signal.value))}
                >
                  {getScoreLabel(signal.value)}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(signal.value / signal.maxValue) * 100}%` }}
                    transition={{ delay: index * 0.1 + 0.2, duration: 0.5, ease: "easeOut" }}
                    className={cn("h-full rounded-full", signal.color)}
                  />
                </div>
                <span className="text-xs font-mono w-8 text-right font-semibold">
                  {signal.value}/{signal.maxValue}
                </span>
              </div>

              {/* Details */}
              <p className="text-xs text-muted-foreground pl-9">
                {signal.details}
              </p>
            </motion.div>
          ))}
        </TooltipProvider>
        
        {/* Composite Score */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold">Composite Signal Score</span>
            <span className="text-xl font-bold text-primary">
              {compositeScore.toFixed(1)}/2
            </span>
          </div>
          <Progress 
            value={(compositeScore / 2) * 100} 
            className="h-3"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Average of 3 tender-defined signals (Investment, Patents, Market Response)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
