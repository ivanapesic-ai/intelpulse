import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import mermaid from "mermaid";

const diagrams = [
  {
    id: "annex-b-trl-scale",
    title: "Technology Readiness Level (TRL) Scale",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart LR
    subgraph Research["🔬 Research"]
        T1["TRL 1<br/>Basic Principles"]
        T2["TRL 2<br/>Concept Formulated"]
        T3["TRL 3<br/>Proof of Concept"]
    end
    
    subgraph Development["⚙️ Development"]
        T4["TRL 4<br/>Lab Validation"]
        T5["TRL 5<br/>Relevant Environment"]
        T6["TRL 6<br/>Prototype Demo"]
    end
    
    subgraph Deployment["🚀 Deployment"]
        T7["TRL 7<br/>Operational Demo"]
        T8["TRL 8<br/>System Complete"]
        T9["TRL 9<br/>Proven Operations"]
    end
    
    T1 --> T2 --> T3 --> T4 --> T5 --> T6 --> T7 --> T8 --> T9`
  },
  {
    id: "annex-b-scoring-framework",
    title: "4-Dimension Scoring Framework",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    subgraph TRL["📊 TRL Score (25%)"]
        T1["Expert Assessment"]
        T2["AI TRL Detection"]
        T3["Deployment Evidence"]
        T_OUT["Score: 0-9"]
    end
    
    subgraph Market["💰 Market Score (25%)"]
        M1["Funding Activity × 0.30"]
        M2["Company Count × 0.25"]
        M3["Deployments × 0.25"]
        M4["Growth Rate × 0.20"]
        M_OUT["Score: 0-9"]
    end
    
    subgraph Innovation["💡 Innovation Score (25%)"]
        I1["Patents × 0.35"]
        I2["Publications × 0.25"]
        I3["Open Source × 0.20"]
        I4["EU Projects × 0.20"]
        I_OUT["Score: 0-9"]
    end
    
    subgraph EU["🇪🇺 EU Alignment (25%)"]
        E1["Policy Mentions"]
        E2["Horizon Funding"]
        E3["IPCEI Inclusion"]
        E_OUT["Score: 0-9"]
    end
    
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
    
    T_OUT --> C["🎯 Composite Score"]
    M_OUT --> C
    I_OUT --> C
    E_OUT --> C`
  },
  {
    id: "annex-b-radar-placement",
    title: "Radar Ring Placement Logic",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    CS["🎯 Composite Score<br/>(0.0 - 9.0)"] --> R{Score Range?}
    
    R -->|"7.5 - 9.0"| A["🟢 ADOPT<br/>Ready for deployment"]
    R -->|"5.0 - 7.4"| T["🔵 TRIAL<br/>Worth pursuing, needs validation"]
    R -->|"3.0 - 4.9"| AS["🟡 ASSESS<br/>Monitor developments"]
    R -->|"0.0 - 2.9"| H["🔴 HOLD<br/>Too early or declining"]
    
    A --> A1["✅ Recommend for<br/>immediate adoption"]
    T --> T1["🔬 Pilot projects<br/>and testing"]
    AS --> AS1["📊 Keep watching,<br/>gather data"]
    H --> H1["⏸️ Wait for maturity<br/>or reconsider"]`
  },
  {
    id: "annex-b-confidence-levels",
    title: "Confidence Level Assessment",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    DS["📊 Data Sources<br/>Available"] --> C{Count & Recency}
    
    C -->|"3+ sources<br/>< 6 months old"| H["🟢 HIGH Confidence"]
    C -->|"2 sources OR<br/>6-12 months old"| M["🟡 MEDIUM Confidence"]
    C -->|"1 source OR<br/>> 12 months old"| L["🔴 LOW Confidence"]
    
    H --> H1["Display with<br/>solid indicator"]
    M --> M1["Display with<br/>dashed indicator"]
    L --> L1["Display with<br/>warning badge"]
    
    H1 --> OUT["Score displayed<br/>on radar/heatmap"]
    M1 --> OUT
    L1 --> OUT`
  },
  {
    id: "annex-b-data-sources",
    title: "Data Source Mapping",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart LR
    subgraph Sources["📥 Data Sources"]
        S1["Dealroom API"]
        S2["PATSTAT/EPO"]
        S3["CEI Documents"]
        S4["Public Sources"]
    end
    
    subgraph Dimensions["📊 Scoring Dimensions"]
        D1["TRL Score"]
        D2["Market Score"]
        D3["Innovation Score"]
        D4["EU Alignment"]
    end
    
    S1 -->|"Funding, Companies"| D2
    S2 -->|"Patents"| D3
    S3 -->|"Assessments"| D1
    S3 -->|"Policy refs"| D4
    S4 -->|"Publications"| D3
    S4 -->|"Deployments"| D2
    S4 -->|"EU projects"| D4`
  }
];

const trlLevels = [
  { level: 1, name: "Basic principles observed", phase: "Research", color: "bg-blue-100" },
  { level: 2, name: "Technology concept formulated", phase: "Research", color: "bg-blue-100" },
  { level: 3, name: "Experimental proof of concept", phase: "Research", color: "bg-blue-100" },
  { level: 4, name: "Technology validated in lab", phase: "Development", color: "bg-yellow-100" },
  { level: 5, name: "Technology validated in relevant environment", phase: "Development", color: "bg-yellow-100" },
  { level: 6, name: "Technology demonstrated in relevant environment", phase: "Development", color: "bg-yellow-100" },
  { level: 7, name: "System prototype demonstration", phase: "Deployment", color: "bg-green-100" },
  { level: 8, name: "System complete and qualified", phase: "Deployment", color: "bg-green-100" },
  { level: 9, name: "Actual system proven in operational environment", phase: "Deployment", color: "bg-green-100" },
];

const radarRings = [
  { ring: "Adopt", range: "7.5 - 9.0", color: "bg-green-500", recommendation: "Ready for deployment. Recommend immediate adoption." },
  { ring: "Trial", range: "5.0 - 7.4", color: "bg-blue-500", recommendation: "Worth pursuing. Run pilot projects to validate." },
  { ring: "Assess", range: "3.0 - 4.9", color: "bg-yellow-500", recommendation: "Monitor developments. Gather more data." },
  { ring: "Hold", range: "0.0 - 2.9", color: "bg-red-500", recommendation: "Too early or declining. Wait for maturity." },
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

export default function AnnexB() {
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
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Annex B: Methodology Framework</h1>
                <p className="text-sm text-muted-foreground">TRL scale, scoring logic, and data source mapping</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* TRL Scale Table */}
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle>Technology Readiness Level (TRL) Scale</CardTitle>
            <p className="text-sm text-muted-foreground">EU Horizon Europe Standard</p>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium w-20">Level</th>
                  <th className="text-left p-3 font-medium">Description</th>
                  <th className="text-left p-3 font-medium w-32">Phase</th>
                </tr>
              </thead>
              <tbody>
                {trlLevels.map((row) => (
                  <tr key={row.level} className={`border-t border-border ${row.color}`}>
                    <td className="p-3 font-bold text-lg">TRL {row.level}</td>
                    <td className="p-3">{row.name}</td>
                    <td className="p-3 font-medium">{row.phase}</td>
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

        {/* Radar Ring Reference */}
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle>Radar Ring Placement Reference</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              {radarRings.map((ring) => (
                <div key={ring.ring} className="flex items-start gap-4 p-4 rounded-lg border border-border">
                  <div className={`w-4 h-4 rounded-full ${ring.color} mt-1 shrink-0`} />
                  <div>
                    <div className="font-bold text-lg">{ring.ring}</div>
                    <div className="text-sm text-muted-foreground mb-1">Score: {ring.range}</div>
                    <div className="text-sm">{ring.recommendation}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Formula */}
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle>Composite Score Formula</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-muted/50 p-6 rounded-lg font-mono text-center">
              <div className="text-lg mb-4">
                <span className="font-bold">Overall Score</span> = 
              </div>
              <div className="text-sm md:text-base">
                (TRL × 0.25) + (Market × 0.25) + (Innovation × 0.25) + (EU Alignment × 0.25)
              </div>
              <div className="mt-4 text-muted-foreground text-sm">
                Each dimension normalized to 0-9 scale before weighting
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border bg-card/50 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          AI-CE Heatmap Platform — Annex B: Methodology Framework
        </div>
      </footer>
    </div>
  );
}
