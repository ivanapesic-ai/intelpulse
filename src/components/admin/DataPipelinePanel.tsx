import { useState, useCallback } from "react";
import { Play, CheckCircle2, Circle, Loader2, SkipForward, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAdminDataSync } from "@/hooks/useDataSync";
import { toast } from "sonner";

interface PipelineStep {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  status: "idle" | "running" | "done" | "skipped" | "error";
  error?: string;
  duration?: number;
}

const DEFAULT_STEPS: Omit<PipelineStep, "status">[] = [
  {
    id: "sync_mappings",
    label: "Sync Keyword Mappings",
    description: "Rebuild company↔keyword mappings & update technology table",
    enabled: true,
  },
  {
    id: "enrich_patents",
    label: "Enrich Patents (EPO)",
    description: "Query EPO for patent counts per technology IPC codes",
    enabled: true,
  },
  {
    id: "fetch_cordis",
    label: "Fetch CORDIS EU R&D",
    description: "Query CORDIS SPARQL for EU-funded research projects per keyword",
    enabled: true,
  },
  {
    id: "aggregate_trl",
    label: "Aggregate TRL Scores",
    description: "Recalculate TRL from document mentions for all keywords",
    enabled: true,
  },
  {
    id: "refresh_scores",
    label: "Recalculate C-O Scores",
    description: "Run score_all_technologies with current regulatory & growth data",
    enabled: true,
  },
  {
    id: "refresh_composites",
    label: "Refresh Composite Scores",
    description: "Recalculate log-ratio composite scores & percentiles",
    enabled: true,
  },
  {
    id: "refresh_view",
    label: "Refresh Intelligence View",
    description: "Rebuild the materialized view that powers all dashboards",
    enabled: true,
  },
  {
    id: "analyze_lineage",
    label: "Analyze Signal Lineage",
    description: "Use AI to identify conceptual links between research, patents & news",
    enabled: false,
  },
];

export function DataPipelinePanel() {
  const [steps, setSteps] = useState<PipelineStep[]>(
    DEFAULT_STEPS.map((s) => ({ ...s, status: "idle" }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const { afterPipelineSync } = useAdminDataSync();

  const toggleStep = useCallback((id: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  }, []);

  const updateStep = useCallback(
    (id: string, update: Partial<PipelineStep>) => {
      setSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...update } : s))
      );
    },
    []
  );

  const runPipeline = useCallback(async () => {
    setIsRunning(true);

    // Reset all steps
    setSteps((prev) =>
      prev.map((s) => ({
        ...s,
        status: s.enabled ? "idle" : "skipped",
        error: undefined,
        duration: undefined,
      }))
    );

    const enabledSteps = steps.filter((s) => s.enabled);
    let hasErrors = false;

    for (const step of enabledSteps) {
      const start = Date.now();
      updateStep(step.id, { status: "running" });

      try {
        switch (step.id) {
          case "sync_mappings": {
            const { error } = await supabase.rpc("sync_keyword_data_pipeline");
            if (error) throw error;
            break;
          }
          case "enrich_patents": {
            const { error } = await supabase.functions.invoke("epo-patent-lookup", {
              body: { action: "enrich_all_technologies" },
            });
            if (error) throw error;
            break;
          }
          case "fetch_cordis": {
            const { data: kwList } = await supabase
              .from("technology_keywords")
              .select("id, keyword, display_name")
              .eq("is_active", true)
              .eq("excluded_from_sdv", false);
            for (const kw of kwList || []) {
              const searchTerm = kw.display_name || kw.keyword.replace(/_/g, " ");
              await supabase.functions.invoke("fetch-cordis", {
                body: { keyword_id: kw.id, search_term: searchTerm, limit: 50 },
              });
            }
            break;
          }
          case "aggregate_trl": {
            const { data: keywords } = await supabase
              .from("technology_keywords")
              .select("id")
              .eq("is_active", true);
            for (const kw of keywords || []) {
              await supabase.rpc("aggregate_document_insights", {
                tech_keyword_id: kw.id,
              });
            }
            break;
          }
          case "refresh_scores": {
            const { error } = await supabase.rpc("score_all_technologies");
            if (error) throw error;
            break;
          }
          case "refresh_composites": {
            const { error } = await supabase.rpc("refresh_log_composite_scores");
            if (error) throw error;
            break;
          }
          case "refresh_view": {
            const { error } = await supabase.rpc("refresh_technology_intelligence");
            if (error) throw error;
            break;
          }
          case "analyze_lineage": {
            const { data: keywords, error: keywordsError } = await supabase
              .from("technology_keywords")
              .select("id, keyword, display_name")
              .eq("is_active", true);

            if (keywordsError) throw keywordsError;

            const failures: string[] = [];

            for (const kw of keywords || []) {
              const { data, error } = await supabase.functions.invoke("identify-signal-lineage", {
                body: { action: "analyze_keyword", keyword_id: kw.id },
              });

              if (error || data?.error) {
                failures.push(data?.keyword || kw.display_name || kw.keyword);
              }

              await new Promise((resolve) => setTimeout(resolve, 250));
            }

            if (failures.length > 0) {
              const preview = failures.slice(0, 4).join(", ");
              const remainder = failures.length > 4 ? ` +${failures.length - 4} more` : "";
              throw new Error(`Lineage failed for ${failures.length} keywords: ${preview}${remainder}`);
            }
            break;
          }
        }
        updateStep(step.id, {
          status: "done",
          duration: Date.now() - start,
        });
      } catch (err: any) {
        hasErrors = true;
        updateStep(step.id, {
          status: "error",
          error: err?.message || "Unknown error",
          duration: Date.now() - start,
        });
        console.error(`Pipeline step ${step.id} failed:`, err);
        // Continue to next step instead of stopping
      }
    }

    // Invalidate all caches
    await afterPipelineSync();

    setIsRunning(false);
    if (hasErrors) {
      toast.warning("Pipeline completed with errors — check step details");
    } else {
      toast.success("Pipeline completed successfully");
    }
  }, [steps, updateStep, afterPipelineSync]);

  const enabledCount = steps.filter((s) => s.enabled).length;
  const doneCount = steps.filter((s) => s.status === "done").length;
  const errorCount = steps.filter((s) => s.status === "error").length;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Data Pipeline</CardTitle>
              <CardDescription>
                Run the full enrichment and scoring pipeline, or toggle individual steps.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {isRunning && (
                <Badge variant="secondary" className="gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {doneCount}/{enabledCount}
                </Badge>
              )}
              {!isRunning && doneCount > 0 && (
                <Badge variant="outline" className="gap-1">
                  {errorCount > 0 ? (
                    <AlertCircle className="h-3 w-3 text-destructive" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  )}
                  {doneCount} done{errorCount > 0 ? `, ${errorCount} failed` : ""}
                </Badge>
              )}
              <Button
                onClick={runPipeline}
                disabled={isRunning || enabledCount === 0}
                size="sm"
                className="gap-2"
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isRunning ? "Running…" : "Run Pipeline"}
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {steps.map((step, i) => (
                <div
                  key={step.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                >
                  {/* Status icon */}
                  <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                    {step.status === "running" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : step.status === "done" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : step.status === "error" ? (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    ) : step.status === "skipped" ? (
                      <SkipForward className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>

                  {/* Step number */}
                  <span className="text-xs font-mono text-muted-foreground w-4">
                    {i + 1}
                  </span>

                  {/* Label & description */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        !step.enabled
                          ? "text-muted-foreground line-through"
                          : "text-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {step.error || step.description}
                    </p>
                  </div>

                  {/* Duration */}
                  {step.duration !== undefined && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {step.duration < 1000
                        ? `${step.duration}ms`
                        : `${(step.duration / 1000).toFixed(1)}s`}
                    </span>
                  )}

                  {/* Toggle */}
                  <Switch
                    checked={step.enabled}
                    onCheckedChange={() => toggleStep(step.id)}
                    disabled={isRunning}
                    className="flex-shrink-0"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
