import { Link } from "react-router-dom";
import { Radar, Grid3X3, Shield, Globe, Compass, LayoutDashboard, FileText, ArrowRight, TrendingUp, Database, Activity, Sparkles } from "lucide-react";
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
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
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
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
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

export default function MockupsIndex() {
  const stats = getStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.1),transparent_50%)]" />
        
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              ML-SDV Technology Intelligence Platform
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              AI-CE Heatmap
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Real-time technology maturity visualization for Mobility, Logistics, and Software-Defined Vehicles. 
              Track {stats.totalTechnologies} technologies across Cloud, Edge, IoT, and AI/ML domains.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/mockups/dashboard">
                <Button size="lg" className="gap-2">
                  <LayoutDashboard className="h-5 w-5" />
                  Open Dashboard
                  <ArrowRight className="h-4 w-4" />
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
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold">{stats.totalTechnologies}</p>
              <p className="text-sm text-muted-foreground">Technologies</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{formatNumber(stats.totalPatents)}</p>
              <p className="text-sm text-muted-foreground">Patents Tracked</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{formatFunding(stats.totalFunding)}</p>
              <p className="text-sm text-muted-foreground">Total Funding</p>
            </div>
            <div>
              <p className="text-3xl font-bold">4</p>
              <p className="text-sm text-muted-foreground">Data Sources</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Main Platform Views */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Platform Views</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mainViews.map((view) => (
              <Link key={view.path} to={view.path}>
                <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-primary/50 cursor-pointer group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2 relative">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <view.icon className="h-5 w-5" />
                      </div>
                      {view.badge && (
                        <Badge variant="outline" className={view.badgeColor}>
                          {view.badge}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base mt-3">{view.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 relative">
                    <CardDescription className="text-sm line-clamp-2">{view.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Secondary Views */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Additional Views</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {otherViews.map((view) => (
              <Link key={view.path} to={view.path}>
                <Card className="h-full transition-all hover:border-primary/30 cursor-pointer group">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:text-primary transition-colors">
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
            {annexes.map((annex) => (
              <Link key={annex.path} to={annex.path}>
                <Card className="h-full transition-all hover:border-primary/30 cursor-pointer group">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:text-primary transition-colors">
                        <annex.icon className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-sm font-medium">{annex.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-xs">{annex.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Features Highlight */}
        <section className="mb-12">
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Real-Time Signals</h3>
                  <p className="text-sm text-muted-foreground">Track investment, patent, and media signals across all technologies</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Database className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Multi-Source Data</h3>
                  <p className="text-sm text-muted-foreground">Integrates Dealroom, PATSTAT, EU Horizon, and CEI assessments</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Activity className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">AI-Powered Insights</h3>
                  <p className="text-sm text-muted-foreground">Automated trend detection, pattern recognition, and scoring</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>BluSpecs AI-CE Heatmap Platform • ML-SDV Technology Intelligence</p>
          <p className="mt-1">Preview Build • December 2024</p>
        </div>
      </footer>
    </div>
  );
}
