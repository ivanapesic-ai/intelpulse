import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import mermaid from "mermaid";

const diagrams = [
  {
    id: "annex-a-system-overview",
    title: "System Architecture Overview",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    subgraph Users["👥 User Tiers"]
        U1["🌐 Public Visitor"]
        U2["⭐ Premium Client"]
        U3["🔒 BluSpecs Admin"]
    end

    subgraph Frontend["React + TypeScript Frontend"]
        F1["Public Demo View"]
        F2["Premium Dashboard"]
        F3["Admin Panel"]
        F4["Technology Radar"]
        F5["Heatmap Matrix"]
    end

    subgraph Backend["Lovable Cloud - EU Hosted"]
        B1["🔐 Authentication"]
        B2["🗄️ PostgreSQL"]
        B3["🛡️ Row-Level Security"]
        B4["⚡ Edge Functions"]
        B5["📁 File Storage"]
    end

    subgraph DataSources["📊 External Data Sources"]
        D1["Dealroom API"]
        D2["PATSTAT/EPO"]
        D3["CEI Documents"]
        D4["Public Sources"]
    end

    U1 --> F1
    U2 --> F2
    U2 --> F4
    U2 --> F5
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
    id: "annex-a-frontend-hierarchy",
    title: "Frontend Component Hierarchy",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    App["App.tsx"]
    
    App --> Routes["Routes"]
    Routes --> Index["/ Index"]
    Routes --> Mockups["📁 /mockups/*"]
    
    Mockups --> Radar["/radar<br/>TechnologyRadar"]
    Mockups --> Heatmap["/heatmap<br/>HeatmapMatrix"]
    Mockups --> Admin["/admin<br/>AdminPanel"]
    Mockups --> Public["/public<br/>PublicDemo"]
    
    Radar --> RC1["RadarChart"]
    Radar --> RC2["FilterPanel"]
    Radar --> RC3["TechDetailModal"]
    
    Heatmap --> HC1["MatrixGrid"]
    Heatmap --> HC2["ScoreCell"]
    Heatmap --> HC3["ExportButton"]
    
    Admin --> AC1["UserTable"]
    Admin --> AC2["RefreshTrigger"]
    Admin --> AC3["ActivityLog"]`
  },
  {
    id: "annex-a-security-flow",
    title: "Security & Authentication Flow",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth Service
    participant R as RLS Engine
    participant D as Database

    U->>F: Login Request
    F->>A: signInWithPassword()
    A->>D: Verify Credentials
    D-->>A: User Record + Role
    A-->>F: JWT Token + Session
    
    Note over F: Store session locally
    
    U->>F: Request Technologies
    F->>D: Query with JWT Header
    D->>R: Check RLS Policies
    
    alt Public User
        R-->>D: Filter: is_public = true
    else Premium User
        R-->>D: Filter: All technologies
    else Admin User
        R-->>D: Full access + user data
    end
    
    D-->>F: Filtered Results
    F-->>U: Display Data`
  },
  {
    id: "annex-a-data-refresh",
    title: "Data Refresh Pipeline",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    A["🔄 Admin Triggers Refresh"] --> B["Edge Function: data-refresh"]
    
    B --> C{Parallel Fetch}
    
    C --> D["📊 Dealroom API<br/>Funding & Companies"]
    C --> E["📄 PATSTAT CSV<br/>Patent Data"]
    C --> F["🤖 AI Parser<br/>CEI Documents"]
    C --> G["🌐 Public Sources<br/>News & Reports"]
    
    D --> H["🔀 Normalize Schema"]
    E --> H
    F --> H
    G --> H
    
    H --> I["🧹 Deduplicate"]
    I --> J["🏷️ Map to Taxonomy"]
    
    J --> K["📈 Scoring Engine"]
    
    K --> L["Calculate TRL"]
    K --> M["Compute Market"]
    K --> N["Assess Innovation"]
    K --> O["Evaluate EU Alignment"]
    
    L --> P["🎯 Composite Score"]
    M --> P
    N --> P
    O --> P
    
    P --> Q[("💾 Database Update")]
    Q --> R["✅ Visualizations Refreshed"]`
  },
  {
    id: "annex-a-ai-processing",
    title: "AI Document Processing",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart LR
    A["📎 Upload PPT/PDF"] --> B["📁 File Storage"]
    
    B --> C["Edge Function:<br/>parse-document"]
    
    C --> D["🤖 Lovable AI Gateway"]
    
    D --> E{Document Type}
    
    E -->|PPT| F["Extract Slides"]
    E -->|PDF| G["Extract Pages"]
    
    F --> H["📝 Text Extraction"]
    G --> H
    
    H --> I["🔍 Entity Recognition"]
    
    I --> J["Technology<br/>Mentions"]
    I --> K["TRL<br/>Indicators"]
    I --> L["Policy<br/>References"]
    
    J --> M["Map to Taxonomy"]
    K --> M
    L --> M
    
    M --> N{Confidence<br/>Check}
    
    N -->|">70%"| O["✅ Auto-categorize"]
    N -->|"<70%"| P["⚠️ Flag for Review"]
    
    O --> Q[("💾 Save to Database")]
    P --> Q`
  },
  {
    id: "annex-a-infrastructure",
    title: "Infrastructure & Deployment",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    subgraph CDN["🌍 Global CDN"]
        CF["Cloudflare Edge"]
    end
    
    subgraph EU["🇪🇺 EU Region - AWS"]
        subgraph Frontend["Frontend Hosting"]
            FH["Static Assets<br/>React SPA"]
        end
        
        subgraph Backend["Lovable Cloud"]
            LB["Load Balancer"]
            API["API Gateway"]
            EF["Edge Functions<br/>Deno Runtime"]
            PG[("PostgreSQL<br/>Primary")]
            PGR[("PostgreSQL<br/>Replica")]
            S3["Object Storage<br/>Documents"]
        end
    end
    
    CF --> FH
    FH --> LB
    LB --> API
    API --> EF
    EF --> PG
    PG --> PGR
    EF --> S3`
  }
];

const techStack = [
  { layer: "Frontend", tech: "React 18 + TypeScript", notes: "Vite build, TailwindCSS, shadcn/ui" },
  { layer: "State", tech: "TanStack Query", notes: "Server state, caching, optimistic updates" },
  { layer: "Visualization", tech: "Recharts + Custom SVG", notes: "Radar, heatmap, interactive charts" },
  { layer: "Backend", tech: "Lovable Cloud", notes: "PostgreSQL, Edge Functions, Auth" },
  { layer: "AI", tech: "Lovable AI Gateway", notes: "Document parsing, TRL detection" },
  { layer: "Hosting", tech: "EU Region (AWS)", notes: "ISO 27001 compliant infrastructure" },
];

const apiEndpoints = [
  { method: "POST", path: "/auth/signup", access: "Public", description: "User registration" },
  { method: "POST", path: "/auth/login", access: "Public", description: "User authentication" },
  { method: "GET", path: "/rest/v1/technologies", access: "Authenticated", description: "Fetch technologies (RLS filtered)" },
  { method: "GET", path: "/rest/v1/maturity_scores", access: "Premium", description: "Fetch scoring data" },
  { method: "POST", path: "/functions/v1/data-refresh", access: "Admin", description: "Trigger data refresh" },
  { method: "POST", path: "/functions/v1/export-pdf", access: "Premium", description: "Generate PDF report" },
  { method: "POST", path: "/functions/v1/parse-document", access: "Admin", description: "AI document processing" },
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

export default function AnnexA() {
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
        clusterBkg: "#f8fafc",
        clusterBorder: "#e2e8f0",
      },
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
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Annex A: Technical Architecture</h1>
                <p className="text-sm text-muted-foreground">System design, security, and infrastructure diagrams</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Technology Stack Table */}
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle>Technology Stack</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Layer</th>
                  <th className="text-left p-3 font-medium">Technology</th>
                  <th className="text-left p-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {techStack.map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-3 font-medium">{row.layer}</td>
                    <td className="p-3 font-mono text-sm">{row.tech}</td>
                    <td className="p-3 text-muted-foreground text-sm">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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

        {/* API Reference Table */}
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle>API Reference</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Method</th>
                  <th className="text-left p-3 font-medium">Endpoint</th>
                  <th className="text-left p-3 font-medium">Access</th>
                  <th className="text-left p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {apiEndpoints.map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        row.method === "GET" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {row.method}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-sm">{row.path}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        row.access === "Admin" ? "bg-red-100 text-red-700" :
                        row.access === "Premium" ? "bg-purple-100 text-purple-700" :
                        row.access === "Authenticated" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {row.access}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground text-sm">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border bg-card/50 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          AI-CE Heatmap Platform — Annex A: Technical Architecture
        </div>
      </footer>
    </div>
  );
}
