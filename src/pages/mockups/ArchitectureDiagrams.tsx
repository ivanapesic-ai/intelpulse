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
    description: "High-level architecture showing users, frontend, backend, and external data sources",
    mermaid: `graph TB
    subgraph Users["👥 Users"]
        A[Public Visitors]
        B[Premium Subscribers]
        C[Admin - BluSpecs]
    end
    
    subgraph Frontend["🖥️ Frontend - React + TypeScript"]
        D[Public Demo View]
        E[Premium Dashboard]
        F[Admin Panel]
    end
    
    subgraph Backend["☁️ Lovable Cloud - EU Hosted"]
        G[Authentication]
        H[PostgreSQL Database]
        I[Row-Level Security]
        J[Edge Functions]
        K[File Storage]
    end
    
    subgraph External["📊 External Data Sources"]
        L[Dealroom API]
        M[PATSTAT/EPO]
        N[CEI Documents]
        O[Public Sources]
    end
    
    A --> D
    B --> E
    C --> F
    
    D --> G
    E --> G
    F --> G
    
    G --> H
    G --> I
    
    J --> L
    J --> M
    J --> N
    J --> O
    
    J --> H
    K --> H`
  },
  {
    id: "security-architecture",
    title: "Security Architecture",
    description: "Role-based access control with Row-Level Security policies",
    mermaid: `graph TB
    subgraph Auth["🔐 Authentication Layer"]
        A[Email/Password Login]
        B[Session Management]
        C[JWT Tokens]
    end
    
    subgraph Roles["👤 Role-Based Access"]
        D[Public - No Auth]
        E[Premium - Authenticated]
        F[Admin - Elevated]
    end
    
    subgraph RLS["🛡️ Row-Level Security"]
        G[Public Data Policy]
        H[Premium Data Policy]
        I[Admin Full Access]
    end
    
    subgraph Data["📊 Data Access"]
        J[Sample Technologies]
        K[Full Technology Set]
        L[User Management]
        M[Analytics]
    end
    
    A --> B
    B --> C
    
    C --> D
    C --> E
    C --> F
    
    D --> G
    E --> H
    F --> I
    
    G --> J
    H --> K
    I --> L
    I --> M`
  },
  {
    id: "data-refresh-flow",
    title: "Data Refresh Flow",
    description: "How data is collected, normalized, scored, and stored",
    mermaid: `flowchart TD
    A[🔄 Admin Triggers Refresh] --> B[Edge Function: data-refresh]
    
    B --> C{Parallel Fetch}
    
    C --> D[📊 Dealroom API]
    C --> E[📄 PATSTAT CSV]
    C --> F[🤖 AI Doc Parsing]
    C --> G[🌐 Public Sources]
    
    D --> H[Normalize Data]
    E --> H
    F --> H
    G --> H
    
    H --> I[🧮 Scoring Engine]
    
    I --> J[Calculate TRL]
    I --> K[Compute Market Score]
    I --> L[Assess Innovation]
    I --> M[Evaluate EU Alignment]
    
    J --> N[Composite Score]
    K --> N
    L --> N
    M --> N
    
    N --> O[(Database Update)]
    
    O --> P[✅ Visualizations Updated]`
  },
  {
    id: "scoring-calculation",
    title: "Scoring Calculation Flow",
    description: "Detailed breakdown of how composite scores are calculated from multiple data sources",
    mermaid: `flowchart TD
    subgraph Inputs["📥 Data Inputs"]
        A[Dealroom Data]
        B[PATSTAT Patents]
        C[CEI Assessments]
        D[Public Sources]
    end
    
    subgraph Dimension1["TRL Score - 25%"]
        E[Expert Assessment]
        F[AI TRL Detection]
        G[Deployment Evidence]
    end
    
    subgraph Dimension2["Market Score - 25%"]
        H[Funding Activity × 0.30]
        I[Company Count × 0.25]
        J[Deployments × 0.25]
        K[Growth Rate × 0.20]
    end
    
    subgraph Dimension3["Innovation Score - 25%"]
        L[Patents × 0.35]
        M[Publications × 0.25]
        N[Open Source × 0.20]
        O[EU Projects × 0.20]
    end
    
    subgraph Dimension4["EU Alignment - 25%"]
        P[Policy Mentions]
        Q[Horizon Funding]
        R[IPCEI Inclusion]
    end
    
    A --> H
    A --> I
    B --> L
    C --> E
    C --> P
    D --> M
    D --> N
    
    E --> S[TRL: 0-9]
    F --> S
    G --> S
    
    H --> T[Market: 0-9]
    I --> T
    J --> T
    K --> T
    
    L --> U[Innovation: 0-9]
    M --> U
    N --> U
    O --> U
    
    P --> V[EU: 0-9]
    Q --> V
    R --> V
    
    S --> W[🎯 Composite Score]
    T --> W
    U --> W
    V --> W
    
    W --> X{Radar Placement}
    
    X -->|7.5-9.0| Y[Adopt Ring]
    X -->|5.0-7.4| Z[Trial Ring]
    X -->|3.0-4.9| AA[Assess Ring]
    X -->|0.0-2.9| AB[Hold Ring]`
  },
  {
    id: "auth-flow",
    title: "User Authentication Flow",
    description: "Sequence diagram showing the authentication and data access process",
    mermaid: `sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth Service
    participant D as Database
    
    U->>F: Enter credentials
    F->>A: signInWithPassword()
    A->>D: Verify credentials
    D-->>A: User record
    A-->>F: Session + JWT
    F->>D: Fetch profile (with RLS)
    D-->>F: User data (role-filtered)
    F-->>U: Redirect to dashboard
    
    Note over F,D: All subsequent requests include JWT
    
    U->>F: Request technologies
    F->>D: Query with auth header
    D->>D: Apply RLS policies
    D-->>F: Filtered results
    F-->>U: Display data`
  },
  {
    id: "ai-doc-processing",
    title: "AI Document Processing",
    description: "How unstructured documents are parsed and categorized using AI",
    mermaid: `flowchart LR
    A[📎 Upload PPT/PDF] --> B[File Storage]
    
    B --> C[Edge Function: parse-document]
    
    C --> D[Lovable AI Gateway]
    
    D --> E{Document Type}
    
    E -->|PPT| F[Extract Slides]
    E -->|PDF| G[Extract Pages]
    
    F --> H[Text Extraction]
    G --> H
    
    H --> I[Entity Recognition]
    
    I --> J[Technology Mentions]
    I --> K[TRL Indicators]
    I --> L[Policy References]
    
    J --> M[Map to Taxonomy]
    K --> M
    L --> M
    
    M --> N{Confidence Check}
    
    N -->|>70%| O[Auto-categorize]
    N -->|<70%| P[Flag for Review]
    
    O --> Q[(Save to Database)]
    P --> Q`
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
      themeVariables: {
        // White/light background
        background: "#ffffff",
        mainBkg: "#f8fafc",
        secondBkg: "#f1f5f9",
        
        // Professional blue nodes
        primaryColor: "#3b82f6",
        primaryTextColor: "#1e293b",
        primaryBorderColor: "#2563eb",
        
        // Dark text for readability
        textColor: "#1e293b",
        nodeTextColor: "#1e293b",
        titleColor: "#0f172a",
        
        // Subtle lines
        lineColor: "#64748b",
        nodeBorder: "#3b82f6",
        clusterBkg: "#f1f5f9",
        clusterBorder: "#cbd5e1",
        edgeLabelBackground: "#ffffff",
        
        // Sequence diagram colors
        actorBkg: "#3b82f6",
        actorTextColor: "#ffffff",
        actorLineColor: "#64748b",
        signalColor: "#1e293b",
        signalTextColor: "#1e293b",
        noteBkgColor: "#fef3c7",
        noteTextColor: "#1e293b",
        noteBorderColor: "#f59e0b",
      },
      flowchart: {
        htmlLabels: true,
        curve: "basis",
      },
      sequence: {
        actorMargin: 50,
        mirrorActors: false,
      },
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <Link to="/mockups">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Mockups
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-gradient mb-2">
            System Architecture Diagrams
          </h1>
          <p className="text-muted-foreground text-lg">
            Technical architecture and data flow diagrams for the AI-CE Heatmap Platform.
            Suitable for screenshotting or presenting to stakeholders.
          </p>
        </header>

        {/* Diagrams Grid */}
        <div className="space-y-8">
          {diagrams.map((diagram) => (
            <Card key={diagram.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-xl">{diagram.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{diagram.description}</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-white rounded-lg p-6 overflow-x-auto min-h-[300px] border border-gray-200 max-w-[600px] mx-auto">
                  <MermaidDiagram id={diagram.id} chart={diagram.mermaid} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-muted-foreground text-sm">
          <p>BluSpecs AI-CE Heatmap Platform • Technical Architecture • December 2025</p>
        </footer>
      </div>
    </div>
  );
}
