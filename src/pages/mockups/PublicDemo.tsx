import { useState } from "react";
import { Lock, Radar, Grid3X3, ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const limitedTechnologies = [
  { name: "Kubernetes", quadrant: "Cloud", ring: "Adopt", score: 8.5 },
  { name: "Edge AI Inference", quadrant: "Edge", ring: "Trial", score: 6.8 },
  { name: "V2X Communication", quadrant: "IoT", ring: "Assess", score: 4.5 },
  { name: "Computer Vision", quadrant: "AI/ML", ring: "Adopt", score: 8.3 },
  { name: "Digital Twin", quadrant: "IoT", ring: "Trial", score: 6.5 },
];

const premiumFeatures = [
  "Full technology coverage (150+ technologies)",
  "Advanced filtering (geography, funding, patents)",
  "Export to CSV, PDF reports",
  "Quarterly data updates",
  "Priority support",
  "API access for integrations",
];

export default function PublicDemo() {
  const [activeView, setActiveView] = useState<"radar" | "heatmap">("radar");
  const [showAccessDialog, setShowAccessDialog] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/mockups">
              <Button variant="ghost" size="sm">← Back to Mockups</Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">BluSpecs AI-CE Heatmap</h1>
              <p className="text-sm text-muted-foreground">Technology Maturity Visualization</p>
            </div>
          </div>
          <Dialog open={showAccessDialog} onOpenChange={setShowAccessDialog}>
            <DialogTrigger asChild>
              <Button>
                Request Access
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-foreground">Request Premium Access</DialogTitle>
                <DialogDescription>
                  Get full access to 150+ technologies, advanced filtering, and data exports.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Input placeholder="Your email" type="email" />
                </div>
                <div className="space-y-2">
                  <Input placeholder="Organization" />
                </div>
                <div className="space-y-2">
                  <Input placeholder="Your role" />
                </div>
                <Button className="w-full">Submit Request</Button>
                <p className="text-xs text-muted-foreground text-center">
                  We'll get back to you within 2 business days.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Sample Data Notice */}
        <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/30 flex items-center gap-3">
          <Lock className="h-5 w-5 text-warning flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Demo Mode - Limited Data</p>
            <p className="text-xs text-muted-foreground">
              Showing 5 of 150+ tracked technologies. Request access for full coverage.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Main Content */}
          <div className="space-y-6">
            {/* View Toggle */}
            <div className="flex gap-2">
              <Button
                variant={activeView === "radar" ? "default" : "outline"}
                onClick={() => setActiveView("radar")}
                className="flex items-center gap-2"
              >
                <Radar className="h-4 w-4" />
                Radar View
              </Button>
              <Button
                variant={activeView === "heatmap" ? "default" : "outline"}
                onClick={() => setActiveView("heatmap")}
                className="flex items-center gap-2"
              >
                <Grid3X3 className="h-4 w-4" />
                Heatmap View
              </Button>
            </div>

            {/* Visualization Area */}
            <Card>
              <CardContent className="p-8">
                {activeView === "radar" ? (
                  <div className="relative aspect-square max-w-lg mx-auto">
                    {/* Simplified Radar */}
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {/* Rings */}
                      {[0.8, 0.6, 0.4, 0.2].map((r, i) => (
                        <circle
                          key={i}
                          cx="50"
                          cy="50"
                          r={r * 45}
                          fill="none"
                          stroke="hsl(var(--border))"
                          strokeWidth="0.3"
                        />
                      ))}
                      {/* Quadrant lines */}
                      <line x1="50" y1="5" x2="50" y2="95" stroke="hsl(var(--border))" strokeWidth="0.3" />
                      <line x1="5" y1="50" x2="95" y2="50" stroke="hsl(var(--border))" strokeWidth="0.3" />

                      {/* Sample dots */}
                      <circle cx="60" cy="25" r="2" fill="hsl(var(--primary))" />
                      <circle cx="70" cy="40" r="2" fill="hsl(270 60% 50%)" />
                      <circle cx="35" cy="65" r="2" fill="hsl(var(--success))" />
                      <circle cx="25" cy="30" r="2" fill="hsl(var(--destructive))" />
                      <circle cx="55" cy="55" r="2" fill="hsl(var(--success))" />
                    </svg>

                    {/* Quadrant labels */}
                    <div className="absolute top-2 right-4 text-primary font-semibold text-sm">Cloud</div>
                    <div className="absolute bottom-2 right-4 font-semibold text-sm" style={{ color: "hsl(270 60% 50%)" }}>Edge</div>
                    <div className="absolute bottom-2 left-4 text-success font-semibold text-sm">IoT</div>
                    <div className="absolute top-2 left-4 text-destructive font-semibold text-sm">AI/ML</div>

                    {/* Blur overlay for premium content */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Simplified Heatmap */}
                    <div className="grid grid-cols-5 gap-1 text-center text-xs font-medium text-muted-foreground mb-2">
                      <div></div>
                      <div>TRL</div>
                      <div>Market</div>
                      <div>Innovation</div>
                      <div>Overall</div>
                    </div>
                    {limitedTechnologies.slice(0, 3).map((tech) => (
                      <div key={tech.name} className="grid grid-cols-5 gap-1">
                        <div className="text-sm font-medium truncate pr-2 text-foreground">{tech.name}</div>
                        <div className="h-10 rounded bg-success/60 flex items-center justify-center text-sm font-mono text-foreground">
                          {(Math.random() * 3 + 6).toFixed(1)}
                        </div>
                        <div className="h-10 rounded bg-success/40 flex items-center justify-center text-sm font-mono text-foreground">
                          {(Math.random() * 3 + 5).toFixed(1)}
                        </div>
                        <div className="h-10 rounded bg-warning/50 flex items-center justify-center text-sm font-mono text-foreground">
                          {(Math.random() * 3 + 4).toFixed(1)}
                        </div>
                        <div className="h-10 rounded bg-success/50 flex items-center justify-center text-sm font-mono font-semibold text-foreground">
                          {tech.score.toFixed(1)}
                        </div>
                      </div>
                    ))}

                    {/* Blur overlay */}
                    <div className="relative h-32 overflow-hidden">
                      <div className="opacity-30 blur-sm space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="grid grid-cols-5 gap-1">
                            <div className="h-10 bg-muted rounded" />
                            <div className="h-10 bg-muted rounded" />
                            <div className="h-10 bg-muted rounded" />
                            <div className="h-10 bg-muted rounded" />
                            <div className="h-10 bg-muted rounded" />
                          </div>
                        ))}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Button onClick={() => setShowAccessDialog(true)}>
                          <Lock className="h-4 w-4 mr-2" />
                          Unlock Full Data
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Limited Technology List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Sample Technologies</CardTitle>
                <CardDescription>Showing 5 of 150+ technologies in the ML-SDV sphere</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {limitedTechnologies.map((tech) => (
                    <div
                      key={tech.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                    >
                      <div>
                        <p className="font-medium text-foreground">{tech.name}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {tech.quadrant}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              tech.ring === "Adopt"
                                ? "border-success/50 text-success"
                                : tech.ring === "Trial"
                                ? "border-primary/50 text-primary"
                                : "border-warning/50 text-warning"
                            }`}
                          >
                            {tech.ring}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold font-mono text-foreground">{tech.score.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">Maturity Score</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Premium Upsell */}
          <div className="space-y-6">
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="text-foreground">Premium Access</CardTitle>
                <CardDescription>
                  Unlock the full power of AI-CE Heatmap
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

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-foreground">Demo Limitations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• 5 technologies (vs 150+ in premium)</p>
                <p>• Basic domain filter only</p>
                <p>• No export capabilities</p>
                <p>• No drill-down to details</p>
                <p>• Sample data only</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-foreground">Data Sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-foreground">Dealroom (Funding & Companies)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-foreground">PATSTAT/EPO (Patents)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-foreground">EU Horizon (Research)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-foreground">CEI Internal Assessments</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>BluSpecs AI-CE Heatmap • ML-SDV Technology Maturity Platform</p>
          <p className="mt-1">Last updated: December 2024 • Next refresh: March 2025</p>
        </footer>
      </div>
    </div>
  );
}
