 import { useState, useMemo } from "react";
 import { Search, AlertTriangle, Lightbulb, FileText, TrendingUp, TrendingDown, Minus, Building2, Users, DollarSign, Filter, RefreshCw, ChevronRight, Info } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Input } from "@/components/ui/input";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Skeleton } from "@/components/ui/skeleton";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
 import { PlatformHeader } from "@/components/mockups/PlatformHeader";
 import { 
   useTechnologyIntelligence, 
   useCalculateAllCOScores,
   CHALLENGE_LABELS, 
   OPPORTUNITY_LABELS,
   SECTOR_COLORS,
   type TechnologyIntelligence 
 } from "@/hooks/useTechnologyIntelligence";
 import { formatFundingEur, formatNumber, MATURITY_SCORE_CONFIG } from "@/types/database";
 import { toast } from "sonner";
 
 type SectorFilter = "all" | "mobility" | "energy" | "manufacturing";
 type COFilter = "all" | "high-opportunity" | "challenging";
 
 export default function IntelligenceDashboard() {
   const [searchQuery, setSearchQuery] = useState("");
   const [sectorFilter, setSectorFilter] = useState<SectorFilter>("all");
   const [coFilter, setCOFilter] = useState<COFilter>("all");
   const [selectedTech, setSelectedTech] = useState<TechnologyIntelligence | null>(null);
   const [detailOpen, setDetailOpen] = useState(false);
 
   const { data: technologies, isLoading, error } = useTechnologyIntelligence();
   const calculateScores = useCalculateAllCOScores();
 
   const filteredTechnologies = useMemo(() => {
     if (!technologies) return [];
     
     return technologies.filter((tech) => {
       const matchesSearch = tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         tech.description.toLowerCase().includes(searchQuery.toLowerCase());
       
       const matchesSector = sectorFilter === "all" || 
         tech.sectorTags.includes(sectorFilter);
       
       const matchesCO = coFilter === "all" ||
         (coFilter === "high-opportunity" && tech.opportunityScore === 2) ||
         (coFilter === "challenging" && tech.challengeScore === 0);
       
       return matchesSearch && matchesSector && matchesCO;
     });
   }, [technologies, searchQuery, sectorFilter, coFilter]);
 
   // Summary stats
   const stats = useMemo(() => {
     if (!technologies) return { total: 0, highOpp: 0, challenging: 0, withDocs: 0 };
     return {
       total: technologies.length,
       highOpp: technologies.filter(t => t.opportunityScore === 2).length,
       challenging: technologies.filter(t => t.challengeScore === 0).length,
       withDocs: technologies.filter(t => t.documentMentionCount > 0).length,
     };
   }, [technologies]);
 
   const openDetail = (tech: TechnologyIntelligence) => {
     setSelectedTech(tech);
     setDetailOpen(true);
   };
 
   const handleRecalculate = async () => {
     try {
       const result = await calculateScores.mutateAsync();
       toast.success(`Recalculated C-O scores for ${result.processed} technologies`);
     } catch (error) {
       toast.error("Failed to recalculate scores");
     }
   };
 
   const getChallengeColor = (score: number | null) => {
     if (score === null) return "bg-muted text-muted-foreground";
     return CHALLENGE_LABELS[score]?.color || "bg-muted";
   };
 
   const getOpportunityColor = (score: number | null) => {
     if (score === null) return "bg-muted text-muted-foreground";
     return OPPORTUNITY_LABELS[score]?.color || "bg-muted";
   };
 
   return (
     <div className="min-h-screen bg-background">
       <PlatformHeader />
 
       <div className="container mx-auto px-4 py-8">
         {/* Header */}
         <div className="mb-8 flex items-start justify-between">
           <div>
             <h1 className="text-2xl font-bold text-foreground mb-2">Technology Intelligence</h1>
             <p className="text-muted-foreground">
               Challenge-Opportunity analysis powered by CEI document insights and market signals
             </p>
           </div>
           <Button 
             variant="outline" 
             onClick={handleRecalculate}
             disabled={calculateScores.isPending}
           >
             <RefreshCw className={`h-4 w-4 mr-2 ${calculateScores.isPending ? "animate-spin" : ""}`} />
             Recalculate Scores
           </Button>
         </div>
 
         {/* Summary Cards */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
           <Card>
             <CardContent className="pt-4">
               <div className="flex items-center gap-2 mb-1">
                 <Building2 className="h-4 w-4 text-muted-foreground" />
                 <span className="text-sm text-muted-foreground">Technologies</span>
               </div>
               <p className="text-2xl font-bold text-foreground">{stats.total}</p>
             </CardContent>
           </Card>
           <Card className="border-emerald-500/30">
             <CardContent className="pt-4">
               <div className="flex items-center gap-2 mb-1">
                 <Lightbulb className="h-4 w-4 text-emerald-500" />
                 <span className="text-sm text-muted-foreground">High Opportunity</span>
               </div>
               <p className="text-2xl font-bold text-emerald-500">{stats.highOpp}</p>
             </CardContent>
           </Card>
           <Card className="border-red-500/30">
             <CardContent className="pt-4">
               <div className="flex items-center gap-2 mb-1">
                 <AlertTriangle className="h-4 w-4 text-red-500" />
                 <span className="text-sm text-muted-foreground">Severe Challenge</span>
               </div>
               <p className="text-2xl font-bold text-red-500">{stats.challenging}</p>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="pt-4">
               <div className="flex items-center gap-2 mb-1">
                 <FileText className="h-4 w-4 text-muted-foreground" />
                 <span className="text-sm text-muted-foreground">With Doc Insights</span>
               </div>
               <p className="text-2xl font-bold text-foreground">{stats.withDocs}</p>
             </CardContent>
           </Card>
         </div>
 
         {/* Filters */}
         <Card className="mb-6">
           <CardContent className="pt-6">
             <div className="flex flex-col lg:flex-row gap-4">
               <div className="flex-1">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                   <Input
                     placeholder="Search technologies..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="pl-10"
                   />
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 <Filter className="h-4 w-4 text-muted-foreground" />
                 <Select value={sectorFilter} onValueChange={(v) => setSectorFilter(v as SectorFilter)}>
                   <SelectTrigger className="w-40">
                     <SelectValue placeholder="Sector" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">All Sectors</SelectItem>
                     <SelectItem value="mobility">🚗 Mobility</SelectItem>
                     <SelectItem value="energy">⚡ Energy</SelectItem>
                     <SelectItem value="manufacturing">🏭 Manufacturing</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="flex items-center gap-2">
                 <Select value={coFilter} onValueChange={(v) => setCOFilter(v as COFilter)}>
                   <SelectTrigger className="w-48">
                     <SelectValue placeholder="C-O Status" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">All Technologies</SelectItem>
                     <SelectItem value="high-opportunity">High Opportunity Only</SelectItem>
                     <SelectItem value="challenging">Severe Challenge Only</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             </div>
           </CardContent>
         </Card>
 
         {/* Results */}
         <div className="mb-4 flex items-center justify-between">
           <p className="text-sm text-muted-foreground">
             Showing {filteredTechnologies.length} of {technologies?.length || 0} technologies
           </p>
         </div>
 
         {isLoading ? (
           <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {[...Array(6)].map((_, i) => (
               <Card key={i}>
                 <CardContent className="pt-6">
                   <Skeleton className="h-6 w-3/4 mb-4" />
                   <Skeleton className="h-4 w-full mb-2" />
                   <Skeleton className="h-4 w-2/3" />
                 </CardContent>
               </Card>
             ))}
           </div>
         ) : error ? (
           <div className="text-center py-12">
             <p className="text-destructive">Error loading intelligence data: {error.message}</p>
           </div>
         ) : (
           <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {filteredTechnologies.map((tech) => (
               <Card 
                 key={tech.id} 
                 className="cursor-pointer hover:border-primary/50 transition-colors"
                 onClick={() => openDetail(tech)}
               >
                 <CardContent className="pt-6">
                   <div className="flex items-start justify-between mb-3">
                     <h3 className="font-semibold text-foreground">{tech.name}</h3>
                     <div className="flex items-center gap-1">
                       {tech.trend === "up" ? (
                         <TrendingUp className="h-4 w-4 text-emerald-500" />
                       ) : tech.trend === "down" ? (
                         <TrendingDown className="h-4 w-4 text-red-500" />
                       ) : (
                         <Minus className="h-4 w-4 text-muted-foreground" />
                       )}
                     </div>
                   </div>
                   
                   {/* Sector Tags */}
                   <div className="flex flex-wrap gap-1 mb-3">
                     {tech.sectorTags.length > 0 ? tech.sectorTags.map(sector => (
                       <Badge 
                         key={sector} 
                         variant="outline" 
                         className={`text-xs capitalize ${SECTOR_COLORS[sector] || SECTOR_COLORS.general}`}
                       >
                         {sector}
                       </Badge>
                     )) : (
                       <Badge variant="outline" className="text-xs text-muted-foreground">
                         No sector assigned
                       </Badge>
                     )}
                   </div>
 
                   {/* C-O Matrix */}
                   <div className="grid grid-cols-2 gap-2 mb-4">
                     <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <div className={`p-2 rounded border ${getChallengeColor(tech.challengeScore)}`}>
                             <div className="flex items-center gap-1 mb-1">
                               <AlertTriangle className="h-3 w-3" />
                               <span className="text-xs font-medium">Challenge</span>
                             </div>
                             <p className="text-sm font-bold">
                               {tech.challengeScore !== null 
                                 ? CHALLENGE_LABELS[tech.challengeScore]?.label || "Unknown"
                                 : "Not assessed"}
                             </p>
                           </div>
                         </TooltipTrigger>
                         <TooltipContent className="max-w-xs">
                           <p>{tech.challengeScore !== null 
                             ? CHALLENGE_LABELS[tech.challengeScore]?.description 
                             : "Parse documents to calculate challenge score"}</p>
                         </TooltipContent>
                       </Tooltip>
                     </TooltipProvider>
 
                     <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <div className={`p-2 rounded border ${getOpportunityColor(tech.opportunityScore)}`}>
                             <div className="flex items-center gap-1 mb-1">
                               <Lightbulb className="h-3 w-3" />
                               <span className="text-xs font-medium">Opportunity</span>
                             </div>
                             <p className="text-sm font-bold">
                               {tech.opportunityScore !== null 
                                 ? OPPORTUNITY_LABELS[tech.opportunityScore]?.label || "Unknown"
                                 : "Not assessed"}
                             </p>
                           </div>
                         </TooltipTrigger>
                         <TooltipContent className="max-w-xs">
                           <p>{tech.opportunityScore !== null 
                             ? OPPORTUNITY_LABELS[tech.opportunityScore]?.description 
                             : "Parse documents to calculate opportunity score"}</p>
                         </TooltipContent>
                       </Tooltip>
                     </TooltipProvider>
                   </div>
 
                   {/* Quick Metrics */}
                   <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                     <div className="flex items-center gap-1">
                       <FileText className="h-3 w-3" />
                       <span>{tech.documentMentionCount} mentions</span>
                     </div>
                     <div className="flex items-center gap-1">
                       <DollarSign className="h-3 w-3" />
                       <span>{formatFundingEur(tech.totalFundingEur)}</span>
                     </div>
                     <ChevronRight className="h-4 w-4" />
                   </div>
                 </CardContent>
               </Card>
             ))}
           </div>
         )}
 
         {!isLoading && filteredTechnologies.length === 0 && (
           <div className="text-center py-12">
             <p className="text-muted-foreground">No technologies match your filters</p>
             <Button
               variant="ghost"
               className="mt-2"
               onClick={() => {
                 setSearchQuery("");
                 setSectorFilter("all");
                 setCOFilter("all");
               }}
             >
               Clear filters
             </Button>
           </div>
         )}
       </div>
 
       {/* Detail Dialog */}
       <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
         <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
           {selectedTech && (
             <>
               <DialogHeader>
                 <DialogTitle className="flex items-center gap-3">
                   <span className="text-2xl text-foreground">{selectedTech.name}</span>
                   <div className="flex gap-1">
                     {selectedTech.sectorTags.map(sector => (
                       <Badge 
                         key={sector} 
                         variant="outline" 
                         className={`capitalize ${SECTOR_COLORS[sector] || ""}`}
                       >
                         {sector}
                       </Badge>
                     ))}
                   </div>
                 </DialogTitle>
                 <DialogDescription>
                   {selectedTech.description || "Technology intelligence from CEI documents and market data"}
                 </DialogDescription>
               </DialogHeader>
 
               <Tabs defaultValue="co-matrix" className="mt-4">
                 <TabsList className="grid w-full grid-cols-3">
                   <TabsTrigger value="co-matrix">Challenge-Opportunity</TabsTrigger>
                   <TabsTrigger value="signals">Market Signals</TabsTrigger>
                   <TabsTrigger value="documents">Document Insights</TabsTrigger>
                 </TabsList>
 
                 <TabsContent value="co-matrix" className="mt-4 space-y-4">
                   {/* C-O Matrix Detail */}
                   <div className="grid md:grid-cols-2 gap-4">
                     <Card className={`border-2 ${getChallengeColor(selectedTech.challengeScore)}`}>
                       <CardHeader>
                         <CardTitle className="flex items-center gap-2 text-lg">
                           <AlertTriangle className="h-5 w-5" />
                           Challenges
                         </CardTitle>
                       </CardHeader>
                       <CardContent>
                         <div className="text-3xl font-bold mb-2">
                           {selectedTech.challengeScore !== null 
                             ? CHALLENGE_LABELS[selectedTech.challengeScore]?.label 
                             : "Not Assessed"}
                         </div>
                         <p className="text-sm text-muted-foreground mb-4">
                           {selectedTech.challengeScore !== null 
                             ? CHALLENGE_LABELS[selectedTech.challengeScore]?.description 
                             : "Upload and parse CEI documents to calculate challenge scores based on TRL and policy support."}
                         </p>
                         <div className="space-y-2 text-sm">
                           <div className="flex justify-between">
                             <span className="text-muted-foreground">Avg TRL Mentioned</span>
                             <span className="font-medium">{selectedTech.avgTrlMentioned?.toFixed(1) || "N/A"}</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-muted-foreground">Policy References</span>
                             <span className="font-medium">{selectedTech.policyMentionCount}</span>
                           </div>
                         </div>
                       </CardContent>
                     </Card>
 
                     <Card className={`border-2 ${getOpportunityColor(selectedTech.opportunityScore)}`}>
                       <CardHeader>
                         <CardTitle className="flex items-center gap-2 text-lg">
                           <Lightbulb className="h-5 w-5" />
                           Opportunities
                         </CardTitle>
                       </CardHeader>
                       <CardContent>
                         <div className="text-3xl font-bold mb-2">
                           {selectedTech.opportunityScore !== null 
                             ? OPPORTUNITY_LABELS[selectedTech.opportunityScore]?.label 
                             : "Not Assessed"}
                         </div>
                         <p className="text-sm text-muted-foreground mb-4">
                           {selectedTech.opportunityScore !== null 
                             ? OPPORTUNITY_LABELS[selectedTech.opportunityScore]?.description 
                             : "Based on funding, patents, and market traction signals."}
                         </p>
                         <div className="space-y-2 text-sm">
                           <div className="flex justify-between">
                             <span className="text-muted-foreground">Total Funding</span>
                             <span className="font-medium">{formatFundingEur(selectedTech.totalFundingEur)}</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-muted-foreground">Patents</span>
                             <span className="font-medium">{formatNumber(selectedTech.totalPatents)}</span>
                           </div>
                         </div>
                       </CardContent>
                     </Card>
                   </div>
 
                   {/* Maturity Scores */}
                   <Card>
                     <CardHeader>
                       <CardTitle className="text-sm">Maturity Indicators (0-2 Scale)</CardTitle>
                     </CardHeader>
                     <CardContent>
                       <div className="grid grid-cols-3 gap-4">
                         <div className="text-center">
                           <div className={`text-2xl font-bold ${MATURITY_SCORE_CONFIG[selectedTech.investmentScore]?.color}`}>
                             {selectedTech.investmentScore}
                           </div>
                           <p className="text-xs text-muted-foreground">Investment</p>
                         </div>
                         <div className="text-center">
                           <div className={`text-2xl font-bold ${MATURITY_SCORE_CONFIG[selectedTech.employeesScore]?.color}`}>
                             {selectedTech.employeesScore}
                           </div>
                           <p className="text-xs text-muted-foreground">Employees</p>
                         </div>
                         <div className="text-center">
                           <div className={`text-2xl font-bold ${MATURITY_SCORE_CONFIG[selectedTech.trlScore]?.color}`}>
                             {selectedTech.trlScore}
                           </div>
                           <p className="text-xs text-muted-foreground">TRL</p>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 </TabsContent>
 
                 <TabsContent value="signals" className="mt-4 space-y-4">
                   {/* Market Signals */}
                   <div className="grid md:grid-cols-2 gap-4">
                     <Card>
                       <CardHeader>
                         <CardTitle className="text-sm flex items-center gap-2">
                           <DollarSign className="h-4 w-4" />
                           Investment Signals
                         </CardTitle>
                       </CardHeader>
                       <CardContent className="space-y-3">
                         <div className="flex justify-between">
                           <span className="text-muted-foreground">Total Funding</span>
                           <span className="font-bold">{formatFundingEur(selectedTech.totalFundingEur)}</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-muted-foreground">Companies Tracked</span>
                           <span className="font-bold">{selectedTech.dealroomCompanyCount}</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-muted-foreground">Total Employees</span>
                           <span className="font-bold">{formatNumber(selectedTech.totalEmployees)}</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-muted-foreground">Patents</span>
                           <span className="font-bold">{formatNumber(selectedTech.totalPatents)}</span>
                         </div>
                       </CardContent>
                     </Card>
 
                     <Card>
                       <CardHeader>
                         <CardTitle className="text-sm flex items-center gap-2">
                           <FileText className="h-4 w-4" />
                           Document-Extracted Signals
                         </CardTitle>
                       </CardHeader>
                       <CardContent>
                         {selectedTech.marketSignals?.funding_mentions?.length ? (
                           <div className="space-y-2">
                             <p className="text-xs text-muted-foreground">Funding Mentions Found:</p>
                             <div className="flex flex-wrap gap-1">
                               {selectedTech.marketSignals.funding_mentions.flat().slice(0, 5).map((mention, i) => (
                                 <Badge key={i} variant="secondary" className="text-xs">
                                   {String(mention)}
                                 </Badge>
                               ))}
                             </div>
                           </div>
                         ) : (
                           <p className="text-sm text-muted-foreground">
                             No market signals extracted from documents yet. Parse CEI documents to extract funding mentions and adoption rates.
                           </p>
                         )}
                         {selectedTech.marketSignals?.adoption_rates?.length > 0 && (
                           <div className="mt-3 space-y-2">
                             <p className="text-xs text-muted-foreground">Adoption Rates:</p>
                             <div className="flex flex-wrap gap-1">
                               {selectedTech.marketSignals.adoption_rates.flat().slice(0, 5).map((rate, i) => (
                                 <Badge key={i} variant="outline" className="text-xs">
                                   {String(rate)}
                                 </Badge>
                               ))}
                             </div>
                           </div>
                         )}
                       </CardContent>
                     </Card>
                   </div>
 
                   {/* Key Players */}
                   {selectedTech.keyPlayers?.length > 0 && (
                     <Card>
                       <CardHeader>
                         <CardTitle className="text-sm flex items-center gap-2">
                           <Users className="h-4 w-4" />
                           Key Players
                         </CardTitle>
                       </CardHeader>
                       <CardContent>
                         <div className="flex flex-wrap gap-2">
                           {selectedTech.keyPlayers.map((player) => (
                             <Badge key={player} variant="secondary">
                               {player}
                             </Badge>
                           ))}
                         </div>
                       </CardContent>
                     </Card>
                   )}
                 </TabsContent>
 
                 <TabsContent value="documents" className="mt-4 space-y-4">
                   {/* Document Insights */}
                   <Card>
                     <CardHeader>
                       <CardTitle className="text-sm flex items-center gap-2">
                         <FileText className="h-4 w-4" />
                         CEI Document Analysis
                         <Badge variant="outline" className="ml-2">
                           {selectedTech.documentInsights?.source_count || 0} sources
                         </Badge>
                       </CardTitle>
                       <CardDescription>
                         AI-extracted mentions from parsed CEI-Sphere documents
                       </CardDescription>
                     </CardHeader>
                     <CardContent>
                       {selectedTech.documentInsights?.mention_contexts?.length ? (
                         <ScrollArea className="h-64">
                           <div className="space-y-3">
                             {selectedTech.documentInsights.mention_contexts.map((mention, i) => (
                               <div key={i} className="p-3 rounded-lg bg-muted/50 border">
                                 <p className="text-sm text-foreground mb-2">"{mention.context}"</p>
                                 <div className="flex flex-wrap gap-2 text-xs">
                                   {mention.trl && (
                                     <Badge variant="outline">TRL {mention.trl}</Badge>
                                   )}
                                   {mention.policy && (
                                     <Badge variant="secondary">{mention.policy}</Badge>
                                   )}
                                   <span className="text-muted-foreground">
                                     Confidence: {(mention.confidence * 100).toFixed(0)}%
                                   </span>
                                 </div>
                               </div>
                             ))}
                           </div>
                         </ScrollArea>
                       ) : (
                         <div className="text-center py-8">
                           <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                           <p className="text-muted-foreground">
                             No document insights available yet.
                           </p>
                           <p className="text-sm text-muted-foreground mt-1">
                             Upload and parse CEI documents to extract technology mentions, TRL levels, and policy references.
                           </p>
                         </div>
                       )}
                     </CardContent>
                   </Card>
 
                   {/* Policy References */}
                   {selectedTech.documentInsights?.policy_references?.filter(Boolean).length > 0 && (
                     <Card>
                       <CardHeader>
                         <CardTitle className="text-sm">EU Policy References</CardTitle>
                       </CardHeader>
                       <CardContent>
                         <div className="flex flex-wrap gap-2">
                           {selectedTech.documentInsights.policy_references.filter(Boolean).map((policy, i) => (
                             <Badge key={i} variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                               {policy}
                             </Badge>
                           ))}
                         </div>
                       </CardContent>
                     </Card>
                   )}
                 </TabsContent>
               </Tabs>
             </>
           )}
         </DialogContent>
       </Dialog>
     </div>
   );
 }