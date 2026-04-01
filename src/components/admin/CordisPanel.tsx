import { useState } from "react";
import { Landmark, RefreshCw, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function formatEur(n: number): string {
  if (n >= 1_000_000_000) return `€${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `€${(n / 1_000).toFixed(0)}K`;
  return `€${n.toFixed(0)}`;
}

interface CordisResult {
  keyword: string;
  keyword_id: string;
  projects_found: number;
  total_funding_eur: number;
}

export function CordisPanel() {
  const [isFetching, setIsFetching] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentKeyword: "" });
  const [results, setResults] = useState<CordisResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const queryClient = useQueryClient();

  // Fetch existing summaries
  const { data: summaries, isLoading } = useQuery({
    queryKey: ["cordis-summaries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cordis_keyword_summary")
        .select("*, technology_keywords!inner(display_name, keyword)")
        .order("total_funding_eur", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch active keywords
  const { data: keywords } = useQuery({
    queryKey: ["active-keywords-for-cordis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("technology_keywords")
        .select("id, keyword, display_name, aliases")
        .eq("is_active", true)
        .eq("excluded_from_sdv", false);
      if (error) throw error;
      return data;
    },
  });

  const handleFetchAll = async () => {
    if (!keywords?.length) {
      toast.error("No active keywords found");
      return;
    }

    setIsFetching(true);
    setResults([]);
    setShowResults(true);
    const total = keywords.length;
    setProgress({ current: 0, total, currentKeyword: "" });

    const fetchResults: CordisResult[] = [];

    for (let i = 0; i < keywords.length; i++) {
      const kw = keywords[i];
      const searchTerm = kw.display_name || kw.keyword.replace(/_/g, " ");
      setProgress({ current: i + 1, total, currentKeyword: searchTerm });

      try {
        const { data, error } = await supabase.functions.invoke("fetch-cordis", {
          body: { keyword_id: kw.id, search_term: searchTerm, limit: 50 },
        });

        if (error) {
          console.error(`Error for ${searchTerm}:`, error);
          fetchResults.push({ keyword: searchTerm, keyword_id: kw.id, projects_found: 0, total_funding_eur: 0 });
        } else {
          fetchResults.push({
            keyword: searchTerm,
            keyword_id: kw.id,
            projects_found: data.projects_found || 0,
            total_funding_eur: data.total_funding_eur || 0,
          });
        }
      } catch (e) {
        console.error(`Failed for ${searchTerm}:`, e);
        fetchResults.push({ keyword: searchTerm, keyword_id: kw.id, projects_found: 0, total_funding_eur: 0 });
      }

      setResults([...fetchResults]);
    }

    setIsFetching(false);
    queryClient.invalidateQueries({ queryKey: ["cordis-summaries"] });

    const totalProjects = fetchResults.reduce((s, r) => s + r.projects_found, 0);
    toast.success(`CORDIS fetch complete: ${totalProjects} projects across ${keywords.length} keywords`);
  };

  const totalProjects = summaries?.reduce((s, r) => s + (r.project_count || 0), 0) || 0;
  const totalFunding = summaries?.reduce((s, r) => s + Number(r.total_funding_eur || 0), 0) || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-foreground">CORDIS — EU R&D Projects</CardTitle>
              <CardDescription>Fetch EU-funded research projects from the CORDIS SPARQL endpoint (free, no API key)</CardDescription>
            </div>
          </div>
          <Button onClick={handleFetchAll} disabled={isFetching} size="sm">
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Fetching…" : "Fetch All Keywords"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary stats */}
        {!isLoading && summaries && summaries.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">{totalProjects}</p>
              <p className="text-xs text-muted-foreground">EU Projects</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">{formatEur(totalFunding)}</p>
              <p className="text-xs text-muted-foreground">Total Cost</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">{summaries.length}</p>
              <p className="text-xs text-muted-foreground">Keywords Covered</p>
            </div>
          </div>
        )}

        {/* Progress bar during fetch */}
        {isFetching && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Fetching: {progress.currentKeyword}</span>
              <span>{progress.current}/{progress.total}</span>
            </div>
            <Progress value={(progress.current / Math.max(progress.total, 1)) * 100} />
          </div>
        )}

        {/* Results from latest fetch */}
        {results.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowResults(!showResults)}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {showResults ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Latest fetch results ({results.length})
            </button>
            {showResults && (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {results.map((r) => (
                  <div key={r.keyword_id} className="flex items-center justify-between py-1.5 px-2 rounded text-sm hover:bg-muted/50">
                    <span className="text-foreground">{r.keyword}</span>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">{r.projects_found} projects</Badge>
                      {r.total_funding_eur > 0 && (
                        <span className="text-xs text-muted-foreground">{formatEur(r.total_funding_eur)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Existing keyword summaries */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : summaries && summaries.length > 0 ? (
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">Stored data per keyword</p>
            {summaries.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between py-1.5 px-2 rounded text-sm hover:bg-muted/50">
                <span className="text-foreground font-medium">
                  {s.technology_keywords?.display_name || s.technology_keywords?.keyword}
                </span>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">{s.project_count} projects</Badge>
                  <span className="text-xs text-muted-foreground">{formatEur(Number(s.total_funding_eur))}</span>
                  {s.last_fetched_at && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(s.last_fetched_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No CORDIS data yet. Click "Fetch All Keywords" to start.</p>
        )}
      </CardContent>
    </Card>
  );
}
