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
    description: "End-to-end platform architecture showing user tiers, frontend modules, backend services, and external integrations",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b', 'clusterBkg': '#f8fafc', 'clusterBorder': '#e2e8f0'}}}%%
flowchart TD
    subgraph UserTiers["User Access Tiers"]
        direction TB
        U1["Public Visitor<br/><small>No authentication</small>"]
        U2["Premium Client<br/><small>Contract-based access</small>"]
        U3["BluSpecs Admin<br/><small>Full system control</small>"]
    end

    subgraph Frontend["React + TypeScript Frontend"]
        direction TB
        F1["Public Demo<br/><small>Sample data • Limited filters</small>"]
        F2["Premium Dashboard<br/><small>Full dataset • Export • History</small>"]
        F3["Admin Panel<br/><small>User mgmt • Data refresh • Analytics</small>"]
    end

    subgraph Visualization["Visualization Layer"]
        direction TB
        V1["Technology Radar<br/><small>Quadrant view • Ring placement</small>"]
        V2["Heatmap Matrix<br/><small>Category × Maturity grid</small>"]
        V3["Trend Analysis<br/><small>Time-series • Comparisons</small>"]
    end

    subgraph Backend["Lovable Cloud - EU Hosted"]
        direction TB
        B1["Auth Service<br/><small>JWT • Session mgmt</small>"]
        B2["PostgreSQL<br/><small>Core data storage</small>"]
        B3["Row-Level Security<br/><small>Role-based filtering</small>"]
        B4["Edge Functions<br/><small>Serverless compute</small>"]
        B5["File Storage<br/><small>Documents • Exports</small>"]
    end

    subgraph DataSources["External Data Sources"]
        direction TB
        D1["Dealroom API<br/><small>Startup • Funding • Growth</small>"]
        D2["PATSTAT/EPO<br/><small>Patents • Innovation</small>"]
        D3["CEI Documents<br/><small>Policy • Assessments</small>"]
        D4["Public Sources<br/><small>GitHub • arXiv • Horizon</small>"]
    end

    U1 --> F1
    U2 --> F2
    U3 --> F3

    F1 --> V1
    F1 --> V2
    F2 --> V1
    F2 --> V2
    F2 --> V3
    
    V1 --> B1
    V2 --> B1
    V3 --> B1

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
    id: "scoring-engine",
    title: "Multi-Dimensional Scoring Engine",
    description: "Composite maturity score calculation from 4 weighted dimensions with source attribution",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b', 'clusterBkg': '#f8fafc'}}}%%
flowchart TD
    subgraph Sources["Raw Data Sources"]
        S1[("Dealroom")]
        S2[("PATSTAT")]
        S3[("CEI Docs")]
        S4[("Public")]
    end

    subgraph TRL["TRL Score • Weight: 25%"]
        T1["Expert Assessment<br/><small>Manual TRL rating 1-9</small>"]
        T2["AI TRL Detection<br/><small>NLP from documents</small>"]
        T3["Deployment Evidence<br/><small>Production usage signals</small>"]
        T_OUT["TRL: 0-9"]
    end

    subgraph Market["Market Score • Weight: 25%"]
        M1["Funding Activity<br/><small>Weight: 0.30</small>"]
        M2["Company Count<br/><small>Weight: 0.25</small>"]
        M3["Live Deployments<br/><small>Weight: 0.25</small>"]
        M4["Growth Rate<br/><small>Weight: 0.20</small>"]
        M_OUT["Market: 0-9"]
    end

    subgraph Innovation["Innovation Score • Weight: 25%"]
        I1["Patent Filings<br/><small>Weight: 0.35</small>"]
        I2["Publications<br/><small>Weight: 0.25</small>"]
        I3["Open Source Activity<br/><small>Weight: 0.20</small>"]
        I4["EU Project Mentions<br/><small>Weight: 0.20</small>"]
        I_OUT["Innovation: 0-9"]
    end

    subgraph EUAlign["EU Alignment • Weight: 25%"]
        E1["Policy Document Mentions<br/><small>IPCEI, Green Deal, etc.</small>"]
        E2["Horizon Europe Funding<br/><small>Active project participation</small>"]
        E3["Strategic Priority Fit<br/><small>CEI sphere alignment</small>"]
        E_OUT["EU Align: 0-9"]
    end

    subgraph Composite["Composite Calculation"]
        C1["Weighted Average<br/><small>TRL×0.25 + Market×0.25 +<br/>Innovation×0.25 + EU×0.25</small>"]
        C2["Confidence Level<br/><small>Based on data coverage</small>"]
        C3["Final Score: 0-9"]
    end

    subgraph Placement["Radar Ring Placement"]
        P1["7.5-9.0 → Adopt"]
        P2["5.0-7.4 → Trial"]
        P3["3.0-4.9 → Assess"]
        P4["0.0-2.9 → Hold"]
    end

    S1 --> M1
    S1 --> M2
    S1 --> M4
    S2 --> I1
    S3 --> T1
    S3 --> E1
    S4 --> I2
    S4 --> I3

    T1 --> T_OUT
    T2 --> T_OUT
    T3 --> T_OUT

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

    T_OUT --> C1
    M_OUT --> C1
    I_OUT --> C1
    E_OUT --> C1

    C1 --> C2
    C2 --> C3

    C3 --> P1
    C3 --> P2
    C3 --> P3
    C3 --> P4`
  },
  {
    id: "auth-rls-flow",
    title: "Authentication & Row-Level Security",
    description: "JWT-based authentication with database-level access control policies",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    subgraph AuthFlow["Authentication Flow"]
        A1["User submits credentials"]
        A2["Auth Service validates"]
        A3["JWT token issued<br/><small>Contains: user_id, role, exp</small>"]
        A4["Token stored in session"]
    end

    subgraph RoleCheck["Role Determination"]
        R1{"Check role claim"}
        R2["role: null<br/><small>Public access</small>"]
        R3["role: premium<br/><small>Authenticated client</small>"]
        R4["role: admin<br/><small>BluSpecs staff</small>"]
    end

    subgraph RLSPolicies["RLS Policies Applied"]
        P1["technologies_public_read<br/><small>WHERE is_public = true</small>"]
        P2["technologies_premium_read<br/><small>WHERE auth.role() = 'premium'<br/>OR is_public = true</small>"]
        P3["technologies_admin_all<br/><small>Full CRUD access</small>"]
    end

    subgraph DataAccess["Filtered Data Response"]
        D1["10 sample technologies<br/><small>Limited filters</small>"]
        D2["Full technology set<br/><small>All filters • Export</small>"]
        D3["All data + user mgmt<br/><small>Audit logs • Analytics</small>"]
    end

    A1 --> A2
    A2 --> A3
    A3 --> A4
    A4 --> R1

    R1 -->|"No token"| R2
    R1 -->|"Valid token"| R3
    R1 -->|"Admin claim"| R4

    R2 --> P1
    R3 --> P2
    R4 --> P3

    P1 --> D1
    P2 --> D2
    P3 --> D3`
  },
  {
    id: "ai-document-pipeline",
    title: "AI Document Processing Pipeline",
    description: "Unstructured document ingestion with AI-powered entity extraction and taxonomy mapping",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    subgraph Upload["Document Upload"]
        U1["Admin uploads CEI document<br/><small>PowerPoint • PDF • Word</small>"]
        U2["File stored in bucket<br/><small>documents/{uuid}</small>"]
    end

    subgraph EdgeFn["Edge Function: parse-document"]
        E1["Trigger on upload event"]
        E2["Fetch document bytes"]
        E3["Detect MIME type"]
    end

    subgraph AIGateway["Lovable AI Gateway"]
        AI1["Document Parsing<br/><small>Extract raw text per page/slide</small>"]
        AI2["Entity Recognition<br/><small>NER for tech terms</small>"]
        AI3["TRL Classification<br/><small>Identify maturity signals</small>"]
        AI4["Policy Extraction<br/><small>EU references, standards</small>"]
    end

    subgraph Taxonomy["Taxonomy Mapping"]
        TX1{"Match to ML-SDV categories"}
        TX2["Cloud • Edge • IoT • AI"]
        TX3["Sub-categories assigned<br/><small>e.g., AI → Vision → Object Detection</small>"]
    end

    subgraph QA["Quality Assurance"]
        Q1{"Confidence >= 70%?"}
        Q2["Auto-approve<br/><small>Insert to technologies</small>"]
        Q3["Flag for review<br/><small>Pending admin approval</small>"]
    end

    subgraph Output["Database Updates"]
        O1[("technologies table<br/><small>New entries with source_id</small>")]
        O2[("scores table<br/><small>Initial AI-derived scores</small>")]
        O3[("data_imports log<br/><small>Audit trail</small>")]
    end

    U1 --> U2
    U2 --> E1
    E1 --> E2
    E2 --> E3
    E3 --> AI1
    
    AI1 --> AI2
    AI2 --> AI3
    AI3 --> AI4

    AI2 --> TX1
    AI3 --> TX1
    AI4 --> TX1

    TX1 --> TX2
    TX2 --> TX3

    TX3 --> Q1
    Q1 -->|"Yes"| Q2
    Q1 -->|"No"| Q3

    Q2 --> O1
    Q2 --> O2
    Q3 --> O1
    
    O1 --> O3
    O2 --> O3`
  },
  {
    id: "data-refresh-orchestration",
    title: "Data Refresh Orchestration",
    description: "Manual-triggered data refresh with parallel source fetching and conflict resolution",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    subgraph Trigger["Admin Trigger"]
        T1["Admin clicks 'Refresh Data'"]
        T2["Edge Function: data-refresh"]
        T3["Lock refresh_status = 'running'"]
    end

    subgraph Parallel["Parallel Data Fetch"]
        P1["Dealroom API<br/><small>GET /companies?sector=mobility</small>"]
        P2["PATSTAT CSV<br/><small>Import from storage bucket</small>"]
        P3["Public Sources<br/><small>GitHub API • arXiv search</small>"]
        P4["AI Document Scan<br/><small>Re-process flagged docs</small>"]
    end

    subgraph Transform["Data Transformation"]
        TR1["Schema normalization<br/><small>Map to internal taxonomy</small>"]
        TR2["Deduplication<br/><small>Match by name + category</small>"]
        TR3["Conflict resolution<br/><small>Newest source wins</small>"]
    end

    subgraph Scoring["Re-Score All Technologies"]
        SC1["Recalculate TRL scores"]
        SC2["Update market metrics"]
        SC3["Refresh innovation indices"]
        SC4["EU alignment check"]
        SC5["Generate composite scores"]
    end

    subgraph Persist["Database Persistence"]
        DB1["Upsert technologies"]
        DB2["Insert score history"]
        DB3["Update refresh_log<br/><small>timestamp • records affected</small>"]
        DB4["Set refresh_status = 'complete'"]
    end

    subgraph Notify["Post-Refresh"]
        N1["Invalidate cache"]
        N2["Realtime broadcast<br/><small>Notify connected dashboards</small>"]
        N3["Admin confirmation email"]
    end

    T1 --> T2
    T2 --> T3
    T3 --> P1
    T3 --> P2
    T3 --> P3
    T3 --> P4

    P1 --> TR1
    P2 --> TR1
    P3 --> TR1
    P4 --> TR1

    TR1 --> TR2
    TR2 --> TR3
    TR3 --> SC1

    SC1 --> SC2
    SC2 --> SC3
    SC3 --> SC4
    SC4 --> SC5

    SC5 --> DB1
    DB1 --> DB2
    DB2 --> DB3
    DB3 --> DB4

    DB4 --> N1
    N1 --> N2
    N2 --> N3`
  },
  {
    id: "technology-taxonomy",
    title: "ML-SDV Technology Taxonomy",
    description: "Hierarchical classification structure for the Mobility-Logistics-SDV technology sphere",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b', 'clusterBkg': '#f0f9ff'}}}%%
flowchart TD
    ROOT["ML-SDV Sphere<br/><small>Mobility • Logistics • SDV</small>"]

    subgraph Cloud["Cloud & Infrastructure"]
        C1["Vehicle Cloud Platforms"]
        C2["Fleet Management SaaS"]
        C3["OTA Update Infrastructure"]
        C4["Digital Twin Backends"]
    end

    subgraph Edge["Edge Computing"]
        E1["In-Vehicle Compute<br/><small>ECUs • Domain Controllers</small>"]
        E2["Roadside Units"]
        E3["MEC for V2X"]
        E4["Edge AI Accelerators"]
    end

    subgraph IoT["IoT & Connectivity"]
        I1["V2X Communication<br/><small>C-V2X • DSRC</small>"]
        I2["Telematics Modules"]
        I3["Sensor Integration"]
        I4["5G/6G Connectivity"]
    end

    subgraph AI["AI & Autonomous"]
        A1["Perception Systems<br/><small>Vision • LiDAR • Radar fusion</small>"]
        A2["Planning & Control"]
        A3["Driver Monitoring"]
        A4["Predictive Maintenance"]
    end

    subgraph Security["Cybersecurity"]
        S1["Secure Boot & HSM"]
        S2["Intrusion Detection"]
        S3["OTA Security"]
        S4["V2X PKI"]
    end

    subgraph Data["Data & Analytics"]
        D1["Driving Data Platforms"]
        D2["Simulation & Testing"]
        D3["Usage Analytics"]
        D4["Synthetic Data Gen"]
    end

    ROOT --> Cloud
    ROOT --> Edge
    ROOT --> IoT
    ROOT --> AI
    ROOT --> Security
    ROOT --> Data

    Cloud --> C1
    Cloud --> C2
    Cloud --> C3
    Cloud --> C4

    Edge --> E1
    Edge --> E2
    Edge --> E3
    Edge --> E4

    IoT --> I1
    IoT --> I2
    IoT --> I3
    IoT --> I4

    AI --> A1
    AI --> A2
    AI --> A3
    AI --> A4

    Security --> S1
    Security --> S2
    Security --> S3
    Security --> S4

    Data --> D1
    Data --> D2
    Data --> D3
    Data --> D4`
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
        nodeSpacing: 30,
        rankSpacing: 50,
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
            Detailed technical architecture for the AI-CE Heatmap Platform.
            Each diagram captures a specific aspect of the system design.
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
                <div className="bg-white rounded-lg p-6 overflow-x-auto min-h-[400px] border border-gray-200 max-w-[700px] mx-auto">
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
