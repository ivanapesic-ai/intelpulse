import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import mermaid from "mermaid";

const diagrams = [
  {
    id: "annex-e-radar-layout",
    title: "Technology Radar Layout",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    subgraph Radar["🎯 Technology Radar"]
        direction TB
        
        subgraph Q1["☁️ Cloud<br/>Top-Right"]
            C1["•"]
            C2["•"]
        end
        
        subgraph Q2["🤖 AI/ML<br/>Top-Left"]
            A1["•"]
            A2["•"]
        end
        
        subgraph Q3["📡 IoT<br/>Bottom-Left"]
            I1["•"]
            I2["•"]
        end
        
        subgraph Q4["⚡ Edge<br/>Bottom-Right"]
            E1["•"]
            E2["•"]
        end
    end
    
    subgraph Rings["Concentric Rings"]
        R1["🟢 Adopt (7.5-9.0)"]
        R2["🔵 Trial (5.0-7.4)"]
        R3["🟡 Assess (3.0-4.9)"]
        R4["🔴 Hold (0.0-2.9)"]
    end`
  },
  {
    id: "annex-e-heatmap-layout",
    title: "Heatmap Matrix Layout",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    subgraph Matrix["📊 Heatmap Matrix"]
        subgraph Header["Column Headers"]
            H1["Technology"]
            H2["TRL"]
            H3["Market"]
            H4["Innovation"]
            H5["EU Align"]
            H6["Composite"]
        end
        
        subgraph Rows["Technology Rows"]
            R1["Tech A | 🟢 | 🟢 | 🟡 | 🟢 | 7.8"]
            R2["Tech B | 🔵 | 🟡 | 🟢 | 🔵 | 6.2"]
            R3["Tech C | 🟡 | 🔴 | 🔵 | 🟡 | 4.1"]
        end
        
        subgraph Features["Features"]
            F1["Sort by column"]
            F2["Filter by domain"]
            F3["Click to expand"]
            F4["Export CSV"]
        end
    end`
  },
  {
    id: "annex-e-interactions",
    title: "User Interaction Patterns",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart LR
    subgraph Hover["🖱️ Hover"]
        H1["Technology dot"]
        H2["→ Tooltip with<br/>name, score, confidence"]
    end
    
    subgraph Click["👆 Click"]
        C1["Technology"]
        C2["→ Detail panel<br/>full assessment"]
    end
    
    subgraph Filter["🔍 Filter"]
        F1["Quadrant toggle"]
        F2["Confidence filter"]
        F3["Score range"]
    end
    
    subgraph Compare["⚖️ Compare"]
        CO1["Select multiple"]
        CO2["→ Side-by-side<br/>comparison view"]
    end`
  },
  {
    id: "annex-e-component-hierarchy",
    title: "Component Hierarchy",
    mermaid: `%%{init: {'theme': 'base', 'themeVariables': {'background': '#ffffff', 'primaryColor': '#3b82f6', 'primaryTextColor': '#1e293b'}}}%%
flowchart TD
    App["App"]
    App --> Layout["Layout"]
    
    Layout --> Nav["Navigation"]
    Layout --> Main["Main Content"]
    
    Main --> Radar["TechnologyRadar"]
    Main --> Heatmap["HeatmapMatrix"]
    Main --> Admin["AdminPanel"]
    
    Radar --> RC["RadarChart"]
    Radar --> FP["FilterPanel"]
    Radar --> TD["TechDetail"]
    
    Heatmap --> MG["MatrixGrid"]
    Heatmap --> SC["ScoreCell"]
    Heatmap --> EB["ExportButton"]
    
    Admin --> UT["UserTable"]
    Admin --> RT["RefreshTrigger"]
    Admin --> AL["ActivityLog"]`
  }
];

const colorScale = [
  { range: "8.0 - 9.0", color: "bg-green-600", label: "Deep Green", meaning: "Highly mature, ready for adoption" },
  { range: "6.0 - 7.9", color: "bg-green-400", label: "Light Green", meaning: "Mature, worth trialing" },
  { range: "4.0 - 5.9", color: "bg-yellow-400", label: "Yellow", meaning: "Developing, assess carefully" },
  { range: "2.0 - 3.9", color: "bg-orange-400", label: "Orange", meaning: "Early stage, monitor" },
  { range: "0.0 - 1.9", color: "bg-red-500", label: "Red", meaning: "Nascent, hold" },
];

const quadrants = [
  { name: "Cloud Technologies", position: "Top-Right", color: "bg-blue-500", icon: "☁️" },
  { name: "AI/ML", position: "Top-Left", color: "bg-purple-500", icon: "🤖" },
  { name: "IoT", position: "Bottom-Left", color: "bg-orange-500", icon: "📡" },
  { name: "Edge Computing", position: "Bottom-Right", color: "bg-green-500", icon: "⚡" },
];

const designTokens = [
  { token: "--primary", value: "hsl(221, 83%, 53%)", usage: "Brand color, buttons, links" },
  { token: "--background", value: "hsl(0, 0%, 100%)", usage: "Page background" },
  { token: "--foreground", value: "hsl(222, 47%, 11%)", usage: "Primary text" },
  { token: "--muted", value: "hsl(210, 40%, 96%)", usage: "Subtle backgrounds" },
  { token: "--accent", value: "hsl(210, 40%, 90%)", usage: "Hover states" },
  { token: "--destructive", value: "hsl(0, 84%, 60%)", usage: "Error states, Hold ring" },
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

export default function AnnexE() {
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
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Annex E: Visual Mockups</h1>
                <p className="text-sm text-muted-foreground">UI layouts, design system, and interaction patterns</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Live Mockups Reference */}
        <Card>
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle>🔗 Live Interactive Mockups</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Link to="/mockups/radar" className="block p-4 border border-border rounded-lg hover:border-primary transition-colors">
                <div className="font-medium">Technology Radar</div>
                <div className="text-sm text-muted-foreground">/mockups/radar</div>
              </Link>
              <Link to="/mockups/heatmap" className="block p-4 border border-border rounded-lg hover:border-primary transition-colors">
                <div className="font-medium">Heatmap Matrix</div>
                <div className="text-sm text-muted-foreground">/mockups/heatmap</div>
              </Link>
              <Link to="/mockups/admin" className="block p-4 border border-border rounded-lg hover:border-primary transition-colors">
                <div className="font-medium">Admin Panel</div>
                <div className="text-sm text-muted-foreground">/mockups/admin</div>
              </Link>
              <Link to="/mockups/public" className="block p-4 border border-border rounded-lg hover:border-primary transition-colors">
                <div className="font-medium">Public Demo</div>
                <div className="text-sm text-muted-foreground">/mockups/public</div>
              </Link>
            </div>
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

        {/* Radar Quadrants */}
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle>Radar Quadrants</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quadrants.map((q) => (
                <div key={q.name} className="text-center p-4 border border-border rounded-lg">
                  <div className="text-3xl mb-2">{q.icon}</div>
                  <div className={`w-4 h-4 rounded-full ${q.color} mx-auto mb-2`} />
                  <div className="font-medium text-sm">{q.name}</div>
                  <div className="text-xs text-muted-foreground">{q.position}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Color Scale */}
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle>Heatmap Color Scale</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {colorScale.map((c) => (
                <div key={c.range} className="flex items-center gap-4">
                  <div className={`w-12 h-8 rounded ${c.color}`} />
                  <div className="w-24 font-mono text-sm">{c.range}</div>
                  <div className="w-28 font-medium">{c.label}</div>
                  <div className="text-muted-foreground text-sm">{c.meaning}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Design Tokens */}
        <Card>
          <CardHeader className="bg-muted/30">
            <CardTitle>Design System Tokens</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Token</th>
                  <th className="text-left p-3 font-medium">Value</th>
                  <th className="text-left p-3 font-medium">Usage</th>
                </tr>
              </thead>
              <tbody>
                {designTokens.map((t, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-3 font-mono text-sm">{t.token}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded border border-border" 
                          style={{ backgroundColor: t.value }}
                        />
                        <span className="font-mono text-xs">{t.value}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{t.usage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border bg-card/50 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          AI-CE Heatmap Platform — Annex E: Visual Mockups
        </div>
      </footer>
    </div>
  );
}
