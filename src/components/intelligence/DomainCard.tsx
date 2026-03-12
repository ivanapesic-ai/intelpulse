import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Building2, Coins, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { 
  DomainOverview, 
  KeywordOverview, 
  QUADRANT_CONFIG, 
  MATURITY_CONFIG,
  formatCompactNumber 
} from "@/hooks/useDomainHierarchy";
import { KeywordRow } from "./KeywordRow";

interface DomainCardProps {
  domain: DomainOverview;
  keywords: KeywordOverview[];
  onSelectKeyword?: (keyword: KeywordOverview) => void;
  selectedKeywordId?: string | null;
}

export function DomainCard({ 
  domain, 
  keywords, 
  onSelectKeyword,
  selectedKeywordId 
}: DomainCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const quadrantConfig = QUADRANT_CONFIG[domain.strategicQuadrant] || QUADRANT_CONFIG["Monitor"];
  const maturityConfig = MATURITY_CONFIG[domain.maturityStage] || MATURITY_CONFIG["Emerging"];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn(
        "transition-all hover:shadow-md",
        isOpen && "ring-1 ring-primary/20"
      )}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer">
            <div className="flex items-center gap-4">
              {/* Expand Icon */}
              <div className="flex-shrink-0">
                {isOpen ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* Domain Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground text-lg">{domain.name}</h3>
                  <Badge variant="outline" className={cn("text-xs", quadrantConfig.bgColor, quadrantConfig.color)}>
                    {quadrantConfig.icon} {domain.strategicQuadrant}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {domain.description || `${keywords.length} technologies tracked`}
                </p>
              </div>

              {/* C-O Scores */}
              <div className="hidden md:flex items-center gap-3">
                <div className="text-center px-3 py-1 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Challenge</p>
                  <p className="font-bold text-foreground">{domain.challengeScore.toFixed(1)}</p>
                </div>
                <div className="text-center px-3 py-1 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Opportunity</p>
                  <p className="font-bold text-foreground">{domain.opportunityScore.toFixed(1)}</p>
                </div>
              </div>

              {/* Maturity Badge */}
              <Badge variant="secondary" className={cn("hidden lg:flex", maturityConfig.color)}>
                {maturityConfig.label}
              </Badge>

              {/* Key Metrics */}
              <div className="hidden xl:flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium text-foreground">{domain.companyCount}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Banknote className="h-4 w-4" />
                  <span className="font-medium text-foreground">{formatCompactNumber(domain.totalFundingUsd)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium text-foreground">{domain.totalPatents}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="border-t bg-muted/30">
                  <div className="p-2 space-y-1">
                    {keywords.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No keywords mapped to this domain yet
                      </p>
                    ) : (
                      keywords.map((keyword) => (
                        <KeywordRow
                          key={keyword.keywordId}
                          keyword={keyword}
                          isSelected={selectedKeywordId === keyword.keywordId}
                          onSelect={() => onSelectKeyword?.(keyword)}
                        />
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
