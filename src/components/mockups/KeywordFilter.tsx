import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { type KeywordSource, KEYWORD_SOURCE_CONFIG } from "@/types/database";

interface KeywordFilterProps {
  keywords: Array<{
    id: string;
    keyword: string;
    displayName: string;
    source: KeywordSource;
  }>;
  selectedKeywords: Set<string>;
  onToggle: (keywordId: string) => void;
  showSource?: boolean;
  className?: string;
}

export function KeywordFilter({ 
  keywords, 
  selectedKeywords, 
  onToggle,
  showSource = true,
  className 
}: KeywordFilterProps) {
  // Group keywords by source
  const groupedKeywords = keywords.reduce((acc, kw) => {
    if (!acc[kw.source]) acc[kw.source] = [];
    acc[kw.source].push(kw);
    return acc;
  }, {} as Record<KeywordSource, typeof keywords>);

  const sources: KeywordSource[] = ['cei_sphere', 'dealroom', 'manual'];

  return (
    <div className={cn("space-y-4", className)}>
      {sources.map(source => {
        const sourceKeywords = groupedKeywords[source];
        if (!sourceKeywords?.length) return null;

        const config = KEYWORD_SOURCE_CONFIG[source];

        return (
          <div key={source}>
            {showSource && (
              <div className={cn("text-xs font-medium mb-2", config.color)}>
                {config.label}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {sourceKeywords.map(kw => {
                const isSelected = selectedKeywords.has(kw.id);
                
                return (
                  <button
                    key={kw.id}
                    onClick={() => onToggle(kw.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium border transition-all",
                      isSelected
                        ? "bg-primary/20 border-primary/50 text-primary"
                        : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {kw.displayName}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface KeywordBadgeProps {
  keyword: string;
  source: KeywordSource;
  size?: "sm" | "md";
  className?: string;
}

export function KeywordBadge({ keyword, source, size = "md", className }: KeywordBadgeProps) {
  const config = KEYWORD_SOURCE_CONFIG[source];
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-normal",
        config.color,
        size === "sm" && "text-xs px-1.5 py-0",
        className
      )}
    >
      {keyword}
    </Badge>
  );
}

interface SourceFilterProps {
  activeSources: Set<KeywordSource>;
  onToggle: (source: KeywordSource) => void;
  className?: string;
}

export function SourceFilter({ activeSources, onToggle, className }: SourceFilterProps) {
  const sources: KeywordSource[] = ['cei_sphere', 'dealroom', 'manual'];

  return (
    <div className={cn("flex gap-2", className)}>
      {sources.map(source => {
        const config = KEYWORD_SOURCE_CONFIG[source];
        const isActive = activeSources.has(source);

        return (
          <button
            key={source}
            onClick={() => onToggle(source)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
              isActive
                ? cn("bg-primary/20 border-primary/50", config.color)
                : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
