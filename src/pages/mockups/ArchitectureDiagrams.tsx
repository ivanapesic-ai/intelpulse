import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import mermaid from "mermaid";

const diagrams = [
  {
    id: "system-overview",
    title: "System Overview",
    description: "Annex A: End-to-end platform architecture",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    subgraph Users["User Tiers"]
        U1["Public Visitor"]
        U2["Premium Client"]
        U3["BluSpecs Admin"]
    end

    subgraph Frontend["React + TypeScript Frontend"]
        F1["Public Demo View"]
        F2["Premium Dashboard"]
        F3["Admin Panel"]
    end

    subgraph Backend["Lovable Cloud - EU Hosted"]
        B1["Authentication Service"]
        B2["PostgreSQL Database"]
        B3["Row-Level Security"]
        B4["Edge Functions"]
        B5["File Storage"]
    end

    subgraph DataSources["External Data Sources"]
        D1["Dealroom API"]
        D2["PATSTAT/EPO"]
        D3["CEI Documents"]
        D4["Public Sources"]
    end

    U1 --> F1
    U2 --> F2
    U3 --> F3

    F1 --> B1
    F2 --> B1
    F3 --> B1

    B1 --> B3
    B3 --> B2

    B4 --> D1
    B4 --> D2
    B4 --> D3
    B4 --> D4
    B4 --> B2
    B5 --> B2`
  },
  {
    id: "security-architecture",
    title: "Security Architecture",
    description: "Annex A: Authentication flow with role-based RLS policies",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    A1["User Request"] --> A2["Auth Service"]
    A2 --> A3["JWT Token Issued"]
    A3 --> R1{"Role Check"}

    R1 -->|"No token"| P1["Public Policy"]
    R1 -->|"role: premium"| P2["Premium Policy"]
    R1 -->|"role: admin"| P3["Admin Policy"]

    P1 --> D1["Sample Data Only"]
    P2 --> D2["Full Dataset + Export"]
    P3 --> D3["All Data + User Management"]

    subgraph RLS["Row-Level Security Policies"]
        P1
        P2
        P3
    end

    subgraph Access["Filtered Data Access"]
        D1
        D2
        D3
    end`
  },
  {
    id: "api-layer",
    title: "API Layer",
    description: "Annex A: Supabase client endpoints and database interaction",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    subgraph Client["Frontend Supabase Client"]
        C1["React Query Hooks"]
    end

    subgraph API["API Endpoints"]
        E1["/auth/signup"]
        E2["/auth/login"]
        E3["/rest/v1/technologies"]
        E4["/rest/v1/scores"]
        E5["/rest/v1/profiles"]
        E6["/functions/v1/data-refresh"]
        E7["/functions/v1/export-pdf"]
    end

    subgraph DB["PostgreSQL + RLS"]
        T1[("technologies")]
        T2[("maturity_scores")]
        T3[("profiles")]
        T4[("data_imports")]
    end

    C1 --> E1
    C1 --> E2
    C1 --> E3
    C1 --> E4
    C1 --> E5
    C1 --> E6
    C1 --> E7

    E3 --> T1
    E4 --> T2
    E5 --> T3
    E6 --> T1
    E6 --> T2
    E6 --> T4
    E7 --> T1
    E7 --> T2`
  },
  {
    id: "scoring-engine",
    title: "Scoring Calculation Engine",
    description: "Annex B: 4-dimension weighted composite score with radar placement",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    subgraph Inputs["Data Inputs"]
        S1["Dealroom"]
        S2["PATSTAT"]
        S3["CEI Docs"]
        S4["Public"]
    end

    subgraph TRL["TRL Score - 25%"]
        T1["Expert Assessment"]
        T2["AI TRL Detection"]
        T_OUT["TRL: 0-9"]
    end

    subgraph Market["Market Score - 25%"]
        M1["Funding 0.30"]
        M2["Companies 0.25"]
        M3["Deployments 0.25"]
        M4["Growth 0.20"]
        M_OUT["Market: 0-9"]
    end

    subgraph Innovation["Innovation Score - 25%"]
        I1["Patents 0.35"]
        I2["Publications 0.25"]
        I3["Open Source 0.20"]
        I4["EU Projects 0.20"]
        I_OUT["Innovation: 0-9"]
    end

    subgraph EU["EU Alignment - 25%"]
        E1["Policy Mentions"]
        E2["Horizon Funding"]
        E3["IPCEI Inclusion"]
        E_OUT["EU: 0-9"]
    end

    S1 --> M1
    S2 --> I1
    S3 --> T1
    S3 --> E1
    S4 --> I2

    T1 --> T_OUT
    T2 --> T_OUT
    M1 --> M_OUT
    M2 --> M_OUT
    M3 --> M_OUT
    M4 --> M_OUT
    I1 --> I_OUT
    I2 --> I_OUT
    I3 --> I_OUT
    I4 --> I_OUT
    E1 --> E_OUT
    E2 --> E_OUT
    E3 --> E_OUT

    T_OUT --> C1["Composite Score"]
    M_OUT --> C1
    I_OUT --> C1
    E_OUT --> C1

    C1 --> R1{"Radar Placement"}
    R1 -->|"7.5-9.0"| Adopt
    R1 -->|"5.0-7.4"| Trial
    R1 -->|"3.0-4.9"| Assess
    R1 -->|"0.0-2.9"| Hold`
  },
  {
    id: "entity-relationship",
    title: "Entity Relationship Diagram",
    description: "Annex C: Database schema with table relationships",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
erDiagram
    profiles {
        uuid id PK
        uuid user_id FK
        text display_name
        text organization
        timestamp created_at
    }

    user_roles {
        uuid id PK
        uuid user_id FK
        app_role role
    }

    technologies {
        uuid id PK
        text name
        uuid category_id FK
        text description
        boolean is_public
        timestamp created_at
        timestamp updated_at
    }

    categories {
        uuid id PK
        text name
        uuid parent_id FK
        text sphere
    }

    maturity_scores {
        uuid id PK
        uuid technology_id FK
        float trl_score
        float market_score
        float innovation_score
        float eu_alignment
        float composite_score
        text confidence
        timestamp scored_at
    }

    data_sources {
        uuid id PK
        text name
        text type
        text api_endpoint
        timestamp last_sync
    }

    data_imports {
        uuid id PK
        uuid source_id FK
        int records_processed
        text status
        timestamp started_at
        timestamp completed_at
    }

    profiles ||--o{ user_roles : "has"
    categories ||--o{ technologies : "contains"
    categories ||--o{ categories : "parent"
    technologies ||--o{ maturity_scores : "has"
    data_sources ||--o{ data_imports : "logs"`
  },
  {
    id: "data-ingestion",
    title: "Data Ingestion Pipeline",
    description: "Annex C: Manual refresh with parallel fetch and scoring",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    T1["Admin: Refresh Data"] --> T2["Edge Function: data-refresh"]

    T2 --> P1["Dealroom API"]
    T2 --> P2["PATSTAT CSV"]
    T2 --> P3["AI Document Parsing"]
    T2 --> P4["Public Sources"]

    P1 --> N1["Normalize Schema"]
    P2 --> N1
    P3 --> N1
    P4 --> N1

    N1 --> N2["Deduplicate"]
    N2 --> N3["Map to Taxonomy"]

    N3 --> SC["Scoring Engine"]

    SC --> SC1["Calculate TRL"]
    SC --> SC2["Compute Market"]
    SC --> SC3["Assess Innovation"]
    SC --> SC4["Evaluate EU Alignment"]

    SC1 --> CS["Composite Score"]
    SC2 --> CS
    SC3 --> CS
    SC4 --> CS

    CS --> DB[("Database Update")]
    DB --> V["Visualizations Refreshed"]`
  }
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

export default function ArchitectureDiagrams() {
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      securityLevel: "loose",
      themeVariables: {
        background: "#ffffff",
        mainBkg: "#f8fafc",
        secondBkg: "#f1f5f9",
        primaryColor: "#3b82f6",
        primaryTextColor: "#1e293b",
        primaryBorderColor: "#2563eb",
        textColor: "#1e293b",
        nodeTextColor: "#1e293b",
        titleColor: "#0f172a",
        lineColor: "#64748b",
        nodeBorder: "#3b82f6",
        clusterBkg: "#f8fafc",
        clusterBorder: "#e2e8f0",
        edgeLabelBackground: "#ffffff",
      },
      flowchart: {
        htmlLabels: true,
        curve: "basis",
        nodeSpacing: 50,
        rankSpacing: 60,
        padding: 20,
      },
      er: {
        layoutDirection: "TB",
        entityPadding: 15,
        useMaxWidth: true,
      },
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/mockups">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Mockups
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">Architecture Diagrams</h1>
                <p className="text-sm text-muted-foreground">Technical diagrams for proposal annexes</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          {diagrams.map((diagram) => (
            <Card key={diagram.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-lg">{diagram.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{diagram.description}</p>
              </CardHeader>
              <CardContent className="p-6 bg-white">
                <div className="max-w-[600px] mx-auto">
                  <MermaidDiagram id={diagram.id} chart={diagram.mermaid} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <footer className="border-t border-border bg-card/50 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          AI-CE Heatmap Platform — Technical Architecture Diagrams
        </div>
      </footer>
    </div>
  );
}
