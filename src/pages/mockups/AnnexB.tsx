import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Database, Layers, Download, Shield, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import mermaid from "mermaid";

const diagrams = [
  {
    id: "document-processing",
    title: "Document Processing Pipeline",
    icon: FileText,
    description: `The platform's core differentiator is its ability to transform unstructured documents into structured intelligence. CEI internal datasets arrive as PowerPoint presentations and PDF reports rather than structured data—requiring sophisticated AI processing.

**Stage 1: Ingestion** — Documents are uploaded through the admin interface or API. The system identifies file type, extracts metadata, and queues for processing. Supported formats include PDF, PPT/PPTX, DOC/DOCX, and plain text.

**Stage 2: Parsing** — Layout analysis preserves document structure including headings, tables, lists, and embedded diagrams. Text is extracted while maintaining semantic relationships between sections.

**Stage 3: NLP Processing** — Named Entity Recognition (NER) identifies technology mentions, company names, funding amounts, locations, and temporal references. Relationship extraction links entities together.

**Stage 4: Enrichment** — AI models assess Technology Readiness Levels from contextual signals, classify technologies into the Cloud-Edge-IoT-AI taxonomy, and generate confidence scores for each extraction.

**Stage 5: Validation** — Low-confidence extractions are flagged for human review. Domain experts can validate, correct, or enhance AI assessments through the admin interface.`,
    mermaid: `%%{init: {'theme': 'neutral', 'themeVariables': {'background': '#ffffff'}}}%%
flowchart LR
    subgraph S1["1: Ingest"]
        direction TB
        I1["Upload"] --> I2["Detect"] --> I3["Queue"]
    end

    subgraph S2["2: Parse"]
        direction TB
        P1["Layout"] --> P2["Extract"] --> P3["Structure"]
    end

    subgraph S3["3: NLP"]
        direction TB
        N1["NER"] --> N2["Relations"] --> N3["Context"]
    end

    subgraph S4["4: Enrich"]
        direction TB
        E1["TRL"] --> E2["Classify"] --> E3["Score"]
    end

    subgraph S5["5: Validate"]
        direction TB
        V1["Flag"] --> V2["Review"] --> V3["Approve"]
    end

    S1 --> S2 --> S3 --> S4 --> S5`
  },
  {
    id: "data-sources",
    title: "Data Source Architecture",
    icon: Database,
    description: `The platform integrates four distinct data sources, each contributing unique intelligence dimensions. The architecture handles structured APIs, semi-structured files, and unstructured documents through specialized connectors.

**Dealroom API (REST)** — Real-time company profiles, funding rounds, investor networks, and growth metrics. Primary source for Market Score calculation. Structured JSON responses with pagination and rate limiting.

**PATSTAT (CSV Batch)** — European Patent Office quarterly exports containing patent filings, citations, applicant data, and IPC classifications. Primary source for Innovation Score. Large-scale batch processing with entity resolution.

**CEI Documents (Unstructured)** — Strategic assessments, technology reports, and policy analyses from the Cloud-Edge-IoT sphere. Requires full AI document intelligence pipeline. Source for TRL assessment and EU Alignment scoring.

**Expert Input (Manual)** — Admin interface for adding technologies not captured by automated sources, correcting AI assessments, and inputting domain expert evaluations. Provides validation layer and fills data gaps.

All sources feed into a unified data model with provenance tracking, enabling source attribution and confidence weighting in final scores.`,
    mermaid: `%%{init: {'theme': 'neutral', 'themeVariables': {'background': '#ffffff'}}}%%
flowchart LR
    subgraph APIs["REST APIs"]
        direction TB
        DR["Dealroom"] --> DR1["Companies"] --> DR2["Funding"]
    end

    subgraph Batch["Batch Files"]
        direction TB
        PS["PATSTAT"] --> PS1["Patents"] --> PS2["Citations"]
    end

    subgraph Docs["Documents"]
        direction TB
        CEI["CEI Reports"] --> CEI1["Parse"] --> CEI2["Extract"]
    end

    subgraph Manual["Expert Input"]
        direction TB
        EX["Admin"] --> EX1["Add"] --> EX2["Validate"]
    end

    APIs --> Unified["Unified Data Model"]
    Batch --> Unified
    Docs --> Unified
    Manual --> Unified`
  },
  {
    id: "access-tiers",
    title: "Access Control Architecture",
    icon: Shield,
    description: `The platform implements Row-Level Security (RLS) at the database level, ensuring users only access data appropriate to their tier. This architecture enables a freemium model while protecting premium content.

**Public Tier** — Unauthenticated access to a curated sample dataset (~20 technologies). Demonstrates platform capabilities without exposing full intelligence. No export, limited history, basic visualizations only.

**Premium Tier** — Authenticated access with full dataset visibility. Complete historical data, detailed score breakdowns, source citations, and export capabilities (PDF/CSV). Access managed by BluSpecs—no self-service registration.

**Admin Tier** — Full platform access plus management capabilities: user provisioning, data source configuration, AI validation tools, manual data entry, audit logs, and system monitoring dashboards.

Security is enforced at multiple layers: authentication (Lovable Cloud Auth), authorization (RLS policies), and UI (feature gating based on user claims).`,
    mermaid: `%%{init: {'theme': 'neutral', 'themeVariables': {'background': '#ffffff'}}}%%
flowchart LR
    subgraph Auth["Authentication"]
        direction TB
        A1["Request"] --> A2["JWT Verify"] --> A3["User Claims"]
    end

    subgraph RLS["Row-Level Security"]
        direction TB
        R1["Policy Check"] --> R2["Filter Data"] --> R3["Return Rows"]
    end

    subgraph UI["Feature Gating"]
        direction TB
        U1["Check Tier"] --> U2["Enable/Disable"] --> U3["Render UI"]
    end

    Auth --> RLS --> UI`
  },
  {
    id: "taxonomy",
    title: "Cloud-Edge-IoT-AI Taxonomy",
    icon: Layers,
    description: `Technologies are classified into four primary domains within the ML-SDV (Mobility, Logistics, Software-Defined Vehicles) sphere. This taxonomy provides the quadrant structure for the Technology Radar and enables domain-specific filtering throughout the platform.

**Cloud Technologies** — Centralized computing infrastructure including hyperscaler platforms (AWS, Azure, GCP), container orchestration, serverless computing, and cloud-native development tools. Foundation for scalable backend services.

**Edge Computing** — Distributed processing at network periphery including edge nodes, gateways, MEC (Multi-access Edge Computing), and 5G/6G connectivity. Critical for low-latency applications in autonomous vehicles and real-time logistics.

**IoT (Internet of Things)** — Connected device ecosystems including sensors, actuators, telematics units, and fleet management systems. Primary data generation layer for mobility and logistics applications.

**AI/ML** — Cross-cutting intelligence capabilities spanning machine learning, computer vision, natural language processing, and autonomous decision systems. Enables intelligent automation across all other domains.

The taxonomy aligns with the CEI-Sphere Hourglass Model, ensuring platform intelligence maps directly to established strategic frameworks.`,
    mermaid: `%%{init: {'theme': 'neutral', 'themeVariables': {'background': '#ffffff'}}}%%
flowchart LR
    subgraph Cloud["☁️ Cloud"]
        direction TB
        C1["Platforms"] --> C2["Containers"] --> C3["Serverless"]
    end

    subgraph Edge["⚡ Edge"]
        direction TB
        E1["Nodes"] --> E2["MEC"] --> E3["5G/6G"]
    end

    subgraph IoT["📡 IoT"]
        direction TB
        I1["Sensors"] --> I2["Telematics"] --> I3["Fleet"]
    end

    subgraph AI["🤖 AI/ML"]
        direction TB
        A1["ML"] --> A2["Vision"] --> A3["NLP"]
    end

    Cloud --> Radar["Technology Radar"]
    Edge --> Radar
    IoT --> Radar
    AI --> Radar`
  },
  {
    id: "export-reporting",
    title: "Export & Reporting Pipeline",
    icon: Download,
    description: `Premium users can export technology intelligence in multiple formats optimized for different use cases. The export pipeline applies access controls, formats data appropriately, and tracks usage for audit purposes.

**PDF Reports** — Formatted documents with embedded visualizations, suitable for executive briefings and stakeholder presentations. Includes radar snapshots, score breakdowns, and trend analysis. Branded with BluSpecs identity.

**CSV Export** — Raw data exports for offline analysis in spreadsheet tools or integration with business intelligence platforms. Includes all visible fields with proper escaping and encoding.

**API Access** — Programmatic endpoints returning JSON data for integration with external systems. Supports filtering, pagination, and webhooks for data change notifications. Rate-limited per client.

All exports include metadata: generation timestamp, user attribution, data freshness indicators, and source citations where applicable.`,
    mermaid: `%%{init: {'theme': 'neutral', 'themeVariables': {'background': '#ffffff'}}}%%
flowchart LR
    subgraph Request["1: Request"]
        direction TB
        R1["Select Data"] --> R2["Choose Format"] --> R3["Apply Filters"]
    end

    subgraph Process["2: Process"]
        direction TB
        P1["Access Check"] --> P2["Format Data"] --> P3["Add Metadata"]
    end

    subgraph Deliver["3: Deliver"]
        direction TB
        D1["Generate File"] --> D2["Log Audit"] --> D3["Download"]
    end

    Request --> Process --> Deliver`
  },
  {
    id: "data-refresh",
    title: "Data Refresh Workflow",
    icon: RefreshCw,
    description: `Data refresh is triggered manually via admin interface rather than automated polling. This design gives BluSpecs control over update timing and allows validation before data becomes visible to users.

**Initiation** — Administrator triggers refresh from the admin panel, selecting which data sources to update. The system validates credentials and connectivity before proceeding.

**Extraction** — Connectors pull data from external sources: Dealroom API calls, PATSTAT file imports, and document queue processing. Progress is tracked in real-time.

**Processing** — New data flows through the AI pipeline: normalization, entity extraction, TRL assessment, and score calculation. Delta detection identifies changes from previous refresh.

**Validation** — Admin reviews flagged items requiring human judgment. Low-confidence extractions and significant score changes are highlighted for attention.

**Publication** — Approved data is published to production, instantly available to all users. Full audit trail captures what changed, when, and who approved.

Initial delivery includes one data refresh cycle. Ongoing refresh cycles are quoted separately.`,
    mermaid: `%%{init: {'theme': 'neutral', 'themeVariables': {'background': '#ffffff'}}}%%
flowchart LR
    subgraph Init["1: Initiate"]
        direction TB
        I1["Trigger"] --> I2["Validate"] --> I3["Start"]
    end

    subgraph Extract["2: Extract"]
        direction TB
        E1["APIs"] --> E2["Files"] --> E3["Docs"]
    end

    subgraph Process["3: Process"]
        direction TB
        P1["Normalize"] --> P2["AI Enrich"] --> P3["Score"]
    end

    subgraph Validate["4: Validate"]
        direction TB
        V1["Review"] --> V2["Approve"] --> V3["Publish"]
    end

    Init --> Extract --> Process --> Validate`
  }
];

const supportedFormats = [
  { format: "PDF", extensions: ".pdf", notes: "Reports, whitepapers, policy documents" },
  { format: "PowerPoint", extensions: ".ppt, .pptx", notes: "Presentations, slide decks" },
  { format: "Word", extensions: ".doc, .docx", notes: "Text documents, assessments" },
  { format: "Plain Text", extensions: ".txt, .md", notes: "Simple text files, markdown" },
];

const dataSourceDetails = [
  { source: "Dealroom", type: "REST API", refresh: "On-demand", data: "Companies, funding, investors, growth metrics" },
  { source: "PATSTAT", type: "CSV Export", refresh: "Quarterly", data: "Patents, citations, applicants, IPC codes" },
  { source: "CEI Documents", type: "Unstructured", refresh: "As published", data: "Strategic assessments, technology reports" },
  { source: "Expert Input", type: "Manual", refresh: "Continuous", data: "TRL validation, corrections, annotations" },
];

const tierComparison = [
  { feature: "Technology count", public: "~20 sample", premium: "Full dataset", admin: "Full dataset" },
  { feature: "Historical data", public: "Limited", premium: "Complete", admin: "Complete + audit" },
  { feature: "Score details", public: "Composite only", premium: "All dimensions", admin: "All + sources" },
  { feature: "Export", public: "—", premium: "PDF, CSV", admin: "PDF, CSV, API" },
  { feature: "User management", public: "—", premium: "—", admin: "✓" },
  { feature: "Data configuration", public: "—", premium: "—", admin: "✓" },
  { feature: "AI validation", public: "—", premium: "—", admin: "✓" },
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

        {/* Reference Tables */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Supported Formats */}
          <Card>
            <CardHeader className="bg-muted/30 py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Supported Document Formats
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-2 text-left font-medium">Format</th>
                    <th className="p-2 text-left font-medium">Extensions</th>
                    <th className="p-2 text-left font-medium">Typical Use</th>
                  </tr>
                </thead>
                <tbody>
                  {supportedFormats.map((f) => (
                    <tr key={f.format} className="border-t border-border">
                      <td className="p-2 font-medium">{f.format}</td>
                      <td className="p-2 font-mono text-xs">{f.extensions}</td>
                      <td className="p-2 text-muted-foreground">{f.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Data Sources */}
          <Card>
            <CardHeader className="bg-muted/30 py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Data Source Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-2 text-left font-medium">Source</th>
                    <th className="p-2 text-left font-medium">Type</th>
                    <th className="p-2 text-left font-medium">Refresh</th>
                  </tr>
                </thead>
                <tbody>
                  {dataSourceDetails.map((d) => (
                    <tr key={d.source} className="border-t border-border">
                      <td className="p-2 font-medium">{d.source}</td>
                      <td className="p-2">{d.type}</td>
                      <td className="p-2 text-muted-foreground">{d.refresh}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Tier Comparison Table */}
        <Card>
          <CardHeader className="bg-muted/30 py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Feature Comparison by Tier
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Access tiers are managed manually by BluSpecs—no self-service registration or payment integration.
            </p>
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
                {tierComparison.map((row) => (
                  <tr key={row.feature} className="border-t border-border">
                    <td className="p-3 font-medium">{row.feature}</td>
                    <td className="p-3 text-center text-muted-foreground">{row.public}</td>
                    <td className="p-3 text-center text-muted-foreground">{row.premium}</td>
                    <td className="p-3 text-center text-muted-foreground">{row.admin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
