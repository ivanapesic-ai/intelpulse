import { useTechnologyOntology, getClusterName } from "@/hooks/useTechnologyOntology";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Network, GitBranch, Zap, Building2 } from "lucide-react";
import { formatFundingEur } from "@/types/database";

interface TechnologyOntologyProps {
  maxEdges?: number;
}

export function TechnologyOntology({ maxEdges = 15 }: TechnologyOntologyProps) {
  const { data, isLoading, error } = useTechnologyOntology();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load ontology data</p>
        </CardContent>
      </Card>
    );
  }

  const { nodes, edges, clusters } = data;
  const topEdges = edges.slice(0, maxEdges);
  
  // Get cluster labels
  const clusterLabels: { name: string; members: string[]; funding: number }[] = [];
  clusters.forEach((memberIds, clusterId) => {
    const clusterNodes = nodes.filter(n => memberIds.includes(n.id));
    const totalFunding = clusterNodes.reduce((sum, n) => sum + n.totalFunding, 0);
    clusterLabels.push({
      name: getClusterName(clusterId, nodes),
      members: clusterNodes.map(n => n.name),
      funding: totalFunding,
    });
  });

  // Sort clusters by funding
  clusterLabels.sort((a, b) => b.funding - a.funding);

  return (
    <div className="space-y-6">
      {/* Connection Strength Matrix */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Network className="h-4 w-4" />
            Technology Connections (by shared companies)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topEdges.map((edge, idx) => {
              const sourceNode = nodes.find(n => n.id === edge.source);
              const targetNode = nodes.find(n => n.id === edge.target);
              if (!sourceNode || !targetNode) return null;

              const maxWeight = topEdges[0]?.weight || 1;
              const barWidth = (edge.weight / maxWeight) * 100;

              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-right text-muted-foreground truncate">
                    {sourceNode.name}
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-primary/70 transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-6 text-center">
                      {edge.sharedCompanies}
                    </span>
                  </div>
                  <div className="w-28 text-xs text-muted-foreground truncate">
                    {targetNode.name}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Technology Clusters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Detected Technology Clusters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {clusterLabels.slice(0, 6).map((cluster, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-muted/30 border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm text-foreground">
                    {cluster.name} Cluster
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    <Building2 className="h-3 w-3 mr-1" />
                    {formatFundingEur(cluster.funding)}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {cluster.members.slice(0, 5).map((tech, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="text-xs"
                    >
                      {tech}
                    </Badge>
                  ))}
                  {cluster.members.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{cluster.members.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Ontology Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{nodes.length}</p>
              <p className="text-xs text-muted-foreground">Connected Technologies</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{edges.length}</p>
              <p className="text-xs text-muted-foreground">Relationship Pairs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{clusterLabels.length}</p>
              <p className="text-xs text-muted-foreground">Detected Clusters</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
