import { Building2, Coins, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  KeywordOverview, 
  formatCompactNumber 
} from "@/hooks/useDomainHierarchy";

interface KeywordRowProps {
  keyword: KeywordOverview;
  isSelected: boolean;
  onSelect: () => void;
}

export function KeywordRow({ keyword, isSelected, onSelect }: KeywordRowProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-all",
        "hover:bg-background/80",
        isSelected && "bg-primary/5 ring-1 ring-primary/30"
      )}
    >
      {/* Keyword Name */}
      <div className="flex-1 min-w-0">
        <span className="font-medium text-foreground truncate">{keyword.displayName}</span>
      </div>

      {/* Inherited C-O Scores from Domain */}
      <div className="flex items-center gap-2">
        <div className="px-2 py-0.5 rounded text-xs font-medium bg-muted">
          C: {keyword.domainChallenge.toFixed(1)}
        </div>
        <div className="px-2 py-0.5 rounded text-xs font-medium bg-muted">
          O: {keyword.domainOpportunity.toFixed(1)}
        </div>
      </div>

      {/* Metrics */}
      <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1" title="Companies">
          <Building2 className="h-3.5 w-3.5" />
          <span>{keyword.companyCount}</span>
        </div>
        <div className="flex items-center gap-1" title="Total Funding">
          <Banknote className="h-3.5 w-3.5" />
          <span>{formatCompactNumber(keyword.totalFundingUsd)}</span>
        </div>
        <div className="flex items-center gap-1" title="Patents">
          <FileText className="h-3.5 w-3.5" />
          <span>{keyword.totalPatents}</span>
        </div>
      </div>
    </div>
  );
}
