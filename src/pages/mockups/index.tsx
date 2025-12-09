import { Link } from "react-router-dom";
import { Radar, Grid3X3, Shield, Globe, Network } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
const mockups = [{
  title: "Technology Radar",
  description: "Circular quadrant-based visualization for quick technology comparison",
  icon: Radar,
  path: "/mockups/radar",
  features: ["Adopt/Trial/Assess/Hold rings", "Cloud/Edge/IoT/AI quadrants", "Interactive hover & click"]
}, {
  title: "Heatmap Matrix",
  description: "Grid visualization showing maturity levels across dimensions",
  icon: Grid3X3,
  path: "/mockups/heatmap",
  features: ["TRL × Technology grid", "Color-coded scores", "Sortable columns"]
}, {
  title: "Admin Panel",
  description: "User management and data refresh interface for BluSpecs staff",
  icon: Shield,
  path: "/mockups/admin",
  features: ["User management", "Data refresh trigger", "Usage analytics"]
}, {
  title: "Public Demo",
  description: "Limited public view with lead capture for premium access",
  icon: Globe,
  path: "/mockups/public",
  features: ["Sample data only", "Basic filtering", "Premium upsell"]
}, {
  title: "Architecture Diagrams",
  description: "System architecture and data flow diagrams for technical documentation",
  icon: Network,
  path: "/mockups/architecture",
  features: ["System overview", "Security architecture", "Data flow diagrams"]
}];
export default function MockupsIndex() {
  return <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gradient mb-4">
            AI-CE Heatmap Mockups
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Interactive mockups for the Technology Maturity Visualization Platform.
            These can be screenshotted for the proposal or demoed live to BluSpecs.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {mockups.map(mockup => <Link key={mockup.path} to={mockup.path}>
              <Card className="h-full transition-all duration-300 hover:glow-primary hover:border-primary/50 cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <mockup.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{mockup.title}</CardTitle>
                      <CardDescription>{mockup.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {mockup.features.map((feature, index) => <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                        {feature}
                      </li>)}
                  </ul>
                </CardContent>
              </Card>
            </Link>)}
        </div>

        <footer className="text-center mt-12 text-muted-foreground text-sm">
          <p>BluSpecs AI-CE Heatmap Platform • Tender Proposal December 2025</p>
        </footer>
      </div>
    </div>;
}