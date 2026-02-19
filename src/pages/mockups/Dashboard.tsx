import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Radar, Grid3X3, Compass, TrendingUp, FileText, Activity, Database, ArrowRight, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { StatCard } from "@/components/mockups/StatCard";
import { TechnologyCard } from "@/components/mockups/TechnologyCard";
import { useTechnologies } from "@/hooks/useTechnologies";
import { formatFundingEur, formatFundingUsd, formatNumber, getCompositeScoreLabel } from "@/types/database";
import { TrendingTechnologiesWidget } from "@/components/intelligence/TrendingTechnologiesWidget";
import logo from "@/assets/logo.svg";
import BrandName from "@/components/BrandName";

const rotatingDomains = ["Autonomous Vehicles", "Edge Computing", "Electric Mobility", "V2X Communication", "Cloud AI", "Software-Defined Vehicles"];

// Maturity labels aligned with platform-wide terminology
type MaturityRing = "Strong" | "Moderate" | "Emerging";

function getMaturityRing(compositeScore: number): MaturityRing {
  if (compositeScore >= 1.5) return "Strong";
  if (compositeScore >= 0.5) return "Moderate";
  return "Emerging";
}

const ringColors: Record<MaturityRing, string> = {
  Strong: "border-emerald-500/50 text-emerald-500",
  Moderate: "border-amber-500/50 text-amber-500",
  Emerging: "border-red-500/50 text-red-500",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [currentDomainIndex, setCurrentDomainIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const { data: technologies, isLoading, error } = useTechnologies();

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentDomainIndex((prev) => (prev + 1) % rotatingDomains.length);
        setIsAnimating(false);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Filter to same subset as Explorer (exclude zero-data technologies)
  const filteredTechnologies = useMemo(() => {
    if (!technologies) return [];
    return technologies.filter(
      (tech) => tech.dealroomCompanyCount > 0 || tech.totalFundingEur > 0
    );
  }, [technologies]);

  // Calculate stats from filtered data (consistent with Explorer)
  const stats = useMemo(() => {
    if (filteredTechnologies.length === 0) {
      return {
        totalTechnologies: 0,
        totalPatents: 0,
        totalFunding: 0,
        avgCompositeScore: 0,
        ringCounts: { Strong: 0, Moderate: 0, Emerging: 0 },
      };
    }

    const totalPatents = filteredTechnologies.reduce((sum, t) => sum + (t.totalPatents || 0), 0);
    const totalFunding = filteredTechnologies.reduce((sum, t) => sum + (t.totalFundingEur || 0), 0);
    const avgCompositeScore = filteredTechnologies.reduce((sum, t) => sum + (t.compositeScore || 0), 0) / filteredTechnologies.length;

    const ringCounts: Record<MaturityRing, number> = { Strong: 0, Moderate: 0, Emerging: 0 };
    filteredTechnologies.forEach((t) => {
      const ring = getMaturityRing(t.compositeScore || 0);
      ringCounts[ring]++;
    });

    return {
      totalTechnologies: filteredTechnologies.length,
      totalPatents,
      totalFunding,
      avgCompositeScore,
      ringCounts,
    };
  }, [filteredTechnologies]);

  // Get top technologies by composite score (from filtered set)
  const topTechnologies = useMemo(() => {
    return [...filteredTechnologies]
      .sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0))
      .slice(0, 4);
  }, [filteredTechnologies]);

  // trendingTechnologies now handled by TrendingTechnologiesWidget

  const aiInsights = [
    { insight: "Autonomous Vehicle sector leads with €89B aggregate funding across 142 companies", severity: "high" },
    { insight: "Battery technology patents up 34% YoY - strong innovation signal", severity: "high" },
    { insight: "V2X and Edge Computing showing convergence patterns in company portfolios", severity: "medium" },
    { insight: "Software-Defined Vehicle ecosystem expanding with 23 new entrants Q4 2025", severity: "medium" },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <p className="text-destructive">Error loading technologies: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PlatformHeader />

      {/* Hero Section */}
      <section className="border-b border-border bg-surface-light">
        <div className="container mx-auto px-4 py-14">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 animate-fade-in">
              ML-SDV Sphere • January 2025
            </Badge>
            
            <h1 className="text-3xl md:text-4xl font-bold font-display leading-tight mb-4 text-foreground animate-fade-in-up">
              Technology Intelligence for<br />
              <span className={`text-primary inline-block transition-all duration-300 ${isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
                {rotatingDomains[currentDomainIndex]}
              </span>
            </h1>
            
            <p className="text-base text-muted-foreground mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Real-time maturity tracking powered by Crunchbase market signals, document analysis, and H11 hybrid scoring model.
            </p>
            
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10">
        {/* Stats Row */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </>
          ) : (
            <>
              <StatCard
                title="Technologies Tracked"
                value={stats.totalTechnologies}
                subtitle="Active technology keywords"
                icon={Database}
                trend={{ value: 12, label: "vs last quarter" }}
              />
              <StatCard
                title="Total Patents"
                value={formatNumber(stats.totalPatents)}
                subtitle="Aggregated from EPO & Crunchbase"
                icon={FileText}
                trend={{ value: 8, label: "YoY growth" }}
              />
              <StatCard
                title="Total Funding"
                value={formatFundingEur(stats.totalFunding)}
                subtitle="Crunchbase company data"
                icon={TrendingUp}
                trend={{ value: 15, label: "vs 2024" }}
              />
              <StatCard
                title="Avg Maturity"
                value={stats.avgCompositeScore.toFixed(2)}
                subtitle="Composite score (0-2)"
                icon={Activity}
              />
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Top Technologies */}
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-display flex items-center gap-2 text-foreground">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Top Performing Technologies
                  </CardTitle>
                  <CardDescription>Highest composite maturity scores</CardDescription>
                </div>
                <Link to="/explorer">
                  <Button variant="ghost" size="sm" className="gap-1 text-primary hover:text-primary hover:bg-primary/10">
                    View all <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-24" />
                    ))}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {topTechnologies.map((tech, i) => (
                      <div key={tech.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                        <TechnologyCard 
                          technology={tech} 
                          compact 
                          onClick={() => navigate('/explorer')}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Maturity Distribution */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="font-display text-foreground">Maturity Distribution</CardTitle>
                <CardDescription>Technologies by composite score maturity ring</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-32" />
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      {(Object.entries(stats.ringCounts) as [MaturityRing, number][]).map(([ring, count]) => {
                        const { label, color } = getCompositeScoreLabel(
                          ring === "Strong" ? 2 : ring === "Moderate" ? 1 : 0
                        );
                        return (
                          <div 
                            key={ring} 
                            className="p-5 rounded-lg bg-muted/50 border border-border text-center transition-all hover:bg-muted"
                          >
                            <p className="text-2xl font-bold font-display text-foreground">{count}</p>
                            <p className={`text-sm ${color}`}>{ring}</p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-5 pt-5 border-t border-border">
                      <div className="flex flex-wrap gap-3 justify-center">
                        {(Object.entries(stats.ringCounts) as [MaturityRing, number][]).map(([ring, count]) => (
                          <Badge key={ring} variant="outline" className={`gap-1.5 px-3 py-1 ${ringColors[ring]}`}>
                            <span className="font-bold">{count}</span> {ring}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* News Momentum — live trending from news mentions */}
            <TrendingTechnologiesWidget />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Insights */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-foreground">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  AI Insights
                </CardTitle>
                <CardDescription>Intelligence engine highlights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {aiInsights.map((item, i) => (
                  <div key={i} className="p-4 rounded-lg bg-card border border-border animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex gap-3">
                      <div className={`w-1.5 rounded-full shrink-0 ${item.severity === "high" ? "bg-success" : item.severity === "medium" ? "bg-warning" : "bg-primary"}`} />
                      <p className="text-sm text-foreground">{item.insight}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>


            {/* Data Sources */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-foreground">Data Sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { name: "Crunchbase", status: "healthy" },
                  { name: "CEI Documents", status: "healthy" },
                  { name: "Web Sources", status: "healthy" },
                  { name: "EPO Patents", status: "healthy" },
                ].map((source) => (
                  <div key={source.name} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{source.name}</span>
                    <Badge 
                      variant="outline" 
                      className={source.status === "healthy" 
                        ? "bg-success/10 text-success border-success/30" 
                        : "bg-warning/10 text-warning border-warning/30"
                      }
                    >
                      {source.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-12 bg-muted/30">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src={logo} alt="pulse11" className="h-6 w-auto" />
            <BrandName className="text-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">BluSpecs CEI-Sphere Intelligence Platform</p>
          <p className="text-xs text-muted-foreground mt-1">Last updated: February 2026 • Powered by House11</p>
        </div>
      </footer>
    </div>
  );
}
