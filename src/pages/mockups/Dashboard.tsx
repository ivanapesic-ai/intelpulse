import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Radar, Grid3X3, Compass, TrendingUp, FileText, Activity, Database, RefreshCw, ArrowRight, Clock, BarChart3, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { StatCard } from "@/components/mockups/StatCard";
import { TechnologyCard } from "@/components/mockups/TechnologyCard";
import { SignalIndicator } from "@/components/mockups/SignalIndicator";
import { technologies, getStats, getTopTechnologies, getTrendingTechnologies, formatFunding, formatNumber } from "@/data/technologies";

const rotatingDomains = ["Autonomous Vehicles", "Edge Computing", "Smart Infrastructure", "IoT Sensors", "Cloud AI", "Connected Mobility"];

export default function Dashboard() {
  const [currentDomainIndex, setCurrentDomainIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const stats = getStats();
  const topTechnologies = getTopTechnologies(4);
  const trendingTechnologies = getTrendingTechnologies().slice(0, 5);

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

  const recentActivity = [
    { action: "New patent data imported", source: "PATSTAT/EPO", time: "2 hours ago", type: "data" },
    { action: "LiDAR Systems score updated", source: "AI Analysis", time: "5 hours ago", type: "score" },
    { action: "V2X funding data refreshed", source: "Dealroom API", time: "1 day ago", type: "data" },
    { action: "Quarterly trend report generated", source: "System", time: "3 days ago", type: "report" },
  ];

  const aiInsights = [
    { insight: "Edge AI Inference showing 23% increase in patent filings vs last quarter", severity: "high" },
    { insight: "V2X Communication approaching Trial → Adopt transition threshold", severity: "medium" },
    { insight: "3 technologies in Cloud quadrant exceeding market adoption benchmarks", severity: "low" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PlatformHeader />

      {/* Hero Section */}
      <section className="border-b border-border bg-surface-light">
        <div className="container mx-auto px-4 py-14">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 animate-fade-in">
              ML-SDV Sphere • December 2024
            </Badge>
            
            <h1 className="text-3xl md:text-4xl font-bold font-display leading-tight mb-4 text-foreground animate-fade-in-up">
              Technology Intelligence for{" "}
              <span className={`text-primary inline-block transition-all duration-300 ${isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
                {rotatingDomains[currentDomainIndex]}
              </span>
            </h1>
            
            <p className="text-base text-muted-foreground mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Real-time maturity tracking across Cloud, Edge, IoT, and AI/ML technologies powering the future of mobility, logistics, and software-defined vehicles.
            </p>
            
            <div className="flex flex-wrap gap-3 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              <Link to="/mockups/radar">
                <Button size="default" className="gap-2">
                  <Radar className="h-4 w-4" />
                  Technology Radar
                </Button>
              </Link>
              <Link to="/mockups/heatmap">
                <Button variant="outline" size="default" className="gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  Heatmap Matrix
                </Button>
              </Link>
              <Link to="/mockups/explorer">
                <Button variant="ghost" size="default" className="gap-2">
                  <Compass className="h-4 w-4" />
                  Explorer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10">
        {/* Stats Row */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <StatCard
            title="Technologies Tracked"
            value={stats.totalTechnologies}
            subtitle="Across 4 quadrants"
            icon={Database}
            trend={{ value: 12, label: "vs last quarter" }}
          />
          <StatCard
            title="Total Patents"
            value={formatNumber(stats.totalPatents)}
            subtitle="From PATSTAT/EPO"
            icon={FileText}
            trend={{ value: 8, label: "YoY growth" }}
          />
          <StatCard
            title="Total Funding"
            value={formatFunding(stats.totalFunding)}
            subtitle="Dealroom data"
            icon={TrendingUp}
            trend={{ value: 15, label: "vs 2023" }}
          />
          <StatCard
            title="Avg TRL"
            value={stats.avgTrl}
            subtitle="Maturity score"
            icon={Activity}
          />
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
                <Link to="/mockups/explorer">
                  <Button variant="ghost" size="sm" className="gap-1 text-primary hover:text-primary hover:bg-primary/10">
                    View all <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {topTechnologies.map((tech, i) => (
                    <div key={tech.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                      <TechnologyCard technology={tech} compact />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quadrant Distribution */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="font-display text-foreground">Quadrant Distribution</CardTitle>
                <CardDescription>Technologies by domain and maturity ring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(Object.entries(stats.quadrantCounts) as [string, number][]).map(([quadrant, count], i) => (
                    <div 
                      key={quadrant} 
                      className="p-5 rounded-lg bg-muted/50 border border-border text-center transition-all hover:bg-muted"
                    >
                      <p className="text-2xl font-bold font-display text-foreground">{count}</p>
                      <p className="text-sm text-muted-foreground">{quadrant}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-5 border-t border-border">
                  <div className="flex flex-wrap gap-3 justify-center">
                    {(Object.entries(stats.ringCounts) as [string, number][]).map(([ring, count]) => (
                      <Badge key={ring} variant="outline" className="gap-1.5 px-3 py-1">
                        <span className="font-bold">{count}</span> {ring}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Signal Trends */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2 text-foreground">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Trending Technologies
                </CardTitle>
                <CardDescription>Technologies with strongest upward signals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingTechnologies.map((tech, i) => (
                  <div 
                    key={tech.id} 
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-foreground">{tech.name}</p>
                      <p className="text-xs text-muted-foreground">{tech.quadrant} • {tech.ring}</p>
                    </div>
                    <div className="w-48 hidden sm:block">
                      <SignalIndicator signals={tech.signals} size="sm" />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-lg text-primary">{tech.compositeScore.toFixed(1)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
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

            {/* Recent Activity */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-base text-foreground">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${item.type === "data" ? "bg-primary" : item.type === "score" ? "bg-success" : "bg-warning"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{item.action}</p>
                      <p className="text-xs text-muted-foreground">{item.source} • {item.time}</p>
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
                  { name: "Dealroom API", status: "healthy" },
                  { name: "PATSTAT/EPO", status: "healthy" },
                  { name: "EU Horizon", status: "healthy" },
                  { name: "CEI Internal", status: "pending" },
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
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                  <RefreshCw className="h-4 w-4" />
                  Refresh Data
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                  <FileText className="h-4 w-4" />
                  Export Report
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                  <Activity className="h-4 w-4" />
                  Run Analysis
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-12 bg-muted/30">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Layers className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-foreground">AI-CE Heatmap</span>
          </div>
          <p className="text-sm text-muted-foreground">BluSpecs • ML-SDV Technology Maturity Platform</p>
          <p className="text-xs text-muted-foreground mt-1">Last updated: December 2024 • Next refresh: March 2025</p>
        </div>
      </footer>
    </div>
  );
}