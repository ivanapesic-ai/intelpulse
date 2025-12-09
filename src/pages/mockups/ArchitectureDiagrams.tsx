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
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    A[Public Visitors] --> D[Public Demo View]
    B[Premium Subscribers] --> E[Premium Dashboard]
    C[Admin - BluSpecs] --> F[Admin Panel]
    
    D --> G[Authentication]
    E --> G
    F --> G
    
    G --> H[(PostgreSQL Database)]
    G --> I[Row-Level Security]
    
    J[Edge Functions] --> K[Dealroom API]
    J --> L[PATSTAT/EPO]
    J --> M[CEI Documents]
    J --> N[Public Sources]
    
    J --> H
    O[File Storage] --> H`
  },
  {
    id: "security-architecture",
    title: "Security Architecture",
    description: "Role-based access control with Row-Level Security policies",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    A[Email/Password Login] --> B[Session Management]
    B --> C[JWT Tokens]
    
    C --> D[Public - No Auth]
    C --> E[Premium - Authenticated]
    C --> F[Admin - Elevated]
    
    D --> G[Public Data Policy]
    E --> H[Premium Data Policy]
    F --> I[Admin Full Access]
    
    G --> J[Sample Technologies]
    H --> K[Full Technology Set]
    I --> L[User Management]
    I --> M[Analytics]`
  },
  {
    id: "data-refresh-flow",
    title: "Data Refresh Flow",
    description: "How data is collected, normalized, scored, and stored",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    A[Admin Triggers Refresh] --> B[Edge Function]
    
    B --> C[Dealroom API]
    B --> D[PATSTAT CSV]
    B --> E[AI Doc Parsing]
    B --> F[Public Sources]
    
    C --> G[Normalize Data]
    D --> G
    E --> G
    F --> G
    
    G --> H[Scoring Engine]
    
    H --> I[Calculate TRL]
    H --> J[Compute Market]
    H --> K[Assess Innovation]
    H --> L[EU Alignment]
    
    I --> M[Composite Score]
    J --> M
    K --> M
    L --> M
    
    M --> N[(Database Update)]
    N --> O[Visualizations Updated]`
  },
  {
    id: "scoring-calculation",
    title: "Scoring Calculation Flow",
    description: "Detailed breakdown of how composite scores are calculated from multiple data sources",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    subgraph Inputs["Data Inputs"]
        A[Dealroom]
        B[PATSTAT]
        C[CEI Docs]
        D[Public]
    end
    
    Inputs --> TRL
    
    subgraph TRL["TRL Score 25%"]
        E[Expert Assessment]
        F[AI Detection]
        G[Deployment Evidence]
    end
    
    TRL --> Market
    
    subgraph Market["Market Score 25%"]
        H[Funding x0.30]
        I[Companies x0.25]
        J[Deployments x0.25]
        K[Growth x0.20]
    end
    
    Market --> Innovation
    
    subgraph Innovation["Innovation Score 25%"]
        L[Patents x0.35]
        M[Publications x0.25]
        N[Open Source x0.20]
        O[EU Projects x0.20]
    end
    
    Innovation --> EU
    
    subgraph EU["EU Alignment 25%"]
        P[Policy Mentions]
        Q[Horizon Funding]
        R[IPCEI Inclusion]
    end
    
    EU --> W[Composite Score]
    
    W --> X{Radar Placement}
    
    X -->|7.5-9.0| Y[Adopt]
    X -->|5.0-7.4| Z[Trial]
    X -->|3.0-4.9| AA[Assess]
    X -->|0.0-2.9| AB[Hold]`
  },
  {
    id: "auth-flow",
    title: "User Authentication Flow",
    description: "Step-by-step authentication and data access process",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    A[User] --> B[Enter Credentials]
    B --> C[Frontend]
    C --> D[signInWithPassword]
    D --> E[Auth Service]
    E --> F[Verify Credentials]
    F --> G[(Database)]
    G --> H[User Record]
    H --> I[Session + JWT]
    I --> J[Fetch Profile with RLS]
    J --> K[Role-Filtered Data]
    K --> L[Redirect to Dashboard]
    
    L --> M[Request Technologies]
    M --> N[Query with Auth Header]
    N --> O[Apply RLS Policies]
    O --> P[Filtered Results]
    P --> Q[Display Data]`
  },
  {
    id: "ai-doc-processing",
    title: "AI Document Processing",
    description: "How unstructured documents are parsed and categorized using AI",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    A[Upload PPT/PDF] --> B[File Storage]
    B --> C[Edge Function]
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
    
    N -->|Above 70%| O[Auto-categorize]
    N -->|Below 70%| P[Flag for Review]
    
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
