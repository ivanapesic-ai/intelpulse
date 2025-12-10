import { Link } from "react-router-dom";
import { Radar, Grid3X3, Shield, Globe, Network, FileText, Calculator, Database, Wrench, Palette } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const mockups = [
  {
    title: "Technology Radar",
    description: "Circular quadrant-based visualization for quick technology comparison",
    icon: Radar,
    path: "/mockups/radar",
    features: ["Adopt/Trial/Assess/Hold rings", "Cloud/Edge/IoT/AI quadrants", "Interactive hover & click"]
  },
  {
    title: "Heatmap Matrix",
    description: "Grid visualization showing maturity levels across dimensions",
    icon: Grid3X3,
    path: "/mockups/heatmap",
    features: ["TRL × Technology grid", "Color-coded scores", "Sortable columns"]
  },
  {
    title: "Admin Panel",
    description: "User management and data refresh interface for BluSpecs staff",
    icon: Shield,
    path: "/mockups/admin",
    features: ["User management", "Data refresh trigger", "Usage analytics"]
  },
  {
    title: "Public Demo",
    description: "Limited public view with lead capture for premium access",
    icon: Globe,
    path: "/mockups/public",
    features: ["Sample data only", "Basic filtering", "Premium upsell"]
  },
  {
    title: "Architecture Diagrams",
    description: "System architecture and data flow diagrams for technical documentation",
    icon: Network,
    path: "/mockups/architecture",
    features: ["System overview", "Security architecture", "Data flow diagrams"]
  }
];

const annexes = [
  {
    title: "Annex A: Technical Architecture",
    description: "System design, security, infrastructure, and API reference",
    icon: FileText,
    path: "/mockups/annex-a",
    features: ["System overview", "Frontend hierarchy", "Authentication flow", "API endpoints"]
  },
  {
    title: "Annex B: Methodology Framework",
    description: "TRL scale, scoring logic, and data source mapping",
    icon: Calculator,
    path: "/mockups/annex-b",
    features: ["TRL 1-9 scale", "4-dimension scoring", "Radar placement logic", "Confidence levels"]
  },
  {
    title: "Annex C: Data Model",
    description: "Database schema, ERD, taxonomy, and access control",
    icon: Database,
    path: "/mockups/annex-c",
    features: ["Entity relationships", "Technology taxonomy", "RLS policies", "Access matrix"]
  },
  {
    title: "Annex D: Maintenance & Support",
    description: "SLA, support tiers, and data refresh cycles",
    icon: Wrench,
    path: "/mockups/annex-d",
    features: ["6-month coverage", "Priority matrix", "Support tiers", "Infrastructure costs"]
  },
  {
    title: "Annex E: Visual Mockups",
    description: "UI layouts, design system, and interaction patterns",
    icon: Palette,
    path: "/mockups/annex-e",
    features: ["Radar layout", "Heatmap layout", "Color scale", "Design tokens"]
  }
];

export default function MockupsIndex() {
  return (
    <div className="min-h-screen bg-background">
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

        {/* Interactive Mockups */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Interactive Mockups</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockups.map(mockup => (
              <Link key={mockup.path} to={mockup.path}>
                <Card className="h-full transition-all duration-300 hover:glow-primary hover:border-primary/50 cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <mockup.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{mockup.title}</CardTitle>
                        <CardDescription className="text-sm">{mockup.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {mockup.features.map((feature, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Proposal Annexes */}
        <section>
          <h2 className="text-2xl font-bold mb-2">Proposal Annexes</h2>
          <p className="text-muted-foreground mb-6">Screenshot-ready pages with Mermaid diagrams and tables for each annex</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {annexes.map(annex => (
              <Link key={annex.path} to={annex.path}>
                <Card className="h-full transition-all duration-300 hover:glow-primary hover:border-primary/50 cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-accent text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <annex.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{annex.title}</CardTitle>
                        <CardDescription className="text-sm">{annex.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {annex.features.map((feature, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-foreground/30" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <footer className="text-center mt-12 text-muted-foreground text-sm">
          <p>BluSpecs AI-CE Heatmap Platform • Tender Proposal December 2025</p>
        </footer>
      </div>
    </div>
  );
}