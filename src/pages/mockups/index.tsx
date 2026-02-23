import { Link } from "react-router-dom";
import { Radar, Grid3X3, Shield, Globe, Compass, LayoutDashboard, FileText, ArrowRight, TrendingUp, Database, Activity, CheckCircle2, Layers } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStats, formatFunding, formatNumber } from "@/data/technologies";

const mainViews = [
  {
    title: "Dashboard",
    description: "Overview with key metrics, trending technologies, and AI insights",
    icon: LayoutDashboard,
    path: "/mockups/dashboard",
    badge: "New",
  },
  {
    title: "Technology Radar",
    description: "Circular quadrant-based visualization for quick technology comparison",
    icon: Radar,
    path: "/mockups/radar",
  },
  {
    title: "Heatmap Matrix",
    description: "Grid visualization showing maturity levels across dimensions",
    icon: Grid3X3,
    path: "/mockups/heatmap",
  },
  {
    title: "Technology Explorer",
    description: "Search, filter, and analyze technologies with detailed profiles",
    icon: Compass,
    path: "/mockups/explorer",
    badge: "New",
  },
];

const otherViews = [
  {
    title: "Public Demo",
    description: "Limited public view with lead capture for premium access",
    icon: Globe,
    path: "/mockups/public",
  },
  {
    title: "Admin Panel",
    description: "User management and data refresh interface for staff",
    icon: Shield,
    path: "/mockups/admin",
  },
];

const annexes = [
  {
    title: "Annex A: Technical Approach",
    description: "Architecture, AI layers, scoring framework, and data pipeline",
    icon: FileText,
    path: "/mockups/annex-a",
  },
  {
    title: "Annex B: Platform Capabilities",
    description: "User experience, features, and Ideas for Future Features",
    icon: FileText,
    path: "/mockups/annex-b",
  },
  {
    title: "Dealroom API Parameters",
    description: "Available data fields and implementation status",
    icon: Database,
    path: "/mockups/dealroom-api",
  },
];

const processSteps = [
  { icon: Database, label: "Connect", description: "Multi-source data integration" },
  { icon: Activity, label: "Analyze", description: "AI-powered intelligence" },
  { icon: TrendingUp, label: "Track", description: "Real-time maturity signals" },
  { icon: CheckCircle2, label: "Decide", description: "Strategic insights" },
];

export default function MockupsIndex() {
  const stats = getStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b border-border bg-surface-light">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 text-sm px-4 py-1.5 animate-fade-in">
              ML-SDV Technology Intelligence Platform
            </Badge>
            
            <h1 className="text-4xl md:text-5xl font-bold font-display mb-6 text-foreground animate-fade-in-up">
              AI-CE Heatmap
            </h1>
            
            <p className="text-lg text-muted-foreground mb-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Real-time technology maturity visualization for
            </p>
            <p className="text-lg font-medium mb-10 animate-fade-in-up text-foreground" style={{ animationDelay: '150ms' }}>
              Mobility • Logistics • Software-Defined Vehicles
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <Link to="/mockups/dashboard">
                <Button size="lg" className="gap-2">
                  <LayoutDashboard className="h-5 w-5" />
                  Open Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/mockups/radar">
                <Button variant="outline" size="lg" className="gap-2">
                  <Radar className="h-5 w-5" />
                  Technology Radar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: stats.totalTechnologies, label: "Technologies" },
              { value: formatNumber(stats.totalPatents), label: "Patents Tracked" },
              { value: formatFunding(stats.totalFunding), label: "Total Funding" },
              { value: "4", label: "Data Sources" },
            ].map((stat, i) => (
              <div key={i} className="text-center animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <p className="text-3xl md:text-4xl font-bold font-display text-primary">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-16 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4 md:gap-0">
            {processSteps.map((step, i) => (
              <div key={i} className="flex items-center animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex flex-col items-center text-center px-8">
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-semibold font-display text-foreground">{step.label}</p>
                  <p className="text-xs text-muted-foreground max-w-[120px]">{step.description}</p>
                </div>
                {i < processSteps.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-muted-foreground/40 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Main Platform Views */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-xl font-bold font-display text-foreground">Platform Views</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mainViews.map((view, i) => (
              <Link key={view.path} to={view.path}>
                <Card 
                  className="h-full card-hover cursor-pointer group animate-fade-in-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <view.icon className="h-5 w-5 text-primary" />
                      </div>
                      {view.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {view.badge}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg mt-4 font-display group-hover:text-primary transition-colors">
                      {view.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-sm line-clamp-2">{view.description}</CardDescription>
                    <div className="mt-4 flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Explore</span>
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Secondary Views */}
        <section className="mb-16">
          <h2 className="text-lg font-bold font-display mb-6 text-foreground">Additional Views</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...otherViews, ...annexes].map((view, i) => (
              <Link key={view.path} to={view.path}>
                <Card className="h-full transition-all duration-200 hover:border-primary/30 hover:shadow-subtle cursor-pointer group">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <view.icon className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-sm font-medium">{view.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs">{view.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Features Highlight */}
        <section className="mb-16">
          <Card className="border-primary/20 bg-muted/30">
            <CardContent className="p-10">
              <div className="grid md:grid-cols-3 gap-10">
                {[
                  { icon: TrendingUp, title: "Real-Time Signals", desc: "Track investment, patent, and media signals across all technologies" },
                  { icon: Database, title: "Multi-Source Data", desc: "Integrates Dealroom, PATSTAT, EU Horizon, and CEI assessments" },
                  { icon: Activity, title: "AI-Powered Insights", desc: "Automated trend detection, pattern recognition, and scoring" },
                ].map((feature, i) => (
                  <div key={i} className="text-center animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-5">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold font-display text-lg mb-2 text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Trust indicators */}
        <section className="text-center mb-16">
          <p className="text-sm text-muted-foreground mb-6">Trusted by EU transport authorities and industry experts</p>
          <div className="flex flex-wrap justify-center gap-8">
            {["CEI-Sphere", "EU Horizon", "PATSTAT/EPO"].map((name) => (
              <div key={name} className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{name}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Layers className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-foreground">AI-CE Heatmap</span>
          </div>
          <p className="text-sm text-muted-foreground">ML-SDV Technology Intelligence</p>
          <p className="text-xs text-muted-foreground mt-1">Preview Build • December 2024</p>
        </div>
      </footer>
    </div>
  );
}