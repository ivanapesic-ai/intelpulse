import { useEffect, useState } from "react";
import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Building2,
  Globe,
  Users,
  DollarSign,
  TrendingUp,
  ExternalLink,
  Search,
  RefreshCw,
  ChevronDown,
  MapPin,
  Calendar,
  Briefcase,
  Target,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useTracxnData, TracxnCompany } from "@/hooks/useTracxnData";
import { StatCard } from "@/components/mockups/StatCard";
import { formatFundingEur } from "@/types/database";

const RELEVANT_SECTORS = [
  "Autonomous Vehicles",
  "Cybersecurity",
  "Edge Computing",
  "Fleet Management",
  "Cloud Infrastructure",
  "Logistics Tech",
];

function CompanyCard({ company }: { company: TracxnCompany }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-border hover:border-primary/30 transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="h-10 w-10 rounded-lg object-contain bg-muted"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
              )}
              <div>
                <CardTitle className="text-base font-semibold">{company.name}</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  {company.location.city && (
                    <>
                      <MapPin className="h-3 w-3" />
                      <span>
                        {company.location.city}, {company.location.country}
                      </span>
                    </>
                  )}
                  {company.foundedYear && (
                    <>
                      <span className="text-border">•</span>
                      <Calendar className="h-3 w-3" />
                      <span>Founded {company.foundedYear}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {company.acquiredBy && (
                <Badge variant="secondary" className="text-xs">
                  Acquired
                </Badge>
              )}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{company.description}</p>

          <div className="flex flex-wrap gap-2 mb-3">
            {company.feeds.slice(0, 3).map((feed) => (
              <Badge key={feed} variant="outline" className="text-xs">
                {feed}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-semibold text-foreground">
                {company.totalFunding.amount
                  ? formatFundingEur(company.totalFunding.amount)
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Total Funding</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {company.employeeCount || "—"}
              </p>
              <p className="text-xs text-muted-foreground">Employees</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {company.investors.length || "—"}
              </p>
              <p className="text-xs text-muted-foreground">Investors</p>
            </div>
          </div>

          <CollapsibleContent className="mt-4 pt-4 border-t border-border space-y-4">
            {/* Founders */}
            {company.founders.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Founders & Key People
                </h4>
                <div className="grid gap-2">
                  {company.founders.map((founder, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">{founder.name}</p>
                        <p className="text-xs text-muted-foreground">{founder.designation}</p>
                      </div>
                      {founder.linkedin && (
                        <a
                          href={founder.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Investors */}
            {company.investors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Investors
                </h4>
                <div className="flex flex-wrap gap-1">
                  {company.investors.map((investor) => (
                    <Badge key={investor} variant="secondary" className="text-xs">
                      {investor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Last Funding Round */}
            {company.lastFundingRound && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Last Funding Round
                </h4>
                <div className="text-sm bg-muted/50 rounded-lg px-3 py-2">
                  <p>
                    <span className="font-medium">{company.lastFundingRound.type}</span>
                    {company.lastFundingRound.amount && (
                      <span> – {formatFundingEur(company.lastFundingRound.amount)}</span>
                    )}
                  </p>
                  {company.lastFundingRound.date && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {company.lastFundingRound.date}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Acquired By */}
            {company.acquiredBy && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Acquisition
                </h4>
                <div className="text-sm bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg px-3 py-2">
                  <p>
                    Acquired by <span className="font-medium">{company.acquiredBy.name}</span>
                  </p>
                  {company.acquiredBy.date && (
                    <p className="text-xs opacity-80 mt-1">{company.acquiredBy.date}</p>
                  )}
                </div>
              </div>
            )}

            {/* Website Link */}
            {company.domain && (
              <a
                href={`https://${company.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Globe className="h-4 w-4" />
                {company.domain}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}

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
        <span className="text-xs">Not available in playground</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-success">
      <CheckCircle2 className="h-4 w-4" />
      <span>{result.companies.length} companies</span>
    </div>
  );
}

export default function TracxnExplorer() {
  const { results, isLoading, searchMultipleSectors, getAllCompanies, getStats } = useTracxnData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");

  useEffect(() => {
    searchMultipleSectors(RELEVANT_SECTORS);
  }, [searchMultipleSectors]);

  const stats = getStats();
  const allCompanies = getAllCompanies();

  const filteredCompanies = allCompanies.filter((company) => {
    const matchesSearch =
      !searchQuery ||
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.location.country.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      selectedTab === "all" || company.feeds.some((f) => f === selectedTab);

    return matchesSearch && matchesTab;
  });

  const availableSectors = Object.entries(results)
    .filter(([, r]) => !r.error && r.companies.length > 0)
    .map(([sector]) => sector);

  return (
    <div className="min-h-screen bg-background">
      <PlatformHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Tracxn Data Explorer</h1>
              <p className="text-muted-foreground mt-1">
                Company and investor data from Tracxn API (Playground)
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            title="Companies"
            value={stats.totalCompanies}
            icon={Building2}
          />
          <StatCard
            title="Sectors"
            value={stats.totalSectors}
            subtitle="Searched"
            icon={Target}
          />
          <StatCard
            title="Countries"
            value={stats.uniqueCountries}
            icon={Globe}
          />
          <StatCard
            title="Total Funding"
            value={formatFundingEur(stats.totalFunding)}
            icon={DollarSign}
          />
          <StatCard
            title="Investors"
            value={stats.uniqueInvestors}
            subtitle="Unique"
            icon={Briefcase}
          />
          <StatCard
            title="Acquired"
            value={stats.acquiredCompanies}
            subtitle="Companies"
            icon={TrendingUp}
          />
        </div>

        {/* Sector Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Data Sources (Sector Feeds)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {RELEVANT_SECTORS.map((sector) => (
                <div
                  key={sector}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <span className="font-medium text-sm">{sector}</span>
                  <SectorStatus sector={sector} result={results[sector]} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies by name, description, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">
              All Companies ({allCompanies.length})
            </TabsTrigger>
            {availableSectors.map((sector) => (
              <TabsTrigger key={sector} value={sector}>
                {sector} ({results[sector]?.companies.length || 0})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedTab} className="mt-0">
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
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCompanies.map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
