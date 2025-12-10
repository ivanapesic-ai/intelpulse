import { Link } from "react-router-dom";
import { Radar, Grid3X3, Shield, Globe, Compass, LayoutDashboard, FileText, ArrowRight, TrendingUp, Database, Activity, Sparkles, Zap, CheckCircle2 } from "lucide-react";
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
    gradient: "from-violet to-indigo"
  },
  {
    title: "Technology Radar",
    description: "Circular quadrant-based visualization for quick technology comparison",
    icon: Radar,
    path: "/mockups/radar",
    gradient: "from-cyan to-emerald"
  },
  {
    title: "Heatmap Matrix",
    description: "Grid visualization showing maturity levels across dimensions",
    icon: Grid3X3,
    path: "/mockups/heatmap",
    gradient: "from-pink to-amber"
  },
  {
    title: "Technology Explorer",
    description: "Search, filter, and analyze technologies with detailed profiles",
    icon: Compass,
    path: "/mockups/explorer",
    badge: "New",
    gradient: "from-indigo to-cyan"
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
    description: "User management and data refresh interface for BluSpecs staff",
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
];

const processSteps = [
  { icon: Database, label: "Connect", description: "Multi-source data integration" },
  { icon: Zap, label: "Analyze", description: "AI-powered intelligence" },
  { icon: TrendingUp, label: "Track", description: "Real-time maturity signals" },
  { icon: Sparkles, label: "Decide", description: "Strategic insights" },
];

export default function MockupsIndex() {
  const stats = getStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-mesh" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] orb orb-violet opacity-30" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] orb orb-cyan opacity-20" />
        
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="badge-gradient mb-6 text-sm px-4 py-1.5 animate-fade-in">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              ML-SDV Technology Intelligence Platform
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold font-display mb-6 animate-fade-in-up">
              <span className="text-gradient-vibrant">AI-CE Heatmap</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Real-time technology maturity visualization for 
            </p>
            <p className="text-xl md:text-2xl font-medium mb-10 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              <span className="text-gradient-primary">Mobility</span>
              <span className="text-muted-foreground"> • </span>
              <span className="text-gradient-primary">Logistics</span>
              <span className="text-muted-foreground"> • </span>
              <span className="text-gradient-primary">Software-Defined Vehicles</span>
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <Link to="/mockups/dashboard">
                <Button size="lg" className="btn-gradient gap-2 text-lg px-8 py-6 rounded-xl">
                  <LayoutDashboard className="h-5 w-5" />
                  Open Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/mockups/radar">
                <Button variant="outline" size="lg" className="gap-2 text-lg px-8 py-6 rounded-xl glass hover:bg-primary/5 hover:border-primary/30">
                  <Radar className="h-5 w-5" />
                  Technology Radar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative border-y border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-cyan/5">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: stats.totalTechnologies, label: "Technologies", suffix: "" },
              { value: formatNumber(stats.totalPatents), label: "Patents Tracked", suffix: "" },
              { value: formatFunding(stats.totalFunding), label: "Total Funding", suffix: "" },
              { value: "4", label: "Data Sources", suffix: "" },
            ].map((stat, i) => (
              <div key={i} className="text-center animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <p className="text-4xl md:text-5xl font-bold font-display text-gradient-primary">
                  {stat.value}{stat.suffix}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-16 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4 md:gap-0">
            {processSteps.map((step, i) => (
              <div key={i} className="flex items-center animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex flex-col items-center text-center px-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3 shadow-glow-sm">
                    <step.icon className="h-7 w-7 text-primary" />
                  </div>
                  <p className="font-semibold font-display">{step.label}</p>
                  <p className="text-xs text-muted-foreground max-w-[120px]">{step.description}</p>
                </div>
                {i < processSteps.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-muted-foreground/50 hidden md:block" />
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
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-display">Platform Views</h2>
              <p className="text-sm text-muted-foreground">Explore technology maturity data</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mainViews.map((view, i) => (
              <Link key={view.path} to={view.path}>
                <Card 
                  className="h-full card-hover-glow cursor-pointer group relative overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${view.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  <CardHeader className="pb-3 relative">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${view.gradient} shadow-lg group-hover:shadow-glow-sm transition-shadow`}>
                        <view.icon className="h-5 w-5 text-white" />
                      </div>
                      {view.badge && (
                        <Badge className="badge-gradient text-xs">
                          {view.badge}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg mt-4 font-display group-hover:text-primary transition-colors">
                      {view.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 relative">
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
          <h2 className="text-xl font-bold font-display mb-6">Additional Views</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...otherViews, ...annexes].map((view, i) => (
              <Link key={view.path} to={view.path}>
                <Card className="h-full transition-all duration-200 hover:border-primary/30 hover:shadow-elevated cursor-pointer group">
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
          <Card className="glass border-primary/20 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan/5" />
            <CardContent className="p-10 relative">
              <div className="grid md:grid-cols-3 gap-10">
                {[
                  { icon: TrendingUp, title: "Real-Time Signals", desc: "Track investment, patent, and media signals across all technologies", color: "from-violet to-indigo" },
                  { icon: Database, title: "Multi-Source Data", desc: "Integrates Dealroom, PATSTAT, EU Horizon, and CEI assessments", color: "from-cyan to-emerald" },
                  { icon: Activity, title: "AI-Powered Insights", desc: "Automated trend detection, pattern recognition, and scoring", color: "from-pink to-amber" },
                ].map((feature, i) => (
                  <div key={i} className="text-center animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto mb-5 shadow-lg`}>
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold font-display text-lg mb-2">{feature.title}</h3>
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
          <div className="flex flex-wrap justify-center gap-8 opacity-60">
            {["CEI-Sphere", "BluSpecs", "EU Horizon", "PATSTAT/EPO"].map((name) => (
              <div key={name} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{name}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-indigo flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="font-display font-semibold">AI-CE Heatmap</span>
          </div>
          <p className="text-sm text-muted-foreground">BluSpecs • ML-SDV Technology Intelligence</p>
          <p className="text-xs text-muted-foreground mt-1">Preview Build • December 2024</p>
        </div>
      </footer>
    </div>
  );
}