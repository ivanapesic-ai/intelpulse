import { useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineageLink } from "@/hooks/useSignalLineage";
import { Loader2, GitBranch } from "lucide-react";

interface PopoverState {
  x: number;
  y: number;
  content: React.ReactNode;
}

const LANE_CONFIG = {
  research: { y: 0, label: "Research", color: "hsl(var(--chart-1))", bgClass: "bg-chart-1/10" },
  patent: { y: 1, label: "Patents", color: "hsl(var(--chart-2))", bgClass: "bg-chart-2/10" },
  news: { y: 2, label: "News", color: "hsl(var(--chart-3))", bgClass: "bg-chart-3/10" },
} as const;

type LaneType = keyof typeof LANE_CONFIG;

function parseDate(d: string | null): number | null {
  if (!d) return null;
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
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  function showPopover(e: React.MouseEvent<SVGElement>, content: React.ReactNode) {
    const viewportPadding = 24;
    setPopover({
      x: Math.min(Math.max(e.clientX, viewportPadding), window.innerWidth - viewportPadding),
      y: Math.max(e.clientY - 12, viewportPadding),
      content,
    });
  }

  function hidePopover() {
    setPopover(null);
  }

  const { nodes, connections, dateRange } = useMemo(() => {
    if (!links.length) return { nodes: [], connections: [], dateRange: { min: 0, max: 0 } };

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

    const dates = nodes.map((n) => n.date).filter(Boolean) as number[];
    const min = dates.length ? Math.min(...dates) : Date.now() - 3 * 365 * 86400000;
    const max = dates.length ? Math.max(...dates) : Date.now();
    const range = max - min || 1;

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
      <CardContent className="p-0 overflow-visible">
        <div className="relative overflow-x-auto">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full min-w-[600px]"
            style={{ height: "auto", maxHeight: 280 }}
            onMouseLeave={() => {
              setHoveredLink(null);
              hidePopover();
            }}
          >
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
                <g
                  key={conn.id}
                  className="cursor-pointer"
                  onMouseEnter={(e) => {
                    setHoveredLink(conn.id);
                    showPopover(
                      e,
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: LANE_CONFIG[sourceNode.type]?.color }} />
                          <span className="text-xs font-medium">{sourceNode.title}</span>
                        </div>
                        <div className="pl-3 text-xs text-muted-foreground">↓ {conn.description}</div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: LANE_CONFIG[targetNode.type]?.color }} />
                          <span className="text-xs font-medium">{targetNode.title}</span>
                        </div>
                        <div className="mt-1 border-t border-border pt-1 text-[10px] text-muted-foreground">
                          Confidence: {Math.round(conn.confidence * 100)}%
                        </div>
                      </div>
                    );
                  }}
                  onMouseLeave={() => {
                    setHoveredLink(null);
                    hidePopover();
                  }}
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
              );
            })}

            {nodes.map((node) => {
              const cx = getX(node.date);
              const cy = getLaneY(node.type);

              return (
                <circle
                  key={node.id}
                  cx={cx}
                  cy={cy}
                  r={8}
                  fill={LANE_CONFIG[node.type].color}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                  className="cursor-pointer"
                  onMouseEnter={(e) => {
                    showPopover(
                      e,
                      <div>
                        <p className="text-xs font-medium">{node.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {LANE_CONFIG[node.type].label}
                          {node.date ? ` · ${new Date(node.date).getFullYear()}` : ""}
                        </p>
                      </div>
                    );
                  }}
                  onMouseLeave={hidePopover}
                />
              );
            })}
          </svg>

          {popover && typeof document !== "undefined"
            ? createPortal(
                <div
                  className="pointer-events-none fixed z-[100] max-w-xs rounded-md border bg-popover px-3 py-2 text-popover-foreground shadow-md"
                  style={{
                    left: popover.x,
                    top: popover.y,
                    transform: "translate(-50%, -100%)",
                  }}
                >
                  {popover.content}
                </div>,
                document.body
              )
            : null}
        </div>

        <div className="flex items-center gap-4 px-6 pb-4 pt-1">
          {(["research", "patent", "news"] as LaneType[]).map((type) => (
            <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: LANE_CONFIG[type].color }}
              />
              {LANE_CONFIG[type].label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
