import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Radar, Grid3X3, Compass, TrendingUp, FileText, Activity, Zap, Database, RefreshCw, ArrowRight, Sparkles, Clock, BarChart3 } from "lucide-react";
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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-70" />
        <div className="absolute top-20 right-20 w-[400px] h-[400px] orb orb-violet opacity-20 animate-float" />
        <div className="absolute bottom-10 left-10 w-[300px] h-[300px] orb orb-cyan opacity-15 animate-float-delayed" />
        
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-3xl">
            <Badge className="badge-glass mb-6 animate-fade-in">
              <Sparkles className="h-3 w-3 mr-1.5" />
              ML-SDV Sphere • December 2024
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold font-display leading-tight mb-6 animate-fade-in-up">
              Technology Intelligence for{" "}
              <span className={`text-gradient-vibrant inline-block transition-all duration-300 ${isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
                {rotatingDomains[currentDomainIndex]}
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Real-time maturity tracking across Cloud, Edge, IoT, and AI/ML technologies powering the future of mobility, logistics, and software-defined vehicles.
            </p>
            
            <div className="flex flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              <Link to="/mockups/radar">
                <Button size="lg" className="btn-gradient gap-2 rounded-xl">
                  <Radar className="h-5 w-5" />
                  Technology Radar
                </Button>
              </Link>
              <Link to="/mockups/heatmap">
                <Button variant="outline" size="lg" className="gap-2 rounded-xl glass hover:bg-primary/5">
                  <Grid3X3 className="h-5 w-5" />
                  Heatmap Matrix
                </Button>
              </Link>
              <Link to="/mockups/explorer">
                <Button variant="ghost" size="lg" className="gap-2 rounded-xl hover:bg-primary/5">
                  <Compass className="h-5 w-5" />
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
            <Card className="card-hover-glow">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-display flex items-center gap-2">
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
            <Card className="card-hover-glow">
              <CardHeader>
                <CardTitle className="font-display">Quadrant Distribution</CardTitle>
                <CardDescription>Technologies by domain and maturity ring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(Object.entries(stats.quadrantCounts) as [string, number][]).map(([quadrant, count], i) => {
                    const colors = [
                      "from-violet/20 to-violet/5 border-violet/20",
                      "from-cyan/20 to-cyan/5 border-cyan/20",
                      "from-pink/20 to-pink/5 border-pink/20",
                      "from-amber/20 to-amber/5 border-amber/20",
                    ];
                    return (
                      <div 
                        key={quadrant} 
                        className={`p-5 rounded-xl bg-gradient-to-br ${colors[i]} border text-center transition-all hover:scale-105`}
                      >
                        <p className="text-3xl font-bold font-display">{count}</p>
                        <p className="text-sm text-muted-foreground">{quadrant}</p>
                      </div>
                    );
                  })}
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
            <Card className="card-hover-glow">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Trending Technologies
                </CardTitle>
                <CardDescription>Technologies with strongest upward signals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingTechnologies.map((tech, i) => (
                  <div 
                    key={tech.id} 
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{tech.name}</p>
                      <p className="text-xs text-muted-foreground">{tech.quadrant} • {tech.ring}</p>
                    </div>
                    <div className="w-48 hidden sm:block">
                      <SignalIndicator signals={tech.signals} size="sm" />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-lg text-gradient-primary">{tech.compositeScore.toFixed(1)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Insights */}
            <Card className="glass border-primary/20 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2 font-display">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  AI Insights
                </CardTitle>
                <CardDescription>Intelligence engine highlights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 relative">
                {aiInsights.map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-card border border-border/50 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex gap-3">
                      <div className={`w-1.5 rounded-full shrink-0 ${item.severity === "high" ? "bg-emerald" : item.severity === "medium" ? "bg-amber" : "bg-cyan"}`} />
                      <p className="text-sm">{item.insight}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="card-hover-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-base">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${item.type === "data" ? "bg-cyan" : item.type === "score" ? "bg-emerald" : "bg-violet"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{item.action}</p>
                      <p className="text-xs text-muted-foreground">{item.source} • {item.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Data Sources */}
            <Card className="card-hover-glow">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { name: "Dealroom API", status: "healthy" },
                  { name: "PATSTAT/EPO", status: "healthy" },
                  { name: "EU Horizon", status: "healthy" },
                  { name: "CEI Internal", status: "pending" },
                ].map((source) => (
                  <div key={source.name} className="flex items-center justify-between text-sm">
                    <span>{source.name}</span>
                    <Badge 
                      variant="outline" 
                      className={source.status === "healthy" 
                        ? "bg-emerald/10 text-emerald border-emerald/30" 
                        : "bg-amber/10 text-amber border-amber/30"
                      }
                    >
                      {source.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="card-hover-glow">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2 hover:bg-primary/5 hover:border-primary/30" size="sm">
                  <RefreshCw className="h-4 w-4" />
                  Refresh Data
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 hover:bg-primary/5 hover:border-primary/30" size="sm">
                  <FileText className="h-4 w-4" />
                  Export Report
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 hover:bg-primary/5 hover:border-primary/30" size="sm">
                  <Zap className="h-4 w-4" />
                  Run Analysis
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-12 bg-muted/30">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-indigo flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="font-display font-semibold">AI-CE Heatmap</span>
          </div>
          <p className="text-sm text-muted-foreground">BluSpecs • ML-SDV Technology Maturity Platform</p>
          <p className="text-xs text-muted-foreground mt-1">Last updated: December 2024 • Next refresh: March 2025</p>
        </div>
      </footer>
    </div>
  );
}