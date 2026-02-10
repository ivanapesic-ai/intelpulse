import { useState } from "react";
import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { PlatformFooter } from "@/components/mockups/PlatformFooter";
import { KnowledgeGraph } from "@/components/intelligence/KnowledgeGraph";
import { GraphNode } from "@/hooks/useKnowledgeGraph";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Banknote, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFundingEur } from "@/types/database";

export default function KnowledgeGraphPage() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PlatformHeader />
      <main className="flex-1 p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Knowledge Graph</h1>
            <p className="text-sm text-muted-foreground">
              Explore how technologies, concepts, and domains are connected
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {/* Graph - takes most space */}
          <div className="xl:col-span-4">
            <KnowledgeGraph
              onSelectNode={setSelectedNode}
              selectedNodeId={selectedNode?.id}
            />
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-1">
            {selectedNode ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{selectedNode.label}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedNode(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <Badge variant="outline" className="w-fit text-xs">{selectedNode.group}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Building2 className="h-3 w-3" /> Companies
                      </span>
                      <span className="font-medium">{selectedNode.metadata.companyCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Banknote className="h-3 w-3" /> Funding
                      </span>
                      <span className="font-medium">{formatFundingEur(selectedNode.metadata.totalFunding)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <FileText className="h-3 w-3" /> Patents
                      </span>
                      <span className="font-medium">{selectedNode.metadata.patentCount}</span>
                    </div>
                  </div>
                  {selectedNode.metadata.quadrant && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">Quadrant</p>
                      <Badge variant="secondary" className="mt-1">{selectedNode.metadata.quadrant}</Badge>
                    </div>
                  )}
                  {(selectedNode.metadata.challengeScore !== null || selectedNode.metadata.opportunityScore !== null) && (
                    <div className="pt-2 border-t grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Challenge</p>
                        <p className="font-medium">{selectedNode.metadata.challengeScore?.toFixed(2) ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Opportunity</p>
                        <p className="font-medium">{selectedNode.metadata.opportunityScore?.toFixed(2) ?? "—"}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                  <p>Click a node in the graph to see details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <PlatformFooter />
    </div>
  );
}
