import { useState } from "react";
import { ArrowLeft, Database, FileText, Globe, Network, Layers, Upload, CheckCircle, FileSpreadsheet, BarChart, RefreshCw, Zap, Rss, BookOpen } from "lucide-react";
import { useDataPipelineSync } from "@/hooks/useDataPipeline";
import { useAdminDataSync } from "@/hooks/useDataSync";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocumentStats } from "@/hooks/useDocuments";
import { useKeywordStats } from "@/hooks/useTechnologies";
import { formatFundingUsd, formatFundingEur } from "@/types/database";
import { WebScrapingPanel } from "@/components/admin/WebScrapingPanel";
import { PdfQueuePanel } from "@/components/admin/PdfQueuePanel";
import { KeywordManager } from "@/components/admin/KeywordManager";
import { TechnologyOntology } from "@/components/mockups/TechnologyOntology";
import { CrunchbaseImportPanel } from "@/components/admin/CrunchbaseImportPanel";
import { EpoPatentPanel } from "@/components/admin/EpoPatentPanel";
import { DocumentUploadPanel } from "@/components/admin/DocumentUploadPanel";
import { RssNewsPanel } from "@/components/admin/RssNewsPanel";
import { ResearchSignalsPanel } from "@/components/admin/ResearchSignalsPanel";
import { StandardsManagerPanel } from "@/components/admin/StandardsManagerPanel";
import { useCrunchbaseStats } from "@/hooks/useCrunchbase";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminPanel() {
  const [dataSubTab, setDataSubTab] = useState<"crunchbase" | "patents" | "scraping" | "documents" | "news" | "research">("crunchbase");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data hooks
  const { data: crunchbaseStats } = useCrunchbaseStats();
  const { data: documentStats } = useDocumentStats();
  const { data: keywordStats } = useKeywordStats();
  const pipelineSync = useDataPipelineSync();
  const { afterScoreRefresh } = useAdminDataSync();

  const totalCompanies = crunchbaseStats?.totalCompanies || 0;
  const totalKeywords = keywordStats?.totalKeywords || 0;

  const handleRefreshScores = async () => {
    setIsRefreshing(true);
    try {
      const { error } = await supabase.rpc("refresh_log_composite_scores");
      if (error) throw error;

      // Unified routine: make sure all charts/cards refetch
      await afterScoreRefresh();

      toast.success("Composite scores refreshed successfully!");
    } catch (err) {
      console.error("Error refreshing scores:", err);
      toast.error("Failed to refresh scores");
    } finally {
      setIsRefreshing(false);
    }
  };

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
              <p className="text-sm text-muted-foreground">Staff Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => pipelineSync.mutate()}
              disabled={pipelineSync.isPending}
              className="gap-2"
            >
              <Zap className={`h-4 w-4 ${pipelineSync.isPending ? 'animate-pulse' : ''}`} />
              {pipelineSync.isPending ? "Syncing..." : "Sync All Data"}
            </Button>
            <Badge variant="outline" className="text-primary border-primary">
              Admin Access
            </Badge>
          </div>
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
                     CEI: {keywordStats?.ceiSphereCount || 0} | Manual: {keywordStats?.manualCount || 0}
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
                   <p className="text-xs text-muted-foreground mt-1">from Crunchbase</p>
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
                   <p className="text-sm text-muted-foreground">Total Funding (USD)</p>
                   <p className="text-xl font-bold text-foreground">
                     {formatFundingUsd(crunchbaseStats?.totalFunding || 0)}
                   </p>
                   <p className="text-xs text-muted-foreground mt-1">Crunchbase investment</p>
                </div>
                 <div className="p-3 rounded-full bg-success/10">
                   <Database className="h-6 w-6 text-success" />
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
               <BarChart className="h-4 w-4" />
              <span className="hidden sm:inline">Status</span>
            </TabsTrigger>
          </TabsList>

          {/* ===== TAXONOMY TAB ===== */}
          <TabsContent value="taxonomy" className="space-y-4">
             <KeywordManager />
             <StandardsManagerPanel />
          </TabsContent>

          {/* ===== DATA SOURCES TAB ===== */}
          <TabsContent value="data-sources" className="space-y-4">
            {/* Sub-navigation */}
            <div className="flex gap-2 border-b border-border pb-3 flex-wrap">
              <Button
                variant={dataSubTab === "crunchbase" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setDataSubTab("crunchbase")}
              >
                <Upload className="h-4 w-4 mr-1.5" />
                Crunchbase
              </Button>
              <Button
                variant={dataSubTab === "patents" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setDataSubTab("patents")}
              >
                <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                EPO Patents
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
              <Button
                variant={dataSubTab === "news" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setDataSubTab("news")}
              >
                <Rss className="h-4 w-4 mr-1.5" />
                News/RSS
              </Button>
              <Button
                variant={dataSubTab === "research" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setDataSubTab("research")}
              >
                <BookOpen className="h-4 w-4 mr-1.5" />
                Research
              </Button>
            </div>

            {/* Crunchbase Sub-tab */}
            {dataSubTab === "crunchbase" && (
              <CrunchbaseImportPanel />
            )}

            {/* EPO Patents Sub-tab */}
            {dataSubTab === "patents" && (
              <EpoPatentPanel />
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
              <DocumentUploadPanel />
            )}

            {/* News/RSS Sub-tab */}
            {dataSubTab === "news" && (
              <RssNewsPanel />
            )}

            {/* Research Sub-tab */}
            {dataSubTab === "research" && (
              <ResearchSignalsPanel />
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
            {/* Refresh Scores Action */}
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">Score Recalculation</CardTitle>
                <CardDescription>
                  Recalculate the weighted composite scores for all technologies based on the latest data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleRefreshScores} 
                  disabled={isRefreshing}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? "Refreshing..." : "Refresh Composite Scores"}
                </Button>
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
                    <span className="font-semibold text-foreground">{totalCompanies}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Funding</span>
                    <span className="font-semibold text-foreground">{formatFundingEur(keywordStats?.totalFunding || 0)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Crunchbase Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <span className="font-medium text-foreground">Data Loaded</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Companies: {crunchbaseStats?.totalCompanies || 0}</p>
                      <p>With Keywords: {crunchbaseStats?.companiesWithKeywords || 0}</p>
                      <p>Total Funding: {formatFundingUsd(crunchbaseStats?.totalFunding || 0)}</p>
                    </div>
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
