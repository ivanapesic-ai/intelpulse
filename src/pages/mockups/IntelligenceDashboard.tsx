import { useMemo, useState } from "react";
import { Search, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { TechnologyDetailPanel } from "@/components/intelligence/TechnologyDetailPanel";
import { HierarchyKPICards } from "@/components/intelligence/HierarchyKPICards";
import { ClusterCardView } from "@/components/intelligence/ClusterCardView";
import { GartnerMatrixSampler } from "@/components/intelligence/GartnerMatrixSampler";
import {
  useDomainOverview,
  useKeywordOverview,
  KeywordOverview,
} from "@/hooks/useDomainHierarchy";
import {
  useTechnologyIntelligence,
  useCalculateAllCOScores,
  type TechnologyIntelligence,
} from "@/hooks/useTechnologyIntelligence";
import { GraphNode } from "@/hooks/useKnowledgeGraph";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function IntelligenceDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTech, setSelectedTech] = useState<TechnologyIntelligence | null>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordOverview | null>(null);
  const [selectedGraphNode, setSelectedGraphNode] = useState<GraphNode | null>(null);

  // Data hooks
  const { data: domains, isLoading: domainsLoading } = useDomainOverview();
  const { data: keywords, isLoading: keywordsLoading } = useKeywordOverview();
  const { data: technologies, isLoading: techLoading } = useTechnologyIntelligence();
  const calculateScores = useCalculateAllCOScores();

  const isLoading = domainsLoading || keywordsLoading || techLoading;

  // Filter technologies based on search query (UI-only filter)
  const filteredTechnologies =
    technologies?.filter(
      (tech) => !searchQuery || tech.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  // Align keyword/domain counters to the SAME dataset driving the matrix
  const alignedKeywords = useMemo(() => {
    if (!keywords || !technologies) return [];
    const ids = new Set(technologies.map((t) => t.keywordId));
    return keywords.filter((k) => ids.has(k.keywordId));
  }, [keywords, technologies]);

  const displayKeywordCount = useMemo(() => {
    if (!technologies) return keywords?.length || 0;
    return alignedKeywords.length;
  }, [alignedKeywords.length, keywords?.length, technologies]);

  const displayDomainCount = useMemo(() => {
    if (!technologies) return domains?.length || 0;
    const domainIds = new Set(alignedKeywords.map((k) => k.domainId));
    return domainIds.size || 0;
  }, [alignedKeywords, domains?.length, technologies]);

  const handleRecalculate = async () => {
    try {
      const result = await calculateScores.mutateAsync();
      toast.success(`Recalculated C-O scores for ${result.processed} technologies`);
    } catch (err) {
      toast.error("Failed to recalculate scores");
    }
  };

  // Handle selecting a cluster node - find matching technology
  // IMPORTANT: Only show detail panel for technologies that exist in the canonical dataset
  // to ensure metrics always match Explorer and other views
  const handleSelectNode = (node: GraphNode | null) => {
    setSelectedGraphNode(node);

    if (!node) {
      setSelectedTech(null);
      return;
    }

    // Try to find matching technology for detail panel
    if (node.group === "concept") {
      const conceptId = node.id.replace("concept-", "");
      // Find keyword linked to this concept
      const kw = keywords?.find((k) => String(k.domainId) === conceptId);
      if (kw) {
        const tech = technologies?.find((t) => t.keywordId === kw.keywordId);
        if (tech) {
          setSelectedTech(tech);
          return;
        }
      }
    }

    // Try to find by node ID or label as fallback
    const techMatch = technologies?.find(
      (t) => t.id === node.id || t.keywordId === node.id || t.name.toLowerCase() === node.label.toLowerCase()
    );
    if (techMatch) {
      setSelectedTech(techMatch);
      return;
    }

    // If no tech found in canonical dataset, do NOT show synthetic data
    // This prevents mismatched metrics between views
    setSelectedTech(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <PlatformHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Technology Intelligence</h1>
              <p className="text-muted-foreground max-w-xl">
                SDV ecosystem overview with Challenge-Opportunity scoring based on the tender's 3-signal model (Investment,
                Patents, Market Response).
              </p>
            </div>
            <Button variant="outline" onClick={handleRecalculate} disabled={calculateScores.isPending}>
              <RefreshCw className={cn("h-4 w-4 mr-2", calculateScores.isPending && "animate-spin")} />
              Recalculate
            </Button>
          </div>
        </motion.div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex-1 relative w-full lg:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search technologies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{displayDomainCount} domains</span>
                <span>•</span>
                <span>{displayKeywordCount} keywords</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Matrix Visualization Options */}
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Loading intelligence data...</p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            {/* Gartner-style visualization samples */}
            <GartnerMatrixSampler
              technologies={filteredTechnologies}
              onSelectTechnology={setSelectedTech}
              selectedId={selectedTech?.id}
            />
          </motion.div>
        )}
      </div>

      {/* Detail Side Panel */}
      <AnimatePresence>
        {selectedTech && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              onClick={() => {
                setSelectedTech(null);
                setSelectedKeyword(null);
                setSelectedGraphNode(null);
              }}
            />
            <TechnologyDetailPanel 
              technology={selectedTech}
              onClose={() => {
                setSelectedTech(null);
                setSelectedKeyword(null);
                setSelectedGraphNode(null);
              }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
