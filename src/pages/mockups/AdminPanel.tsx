import { useState } from "react";
import { ArrowLeft, RefreshCw, Database, FileText, Zap, Globe, Network, Layers, BookOpen, Upload, CheckCircle, XCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useDealroomCompanies, useDealroomSyncLogs, useDealroomSync, useDealroomCountryStats, useDealroomApiUsage, useDealroomCompanyCount } from "@/hooks/useDealroomSync";
import { useDealroomTaxonomy, useSyncDealroomTaxonomy, useSyncTaxonomyFromCompanies } from "@/hooks/useDealroomTaxonomy";
import { useDocuments, useDocumentStats } from "@/hooks/useDocuments";
import { useKeywordStats } from "@/hooks/useTechnologies";
import { formatFundingEur, formatNumber } from "@/types/database";
import { WebScrapingPanel } from "@/components/admin/WebScrapingPanel";
import { PdfQueuePanel } from "@/components/admin/PdfQueuePanel";
import { KeywordManager } from "@/components/admin/KeywordManager";
import { TechnologyOntology } from "@/components/mockups/TechnologyOntology";
import { TaxonomyBrowser } from "@/components/admin/TaxonomyBrowser";

const statusColors = {
  completed: "bg-success/20 text-success border-success/30",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
  running: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  pending: "bg-muted text-muted-foreground border-border",
  parsing: "bg-blue-500/20 text-blue-500 border-blue-500/30",
};

export default function AdminPanel() {
  const [taxonomySubTab, setTaxonomySubTab] = useState<"keywords" | "browser">("keywords");
  const [dataSubTab, setDataSubTab] = useState<"dealroom" | "scraping" | "documents">("dealroom");

  // Data hooks
  const { data: companies, isLoading: companiesLoading } = useDealroomCompanies({ limit: 10 });
  const { data: companyCount } = useDealroomCompanyCount();
  const { data: syncLogs, isLoading: syncLogsLoading } = useDealroomSyncLogs(5);
  const { data: countryStats } = useDealroomCountryStats();
  const { data: documents, isLoading: documentsLoading } = useDocuments();
  const { data: documentStats } = useDocumentStats();
  const { data: keywordStats } = useKeywordStats();
  const { data: apiUsage } = useDealroomApiUsage();
  
  const dealroomSync = useDealroomSync();
  const { data: taxonomy } = useDealroomTaxonomy();
  const syncTaxonomy = useSyncDealroomTaxonomy();
  const syncFromCompanies = useSyncTaxonomyFromCompanies();

  const handleDealroomSync = () => {
    dealroomSync.mutate({});
  };

  const handleTaxonomySync = () => {
    syncTaxonomy.mutate();
  };

  const handleSyncFromCompanies = () => {
    syncFromCompanies.mutate();
  };

  const totalCompanies = companyCount || 0;
  const totalKeywords = keywordStats?.totalKeywords || 0;
  const lastSyncLog = syncLogs?.[0];

  // API Usage calculations
  const usagePercent = apiUsage ? (apiUsage.apiCallsUsed / apiUsage.apiCallsLimit) * 100 : 0;
  const usageStatus = usagePercent >= 90 ? "critical" : usagePercent >= 70 ? "warning" : "normal";
  const usageColor = usageStatus === "critical" ? "bg-destructive" : usageStatus === "warning" ? "bg-warning" : "bg-primary";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/mockups">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">BluSpecs Staff Portal</p>
            </div>
          </div>
          <Badge variant="outline" className="text-primary border-primary">
            Admin Access
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Keywords</p>
                  <p className="text-3xl font-bold text-foreground">{totalKeywords}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    CEI: {keywordStats?.ceiSphereCount || 0} | DR: {keywordStats?.dealroomCount || 0}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <Database className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Companies</p>
                  <p className="text-3xl font-bold text-foreground">{totalCompanies}</p>
                  <p className="text-xs text-muted-foreground mt-1">from Dealroom</p>
                </div>
                <div className="p-3 rounded-full bg-purple-500/10">
                  <Database className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Documents</p>
                  <p className="text-3xl font-bold text-foreground">{documentStats?.totalDocuments || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {documentStats?.totalMentions || 0} mentions
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-500/10">
                  <FileText className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">API Usage</p>
                  <p className="text-xl font-bold text-foreground">
                    {formatNumber(apiUsage?.apiCallsUsed || 0)} / {formatNumber(apiUsage?.apiCallsLimit || 50000)}
                  </p>
                  <Progress value={usagePercent} className={`h-1.5 mt-2 ${usageColor}`} />
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs - 4 consolidated */}
        <Tabs defaultValue="taxonomy" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="taxonomy" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Taxonomy</span>
            </TabsTrigger>
            <TabsTrigger value="data-sources" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Data Sources</span>
            </TabsTrigger>
            <TabsTrigger value="ontology" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">Ontology</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Status</span>
            </TabsTrigger>
          </TabsList>

          {/* ===== TAXONOMY TAB ===== */}
          <TabsContent value="taxonomy" className="space-y-4">
            {/* Sub-navigation */}
            <div className="flex gap-2 border-b border-border pb-3">
              <Button
                variant={taxonomySubTab === "keywords" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTaxonomySubTab("keywords")}
              >
                Keyword Management
              </Button>
              <Button
                variant={taxonomySubTab === "browser" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setTaxonomySubTab("browser")}
              >
                Taxonomy Browser
              </Button>
            </div>

            {taxonomySubTab === "keywords" ? (
              <KeywordManager />
            ) : (
              <TaxonomyBrowser />
            )}
          </TabsContent>

          {/* ===== DATA SOURCES TAB ===== */}
          <TabsContent value="data-sources" className="space-y-4">
            {/* Sub-navigation */}
            <div className="flex gap-2 border-b border-border pb-3">
              <Button
                variant={dataSubTab === "dealroom" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setDataSubTab("dealroom")}
              >
                Dealroom API
              </Button>
              <Button
                variant={dataSubTab === "scraping" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setDataSubTab("scraping")}
              >
                <Globe className="h-4 w-4 mr-1.5" />
                Web Scraping
              </Button>
              <Button
                variant={dataSubTab === "documents" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setDataSubTab("documents")}
              >
                <FileText className="h-4 w-4 mr-1.5" />
                Documents
              </Button>
            </div>

            {/* Dealroom Sub-tab */}
            {dataSubTab === "dealroom" && (
              <div className="space-y-4">
                {/* Taxonomy Sync Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-purple-500" />
                        <CardTitle className="text-lg text-foreground">Dealroom Taxonomy</CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleSyncFromCompanies} 
                          disabled={syncFromCompanies.isPending}
                          variant="outline"
                          size="sm"
                        >
                          <Database className={`h-4 w-4 mr-2 ${syncFromCompanies.isPending ? "animate-spin" : ""}`} />
                          {syncFromCompanies.isPending ? "Syncing..." : "From Companies"}
                        </Button>
                        <Button 
                          onClick={handleTaxonomySync} 
                          disabled={syncTaxonomy.isPending}
                          size="sm"
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${syncTaxonomy.isPending ? "animate-spin" : ""}`} />
                          {syncTaxonomy.isPending ? "Syncing..." : "Sync Taxonomy"}
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Pre-defined Dealroom taxonomy - no API calls needed
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-foreground">{taxonomy?.counts?.industries || 0}</p>
                        <p className="text-sm text-muted-foreground">Industries</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-foreground">{taxonomy?.counts?.subIndustries || 0}</p>
                        <p className="text-sm text-muted-foreground">Sub-Industries</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-foreground">{taxonomy?.counts?.technology || 0}</p>
                        <p className="text-sm text-muted-foreground">Technology Tags</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid lg:grid-cols-3 gap-4">
                  {/* Sync Controls */}
                  <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-foreground">Company Sync</CardTitle>
                        <CardDescription>Sync company data globally from Dealroom API</CardDescription>
                      </div>
                      <Button 
                        onClick={handleDealroomSync} 
                        disabled={dealroomSync.isPending || usagePercent >= 100}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${dealroomSync.isPending ? "animate-spin" : ""}`} />
                        {dealroomSync.isPending ? "Syncing..." : usagePercent >= 100 ? "Quota Exceeded" : "Sync Now"}
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {dealroomSync.isPending && (
                        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                          <div className="flex items-center gap-2 text-blue-500">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span className="text-sm font-medium">Fetching companies from Dealroom API...</span>
                          </div>
                        </div>
                      )}

                      {/* Sync History */}
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-3">Recent Syncs</h4>
                        {syncLogsLoading ? (
                          <p className="text-sm text-muted-foreground">Loading...</p>
                        ) : syncLogs?.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No sync history yet</p>
                        ) : (
                          <div className="space-y-2">
                            {syncLogs?.slice(0, 3).map((log) => (
                              <div 
                                key={log.id} 
                                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                              >
                                <div className="flex items-center gap-3">
                                  {log.status === "completed" && <CheckCircle className="h-4 w-4 text-success" />}
                                  {log.status === "failed" && <XCircle className="h-4 w-4 text-destructive" />}
                                  {log.status === "running" && <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />}
                                  {log.status === "pending" && <Clock className="h-4 w-4 text-muted-foreground" />}
                                  <div>
                                    <p className="text-sm font-medium text-foreground">
                                      {log.recordsFetched} fetched, {log.recordsCreated} created
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(log.startedAt).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant="outline" className={statusColors[log.status]}>
                                  {log.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Country Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-foreground text-sm">Companies by Country</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {countryStats?.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No data yet. Run a sync first.</p>
                      ) : (
                        <div className="space-y-2">
                          {countryStats?.slice(0, 6).map((stat) => (
                            <div key={stat.country} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{stat.country}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-foreground font-medium">{stat.companyCount}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatFundingEur(stat.totalFunding)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Companies */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-foreground">Recent Companies</CardTitle>
                    <CardDescription>Latest companies synced from Dealroom</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {companiesLoading ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : companies?.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No companies synced yet. Click "Sync Now" to fetch data.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Company</th>
                              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Country</th>
                              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Funding</th>
                              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Industries</th>
                            </tr>
                          </thead>
                          <tbody>
                            {companies?.slice(0, 5).map((company) => (
                              <tr key={company.id} className="border-b border-border/50 hover:bg-muted/50">
                                <td className="p-3">
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{company.name}</p>
                                    {company.tagline && (
                                      <p className="text-xs text-muted-foreground truncate max-w-xs">{company.tagline}</p>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 text-sm text-muted-foreground">{company.hqCountry || "—"}</td>
                                <td className="p-3 text-sm font-medium text-foreground">
                                  {formatFundingEur(company.totalFundingEur)}
                                </td>
                                <td className="p-3">
                                  <div className="flex flex-wrap gap-1">
                                    {company.industries.slice(0, 2).map((ind) => (
                                      <Badge key={ind} variant="outline" className="text-xs">
                                        {ind}
                                      </Badge>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Web Scraping Sub-tab */}
            {dataSubTab === "scraping" && (
              <div className="space-y-6">
                <WebScrapingPanel />
                <PdfQueuePanel />
              </div>
            )}

            {/* Documents Sub-tab */}
            {dataSubTab === "documents" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground">CEI Documents</CardTitle>
                    <CardDescription>Upload and parse CEI-SPHERE documents for technology mentions</CardDescription>
                  </div>
                  <Button size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </CardHeader>
                <CardContent>
                  {/* Stats */}
                  <div className="grid sm:grid-cols-4 gap-4 mb-6">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-foreground">{documentStats?.totalDocuments || 0}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-success/10">
                      <p className="text-xs text-success">Completed</p>
                      <p className="text-xl font-bold text-success">{documentStats?.completedCount || 0}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <p className="text-xs text-blue-500">Parsing</p>
                      <p className="text-xl font-bold text-blue-500">{documentStats?.parsingCount || 0}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-destructive/10">
                      <p className="text-xs text-destructive">Failed</p>
                      <p className="text-xl font-bold text-destructive">{documentStats?.failedCount || 0}</p>
                    </div>
                  </div>

                  {documentsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : documents?.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No documents uploaded yet</p>
                      <p className="text-sm text-muted-foreground">Upload CEI PDFs, PPTs, or DOCs to extract technology mentions</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {documents?.map((doc) => (
                        <div 
                          key={doc.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-muted">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{doc.filename}</p>
                              <p className="text-sm text-muted-foreground">
                                {doc.fileType.toUpperCase()} • {doc.source}
                                {doc.parsedContent?.mentionsCount !== undefined && (
                                  <> • {doc.parsedContent.mentionsCount} mentions</>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={statusColors[doc.parseStatus] || statusColors.pending}>
                              {doc.parseStatus}
                            </Badge>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===== ONTOLOGY TAB ===== */}
          <TabsContent value="ontology">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Technology Ontology</CardTitle>
                  <CardDescription>
                    Technology relationships derived from shared company mappings. 
                    Connections are weighted by the number of quality companies that operate in both technology areas.
                  </CardDescription>
                </CardHeader>
              </Card>
              <TechnologyOntology maxEdges={20} />
            </div>
          </TabsContent>

          {/* ===== STATUS/SETTINGS TAB ===== */}
          <TabsContent value="settings" className="space-y-4">
            {/* API Usage Card */}
            <Card className={`border-2 ${usageStatus === "critical" ? "border-destructive/50" : usageStatus === "warning" ? "border-warning/50" : "border-border"}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className={`h-5 w-5 ${usageStatus === "critical" ? "text-destructive" : usageStatus === "warning" ? "text-warning" : "text-primary"}`} />
                    <CardTitle className="text-lg text-foreground">Dealroom API Usage</CardTitle>
                  </div>
                  {usageStatus !== "normal" && (
                    <Badge variant="outline" className={usageStatus === "critical" ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-warning/10 text-warning border-warning/30"}>
                      {usageStatus === "critical" ? "Near Limit" : "Approaching Limit"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-bold text-foreground">{formatNumber(apiUsage?.apiCallsUsed || 0)}</span>
                    <span className="text-muted-foreground ml-1">/ {formatNumber(apiUsage?.apiCallsLimit || 50000)} calls</span>
                  </div>
                  <span className={`text-lg font-semibold ${usageStatus === "critical" ? "text-destructive" : usageStatus === "warning" ? "text-warning" : "text-primary"}`}>
                    {usagePercent.toFixed(1)}%
                  </span>
                </div>
                <Progress value={usagePercent} className={`h-3 ${usageColor}`} />
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Period</p>
                    <p className="text-sm font-medium text-foreground">
                      {apiUsage?.periodStart ? new Date(apiUsage.periodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"} - {apiUsage?.periodEnd ? new Date(apiUsage.periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Last Sync</p>
                    <p className="text-sm font-medium text-foreground">
                      {apiUsage?.lastSyncDate ? new Date(apiUsage.lastSyncDate).toLocaleDateString() : "Never"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatNumber((apiUsage?.apiCallsLimit || 50000) - (apiUsage?.apiCallsUsed || 0))} calls
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Overview */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Data Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Keywords</span>
                    <span className="font-semibold text-foreground">{keywordStats?.totalKeywords || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Technologies Tracked</span>
                    <span className="font-semibold text-foreground">{keywordStats?.totalTechnologies || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Companies</span>
                    <span className="font-semibold text-foreground">{formatNumber(totalCompanies)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Funding</span>
                    <span className="font-semibold text-foreground">{formatFundingEur(keywordStats?.totalFunding || 0)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Last Sync Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {lastSyncLog ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        {lastSyncLog.status === "completed" && <CheckCircle className="h-5 w-5 text-success" />}
                        {lastSyncLog.status === "failed" && <XCircle className="h-5 w-5 text-destructive" />}
                        {lastSyncLog.status === "running" && <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />}
                        <span className="font-medium text-foreground capitalize">{lastSyncLog.status}</span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Records fetched: {lastSyncLog.recordsFetched}</p>
                        <p>Records created: {lastSyncLog.recordsCreated}</p>
                        <p>API calls: {lastSyncLog.apiCallsMade}</p>
                        <p>Time: {new Date(lastSyncLog.startedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No syncs yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
