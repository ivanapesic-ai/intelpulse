import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, RefreshCw, Search, Building, Layers, Cpu, Check, X, Tag, TrendingUp, Globe, CheckCircle2 } from "lucide-react";
import { useDealroomTaxonomy, useSyncDealroomTaxonomy, DealroomTaxonomyItem } from "@/hooks/useTechnologies";
import { useKeywords } from "@/hooks/useTechnologies";

export function TaxonomyBrowser() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("tags");
  
  const { data: taxonomy, isLoading: loadingTaxonomy } = useDealroomTaxonomy();
  const { data: keywords } = useKeywords();
  const syncTaxonomy = useSyncDealroomTaxonomy();

  // Get all currently mapped tags from keywords
  const mappedTags = new Set<string>();
  keywords?.forEach(kw => {
    kw.dealroomTags?.forEach(tag => mappedTags.add(tag.toLowerCase()));
  });

  // Fetch unique industries from companies
  const { data: companyIndustries } = useQuery({
    queryKey: ["company-industries-taxonomy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dealroom_companies")
        .select("industries");
      if (error) throw error;
      
      const counts = new Map<string, number>();
      data?.forEach((company) => {
        (company.industries as string[] | null)?.forEach((ind: string) => {
          counts.set(ind, (counts.get(ind) || 0) + 1);
        });
      });
      return Array.from(counts.entries())
        .map(([term, count]) => ({ term, count }))
        .sort((a, b) => b.count - a.count);
    },
  });

  // Fetch unique tech_stack from companies
  const { data: techStack } = useQuery({
    queryKey: ["company-tech-stack-taxonomy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dealroom_companies")
        .select("tech_stack");
      if (error) throw error;
      
      const counts = new Map<string, number>();
      data?.forEach((company) => {
        (company.tech_stack as string[] | null)?.forEach((tech: string) => {
          counts.set(tech, (counts.get(tech) || 0) + 1);
        });
      });
      return Array.from(counts.entries())
        .map(([term, count]) => ({ term, count }))
        .sort((a, b) => b.count - a.count);
    },
  });

  // Fetch growth stages
  const { data: growthStages } = useQuery({
    queryKey: ["company-growth-stages-taxonomy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dealroom_companies")
        .select("growth_stage");
      if (error) throw error;
      
      const counts = new Map<string, number>();
      data?.forEach((company) => {
        if (company.growth_stage) {
          counts.set(company.growth_stage, (counts.get(company.growth_stage) || 0) + 1);
        }
      });
      return Array.from(counts.entries())
        .map(([term, count]) => ({ term, count }))
        .sort((a, b) => b.count - a.count);
    },
  });

  // Fetch countries
  const { data: countries } = useQuery({
    queryKey: ["company-countries-taxonomy"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dealroom_companies")
        .select("hq_country");
      if (error) throw error;
      
      const counts = new Map<string, number>();
      data?.forEach((company) => {
        if (company.hq_country) {
          counts.set(company.hq_country, (counts.get(company.hq_country) || 0) + 1);
        }
      });
      return Array.from(counts.entries())
        .map(([term, count]) => ({ term, count }))
        .sort((a, b) => b.count - a.count);
    },
  });

  // Build tag taxonomy from keyword mappings (tags actually in use)
  const tagTaxonomy = useMemo(() => {
    if (!keywords) return [];
    
    const tagMap = new Map<string, Set<string>>();
    
    keywords.forEach((kw) => {
      kw.dealroomTags?.forEach((tag: string) => {
        if (!tagMap.has(tag)) {
          tagMap.set(tag, new Set());
        }
        tagMap.get(tag)!.add(kw.displayName);
      });
    });
    
    return Array.from(tagMap.entries())
      .map(([term, keywordSet]) => ({
        term,
        mappedKeywords: Array.from(keywordSet),
        isMapped: keywordSet.size > 0,
      }))
      .sort((a, b) => b.mappedKeywords.length - a.mappedKeywords.length);
  }, [keywords]);

  // Filter based on search
  const filterItems = (items: DealroomTaxonomyItem[] = []) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      (item.parent_name && item.parent_name.toLowerCase().includes(query))
    );
  };

  const filteredTags = useMemo(() => {
    if (!searchQuery) return tagTaxonomy;
    return tagTaxonomy.filter((item) =>
      item.term.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tagTaxonomy, searchQuery]);

  const filteredDealroomTech = filterItems(taxonomy?.technology);
  const filteredSubIndustries = filterItems(taxonomy?.sub_industries);
  const filteredIndustries = filterItems(taxonomy?.industries);

  const filteredCompanyIndustries = useMemo(() => {
    if (!searchQuery) return companyIndustries || [];
    return (companyIndustries || []).filter((item) =>
      item.term.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [companyIndustries, searchQuery]);

  const filteredTechStack = useMemo(() => {
    if (!searchQuery) return techStack || [];
    return (techStack || []).filter((item) =>
      item.term.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [techStack, searchQuery]);

  const filteredGrowthStages = useMemo(() => {
    if (!searchQuery) return growthStages || [];
    return (growthStages || []).filter((item) =>
      item.term.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [growthStages, searchQuery]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries || [];
    return (countries || []).filter((item) =>
      item.term.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [countries, searchQuery]);

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
    <div className="space-y-4">
      {/* Header with sync button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Full Taxonomy Browser
              </CardTitle>
              <CardDescription>
                View all available taxonomy terms from Dealroom and your company data. 
                Use this to build ontology connections and map to CEI keywords.
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
              Sync Dealroom Taxonomy
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Tag className="h-3 w-3" />
            Your Tags
          </div>
          <div className="text-xl font-bold">{tagTaxonomy.length}</div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Cpu className="h-3 w-3" />
            DR Tech
          </div>
          <div className="text-xl font-bold">{taxonomy?.technology.length || 0}</div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Layers className="h-3 w-3" />
            Sub-Ind.
          </div>
          <div className="text-xl font-bold">{taxonomy?.sub_industries.length || 0}</div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building className="h-3 w-3" />
            Industries
          </div>
          <div className="text-xl font-bold">{taxonomy?.industries.length || 0}</div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Cpu className="h-3 w-3" />
            Tech Stack
          </div>
          <div className="text-xl font-bold">{techStack?.length || 0}</div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            Stages
          </div>
          <div className="text-xl font-bold">{growthStages?.length || 0}</div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="h-3 w-3" />
            Countries
          </div>
          <div className="text-xl font-bold">{countries?.length || 0}</div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search all taxonomy terms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="tags" className="gap-1 text-xs">
            <Tag className="h-3 w-3" />
            Your Tags ({filteredTags.length})
          </TabsTrigger>
          <TabsTrigger value="dr-tech" className="gap-1 text-xs">
            <Cpu className="h-3 w-3" />
            DR Tech ({filteredDealroomTech.length})
          </TabsTrigger>
          <TabsTrigger value="sub-industries" className="gap-1 text-xs">
            <Layers className="h-3 w-3" />
            Sub-Ind ({filteredSubIndustries.length})
          </TabsTrigger>
          <TabsTrigger value="industries" className="gap-1 text-xs">
            <Building className="h-3 w-3" />
            Industries ({filteredIndustries.length})
          </TabsTrigger>
          <TabsTrigger value="company-industries" className="gap-1 text-xs">
            <Building className="h-3 w-3" />
            Co. Industries ({filteredCompanyIndustries.length})
          </TabsTrigger>
          <TabsTrigger value="tech-stack" className="gap-1 text-xs">
            <Cpu className="h-3 w-3" />
            Tech Stack ({filteredTechStack.length})
          </TabsTrigger>
          <TabsTrigger value="stages" className="gap-1 text-xs">
            <TrendingUp className="h-3 w-3" />
            Stages ({filteredGrowthStages.length})
          </TabsTrigger>
          <TabsTrigger value="countries" className="gap-1 text-xs">
            <Globe className="h-3 w-3" />
            Countries ({filteredCountries.length})
          </TabsTrigger>
        </TabsList>

        {/* Your Tags - from keyword mappings */}
        <TabsContent value="tags">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Tags Currently Mapped to CEI Keywords</CardTitle>
              <CardDescription>These are the Dealroom tags you're actively using</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">Status</TableHead>
                      <TableHead>Tag Name</TableHead>
                      <TableHead>Mapped CEI Keywords</TableHead>
                      <TableHead className="text-right w-20"># Keywords</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTags.map((item) => (
                      <TableRow key={item.term}>
                        <TableCell>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </TableCell>
                        <TableCell className="font-medium">{item.term}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {item.mappedKeywords.slice(0, 4).map((kw) => (
                              <Badge key={kw} variant="secondary" className="text-xs">
                                {kw}
                              </Badge>
                            ))}
                            {item.mappedKeywords.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{item.mappedKeywords.length - 4}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.mappedKeywords.length}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dealroom Tech Tags */}
        <TabsContent value="dr-tech">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Dealroom Technology Tags (Full Taxonomy)</CardTitle>
              <CardDescription>All technology tags from Dealroom's official taxonomy</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTaxonomy ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-[450px]">
                  <div className="space-y-2 pr-4">
                    {filteredDealroomTech.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No technology tags found. Click "Sync Dealroom Taxonomy" to load.
                      </p>
                    ) : (
                      filteredDealroomTech.map(renderTaxonomyItem)
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sub-Industries */}
        <TabsContent value="sub-industries">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Dealroom Sub-Industries</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px]">
                <div className="space-y-2 pr-4">
                  {filteredSubIndustries.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No sub-industries found. Click "Sync Dealroom Taxonomy" to load.
                    </p>
                  ) : (
                    filteredSubIndustries.map(renderTaxonomyItem)
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Industries */}
        <TabsContent value="industries">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Dealroom Industries</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px]">
                <div className="space-y-2 pr-4">
                  {filteredIndustries.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No industries found. Click "Sync Dealroom Taxonomy" to load.
                    </p>
                  ) : (
                    filteredIndustries.map(renderTaxonomyItem)
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Industries (from actual company data) */}
        <TabsContent value="company-industries">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Industries from Company Data</CardTitle>
              <CardDescription>Industries actually present in your synced companies</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Industry</TableHead>
                      <TableHead className="text-right"># Companies</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanyIndustries.map((item) => (
                      <TableRow key={item.term}>
                        <TableCell className="font-medium capitalize">{item.term}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{item.count}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tech Stack */}
        <TabsContent value="tech-stack">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Tech Stack from Company Profiles</CardTitle>
              <CardDescription>Technologies companies list in their profiles</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Technology</TableHead>
                      <TableHead className="text-right"># Companies</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTechStack.map((item) => (
                      <TableRow key={item.term}>
                        <TableCell className="font-medium capitalize">{item.term}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{item.count}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Growth Stages */}
        <TabsContent value="stages">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Growth Stages</CardTitle>
              <CardDescription>Company maturity stages from Dealroom</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stage</TableHead>
                      <TableHead className="text-right"># Companies</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGrowthStages.map((item) => (
                      <TableRow key={item.term}>
                        <TableCell className="font-medium capitalize">{item.term}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{item.count}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Countries */}
        <TabsContent value="countries">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Countries (HQ Location)</CardTitle>
              <CardDescription>Geographic distribution of companies</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-right"># Companies</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCountries.map((item) => (
                      <TableRow key={item.term}>
                        <TableCell className="font-medium">{item.term}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{item.count}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
