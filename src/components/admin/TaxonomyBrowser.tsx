import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, RefreshCw, Search, Building, Layers, Cpu, Check, X } from "lucide-react";
import { useDealroomTaxonomy, useSyncDealroomTaxonomy, DealroomTaxonomyItem } from "@/hooks/useTechnologies";
import { useKeywords } from "@/hooks/useTechnologies";

export function TaxonomyBrowser() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"industries" | "sub_industries" | "technology">("technology");
  
  const { data: taxonomy, isLoading: loadingTaxonomy } = useDealroomTaxonomy();
  const { data: keywords } = useKeywords();
  const syncTaxonomy = useSyncDealroomTaxonomy();

  // Get all currently mapped tags from keywords
  const mappedTags = new Set<string>();
  keywords?.forEach(kw => {
    kw.dealroomTags?.forEach(tag => mappedTags.add(tag.toLowerCase()));
  });

  // Filter taxonomy items based on search
  const filterItems = (items: DealroomTaxonomyItem[] = []) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      (item.parent_name && item.parent_name.toLowerCase().includes(query))
    );
  };

  const filteredIndustries = filterItems(taxonomy?.industries);
  const filteredSubIndustries = filterItems(taxonomy?.sub_industries);
  const filteredTechnology = filterItems(taxonomy?.technology);

  const totalCount = (taxonomy?.industries.length || 0) + 
                     (taxonomy?.sub_industries.length || 0) + 
                     (taxonomy?.technology.length || 0);

  const mappedCount = [...mappedTags].filter(tag => {
    const allNames = [
      ...(taxonomy?.industries || []).map(i => i.name.toLowerCase()),
      ...(taxonomy?.sub_industries || []).map(i => i.name.toLowerCase()),
      ...(taxonomy?.technology || []).map(i => i.name.toLowerCase()),
    ];
    return allNames.includes(tag);
  }).length;

  const renderTaxonomyItem = (item: DealroomTaxonomyItem) => {
    const isMapped = mappedTags.has(item.name.toLowerCase());
    
    return (
      <div 
        key={item.id} 
        className={`flex items-center justify-between p-3 rounded-lg border ${
          isMapped ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-transparent"
        }`}
      >
        <div className="flex flex-col gap-1">
          <span className="font-medium text-sm">{item.name}</span>
          {item.parent_name && (
            <span className="text-xs text-muted-foreground">
              Parent: {item.parent_name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isMapped ? (
            <Badge variant="default" className="gap-1">
              <Check className="h-3 w-3" />
              In use
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <X className="h-3 w-3" />
              Unused
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Dealroom Taxonomy Browser
            </CardTitle>
            <CardDescription>
              {totalCount} categories available • {mappedCount} linked to your keywords
            </CardDescription>
          </div>
          <Button
            onClick={() => syncTaxonomy.mutate()}
            disabled={syncTaxonomy.isPending}
            variant="outline"
          >
            {syncTaxonomy.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync Taxonomy
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search taxonomy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building className="h-4 w-4" />
                Industries
              </div>
              <div className="text-2xl font-bold">{taxonomy?.industries.length || 0}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Layers className="h-4 w-4" />
                Sub-Industries
              </div>
              <div className="text-2xl font-bold">{taxonomy?.sub_industries.length || 0}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Cpu className="h-4 w-4" />
                Tech Tags
              </div>
              <div className="text-2xl font-bold">{taxonomy?.technology.length || 0}</div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="technology" className="gap-2">
                <Cpu className="h-4 w-4" />
                Technology ({filteredTechnology.length})
              </TabsTrigger>
              <TabsTrigger value="sub_industries" className="gap-2">
                <Layers className="h-4 w-4" />
                Sub-Industries ({filteredSubIndustries.length})
              </TabsTrigger>
              <TabsTrigger value="industries" className="gap-2">
                <Building className="h-4 w-4" />
                Industries ({filteredIndustries.length})
              </TabsTrigger>
            </TabsList>

            {loadingTaxonomy ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <TabsContent value="technology">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2 pr-4">
                      {filteredTechnology.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No technology tags found. Click "Sync Taxonomy" to load.
                        </p>
                      ) : (
                        filteredTechnology.map(renderTaxonomyItem)
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="sub_industries">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2 pr-4">
                      {filteredSubIndustries.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No sub-industries found. Click "Sync Taxonomy" to load.
                        </p>
                      ) : (
                        filteredSubIndustries.map(renderTaxonomyItem)
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="industries">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2 pr-4">
                      {filteredIndustries.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No industries found. Click "Sync Taxonomy" to load.
                        </p>
                      ) : (
                        filteredIndustries.map(renderTaxonomyItem)
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
