import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Coins,
  FileText,
  X,
  ChevronRight,
  Info,
  Plus,
  Bookmark,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { KnowledgeGraph } from "@/components/intelligence/KnowledgeGraph";
import { GraphNode } from "@/hooks/useKnowledgeGraph";
import { formatFundingEur } from "@/types/database";
import { loadWorkspace, toggleWorkspace } from "../lib";

/**
 * Ecosystem Map — live, D3 force-directed knowledge graph.
 *
 * Nodes  = domains (ontology_domains) + concepts (ontology_concepts) + keywords (technology_keywords)
 * Edges  = curated ontology_relationships (typed, strength 0–1)
 *          + co-occurrence edges derived from technology_cooccurrences
 *            (count ≥ 3, normalized to 0–1000 for visual weight).
 * Node size scales by funding/companies; node color by domain (EV/AV/SDV).
 */
export default function EcosystemRelationships() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [workspace, setWorkspace] = useState<string[]>(() => loadWorkspace());

  useEffect(() => {
    const onChange = () => setWorkspace(loadWorkspace());
    window.addEventListener("n1:workspace-changed", onChange);
    return () => window.removeEventListener("n1:workspace-changed", onChange);
  }, []);

  const inWorkspace =
    !!selectedNode &&
    selectedNode.group === "keyword" &&
    workspace.includes(selectedNode.id);

  return (
    <section className="space-y-3">
      {/* Methodology bar */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-foreground">Ecosystem map</span>
          <span className="text-muted-foreground">
            · live force-directed graph
          </span>
        </div>
        <MethodologyPopover />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Graph */}
        <div className="xl:col-span-4">
          <KnowledgeGraph
            onSelectNode={setSelectedNode}
            selectedNodeId={selectedNode?.id}
          />
        </div>

        {/* Detail panel */}
        <div className="xl:col-span-1">
          {selectedNode ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{selectedNode.label}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setSelectedNode(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <Badge variant="outline" className="w-fit text-xs">
                  {selectedNode.group}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <Row
                    icon={<Building2 className="h-3 w-3" />}
                    label="Companies"
                    value={selectedNode.metadata.companyCount.toLocaleString()}
                  />
                  <Row
                    icon={<Coins className="h-3 w-3" />}
                    label="Funding"
                    value={formatFundingEur(selectedNode.metadata.totalFunding)}
                  />
                  <Row
                    icon={<FileText className="h-3 w-3" />}
                    label="Patents"
                    value={selectedNode.metadata.patentCount.toLocaleString()}
                  />
                </div>

                {(selectedNode.metadata.challengeScore !== null ||
                  selectedNode.metadata.opportunityScore !== null) && (
                  <div className="pt-2 border-t grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Challenge</p>
                      <p className="font-medium">
                        {selectedNode.metadata.challengeScore?.toFixed(2) ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Opportunity</p>
                      <p className="font-medium">
                        {selectedNode.metadata.opportunityScore?.toFixed(2) ??
                          "—"}
                      </p>
                    </div>
                  </div>
                )}

                {selectedNode.group === "keyword" && (
                  <div className="pt-2 border-t space-y-2">
                    <Link
                      to={`/technology/${
                        selectedNode.metadata.slug || selectedNode.id
                      }`}
                    >
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full gap-1"
                      >
                        Open deep-dive
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1"
                      onClick={() => {
                        toggleWorkspace(selectedNode.id);
                        const now = loadWorkspace();
                        setWorkspace(now);
                        toast.success(
                          now.includes(selectedNode.id)
                            ? `Added ${selectedNode.label} to workspace`
                            : `Removed ${selectedNode.label} from workspace`,
                        );
                      }}
                    >
                      {inWorkspace ? (
                        <>
                          <Bookmark className="h-3 w-3" /> In workspace
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3" /> Add to workspace
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-sm text-muted-foreground space-y-2">
                <p>Drag nodes · scroll to zoom · click for details</p>
                <p className="text-xs">
                  Size = funding · color = domain (EV / AV / SDV) · edge
                  thickness = strength.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1 text-muted-foreground">
        {icon} {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function MethodologyPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <Info className="h-3.5 w-3.5" />
          How is this calculated?
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[420px] text-xs leading-relaxed">
        <div className="space-y-3">
          <div>
            <p className="font-semibold text-sm text-foreground">
              Ecosystem map — methodology
            </p>
            <p className="text-muted-foreground mt-1">
              All nodes and edges are derived from live database tables. No
              positions or weights are hand-authored.
            </p>
          </div>

          <Section title="Nodes">
            <ul className="space-y-1 list-disc pl-4">
              <li>
                <b>Domains</b> from <code>ontology_domains</code> (EV, AV,
                SDV…).
              </li>
              <li>
                <b>Concepts</b> (core only) from <code>ontology_concepts</code>{" "}
                where <code>is_core = true</code>.
              </li>
              <li>
                <b>Keywords</b> from active <code>technology_keywords</code>,
                joined to <code>technologies</code> for metrics.
              </li>
            </ul>
          </Section>

          <Section title="Node size & color">
            <ul className="space-y-1 list-disc pl-4">
              <li>
                <b>Size</b> ∝ log(total funding + company count) — bigger =
                more market traction.
              </li>
              <li>
                <b>Color</b> = parent domain code (EV green, AV blue, SDV
                purple).
              </li>
            </ul>
          </Section>

          <Section title="Edges & strength">
            <ul className="space-y-1 list-disc pl-4">
              <li>
                <b>Typed edges</b> (<i>requires</i>, <i>enables</i>,{" "}
                <i>part_of</i>) come from <code>ontology_relationships</code>,
                each carrying a curated <code>strength</code> in [0, 1].
              </li>
              <li>
                <b>Co-occurrence edges</b> are derived from{" "}
                <code>technology_cooccurrences</code> where two keywords appear
                together in ≥ 3 of the same documents/news/patents. Raw count
                is normalized 0 – 1000 for line thickness.
              </li>
              <li>
                Edges fade with selection — clicking a node highlights only its
                neighbours so you can read clusters.
              </li>
            </ul>
          </Section>

          <Section title="Layout">
            <p>
              D3 <code>forceSimulation</code>: many-body charge, link distance
              inversely proportional to strength, collision radius, and weak
              centering forces. Nothing is pre-placed — clusters self-organize.
            </p>
          </Section>

          <p className="text-muted-foreground pt-1 border-t">
            Project rule: <i>relationship strength must be calculated from
            deterministic data, never guessed</i>.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-semibold text-foreground mb-1">{title}</p>
      <div className="text-muted-foreground">{children}</div>
    </div>
  );
}
