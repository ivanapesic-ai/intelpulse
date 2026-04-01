import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldAlert, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface KeywordRow {
  id: string;
  display_name: string;
}

interface InteropGapMatrixProps {
  keywords: KeywordRow[];
  standardsByKeyword: Map<string, number>;
  charinByKeyword: Map<string, number>;
  githubByKeyword: Map<string, number>;
  cordisByKeyword: Map<string, number>;
  newsByKeyword: Map<string, number>;
}

type SignalLevel = "strong" | "partial" | "none";

function SignalCell({ count, thresholds, label }: { count: number; thresholds: [number, number]; label: string }) {
  const level: SignalLevel = count >= thresholds[1] ? "strong" : count >= thresholds[0] ? "partial" : "none";
  
  return (
    <TableCell className="text-center">
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center justify-center cursor-default">
              {level === "strong" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              {level === "partial" && <AlertCircle className="h-4 w-4 text-yellow-500" />}
              {level === "none" && <XCircle className="h-4 w-4 text-muted-foreground/30" />}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            <span className="text-xs">{count} {label}</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TableCell>
  );
}

function ReadinessScore({ signals }: { signals: number[] }) {
  // Count how many of the 5 signals have data
  const withData = signals.filter((s) => s > 0).length;
  const pct = Math.round((withData / 5) * 100);
  
  const color =
    withData >= 4 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" :
    withData >= 2 ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-500" :
    "border-destructive/30 bg-destructive/10 text-destructive";

  return (
    <TableCell className="text-center">
      <Badge variant="outline" className={`text-xs font-mono ${color}`}>
        {withData}/5
      </Badge>
    </TableCell>
  );
}

export function InteropGapMatrix({
  keywords,
  standardsByKeyword,
  charinByKeyword,
  githubByKeyword,
  cordisByKeyword,
  newsByKeyword,
}: InteropGapMatrixProps) {
  const rows = useMemo(() => {
    return keywords
      .map((kw) => {
        const standards = standardsByKeyword.get(kw.id) || 0;
        const charin = charinByKeyword.get(kw.id) || 0;
        const github = githubByKeyword.get(kw.id) || 0;
        const cordis = cordisByKeyword.get(kw.id) || 0;
        const news = newsByKeyword.get(kw.id) || 0;
        const signalCount = [standards, charin, github, cordis, news].filter((s) => s > 0).length;
        return { keyword: kw, standards, charin, github, cordis, news, signalCount };
      })
      .sort((a, b) => a.signalCount - b.signalCount); // Gaps first
  }, [keywords, standardsByKeyword, charinByKeyword, githubByKeyword, cordisByKeyword, newsByKeyword]);

  const fullCoverage = rows.filter((r) => r.signalCount >= 4).length;
  const gapCount = rows.filter((r) => r.signalCount <= 1).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-destructive" />
          Interoperability Gap Analysis
        </h2>
        <p className="text-muted-foreground mt-1">
          Which technologies have comprehensive interoperability signals vs. where the industry is flying blind.
          Each column represents a different evidence type.
        </p>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-muted-foreground">Strong signal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
          <span className="text-muted-foreground">Partial</span>
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle className="h-3.5 w-3.5 text-muted-foreground/30" />
          <span className="text-muted-foreground">No data</span>
        </div>
        <span className="text-muted-foreground ml-auto">
          <span className="font-medium text-foreground">{gapCount}</span> keywords with ≤1 signal
        </span>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-card z-10 min-w-[180px]">Technology</TableHead>
                  <TableHead className="text-center min-w-[80px]">Standards</TableHead>
                  <TableHead className="text-center min-w-[80px]">CharIN Tests</TableHead>
                  <TableHead className="text-center min-w-[80px]">OSS Repos</TableHead>
                  <TableHead className="text-center min-w-[80px]">EU R&D</TableHead>
                  <TableHead className="text-center min-w-[80px]">News</TableHead>
                  <TableHead className="text-center min-w-[80px]">Readiness</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.keyword.id} className={row.signalCount <= 1 ? "bg-destructive/5" : ""}>
                    <TableCell className="sticky left-0 bg-card z-10 font-medium text-sm text-foreground">
                      {row.keyword.display_name}
                    </TableCell>
                    <SignalCell count={row.standards} thresholds={[1, 5]} label="standards" />
                    <SignalCell count={row.charin} thresholds={[1, 10]} label="test results" />
                    <SignalCell count={row.github} thresholds={[1, 5]} label="repos" />
                    <SignalCell count={row.cordis} thresholds={[1, 3]} label="EU projects" />
                    <SignalCell count={row.news} thresholds={[5, 20]} label="news mentions" />
                    <ReadinessScore signals={[row.standards, row.charin, row.github, row.cordis, row.news]} />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
