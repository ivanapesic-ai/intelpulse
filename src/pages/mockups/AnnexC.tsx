import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import mermaid from "mermaid";

const diagrams = [
  {
    id: "annex-c-taxonomy",
    title: "Technology Taxonomy Hierarchy",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    ROOT["🌐 ML-SDV Sphere<br/>Mobility, Logistics, SDV"]
    
    ROOT --> C["☁️ Cloud"]
    ROOT --> E["⚡ Edge"]
    ROOT --> I["📡 IoT"]
    ROOT --> A["🤖 AI/ML"]
    
    C --> C1["Cloud Infrastructure"]
    C --> C2["Cloud-Native Platforms"]
    C --> C3["Data & Analytics"]
    
    E --> E1["Edge Computing"]
    E --> E2["Fog Computing"]
    E --> E3["MEC"]
    
    I --> I1["Connectivity"]
    I --> I2["Sensors & Devices"]
    I --> I3["IoT Platforms"]
    
    A --> A1["Machine Learning"]
    A --> A2["Computer Vision"]
    A --> A3["NLP/LLM"]
    A --> A4["Autonomous Systems"]`
  },
  {
    id: "annex-c-erd",
    title: "Entity Relationship Diagram",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
erDiagram
    profiles {
        uuid id PK
        uuid user_id FK
        text display_name
        text organization
        jsonb preferences
        timestamp created_at
    }

    user_roles {
        uuid id PK
        uuid user_id FK
        enum role
    }

    categories {
        uuid id PK
        text name
        uuid parent_id FK
        text sphere
        int sort_order
    }

    technologies {
        uuid id PK
        text name
        uuid category_id FK
        text description
        boolean is_public
        jsonb metadata
        timestamp created_at
    }

    maturity_scores {
        uuid id PK
        uuid technology_id FK
        float trl_score
        float market_score
        float innovation_score
        float eu_alignment
        float composite_score
        enum confidence
        timestamp scored_at
    }

    data_sources {
        uuid id PK
        text name
        enum type
        text api_endpoint
        jsonb config
        timestamp last_sync
    }

    data_imports {
        uuid id PK
        uuid source_id FK
        int records_count
        enum status
        text error_log
        timestamp completed_at
    }

    profiles ||--o{ user_roles : "has"
    categories ||--o{ technologies : "contains"
    categories ||--o{ categories : "parent_of"
    technologies ||--o{ maturity_scores : "has"
    data_sources ||--o{ data_imports : "logs"`
  },
  {
    id: "annex-c-data-flow",
    title: "Data Flow Pipeline",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart LR
    subgraph Ingest["📥 Ingestion"]
        S1["Dealroom API"]
        S2["PATSTAT CSV"]
        S3["CEI PDFs"]
    end
    
    subgraph Transform["🔄 Transform"]
        T1["Parse & Extract"]
        T2["Normalize Schema"]
        T3["Deduplicate"]
        T4["Map Taxonomy"]
    end
    
    subgraph Score["📊 Scoring"]
        SC1["Calculate<br/>Dimensions"]
        SC2["Compute<br/>Composite"]
        SC3["Assign<br/>Confidence"]
    end
    
    subgraph Store["💾 Storage"]
        DB[("PostgreSQL")]
    end
    
    S1 --> T1
    S2 --> T1
    S3 --> T1
    
    T1 --> T2 --> T3 --> T4
    
    T4 --> SC1 --> SC2 --> SC3
    
    SC3 --> DB`
  },
  {
    id: "annex-c-rls",
    title: "Row-Level Security Policies",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    subgraph Request["📨 Incoming Request"]
        R1["JWT Token"]
    end
    
    R1 --> A{Extract Role}
    
    A -->|"No Token"| P1["🌐 Public"]
    A -->|"role: premium"| P2["⭐ Premium"]
    A -->|"role: admin"| P3["🔒 Admin"]
    
    subgraph Policies["🛡️ RLS Policies"]
        P1 --> F1["technologies:<br/>WHERE is_public = true"]
        P2 --> F2["technologies:<br/>WHERE true"]
        P3 --> F3["ALL tables:<br/>Full access"]
    end
    
    subgraph Results["📤 Filtered Data"]
        F1 --> R_PUB["5-10 Sample<br/>Technologies"]
        F2 --> R_PREM["Full Dataset<br/>+ Scores"]
        F3 --> R_ADM["All Data<br/>+ User Management"]
    end`
  }
];

const accessMatrix = [
  { entity: "technologies", public: "Read (is_public)", premium: "Read All", admin: "Full CRUD" },
  { entity: "maturity_scores", public: "—", premium: "Read All", admin: "Full CRUD" },
  { entity: "categories", public: "Read", premium: "Read", admin: "Full CRUD" },
  { entity: "profiles", public: "—", premium: "Own Only", admin: "Read All" },
  { entity: "user_roles", public: "—", premium: "—", admin: "Full CRUD" },
  { entity: "data_sources", public: "—", premium: "—", admin: "Full CRUD" },
  { entity: "data_imports", public: "—", premium: "—", admin: "Read All" },
];

const tableColumns = [
  { table: "technologies", columns: "id, name, category_id, description, is_public, metadata, created_at, updated_at" },
  { table: "maturity_scores", columns: "id, technology_id, trl_score, market_score, innovation_score, eu_alignment, composite_score, confidence, scored_at" },
  { table: "categories", columns: "id, name, parent_id, sphere, sort_order, icon" },
  { table: "profiles", columns: "id, user_id, display_name, organization, preferences, created_at" },
  { table: "user_roles", columns: "id, user_id, role (public|premium|admin)" },
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

export default function AnnexC() {
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
      er: { layoutDirection: "TB", entityPadding: 15 },
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
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Annex C: Data Model</h1>
                <p className="text-sm text-muted-foreground">Database schema, ERD, and access control</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
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

        {/* Access Control Matrix */}
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle>Access Control Matrix</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Entity</th>
                  <th className="text-left p-3 font-medium">🌐 Public</th>
                  <th className="text-left p-3 font-medium">⭐ Premium</th>
                  <th className="text-left p-3 font-medium">🔒 Admin</th>
                </tr>
              </thead>
              <tbody>
                {accessMatrix.map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-3 font-mono text-sm font-medium">{row.entity}</td>
                    <td className="p-3 text-sm">{row.public}</td>
                    <td className="p-3 text-sm">{row.premium}</td>
                    <td className="p-3 text-sm">{row.admin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Table Structure Reference */}
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle>Table Structure Reference</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium w-40">Table</th>
                  <th className="text-left p-3 font-medium">Columns</th>
                </tr>
              </thead>
              <tbody>
                {tableColumns.map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-3 font-mono text-sm font-medium align-top">{row.table}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{row.columns}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border bg-card/50 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          AI-CE Heatmap Platform — Annex C: Data Model
        </div>
      </footer>
    </div>
  );
}
