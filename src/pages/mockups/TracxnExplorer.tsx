import { useEffect, useState } from "react";
import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Search,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LayoutGrid,
  Table as TableIcon,
  BarChart3,
  Users,
  Target,
} from "lucide-react";
import { useTracxnData, TracxnCompany } from "@/hooks/useTracxnData";
import { TracxnStatsCards } from "@/components/tracxn/TracxnStatsCards";
import { TracxnCompanyTable } from "@/components/tracxn/TracxnCompanyTable";
import { TracxnCharts } from "@/components/tracxn/TracxnCharts";
import { TracxnInvestorTable } from "@/components/tracxn/TracxnInvestorTable";
import { TracxnAcquisitionTable } from "@/components/tracxn/TracxnAcquisitionTable";

const RELEVANT_SECTORS = [
  "Autonomous Vehicles",
  "Cybersecurity",
  "Edge Computing",
  "Fleet Management",
  "Cloud Infrastructure",
  "Logistics Tech",
];

function SectorStatus({
  sector,
  result,
}: {
  sector: string;
  result?: { loading: boolean; error: string | null; companies: TracxnCompany[] };
}) {
  if (!result) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <AlertCircle className="h-4 w-4" />
        <span>Not loaded</span>
      </div>
    );
  }

  if (result.loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="flex items-center gap-2 text-destructive">
        <XCircle className="h-4 w-4" />
        <span className="text-xs">Not available</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-green-600">
      <CheckCircle2 className="h-4 w-4" />
      <span>{result.companies.length} companies</span>
    </div>
  );
}

export default function TracxnExplorer() {
  const { results, isLoading, searchMultipleSectors, getAllCompanies, getStats } = useTracxnData();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "charts" | "investors" | "acquisitions">("table");

  useEffect(() => {
    searchMultipleSectors(RELEVANT_SECTORS);
  }, [searchMultipleSectors]);

  const baseStats = getStats();
  const allCompanies = getAllCompanies();

  const stats = {
    ...baseStats,
    totalFounders: allCompanies.reduce((sum, c) => sum + c.founders.length, 0),
  };

  const filteredCompanies = allCompanies.filter((company) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      company.name.toLowerCase().includes(query) ||
      company.description.toLowerCase().includes(query) ||
      company.location.country.toLowerCase().includes(query) ||
      company.investors.some((i) => i.toLowerCase().includes(query)) ||
      company.feeds.some((f) => f.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <PlatformHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Tracxn Intelligence</h1>
              <p className="text-muted-foreground mt-1">
                Company, investor, and acquisition data from Tracxn API
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => searchMultipleSectors(RELEVANT_SECTORS)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8">
          <TracxnStatsCards stats={stats} />
        </div>

        {/* Sector Status */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Data Sources (Sector Feeds)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {RELEVANT_SECTORS.map((sector) => (
                <div
                  key={sector}
                  className="flex flex-col p-3 rounded-lg bg-muted/50"
                >
                  <span className="font-medium text-sm mb-1">{sector}</span>
                  <SectorStatus sector={sector} result={results[sector]} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)} className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="table" className="gap-2">
                <TableIcon className="h-4 w-4" />
                Companies
              </TabsTrigger>
              <TabsTrigger value="charts" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Charts
              </TabsTrigger>
              <TabsTrigger value="investors" className="gap-2">
                <Users className="h-4 w-4" />
                Investors
              </TabsTrigger>
              <TabsTrigger value="acquisitions" className="gap-2">
                <Target className="h-4 w-4" />
                Acquisitions
              </TabsTrigger>
            </TabsList>

            {/* Search (visible for table view) */}
            {viewMode === "table" && (
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies, investors, countries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
          </div>

          <TabsContent value="table" className="mt-0">
            {filteredCompanies.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <p>Loading company data from Tracxn...</p>
                    </div>
                  ) : (
                    <p>No companies found matching your criteria</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Showing {filteredCompanies.length} companies. Click a row for details.
                </p>
                <TracxnCompanyTable companies={filteredCompanies} />
              </>
            )}
          </TabsContent>

          <TabsContent value="charts" className="mt-0">
            {allCompanies.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Loading data for visualizations...</p>
                </CardContent>
              </Card>
            ) : (
              <TracxnCharts companies={allCompanies} />
            )}
          </TabsContent>

          <TabsContent value="investors" className="mt-0">
            {allCompanies.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Loading investor data...</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Top {Math.min(50, stats.uniqueInvestors)} investors by portfolio count across {stats.totalCompanies} companies.
                </p>
                <TracxnInvestorTable companies={allCompanies} />
              </>
            )}
          </TabsContent>

          <TabsContent value="acquisitions" className="mt-0">
            {allCompanies.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Loading acquisition data...</p>
                </CardContent>
              </Card>
            ) : (
              <TracxnAcquisitionTable companies={allCompanies} />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
