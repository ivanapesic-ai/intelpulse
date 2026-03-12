import { Coins, MapPin, TrendingUp, Target, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatFundingEur, formatNumber } from "@/types/database";
import { useMarketIntelligence } from "@/hooks/useMarketIntelligence";

interface MarketIntelligenceSummary {
  totalCompanies: number;
  totalFunding: number;
  totalEmployees: number;
}

interface MarketIntelligenceProps {
  keywordId?: string;
  technologyName: string;
  /**
   * Optional override so the Market Summary matches the Technology cards/overview.
   * (Investors / geo / stages still come from the market intelligence query.)
   */
  summary?: MarketIntelligenceSummary;
}

export function MarketIntelligence({
  keywordId,
  technologyName,
  summary,
}: MarketIntelligenceProps) {
  const { data, isLoading, error } = useMarketIntelligence(keywordId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-6 w-1/3 mb-4" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-6 w-1/3 mb-4" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error loading market data: {error.message}</p>
      </div>
    );
  }

  const safe =
    data ??
    ({
      totalCompanies: 0,
      totalFunding: 0,
      totalEmployees: 0,
      euCompanies: 0,
      euPercentage: 0,
      topInvestors: [],
      countryDistribution: [],
      stageDistribution: [],
    } satisfies NonNullable<typeof data>);

  const displayTotalCompanies = summary?.totalCompanies ?? safe.totalCompanies;
  const displayTotalFunding = summary?.totalFunding ?? safe.totalFunding;
  const displayTotalEmployees = summary?.totalEmployees ?? safe.totalEmployees;

  const displayEuPercentage =
    displayTotalCompanies > 0
      ? Math.round((safe.euCompanies / displayTotalCompanies) * 100)
      : 0;

  const hasAnythingToShow =
    displayTotalCompanies > 0 ||
    displayTotalFunding > 0 ||
    displayTotalEmployees > 0 ||
    safe.topInvestors.length > 0 ||
    safe.countryDistribution.length > 0 ||
    safe.stageDistribution.length > 0;

  if (!hasAnythingToShow) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No market data available for {technologyName} yet.</p>
        <p className="text-sm mt-2">Sync data from Admin Panel to populate this view.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sync Status Bar */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Market data from Crunchbase</span>
        </div>
        <span className="text-xs text-muted-foreground">Refresh data from Admin Panel</span>
      </div>

      {/* Market Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-foreground flex items-center gap-2">
            <Target className="h-4 w-4" />
            Market Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">{displayTotalCompanies}</p>
              <p className="text-xs text-muted-foreground">Companies Tracked</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">{formatFundingEur(displayTotalFunding)}</p>
              <p className="text-xs text-muted-foreground">Total Funding</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">{formatNumber(displayTotalEmployees)}</p>
              <p className="text-xs text-muted-foreground">Total Employees</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">{safe.euCompanies}</p>
              <p className="text-xs text-muted-foreground">EU-Based ({displayEuPercentage}%)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Strategic Investors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-foreground flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            Top Strategic Investors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {safe.topInvestors.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No investor data available</p>
          ) : (
            <div className="space-y-2">
              {safe.topInvestors.slice(0, 10).map((investor, index) => (
                <div
                  key={investor.name}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-5">{index + 1}.</span>
                    <span className="font-medium text-foreground">{investor.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {investor.count} investment{investor.count > 1 ? "s" : ""}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geographic Concentration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Geographic Concentration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {safe.countryDistribution.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No location data available</p>
          ) : (
            <div className="space-y-2">
              {safe.countryDistribution.slice(0, 8).map((country) => {
                const pct =
                  displayTotalCompanies > 0
                    ? Math.round((country.count / displayTotalCompanies) * 100)
                    : 0;

                return (
                  <div key={country.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-medium">{country.country}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm text-muted-foreground w-16 text-right">
                        {country.count} ({pct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Funding Stage Distribution */}
      {safe.stageDistribution.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Funding Stage Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {safe.stageDistribution.map((stage) => {
                const pct =
                  displayTotalCompanies > 0
                    ? Math.round((stage.count / displayTotalCompanies) * 100)
                    : 0;

                return (
                  <Badge key={stage.stage} variant="secondary" className="text-xs">
                    {stage.stage}: {stage.count} ({pct}%)
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
