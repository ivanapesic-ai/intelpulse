import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, Shield, Building2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Preferred display order — bodies not in this list appear at the end alphabetically
const BODY_ORDER = ["ISO", "IEC", "IEEE", "SAE", "UNECE", "ETSI", "ITU", "CEN/CENELEC", "Catena-X", "AUTOSAR", "COVESA", "5GAA", "SOAFEE", "Eclipse Foundation"];

interface StandardRow {
  id: string;
  keyword_id: string;
  standard_code: string;
  standard_title: string;
  issuing_body: string;
}

interface KeywordRow {
  id: string;
  display_name: string;
}

type CoverageLevel = "full" | "partial" | "none";

interface StandardsCoverageSectionProps {
  standards: StandardRow[];
  keywords: KeywordRow[];
}

function CoverageCell({ standards, body }: { standards: StandardRow[]; body: string }) {
  const matching = standards.filter((s) => s.issuing_body === body);
  if (matching.length === 0) {
    return <TableCell className="text-center"><span className="text-muted-foreground/30">—</span></TableCell>;
  }
  return (
    <TableCell className="text-center">
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center justify-center gap-1 cursor-default">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-medium text-foreground">{matching.length}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              {matching.map((s) => (
                <div key={s.id} className="text-xs">
                  <span className="font-mono font-medium">{s.standard_code}</span>
                  <span className="text-muted-foreground ml-1">— {s.standard_title}</span>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TableCell>
  );
}

function CoverageBadge({ level }: { level: CoverageLevel }) {
  if (level === "full")
    return <Badge variant="outline" className="text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-400">Well Covered</Badge>;
  if (level === "partial")
    return <Badge variant="outline" className="text-xs border-yellow-500/30 bg-yellow-500/10 text-yellow-400">Partial</Badge>;
  return <Badge variant="outline" className="text-xs border-red-500/30 bg-red-500/10 text-red-400">Gap</Badge>;
}

export function StandardsCoverageSection({ standards, keywords }: StandardsCoverageSectionProps) {
  const [filter, setFilter] = useState<CoverageLevel | "all">("all");

  const matrix = useMemo(() => {
    return keywords.map((kw) => {
      const kwStandards = standards.filter((s) => s.keyword_id === kw.id);
      const bodyCount = new Set(kwStandards.map((s) => s.issuing_body)).size;
      const level: CoverageLevel = bodyCount >= 3 ? "full" : bodyCount >= 1 ? "partial" : "none";
      return { keyword: kw, standards: kwStandards, bodyCount, totalStandards: kwStandards.length, level };
    });
  }, [standards, keywords]);

  const filtered = filter === "all" ? matrix : matrix.filter((r) => r.level === filter);
  const totalKeywords = matrix.length;
  const covered = matrix.filter((r) => r.level !== "none").length;
  const coveragePct = totalKeywords > 0 ? Math.round((covered / totalKeywords) * 100) : 0;

  const bodyDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of standards) {
      counts[s.issuing_body] = (counts[s.issuing_body] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([body, count]) => ({ body, count }));
  }, [standards]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Standards Coverage Matrix
        </h2>
        <p className="text-muted-foreground mt-1">
          Which technology keywords are backed by international standards — hover any ✓ to see specific standards.
        </p>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Total Standards:</span>
          <span className="font-bold text-foreground">{standards.length}</span>
        </div>
        <div className="flex items-center gap-2 min-w-[160px]">
          <span className="text-sm text-muted-foreground">Coverage:</span>
          <Progress value={coveragePct} className="h-2 flex-1" />
          <span className="text-sm font-medium text-foreground">{coveragePct}%</span>
        </div>
      </div>

      {/* Body distribution */}
      {bodyDistribution.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Building2 className="h-4 w-4 text-primary mt-0.5" />
          {bodyDistribution.map(({ body, count }) => (
            <Badge key={body} variant="secondary" className="text-xs gap-1.5 px-2 py-0.5">
              {body} <span className="font-bold">{count}</span>
            </Badge>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Show:</span>
        {(["all", "full", "partial", "none"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? `All (${totalKeywords})` :
             f === "full" ? `Covered (${matrix.filter(r => r.level === "full").length})` :
             f === "partial" ? `Partial (${matrix.filter(r => r.level === "partial").length})` :
             `Gaps (${matrix.filter(r => r.level === "none").length})`}
          </button>
        ))}
      </div>

      {/* Matrix table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-card z-10 min-w-[200px]">Keyword</TableHead>
                  <TableHead className="text-center w-16">Total</TableHead>
                  <TableHead className="text-center w-24">Level</TableHead>
                  {ALL_BODIES.map((body) => (
                    <TableHead key={body} className="text-center min-w-[56px]">
                      <span className="text-xs">{body}</span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={row.keyword.id}>
                    <TableCell className="sticky left-0 bg-card z-10 font-medium text-sm text-foreground">
                      {row.keyword.display_name}
                    </TableCell>
                    <TableCell className="text-center text-sm font-medium">{row.totalStandards}</TableCell>
                    <TableCell className="text-center"><CoverageBadge level={row.level} /></TableCell>
                    {ALL_BODIES.map((body) => (
                      <CoverageCell key={body} standards={row.standards} body={body} />
                    ))}
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={ALL_BODIES.length + 3} className="text-center py-8 text-muted-foreground">
                      No keywords match this filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
