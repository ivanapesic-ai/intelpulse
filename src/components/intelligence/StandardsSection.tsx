import { BookOpen, Building, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useKeywordStandards } from "@/hooks/useKeywordStandards";

interface StandardsSectionProps {
  keywordId: string | null;
}

export function StandardsSection({ keywordId }: StandardsSectionProps) {
  const { data: standards, isLoading } = useKeywordStandards(keywordId);

  if (isLoading) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          International Standards
        </h3>
        <div className="space-y-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      </div>
    );
  }

  if (!standards || standards.length === 0) return null;

  const sdoStandards = standards.filter((s) => s.body_type === "sdo");
  const consortiaStandards = standards.filter((s) => s.body_type === "consortia");

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <BookOpen className="h-4 w-4" />
        International Standards ({standards.length})
      </h3>
      <div className="space-y-3">
        {/* SDO Standards */}
        {sdoStandards.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Standards Bodies</p>
            {sdoStandards.map((s) => (
              <StandardRow key={s.id} standard={s} />
            ))}
          </div>
        )}

        {/* Consortia */}
        {consortiaStandards.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
              <Building className="h-3 w-3" />
              Private Consortia
            </p>
            {consortiaStandards.map((s) => (
              <StandardRow key={s.id} standard={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StandardRow({ standard }: { standard: { standard_code: string; standard_title: string; issuing_body: string; url: string | null; description: string | null; status: string } }) {
  return (
    <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
      <div className="flex items-start gap-2">
        <Badge variant="outline" className="text-xs flex-shrink-0 mt-0.5">{standard.issuing_body}</Badge>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-foreground">{standard.standard_code}</span>
            {standard.status === "draft" && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0">Draft</Badge>
            )}
            {standard.url && (
              <a href={standard.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground ml-auto">
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{standard.standard_title}</p>
          {standard.description && (
            <p className="text-xs text-muted-foreground/70 italic mt-0.5 line-clamp-1">{standard.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
