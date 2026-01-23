import { useState } from "react";
import { ArrowLeft, Plus, RefreshCw, Users, BarChart3, Database, Trash2, Edit, FileText, Upload, CheckCircle, XCircle, Clock, AlertCircle, Zap, Tag, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useDealroomCompanies, useDealroomSyncLogs, useDealroomSync, useDealroomCountryStats, useDealroomApiUsage, useDealroomCompanyCount } from "@/hooks/useDealroomSync";
import { useDocuments, useDocumentStats } from "@/hooks/useDocuments";
import { useKeywords, useKeywordStats } from "@/hooks/useTechnologies";
import { useFetchResearch } from "@/hooks/useCompaniesForTechnology";
import { formatFundingEur, formatNumber } from "@/types/database";
import { TagMappingEditor } from "@/components/admin/TagMappingEditor";
import { WebScrapingPanel } from "@/components/admin/WebScrapingPanel";
import { PdfQueuePanel } from "@/components/admin/PdfQueuePanel";

interface User {
  id: string;
  email: string;
  organization: string;
  accessUntil: string;
  status: "active" | "expired" | "pending";
  lastLogin?: string;
}

const sampleUsers: User[] = [
  { id: "1", email: "marie.curie@eu-authority.gov", organization: "EU Transport Agency", accessUntil: "2026-06-01", status: "active", lastLogin: "2026-01-08" },
  { id: "2", email: "hans.schmidt@mobility.de", organization: "German Mobility Institute", accessUntil: "2026-03-15", status: "active", lastLogin: "2026-01-07" },
  { id: "3", email: "anna.kowalski@research.pl", organization: "Polish Research Center", accessUntil: "2025-11-30", status: "expired" },
  { id: "4", email: "jean.dupont@transport.fr", organization: "French Transport Ministry", accessUntil: "2026-12-01", status: "pending" },
];

const statusColors = {
  active: "bg-success/20 text-success border-success/30",
  expired: "bg-destructive/20 text-destructive border-destructive/30",
  pending: "bg-warning/20 text-warning border-warning/30",
  healthy: "bg-success/20 text-success border-success/30",
  error: "bg-destructive/20 text-destructive border-destructive/30",
  running: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  completed: "bg-success/20 text-success border-success/30",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
  parsing: "bg-blue-500/20 text-blue-500 border-blue-500/30",
};

export default function AdminPanel() {
  const [users] = useState(sampleUsers);
  
  // Data hooks
  const { data: companies, isLoading: companiesLoading } = useDealroomCompanies({ limit: 10 });
  const { data: companyCount } = useDealroomCompanyCount();
  const { data: syncLogs, isLoading: syncLogsLoading } = useDealroomSyncLogs(5);
  const { data: countryStats } = useDealroomCountryStats();
  const { data: documents, isLoading: documentsLoading } = useDocuments();
  const { data: documentStats } = useDocumentStats();
  const { data: keywords } = useKeywords();
  const { data: keywordStats } = useKeywordStats();
  const { data: apiUsage } = useDealroomApiUsage();
  
  const dealroomSync = useDealroomSync();
  const researchSync = useFetchResearch();

  const handleDealroomSync = () => {
    dealroomSync.mutate({});
  };

  const handleResearchSync = () => {
    researchSync.mutate({});
  };

  const activeUsers = users.filter((u) => u.status === "active").length;
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
              <p className="text-sm text-muted-foreground">BluSpecs Staff Portal - Dealroom Integration</p>
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
                  <p className="text-sm text-muted-foreground">Dealroom Companies</p>
                  <p className="text-3xl font-bold text-foreground">{totalCompanies}</p>
                </div>
                <div className="p-3 rounded-full bg-purple-500/10">
                  <BarChart3 className="h-6 w-6 text-purple-500" />
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
                  <p className="text-sm text-muted-foreground">Last Sync</p>
                  <p className="text-xl font-bold text-foreground">
                    {lastSyncLog?.completedAt 
                      ? new Date(lastSyncLog.completedAt).toLocaleDateString()
                      : "Never"
                    }
                  </p>
                  {lastSyncLog && (
                    <Badge variant="outline" className={`mt-1 ${statusColors[lastSyncLog.status]}`}>
                      {lastSyncLog.status}
                    </Badge>
                  )}
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <RefreshCw className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="dealroom" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dealroom">Dealroom Sync</TabsTrigger>
            <TabsTrigger value="web-scraping" className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Web Scraping
            </TabsTrigger>
            <TabsTrigger value="tag-mapping" className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              Tag Mapping
            </TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Dealroom Sync Tab */}
          <TabsContent value="dealroom" className="space-y-4">
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

            <div className="grid lg:grid-cols-3 gap-4">
              {/* Sync Controls */}
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground">Dealroom API Integration</CardTitle>
                    <CardDescription>Sync EU company data from Dealroom</CardDescription>
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
                    <h4 className="text-sm font-medium text-foreground mb-3">Sync History</h4>
                    {syncLogsLoading ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : syncLogs?.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No sync history yet</p>
                    ) : (
                      <div className="space-y-2">
                        {syncLogs?.map((log) => (
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
                                  {log.apiCallsMade > 0 && <span className="text-muted-foreground ml-1">({log.apiCallsMade} API calls)</span>}
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
                      {countryStats?.slice(0, 8).map((stat) => (
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
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Employees</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Industries</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companies?.map((company) => (
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
                            <td className="p-3 text-sm text-muted-foreground">
                              {formatNumber(company.employeesCount)}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {company.industries.slice(0, 2).map((ind) => (
                                  <Badge key={ind} variant="outline" className="text-xs">
                                    {ind}
                                  </Badge>
                                ))}
                                {company.industries.length > 2 && (
                                  <Badge variant="outline" className="text-xs text-muted-foreground">
                                    +{company.industries.length - 2}
                                  </Badge>
                                )}
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
          </TabsContent>

          {/* Web Scraping Tab */}
          <TabsContent value="web-scraping" className="space-y-6">
            <WebScrapingPanel />
            <PdfQueuePanel />
          </TabsContent>

          {/* Tag Mapping Tab */}
          <TabsContent value="tag-mapping">
            <TagMappingEditor />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
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
                          <Badge variant="outline" className={statusColors[doc.parseStatus]}>
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
          </TabsContent>

          {/* Keywords Tab */}
          <TabsContent value="keywords" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Technology Keywords</CardTitle>
                  <CardDescription>CEI-SPHERE and Dealroom taxonomy ({totalKeywords} keywords)</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Keyword
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* CEI-SPHERE Keywords */}
                  <div>
                    <h4 className="text-sm font-medium text-blue-400 mb-3">CEI-SPHERE ({keywordStats?.ceiSphereCount || 0})</h4>
                    <div className="flex flex-wrap gap-2">
                      {keywords?.filter(k => k.source === "cei_sphere").map((kw) => (
                        <Badge key={kw.id} variant="outline" className="text-blue-400 border-blue-400/30">
                          {kw.displayName}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Dealroom Keywords */}
                  <div>
                    <h4 className="text-sm font-medium text-purple-400 mb-3">Dealroom ({keywordStats?.dealroomCount || 0})</h4>
                    <div className="flex flex-wrap gap-2">
                      {keywords?.filter(k => k.source === "dealroom").map((kw) => (
                        <Badge key={kw.id} variant="outline" className="text-purple-400 border-purple-400/30">
                          {kw.displayName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Premium Users</CardTitle>
                  <CardDescription>Manage access for contracted clients</CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Email</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Organization</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Access Until</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Last Login</th>
                        <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-border/50 hover:bg-muted/50">
                          <td className="p-3 text-sm font-medium text-foreground">{user.email}</td>
                          <td className="p-3 text-sm text-muted-foreground">{user.organization}</td>
                          <td className="p-3 text-sm text-muted-foreground">{user.accessUntil}</td>
                          <td className="p-3">
                            <Badge variant="outline" className={statusColors[user.status]}>
                              {user.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">{user.lastLogin || "Never"}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Data Overview</CardTitle>
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
                    <span className="text-sm text-muted-foreground">Total Patents</span>
                    <span className="font-semibold text-foreground">{formatNumber(keywordStats?.totalPatents || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Funding</span>
                    <span className="font-semibold text-foreground">{formatFundingEur(keywordStats?.totalFunding || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg. Composite Score</span>
                    <span className="font-semibold text-foreground">
                      {(keywordStats?.avgCompositeScore || 0).toFixed(2)}/2
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Usage This Month</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Page Views</span>
                    <span className="font-semibold text-foreground">2,847</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Unique Visitors</span>
                    <span className="font-semibold text-foreground">156</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Exports Generated</span>
                    <span className="font-semibold text-foreground">42</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Dealroom Syncs</span>
                    <span className="font-semibold text-foreground">{syncLogs?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Documents Parsed</span>
                    <span className="font-semibold text-foreground">{documentStats?.completedCount || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
