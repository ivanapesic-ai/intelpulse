import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import mermaid from "mermaid";

const diagrams = [
  {
    id: "annex-d-maintenance-timeline",
    title: "6-Month Maintenance Coverage",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
gantt
    title Post-Launch Maintenance Period
    dateFormat YYYY-MM
    section Included
    Bug Fixes           :2025-02, 6M
    Security Patches    :2025-02, 6M
    Platform Updates    :2025-02, 6M
    section Data
    Initial Data Refresh:milestone, 2025-02, 0d
    First Quarterly Refresh:milestone, 2025-05, 0d
    section Support
    Email Support       :2025-02, 6M`
  },
  {
    id: "annex-d-support-flow",
    title: "Support Priority & Escalation",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    I["🎫 Issue Reported"] --> T{Triage}
    
    T -->|"System Down"| P1["🔴 P1 Critical<br/>Response: 4h<br/>Resolution: 24h"]
    T -->|"Major Feature Broken"| P2["🟠 P2 High<br/>Response: 8h<br/>Resolution: 48h"]
    T -->|"Minor Issue"| P3["🟡 P3 Medium<br/>Response: 24h<br/>Resolution: 5 days"]
    T -->|"Enhancement"| P4["🟢 P4 Low<br/>Response: 48h<br/>Resolution: 10 days"]
    
    P1 --> E1["Immediate<br/>Escalation"]
    P2 --> E2["Senior<br/>Review"]
    P3 --> E3["Standard<br/>Queue"]
    P4 --> E4["Backlog<br/>Planning"]`
  },
  {
    id: "annex-d-refresh-cycle",
    title: "Data Refresh Cycle",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart LR
    subgraph Trigger["🔄 Trigger"]
        A["Admin clicks<br/>Refresh Data"]
    end
    
    subgraph Process["⚙️ Process"]
        B["Fetch from<br/>all sources"]
        C["AI Document<br/>Parsing"]
        D["Recalculate<br/>Scores"]
        E["Update<br/>Visualizations"]
    end
    
    subgraph Complete["✅ Complete"]
        F["Notify Admin"]
        G["Log Results"]
    end
    
    A --> B --> C --> D --> E --> F --> G`
  },
  {
    id: "annex-d-sla",
    title: "SLA Overview",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    subgraph Uptime["📊 Availability"]
        U1["Target: 99.5%"]
        U2["~44 hours<br/>downtime/year"]
    end
    
    subgraph Maintenance["🛠️ Scheduled"]
        M1["Tue/Thu 02:00-04:00 CET"]
        M2["48h advance notice"]
    end
    
    subgraph Excluded["❌ Exclusions"]
        E1["Force majeure"]
        E2["Third-party failures"]
        E3["Planned maintenance"]
    end
    
    subgraph Communication["📢 Incidents"]
        C1["Status page updates"]
        C2["Email notifications"]
        C3["Post-mortem reports"]
    end`
  }
];

const supportTiers = [
  { tier: "Basic", price: "€500/month", features: ["Email support (48h response)", "Security patches", "Critical bug fixes"] },
  { tier: "Standard", price: "€1,000/month", features: ["Email support (24h response)", "All bug fixes", "Quarterly data refresh", "Minor enhancements"] },
  { tier: "Premium", price: "€2,000/month", features: ["Priority support (8h response)", "Monthly data refresh", "Feature enhancements", "Dedicated contact"] },
];

const priorityMatrix = [
  { priority: "P1 Critical", response: "4 hours", resolution: "24 hours", example: "System completely unavailable" },
  { priority: "P2 High", response: "8 hours", resolution: "48 hours", example: "Major feature non-functional" },
  { priority: "P3 Medium", response: "24 hours", resolution: "5 days", example: "Minor feature issue" },
  { priority: "P4 Low", response: "48 hours", resolution: "10 days", example: "Enhancement request" },
];

const infrastructureCosts = [
  { service: "Lovable Cloud (hosting)", cost: "€50-150/month", notes: "Usage-based, scales with traffic" },
  { service: "Database storage", cost: "Included", notes: "Up to 8GB included" },
  { service: "Edge function invocations", cost: "Included", notes: "500K/month included" },
  { service: "File storage", cost: "€0.02/GB", notes: "For document uploads" },
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
          containerRef.current.innerHTML = `<pre class="text-sm text-muted-foreground">${chart}</pre>`;
        }
      }
    };
    renderDiagram();
  }, [id, chart]);

  return <div ref={containerRef} className="flex justify-center overflow-x-auto" />;
}

export default function AnnexD() {
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      securityLevel: "loose",
      themeVariables: {
        background: "#ffffff",
        mainBkg: "#f8fafc",
        primaryColor: "#3b82f6",
        primaryTextColor: "#1e293b",
        lineColor: "#64748b",
      },
      flowchart: { htmlLabels: true, curve: "basis" },
      gantt: { useMaxWidth: true },
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
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Annex D: Maintenance & Support</h1>
                <p className="text-sm text-muted-foreground">SLA, support tiers, and data refresh cycles</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Included Maintenance */}
        <Card>
          <CardHeader className="bg-green-50 border-b border-green-100">
            <CardTitle className="text-green-800">✅ Included in €18,500 Delivery</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="grid md:grid-cols-2 gap-3">
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> 6 months post-launch support</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Bug fixes and security patches</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Platform compatibility updates</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Email support (business hours)</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> One data refresh cycle included</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Minor UI adjustments</li>
            </ul>
          </CardContent>
        </Card>

        {/* Diagrams */}
        {diagrams.map((diagram) => (
          <Card key={diagram.id}>
            <CardHeader className="bg-muted/30">
              <CardTitle>{diagram.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-white">
              <MermaidDiagram id={diagram.id} chart={diagram.mermaid} />
            </CardContent>
          </Card>
        ))}

        {/* Priority Matrix */}
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle>Support Priority Matrix</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Priority</th>
                  <th className="text-left p-3 font-medium">Response</th>
                  <th className="text-left p-3 font-medium">Resolution</th>
                  <th className="text-left p-3 font-medium">Example</th>
                </tr>
              </thead>
              <tbody>
                {priorityMatrix.map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-3 font-medium">{row.priority}</td>
                    <td className="p-3">{row.response}</td>
                    <td className="p-3">{row.resolution}</td>
                    <td className="p-3 text-sm text-muted-foreground">{row.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Extended Support Tiers */}
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle>Extended Maintenance Options</CardTitle>
            <p className="text-sm text-muted-foreground">After 6-month included period</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              {supportTiers.map((tier) => (
                <div key={tier.tier} className="border border-border rounded-lg p-4">
                  <div className="font-bold text-lg mb-1">{tier.tier}</div>
                  <div className="text-2xl font-bold text-primary mb-4">{tier.price}</div>
                  <ul className="space-y-2">
                    {tier.features.map((f, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Infrastructure Costs */}
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle>Ongoing Infrastructure Costs</CardTitle>
            <p className="text-sm text-muted-foreground">Estimated monthly hosting costs (paid by BluSpecs)</p>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Service</th>
                  <th className="text-left p-3 font-medium">Cost</th>
                  <th className="text-left p-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {infrastructureCosts.map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-3 font-medium">{row.service}</td>
                    <td className="p-3">{row.cost}</td>
                    <td className="p-3 text-sm text-muted-foreground">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border bg-card/50 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          AI-CE Heatmap Platform — Annex D: Maintenance & Support
        </div>
      </footer>
    </div>
  );
}
