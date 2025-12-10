import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Users, Eye, Filter, Download, Bell, Bookmark, Search, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import mermaid from "mermaid";

const diagrams = [
  {
    id: "user-journey",
    title: "User Journey & Workflows",
    icon: Users,
    description: `The platform supports three distinct user journeys, each optimized for different goals and access levels. All journeys share a consistent interface while exposing tier-appropriate features.

**Discovery Journey (All Users)** — Users land on the Technology Radar or Heatmap Matrix, explore technologies visually, filter by domain or maturity, and drill into individual technology profiles. Public users see sample data; premium users see the full dataset.

**Analysis Journey (Premium)** — Deep-dive into technology assessments including score breakdowns across all four dimensions, historical trend charts, source citations, and related technologies. Export capabilities enable offline analysis and reporting.

**Management Journey (Admin)** — Configure platform settings, manage user accounts, validate AI assessments, perform manual data entry, and monitor system health. Full audit trail of all administrative actions.

Each journey is designed for minimal friction—users accomplish their goals within 2-3 clicks from any starting point.`,
    mermaid: `%%{init: {'theme': 'neutral', 'themeVariables': {'background': '#ffffff'}}}%%
flowchart LR
    subgraph J1["1: Discovery"]
        direction TB
        D1["Land"] --> D2["Explore"] --> D3["Filter"] --> D4["Select"]
    end

    subgraph J2["2: Analysis"]
        direction TB
        A1["View Details"] --> A2["Compare"] --> A3["Export"]
    end

    subgraph J3["3: Management"]
        direction TB
        M1["Configure"] --> M2["Validate"] --> M3["Monitor"]
    end

    J1 --> J2
    J2 --> J3`
  },
  {
    id: "visualization-modes",
    title: "Visualization Modes",
    icon: Eye,
    description: `Two complementary visualization modes serve different decision-making contexts. Users can switch seamlessly between views while maintaining their current filters and selections.

**Technology Radar** — Circular quadrant layout inspired by ThoughtWorks Tech Radar. Technologies are positioned by domain (quadrant) and maturity (ring distance from center). Ideal for quick strategic overview—"What should we adopt now? What's emerging?" Interactive hover reveals technology details; click opens full profile.

**Heatmap Matrix** — Grid layout with domains as columns and maturity levels as rows. Cell color intensity indicates technology density or average score. Better for systematic coverage analysis—"Where are the gaps? Which domains are most mature?" Supports drill-down into individual cells.

**Custom Views** — Save and share filtered views with specific configurations. Useful for recurring analysis or stakeholder-specific dashboards. View types and configurations will be refined during the design sprint based on user needs identified in discovery.`,
    mermaid: `%%{init: {'theme': 'neutral', 'themeVariables': {'background': '#ffffff'}}}%%
flowchart LR
    subgraph Radar["Technology Radar"]
        direction TB
        R1["Quadrants"] --> R2["Rings"] --> R3["Blips"]
    end

    subgraph Heatmap["Heatmap Matrix"]
        direction TB
        H1["Domains"] --> H2["Maturity"] --> H3["Cells"]
    end

    subgraph Custom["Custom Views"]
        direction TB
        C1["Filters"] --> C2["Save"] --> C3["Share"]
    end

    Radar --> Switch["Seamless Switch"]
    Heatmap --> Switch
    Switch --> Custom`
  },
  {
    id: "filtering-search",
    title: "Filtering & Search",
    icon: Filter,
    description: `Powerful filtering enables users to focus on technologies relevant to their specific needs. All filters are combinable and URL-persistent for easy sharing.

**Domain Filter** — Select one or more technology domains: Cloud, Edge, IoT, AI/ML. Quadrant highlighting on radar; column filtering on heatmap.

**Maturity Filter** — Focus on specific readiness levels: Adopt, Trial, Assess, Hold. Ring highlighting on radar; row filtering on heatmap.

**Score Range** — Slider to filter by composite score (0-9) or individual dimension scores. Enables "show only high-innovation technologies" or similar queries.

**Text Search** — Full-text search across technology names, descriptions, and tags. Instant results with highlighted matches.

**Time Range** — For premium users with historical access, filter to specific date ranges to see how the landscape evolved.

Filter state is encoded in URL, enabling bookmarking and sharing of specific views.`,
    mermaid: `%%{init: {'theme': 'neutral', 'themeVariables': {'background': '#ffffff'}}}%%
flowchart LR
    subgraph Filters["Filter Types"]
        direction TB
        F1["Domain"] --> F2["Maturity"] --> F3["Score"] --> F4["Search"]
    end

    subgraph Apply["Application"]
        direction TB
        A1["Combine"] --> A2["URL Encode"] --> A3["Update View"]
    end

    subgraph Persist["Persistence"]
        direction TB
        P1["Bookmark"] --> P2["Share"] --> P3["Restore"]
    end

    Filters --> Apply --> Persist`
  },
  {
    id: "technology-profile",
    title: "Technology Profile View",
    icon: BarChart3,
    description: `Each technology has a detailed profile page providing comprehensive assessment information. Profile depth varies by access tier.

**Summary Section** — Technology name, domain classification, current maturity ring, and composite score. Visual indicator of score trend (improving, stable, declining).

**Score Breakdown** — Four-dimension radar chart showing TRL, Market, Innovation, and EU Alignment scores. Each dimension clickable to reveal calculation methodology and data sources.

**Trend History (Premium)** — Time-series chart showing how the technology's scores have evolved across data refresh cycles. Annotations mark significant events.

**Source Citations (Premium)** — Links to source documents and data points that contributed to the assessment. Enables validation and deeper research.

**Related Technologies** — Algorithmically suggested technologies with similar profiles or complementary capabilities. Enables ecosystem exploration.`,
    mermaid: `%%{init: {'theme': 'neutral', 'themeVariables': {'background': '#ffffff'}}}%%
flowchart LR
    subgraph Core["Core Info"]
        direction TB
        C1["Name"] --> C2["Domain"] --> C3["Score"]
    end

    subgraph Scores["Score Detail"]
        direction TB
        S1["TRL"] --> S2["Market"] --> S3["Innovation"] --> S4["EU"]
    end

    subgraph Deep["Deep Dive"]
        direction TB
        D1["History"] --> D2["Sources"] --> D3["Related"]
    end

    Core --> Scores --> Deep`
  },
  {
    id: "export-features",
    title: "Export & Sharing",
    icon: Download,
    description: `Premium users can export and share technology intelligence in formats optimized for different audiences and use cases.

**PDF Executive Report** — One-click generation of a formatted report including radar visualization, top technologies summary, and key insights. Branded with BluSpecs identity. Ideal for stakeholder briefings and board presentations.

**CSV Data Export** — Download filtered technology data as spreadsheet-compatible CSV. Includes all visible dimensions and scores. Suitable for custom analysis in Excel, Google Sheets, or BI tools.

**Snapshot Share** — Generate a shareable link to the current view (with filters applied). Recipients see a read-only version. Useful for "look at this cluster of technologies" discussions.

**API Access (Roadmap)** — Programmatic JSON endpoints for integration with external systems. Planned for future release to enable third-party integrations and automated workflows.`,
    mermaid: `%%{init: {'theme': 'neutral', 'themeVariables': {'background': '#ffffff'}}}%%
flowchart LR
    subgraph Formats["Export Formats"]
        direction TB
        E1["PDF Report"] --> E2["CSV Data"] --> E3["Share Link"]
    end

    subgraph Options["Options"]
        direction TB
        O1["Apply Filters"] --> O2["Select Fields"] --> O3["Add Branding"]
    end

    subgraph Deliver["Delivery"]
        direction TB
        D1["Download"] --> D2["Email"] --> D3["API"]
    end

    Formats --> Options --> Deliver`
  },
  {
    id: "admin-capabilities",
    title: "Admin Capabilities",
    icon: Settings,
    description: `Administrators have full platform control through a dedicated management interface. All admin actions are logged for audit compliance.

**User Management** — Create, edit, and deactivate user accounts. Assign access tiers (Public/Premium/Admin). View user activity and last login timestamps.

**Data Validation** — Review AI-generated assessments flagged for low confidence. Approve, reject, or manually override TRL scores and classifications. Add expert annotations.

**Manual Entry** — Add technologies not captured by automated data sources. Input expert assessments for emerging technologies before they appear in external databases.

**System Monitoring** — Dashboard showing data freshness, processing queue status, error logs, and usage metrics. Alerts for failed data source connections or processing errors.

**Audit Trail** — Complete log of all data changes, user actions, and system events. Filterable by date, user, or action type. Exportable for compliance reporting.`,
    mermaid: `%%{init: {'theme': 'neutral', 'themeVariables': {'background': '#ffffff'}}}%%
flowchart LR
    subgraph Users["User Mgmt"]
        direction TB
        U1["Create"] --> U2["Edit"] --> U3["Assign Tier"]
    end

    subgraph Data["Data Mgmt"]
        direction TB
        D1["Validate"] --> D2["Override"] --> D3["Add New"]
    end

    subgraph Monitor["Monitoring"]
        direction TB
        M1["Dashboard"] --> M2["Alerts"] --> M3["Audit Log"]
    end

    Users --> AdminPanel["Admin Panel"]
    Data --> AdminPanel
    Monitor --> AdminPanel`
  }
];

const tierFeatures = [
  { feature: "Technology Radar view", public: "✓", premium: "✓", admin: "✓" },
  { feature: "Heatmap Matrix view", public: "✓", premium: "✓", admin: "✓" },
  { feature: "Domain & maturity filters", public: "✓", premium: "✓", admin: "✓" },
  { feature: "Technology count", public: "~20 sample", premium: "Full dataset", admin: "Full dataset" },
  { feature: "Score breakdown (4 dimensions)", public: "—", premium: "✓", admin: "✓" },
  { feature: "Historical trend charts", public: "—", premium: "✓", admin: "✓" },
  { feature: "Source citations", public: "—", premium: "✓", admin: "✓" },
  { feature: "PDF report export", public: "—", premium: "✓", admin: "✓" },
  { feature: "CSV data export", public: "—", premium: "✓", admin: "✓" },
  { feature: "API access", public: "—", premium: "—", admin: "Roadmap" },
  { feature: "User management", public: "—", premium: "—", admin: "✓" },
  { feature: "Data validation & override", public: "—", premium: "—", admin: "✓" },
  { feature: "System monitoring", public: "—", premium: "—", admin: "✓" },
];

const upcomingFeatures = [
  { feature: "Saved Views", description: "Save and name custom filter configurations for quick access" },
  { feature: "Alerts & Notifications", description: "Get notified when tracked technologies change maturity level" },
  { feature: "Comparison Mode", description: "Side-by-side comparison of 2-4 technologies" },
  { feature: "Collaboration Notes", description: "Add private or shared notes to technologies" },
  { feature: "API Access", description: "Programmatic JSON endpoints for Premium+ users. Enable integration with external BI tools, automated reporting, and webhook notifications for technology changes." },
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
              <p className="text-sm text-muted-foreground">User features, interface capabilities, access tiers</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Introduction */}
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              This annex details the user-facing capabilities of the AI-CE Heatmap Platform—what users can do, how they interact with the system, and what features are available at each access tier. For technical architecture and data processing details, see Annex A.
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
              Experience the platform capabilities through working prototypes.
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

        {/* Feature Comparison Table */}
        <Card>
          <CardHeader className="bg-muted/30 py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Feature Availability by Tier
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Access tiers are managed manually by BluSpecs—no self-service registration or payment integration.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-3 text-left font-medium">Feature</th>
                    <th className="p-3 text-center font-medium">Public Demo</th>
                    <th className="p-3 text-center font-medium">Premium</th>
                    <th className="p-3 text-center font-medium">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {tierFeatures.map((row) => (
                    <tr key={row.feature} className="border-t border-border">
                      <td className="p-3">{row.feature}</td>
                      <td className="p-3 text-center text-muted-foreground">{row.public}</td>
                      <td className="p-3 text-center text-muted-foreground">{row.premium}</td>
                      <td className="p-3 text-center text-muted-foreground">{row.admin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Features */}
        <Card>
          <CardHeader className="bg-muted/30 py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-primary" />
              Roadmap Features
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Planned enhancements for future releases based on user feedback and strategic priorities.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {upcomingFeatures.map((f) => (
                <div key={f.feature} className="border border-border rounded-lg p-4">
                  <div className="font-medium mb-1">{f.feature}</div>
                  <div className="text-sm text-muted-foreground">{f.description}</div>
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
