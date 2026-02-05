import { useState, useMemo } from "react";
import { Search, RefreshCw, LayoutGrid, List, Boxes } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { COQuadrantMatrix } from "@/components/intelligence/COQuadrantMatrix";
import { TechnologyDetailPanel } from "@/components/intelligence/TechnologyDetailPanel";
import { DomainHierarchyView } from "@/components/intelligence/DomainHierarchyView";
import { HierarchyKPICards } from "@/components/intelligence/HierarchyKPICards";
import { ClusterCardView } from "@/components/intelligence/ClusterCardView";
import { 
  useDomainOverview, 
  useKeywordOverview,
  KeywordOverview 
} from "@/hooks/useDomainHierarchy";
import { 
  useTechnologyIntelligence, 
  useCalculateAllCOScores,
  type TechnologyIntelligence 
} from "@/hooks/useTechnologyIntelligence";
import { GraphNode } from "@/hooks/useKnowledgeGraph";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ViewMode = "hierarchy" | "matrix" | "clusters";

export default function IntelligenceDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("clusters");
  const [selectedTech, setSelectedTech] = useState<TechnologyIntelligence | null>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordOverview | null>(null);
  const [selectedGraphNode, setSelectedGraphNode] = useState<GraphNode | null>(null);

  // Data hooks
  const { data: domains, isLoading: domainsLoading } = useDomainOverview();
  const { data: keywords, isLoading: keywordsLoading } = useKeywordOverview();
  const { data: technologies, isLoading: techLoading } = useTechnologyIntelligence();
  const calculateScores = useCalculateAllCOScores();

  const isLoading = domainsLoading || keywordsLoading || techLoading;

  // Filter technologies for matrix view
  const filteredTechnologies = useMemo(() => {
    if (!technologies) return [];
    
    return technologies.filter((tech) => {
      const matchesSearch = tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tech.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [technologies, searchQuery]);

  const handleRecalculate = async () => {
    try {
      const result = await calculateScores.mutateAsync();
      toast.success(`Recalculated C-O scores for ${result.processed} technologies`);
    } catch (err) {
      toast.error("Failed to recalculate scores");
    }
  };

  // Handle keyword selection - find matching technology
  const handleKeywordSelect = (keyword: KeywordOverview) => {
    setSelectedKeyword(keyword);
    const tech = technologies?.find(t => t.keywordId === keyword.keywordId);
    if (tech) {
      setSelectedTech(tech);
    }
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
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Technology Intelligence
              </h1>
              <p className="text-muted-foreground max-w-xl">
                Hierarchical view of SDV domains and technologies. Expand domains to explore 
                keywords and their market intelligence signals.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleRecalculate}
              disabled={calculateScores.isPending}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", calculateScores.isPending && "animate-spin")} />
              Recalculate
            </Button>
          </div>

          {/* KPI Cards */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : (
            <HierarchyKPICards 
              domains={domains || []} 
              totalKeywords={keywords?.length || 0} 
            />
          )}
        </motion.div>

        {/* Filters & View Toggle */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 gap-4 w-full lg:w-auto">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search domains and keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {domains?.length || 0} domains • {keywords?.length || 0} keywords
                </span>
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                  <TabsList className="grid grid-cols-3 w-48">
                    <TabsTrigger value="clusters" className="px-2">
                      <Boxes className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="hierarchy" className="px-2">
                      <List className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="matrix" className="px-2">
                      <LayoutGrid className="h-4 w-4" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Loading intelligence data...</p>
            </div>
          </div>
        ) : viewMode === "clusters" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <ClusterCardView
              onSelectNode={(node) => {
                setSelectedGraphNode(node);
                // Try to find matching technology for detail panel
                if (node && node.group === "concept") {
                  const conceptId = node.id.replace("concept-", "");
                  // Find keyword linked to this concept
                  const kw = keywords?.find(k => String(k.domainId) === conceptId);
                  if (kw) {
                    const tech = technologies?.find(t => t.keywordId === kw.keywordId);
                    if (tech) setSelectedTech(tech);
                  }
                } else {
                  setSelectedTech(null);
                }
              }}
              selectedNodeId={selectedGraphNode?.id}
            />
          </motion.div>
        ) : viewMode === "hierarchy" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <DomainHierarchyView
              searchQuery={searchQuery}
              onSelectKeyword={handleKeywordSelect}
              selectedKeywordId={selectedKeyword?.keywordId}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Challenge-Opportunity Matrix
              </h2>
              <COQuadrantMatrix 
                technologies={filteredTechnologies}
                onSelectTechnology={setSelectedTech}
                selectedId={selectedTech?.id}
              />
            </Card>
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
