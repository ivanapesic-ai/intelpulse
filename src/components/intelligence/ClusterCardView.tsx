import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Banknote, 
  FileText,
  Link2,
  Zap,
  Target,
  TrendingUp
} from "lucide-react";
import { 
  useKnowledgeGraph, 
  GraphNode, 
  GraphEdge,
  DOMAIN_COLORS 
} from "@/hooks/useKnowledgeGraph";
import { formatFundingEur } from "@/types/database";
import { cn } from "@/lib/utils";

interface ClusterCardViewProps {
  onSelectNode?: (node: GraphNode | null) => void;
  selectedNodeId?: string | null;
}

// Get opportunity-based heatmap color (green = high, red = low)
function getOpportunityColor(score: number | null): string {
  if (score === null) return "hsl(220, 13%, 50%)"; // gray for no data
  
  // 0 = red (low opportunity), 2 = green (high opportunity)
  const normalized = Math.min(1, Math.max(0, score / 2));
  
  if (normalized >= 0.75) return "hsl(142, 70%, 45%)"; // Strong green
  if (normalized >= 0.5) return "hsl(80, 60%, 45%)";   // Yellow-green
  if (normalized >= 0.25) return "hsl(45, 70%, 50%)";  // Orange
  return "hsl(0, 65%, 50%)";                           // Red
}

// Get connection count for a node
function getConnectionCount(nodeId: string, edges: GraphEdge[]): number {
  return edges.filter(e => e.source === nodeId || e.target === nodeId).length;
}

// Get connected node IDs for a node
function getConnectedNodeIds(nodeId: string, edges: GraphEdge[]): Set<string> {
  const connected = new Set<string>();
  for (const edge of edges) {
    if (edge.source === nodeId) connected.add(edge.target);
    if (edge.target === nodeId) connected.add(edge.source);
  }
  return connected;
}

export function ClusterCardView({ onSelectNode, selectedNodeId }: ClusterCardViewProps) {
  const { data, isLoading, error } = useKnowledgeGraph();
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Group nodes by domain
  const domainGroups = useMemo(() => {
    if (!data) return new Map<string, GraphNode[]>();
    
    const groups = new Map<string, GraphNode[]>();
    
    // First, add domain nodes as headers
    for (const node of data.nodes) {
      if (node.group === "domain") {
        groups.set(node.domainCode || "default", [node]);
      }
    }
    
    // Then add concept nodes to their domains
    for (const node of data.nodes) {
      if (node.group === "concept") {
        const domainCode = node.domainCode || "default";
        const existing = groups.get(domainCode) || [];
        existing.push(node);
        groups.set(domainCode, existing);
      }
    }
    
    return groups;
  }, [data]);

  // Calculate which nodes should be highlighted
  const highlightedNodes = useMemo(() => {
    const activeId = selectedNodeId || hoveredNodeId;
    if (!activeId || !data) return null;
    
    const connected = getConnectedNodeIds(activeId, data.edges);
    connected.add(activeId); // Include the selected node itself
    return connected;
  }, [selectedNodeId, hoveredNodeId, data]);

  // Get edges that connect to the active node
  const activeEdges = useMemo(() => {
    const activeId = selectedNodeId || hoveredNodeId;
    if (!activeId || !data) return [];
    
    return data.edges.filter(e => e.source === activeId || e.target === activeId);
  }, [selectedNodeId, hoveredNodeId, data]);

  const handleCardClick = useCallback((node: GraphNode) => {
    if (node.group === "concept") {
      onSelectNode?.(node);
    }
  }, [onSelectNode]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-3">
                <div className="h-8 bg-muted rounded animate-pulse" />
                <div className="h-24 bg-muted rounded animate-pulse" />
                <div className="h-24 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load cluster data</p>
        </CardContent>
      </Card>
    );
  }

  const domainOrder = ["EV", "AV", "SDV"];

  return (
    <div className="space-y-6">
      {/* Connection lines overlay - SVG positioned absolutely */}
      <AnimatePresence>
        {activeEdges.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-10"
          >
            {/* Connection lines would need position tracking - showing badge instead */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Domain clusters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {domainOrder.map(domainCode => {
          const nodes = domainGroups.get(domainCode) || [];
          const domainNode = nodes.find(n => n.group === "domain");
          const conceptNodes = nodes.filter(n => n.group === "concept");
          
          if (!domainNode) return null;
          
          const domainColor = DOMAIN_COLORS[domainCode] || DOMAIN_COLORS.default;
          
          return (
            <div key={domainCode} className="space-y-3">
              {/* Domain header */}
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-lg border-2"
                style={{ borderColor: domainColor, backgroundColor: `${domainColor}15` }}
              >
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: domainColor }}
                />
                <h3 className="font-semibold text-foreground">{domainNode.label}</h3>
                <Badge variant="outline" className="ml-auto text-xs">
                  {conceptNodes.length} concepts
                </Badge>
              </div>
              
              {/* Concept cards */}
              <div className="space-y-2">
                {conceptNodes.map(node => {
                  const connectionCount = getConnectionCount(node.id, data.edges);
                  const isActive = selectedNodeId === node.id || hoveredNodeId === node.id;
                  const isConnected = highlightedNodes?.has(node.id);
                  const isDimmed = highlightedNodes !== null && !isConnected;
                  
                  const opportunityColor = getOpportunityColor(node.metadata.opportunityScore);
                  
                  return (
                    <motion.div
                      key={node.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ 
                        opacity: isDimmed ? 0.3 : 1, 
                        y: 0,
                        scale: isActive ? 1.02 : 1
                      }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "relative p-3 rounded-lg border-2 cursor-pointer transition-all",
                        "hover:shadow-md",
                        isActive && "ring-2 ring-primary shadow-lg"
                      )}
                      style={{
                        borderColor: isConnected && !isActive 
                          ? DOMAIN_COLORS[selectedNodeId ? data.nodes.find(n => n.id === selectedNodeId)?.domainCode || "default" : domainCode]
                          : isDimmed 
                            ? "hsl(var(--border))" 
                            : domainColor,
                        backgroundColor: isActive 
                          ? `${domainColor}20` 
                          : isConnected 
                            ? `${domainColor}10` 
                            : "hsl(var(--card))"
                      }}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      onClick={() => handleCardClick(node)}
                    >
                      {/* Opportunity heat indicator */}
                      <div 
                        className="absolute top-0 left-0 w-1 h-full rounded-l-lg"
                        style={{ backgroundColor: opportunityColor }}
                      />
                      
                      <div className="pl-2">
                        {/* Title row */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-medium text-sm text-foreground leading-tight">
                            {node.label}
                          </h4>
                          {/* Connection strength indicator */}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <Link2 className="h-3 w-3" />
                            <span>{connectionCount}</span>
                          </div>
                        </div>
                        
                        {/* Metrics row */}
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span>{node.metadata.companyCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Banknote className="h-3 w-3" />
                            <span>{formatFundingEur(node.metadata.totalFunding)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span>{node.metadata.patentCount}</span>
                          </div>
                        </div>
                        
                        {/* Scores row */}
                        {(node.metadata.challengeScore !== null || node.metadata.opportunityScore !== null) && (
                          <div className="flex items-center gap-3 mt-2 pt-2 border-t text-xs">
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">C:</span>
                              <span className="font-medium">
                                {node.metadata.challengeScore?.toFixed(1) ?? "—"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">O:</span>
                              <span className="font-medium">
                                {node.metadata.opportunityScore?.toFixed(1) ?? "—"}
                              </span>
                            </div>
                            {node.metadata.maturityStage && (
                              <Badge variant="outline" className="text-xs ml-auto">
                                {node.metadata.maturityStage}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        {/* Connected indicator when this card is connected to selection */}
                        {isConnected && !isActive && highlightedNodes !== null && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute -top-2 -right-2"
                          >
                            <div 
                              className="w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ 
                                backgroundColor: DOMAIN_COLORS[
                                  data.nodes.find(n => n.id === (selectedNodeId || hoveredNodeId))?.domainCode || "default"
                                ]
                              }}
                            >
                              <Zap className="h-3 w-3 text-white" />
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground px-2">
        <span className="font-medium">Opportunity Score:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(142, 70%, 45%)" }} />
          <span>High (2.0)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(80, 60%, 45%)" }} />
          <span>Good (1.5)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(45, 70%, 50%)" }} />
          <span>Moderate (1.0)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(0, 65%, 50%)" }} />
          <span>Low (0.5)</span>
        </div>
        <div className="border-l pl-4 flex items-center gap-1">
          <Link2 className="h-3 w-3" />
          <span>= connection count (hub strength)</span>
        </div>
      </div>
    </div>
  );
}
