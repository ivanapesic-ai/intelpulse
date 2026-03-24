import { useState, useEffect, useMemo } from "react";
import { Lock, ArrowRight, Check, TrendingUp, Database, FileText, Activity } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StatCard } from "@/components/mockups/StatCard";
import { useTechnologies } from "@/hooks/useTechnologies";
import { formatFundingEur, formatNumber, getCompositeScoreLabel } from "@/types/database";
import logo from "@/assets/logo.svg";
import BrandName from "@/components/BrandName";

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

const premiumFeatures = [
  "Full technology coverage (50+ technologies)",
  "Advanced filtering & search",
  "Challenge-Opportunity Matrix",
  "Technology Radar visualization",
  "Export to CSV, PDF reports",
  "API access for integrations",
];

const fallbackKeywords = ["Autonomous Driving", "Electric Vehicles", "Software-Defined Vehicles", "V2X Communication", "Edge Computing", "Battery Technology"];

export default function PublicDemo() {
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [currentKeywordIndex, setCurrentKeywordIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();

  const { data: technologies, isLoading } = useTechnologies();

  const rotatingKeywords = useMemo(() => {
    if (!technologies?.length) return fallbackKeywords;
    return [...technologies]
      .sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0))
      .slice(0, 8)
      .map(t => t.name);
  }, [technologies]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentKeywordIndex((prev) => (prev + 1) % rotatingKeywords.length);
        setIsAnimating(false);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, [rotatingKeywords.length]);

  // Get top 5 technologies for demo display
  const demoTechnologies = useMemo(() => {
    if (!technologies) return [];
    return [...technologies]
      .sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0))
      .slice(0, 5);
  }, [technologies]);

  // Calculate limited stats
  const stats = useMemo(() => {
    if (!demoTechnologies.length) {
      return { totalPatents: 0, totalFunding: 0, avgScore: 0 };
    }
    const totalPatents = demoTechnologies.reduce((sum, t) => sum + (t.totalPatents || 0), 0);
    const totalFunding = demoTechnologies.reduce((sum, t) => sum + (t.totalFundingEur || 0), 0);
    const avgScore = demoTechnologies.reduce((sum, t) => sum + (t.compositeScore || 0), 0) / demoTechnologies.length;
    return { totalPatents, totalFunding, avgScore };
  }, [demoTechnologies]);

  const totalTechCount = technologies?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header - matching PlatformHeader style */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={logo} alt="pulse11" className="h-8 w-auto" />
              <h1 className="text-base leading-none text-foreground"><BrandName /></h1>
              <Badge variant="outline" className="ml-2 text-xs">Demo</Badge>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button size="sm" onClick={() => setShowAccessDialog(true)}>
                Request Access
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - matching Dashboard */}
      <section className="border-b border-border bg-surface-light">
        <div className="container mx-auto px-4 py-14">
          <div className="max-w-3xl">
            
            <h1 className="text-3xl md:text-4xl font-bold font-display leading-tight mb-4 text-foreground animate-fade-in-up">
              Technology Maturity Intelligence for<br />
              <span className={`text-primary inline-block transition-all duration-300 ${isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
                {rotatingKeywords[currentKeywordIndex % rotatingKeywords.length]}
              </span>
            </h1>
            
            <p className="text-base text-muted-foreground mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              Real-time maturity tracking powered by market signals, document analysis, and H11 hybrid scoring model.
            </p>

            {/* Demo Notice */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/10 border border-warning/30 text-sm">
              <Lock className="h-4 w-4 text-warning" />
              <span className="text-foreground">Demo Mode — Showing 5 of {totalTechCount}+ tracked technologies</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10">
        {/* Stats Row - matching Dashboard */}
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
                title="Technologies (Demo)"
                value={5}
                subtitle={`${totalTechCount}+ in full version`}
                icon={Database}
              />
              <StatCard
                title="Sample Patents"
                value={formatNumber(stats.totalPatents)}
                subtitle="From demo selection"
                icon={FileText}
              />
              <StatCard
                title="Sample Investment"
                value={formatFundingEur(stats.totalFunding)}
                subtitle="Market data"
                icon={TrendingUp}
              />
              <StatCard
                title="Avg Maturity"
                value={stats.avgScore.toFixed(2)}
                subtitle="Composite score (0-2)"
                icon={Activity}
              />
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Sample Technologies */}
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-display flex items-center gap-2 text-foreground">
                    <Activity className="h-5 w-5 text-primary" />
                    Sample Technologies
                  </CardTitle>
                  <CardDescription>Top 5 by composite maturity score</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {demoTechnologies.map((tech, i) => {
                      const maturityRing = getMaturityRing(tech.compositeScore || 0);
                      const { color } = getCompositeScoreLabel(tech.compositeScore || 0);
                      return (
                        <div
                          key={tech.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in-up"
                          style={{ animationDelay: `${i * 50}ms` }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-foreground">{tech.name}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className={`text-xs ${ringColors[maturityRing]}`}>
                                {maturityRing}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {formatFundingEur(tech.totalFundingEur || 0)}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-2xl font-bold font-mono ${color}`}>
                              {(tech.compositeScore || 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">Composite</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Locked Preview */}
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10 flex items-center justify-center">
                <Button size="lg" onClick={() => setShowAccessDialog(true)}>
                  <Lock className="h-4 w-4 mr-2" />
                  Unlock Full Platform
                </Button>
              </div>
              <CardHeader>
                <CardTitle className="font-display text-foreground">Challenge-Opportunity Matrix</CardTitle>
                <CardDescription>Strategic positioning visualization</CardDescription>
              </CardHeader>
              <CardContent className="blur-sm opacity-50 pointer-events-none">
                <div className="aspect-square max-w-md mx-auto bg-muted/30 rounded-lg" />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Premium Access CTA */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-foreground">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                  Full Access
                </CardTitle>
                <CardDescription>
                  Unlock the complete pulse11 platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {premiumFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" onClick={() => setShowAccessDialog(true)}>
                  Request Access
                </Button>
              </CardContent>
            </Card>

            {/* Data Sources */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-foreground">Data Sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { name: "Market Data", status: "healthy" },
                  { name: "CEI Documents", status: "healthy" },
                  { name: "Web Sources", status: "healthy" },
                  { name: "EPO Patents", status: "healthy" },
                ].map((source) => (
                  <div key={source.name} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{source.name}</span>
                    <Badge 
                      variant="outline" 
                      className="bg-success/10 text-success border-success/30"
                    >
                      {source.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer - matching Dashboard */}
      <footer className="border-t border-border mt-12 bg-muted/30">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src={logo} alt="pulse11" className="h-6 w-auto" />
            <BrandName className="text-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">CEI-Sphere Intelligence Platform</p>
          <p className="text-xs text-muted-foreground mt-1">Powered by House11</p>
        </div>
      </footer>

      {/* Access Request Dialog */}
      <Dialog open={showAccessDialog} onOpenChange={setShowAccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Request Premium Access</DialogTitle>
            <DialogDescription>
              Get full access to {totalTechCount}+ technologies, advanced filtering, and data exports.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Your email" type="email" />
            <Input placeholder="Organization" />
            <Input placeholder="Your role" />
            <Button className="w-full">Submit Request</Button>
            <p className="text-xs text-muted-foreground text-center">
              We'll get back to you within 2 business days.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
