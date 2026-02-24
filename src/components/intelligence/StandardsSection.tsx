import { BookOpen, Building } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useKeywordStandards } from "@/hooks/useKeywordStandards";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StandardsSectionProps {
  keywordId: string | null;
  aliases?: string[];
}

export function StandardsSection({ keywordId, aliases }: StandardsSectionProps) {
  const { data: standards, isLoading } = useKeywordStandards(keywordId, aliases);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    );
  }

  if (!standards || standards.length === 0) return null;

  const sdoStandards = standards.filter((s) => s.body_type === "sdo");
  const consortiaStandards = standards.filter((s) => s.body_type === "consortia");

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        {sdoStandards.length > 0 && (
          <StandardGroup
            icon={<BookOpen className="h-3.5 w-3.5" />}
            label="Standards Bodies"
            standards={sdoStandards}
          />
        )}
        {consortiaStandards.length > 0 && (
          <StandardGroup
            icon={<Building className="h-3.5 w-3.5" />}
            label="Private Consortia"
            standards={consortiaStandards}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

function StandardGroup({ icon, label, standards }: {
  icon: React.ReactNode;
  label: string;
  standards: Array<{ id: string; standard_code: string; standard_title: string; issuing_body: string; url: string | null; description: string | null; status: string }>;
}) {
  // Group by issuing body for visual clarity
  const grouped = standards.reduce<Record<string, typeof standards>>((acc, s) => {
    (acc[s.issuing_body] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div>
      <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5">
        {icon}
        {label}
        <span className="text-muted-foreground/50 font-normal normal-case tracking-normal ml-1">({standards.length})</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(grouped).map(([body, items]) =>
          items.map((s) => <StandardChip key={s.id} standard={s} />)
        )}
      </div>
    </div>
  );
}

function StandardChip({ standard }: { standard: { standard_code: string; standard_title: string; issuing_body: string; url: string | null; description: string | null; status: string } }) {
  const hasValidUrl = standard.url && standard.url.startsWith("http");

  const content = (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border border-border bg-background text-foreground/80 hover:bg-muted hover:text-foreground transition-colors cursor-default select-none">
      <span className="text-muted-foreground/60 font-semibold">{standard.issuing_body}</span>
      <span className="text-muted-foreground/30">·</span>
      <span>{standard.standard_code.replace(new RegExp(`^${standard.issuing_body}\\s*`, "i"), "")}</span>
    </span>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {hasValidUrl ? (
          <a href={standard.url!} target="_blank" rel="noopener noreferrer" className="no-underline">
            {content}
          </a>
        ) : (
          content
        )}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-left">
        <p className="font-semibold text-xs">{standard.standard_code}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{standard.standard_title}</p>
        {standard.description && (
          <p className="text-xs text-muted-foreground/70 italic mt-1">{standard.description}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
