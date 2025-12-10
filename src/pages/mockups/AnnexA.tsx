import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Layers, Cpu, Database, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import mermaid from "mermaid";

const diagrams = [
  {
    id: "system-architecture",
    title: "System Architecture",
    icon: Layers,
    description: `The AI-CE Heatmap Platform follows a modern cloud-native architecture designed for security, scalability, and EU data residency compliance. The system implements a three-tier user model where Public Visitors access limited demo data, Premium Clients receive full platform capabilities with regular data updates, and Administrators manage users, data sources, and platform configuration.

The React frontend communicates exclusively through the Lovable Cloud backend, which enforces Row-Level Security (RLS) policies at the database level. This ensures that users only see data appropriate to their access tier. The AI Intelligence Layer operates as a separate processing pipeline, triggered by Edge Functions to handle document parsing, TRL assessment, and trend analysis.`,
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6'}}}%%
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

**Layer 1 — Data Ingestion** handles API connectors (Dealroom), document parsers (PDF/PPT from CEI internal sources), and data normalizers that transform heterogeneous inputs into a unified schema.

**Layer 2 — Intelligence Engine** performs entity extraction (identifying technology mentions), classification (mapping to taxonomy), and TRL detection (assessing readiness levels from contextual signals).

**Layer 3 — Analysis & Synthesis** executes trend detection (momentum and trajectory), pattern recognition (cross-technology correlations), and signal detection (early indicators of emerging technologies).

**Layer 4 — Presentation** renders the processed intelligence through the Technology Radar, Heatmap Matrix, and Analytics dashboards, each optimized for different decision-making contexts.`,
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#8b5cf6'}}}%%
flowchart TB
    subgraph L1["Layer 1: Data Ingestion"]
        I1["API Connectors"]
        I2["Document Parsers"]
        I3["Normalizers"]
    end

    subgraph L2["Layer 2: Intelligence"]
        E1["Entity Extraction"]
        E2["Classification"]
        E3["TRL Detection"]
    end

    subgraph L3["Layer 3: Analysis"]
        A1["Trend Detection"]
        A2["Pattern Recognition"]
        A3["Signal Detection"]
    end

    subgraph L4["Layer 4: Presentation"]
        P1["Technology Radar"]
        P2["Heatmap Matrix"]
        P3["Analytics"]
    end

    L1 --> L2 --> L3 --> L4`
  },
  {
    id: "scoring-methodology",
    title: "4-Dimension Scoring & Radar Placement",
    icon: Database,
    description: `Technologies are evaluated across four equally-weighted dimensions, each normalized to a 0-9 scale before computing the composite score.

**TRL Score (25%)** — Technology Readiness Level based on EU Horizon framework, combining expert assessment, AI-detected indicators, and deployment evidence.

**Market Score (25%)** — Commercial viability calculated from funding activity (30%), company count (25%), production deployments (25%), and growth rate (20%).

**Innovation Score (25%)** — R&D intensity derived from patent filings (35%), academic publications (25%), open source activity (20%), and EU research project participation (20%).

**EU Alignment (25%)** — Strategic fit with European priorities based on policy document mentions, Horizon Europe funding, and IPCEI inclusion.

The composite score directly determines radar ring placement, providing actionable guidance: Adopt (deploy now), Trial (pilot projects), Assess (monitor closely), or Hold (wait for maturity).`,
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#f59e0b'}}}%%
flowchart TD
    subgraph Dimensions["Scoring Dimensions (25% each)"]
        D1["TRL Score"]
        D2["Market Score"]
        D3["Innovation Score"]
        D4["EU Alignment"]
    end

    Dimensions --> CS["Composite Score 0-9"]

    CS --> R{Radar Placement}
    R -->|"7.5-9.0"| A["ADOPT - Deploy"]
    R -->|"5.0-7.4"| T["TRIAL - Pilot"]
    R -->|"3.0-4.9"| AS["ASSESS - Monitor"]
    R -->|"0.0-2.9"| H["HOLD - Wait"]`
  },
  {
    id: "data-pipeline",
    title: "Data Pipeline",
    icon: Workflow,
    description: `The data pipeline implements an ETL (Extract-Transform-Load) flow optimized for heterogeneous data sources. External sources include structured APIs (Dealroom), semi-structured files (PATSTAT CSV), and unstructured documents (CEI PowerPoints and PDFs).

The Ingestion stage handles authentication, rate limiting, and initial validation. Normalization transforms source-specific schemas into the platform's unified data model. AI Enrichment adds derived fields including entity tags, TRL assessments, and confidence scores. The Scoring Engine computes all four dimension scores and the composite score. Finally, results are persisted to PostgreSQL and propagated to visualization layers.

Data refresh is triggered manually via admin interface, with full audit logging of each refresh cycle.`,
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#06b6d4'}}}%%
flowchart LR
    S["External Sources"] --> I["Ingestion"]
    I --> N["Normalize"]
    N --> AI["AI Enrichment"]
    AI --> SC["Scoring Engine"]
    SC --> DB["PostgreSQL"]
    DB --> V["Visualizations"]`
  }
];

const techStack = [
  { layer: "Frontend", tech: "React 18 + TypeScript + Vite" },
  { layer: "Visualization", tech: "Recharts + Custom SVG" },
  { layer: "Backend", tech: "Lovable Cloud (PostgreSQL + RLS)" },
  { layer: "AI/ML", tech: "Lovable AI Gateway" },
  { layer: "Hosting", tech: "EU Region (AWS Frankfurt)" },
];

const trlLevels = [
  { level: "1-3", phase: "Research", desc: "Basic principles → Proof of concept" },
  { level: "4-6", phase: "Development", desc: "Lab validation → Prototype demo" },
  { level: "7-9", phase: "Deployment", desc: "Operational demo → Proven system" },
];

const radarRings = [
  { ring: "Adopt", range: "7.5-9.0", color: "bg-green-500", action: "Ready for production deployment" },
  { ring: "Trial", range: "5.0-7.4", color: "bg-blue-500", action: "Suitable for pilot projects" },
  { ring: "Assess", range: "3.0-4.9", color: "bg-yellow-500", action: "Worth monitoring closely" },
  { ring: "Hold", range: "0.0-2.9", color: "bg-red-500", action: "Not ready for adoption" },
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
      theme: "base",
      securityLevel: "loose",
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
              <p className="text-sm text-muted-foreground">Architecture, AI layers, scoring framework</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
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

        {/* Tech Stack */}
        <Card>
          <CardHeader className="bg-muted/30 py-4">
            <CardTitle className="text-lg">Technology Stack</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              The platform leverages modern, production-ready technologies optimized for rapid development and EU compliance.
            </p>
            <table className="w-full text-sm">
              <tbody>
                {techStack.map((row) => (
                  <tr key={row.layer} className="border-t border-border">
                    <td className="p-3 font-medium w-1/3">{row.layer}</td>
                    <td className="p-3">{row.tech}</td>
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
              <CardTitle className="text-lg">TRL Scale (EU Horizon)</CardTitle>
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
              <CardTitle className="text-lg">Radar Rings</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Each ring represents an actionable recommendation based on the technology's composite score, guiding strategic decision-making.
              </p>
              <div className="space-y-3">
                {radarRings.map((r) => (
                  <div key={r.ring} className="flex items-center gap-3 text-sm">
                    <div className={`w-3 h-3 rounded-full ${r.color}`} />
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
