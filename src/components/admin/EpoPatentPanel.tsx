import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  FileText, 
  Building2, 
  Zap, 
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useEpoCompanySearch,
  useEnrichWithPatents,
  useAggregateCrunchbaseSignals,
  AUTOMOTIVE_IPC_CODES,
  type CompanyPatentSummary,
} from "@/hooks/useEpoPatents";
import { useCrunchbaseStats } from "@/hooks/useCrunchbase";

export function EpoPatentPanel() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<CompanyPatentSummary | null>(null);
  const [enrichmentResults, setEnrichmentResults] = useState<Array<{ name: string; patentCount: number }>>([]);
  const [aggregationResult, setAggregationResult] = useState<{ keywords: number; patents: number } | null>(null);

  const companySearch = useEpoCompanySearch();
  const enrichWithPatents = useEnrichWithPatents();
  const aggregateSignals = useAggregateCrunchbaseSignals();
  const { data: crunchbaseStats } = useCrunchbaseStats();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const result = await companySearch.mutateAsync(searchQuery);
      setSearchResult(result);
      toast({
        title: "Search complete",
        description: `Found ${result.patentCount} patents for ${searchQuery}`,
      });
    } catch (error) {
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleEnrichment = async () => {
    try {
      const result = await enrichWithPatents.mutateAsync({ limit: 20 });
      setEnrichmentResults(result.results);
      toast({
        title: "Enrichment complete",
        description: `Updated ${result.enriched} of ${result.total} companies with patent data`,
      });
    } catch (error) {
      toast({
        title: "Enrichment failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleAggregation = async () => {
    try {
      const result = await aggregateSignals.mutateAsync();
      setAggregationResult({
        keywords: result.keywords_processed,
        patents: Number(result.total_patents_aggregated),
      });
      toast({
        title: "Aggregation complete",
        description: `Updated ${result.keywords_processed} keywords with ${result.total_patents_aggregated} total patents`,
      });
    } catch (error) {
      toast({
        title: "Aggregation failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Companies to Enrich
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {crunchbaseStats?.totalCompanies || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Imported from Crunchbase
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              IPC Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(AUTOMOTIVE_IPC_CODES).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Automotive/mobility codes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              API Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span className="text-lg font-medium">Connected</span>
            </div>
            <p className="text-xs text-muted-foreground">
              EPO OPS API ready
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="search" className="space-y-4">
        <TabsList>
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-2" />
            Company Search
          </TabsTrigger>
          <TabsTrigger value="enrich">
            <Zap className="h-4 w-4 mr-2" />
            Batch Enrich
          </TabsTrigger>
          <TabsTrigger value="ipc">
            <FileText className="h-4 w-4 mr-2" />
            IPC Codes
          </TabsTrigger>
        </TabsList>

        {/* Company Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Company Patents</CardTitle>
              <CardDescription>
                Look up patents filed by a specific company via EPO
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter company name (e.g., Tesla, Waymo, Bosch)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button
                  onClick={handleSearch}
                  disabled={companySearch.isPending || !searchQuery.trim()}
                >
                  {companySearch.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {searchResult && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{searchResult.companyName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {searchResult.patentCount} total patents, {searchResult.recentFilings} filed in last 3 years
                      </p>
                    </div>
                    <Badge variant={searchResult.patentCount > 10 ? "default" : "secondary"}>
                      {searchResult.patentCount > 50 ? "High IP Activity" : 
                       searchResult.patentCount > 10 ? "Moderate IP" : "Low IP"}
                    </Badge>
                  </div>

                  {Object.keys(searchResult.ipcDistribution).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">IPC Classification Distribution</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(searchResult.ipcDistribution)
                          .sort((a, b) => b[1] - a[1])
                          .map(([code, count]) => (
                            <Badge key={code} variant="outline">
                              {code}: {count}
                              {AUTOMOTIVE_IPC_CODES[code] && (
                                <span className="ml-1 text-muted-foreground">
                                  ({AUTOMOTIVE_IPC_CODES[code].slice(0, 20)}...)
                                </span>
                              )}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}

                  {searchResult.patents.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Recent Patents</h4>
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2">
                          {searchResult.patents.map((patent) => (
                            <div
                              key={patent.publicationNumber}
                              className="p-3 rounded-lg border bg-muted/30"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">
                                    {patent.title || patent.publicationNumber}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {patent.publicationNumber} • Filed: {patent.filingDate || "N/A"}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  {patent.ipcCodes.slice(0, 2).map((ipc) => (
                                    <Badge key={ipc} variant="secondary" className="text-xs">
                                      {ipc.slice(0, 4)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Batch Enrichment Tab */}
        <TabsContent value="enrich" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Batch Patent Enrichment</CardTitle>
              <CardDescription>
                Enrich Crunchbase companies with patent counts from EPO (processes top 20 by funding)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleEnrichment}
                  disabled={enrichWithPatents.isPending}
                  className="gap-2"
                >
                  {enrichWithPatents.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enriching...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Run Batch Enrichment
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Fetches patent counts for companies missing patent data
                </p>
              </div>

              {enrichWithPatents.isPending && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing companies...</span>
                    <span className="text-muted-foreground">This may take a minute</span>
                  </div>
                  <Progress value={50} className="h-2" />
                </div>
              )}

              {enrichmentResults.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Enrichment Results</h4>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {enrichmentResults.map((result) => (
                        <div
                          key={result.name}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{result.name}</span>
                          </div>
                          <Badge variant={result.patentCount > 0 ? "default" : "secondary"}>
                            {result.patentCount} patents
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Aggregation Section */}
              <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Aggregate to Keywords</CardTitle>
                  <CardDescription>
                    Push patent counts from companies to technology keywords for heatmap scoring
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={handleAggregation}
                      disabled={aggregateSignals.isPending}
                      variant="outline"
                      className="gap-2"
                    >
                      {aggregateSignals.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Aggregating...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4" />
                          Aggregate Signals
                        </>
                      )}
                    </Button>
                    {aggregationResult && (
                      <p className="text-sm text-muted-foreground">
                        Updated {aggregationResult.keywords} keywords • {aggregationResult.patents} total patents
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* IPC Codes Reference Tab */}
        <TabsContent value="ipc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automotive IPC Classifications</CardTitle>
              <CardDescription>
                International Patent Classification codes relevant to mobility/SDV technologies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(AUTOMOTIVE_IPC_CODES).map(([code, description]) => (
                  <div
                    key={code}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <Badge variant="outline" className="font-mono shrink-0">
                      {code}
                    </Badge>
                    <span className="text-sm">{description}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
