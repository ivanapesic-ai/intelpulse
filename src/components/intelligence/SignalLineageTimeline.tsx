import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LineageLink } from "@/hooks/useSignalLineage";
import { Loader2, GitBranch } from "lucide-react";

const LANE_CONFIG = {
  research: { y: 0, label: "Research", color: "hsl(var(--chart-1))", bgClass: "bg-chart-1/10" },
  patent: { y: 1, label: "Patents", color: "hsl(var(--chart-2))", bgClass: "bg-chart-2/10" },
  news: { y: 2, label: "News", color: "hsl(var(--chart-3))", bgClass: "bg-chart-3/10" },
} as const;

type LaneType = keyof typeof LANE_CONFIG;

function parseDate(d: string | null): number | null {
  if (!d) return null;
  // Handle year-only strings like "2023"
  if (/^\d{4}$/.test(d)) return new Date(`${d}-06-15`).getTime();
  const t = new Date(d).getTime();
  return isNaN(t) ? null : t;
}

interface Props {
  links: LineageLink[];
  isLoading?: boolean;
}

export function SignalLineageTimeline({ links, isLoading }: Props) {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const { nodes, connections, dateRange } = useMemo(() => {
    if (!links.length) return { nodes: [], connections: [], dateRange: { min: 0, max: 0 } };

    // Collect all unique nodes
    const nodeMap = new Map<string, { id: string; type: LaneType; title: string; date: number | null }>();

    links.forEach((l) => {
      const sk = `${l.source_type}:${l.source_id}`;
      const tk = `${l.target_type}:${l.target_id}`;
      if (!nodeMap.has(sk)) {
        nodeMap.set(sk, {
          id: sk,
          type: l.source_type as LaneType,
          title: l.source_title,
          date: parseDate(l.source_date),
        });
      }
      if (!nodeMap.has(tk)) {
        nodeMap.set(tk, {
          id: tk,
          type: l.target_type as LaneType,
          title: l.target_title,
          date: parseDate(l.target_date),
        });
      }
    });

    const nodes = Array.from(nodeMap.values());

    // Date range
    const dates = nodes.map((n) => n.date).filter(Boolean) as number[];
    const min = dates.length ? Math.min(...dates) : Date.now() - 3 * 365 * 86400000;
    const max = dates.length ? Math.max(...dates) : Date.now();
    const range = max - min || 1;

    // Connections
    const connections = links.map((l) => ({
      id: l.id,
      sourceKey: `${l.source_type}:${l.source_id}`,
      targetKey: `${l.target_type}:${l.target_id}`,
      confidence: l.confidence,
      description: l.relationship_description || "",
    }));

    return { nodes, connections, dateRange: { min, max, range } };
  }, [links]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!links.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GitBranch className="h-5 w-5" />
            Signal Lineage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No lineage data yet — run the "Analyze Signal Lineage" step from the admin pipeline to identify connections between research, patents, and news.
          </p>
        </CardContent>
      </Card>
    );
  }

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 240;
  const marginLeft = 80;
  const marginRight = 30;
  const marginTop = 30;
  const marginBottom = 20;
  const chartWidth = svgWidth - marginLeft - marginRight;
  const laneHeight = (svgHeight - marginTop - marginBottom) / 3;

  function getX(date: number | null): number {
    if (date === null) return marginLeft + chartWidth / 2;
    return marginLeft + ((date - dateRange.min) / (dateRange.range || 1)) * chartWidth;
  }

  function getLaneY(type: LaneType): number {
    return marginTop + LANE_CONFIG[type].y * laneHeight + laneHeight / 2;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <GitBranch className="h-5 w-5" />
          Signal Lineage
          <Badge variant="secondary" className="ml-2 text-xs">
            {connections.length} connection{connections.length !== 1 ? "s" : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <TooltipProvider delayDuration={100}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full min-w-[600px]"
            style={{ height: "auto", maxHeight: 280 }}
          >
            {/* Arrowhead marker */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 8 3, 0 6"
                  fill="hsl(var(--muted-foreground))"
                  opacity="0.6"
                />
              </marker>
            </defs>

            {/* Lane backgrounds */}
            {(["research", "patent", "news"] as LaneType[]).map((type) => (
              <g key={type}>
                <rect
                  x={marginLeft}
                  y={marginTop + LANE_CONFIG[type].y * laneHeight}
                  width={chartWidth}
                  height={laneHeight}
                  fill={LANE_CONFIG[type].color}
                  opacity={0.05}
                  rx={4}
                />
                <text
                  x={marginLeft - 8}
                  y={getLaneY(type)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-muted-foreground"
                  fontSize={11}
                  fontWeight={500}
                >
                  {LANE_CONFIG[type].label}
                </text>
              </g>
            ))}

            {/* Date axis labels */}
            {dateRange.min > 0 && (
              <>
                <text
                  x={marginLeft}
                  y={svgHeight - 4}
                  fontSize={10}
                  className="fill-muted-foreground"
                >
                  {new Date(dateRange.min).getFullYear()}
                </text>
                <text
                  x={marginLeft + chartWidth}
                  y={svgHeight - 4}
                  fontSize={10}
                  textAnchor="end"
                  className="fill-muted-foreground"
                >
                  {new Date(dateRange.max).getFullYear()}
                </text>
              </>
            )}

            {/* Bezier connections */}
            {connections.map((conn) => {
              const sourceNode = nodes.find((n) => n.id === conn.sourceKey);
              const targetNode = nodes.find((n) => n.id === conn.targetKey);
              if (!sourceNode || !targetNode) return null;

              const sx = getX(sourceNode.date);
              const sy = getLaneY(sourceNode.type);
              const tx = getX(targetNode.date);
              const ty = getLaneY(targetNode.type);
              const midX = (sx + tx) / 2;

              const isHovered = hoveredLink === conn.id;
              const opacity = isHovered ? 1 : 0.3 + conn.confidence * 0.4;

              return (
                <Tooltip key={conn.id}>
                  <TooltipTrigger asChild>
                    <g
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredLink(conn.id)}
                      onMouseLeave={() => setHoveredLink(null)}
                    >
                      <path
                        d={`M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={14}
                      />
                      <path
                        d={`M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`}
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth={isHovered ? 2.5 : 1.5}
                        strokeOpacity={opacity}
                        markerEnd="url(#arrowhead)"
                        className="pointer-events-none transition-all duration-200"
                      />
                    </g>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs font-medium">{conn.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Confidence: {Math.round(conn.confidence * 100)}%
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const cx = getX(node.date);
              const cy = getLaneY(node.type);

              return (
                <Tooltip key={node.id}>
                  <TooltipTrigger asChild>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={8}
                      fill={LANE_CONFIG[node.type].color}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                      className="cursor-pointer"
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs font-medium">{node.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {LANE_CONFIG[node.type].label}
                      {node.date ? ` · ${new Date(node.date).getFullYear()}` : ""}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </svg>
        </TooltipProvider>

        {/* Legend */}
        <div className="flex items-center gap-4 px-6 pb-4 pt-1">
          {(["research", "patent", "news"] as LaneType[]).map((type) => (
            <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: LANE_CONFIG[type].color }}
              />
              {LANE_CONFIG[type].label}
            </div>
          ))}
        </div>

        {/* Connections detail list */}
        <div className="px-6 pb-5 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Connection Details</p>
          {links.map((l) => (
            <div
              key={l.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
              onMouseEnter={() => setHoveredLink(l.id)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: LANE_CONFIG[l.source_type as LaneType]?.color }} />
                <span className="text-xs text-muted-foreground">→</span>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: LANE_CONFIG[l.target_type as LaneType]?.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {LANE_CONFIG[l.source_type as LaneType]?.label}
                  </Badge>
                  <span className="text-xs font-medium truncate max-w-[200px]" title={l.source_title}>
                    {l.source_title}
                  </span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {LANE_CONFIG[l.target_type as LaneType]?.label}
                  </Badge>
                  <span className="text-xs font-medium truncate max-w-[200px]" title={l.target_title}>
                    {l.target_title}
                  </span>
                </div>
                {l.relationship_description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {l.relationship_description}
                  </p>
                )}
              </div>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {Math.round(l.confidence * 100)}%
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
