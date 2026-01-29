import { useState, useMemo } from "react";
import { Search, Wand2, ChevronDown, ChevronUp, X, Plus, Check, AlertCircle, RefreshCw, Factory, Folder, Tag, Loader2, BadgeCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useKeywords, useAITagMapping, useDealroomTaxonomy, useSyncDealroomTaxonomy } from "@/hooks/useTechnologies";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Suggested mappings from Dealroom-source keywords for common CEI domains
const SUGGESTED_DEALROOM_MAPPINGS: Record<string, string[]> = {
  "autonomous-driving": ["AV Software", "AV Simulation", "AV Labeling", "LiDAR", "AV Camera", "AV Radar", "Teledriving", "Autonomous Mobile Robots", "Telematics"],
  "self-driving-vehicles": ["AV Software", "AV Simulation", "AV Labeling", "LiDAR", "AV Camera", "AV Radar", "Teledriving"],
  "autonomous-vehicle": ["AV Software", "AV Simulation", "AV Labeling", "LiDAR", "Autonomous Mobile Robots"],
  "bev-battery-electric-vehicle": ["EV Battery", "EV Manufacturing", "EV Motor", "Electric Mobility", "EV Services"],
  "ev-electric-vehicle": ["Electric Mobility", "EV Battery", "EV Charging", "EV Services"],
  "e-vehicle": ["Electric Mobility", "EV Battery", "EV Charging", "EV Services"],
  "v2g-vehicle-to-grid": ["Electric Mobility", "EV Charging"],
  "bidirectional-charging": ["EV Charging", "Electric Mobility"],
  "ev-charging": ["EV Charging", "Electric Mobility"],
  "logistics": ["Logistics Tech", "Logistics Robots", "Fleet Management", "Supply Chain Management"],
  "smart-logistics": ["Logistics Tech", "Logistics Robots", "Fleet Management"],
  "supply-chain": ["Supply Chain Management", "Logistics Tech"],
  "smart-city": ["Smart Cities"],
  "maritime": ["Maritime"],
  "sbs-storage-battery-systems": ["Battery Management Systems"],
  "mesu-mobile-energy-storage-units": ["Battery Management Systems", "Electric Mobility"],
  "fleet-management": ["Fleet Management", "Telematics"],
};

interface KeywordWithMappings {
  id: string;
  keyword: string;
  displayName: string;
  source: string;
  description?: string;
  dealroomTags: string[];
  dealroomIndustries: string[];
  dealroomSubIndustries: string[];
}

type FilterStatus = "all" | "mapped" | "unmapped";

export function KeywordManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingTagsFor, setAddingTagsFor] = useState<string | null>(null);
  const [taxonomySearch, setTaxonomySearch] = useState("");
  const [selectedTaxonomyTab, setSelectedTaxonomyTab] = useState<string>("technology");

  const { data: keywords, isLoading: keywordsLoading, refetch: refetchKeywords } = useKeywords();
  const { data: taxonomy, isLoading: taxonomyLoading } = useDealroomTaxonomy();
  const syncTaxonomy = useSyncDealroomTaxonomy();
  const aiMapper = useAITagMapping();
  const queryClient = useQueryClient();

  // Transform keywords to include new mapping columns
  const keywordsWithMappings = useMemo((): KeywordWithMappings[] => {
    if (!keywords) return [];
    return keywords.map(k => ({
      id: k.id,
      keyword: k.keyword,
      displayName: k.displayName,
      source: k.source,
      description: k.description,
      dealroomTags: k.dealroomTags || [],
      // These will come from the extended query once DB types are updated
      dealroomIndustries: (k as any).dealroomIndustries || [],
      dealroomSubIndustries: (k as any).dealroomSubIndustries || [],
    }));
  }, [keywords]);

  // Stats
  const stats = useMemo(() => {
    const total = keywordsWithMappings.length;
    const ceiSphere = keywordsWithMappings.filter(k => k.source === "cei_sphere").length;
    const mapped = keywordsWithMappings.filter(k => 
      k.dealroomTags.length > 0 || k.dealroomIndustries.length > 0 || k.dealroomSubIndustries.length > 0
    ).length;
    const unmapped = total - mapped;
    return { total, ceiSphere, mapped, unmapped };
  }, [keywordsWithMappings]);

  // Filtered keywords
  const filteredKeywords = useMemo(() => {
    let result = keywordsWithMappings.filter(k => k.source === "cei_sphere");
    
    if (filter === "mapped") {
      result = result.filter(k => 
        k.dealroomTags.length > 0 || k.dealroomIndustries.length > 0 || k.dealroomSubIndustries.length > 0
      );
    } else if (filter === "unmapped") {
      result = result.filter(k => 
        k.dealroomTags.length === 0 && k.dealroomIndustries.length === 0 && k.dealroomSubIndustries.length === 0
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(k =>
        k.displayName.toLowerCase().includes(query) ||
        k.keyword.toLowerCase().includes(query) ||
        k.dealroomTags.some(t => t.toLowerCase().includes(query))
      );
    }

    return result.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [keywordsWithMappings, filter, searchQuery]);

  // Filtered taxonomy items
  const filteredTaxonomy = useMemo(() => {
    if (!taxonomy) return { industries: [], subIndustries: [], technology: [] };
    
    const query = taxonomySearch.toLowerCase();
    return {
      industries: taxonomy.industries.filter(i => i.name.toLowerCase().includes(query)),
      subIndustries: taxonomy.sub_industries.filter(i => i.name.toLowerCase().includes(query)),
      technology: taxonomy.technology.filter(i => i.name.toLowerCase().includes(query)),
    };
  }, [taxonomy, taxonomySearch]);

  // Handle AI auto-map for all unmapped
  const handleAutoMapAll = () => {
    aiMapper.mutate({ mode: "unmapped" });
  };

  // Handle AI auto-map for single keyword
  const handleAutoMapSingle = (keywordId: string) => {
    aiMapper.mutate({ keywordIds: [keywordId] });
  };

  // Handle adding a mapping
  const handleAddMapping = async (keywordId: string, term: string, type: "tag" | "industry" | "sub_industry") => {
    const keyword = keywordsWithMappings.find(k => k.id === keywordId);
    if (!keyword) return;

    let column: string;
    let currentValues: string[];

    if (type === "tag") {
      column = "dealroom_tags";
      currentValues = keyword.dealroomTags;
    } else if (type === "industry") {
      column = "dealroom_industries";
      currentValues = keyword.dealroomIndustries;
    } else {
      column = "dealroom_sub_industries";
      currentValues = keyword.dealroomSubIndustries;
    }

    if (currentValues.includes(term)) {
      toast.info("Term already mapped");
      return;
    }

    const { error } = await supabase
      .from("technology_keywords")
      .update({ [column]: [...currentValues, term] })
      .eq("id", keywordId);

    if (error) {
      toast.error("Failed to add mapping");
      console.error(error);
    } else {
      toast.success(`Added "${term}" to ${keyword.displayName}`);
      refetchKeywords();
    }
  };

  // Handle removing a mapping
  const handleRemoveMapping = async (keywordId: string, term: string, type: "tag" | "industry" | "sub_industry") => {
    const keyword = keywordsWithMappings.find(k => k.id === keywordId);
    if (!keyword) return;

    let column: string;
    let currentValues: string[];

    if (type === "tag") {
      column = "dealroom_tags";
      currentValues = keyword.dealroomTags;
    } else if (type === "industry") {
      column = "dealroom_industries";
      currentValues = keyword.dealroomIndustries;
    } else {
      column = "dealroom_sub_industries";
      currentValues = keyword.dealroomSubIndustries;
    }

    const { error } = await supabase
      .from("technology_keywords")
      .update({ [column]: currentValues.filter(t => t !== term) })
      .eq("id", keywordId);

    if (error) {
      toast.error("Failed to remove mapping");
      console.error(error);
    } else {
      toast.success(`Removed "${term}"`);
      refetchKeywords();
    }
  };

  const hasMappings = (k: KeywordWithMappings) => 
    k.dealroomTags.length > 0 || k.dealroomIndustries.length > 0 || k.dealroomSubIndustries.length > 0;

  if (keywordsLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading keywords...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground flex items-center gap-2">
              CEI-SPHERE Keyword Management
            </CardTitle>
            <CardDescription className="mt-1">
              {stats.ceiSphere} keywords • {stats.mapped} mapped • {stats.unmapped} need attention
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => syncTaxonomy.mutate()}
              disabled={syncTaxonomy.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncTaxonomy.isPending ? "animate-spin" : ""}`} />
              Sync Taxonomy
            </Button>
            <Button 
              size="sm"
              onClick={handleAutoMapAll}
              disabled={aiMapper.isPending || stats.unmapped === 0}
            >
              <Wand2 className={`h-4 w-4 mr-2 ${aiMapper.isPending ? "animate-pulse" : ""}`} />
              {aiMapper.isPending ? "Mapping..." : `Auto-map ${stats.unmapped} Missing`}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            <Button
              variant={filter === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All ({stats.ceiSphere})
            </Button>
            <Button
              variant={filter === "mapped" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("mapped")}
            >
              <Check className="h-3.5 w-3.5 mr-1 text-success" />
              Mapped ({stats.mapped})
            </Button>
            <Button
              variant={filter === "unmapped" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter("unmapped")}
            >
              <AlertCircle className="h-3.5 w-3.5 mr-1 text-warning" />
              Unmapped ({stats.unmapped})
            </Button>
          </div>
        </div>

        {/* Keyword List */}
        <ScrollArea className="h-[600px]">
          <div className="space-y-2 pr-4">
            {filteredKeywords.map((keyword) => (
              <Collapsible
                key={keyword.id}
                open={expandedId === keyword.id}
                onOpenChange={(open) => {
                  setExpandedId(open ? keyword.id : null);
                  setAddingTagsFor(null);
                  setTaxonomySearch("");
                }}
              >
                <div className="border border-border rounded-lg bg-card">
                  {/* Keyword Header */}
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {hasMappings(keyword) ? (
                          <Check className="h-5 w-5 text-success" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-warning" />
                        )}
                        <div>
                          <p className="font-medium text-foreground">{keyword.displayName}</p>
                          <p className="text-sm text-muted-foreground">{keyword.keyword}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAutoMapSingle(keyword.id);
                          }}
                          disabled={aiMapper.isPending}
                        >
                          <Wand2 className="h-4 w-4" />
                        </Button>
                        {expandedId === keyword.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  {/* Current Mappings Summary (visible when collapsed) */}
                  {expandedId !== keyword.id && hasMappings(keyword) && (
                    <div className="px-4 pb-3 -mt-1">
                      <div className="flex flex-wrap gap-1.5">
                        {keyword.dealroomIndustries.map((ind) => (
                          <Badge key={`ind-${ind}`} variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">
                            <Factory className="h-3 w-3 mr-1" />
                            {ind}
                          </Badge>
                        ))}
                        {keyword.dealroomSubIndustries.map((sub) => (
                          <Badge key={`sub-${sub}`} variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30">
                            <Folder className="h-3 w-3 mr-1" />
                            {sub}
                          </Badge>
                        ))}
                        {keyword.dealroomTags.map((tag) => (
                          <Badge key={`tag-${tag}`} variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expanded Content */}
                  <CollapsibleContent>
                    <div className="border-t border-border p-4 space-y-4">
                      {/* Current Mappings */}
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">Current Mappings:</p>
                        {!hasMappings(keyword) ? (
                          <p className="text-sm text-muted-foreground italic">No mappings yet. Click AI Map or add manually below.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {keyword.dealroomIndustries.map((ind) => (
                              <Badge key={`ind-${ind}`} variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30 pr-1">
                                <Factory className="h-3 w-3 mr-1" />
                                {ind}
                                <button 
                                  className="ml-1.5 hover:text-destructive"
                                  onClick={() => handleRemoveMapping(keyword.id, ind, "industry")}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                            {keyword.dealroomSubIndustries.map((sub) => (
                              <Badge key={`sub-${sub}`} variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30 pr-1">
                                <Folder className="h-3 w-3 mr-1" />
                                {sub}
                                <button 
                                  className="ml-1.5 hover:text-destructive"
                                  onClick={() => handleRemoveMapping(keyword.id, sub, "sub_industry")}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                            {keyword.dealroomTags.map((tag) => (
                              <Badge key={`tag-${tag}`} variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30 pr-1">
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                                <button 
                                  className="ml-1.5 hover:text-destructive"
                                  onClick={() => handleRemoveMapping(keyword.id, tag, "tag")}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Suggested Dealroom Mappings (verified terms) */}
                      {SUGGESTED_DEALROOM_MAPPINGS[keyword.keyword] && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <BadgeCheck className="h-4 w-4 text-amber-400" />
                            <p className="text-sm font-medium text-foreground">Suggested Dealroom Terms:</p>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs max-w-[200px]">These are verified Dealroom terms that closely match this CEI keyword's domain</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {SUGGESTED_DEALROOM_MAPPINGS[keyword.keyword].map((term) => {
                              const isAdded = keyword.dealroomTags.includes(term) || 
                                             keyword.dealroomSubIndustries.includes(term) ||
                                             keyword.dealroomIndustries.includes(term);
                              return (
                                <Badge
                                  key={term}
                                  variant="outline"
                                  className={`text-xs cursor-pointer transition-colors ${
                                    isAdded 
                                      ? "bg-amber-500/20 text-amber-400 border-amber-500/50" 
                                      : "bg-amber-500/5 text-amber-300 border-amber-500/20 hover:bg-amber-500/15 hover:border-amber-500/40"
                                  }`}
                                  onClick={() => !isAdded && handleAddMapping(keyword.id, term, "tag")}
                                >
                                  {isAdded && <Check className="h-3 w-3 mr-1" />}
                                  <BadgeCheck className="h-3 w-3 mr-1" />
                                  {term}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Add from Taxonomy */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-foreground">Add from Dealroom Taxonomy:</p>
                          {addingTagsFor === keyword.id ? (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setAddingTagsFor(null)}
                            >
                              Done
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setAddingTagsFor(keyword.id)}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Browse Taxonomy
                            </Button>
                          )}
                        </div>

                        {addingTagsFor === keyword.id && (
                          <div className="border border-border rounded-lg p-3 bg-muted/30">
                            <div className="relative mb-3">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search taxonomy..."
                                value={taxonomySearch}
                                onChange={(e) => setTaxonomySearch(e.target.value)}
                                className="pl-9 h-8 text-sm"
                              />
                            </div>

                            <Tabs value={selectedTaxonomyTab} onValueChange={setSelectedTaxonomyTab}>
                              <TabsList className="h-8 mb-2">
                                <TabsTrigger value="technology" className="text-xs px-2 py-1">
                                  <Tag className="h-3 w-3 mr-1" />
                                  Tags ({filteredTaxonomy.technology.length})
                                </TabsTrigger>
                                <TabsTrigger value="sub_industries" className="text-xs px-2 py-1">
                                  <Folder className="h-3 w-3 mr-1" />
                                  Sub-Industries ({filteredTaxonomy.subIndustries.length})
                                </TabsTrigger>
                                <TabsTrigger value="industries" className="text-xs px-2 py-1">
                                  <Factory className="h-3 w-3 mr-1" />
                                  Industries ({filteredTaxonomy.industries.length})
                                </TabsTrigger>
                              </TabsList>

                              <ScrollArea className="h-[150px]">
                                <div className="flex flex-wrap gap-1.5">
                                  {selectedTaxonomyTab === "technology" && filteredTaxonomy.technology.map((item) => {
                                    const isAdded = keyword.dealroomTags.includes(item.name);
                                    return (
                                      <Badge
                                        key={item.id}
                                        variant="outline"
                                        className={`text-xs cursor-pointer transition-colors ${
                                          isAdded 
                                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" 
                                            : "hover:bg-emerald-500/10 hover:border-emerald-500/30"
                                        }`}
                                        onClick={() => !isAdded && handleAddMapping(keyword.id, item.name, "tag")}
                                      >
                                        {isAdded && <Check className="h-3 w-3 mr-1" />}
                                        {item.name}
                                      </Badge>
                                    );
                                  })}
                                  {selectedTaxonomyTab === "sub_industries" && filteredTaxonomy.subIndustries.map((item) => {
                                    const isAdded = keyword.dealroomSubIndustries.includes(item.name);
                                    return (
                                      <Badge
                                        key={item.id}
                                        variant="outline"
                                        className={`text-xs cursor-pointer transition-colors ${
                                          isAdded 
                                            ? "bg-blue-500/20 text-blue-400 border-blue-500/50" 
                                            : "hover:bg-blue-500/10 hover:border-blue-500/30"
                                        }`}
                                        onClick={() => !isAdded && handleAddMapping(keyword.id, item.name, "sub_industry")}
                                      >
                                        {isAdded && <Check className="h-3 w-3 mr-1" />}
                                        {item.name}
                                      </Badge>
                                    );
                                  })}
                                  {selectedTaxonomyTab === "industries" && filteredTaxonomy.industries.map((item) => {
                                    const isAdded = keyword.dealroomIndustries.includes(item.name);
                                    return (
                                      <Badge
                                        key={item.id}
                                        variant="outline"
                                        className={`text-xs cursor-pointer transition-colors ${
                                          isAdded 
                                            ? "bg-purple-500/20 text-purple-400 border-purple-500/50" 
                                            : "hover:bg-purple-500/10 hover:border-purple-500/30"
                                        }`}
                                        onClick={() => !isAdded && handleAddMapping(keyword.id, item.name, "industry")}
                                      >
                                        {isAdded && <Check className="h-3 w-3 mr-1" />}
                                        {item.name}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </ScrollArea>
                            </Tabs>
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}

            {filteredKeywords.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No keywords found matching your criteria</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
