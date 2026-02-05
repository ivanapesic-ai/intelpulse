import { useState, useMemo } from "react";
import { Search, Wand2, ChevronDown, ChevronUp, X, Plus, Check, AlertCircle, RefreshCw, Factory, Folder, Tag, Loader2, BadgeCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
 import { useKeywords, useAITagMapping } from "@/hooks/useTechnologies";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

 // Suggested alias mappings for common SDV domains
 const SUGGESTED_ALIAS_MAPPINGS: Record<string, string[]> = {
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
   aliases: string[];
}

type FilterStatus = "all" | "mapped" | "unmapped";

export function KeywordManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingTagsFor, setAddingTagsFor] = useState<string | null>(null);
   const [aliasSearch, setAliasSearch] = useState("");

  const { data: keywords, isLoading: keywordsLoading, refetch: refetchKeywords } = useKeywords();
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
       aliases: k.aliases || [],
    }));
  }, [keywords]);

  // Stats
  const stats = useMemo(() => {
    const total = keywordsWithMappings.length;
    const ceiSphere = keywordsWithMappings.filter(k => k.source === "cei_sphere").length;
     const mapped = keywordsWithMappings.filter(k => k.aliases.length > 0).length;
    const unmapped = total - mapped;
    return { total, ceiSphere, mapped, unmapped };
  }, [keywordsWithMappings]);

  // Filtered keywords
  const filteredKeywords = useMemo(() => {
    let result = keywordsWithMappings.filter(k => k.source === "cei_sphere");
    
     if (filter === "mapped") {
       result = result.filter(k => k.aliases.length > 0);
     } else if (filter === "unmapped") {
       result = result.filter(k => k.aliases.length === 0);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(k =>
        k.displayName.toLowerCase().includes(query) ||
         k.keyword.toLowerCase().includes(query) ||
         k.aliases.some(t => t.toLowerCase().includes(query))
      );
    }

    return result.sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [keywordsWithMappings, filter, searchQuery]);

  // Handle AI auto-map for all unmapped
  const handleAutoMapAll = () => {
    aiMapper.mutate({ mode: "unmapped" });
  };

  // Handle AI auto-map for single keyword
  const handleAutoMapSingle = (keywordId: string) => {
    aiMapper.mutate({ keywordIds: [keywordId] });
  };

   // Handle adding an alias
   const handleAddAlias = async (keywordId: string, alias: string) => {
    const keyword = keywordsWithMappings.find(k => k.id === keywordId);
    if (!keyword) return;

     if (keyword.aliases.includes(alias)) {
       toast.info("Alias already exists");
      return;
    }

    const { error } = await supabase
      .from("technology_keywords")
       .update({ aliases: [...keyword.aliases, alias] })
      .eq("id", keywordId);

    if (error) {
       toast.error("Failed to add alias");
      console.error(error);
    } else {
       toast.success(`Added alias "${alias}" to ${keyword.displayName}`);
      refetchKeywords();
    }
  };

   // Handle removing an alias
   const handleRemoveAlias = async (keywordId: string, alias: string) => {
    const keyword = keywordsWithMappings.find(k => k.id === keywordId);
    if (!keyword) return;

    const { error } = await supabase
      .from("technology_keywords")
       .update({ aliases: keyword.aliases.filter(a => a !== alias) })
      .eq("id", keywordId);

    if (error) {
       toast.error("Failed to remove alias");
      console.error(error);
    } else {
       toast.success(`Removed alias "${alias}"`);
      refetchKeywords();
    }
  };

   const hasAliases = (k: KeywordWithMappings) => k.aliases.length > 0;

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
                   setAliasSearch("");
                }}
              >
                <div className="border border-border rounded-lg bg-card">
                  {/* Keyword Header */}
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                         {hasAliases(keyword) ? (
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

                   {/* Current Aliases Summary (visible when collapsed) */}
                   {expandedId !== keyword.id && hasAliases(keyword) && (
                    <div className="px-4 pb-3 -mt-1">
                      <div className="flex flex-wrap gap-1.5">
                         {keyword.aliases.map((alias) => (
                           <Badge key={alias} variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                            <Tag className="h-3 w-3 mr-1" />
                             {alias}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expanded Content */}
                  <CollapsibleContent>
                    <div className="border-t border-border p-4 space-y-4">
                       {/* Current Aliases */}
                      <div>
                         <p className="text-sm font-medium text-foreground mb-2">Current Aliases:</p>
                         {!hasAliases(keyword) ? (
                           <p className="text-sm text-muted-foreground italic">No aliases yet. Click AI Map or add manually below.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                             {keyword.aliases.map((alias) => (
                               <Badge key={alias} variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30 pr-1">
                                <Tag className="h-3 w-3 mr-1" />
                                 {alias}
                                <button 
                                  className="ml-1.5 hover:text-destructive"
                                   onClick={() => handleRemoveAlias(keyword.id, alias)}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                       {/* Suggested Aliases (verified terms) */}
                       {SUGGESTED_ALIAS_MAPPINGS[keyword.keyword] && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <BadgeCheck className="h-4 w-4 text-amber-400" />
                             <p className="text-sm font-medium text-foreground">Suggested Aliases:</p>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                   <p className="text-xs max-w-[200px]">These are verified terms that closely match this keyword's domain</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                             {SUGGESTED_ALIAS_MAPPINGS[keyword.keyword].map((term) => {
                               const isAdded = keyword.aliases.includes(term);
                              return (
                                <Badge
                                  key={term}
                                  variant="outline"
                                  className={`text-xs cursor-pointer transition-colors ${
                                    isAdded 
                                      ? "bg-amber-500/20 text-amber-400 border-amber-500/50" 
                                      : "bg-amber-500/5 text-amber-300 border-amber-500/20 hover:bg-amber-500/15 hover:border-amber-500/40"
                                  }`}
                                   onClick={() => !isAdded && handleAddAlias(keyword.id, term)}
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

                       {/* Add Alias Manually */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                           <p className="text-sm font-medium text-foreground">Add Alias:</p>
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
                               Add Alias
                            </Button>
                          )}
                        </div>

                        {addingTagsFor === keyword.id && (
                          <div className="border border-border rounded-lg p-3 bg-muted/30">
                             <div className="flex gap-2">
                              <Input
                                 placeholder="Enter alias..."
                                 value={aliasSearch}
                                 onChange={(e) => setAliasSearch(e.target.value)}
                                 className="h-8 text-sm"
                                 onKeyDown={(e) => {
                                   if (e.key === "Enter" && aliasSearch.trim()) {
                                     handleAddAlias(keyword.id, aliasSearch.trim());
                                     setAliasSearch("");
                                   }
                                 }}
                              />
                               <Button
                                 size="sm"
                                 className="h-8"
                                 disabled={!aliasSearch.trim()}
                                 onClick={() => {
                                   if (aliasSearch.trim()) {
                                     handleAddAlias(keyword.id, aliasSearch.trim());
                                     setAliasSearch("");
                                   }
                                 }}
                               >
                                 <Plus className="h-3.5 w-3.5" />
                               </Button>
                            </div>
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
