import { useState } from "react";
import { ArrowLeft, Download, Filter, ArrowUpDown, ChevronDown, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TechnologyScore {
  id: string;
  name: string;
  category: string;
  trl: number;
  market: number;
  innovation: number;
  euAlignment: number;
  composite: number;
  subTechnologies?: TechnologyScore[];
}

const sampleData: TechnologyScore[] = [
  {
    id: "1",
    name: "Cloud Infrastructure",
    category: "Cloud",
    trl: 8.5,
    market: 8.0,
    innovation: 6.5,
    euAlignment: 8.0,
    composite: 7.8,
    subTechnologies: [
      { id: "1a", name: "Kubernetes", category: "Cloud", trl: 9.0, market: 8.5, innovation: 6.0, euAlignment: 7.5, composite: 7.8 },
      { id: "1b", name: "Serverless", category: "Cloud", trl: 8.0, market: 7.5, innovation: 7.0, euAlignment: 8.5, composite: 7.8 },
    ],
  },
  {
    id: "2",
    name: "Edge Computing",
    category: "Edge",
    trl: 6.5,
    market: 5.5,
    innovation: 8.0,
    euAlignment: 6.0,
    composite: 6.5,
    subTechnologies: [
      { id: "2a", name: "MEC Platforms", category: "Edge", trl: 5.5, market: 4.5, innovation: 8.5, euAlignment: 6.5, composite: 6.3 },
      { id: "2b", name: "Edge AI", category: "Edge", trl: 7.5, market: 6.5, innovation: 7.5, euAlignment: 5.5, composite: 6.8 },
    ],
  },
  {
    id: "3",
    name: "IoT Sensors",
    category: "IoT",
    trl: 7.5,
    market: 6.0,
    innovation: 5.5,
    euAlignment: 7.5,
    composite: 6.6,
  },
  {
    id: "4",
    name: "AI/ML Vision",
    category: "AI",
    trl: 6.0,
    market: 8.5,
    innovation: 9.0,
    euAlignment: 5.5,
    composite: 7.3,
    subTechnologies: [
      { id: "4a", name: "Object Detection", category: "AI", trl: 7.0, market: 8.0, innovation: 8.5, euAlignment: 5.0, composite: 7.1 },
      { id: "4b", name: "SLAM", category: "AI", trl: 5.0, market: 9.0, innovation: 9.5, euAlignment: 6.0, composite: 7.4 },
    ],
  },
  {
    id: "5",
    name: "V2X Protocols",
    category: "IoT",
    trl: 4.5,
    market: 3.5,
    innovation: 6.0,
    euAlignment: 5.5,
    composite: 4.9,
  },
  {
    id: "6",
    name: "Autonomous Systems",
    category: "AI",
    trl: 5.0,
    market: 7.0,
    innovation: 8.5,
    euAlignment: 7.0,
    composite: 6.9,
  },
];

const columns = [
  { key: "trl", label: "TRL", description: "Technology Readiness Level" },
  { key: "market", label: "Market", description: "Market Adoption Score" },
  { key: "innovation", label: "Innovation", description: "Innovation Activity Score" },
  { key: "euAlignment", label: "EU Align", description: "EU Strategic Alignment" },
  { key: "composite", label: "Overall", description: "Composite Score" },
];

const getScoreColor = (score: number) => {
  if (score >= 8) return "bg-emerald-500/80 text-emerald-50";
  if (score >= 6) return "bg-emerald-500/40 text-emerald-100";
  if (score >= 4) return "bg-amber-500/60 text-amber-50";
  if (score >= 2) return "bg-rose-500/50 text-rose-50";
  return "bg-rose-500/80 text-rose-50";
};

const getScoreGradient = (score: number) => {
  const percentage = (score / 9) * 100;
  if (score >= 8) return `linear-gradient(90deg, hsl(152, 76%, 36%) ${percentage}%, transparent ${percentage}%)`;
  if (score >= 6) return `linear-gradient(90deg, hsl(152, 76%, 36%, 0.5) ${percentage}%, transparent ${percentage}%)`;
  if (score >= 4) return `linear-gradient(90deg, hsl(38, 92%, 50%, 0.6) ${percentage}%, transparent ${percentage}%)`;
  return `linear-gradient(90deg, hsl(0, 84%, 60%, 0.6) ${percentage}%, transparent ${percentage}%)`;
};

export default function HeatmapMatrix() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string>("composite");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedCell, setSelectedCell] = useState<{ row: string; col: string } | null>(null);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const sortedData = [...sampleData].sort((a, b) => {
    const aVal = a[sortColumn as keyof TechnologyScore] as number;
    const bVal = b[sortColumn as keyof TechnologyScore] as number;
    return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
  });

  const renderRow = (tech: TechnologyScore, isSubRow = false) => (
    <tr
      key={tech.id}
      className={`border-b border-border/50 transition-colors ${
        isSubRow ? "bg-muted/30" : "hover:bg-muted/50"
      }`}
    >
      <td className="p-3">
        <div className={`flex items-center gap-2 ${isSubRow ? "pl-6" : ""}`}>
          {!isSubRow && tech.subTechnologies && (
            <button
              onClick={() => toggleRow(tech.id)}
              className="p-1 hover:bg-muted rounded"
            >
              {expandedRows.has(tech.id) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          {!isSubRow && !tech.subTechnologies && <div className="w-6" />}
          <div>
            <p className={`font-medium ${isSubRow ? "text-sm text-muted-foreground" : ""}`}>
              {tech.name}
            </p>
            {!isSubRow && (
              <Badge variant="outline" className="text-xs mt-1">
                {tech.category}
              </Badge>
            )}
          </div>
        </div>
      </td>
      {columns.map((col) => {
        const score = tech[col.key as keyof TechnologyScore] as number;
        const isSelected = selectedCell?.row === tech.id && selectedCell?.col === col.key;
        return (
          <td key={col.key} className="p-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setSelectedCell({ row: tech.id, col: col.key })}
                  className={`w-full h-12 rounded-md flex items-center justify-center font-mono text-sm font-semibold transition-all ${
                    getScoreColor(score)
                  } ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                  style={{ background: getScoreGradient(score) }}
                >
                  {score.toFixed(1)}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <p className="font-semibold">{tech.name}</p>
                  <p className="text-muted-foreground">{col.description}: {score.toFixed(1)}/9.0</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </td>
        );
      })}
    </tr>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/mockups">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Heatmap Matrix</h1>
              <p className="text-sm text-muted-foreground">ML-SDV Sphere • Q4 2024</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_280px] gap-8">
          {/* Heatmap Table */}
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="p-3 text-left font-semibold text-sm w-64">Technology</th>
                    {columns.map((col) => (
                      <th key={col.key} className="p-3 text-center w-24">
                        <button
                          onClick={() => handleSort(col.key)}
                          className="flex items-center justify-center gap-1 mx-auto font-semibold text-sm hover:text-primary transition-colors"
                        >
                          {col.label}
                          <ArrowUpDown className={`h-3 w-3 ${sortColumn === col.key ? "text-primary" : "text-muted-foreground"}`} />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((tech) => (
                    <>
                      {renderRow(tech)}
                      {expandedRows.has(tech.id) &&
                        tech.subTechnologies?.map((sub) => renderRow(sub, true))}
                    </>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Legend */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Score Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-4 rounded bg-emerald-500/80" />
                  <span className="text-sm">8.0 - 9.0 (High)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-4 rounded bg-emerald-500/40" />
                  <span className="text-sm">6.0 - 7.9 (Good)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-4 rounded bg-amber-500/60" />
                  <span className="text-sm">4.0 - 5.9 (Moderate)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-4 rounded bg-rose-500/50" />
                  <span className="text-sm">2.0 - 3.9 (Low)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-4 rounded bg-rose-500/80" />
                  <span className="text-sm">0.0 - 1.9 (Very Low)</span>
                </div>
              </CardContent>
            </Card>

            {/* Column Descriptions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Dimensions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {columns.map((col) => (
                  <div key={col.key}>
                    <p className="text-sm font-medium">{col.label}</p>
                    <p className="text-xs text-muted-foreground">{col.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Technologies</span>
                  <span className="text-sm font-medium">{sampleData.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg. Composite</span>
                  <span className="text-sm font-medium">
                    {(sampleData.reduce((sum, t) => sum + t.composite, 0) / sampleData.length).toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">High Maturity</span>
                  <span className="text-sm font-medium text-emerald-400">
                    {sampleData.filter((t) => t.composite >= 7).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Needs Assessment</span>
                  <span className="text-sm font-medium text-amber-400">
                    {sampleData.filter((t) => t.composite < 5).length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
