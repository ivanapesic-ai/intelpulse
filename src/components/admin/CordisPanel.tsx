import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Play, Database, Euro, FlaskConical, Globe } from "lucide-react";
import { fetchCordisProjects, useCordisKeywordSummary } from "@/hooks/useCordisProjects";

function formatEur(amount: number): string {
  if (amount >= 1_000_000_000) return `€${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `€${(amount / 1_000_000).toFixed(0)}M`;
  if (amount >= 1_000) return `€${(amount / 1_000).toFixed(0)}K`;
  return `€${amount.toFixed(0)}`;
}

export function CordisPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [runningKeyword, setRunningKeyword] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: summary, isLoading: summaryLoading } = useCordisKeywordSummary();

  const totalProjects = summary?.reduce((s, r) => s + (r.project_count || 0), 0) || 0;
  const totalFunding = summary?.reduce((s, r) => s + (r.total_eu_funding_eur || 0), 0) || 0;
  const keywordsWithData = summary?.filter((r) => r.project_count > 0).length || 0;

  const handleFetchAll = async () => {
    setIsRunning(true);
    setRunningKeyword(null);
    try {
      const result = await fetchCordisProjects();
      setLastResult(result);
      toast.success(
        `CORDIS fetch complete: ${result.summary.total_projects_inserted} projects from ${result.summary.keywords_processed} keywords`
      );
      queryClient.invalidateQueries({ queryKey: ["cordis-keyword-summary"] });
      queryClient.invalidateQueries({ queryKey: ["cordis-projects"] });
    } catch (error: any) {
      toast.error(`CORDIS fetch failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleFetchKeyword = async (keywordId: string, keyword: string) => {
    setRunningKeyword(keyword);
    try {
      const result = await fetchCordisProjects(keywordId, keyword);
      const detail = result.details?.[0];
      toast.success(
        `${keyword}: ${detail?.projects_found || 0} projects found, ${detail?.projects_inserted || 0} inserted`
      );
      queryClient.invalidateQueries({ queryKey: ["cordis-keyword-summary"] });
      queryClient.invalidateQueries({ queryKey: ["cordis-projects", keywordId] });
    } catch (error: any) {
      toast.error(`CORDIS fetch failed for ${keyword}: ${error.message}`);
    } finally {
      setRunningKeyword(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Database className="h-4 w-4" />
              Total Projects
            </div>
            <div className="text-2xl font-bold mt-1">
              {totalProjects.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Euro className="h-4 w-4" />
              EU R&D Funding
            </div>
            <div className="text-2xl font-bold mt-1">
              {formatEur(totalFunding)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FlaskConical className="h-4 w-4" />
              Keywords with Data
            </div>
            <div className="text-2xl font-bold mt-1">
              {keywordsWithData} / {summary?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              Source
            </div>
            <div className="text-lg font-semibold mt-1">CORDIS SPARQL</div>
            <div className="text-xs text-muted-foreground">Free, no API key</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            CORDIS EU R&D Projects Pipeline
            <Button onClick={handleFetchAll} disabled={isRunning}>
              {isRunning && !runningKeyword ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Fetch All Keywords
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading summary...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead className="text-right">Projects</TableHead>
                  <TableHead className="text-right">EU Funding</TableHead>
                  <TableHead className="text-right">Active</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">Programmes</TableHead>
                  <TableHead className="text-right">Last Fetched</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary
                  ?.sort((a, b) => (b.total_eu_funding_eur || 0) - (a.total_eu_funding_eur || 0))
                  .map((row) => (
                    <TableRow key={row.keyword_id}>
                      <TableCell className="font-medium">
                        {row.display_name || row.keyword}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.project_count > 0 ? (
                          <Badge variant="secondary">{row.project_count}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.total_eu_funding_eur > 0
                          ? formatEur(row.total_eu_funding_eur)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.active_projects || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.completed_projects || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.programme_count || "—"}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {row.last_fetched
                          ? new Date(row.last_fetched).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleFetchKeyword(row.keyword_id, row.keyword)
                          }
                          disabled={isRunning || runningKeyword === row.keyword}
                        >
                          {runningKeyword === row.keyword ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Last Run Result */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Last Run Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
