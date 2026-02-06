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
  Loader2,
  Tag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useEpoCompanySearch,
  useEpoKeywordSearch,
  useEnrichWithPatents,
  useAggregateCrunchbaseSignals,
  AUTOMOTIVE_IPC_CODES,
  KEYWORD_TO_IPC_MAP,
  type CompanyPatentSummary,
  type TechnologyPatentResult,
} from "@/hooks/useEpoPatents";
import {
  useEpoBatchEnrichTechnologies,
  useEpoEnrichmentStatus,
  TECHNOLOGY_IPC_MAP,
} from "@/hooks/useEpoTechnologyEnrichment";
import { useCrunchbaseStats } from "@/hooks/useCrunchbase";
import { useAdminDataSync } from "@/hooks/useDataSync";

export function EpoPatentPanel() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [techSearchQuery, setTechSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<CompanyPatentSummary | null>(null);
  const [techSearchResult, setTechSearchResult] = useState<TechnologyPatentResult | null>(null);
  const [enrichmentResults, setEnrichmentResults] = useState<Array<{ name: string; patentCount: number }>>([]);
  const [techEnrichmentResults, setTechEnrichmentResults] = useState<Array<{ keywordName: string; patentCount: number }>>([]);
  const [aggregationResult, setAggregationResult] = useState<{ keywords: number; patents: number } | null>(null);
  const [enrichmentStatus, setEnrichmentStatus] = useState<{ needsEnrichment: number; alreadyEnriched: number; unmapped: number } | null>(null);

  const companySearch = useEpoCompanySearch();
  const keywordSearch = useEpoKeywordSearch();
  const enrichWithPatents = useEnrichWithPatents();
  const enrichTechnologies = useEpoBatchEnrichTechnologies();
  const checkEnrichmentStatus = useEpoEnrichmentStatus();
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

  const handleTechSearch = async () => {
    if (!techSearchQuery.trim()) return;

    try {
      const result = await keywordSearch.mutateAsync(techSearchQuery);
      setTechSearchResult(result);
      if (result.ipcCodes.length === 0) {
        toast({
          title: "No IPC mapping found",
          description: `Try keywords like: LiDAR, Battery, V2X, ADAS, Autonomous Driving`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Technology search complete",
          description: `Found ${result.totalPatents} patents from ${result.topApplicants.length} companies`,
        });
      }
    } catch (error) {
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const { afterEpoEnrichment } = useAdminDataSync();

  const handleEnrichment = async () => {
    try {
      const result = await enrichWithPatents.mutateAsync({ limit: 20 });
      setEnrichmentResults(result.results);
      // Unified sync - updates radars, dashboards, cards
      await afterEpoEnrichment();
      toast({
        title: "Enrichment complete",
        description: `Updated ${result.enriched} of ${result.total} companies with patent data. All views synced.`,
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
      // Unified sync - updates radars, dashboards, cards
      await afterEpoEnrichment();
      toast({
        title: "Aggregation complete",
        description: `Updated ${result.keywords_processed} keywords with ${result.total_patents_aggregated} total patents. All views synced.`,
      });
    } catch (error) {
      toast({
        title: "Aggregation failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleTechEnrichment = async () => {
    try {
      const result = await enrichTechnologies.mutateAsync({ limit: 15 });
      setTechEnrichmentResults(result.results.map(r => ({ 
        keywordName: r.keywordName, 
        patentCount: r.patentCount 
      })));
      toast({
        title: "Technology enrichment complete",
        description: `Enriched ${result.technologiesEnriched} technologies with ${result.totalPatentsFound} total patents via IPC search`,
      });
    } catch (error) {
      toast({
        title: "Technology enrichment failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleCheckStatus = async () => {
    try {
      const result = await checkEnrichmentStatus.mutateAsync();
      setEnrichmentStatus(result);
      toast({
        title: "Status check complete",
        description: `${result.needsEnrichment} technologies need enrichment, ${result.alreadyEnriched} already done, ${result.unmapped} without IPC mapping`,
      });
    } catch (error) {
      toast({
        title: "Status check failed",
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

      <Tabs defaultValue="technology" className="space-y-4">
        <TabsList>
          <TabsTrigger value="technology">
            <FileText className="h-4 w-4 mr-2" />
            Technology Search
          </TabsTrigger>
          <TabsTrigger value="company">
            <Building2 className="h-4 w-4 mr-2" />
            Company Search
          </TabsTrigger>
          <TabsTrigger value="enrich">
            <Zap className="h-4 w-4 mr-2" />
            Batch Enrich
          </TabsTrigger>
          <TabsTrigger value="ipc">
            <Search className="h-4 w-4 mr-2" />
            IPC Codes
          </TabsTrigger>
        </TabsList>

        {/* Technology Search Tab - Keyword First! */}
        <TabsContent value="technology" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search by Technology Keyword</CardTitle>
              <CardDescription>
                Enter a technology keyword to find patents and discover which companies are innovating in this space
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Technology keyword: LiDAR, Battery, V2X, ADAS, Autonomous..."
                  value={techSearchQuery}
                  onChange={(e) => setTechSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTechSearch()}
                />
                <Button
                  onClick={handleTechSearch}
                  disabled={keywordSearch.isPending || !techSearchQuery.trim()}
                >
                  {keywordSearch.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Keyword hints */}
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">Try:</span>
                {["LiDAR", "Battery", "V2X", "ADAS", "EV Charging", "Computer Vision"].map((kw) => (
                  <Badge 
                    key={kw} 
                    variant="outline" 
                    className="text-xs cursor-pointer hover:bg-accent"
                    onClick={() => setTechSearchQuery(kw)}
                  >
                    {kw}
                  </Badge>
                ))}
              </div>

              {techSearchResult && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{techSearchResult.keyword}</h3>
                      <p className="text-sm text-muted-foreground">
                        {techSearchResult.totalPatents} patents found • IPC: {techSearchResult.ipcCodes.join(", ")}
                      </p>
                    </div>
                    <Badge variant={techSearchResult.totalPatents > 20 ? "default" : "secondary"}>
                      {techSearchResult.topApplicants.length} Companies
                    </Badge>
                  </div>

                  {techSearchResult.topApplicants.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Top Companies with Patents</h4>
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2">
                          {techSearchResult.topApplicants.map((applicant, idx) => (
                            <div
                              key={applicant.name}
                              className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-muted-foreground text-sm w-6">#{idx + 1}</span>
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{applicant.name}</span>
                              </div>
                              <Badge variant="default">
                                {applicant.count} patents
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {techSearchResult.recentPatents.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Sample Patents</h4>
                      <ScrollArea className="h-[150px]">
                        <div className="space-y-2">
                          {techSearchResult.recentPatents.slice(0, 5).map((patent) => (
                            <div
                              key={patent.publicationNumber}
                              className="p-2 rounded-lg border bg-muted/20 text-sm"
                            >
                              <p className="font-medium truncate">{patent.title || patent.publicationNumber}</p>
                              <p className="text-xs text-muted-foreground">
                                {patent.applicant} • {patent.publicationNumber}
                              </p>
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

        {/* Company Search Tab */}
        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Company Patents</CardTitle>
              <CardDescription>
                Look up patents filed by a specific <strong>company name</strong> via EPO. 
                Search for actual companies like "Tesla", "Waymo", or "Bosch" — not technology terms.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg border border-accent bg-accent/20 mb-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-accent-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-accent-foreground">
                    <strong>Tip:</strong> EPO searches by patent applicant/assignee name. 
                    Enter company names (e.g., "Continental", "Mobileye", "Aptiv"), not technologies like "LiDAR".
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Company name: Tesla, Waymo, Continental, Aptiv..."
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
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Needs Enrichment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent-foreground">
                  {enrichmentStatus?.needsEnrichment ?? "—"}
                </div>
                <p className="text-xs text-muted-foreground">Technologies with 0 patents</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Already Enriched
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {enrichmentStatus?.alreadyEnriched ?? "—"}
                </div>
                <p className="text-xs text-muted-foreground">Technologies with EPO data</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  No IPC Mapping
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground">
                  {enrichmentStatus?.unmapped ?? "—"}
                </div>
                <p className="text-xs text-muted-foreground">Need manual IPC codes</p>
              </CardContent>
            </Card>
          </div>

          <Button
            onClick={handleCheckStatus}
            disabled={checkEnrichmentStatus.isPending}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {checkEnrichmentStatus.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Check Enrichment Status
          </Button>

          {/* Technology-Level Enrichment (Primary Path) */}
          <Card className="border-primary/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                <CardTitle>Technology Enrichment (IPC Search)</CardTitle>
              </div>
              <CardDescription>
                Enrich technology keywords directly via IPC code searches. This is the <strong>primary path</strong> for accurate patent counts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleTechEnrichment}
                  disabled={enrichTechnologies.isPending}
                  className="gap-2"
                >
                  {enrichTechnologies.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enriching Technologies...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Enrich Technologies via IPC
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Searches EPO by IPC codes mapped to each technology keyword
                </p>
              </div>

              {enrichTechnologies.isPending && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Searching EPO by IPC codes...</span>
                    <span className="text-muted-foreground">This may take 1-2 minutes</span>
                  </div>
                  <Progress value={50} className="h-2" />
                </div>
              )}

              {techEnrichmentResults.length > 0 && (
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Technology Enrichment Results</h4>
                  <ScrollArea className="h-[180px]">
                    <div className="space-y-2">
                      {techEnrichmentResults.map((result) => (
                        <div
                          key={result.keywordName}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{result.keywordName}</span>
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
            </CardContent>
          </Card>

          {/* Company-Level Enrichment (Secondary Path) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Company Enrichment (Applicant Search)</CardTitle>
              </div>
              <CardDescription>
                Enrich Crunchbase companies with patent counts via applicant name search. 
                Requires aggregation to roll up to keywords.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleEnrichment}
                  disabled={enrichWithPatents.isPending}
                  variant="outline"
                  className="gap-2"
                >
                  {enrichWithPatents.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enriching Companies...
                    </>
                  ) : (
                    <>
                      <Building2 className="h-4 w-4" />
                      Enrich Companies
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Top 20 by funding, missing patent data
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
                  <h4 className="text-sm font-medium mb-3">Company Enrichment Results</h4>
                  <ScrollArea className="h-[150px]">
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
