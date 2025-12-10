import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Cpu, Database, Shield, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import mermaid from "mermaid";

const diagrams = [
  {
    id: "annex-a-system-overview",
    title: "System Architecture Overview",
    icon: Layers,
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    subgraph Users["👥 User Tiers"]
        U1["🌐 Public Visitor"]
        U2["⭐ Premium Client"]
        U3["🔒 BluSpecs Admin"]
    end

    subgraph Frontend["🖥️ React Application"]
        FD["Dashboard"]
        FE["Explorer"]
        FA["Analytics"]
        FM["Admin Console"]
    end

    subgraph AILayer["🧠 AI Intelligence Layer"]
        AI1["Document Processing"]
        AI2["Entity Extraction"]
        AI3["TRL Assessment"]
        AI4["Trend Analysis"]
    end

    subgraph Backend["☁️ Lovable Cloud - EU Hosted"]
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

    U1 --> FD
    U2 --> FE
    U2 --> FA
    U3 --> FM

    FD --> B1
    FE --> B1
    FA --> B1
    FM --> B1

    B1 --> B3
    B3 --> B2

    B4 --> AILayer
    AILayer --> B2

    B4 --> D1
    B4 --> D2
    B4 --> D3
    B4 --> D4
    B5 --> B2`
  },
  {
    id: "annex-a-ai-architecture",
    title: "4-Layer AI Intelligence Architecture",
    icon: Cpu,
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#8b5cf6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TB
    subgraph L1["Layer 1: Data Ingestion"]
        I1["📥 API Connectors<br/>Dealroom, PATSTAT"]
        I2["📄 Document Parsers<br/>PDF, PPT, CSV"]
        I3["🌐 Web Scrapers<br/>News, Reports"]
        I4["📊 Schema Normalizers"]
    end

    subgraph L2["Layer 2: Intelligence Engine"]
        E1["🔍 Named Entity Recognition<br/>Technology Extraction"]
        E2["🏷️ Classification Engine<br/>Taxonomy Mapping"]
        E3["📈 TRL Assessment<br/>Maturity Detection"]
        E4["🎯 Confidence Scoring"]
    end

    subgraph L3["Layer 3: Analysis & Synthesis"]
        A1["📊 Trend Detection<br/>Velocity Tracking"]
        A2["🔗 Pattern Recognition<br/>Cross-domain Clustering"]
        A3["💡 Insight Generation<br/>Gap Analysis"]
        A4["🚀 Signal Detection<br/>Emerging Tech"]
    end

    subgraph L4["Layer 4: Presentation & Access"]
        P1["🎯 Technology Radar<br/>Interactive Visualization"]
        P2["📋 Heatmap Matrix<br/>Comparative Analysis"]
        P3["📊 Analytics Dashboard<br/>Trends & Reports"]
        P4["🔌 REST API<br/>External Access"]
    end

    I1 --> I4
    I2 --> I4
    I3 --> I4
    I4 --> E1

    E1 --> E2
    E2 --> E3
    E3 --> E4
    E4 --> A1

    A1 --> A2
    A2 --> A3
    A3 --> A4
    A4 --> P1
    A4 --> P2
    A4 --> P3
    A4 --> P4`
  },
  {
    id: "annex-a-intelligence-engine",
    title: "Intelligence Engine - Processing Pipeline",
    icon: Cpu,
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#10b981', 'primaryTextColor': '#1e293b'}}}%%
flowchart LR
    subgraph Input["📥 Input Processing"]
        R["Raw Data"]
        R --> T1["Text Extraction"]
        R --> T2["Metadata Parsing"]
    end

    subgraph NER["🔍 Entity Recognition"]
        T1 --> N1["Technology Names"]
        T1 --> N2["Company Mentions"]
        T1 --> N3["Standards & Protocols"]
        T2 --> N4["Date & Version Info"]
    end

    subgraph Classification["🏷️ Classification"]
        N1 --> C1["Domain Mapping<br/>Cloud|Edge|IoT|AI"]
        N2 --> C2["Actor Classification<br/>Startup|Enterprise|Research"]
        N3 --> C3["Standard Mapping<br/>ISO|IEEE|W3C"]
    end

    subgraph Assessment["📈 TRL Assessment"]
        C1 --> TRL["TRL Indicator<br/>Detection"]
        C2 --> TRL
        C3 --> TRL
        N4 --> TRL
        TRL --> Score["Maturity Score<br/>1-9"]
    end

    subgraph Output["📤 Output"]
        Score --> DB[("💾 Database")]
        Score --> API["🔌 API Response"]
    end`
  },
  {
    id: "annex-a-scoring-engine",
    title: "Scoring Engine Architecture",
    icon: Database,
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#f59e0b', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    subgraph Sources["📊 Data Sources"]
        S1["Dealroom<br/>Funding Data"]
        S2["PATSTAT<br/>Patent Data"]
        S3["CEI Docs<br/>Policy Data"]
        S4["News<br/>Market Signals"]
    end

    subgraph Extractors["🔬 Dimension Extractors"]
        S1 --> D1["💰 Market Dimension<br/>Funding, Revenue, Growth"]
        S2 --> D2["💡 Innovation Dimension<br/>Patents, R&D, Publications"]
        S3 --> D3["🇪🇺 EU Alignment<br/>Policy Fit, Funding Eligibility"]
        S4 --> D4["📈 TRL Dimension<br/>Maturity Indicators"]
    end

    subgraph Scorers["📊 Score Calculators"]
        D1 --> SC1["Market Score<br/>0-100"]
        D2 --> SC2["Innovation Score<br/>0-100"]
        D3 --> SC3["EU Score<br/>0-100"]
        D4 --> SC4["TRL Score<br/>1-9"]
    end

    subgraph Confidence["🎯 Confidence Engine"]
        SC1 --> CE["Data Quality<br/>Assessment"]
        SC2 --> CE
        SC3 --> CE
        SC4 --> CE
        CE --> CL["Confidence Level<br/>High|Medium|Low"]
    end

    subgraph Composite["🏆 Composite Score"]
        SC1 --> CS["Weighted<br/>Aggregation"]
        SC2 --> CS
        SC3 --> CS
        SC4 --> CS
        CL --> CS
        CS --> RP["Radar Placement<br/>Ring + Quadrant"]
        CS --> HP["Heatmap Position<br/>Row + Color"]
    end`
  },
  {
    id: "annex-a-frontend-architecture",
    title: "Application Module Structure",
    icon: Layers,
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    subgraph App["🏠 Application Shell"]
        Root["App Root"]
        Auth["AuthProvider"]
        Data["DataProvider"]
        Theme["ThemeProvider"]
    end

    subgraph Modules["📦 Core Modules"]
        Dashboard["📊 Dashboard<br/>/dashboard"]
        Explorer["🔭 Explorer<br/>/explorer"]
        Analytics["📈 Analytics<br/>/analytics"]
        Admin["⚙️ Admin<br/>/admin"]
    end

    subgraph DashboardFeatures["Dashboard Features"]
        DH1["Overview Cards"]
        DH2["Recent Activity"]
        DH3["Quick Filters"]
        DH4["Key Metrics"]
    end

    subgraph ExplorerFeatures["Explorer Features"]
        EX1["Technology Radar<br/>/explorer/radar"]
        EX2["Heatmap Matrix<br/>/explorer/matrix"]
        EX3["Technology Detail<br/>/explorer/tech/:id"]
        EX4["Compare View<br/>/explorer/compare"]
    end

    subgraph AnalyticsFeatures["Analytics Features"]
        AN1["Trend Analysis"]
        AN2["Sector Reports"]
        AN3["Export Center"]
        AN4["Custom Views"]
    end

    subgraph AdminFeatures["Admin Features"]
        AD1["User Management"]
        AD2["Data Refresh"]
        AD3["Activity Logs"]
        AD4["System Config"]
    end

    Root --> Auth
    Auth --> Data
    Data --> Theme
    Theme --> Modules

    Dashboard --> DashboardFeatures
    Explorer --> ExplorerFeatures
    Analytics --> AnalyticsFeatures
    Admin --> AdminFeatures`
  },
  {
    id: "annex-a-data-pipeline",
    title: "End-to-End Data Pipeline",
    icon: Database,
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#06b6d4', 'primaryTextColor': '#1e293b'}}}%%
flowchart LR
    subgraph Sources["🌐 External Sources"]
        S1["Dealroom API"]
        S2["PATSTAT Export"]
        S3["CEI Documents"]
        S4["Public APIs"]
    end

    subgraph Ingestion["📥 Ingestion Layer"]
        S1 --> I1["REST Connector"]
        S2 --> I2["CSV Parser"]
        S3 --> I3["Document Parser"]
        S4 --> I4["Web Fetcher"]
    end

    subgraph Transform["🔄 Transform Layer"]
        I1 --> N["Schema<br/>Normalizer"]
        I2 --> N
        I3 --> N
        I4 --> N
        N --> D["Deduplication<br/>Engine"]
        D --> T["Taxonomy<br/>Mapper"]
    end

    subgraph Enrich["✨ Enrichment Layer"]
        T --> AI["AI Intelligence<br/>Layer"]
        AI --> E1["Entity Extraction"]
        AI --> E2["TRL Detection"]
        AI --> E3["Classification"]
    end

    subgraph Score["📊 Scoring Layer"]
        E1 --> SC["Scoring Engine"]
        E2 --> SC
        E3 --> SC
        SC --> CS["Composite Score"]
    end

    subgraph Store["💾 Storage Layer"]
        CS --> DB[("PostgreSQL")]
        DB --> C["Query Cache"]
        C --> V["Visualization<br/>Layer"]
    end`
  },
  {
    id: "annex-a-security-flow",
    title: "Security & Authentication Flow",
    icon: Shield,
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#ef4444', 'primaryTextColor': '#1e293b'}}}%%
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
    
    alt Public Tier
        R-->>D: Filter: sample_data = true
    else Premium Tier
        R-->>D: Filter: All technologies in sphere
    else Admin Tier
        R-->>D: Full access + management
    end
    
    D-->>F: Filtered Results
    F-->>U: Display Data`
  },
  {
    id: "annex-a-ai-document-processing",
    title: "AI Document Processing - Enhanced",
    icon: Cpu,
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#8b5cf6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    subgraph Upload["📎 Document Upload"]
        U1["PDF Documents"]
        U2["PowerPoint Slides"]
        U3["CSV Data Files"]
        U4["HTML/Web Pages"]
    end

    subgraph Storage["📁 File Storage"]
        U1 --> FS["Secure Storage<br/>EU Region"]
        U2 --> FS
        U3 --> FS
        U4 --> FS
    end

    subgraph Processing["⚡ Edge Function Processing"]
        FS --> EF["parse-document<br/>Edge Function"]
        EF --> AI["🤖 Lovable AI Gateway"]
    end

    subgraph Extraction["🔍 Content Extraction"]
        AI --> E1["📝 Text Extraction<br/>OCR if needed"]
        AI --> E2["📊 Table Extraction<br/>Structured Data"]
        AI --> E3["🖼️ Image Analysis<br/>Diagrams, Charts"]
    end

    subgraph NER["🏷️ Named Entity Recognition"]
        E1 --> N1["Technology Mentions"]
        E1 --> N2["Company Names"]
        E1 --> N3["TRL Indicators"]
        E1 --> N4["Policy References"]
        E2 --> N5["Metrics & KPIs"]
    end

    subgraph Confidence["🎯 Confidence Assessment"]
        N1 --> CA{Confidence<br/>Score}
        N2 --> CA
        N3 --> CA
        N4 --> CA
        N5 --> CA
    end

    subgraph Output["📤 Output Routing"]
        CA -->|">80%"| AUTO["✅ Auto-Categorize"]
        CA -->|"50-80%"| REVIEW["⚠️ Human Review"]
        CA -->|"<50%"| REJECT["❌ Flag for Manual"]
    end

    subgraph Feedback["🔄 Feedback Loop"]
        REVIEW --> FB["Admin Corrections"]
        REJECT --> FB
        FB --> ML["Model Improvement<br/>Fine-tuning"]
        ML -.-> AI
    end

    AUTO --> DB[("💾 Database")]
    REVIEW --> DB`
  },
  {
    id: "annex-a-infrastructure",
    title: "Infrastructure & Deployment",
    icon: Shield,
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    subgraph CDN["🌍 Global CDN"]
        CF["Cloudflare Edge<br/>Static Asset Caching"]
    end
    
    subgraph EU["🇪🇺 EU Region - AWS Frankfurt/Ireland"]
        subgraph Frontend["Frontend Hosting"]
            FH["React SPA<br/>Vite Build"]
        end
        
        subgraph Backend["Lovable Cloud Infrastructure"]
            LB["Load Balancer<br/>Auto-scaling"]
            API["API Gateway<br/>Rate Limiting"]
            EF["Edge Functions<br/>Deno Runtime"]
            PG[("PostgreSQL<br/>Primary - Encrypted")]
            PGR[("PostgreSQL<br/>Read Replica")]
            S3["Object Storage<br/>Document Files"]
            AIE["AI Gateway<br/>Lovable AI"]
        end
    end

    subgraph Monitoring["📊 Observability"]
        LOG["Logging"]
        MET["Metrics"]
        ALT["Alerting"]
    end
    
    CF --> FH
    FH --> LB
    LB --> API
    API --> EF
    EF --> PG
    EF --> AIE
    PG --> PGR
    EF --> S3
    EF --> LOG
    API --> MET
    MET --> ALT`
  }
];

const techStack = [
  { layer: "Frontend", tech: "React 18 + TypeScript", notes: "Vite build, TailwindCSS, shadcn/ui components" },
  { layer: "State Management", tech: "TanStack Query", notes: "Server state, caching, optimistic updates, real-time sync" },
  { layer: "Visualization", tech: "Recharts + Custom SVG", notes: "Interactive radar, heatmap matrix, trend charts" },
  { layer: "Backend", tech: "Lovable Cloud (PostgreSQL)", notes: "Managed database, Row-Level Security, automatic backups" },
  { layer: "Edge Functions", tech: "Deno Runtime", notes: "Data refresh, document parsing, PDF export, scoring engine" },
  { layer: "AI/ML", tech: "Lovable AI Gateway", notes: "NER, TRL detection, classification, document understanding" },
  { layer: "Authentication", tech: "Supabase Auth", notes: "JWT tokens, role-based access, session management" },
  { layer: "File Storage", tech: "Object Storage", notes: "Document uploads, PDF exports, EU-hosted" },
  { layer: "Hosting", tech: "EU Region (AWS)", notes: "Frankfurt/Ireland, ISO 27001 infrastructure, GDPR compliant" },
];

const apiEndpoints = [
  { method: "POST", path: "/auth/signup", access: "Public", description: "User registration with email verification" },
  { method: "POST", path: "/auth/login", access: "Public", description: "User authentication, returns JWT" },
  { method: "GET", path: "/rest/v1/technologies", access: "Authenticated", description: "Fetch technologies (RLS filtered by tier)" },
  { method: "GET", path: "/rest/v1/maturity_scores", access: "Premium", description: "Fetch detailed scoring data with dimensions" },
  { method: "GET", path: "/rest/v1/trend_data", access: "Premium", description: "Historical trend data for analytics" },
  { method: "POST", path: "/functions/v1/data-refresh", access: "Admin", description: "Trigger external data source refresh" },
  { method: "POST", path: "/functions/v1/parse-document", access: "Admin", description: "AI-powered document processing" },
  { method: "POST", path: "/functions/v1/export-pdf", access: "Premium", description: "Generate PDF report with current filters" },
  { method: "POST", path: "/functions/v1/calculate-scores", access: "Admin", description: "Recalculate composite scores for all technologies" },
];

const aiCapabilities = [
  { capability: "Named Entity Recognition", description: "Extract technology names, companies, standards from unstructured text", model: "gemini-2.5-flash" },
  { capability: "TRL Detection", description: "Identify Technology Readiness Level indicators from document context", model: "gemini-2.5-flash" },
  { capability: "Document Classification", description: "Categorize documents by type, domain, and relevance", model: "gemini-2.5-flash" },
  { capability: "Taxonomy Mapping", description: "Map extracted entities to Cloud/Edge/IoT/AI taxonomy", model: "gemini-2.5-flash" },
  { capability: "Trend Analysis", description: "Detect emerging patterns and technology velocity", model: "gemini-2.5-pro" },
  { capability: "Confidence Scoring", description: "Assess extraction quality and flag low-confidence results", model: "gemini-2.5-flash" },
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
                <p className="text-sm text-muted-foreground">AI-CE Heatmap Platform — System design, AI layers, and infrastructure</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Technology Stack Table */}
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Technology Stack
            </CardTitle>
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

        {/* AI Capabilities Table */}
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              AI Capabilities — Lovable AI Gateway
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Capability</th>
                  <th className="text-left p-3 font-medium">Description</th>
                  <th className="text-left p-3 font-medium">Model</th>
                </tr>
              </thead>
              <tbody>
                {aiCapabilities.map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-3 font-medium">{row.capability}</td>
                    <td className="p-3 text-muted-foreground text-sm">{row.description}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded text-xs font-mono bg-purple-100 text-purple-700">
                        {row.model}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Diagrams */}
        {diagrams.map((diagram) => {
          const Icon = diagram.icon;
          return (
            <Card key={diagram.id}>
              <CardHeader className="bg-muted/30">
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {diagram.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-white">
                <MermaidDiagram id={diagram.id} chart={diagram.mermaid} />
              </CardContent>
            </Card>
          );
        })}

        {/* API Reference Table */}
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              API Reference
            </CardTitle>
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

        {/* Performance Targets */}
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Performance & Reliability Targets
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-3xl font-bold text-primary">99.9%</div>
                <div className="text-sm text-muted-foreground mt-1">Uptime SLA</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-3xl font-bold text-primary">&lt;200ms</div>
                <div className="text-sm text-muted-foreground mt-1">API Response Time (p95)</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-3xl font-bold text-primary">&lt;3s</div>
                <div className="text-sm text-muted-foreground mt-1">Initial Page Load</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-3xl font-bold text-primary">1000+</div>
                <div className="text-sm text-muted-foreground mt-1">Concurrent Users</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-3xl font-bold text-primary">Daily</div>
                <div className="text-sm text-muted-foreground mt-1">Automated Backups</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-3xl font-bold text-primary">EU</div>
                <div className="text-sm text-muted-foreground mt-1">Data Residency</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border bg-card/50 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          AI-CE Heatmap Platform — Annex A: Technical Architecture — House Eleven Oy
        </div>
      </footer>
    </div>
  );
}
