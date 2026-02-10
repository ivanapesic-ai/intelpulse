import { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Network, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  X,
  Building2,
  Banknote,
  FileText
} from "lucide-react";
import { 
  useKnowledgeGraph, 
  GraphNode, 
  GraphEdge, 
  DOMAIN_COLORS,
  getEgoNetwork 
} from "@/hooks/useKnowledgeGraph";
import { formatFundingEur } from "@/types/database";
import { cn } from "@/lib/utils";

interface KnowledgeGraphProps {
  onSelectNode?: (node: GraphNode | null) => void;
  selectedNodeId?: string | null;
}

// D3 simulation node with position
interface SimNode extends GraphNode {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  id: string;
  type: string;
  value: number;
  normalizedValue: number;
}

const NODE_SIZE_SCALE = {
  domain: { min: 30, max: 50 },
  concept: { min: 15, max: 35 },
  keyword: { min: 8, max: 20 },
};

const EDGE_TYPE_STYLES: Record<string, { stroke: string; dasharray: string }> = {
  requires: { stroke: "hsl(0, 70%, 50%)", dasharray: "none" },
  enables: { stroke: "hsl(142, 70%, 45%)", dasharray: "none" },
  part_of: { stroke: "hsl(220, 70%, 50%)", dasharray: "5,3" },
  cooccurs: { stroke: "hsl(270, 50%, 60%)", dasharray: "2,2" },
  has_keyword: { stroke: "hsl(220, 13%, 50%)", dasharray: "none" },
};

export function KnowledgeGraph({ onSelectNode, selectedNodeId }: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  
  const { data, isLoading, error } = useKnowledgeGraph();
  
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [graphInitError, setGraphInitError] = useState<string | null>(null);
  const [egoNetwork, setEgoNetwork] = useState<{ nodes: Set<string>; edges: Set<string> } | null>(null);
  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: Math.max(500, rect.height) });
      }
    };

    // Use ResizeObserver for container-based sizing
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) observer.observe(containerRef.current);

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => {
      window.removeEventListener("resize", updateDimensions);
      observer.disconnect();
    };
  }, []);

  // Initialize D3 force simulation
  useEffect(() => {
    if (!data || !svgRef.current) return;

    // Stop any previous simulation
    simulationRef.current?.stop();
    simulationRef.current = null;

    setGraphInitError(null);

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;

    // Clear previous
    svg.selectAll("*").remove();

    let simulation: d3.Simulation<SimNode, SimLink> | null = null;

    try {
      // Create container groups
      const g = svg.append("g").attr("class", "graph-container");
      const linksG = g.append("g").attr("class", "links");
      const nodesG = g.append("g").attr("class", "nodes");
      const labelsG = g.append("g").attr("class", "labels");

      // Prepare simulation data
      const simNodes: SimNode[] = data.nodes.map((n) => ({ ...n }));
      const rawLinks: SimLink[] = data.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type,
        value: e.value,
        normalizedValue: e.normalizedValue,
      }));

      // Defensive: drop any links referencing missing nodes (prevents D3 "node not found")
      const nodeIdSet = new Set(simNodes.map((n) => n.id));
      const simLinks: SimLink[] = rawLinks.filter((l) =>
        nodeIdSet.has(String(l.source)) && nodeIdSet.has(String(l.target))
      );

      // Create force simulation
      simulation = d3
        .forceSimulation<SimNode>(simNodes)
        .force(
          "link",
          d3
            .forceLink<SimNode, SimLink>(simLinks)
            .id((d) => d.id)
            .distance((d) => {
              // Shorter distance for hierarchical links
              if (d.type === "has_keyword") return 80;
              if (d.type === "part_of") return 100;
              return 120;
            })
            .strength((d) => {
              if (d.type === "has_keyword") return 0.8;
              return 0.3 + (d.normalizedValue / 1000) * 0.5;
            })
        )
        .force(
          "charge",
          d3
            .forceManyBody<SimNode>()
            .strength((d) => {
              if (d.group === "domain") return -400;
              if (d.group === "concept") return -200;
              return -80;
            })
        )
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force(
          "collision",
          d3.forceCollide<SimNode>().radius((d) => getNodeSize(d) + 5)
        )
        .force("x", d3.forceX(width / 2).strength(0.05))
        .force("y", d3.forceY(height / 2).strength(0.05));

      simulationRef.current = simulation;

      // Draw links
      const link = linksG
        .selectAll<SVGLineElement, SimLink>("line")
        .data(simLinks)
        .join("line")
        .attr("class", "graph-link")
        .attr(
          "stroke",
          (d) => EDGE_TYPE_STYLES[d.type]?.stroke || "hsl(220, 13%, 50%)"
        )
        .attr(
          "stroke-dasharray",
          (d) => EDGE_TYPE_STYLES[d.type]?.dasharray || "none"
        )
        .attr("stroke-width", (d) => Math.max(1, d.normalizedValue / 300))
        .attr("stroke-opacity", 0.4);

      // Draw nodes
      const node = nodesG
        .selectAll<SVGCircleElement, SimNode>("circle")
        .data(simNodes)
        .join("circle")
        .attr("class", "graph-node")
        .attr("r", (d) => getNodeSize(d))
        .attr("fill", (d) => DOMAIN_COLORS[d.domainCode || "default"])
        .attr("stroke", "hsl(var(--background))")
        .attr("stroke-width", 2)
        .attr("cursor", "pointer")
        .call(drag(simulation) as any);

      // Draw labels (only for domains and concepts)
      const label = labelsG
        .selectAll<SVGTextElement, SimNode>("text")
        .data(simNodes.filter((n) => n.group === "domain" || n.group === "concept"))
        .join("text")
        .attr("class", "graph-label")
        .attr("text-anchor", "middle")
        .attr("dy", (d) => getNodeSize(d) + 14)
        .attr("font-size", (d) => (d.group === "domain" ? 12 : 10))
        .attr("font-weight", (d) => (d.group === "domain" ? 600 : 400))
        .attr("fill", "hsl(var(--foreground))")
        .attr("pointer-events", "none")
        .text((d) => (d.label.length > 20 ? d.label.slice(0, 18) + "…" : d.label));

      // Node interactions
      node
        .on("mouseover", function (event, d) {
          setHoveredNode(d);
          const ego = getEgoNetwork(d.id, data.nodes, data.edges);
          setEgoNetwork(ego);
          highlightEgoNetwork(ego, node, link, label);
        })
        .on("mouseout", function () {
          setHoveredNode(null);
          setEgoNetwork(null);
          resetHighlight(node, link, label);
        })
        .on("click", function (event, d) {
          event.stopPropagation();
          onSelectNode?.(d);
        });

      // Zoom behavior
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 4])
        .on("zoom", (event) => {
          g.attr("transform", event.transform.toString());
          setTransform(event.transform);
        });

      svg.call(zoom);

      // Update positions on tick
      simulation.on("tick", () => {
        link
          .attr("x1", (d) => (d.source as SimNode).x || 0)
          .attr("y1", (d) => (d.source as SimNode).y || 0)
          .attr("x2", (d) => (d.target as SimNode).x || 0)
          .attr("y2", (d) => (d.target as SimNode).y || 0);

        node.attr("cx", (d) => d.x || 0).attr("cy", (d) => d.y || 0);

        label.attr("x", (d) => d.x || 0).attr("y", (d) => d.y || 0);
      });
    } catch (err) {
      console.error("Graph init failed:", err);
      setGraphInitError(err instanceof Error ? err.message : "Graph initialization failed");
      simulation?.stop();
      simulationRef.current = null;
    }

    return () => {
      simulation?.stop();
    };
  }, [data, dimensions, onSelectNode]);


  // Highlight selected node's ego network
  useEffect(() => {
    if (!selectedNodeId || !data || !svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const node = svg.selectAll<SVGCircleElement, SimNode>(".graph-node");
    const link = svg.selectAll<SVGLineElement, SimLink>(".graph-link");
    const label = svg.selectAll<SVGTextElement, SimNode>(".graph-label");
    
    const ego = getEgoNetwork(selectedNodeId, data.nodes, data.edges);
    highlightEgoNetwork(ego, node, link, label);
    
    return () => {
      resetHighlight(node, link, label);
    };
  }, [selectedNodeId, data]);

  const handleZoomIn = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
      1.5
    );
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
      0.67
    );
  }, []);

  const handleReset = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom<SVGSVGElement, unknown>().transform as any,
      d3.zoomIdentity
    );
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[500px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load knowledge graph</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Network className="h-4 w-4" />
            Technology Knowledge Graph
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-2">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="font-medium">Domains:</span>
            {Object.entries(DOMAIN_COLORS).filter(([k]) => k !== "default").map(([code, color]) => (
              <div key={code} className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: color }}
                />
                <span>{code}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground border-l pl-3">
            <span className="font-medium">Edges:</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-0.5" style={{ backgroundColor: EDGE_TYPE_STYLES.requires.stroke }} />
              <span>requires</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-0.5" style={{ backgroundColor: EDGE_TYPE_STYLES.enables.stroke }} />
              <span>enables</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-0.5 border-dashed border-t-2" style={{ borderColor: EDGE_TYPE_STYLES.cooccurs.stroke }} />
              <span>co-occurs</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div ref={containerRef} className="relative w-full h-[500px]">
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="bg-muted/20"
          />
          
          {/* Hover tooltip */}
          <AnimatePresence>
            {hoveredNode && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-4 right-4 p-3 bg-popover border rounded-lg shadow-lg max-w-xs"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">
                      {hoveredNode.label}
                    </h4>
                    <Badge variant="outline" className="text-xs mt-1">
                      {hoveredNode.group}
                    </Badge>
                  </div>
                  {hoveredNode.metadata.quadrant && (
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-xs",
                        hoveredNode.metadata.quadrant === "Strategic Investment" && "bg-primary/20 text-primary",
                        hoveredNode.metadata.quadrant === "High-Risk High-Reward" && "bg-accent/30 text-accent-foreground"
                      )}
                    >
                      {hoveredNode.metadata.quadrant}
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    <span>{hoveredNode.metadata.companyCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Banknote className="h-3 w-3 text-muted-foreground" />
                    <span>{formatFundingEur(hoveredNode.metadata.totalFunding)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span>{hoveredNode.metadata.patentCount} patents</span>
                  </div>
                </div>
                
                {(hoveredNode.metadata.challengeScore !== null || hoveredNode.metadata.opportunityScore !== null) && (
                  <div className="mt-2 pt-2 border-t flex gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Challenge: </span>
                      <span className="font-medium">
                        {hoveredNode.metadata.challengeScore?.toFixed(2) ?? "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Opportunity: </span>
                      <span className="font-medium">
                        {hoveredNode.metadata.opportunityScore?.toFixed(2) ?? "—"}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
      
      {/* Stats footer */}
      <div className="px-4 py-2 border-t bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
        <span>{data.nodes.length} nodes • {data.edges.length} edges</span>
        <span>Zoom: {(transform.k * 100).toFixed(0)}%</span>
      </div>
    </Card>
  );
}

// Helper functions
function getNodeSize(node: SimNode): number {
  const scale = NODE_SIZE_SCALE[node.group];
  const normalized = Math.min(1, node.value / 10); // Cap at 10 for normalization
  return scale.min + normalized * (scale.max - scale.min);
}

function drag(simulation: d3.Simulation<SimNode, SimLink>) {
  function dragstarted(event: d3.D3DragEvent<SVGCircleElement, SimNode, SimNode>) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event: d3.D3DragEvent<SVGCircleElement, SimNode, SimNode>) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event: d3.D3DragEvent<SVGCircleElement, SimNode, SimNode>) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  return d3.drag<SVGCircleElement, SimNode>()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
}

function highlightEgoNetwork(
  ego: { nodes: Set<string>; edges: Set<string> },
  nodeSelection: d3.Selection<SVGCircleElement, SimNode, SVGGElement, unknown>,
  linkSelection: d3.Selection<SVGLineElement, SimLink, SVGGElement, unknown>,
  labelSelection: d3.Selection<SVGTextElement, SimNode, SVGGElement, unknown>
) {
  nodeSelection
    .attr("opacity", d => ego.nodes.has(d.id) ? 1 : 0.15)
    .attr("stroke-width", d => ego.nodes.has(d.id) ? 3 : 2);

  linkSelection
    .attr("stroke-opacity", d => ego.edges.has(d.id) ? 0.8 : 0.05);

  labelSelection
    .attr("opacity", d => ego.nodes.has(d.id) ? 1 : 0.2);
}

function resetHighlight(
  nodeSelection: d3.Selection<SVGCircleElement, SimNode, SVGGElement, unknown>,
  linkSelection: d3.Selection<SVGLineElement, SimLink, SVGGElement, unknown>,
  labelSelection: d3.Selection<SVGTextElement, SimNode, SVGGElement, unknown>
) {
  nodeSelection
    .attr("opacity", 1)
    .attr("stroke-width", 2);

  linkSelection
    .attr("stroke-opacity", 0.4);

  labelSelection
    .attr("opacity", 1);
}
