import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldAlert, TrendingUp } from "lucide-react";

interface StandardRow {
  id: string;
  keyword_id: string;
  issuing_body: string;
}

interface KeywordRow {
  id: string;
  display_name: string;
}

interface GapAnalysisSectionProps {
  standards: StandardRow[];
  keywords: KeywordRow[];
}

export function GapAnalysisSection({ standards, keywords }: GapAnalysisSectionProps) {
  const analysis = useMemo(() => {
    const kwMap = new Map<string, { name: string; bodies: Set<string>; count: number }>();
    
    for (const kw of keywords) {
      kwMap.set(kw.id, { name: kw.display_name, bodies: new Set(), count: 0 });
    }
    
    for (const s of standards) {
      const entry = kwMap.get(s.keyword_id);
      if (entry) {
        entry.bodies.add(s.issuing_body);
        entry.count++;
      }
    }

    const gaps: { name: string }[] = [];
    const partial: { name: string; bodies: string[]; count: number }[] = [];
    const covered: { name: string; bodies: string[]; count: number }[] = [];

    for (const [, v] of kwMap) {
      if (v.bodies.size === 0) {
        gaps.push({ name: v.name });
      } else if (v.bodies.size < 3) {
        partial.push({ name: v.name, bodies: Array.from(v.bodies), count: v.count });
      } else {
        covered.push({ name: v.name, bodies: Array.from(v.bodies), count: v.count });
      }
    }

    return { gaps, partial, covered, total: keywords.length };
  }, [standards, keywords]);

  const gapPct = analysis.total > 0 ? Math.round((analysis.gaps.length / analysis.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-destructive" />
          Interoperability Gap Analysis
        </h2>
        <p className="text-muted-foreground mt-1">
          Technologies in our ontology where standards coverage is missing or insufficient — the blind spots.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-foreground">{analysis.gaps.length}</p>
                <p className="text-xs text-muted-foreground">No Standards Coverage</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{analysis.partial.length}</p>
                <p className="text-xs text-muted-foreground">Partial Coverage (1–2 bodies)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-xs font-bold text-emerald-500">✓</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{analysis.covered.length}</p>
                <p className="text-xs text-muted-foreground">Well Covered (3+ bodies)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gap keywords */}
      {analysis.gaps.length > 0 && (
        <Card className="border-destructive/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Coverage Gaps — {gapPct}% of ontology has zero standards
            </CardTitle>
            <CardDescription>
              These technology keywords have no linked international standards. Priority areas for standards mapping.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.gaps.map((g) => (
                <Badge key={g.name} variant="outline" className="text-xs border-destructive/30 text-destructive bg-destructive/5">
                  {g.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Partial coverage */}
      {analysis.partial.length > 0 && (
        <Card className="border-yellow-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-yellow-500 flex items-center gap-2">
              Partial Coverage — needs more standards bodies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.partial.map((p) => (
                <Badge key={p.name} variant="outline" className="text-xs border-yellow-500/30 text-yellow-600 dark:text-yellow-400 bg-yellow-500/5">
                  {p.name}
                  <span className="ml-1 opacity-60">({p.count} std, {p.bodies.length} {p.bodies.length === 1 ? 'body' : 'bodies'})</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
