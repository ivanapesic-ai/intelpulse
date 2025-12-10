import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Users, Download, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import mermaid from "mermaid";

const diagrams = [
  {
    id: "user-capabilities",
    title: "User Capabilities by Tier",
    icon: Users,
    description: `The platform implements a three-tier access model designed for BluSpecs' freemium business model. Each tier provides progressively more capabilities while maintaining consistent user experience.

**Public Demo (Free)** — Access to a curated subset of technologies with limited historical data. Demonstrates platform capabilities without revealing full dataset. No account required.

**Premium Clients (Paid)** — Full access to all technologies, complete historical data, detailed scoring breakdowns, source citations, and export capabilities. Requires account managed by BluSpecs.

**Administrators (BluSpecs Staff)** — All premium features plus user management, data source configuration, manual data entry, AI assessment validation, and system monitoring dashboards.`,
    mermaid: `%%{init: {'theme': 'neutral', 'themeVariables': {'background': '#ffffff'}}}%%
flowchart LR
    subgraph T1["1: Public Demo"]
        direction TB
        P1["Sample Technologies"] --> P2["Basic Visualization"] --> P3["Limited History"]
    end

    subgraph T2["2: Premium Clients"]
        direction TB
        PR1["All Technologies"] --> PR2["Full History"] --> PR3["Source Citations"] --> PR4["Export Features"]
    end

    subgraph T3["3: Administrators"]
        direction TB
        A1["User Management"] --> A2["Data Configuration"] --> A3["AI Validation"] --> A4["System Monitoring"]
    end

    T1 --> T2 --> T3
        A4["System Monitoring"]
    end

    Public --> Premium --> Admin`
  }
];

const userTierCapabilities = [
  { tier: "Public Demo", capabilities: ["View sample technologies", "Basic radar visualization", "Limited technology details"], limits: "~20 technologies, no export" },
  { tier: "Premium Client", capabilities: ["All technologies", "Full historical data", "Detailed score breakdowns", "Source citations", "PDF/CSV export"], limits: "Full access, managed by BluSpecs" },
  { tier: "Administrator", capabilities: ["All premium features", "User management", "Data source config", "AI validation tools", "Audit logs"], limits: "BluSpecs staff only" },
];

const exportCapabilities = [
  { format: "PDF Report", description: "Formatted report with visualizations, suitable for presentations and stakeholder briefings" },
  { format: "CSV Export", description: "Raw data export for analysis in spreadsheet tools or further processing" },
  { format: "API Access", description: "Programmatic access to technology data for integration with other systems (premium tier)" },
];

const taxonomyDomains = [
  { domain: "Cloud Technologies", icon: "☁️", description: "Infrastructure, platforms, and services delivered via cloud computing models" },
  { domain: "AI/ML", icon: "🤖", description: "Artificial intelligence, machine learning, and cognitive computing systems" },
  { domain: "IoT", icon: "📡", description: "Connected devices, sensors, and Internet of Things ecosystems" },
  { domain: "Edge Computing", icon: "⚡", description: "Distributed computing infrastructure at the network edge" },
];

function MermaidDiagram({ id, chart }: { id: string; chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
        try {
          const { svg } = await mermaid.render(`mermaid-${id}`, chart);
          containerRef.current.innerHTML = svg;
        } catch (error) {
          console.error("Mermaid rendering error:", error);
        }
      }
    };
    renderDiagram();
  }, [id, chart]);

  return <div ref={containerRef} className="flex justify-center overflow-x-auto" />;
}

export default function AnnexB() {
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "neutral",
      securityLevel: "loose",
      themeVariables: { background: "#ffffff" },
      flowchart: { htmlLabels: true, curve: "basis" },
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/mockups">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">Annex B: Platform Capabilities</h1>
              <p className="text-sm text-muted-foreground">Document processing, data integration, user features</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Introduction */}
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              The AI-CE Heatmap Platform transforms heterogeneous data sources—structured APIs, semi-structured files, and unstructured documents—into actionable technology intelligence. This annex details the platform's document processing capabilities, data source integrations, and user features by access tier.
            </p>
          </CardContent>
        </Card>

        {/* Data Model Disclaimer */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <p className="text-sm text-amber-800">
              <strong>⚠️ Note:</strong> Data source configurations and integration details are preliminary. The final data pipeline will be validated during the design sprint based on actual Dealroom API access level, PATSTAT export format, and CEI document samples provided by BluSpecs.
            </p>
          </CardContent>
        </Card>

        {/* Live Mockups Reference */}
        <Card>
          <CardHeader className="bg-primary/5 border-b border-primary/10 py-4">
            <CardTitle className="text-lg">Interactive Prototypes</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Explore the working prototypes to experience platform capabilities firsthand.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <Link to="/mockups/radar" className="block p-4 border border-border rounded-lg hover:border-primary transition-colors">
                <div className="font-medium">Technology Radar</div>
                <div className="text-sm text-muted-foreground">Circular quadrant-based visualization</div>
              </Link>
              <Link to="/mockups/heatmap" className="block p-4 border border-border rounded-lg hover:border-primary transition-colors">
                <div className="font-medium">Heatmap Matrix</div>
                <div className="text-sm text-muted-foreground">Grid-based maturity landscape</div>
              </Link>
              <Link to="/mockups/admin" className="block p-4 border border-border rounded-lg hover:border-primary transition-colors">
                <div className="font-medium">Admin Panel</div>
                <div className="text-sm text-muted-foreground">User and data management</div>
              </Link>
              <Link to="/mockups/public" className="block p-4 border border-border rounded-lg hover:border-primary transition-colors">
                <div className="font-medium">Public Demo</div>
                <div className="text-sm text-muted-foreground">Limited public-facing view</div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Diagrams with descriptions */}
        {diagrams.map((diagram) => (
          <Card key={diagram.id}>
            <CardHeader className="bg-muted/30 py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <diagram.icon className="h-5 w-5 text-primary" />
                {diagram.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="prose prose-sm max-w-none text-muted-foreground">
                {diagram.description.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-3 last:mb-0">
                    {paragraph.split('**').map((part, i) => 
                      i % 2 === 1 ? <strong key={i} className="text-foreground">{part}</strong> : part
                    )}
                  </p>
                ))}
              </div>
              <div className="bg-white rounded-lg p-4 border border-border">
                <MermaidDiagram id={diagram.id} chart={diagram.mermaid} />
              </div>
            </CardContent>
          </Card>
        ))}

        {/* User Tier Capabilities */}
        <Card>
          <CardHeader className="bg-muted/30 py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              User Tier Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Access tiers are managed manually by BluSpecs—no self-service registration or payment integration. This allows BluSpecs to maintain direct relationships with premium clients.
            </p>
            <div className="space-y-4">
              {userTierCapabilities.map((tier) => (
                <div key={tier.tier} className="border border-border rounded-lg p-4">
                  <div className="font-medium mb-2">{tier.tier}</div>
                  <ul className="text-sm text-muted-foreground space-y-1 mb-2">
                    {tier.capabilities.map((cap) => (
                      <li key={cap}>• {cap}</li>
                    ))}
                  </ul>
                  <div className="text-xs text-muted-foreground italic">{tier.limits}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Technology Taxonomy */}
        <Card>
          <CardHeader className="bg-muted/30 py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Cloud-Edge-IoT-AI Taxonomy
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Technologies are classified into four primary domains within the ML-SDV (Mobility, Logistics, Software-Defined Vehicles) sphere. This taxonomy organizes the radar quadrants and enables domain-specific filtering.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {taxonomyDomains.map((d) => (
                <div key={d.domain} className="flex items-start gap-4 p-4 border border-border rounded-lg">
                  <div className="text-2xl">{d.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium mb-1">{d.domain}</div>
                    <div className="text-sm text-muted-foreground">{d.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Export Capabilities */}
        <Card>
          <CardHeader className="bg-muted/30 py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Export & Reporting
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Premium users can export technology data for offline analysis, presentations, and integration with other tools.
            </p>
            <div className="space-y-3">
              {exportCapabilities.map((exp) => (
                <div key={exp.format} className="flex gap-4 text-sm">
                  <span className="font-medium w-28">{exp.format}</span>
                  <span className="text-muted-foreground">{exp.description}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border bg-card/50 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          AI-CE Heatmap Platform — Annex B
        </div>
      </footer>
    </div>
  );
}
