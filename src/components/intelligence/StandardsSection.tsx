import { BookOpen, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useKeywordStandards } from "@/hooks/useKeywordStandards";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StandardsSectionProps {
  keywordId: string | null;
  aliases?: string[];
  compact?: boolean;
}

export function StandardsSection({ keywordId, aliases, compact }: StandardsSectionProps) {
  const { data: standards, isLoading } = useKeywordStandards(keywordId, aliases);

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-6 w-48 mb-2" />
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    );
  }

  if (!standards || standards.length === 0) return null;

  const sdoStandards = standards.filter((s) => s.body_type === "sdo");
  const consortiaStandards = standards.filter((s) => s.body_type === "consortia");

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-2.5">
        {/* SDO Standards */}
        {sdoStandards.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <BookOpen className="h-3 w-3" />
              Standards Bodies
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sdoStandards.map((s) => (
                <StandardChip key={s.id} standard={s} />
              ))}
            </div>
          </div>
        )}

        {/* Consortia */}
        {consortiaStandards.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building className="h-3 w-3" />
              Private Consortia
            </p>
            <div className="flex flex-wrap gap-1.5">
              {consortiaStandards.map((s) => (
                <StandardChip key={s.id} standard={s} />
              ))}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

function StandardChip({ standard }: { standard: { standard_code: string; standard_title: string; issuing_body: string; url: string | null; description: string | null; status: string } }) {
  const hasValidUrl = standard.url && standard.url.startsWith("http");
  
  const chip = (
    <Badge
      variant="outline"
      className="text-xs cursor-default hover:bg-muted/50 transition-colors"
    >
      {standard.standard_code}
    </Badge>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {hasValidUrl ? (
          <a href={standard.url!} target="_blank" rel="noopener noreferrer">
            <Badge
              variant="outline"
              className="text-xs cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors"
            >
              {standard.standard_code}
            </Badge>
          </a>
        ) : (
          chip
        )}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-medium text-xs">{standard.issuing_body} — {standard.standard_code}</p>
        <p className="text-xs text-muted-foreground">{standard.standard_title}</p>
        {standard.description && (
          <p className="text-xs text-muted-foreground/70 italic mt-0.5">{standard.description}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
