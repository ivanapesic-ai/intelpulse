import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { PlatformFooter } from "@/components/mockups/PlatformFooter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, CheckCircle2, AlertTriangle, XCircle, Shield, Building2 } from "lucide-react";
import { useMemo, useState } from "react";

const ALL_BODIES_SDO = ["ISO", "IEC", "ITU", "ETSI", "IEEE", "SAE", "UNECE", "CEN/CENELEC"] as const;
const ALL_BODIES_CONSORTIA = ["CharIN", "AUTOSAR", "COVESA", "5GAA", "GENIVI", "OMA", "FIWARE", "Eclipse Foundation"] as const;
const ALL_BODIES = [...ALL_BODIES_SDO, ...ALL_BODIES_CONSORTIA];

interface StandardRow {
  id: string;
  keyword_id: string;
  standard_code: string;
  standard_title: string;
  issuing_body: string;
  body_type: string;
  status: string | null;
  url: string | null;
  description: string | null;
}

interface KeywordRow {
  id: string;
  display_name: string;
  keyword: string;
  excluded_from_sdv: boolean | null;
}

function useStandardsCoverage() {
  return useQuery({
    queryKey: ["standards-coverage-matrix"],
    queryFn: async () => {
      // Fetch all standards with keyword names
      const { data: standards, error: sErr } = await supabase
        .from("keyword_standards")
        .select("id, keyword_id, standard_code, standard_title, issuing_body, body_type, status, url, description")
        .order("issuing_body");
      if (sErr) throw sErr;

      // Fetch all active keywords (not excluded)
      const { data: keywords, error: kErr } = await supabase
        .from("technology_keywords")
        .select("id, display_name, keyword, excluded_from_sdv")
        .eq("excluded_from_sdv", false)
        .order("display_name");
      if (kErr) throw kErr;

      return {
        standards: (standards || []) as StandardRow[],
        keywords: (keywords || []) as KeywordRow[],
      };
    },
  });
}

function CoverageCell({ standards, body }: { standards: StandardRow[]; body: string }) {
  const matching = standards.filter((s) => s.issuing_body === body);
  if (matching.length === 0) {
    return (
      <TableCell className="text-center">
        <span className="text-muted-foreground/30">—</span>
      </TableCell>
    );
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

type CoverageLevel = "full" | "partial" | "none";

function CoverageBadge({ level }: { level: CoverageLevel }) {
  if (level === "full")
    return <Badge variant="outline" className="text-xs border-emerald-500/30 bg-emerald-500/10 text-emerald-400">Well Covered</Badge>;
  if (level === "partial")
    return <Badge variant="outline" className="text-xs border-yellow-500/30 bg-yellow-500/10 text-yellow-400">Partial</Badge>;
  return <Badge variant="outline" className="text-xs border-red-500/30 bg-red-500/10 text-red-400">Gap</Badge>;
}

export default function V2GInteropMatrix() {
  const { data, isLoading } = useStandardsCoverage();
  const [filter, setFilter] = useState<CoverageLevel | "all">("all");

  const matrix = useMemo(() => {
    if (!data) return [];

    return data.keywords.map((kw) => {
      const kwStandards = data.standards.filter((s) => s.keyword_id === kw.id);
      const bodyCount = new Set(kwStandards.map((s) => s.issuing_body)).size;
      const level: CoverageLevel = bodyCount >= 3 ? "full" : bodyCount >= 1 ? "partial" : "none";
      return { keyword: kw, standards: kwStandards, bodyCount, totalStandards: kwStandards.length, level };
    });
  }, [data]);

  const filtered = filter === "all" ? matrix : matrix.filter((r) => r.level === filter);

  // Summary stats
  const totalKeywords = matrix.length;
  const covered = matrix.filter((r) => r.level !== "none").length;
  const gaps = matrix.filter((r) => r.level === "none").length;
  const coveragePct = totalKeywords > 0 ? Math.round((covered / totalKeywords) * 100) : 0;
  const totalStandards = data?.standards.length ?? 0;

  // Body distribution
  const bodyDistribution = useMemo(() => {
    if (!data) return [];
    const counts: Record<string, number> = {};
    for (const s of data.standards) {
      counts[s.issuing_body] = (counts[s.issuing_body] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([body, count]) => ({ body, count }));
  }, [data]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PlatformHeader />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">Live Data</Badge>
            <Badge variant="outline" className="text-xs">All Keywords</Badge>
          </div>
          <h1 className="text-3xl font-bold text-foreground mt-2">
            Standards Coverage Matrix
          </h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Which technology keywords in our ontology are backed by international standards — and where are the gaps? 
            Hover over any ✓ to see the specific standards linked.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : (
          <>
            {/* Summary Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold text-foreground">{totalStandards}</p>
                      <p className="text-xs text-muted-foreground">Total Standards</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="text-2xl font-bold text-foreground">{covered}</p>
                      <p className="text-xs text-muted-foreground">Keywords Covered</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="text-2xl font-bold text-foreground">{gaps}</p>
                      <p className="text-xs text-muted-foreground">Coverage Gaps</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Coverage</span>
                      <span className="font-medium text-foreground">{coveragePct}%</span>
                    </div>
                    <Progress value={coveragePct} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Body Distribution */}
            {bodyDistribution.length > 0 && (
              <Card className="border-border/50 mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    Standards by Issuing Body
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {bodyDistribution.map(({ body, count }) => (
                      <Badge key={body} variant="secondary" className="text-xs gap-1.5 px-3 py-1">
                        {body} <span className="font-bold">{count}</span>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filter */}
            <div className="flex items-center gap-2 mb-4">
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
                   f === "full" ? `Well Covered (${matrix.filter(r => r.level === "full").length})` :
                   f === "partial" ? `Partial (${matrix.filter(r => r.level === "partial").length})` :
                   `Gaps (${gaps})`}
                </button>
              ))}
            </div>

            {/* Matrix Table */}
            <Card className="border-border/50">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-card z-10 min-w-[200px]">Technology Keyword</TableHead>
                        <TableHead className="text-center w-20">Total</TableHead>
                        <TableHead className="text-center w-24">Coverage</TableHead>
                        {ALL_BODIES.map((body) => (
                          <TableHead key={body} className="text-center min-w-[60px]">
                            <span className="text-xs writing-mode-vertical">{body}</span>
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
                          <TableCell className="text-center text-sm font-medium text-foreground">
                            {row.totalStandards}
                          </TableCell>
                          <TableCell className="text-center">
                            <CoverageBadge level={row.level} />
                          </TableCell>
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

            <p className="text-xs text-muted-foreground mt-4">
              Coverage levels: <strong>Well Covered</strong> = 3+ issuing bodies · <strong>Partial</strong> = 1–2 bodies · <strong>Gap</strong> = no linked standards.
              Standards are manually curated in the admin panel.
            </p>
          </>
        )}
      </main>
      <PlatformFooter />
    </div>
  );
}
