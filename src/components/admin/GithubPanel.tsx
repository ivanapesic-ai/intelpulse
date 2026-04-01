import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Play, Star, GitFork, Code, TrendingUp, ExternalLink } from "lucide-react";
import { fetchGithubActivity, useGithubKeywordSummary } from "@/hooks/useGithubActivity";

export default function GithubPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [runningKeyword, setRunningKeyword] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: summary, isLoading } = useGithubKeywordSummary();

  const totalRepos = summary?.reduce((s, r) => s + (r.repo_count || 0), 0) || 0;
  const totalStars = summary?.reduce((s, r) => s + (r.total_stars || 0), 0) || 0;
  const activeRepos = summary?.reduce((s, r) => s + (r.active_repos || 0), 0) || 0;
  const keywordsWithData = summary?.filter((r) => r.repo_count > 0).length || 0;

  const handleFetchAll = async () => {
    setIsRunning(true);
    setRunningKeyword(null);
    try {
      const result = await fetchGithubActivity();
      setLastResult(result);
      toast.success(
        `GitHub fetch complete: ${result.summary.total_repos_inserted} repos from ${result.summary.keywords_processed} keywords`
      );
      queryClient.invalidateQueries({ queryKey: ["github-keyword-summary"] });
      queryClient.invalidateQueries({ queryKey: ["github-repos"] });
    } catch (error: any) {
      toast.error(`GitHub fetch failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleFetchKeyword = async (keywordId: string, keyword: string) => {
    setRunningKeyword(keyword);
    try {
      const result = await fetchGithubActivity(keywordId, keyword);
      const detail = result.details?.[0];
      toast.success(`${keyword}: ${detail?.repos_found || 0} repos, ${detail?.total_stars || 0} stars`);
      queryClient.invalidateQueries({ queryKey: ["github-keyword-summary"] });
      queryClient.invalidateQueries({ queryKey: ["github-repos", keywordId] });
    } catch (error: any) {
      toast.error(`GitHub fetch failed for ${keyword}: ${error.message}`);
    } finally {
      setRunningKeyword(null);
    }
  };

  const formatStars = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  };

  const momentumBadge = (repos: number, active: number) => {
    const ratio = repos > 0 ? active / repos : 0;
    if (ratio > 0.7)
      return (
        <Badge className="bg-primary/10 text-primary border-primary/20">
          <TrendingUp className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    if (ratio > 0.3)
      return <Badge variant="secondary">Moderate</Badge>;
    return <Badge variant="outline" className="text-muted-foreground">Low</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Code className="h-4 w-4" /> Total Repos
            </div>
            <div className="text-2xl font-bold mt-1 text-foreground">{totalRepos.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4" /> Total Stars
            </div>
            <div className="text-2xl font-bold mt-1 text-foreground">{formatStars(totalStars)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" /> Active (12mo)
            </div>
            <div className="text-2xl font-bold mt-1 text-foreground">{activeRepos.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GitFork className="h-4 w-4" /> Keywords with Data
            </div>
            <div className="text-2xl font-bold mt-1 text-foreground">{keywordsWithData} / {summary?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-foreground">
            GitHub Open-Source Momentum
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
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead className="text-right">Repos</TableHead>
                  <TableHead className="text-right">Stars</TableHead>
                  <TableHead className="text-right">Forks</TableHead>
                  <TableHead>Momentum</TableHead>
                  <TableHead>Top Repo</TableHead>
                  <TableHead>Languages</TableHead>
                  <TableHead className="text-right">Last Fetched</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary
                  ?.sort((a, b) => (b.total_stars || 0) - (a.total_stars || 0))
                  .map((row) => (
                    <TableRow key={row.keyword_id}>
                      <TableCell className="font-medium text-foreground">
                        {row.display_name || row.keyword}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.repo_count > 0 ? <Badge variant="secondary">{row.repo_count}</Badge> : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.total_stars > 0 ? (
                          <span className="flex items-center justify-end gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            {formatStars(row.total_stars)}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.total_forks > 0 ? formatStars(row.total_forks) : "—"}
                      </TableCell>
                      <TableCell>
                        {row.repo_count > 0 ? momentumBadge(row.repo_count, row.active_repos) : "—"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {row.top_repos?.[0] ? (
                          <a
                            href={`https://github.com/${row.top_repos[0]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {row.top_repos[0]}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {(row.languages || []).slice(0, 3).map((lang) => (
                            <Badge key={lang} variant="outline" className="text-xs">
                              {lang}
                            </Badge>
                          ))}
                        </div>
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
                          onClick={() => handleFetchKeyword(row.keyword_id, row.keyword)}
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

      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-foreground">Last Run Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64 text-foreground">
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}