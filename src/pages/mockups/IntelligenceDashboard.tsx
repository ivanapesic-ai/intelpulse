 import { useState, useMemo } from "react";
 import { Search, RefreshCw, LayoutGrid, List, Filter, TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react";
 import { AnimatePresence, motion } from "framer-motion";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Skeleton } from "@/components/ui/skeleton";
 import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Badge } from "@/components/ui/badge";
 import { PlatformHeader } from "@/components/mockups/PlatformHeader";
 import { COQuadrantMatrix } from "@/components/intelligence/COQuadrantMatrix";
 import { InvestorKPICards } from "@/components/intelligence/InvestorKPICards";
 import { TechnologyDetailPanel } from "@/components/intelligence/TechnologyDetailPanel";
 import { 
   useTechnologyIntelligence, 
   useCalculateAllCOScores,
   SECTOR_COLORS,
   CHALLENGE_LABELS,
   OPPORTUNITY_LABELS,
   type TechnologyIntelligence 
 } from "@/hooks/useTechnologyIntelligence";
 import { formatFundingEur } from "@/types/database";
 import { toast } from "sonner";
 import { cn } from "@/lib/utils";
 
 type SectorFilter = "all" | "mobility" | "energy" | "manufacturing";
 type ViewMode = "matrix" | "list";
 
 export default function IntelligenceDashboard() {
   const [searchQuery, setSearchQuery] = useState("");
   const [sectorFilter, setSectorFilter] = useState<SectorFilter>("all");
   const [viewMode, setViewMode] = useState<ViewMode>("matrix");
   const [selectedTech, setSelectedTech] = useState<TechnologyIntelligence | null>(null);
 
   const { data: technologies, isLoading, error } = useTechnologyIntelligence();
   const calculateScores = useCalculateAllCOScores();
 
   const filteredTechnologies = useMemo(() => {
     if (!technologies) return [];
     
     return technologies.filter((tech) => {
       const matchesSearch = tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         tech.description.toLowerCase().includes(searchQuery.toLowerCase());
       
       const matchesSector = sectorFilter === "all" || 
         tech.sectorTags.includes(sectorFilter);
       
       return matchesSearch && matchesSector;
     });
   }, [technologies, searchQuery, sectorFilter]);
 
   // KPI data aggregation
   const kpiData = useMemo(() => {
     if (!technologies) return {
       totalMarketValue: 0,
       totalCompanies: 0,
       totalEmployees: 0,
       avgMaturity: 0,
       highOpportunity: 0,
       severeChallenge: 0,
       euConcentration: 68,
       patentsCovered: 0,
     };
     
     const totalMarketValue = technologies.reduce((sum, t) => sum + t.totalFundingEur, 0);
     const totalCompanies = technologies.reduce((sum, t) => sum + t.dealroomCompanyCount, 0);
     const totalEmployees = technologies.reduce((sum, t) => sum + t.totalEmployees, 0);
     const avgMaturity = technologies.reduce((sum, t) => sum + t.compositeScore, 0) / Math.max(technologies.length, 1);
     const highOpportunity = technologies.filter(t => t.opportunityScore === 2).length;
     const severeChallenge = technologies.filter(t => t.challengeScore === 0).length;
     const patentsCovered = technologies.reduce((sum, t) => sum + t.totalPatents, 0);
     
     return {
       totalMarketValue,
       totalCompanies,
       totalEmployees,
       avgMaturity,
       highOpportunity,
       severeChallenge,
       euConcentration: 68,
       patentsCovered,
     };
   }, [technologies]);
 
   const handleRecalculate = async () => {
     try {
       const result = await calculateScores.mutateAsync();
       toast.success(`Recalculated C-O scores for ${result.processed} technologies`);
     } catch (err) {
       toast.error("Failed to recalculate scores");
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
                 Investor-grade analysis of SDV technology opportunities. Identify quick wins, 
                 strategic bets, and market positioning across the Cloud-Edge-IoT ecosystem.
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
             <InvestorKPICards data={kpiData} />
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
                     placeholder="Search technologies..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="pl-10"
                   />
                 </div>
                 <div className="flex items-center gap-2">
                   <Filter className="h-4 w-4 text-muted-foreground" />
                   <Select value={sectorFilter} onValueChange={(v) => setSectorFilter(v as SectorFilter)}>
                     <SelectTrigger className="w-44">
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
               </div>
               
               <div className="flex items-center gap-2">
                 <span className="text-sm text-muted-foreground">
                   {filteredTechnologies.length} technologies
                 </span>
                 <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                   <TabsList className="grid grid-cols-2 w-24">
                     <TabsTrigger value="matrix" className="px-2">
                       <LayoutGrid className="h-4 w-4" />
                     </TabsTrigger>
                     <TabsTrigger value="list" className="px-2">
                       <List className="h-4 w-4" />
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
         ) : error ? (
           <div className="text-center py-12">
             <p className="text-destructive">Error loading data: {error.message}</p>
           </div>
         ) : viewMode === "matrix" ? (
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
         ) : (
           <TechnologyListView 
             technologies={filteredTechnologies}
             onSelect={setSelectedTech}
             selectedId={selectedTech?.id}
           />
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
               onClick={() => setSelectedTech(null)}
             />
             <TechnologyDetailPanel 
               technology={selectedTech}
               onClose={() => setSelectedTech(null)}
             />
           </>
         )}
       </AnimatePresence>
     </div>
   );
 }
 
 // List view component
 function TechnologyListView({ 
   technologies, 
   onSelect, 
   selectedId 
 }: { 
   technologies: TechnologyIntelligence[]; 
   onSelect: (tech: TechnologyIntelligence) => void;
   selectedId?: string | null;
 }) {
   return (
     <div className="space-y-2">
       {technologies.map((tech, index) => (
         <motion.div
           key={tech.id}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: index * 0.02 }}
         >
           <Card 
             className={cn(
               "cursor-pointer hover:border-primary/50 transition-all",
               selectedId === tech.id && "border-primary ring-1 ring-primary"
             )}
             onClick={() => onSelect(tech)}
           >
             <CardContent className="p-4">
               <div className="flex items-center gap-4">
                 {/* Name & Trend */}
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2">
                     <h3 className="font-semibold text-foreground truncate">{tech.name}</h3>
                     {tech.trend === "up" ? (
                       <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
                     ) : tech.trend === "down" ? (
                       <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
                     ) : (
                       <Minus className="h-4 w-4 text-muted-foreground shrink-0" />
                     )}
                   </div>
                   <div className="flex flex-wrap gap-1 mt-1">
                     {tech.sectorTags.slice(0, 2).map(sector => (
                       <Badge 
                         key={sector} 
                         variant="outline" 
                         className={cn("text-xs capitalize", SECTOR_COLORS[sector])}
                       >
                         {sector}
                       </Badge>
                     ))}
                   </div>
                 </div>
 
                 {/* C-O Scores */}
                 <div className="flex items-center gap-2">
                   <div className={cn(
                     "px-2 py-1 rounded text-xs font-medium",
                     CHALLENGE_LABELS[tech.challengeScore ?? 1]?.color || "bg-muted text-muted-foreground"
                   )}>
                     C: {tech.challengeScore ?? "-"}
                   </div>
                   <div className={cn(
                     "px-2 py-1 rounded text-xs font-medium",
                     OPPORTUNITY_LABELS[tech.opportunityScore ?? 1]?.color || "bg-muted text-muted-foreground"
                   )}>
                     O: {tech.opportunityScore ?? "-"}
                   </div>
                 </div>
 
                 {/* Metrics */}
                 <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                   <div className="text-right">
                     <p className="font-medium text-foreground">{formatFundingEur(tech.totalFundingEur)}</p>
                     <p className="text-xs">Funding</p>
                   </div>
                   <div className="text-right">
                     <p className="font-medium text-foreground">{tech.dealroomCompanyCount}</p>
                     <p className="text-xs">Companies</p>
                   </div>
                   <div className="text-right">
                     <p className="font-medium text-foreground">{tech.totalPatents}</p>
                     <p className="text-xs">Patents</p>
                   </div>
                 </div>
 
                 <ChevronRight className="h-5 w-5 text-muted-foreground" />
               </div>
             </CardContent>
           </Card>
         </motion.div>
       ))}
 
       {technologies.length === 0 && (
         <div className="text-center py-12">
           <p className="text-muted-foreground">No technologies match your filters</p>
         </div>
       )}
     </div>
   );
 }