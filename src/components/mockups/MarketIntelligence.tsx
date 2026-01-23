import { Building2, DollarSign, MapPin, TrendingUp, Target, RefreshCw, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatFundingEur, formatNumber } from "@/types/database";
import { useMarketIntelligence } from "@/hooks/useMarketIntelligence";
import { useDealroomSyncLogs, useDealroomSync } from "@/hooks/useDealroomSync";
import { formatDistanceToNow } from "date-fns";

interface MarketIntelligenceProps {
  keywordId?: string;
  technologyName: string;
}

export function MarketIntelligence({ keywordId, technologyName }: MarketIntelligenceProps) {
  const { data: syncLogs } = useDealroomSyncLogs(1);
  const syncMutation = useDealroomSync();
  
  const lastSync = syncLogs?.[0];
  const lastSyncTime = lastSync?.completedAt || lastSync?.startedAt;
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

  if (!data || data.totalCompanies === 0) {
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
          {lastSyncTime ? (
            <span>Last synced {formatDistanceToNow(new Date(lastSyncTime), { addSuffix: true })}</span>
          ) : (
            <span>No sync data available</span>
          )}
          {lastSync?.status === 'running' && (
            <Badge variant="outline" className="ml-2 text-xs animate-pulse">Syncing...</Badge>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => syncMutation.mutate({ limit: 100 })}
          disabled={syncMutation.isPending}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? 'Syncing...' : 'Refresh Data'}
        </Button>
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
              <p className="text-2xl font-bold text-foreground">{data.totalCompanies}</p>
              <p className="text-xs text-muted-foreground">Companies Tracked</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">{formatFundingEur(data.totalFunding)}</p>
              <p className="text-xs text-muted-foreground">Total Funding</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">{formatNumber(data.totalEmployees)}</p>
              <p className="text-xs text-muted-foreground">Total Employees</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">{data.euCompanies}</p>
              <p className="text-xs text-muted-foreground">EU-Based ({data.euPercentage}%)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acquisition Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Acquisition Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.acquisitions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No acquisitions tracked in this technology area
            </p>
          ) : (
            <div className="space-y-3">
              {data.acquisitions.map((acq, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {acq.acquirer} → acquired {acq.targetName}
                      </p>
                      {acq.targetTagline && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{acq.targetTagline}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {acq.amount && (
                      <p className="font-semibold text-foreground">{formatFundingEur(acq.amount)}</p>
                    )}
                    {acq.date && (
                      <p className="text-xs text-muted-foreground">{new Date(acq.date).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Acquisition summary by acquirer */}
              {data.acquirerSummary.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Consolidation by Acquirer:</p>
                  <div className="flex flex-wrap gap-2">
                    {data.acquirerSummary.map((summary) => (
                      <Badge key={summary.acquirer} variant="secondary" className="text-xs">
                        {summary.acquirer}: {summary.count} acquisition{summary.count > 1 ? 's' : ''}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Strategic Investors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Top Strategic Investors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.topInvestors.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No investor data available
            </p>
          ) : (
            <div className="space-y-2">
              {data.topInvestors.slice(0, 8).map((investor, index) => (
                <div 
                  key={investor.name} 
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-5">{index + 1}.</span>
                    <span className="font-medium text-foreground">{investor.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {investor.count} investment{investor.count > 1 ? 's' : ''}
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
          {data.countryDistribution.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No location data available
            </p>
          ) : (
            <div className="space-y-2">
              {data.countryDistribution.slice(0, 6).map((country) => (
                <div 
                  key={country.country} 
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-medium">{country.country}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${(country.count / data.totalCompanies) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-16 text-right">
                      {country.count} ({country.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Growth Stage Distribution */}
      {data.stageDistribution.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Market Maturity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.stageDistribution.map((stage) => (
                <Badge key={stage.stage} variant="secondary" className="text-xs capitalize">
                  {stage.stage}: {stage.count} ({stage.percentage}%)
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
