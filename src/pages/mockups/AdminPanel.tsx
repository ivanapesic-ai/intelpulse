import { useState } from "react";
import { ArrowLeft, Database, FileText, Globe, Layers, Upload, CheckCircle, FileSpreadsheet, BarChart, Rss, BookOpen, Landmark, Code } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DataPipelinePanel } from "@/components/admin/DataPipelinePanel";
import { CordisPanel } from "@/components/admin/CordisPanel";
import GithubPanel from "@/components/admin/GithubPanel";
import { useCrunchbaseStats } from "@/hooks/useCrunchbase";

export default function AdminPanel() {
  const [dataSubTab, setDataSubTab] = useState<"crunchbase" | "patents" | "scraping" | "documents" | "news" | "research" | "cordis" | "github">("crunchbase");

  // Data hooks
  const { data: crunchbaseStats } = useCrunchbaseStats();
  const { data: documentStats } = useDocumentStats();
  const { data: keywordStats } = useKeywordStats();

  const totalCompanies = crunchbaseStats?.totalCompanies || 0;
  const totalKeywords = keywordStats?.totalKeywords || 0;

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
                  <p className="text-sm text-muted-foreground">Documents</p>
                  <p className="text-3xl font-bold text-foreground">{documentStats?.totalDocuments || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {documentStats?.totalMentions || 0} mentions
                  </p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
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
                 <div className="p-3 rounded-full bg-primary/10">
                   <Database className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Panel - always visible above tabs */}
        <div className="mb-6">
          <DataPipelinePanel />
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="taxonomy" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="taxonomy" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Taxonomy & Ontology</span>
            </TabsTrigger>
            <TabsTrigger value="data-sources" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Data Sources</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
               <BarChart className="h-4 w-4" />
              <span className="hidden sm:inline">Status</span>
            </TabsTrigger>
          </TabsList>

          {/* ===== TAXONOMY & ONTOLOGY TAB ===== */}
          <TabsContent value="taxonomy" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <KeywordManager />
                <StandardsManagerPanel />
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-foreground">Technology Ontology</CardTitle>
                  </CardHeader>
                </Card>
                <TechnologyOntology maxEdges={20} />
              </div>
            </div>
          </TabsContent>

          {/* ===== DATA SOURCES TAB ===== */}
          <TabsContent value="data-sources" className="space-y-4">
            <div className="flex gap-2 border-b border-border pb-3 flex-wrap">
              <Button variant={dataSubTab === "crunchbase" ? "secondary" : "ghost"} size="sm" onClick={() => setDataSubTab("crunchbase")}>
                <Upload className="h-4 w-4 mr-1.5" /> Crunchbase
              </Button>
              <Button variant={dataSubTab === "patents" ? "secondary" : "ghost"} size="sm" onClick={() => setDataSubTab("patents")}>
                <FileSpreadsheet className="h-4 w-4 mr-1.5" /> EPO Patents
              </Button>
              <Button variant={dataSubTab === "scraping" ? "secondary" : "ghost"} size="sm" onClick={() => setDataSubTab("scraping")}>
                <Globe className="h-4 w-4 mr-1.5" /> Web Scraping
              </Button>
              <Button variant={dataSubTab === "documents" ? "secondary" : "ghost"} size="sm" onClick={() => setDataSubTab("documents")}>
                <FileText className="h-4 w-4 mr-1.5" /> Documents
              </Button>
              <Button variant={dataSubTab === "news" ? "secondary" : "ghost"} size="sm" onClick={() => setDataSubTab("news")}>
                <Rss className="h-4 w-4 mr-1.5" /> News/RSS
              </Button>
              <Button variant={dataSubTab === "research" ? "secondary" : "ghost"} size="sm" onClick={() => setDataSubTab("research")}>
                <BookOpen className="h-4 w-4 mr-1.5" /> Research
              </Button>
              <Button variant={dataSubTab === "cordis" ? "secondary" : "ghost"} size="sm" onClick={() => setDataSubTab("cordis")}>
                <Landmark className="h-4 w-4 mr-1.5" /> CORDIS EU R&D
              </Button>
              <Button variant={dataSubTab === "github" ? "secondary" : "ghost"} size="sm" onClick={() => setDataSubTab("github")}>
                <Code className="h-4 w-4 mr-1.5" /> GitHub OSS
              </Button>
            </div>

            {dataSubTab === "crunchbase" && <CrunchbaseImportPanel />}
            {dataSubTab === "patents" && <EpoPatentPanel />}
            {dataSubTab === "scraping" && (
              <div className="space-y-6">
                <WebScrapingPanel />
                <PdfQueuePanel />
              </div>
            )}
            {dataSubTab === "documents" && <DocumentUploadPanel />}
            {dataSubTab === "news" && <RssNewsPanel />}
            {dataSubTab === "research" && <ResearchSignalsPanel />}
            {dataSubTab === "cordis" && <CordisPanel />}
            {dataSubTab === "github" && <GithubPanel />}
          </TabsContent>

          {/* ===== STATUS TAB ===== */}
          <TabsContent value="settings" className="space-y-4">
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
                      <CheckCircle className="h-5 w-5 text-primary" />
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
