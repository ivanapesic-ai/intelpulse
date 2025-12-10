import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Layers, Cpu, Database, Workflow, FileText, Zap, Target, Activity, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import mermaid from "mermaid";

const diagrams = [
  {
    id: "system-architecture",
    title: "System Architecture",
    icon: Layers,
    description: `The AI-CE Heatmap Platform follows a modern cloud-native architecture designed for security, scalability, and EU data residency compliance. The system implements a three-tier user model where Public Visitors access limited demo data, Premium Clients receive full platform capabilities with regular data updates, and Administrators manage users, data sources, and platform configuration.

The React frontend communicates exclusively through the Lovable Cloud backend, which enforces Row-Level Security (RLS) policies at the database level. This ensures that users only see data appropriate to their access tier. The AI Intelligence Layer operates as a separate processing pipeline, triggered by Edge Functions to handle document parsing, TRL assessment, and trend analysis.

All data is stored and processed within EU jurisdiction (AWS Frankfurt) ensuring GDPR compliance and meeting public sector data residency requirements.`,
    mermaid: `%%{init: {'theme': 'neutral', 'themeVariables': {'background': '#ffffff'}}}%%
flowchart TD
    subgraph Users["User Tiers"]
        U1["Public Visitor"]
        U2["Premium Client"]
        U3["Admin"]
    end

    subgraph Frontend["React Application"]
        FD["Dashboard"]
        FE["Explorer"]
        FA["Analytics"]
        FM["Admin"]
    end

    subgraph AI["AI Intelligence Layer"]
        AI1["Document Processing"]
        AI2["TRL Assessment"]
        AI3["Trend Analysis"]
    end

    subgraph Backend["Lovable Cloud - EU"]
        B1["Auth"]
        B2["PostgreSQL"]
        B3["RLS"]
        B4["Edge Functions"]
    end

    subgraph Data["External Sources"]
        D1["Dealroom API"]
        D2["PATSTAT"]
        D3["CEI Documents"]
    end

    U1 --> FD
    U2 --> FE
    U3 --> FM
    Frontend --> B1
    B1 --> B3 --> B2
    B4 --> AI --> B2
    B4 --> Data`
  },
  {
    id: "ai-layers",
    title: "4-Layer AI Architecture",
    icon: Cpu,
    description: `The platform employs a sophisticated 4-layer AI architecture inspired by production intelligence systems. This design separates concerns and enables independent scaling of each layer.

**Layer 1 — Data Ingestion** handles API connectors (Dealroom REST API), document parsers (PDF/PPT from CEI internal sources), CSV processors (PATSTAT patent data), and data normalizers that transform heterogeneous inputs into a unified schema.

**Layer 2 — Intelligence Engine** performs entity extraction (identifying technology mentions using NLP), classification (mapping to Cloud-Edge-IoT-AI taxonomy), and TRL detection (assessing readiness levels from contextual signals in documents).

**Layer 3 — Analysis & Synthesis** executes trend detection (momentum and trajectory over time), pattern recognition (cross-technology correlations and clusters), and signal detection (early indicators of emerging technologies before mainstream recognition).

**Layer 4 — Presentation** renders the processed intelligence through the Technology Radar, Heatmap Matrix, and Analytics dashboards, each optimized for different decision-making contexts.`,
    mermaid: `%%{init: {'theme': 'neutral', 'themeVariables': {'background': '#ffffff'}}}%%
flowchart LR
    subgraph L1["1: Ingestion"]
        direction TB
        I1["API"] --> I2["Parser"] --> I3["Normalize"]
    end

    subgraph L2["2: Intelligence"]
        direction TB
        E1["Extract"] --> E2["Classify"] --> E3["TRL"]
    end

    subgraph L3["3: Analysis"]
        direction TB
        A1["Trends"] --> A2["Patterns"] --> A3["Signals"]
    end

    subgraph L4["4: Present"]
        direction TB
        P1["Radar"] --> P2["Heatmap"] --> P3["Analytics"]
    end

    L1 --> L2 --> L3 --> L4`
  },
  {
    id: "document-intelligence",
    title: "AI-Powered Document Intelligence",
    icon: FileText,
    description: `A key differentiator of the platform is its ability to extract structured intelligence from unstructured documents. The CEI internal datasets are provided as PowerPoint presentations and PDF reports rather than structured data—our AI layer transforms these into actionable technology assessments.

**Document Parsing** — The system processes PDF reports, PowerPoint presentations, and other document formats using advanced parsing techniques. Layout analysis preserves document structure, tables, and embedded diagrams.

**Entity Recognition** — Natural Language Processing (NLP) identifies technology mentions, company names, funding amounts, deployment locations, and readiness indicators within document text.

**TRL Auto-Detection** — The AI analyzes contextual signals (language patterns, deployment mentions, pilot references) to automatically suggest Technology Readiness Levels, which can be validated by domain experts.

**Confidence Scoring** — Each extracted data point includes a confidence score based on source reliability, extraction method, and corroboration across multiple sources.`,
    mermaid: `%%{init: {'theme': 'neutral', 'themeVariables': {'background': '#ffffff'}}}%%
flowchart TD
    subgraph Input["Unstructured Sources"]
        PDF["PDF"] ~~~ PPT["PPT"] ~~~ DOC["DOC"]
    end

    subgraph Processing["AI Processing"]
        P1["Layout Analysis"] ~~~ P2["Text Extraction"] ~~~ P3["NLP Engine"]
    end

    subgraph Output["Structured Output"]
        O1["Tech Entities"] ~~~ O2["TRL Scores"] ~~~ O3["Confidence"]
    end

    Input --> Processing --> Output`
  },
  {
    id: "scoring-methodology",
    title: "4-Dimension Scoring Methodology",
    icon: Database,
    description: `Technologies are evaluated across four equally-weighted dimensions, each normalized to a 0-9 scale before computing the composite score. This methodology ensures balanced, multi-perspective assessment.

**TRL Score (25%)** — Technology Readiness Level based on EU Horizon Europe framework, combining expert assessment, AI-detected indicators from documents, and deployment evidence from data sources.

**Market Score (25%)** — Commercial viability calculated from funding activity (30%), company count (25%), production deployments (25%), and growth rate (20%). Primary data source: Dealroom API.

**Innovation Score (25%)** — R&D intensity derived from patent filings (35%), academic publications (25%), open source activity (20%), and EU research project participation (20%). Primary data source: PATSTAT.

**EU Alignment (25%)** — Strategic fit with European priorities based on policy document mentions, Horizon Europe funding allocation, and IPCEI (Important Projects of Common European Interest) inclusion.

The composite score directly determines radar ring placement, providing actionable guidance for technology adoption decisions.`,
    mermaid: `%%{init: {'theme': 'neutral', 'themeVariables': {'background': '#ffffff'}}}%%
flowchart LR
    D["Dimensions<br/>TRL | Market | Innovation | EU<br/>(25% each)"] --> CS["Composite<br/>Score 0-9"]
    CS --> A["ADOPT 7.5-9"]
    CS --> T["TRIAL 5.0-7.4"]
    CS --> AS["ASSESS 3.0-4.9"]
    CS --> H["HOLD 0-2.9"]`
  },
  {
    id: "data-pipeline",
    title: "Data Pipeline & Integration",
    icon: Workflow,
    description: `The data pipeline implements an ETL (Extract-Transform-Load) flow optimized for heterogeneous data sources. This architecture handles structured APIs, semi-structured files, and unstructured documents through a unified processing framework.

**External Sources** — Dealroom API (company and funding data), PATSTAT CSV exports (patent filings), and CEI internal documents (strategic assessments and reports).

**Ingestion** — Handles API authentication, rate limiting, file parsing, and initial validation. Each source has dedicated connectors with error handling and retry logic.

**Normalization** — Transforms source-specific schemas into the platform's unified data model. Entity resolution links technologies across sources.

**AI Enrichment** — Adds derived fields including entity tags, TRL assessments, trend indicators, and confidence scores using the AI Intelligence Layer.

**Scoring Engine** — Computes all four dimension scores and the composite score based on the scoring methodology.

Data refresh is triggered manually via admin interface with full audit logging of each refresh cycle.`,
    mermaid: `%%{init: {'theme': 'neutral', 'themeVariables': {'background': '#ffffff'}}}%%
flowchart LR
    S["External Sources"] --> I["Ingestion"]
    I --> N["Normalize"]
    N --> AI["AI Enrichment"]
    AI --> SC["Scoring Engine"]
    SC --> DB["PostgreSQL"]
    DB --> V["Visualizations"]`
  },
  {
    id: "document-processing-flow",
    title: "Document Processing Capabilities",
    icon: FileText,
    description: `The platform's AI layer transforms unstructured documents into structured technology intelligence. This is critical for processing CEI internal datasets which arrive as PowerPoint presentations and PDF reports rather than structured data.

**Supported Formats** — PDF reports, PowerPoint presentations (PPT/PPTX), Word documents (DOC/DOCX), and plain text files. The system extracts text, preserves document structure, and processes embedded tables.

**Processing Pipeline** — Documents are parsed for layout structure, text is extracted and cleaned, and NLP models identify technology entities, company mentions, funding data, and readiness indicators.

**Quality Assurance** — Each extraction includes confidence scores. Low-confidence extractions are flagged for human review. Domain experts can validate and correct AI assessments through the admin interface.`,
    mermaid: `%%{init: {'theme': 'neutral', 'themeVariables': {'background': '#ffffff'}}}%%
flowchart LR
    subgraph Input["1: Input"]
        direction TB
        PDF["PDF"] --> PPT["PPT"] --> DOC["DOC"]
    end

    subgraph AI["2: Process"]
        direction TB
        Parse["Parse"] --> NLP["NLP"] --> Validate["Score"]
    end

    subgraph Output["3: Output"]
        direction TB
        Tech["Tech"] --> TRL["TRL"] --> Meta["Meta"]
    end

    Input --> AI --> Output`
  },
  {
    id: "data-source-integration",
    title: "Data Source Integration",
    icon: Database,
    description: `The platform integrates multiple heterogeneous data sources to provide comprehensive technology assessment. Each source contributes different dimensions of the overall picture through three key signals.

**Signal 1: Investment (Dealroom API)** — Company profiles, funding rounds, investor networks, and growth metrics. Provides the foundation for Market Score calculation. REST API with structured JSON responses.

**Signal 2: Patents (PATSTAT/EPO)** — European Patent Office data on patent filings (both granted and applied for status), citations, and patent families. Primary source for Innovation Score. Delivered as CSV exports for batch processing.

**Signal 3: Market/Media Response (Tech Coverage)** — Technology coverage from industry publications, analyst reports, and media mentions. Sourced from CEI documents initially, with potential API integration for automated tracking.

**CEI Internal Documents** — Strategic assessments, technology reports, and policy analyses from the Cloud-Edge-IoT sphere. Unstructured documents processed through AI document intelligence layer.

**Manual Data Entry** — Admin interface for adding technologies, correcting AI assessments, and inputting expert evaluations not available in automated sources.`,
    mermaid: `%%{init: {'theme': 'neutral', 'themeVariables': {'background': '#ffffff'}}}%%
flowchart TD
    subgraph Sources["Data Sources"]
        DR["Signal 1: Dealroom"]
        PS["Signal 2: PATSTAT"]
        TC["Signal 3: Tech Coverage"]
        CEI["CEI Documents"]
    end

    subgraph Platform["AI-CE Platform"]
        ING["Ingestion Layer"]
        AI["AI Processing"]
        DB["Unified Database"]
    end

    DR --> ING
    PS --> ING
    TC --> ING
    CEI --> AI
    ING --> AI --> DB`
  },
  {
    id: "challenge-opportunity-matrix",
    title: "Challenge-Opportunity Matrix",
    icon: Target,
    description: `Complementing the 4-dimension scoring, the Challenge-Opportunity Matrix provides a strategic view of market validation for each technology. This framework assesses both the barriers to adoption and the potential value realization.

**Challenges Scale (0-2):**
- **2 (No Major Challenge):** No significant barriers to market entry. Problems are solved or negligible.
- **1 (Manageable Challenge):** Some challenges exist but are understood with clear, actionable steps to overcome.
- **0 (Severe Challenge):** Major obstacles that could impede market success. May require new regulations or substantial investment.

**Opportunities Scale (0-2):**
- **2 (High Opportunity):** Significant value, readily achievable, closely aligned with strategic goals.
- **1 (Promising Opportunity):** Reasonable value achievable with existing resources or moderate effort.
- **0 (Limited Opportunity):** Low potential value, difficult realization, weak strategic fit.

**Maturity Mapping:** The matrix maps to maturity categories: Emerging (early signals), Early Adoption (pilot deployments), and Mainstream (widespread production use).

Data sources include specific reports and CEI Sphere data sources with expert validation.`,
    mermaid: `%%{init: {'theme': 'neutral', 'themeVariables': {'background': '#ffffff'}}}%%
flowchart LR
    subgraph Challenges["Challenges"]
        direction TB
        C2["2: No Major"]
        C1["1: Manageable"]
        C0["0: Severe"]
    end

    subgraph Opportunities["Opportunities"]
        direction TB
        O2["2: High"]
        O1["1: Promising"]
        O0["0: Limited"]
    end

    subgraph Maturity["Maturity"]
        direction TB
        M1["Emerging"]
        M2["Early Adoption"]
        M3["Mainstream"]
    end

    Challenges --> Matrix["C-O Matrix"]
    Opportunities --> Matrix
    Matrix --> Maturity`
  },
  {
    id: "hourglass-model",
    title: "CEI-Sphere Hourglass Model Integration",
    icon: Activity,
    description: `The platform's technology taxonomy aligns with the CEI-Sphere Hourglass Model, a conceptual framework illustrating how different layers of digital capabilities and stakeholder groups interact to create intelligent, interoperable, and scalable digital ecosystems.

**Hourglass Model Layers:**
The model maps technology capabilities across Cloud (centralized computing and storage), Edge (distributed processing closer to data sources), and IoT (sensors, devices, and connectivity). AI capabilities span all layers, enabling intelligence at each level.

**Technology Mapping:**
Our four-quadrant radar (Cloud, Edge, IoT, AI) directly corresponds to the hourglass layers:
- **Cloud:** Platforms, infrastructure, hyperscaler services
- **Edge:** Compute nodes, gateways, local processing (including 5G/6G connectivity)
- **IoT:** Sensors, actuators, device ecosystems
- **AI:** Cross-cutting intelligence layer (ML, LLMs, computer vision)

**Reference:** The full hourglass model is documented at https://ceisphere.eu/hourglass-model

This alignment ensures the AI-CE Heatmap provides technology intelligence that maps directly to CEI-Sphere's strategic framework.`,
    mermaid: `%%{init: {'theme': 'neutral', 'themeVariables': {'background': '#ffffff'}}}%%
flowchart TB
    subgraph Hourglass["CEI-Sphere Hourglass"]
        direction TB
        CL["Cloud Layer"]
        ED["Edge Layer<br/>(incl. 5G/6G)"]
        IOT["IoT Layer"]
    end

    subgraph AILayer["AI Cross-Cutting"]
        AI["AI/ML Intelligence"]
    end

    subgraph Radar["Heatmap Quadrants"]
        Q1["Cloud"]
        Q2["Edge"]
        Q3["IoT"]
        Q4["AI"]
    end

    CL --> Q1
    ED --> Q2
    IOT --> Q3
    AILayer --> Q4
    AI -.-> CL
    AI -.-> ED
    AI -.-> IOT`
  }
];

const techStack = [
  { layer: "Frontend", tech: "React 18 + TypeScript + Vite", purpose: "Modern, type-safe UI with fast development iteration" },
  { layer: "Visualization", tech: "Recharts + Custom SVG", purpose: "Interactive charts and custom radar/heatmap components" },
  { layer: "Backend", tech: "Lovable Cloud (PostgreSQL + RLS)", purpose: "Managed database with row-level security policies" },
  { layer: "AI/ML", tech: "Lovable AI Gateway", purpose: "Document processing, NLP, entity extraction, TRL detection" },
  { layer: "Edge Functions", tech: "Deno Runtime", purpose: "Serverless API endpoints and data processing triggers" },
  { layer: "Hosting", tech: "EU Region (AWS Frankfurt)", purpose: "GDPR compliance and EU data residency" },
];

const trlLevels = [
  { level: "1-3", phase: "Research", desc: "Basic principles → Proof of concept" },
  { level: "4-6", phase: "Development", desc: "Lab validation → Prototype demo" },
  { level: "7-9", phase: "Deployment", desc: "Operational demo → Proven system" },
];

const radarRings = [
  { ring: "Adopt", range: "7.5-9.0", action: "Ready for production deployment" },
  { ring: "Trial", range: "5.0-7.4", action: "Suitable for pilot projects" },
  { ring: "Assess", range: "3.0-4.9", action: "Worth monitoring closely" },
  { ring: "Hold", range: "0.0-2.9", action: "Not ready for adoption" },
];

const aiCapabilities = [
  { capability: "Document Parsing", description: "Extract text, tables, and structure from PDF, PPT, DOCX files" },
  { capability: "Entity Recognition", description: "Identify technologies, companies, locations, and funding mentions" },
  { capability: "TRL Detection", description: "Auto-assess technology readiness from contextual language patterns" },
  { capability: "Trend Analysis", description: "Detect momentum shifts and trajectory changes over time" },
  { capability: "Pattern Recognition", description: "Identify technology clusters and cross-domain correlations" },
  { capability: "Signal Detection", description: "Early warning indicators for emerging technologies" },
];

const earlyIndicators = [
  { signal: "Signal 1", indicator: "Investment", source: "Dealroom", description: "Funding rounds, valuations, investor activity" },
  { signal: "Signal 2", indicator: "Patents", source: "PATSTAT/EPO", description: "Granted and applied for patents, citation networks" },
  { signal: "Signal 3", indicator: "Market/Media Response", source: "Tech Coverage", description: "Industry publications, analyst reports, media mentions" },
];

const marketValidationCriteria = [
  { criteria: "Market Size & Growth", source: "Dealroom, IDC", description: "Enterprise value and growth rate metrics" },
  { criteria: "Customer Adoption", source: "Dealroom, IDC", description: "Adoption rates across industries and geographies" },
  { criteria: "Competitive Landscape", source: "Dealroom", description: "Presence of competitors and substitutes" },
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

export default function AnnexA() {
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
              <h1 className="text-xl font-bold">Annex A: Technical Approach & Methodology</h1>
              <p className="text-sm text-muted-foreground">Architecture, AI capabilities, scoring framework</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Data Model Disclaimer */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <p className="text-sm text-amber-800">
              <strong>⚠️ Note:</strong> The data model, scoring methodology weights, and data source configurations presented here are preliminary assumptions. The final data structure and integration approach will be validated and refined during the Week 1 design sprint based on actual data source access, CEI document samples, and BluSpecs stakeholder feedback.
            </p>
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

        {/* Early Indicators of New Technologies */}
        <Card>
          <CardHeader className="bg-muted/30 py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Early Indicators of New Technologies
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Three key signals are monitored to identify emerging technologies before mainstream recognition.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-3 text-left font-medium w-1/6">Signal</th>
                  <th className="p-3 text-left font-medium w-1/4">Indicator</th>
                  <th className="p-3 text-left font-medium w-1/4">Data Source</th>
                  <th className="p-3 text-left font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {earlyIndicators.map((row) => (
                  <tr key={row.signal} className="border-t border-border">
                    <td className="p-3 font-medium">{row.signal}</td>
                    <td className="p-3">{row.indicator}</td>
                    <td className="p-3">{row.source}</td>
                    <td className="p-3 text-muted-foreground">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Market Validation Criteria */}
        <Card>
          <CardHeader className="bg-muted/30 py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Market Validation Criteria
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              Additional market validation metrics assess the external landscape and broader adoption potential.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-3 text-left font-medium w-1/3">Criteria</th>
                  <th className="p-3 text-left font-medium w-1/4">Data Source</th>
                  <th className="p-3 text-left font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {marketValidationCriteria.map((row) => (
                  <tr key={row.criteria} className="border-t border-border">
                    <td className="p-3 font-medium">{row.criteria}</td>
                    <td className="p-3">{row.source}</td>
                    <td className="p-3 text-muted-foreground">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* AI Capabilities Summary */}
        <Card>
          <CardHeader className="bg-muted/30 py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              AI Capabilities Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              The platform leverages advanced AI capabilities to transform heterogeneous data sources into actionable technology intelligence.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {aiCapabilities.map((cap) => (
                <div key={cap.capability} className="border border-border rounded-lg p-4">
                  <div className="font-medium mb-1">{cap.capability}</div>
                  <div className="text-sm text-muted-foreground">{cap.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hourglass Model Reference */}
        <Card>
          <CardHeader className="bg-muted/30 py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-primary" />
              CEI-Sphere Framework Reference
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              The AI-CE Heatmap aligns with the CEI-Sphere Hourglass Model, ensuring technology intelligence maps directly to the established strategic framework.
            </p>
            <a 
              href="https://ceisphere.eu/hourglass-model" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              View CEI-Sphere Hourglass Model Documentation
            </a>
          </CardContent>
        </Card>

        {/* Tech Stack */}
        <Card>
          <CardHeader className="bg-muted/30 py-4">
            <CardTitle className="text-lg">Technology Stack</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              The platform leverages modern, production-ready technologies optimized for rapid development, scalability, and EU compliance.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-3 text-left font-medium w-1/4">Layer</th>
                  <th className="p-3 text-left font-medium w-1/3">Technology</th>
                  <th className="p-3 text-left font-medium">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {techStack.map((row) => (
                  <tr key={row.layer} className="border-t border-border">
                    <td className="p-3 font-medium">{row.layer}</td>
                    <td className="p-3">{row.tech}</td>
                    <td className="p-3 text-muted-foreground">{row.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* TRL + Radar Reference */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="bg-muted/30 py-4">
              <CardTitle className="text-lg">TRL Scale (EU Horizon Europe)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Technology Readiness Levels follow the EU Horizon Europe framework, providing a standardized measure of technology maturity from basic research through proven deployment.
              </p>
              <div className="space-y-3">
                {trlLevels.map((t) => (
                  <div key={t.phase} className="flex gap-3 text-sm">
                    <span className="font-mono font-bold w-12">{t.level}</span>
                    <span className="font-medium w-24">{t.phase}</span>
                    <span className="text-muted-foreground">{t.desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-muted/30 py-4">
              <CardTitle className="text-lg">Radar Rings & Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Each ring represents an actionable recommendation based on the technology's composite score, guiding strategic decision-making.
              </p>
              <div className="space-y-3">
                {radarRings.map((r) => (
                  <div key={r.ring} className="flex items-center gap-3 text-sm">
                    <span className="font-medium w-16">{r.ring}</span>
                    <span className="font-mono text-muted-foreground w-20">{r.range}</span>
                    <span className="text-muted-foreground">{r.action}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formula */}
        <Card>
          <CardHeader className="bg-muted/30 py-4">
            <CardTitle className="text-lg">Composite Score Formula</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              The composite score provides a balanced assessment by weighting all four dimensions equally. Each dimension is normalized to a 0-9 scale before applying weights, ensuring comparability across different data sources and measurement units.
            </p>
            <div className="bg-muted/50 p-4 rounded-lg font-mono text-center text-sm">
              Score = (TRL × 0.25) + (Market × 0.25) + (Innovation × 0.25) + (EU × 0.25)
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border bg-card/50 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          AI-CE Heatmap Platform — Annex A
        </div>
      </footer>
    </div>
  );
}
