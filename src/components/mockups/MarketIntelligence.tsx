 import { DollarSign, MapPin, TrendingUp, Target, Clock } from "lucide-react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Skeleton } from "@/components/ui/skeleton";
 import { formatFundingEur, formatNumber } from "@/types/database";
 import { useMarketIntelligence } from "@/hooks/useMarketIntelligence";
 
 interface MarketIntelligenceProps {
   keywordId?: string;
   technologyName: string;
 }
 
 export function MarketIntelligence({ keywordId, technologyName }: MarketIntelligenceProps) {
   const { data, isLoading, error } = useMarketIntelligence(keywordId);
 
   if (isLoading) {
     return (
       <div className="space-y-6">
         <Card>
           <CardContent className="pt-6">
             <Skeleton className="h-6 w-1/3 mb-4" />
             <Skeleton className="h-20 w-full" />
           </CardContent>
         </Card>
         <Card>
           <CardContent className="pt-6">
             <Skeleton className="h-6 w-1/3 mb-4" />
             <Skeleton className="h-32 w-full" />
           </CardContent>
         </Card>
       </div>
     );
   }
 
   if (error) {
     return (
       <div className="text-center py-8">
         <p className="text-destructive">Error loading market data: {error.message}</p>
       </div>
     );
   }
 
   if (!data || data.totalCompanies === 0) {
     return (
       <div className="text-center py-8 text-muted-foreground">
         <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
         <p>No market data available for {technologyName} yet.</p>
         <p className="text-sm mt-2">Sync data from Admin Panel to populate this view.</p>
       </div>
     );
   }
 
   return (
     <div className="space-y-6">
       {/* Sync Status Bar */}
       <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
         <div className="flex items-center gap-2 text-sm text-muted-foreground">
           <Clock className="h-4 w-4" />
           <span>Market data from Crunchbase</span>
         </div>
         <span className="text-xs text-muted-foreground">
           Refresh data from Admin Panel
         </span>
       </div>
 
       {/* Market Summary */}
       <Card>
         <CardHeader className="pb-3">
           <CardTitle className="text-sm text-foreground flex items-center gap-2">
             <Target className="h-4 w-4" />
             Market Summary
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="text-center p-3 rounded-lg bg-muted/50">
               <p className="text-2xl font-bold text-foreground">{data.totalCompanies}</p>
               <p className="text-xs text-muted-foreground">Companies Tracked</p>
             </div>
             <div className="text-center p-3 rounded-lg bg-muted/50">
               <p className="text-2xl font-bold text-foreground">{formatFundingEur(data.totalFunding)}</p>
               <p className="text-xs text-muted-foreground">Total Funding</p>
             </div>
             <div className="text-center p-3 rounded-lg bg-muted/50">
               <p className="text-2xl font-bold text-foreground">{formatNumber(data.totalEmployees)}</p>
               <p className="text-xs text-muted-foreground">Total Employees</p>
             </div>
             <div className="text-center p-3 rounded-lg bg-muted/50">
               <p className="text-2xl font-bold text-foreground">{data.euCompanies}</p>
               <p className="text-xs text-muted-foreground">EU-Based ({data.euPercentage}%)</p>
             </div>
           </div>
         </CardContent>
       </Card>
 
       {/* Top Strategic Investors */}
       <Card>
         <CardHeader className="pb-3">
           <CardTitle className="text-sm text-foreground flex items-center gap-2">
             <DollarSign className="h-4 w-4" />
             Top Strategic Investors
           </CardTitle>
         </CardHeader>
         <CardContent>
           {data.topInvestors.length === 0 ? (
             <p className="text-sm text-muted-foreground italic">
               No investor data available
             </p>
           ) : (
             <div className="space-y-2">
               {data.topInvestors.slice(0, 10).map((investor, index) => (
                 <div 
                   key={investor.name} 
                   className="flex items-center justify-between py-2 border-b border-border last:border-0"
                 >
                   <div className="flex items-center gap-3">
                     <span className="text-xs text-muted-foreground w-5">{index + 1}.</span>
                     <span className="font-medium text-foreground">{investor.name}</span>
                   </div>
                   <Badge variant="outline" className="text-xs">
                     {investor.count} investment{investor.count > 1 ? 's' : ''}
                   </Badge>
                 </div>
               ))}
             </div>
           )}
         </CardContent>
       </Card>
 
       {/* Geographic Concentration */}
       <Card>
         <CardHeader className="pb-3">
           <CardTitle className="text-sm text-foreground flex items-center gap-2">
             <MapPin className="h-4 w-4" />
             Geographic Concentration
           </CardTitle>
         </CardHeader>
         <CardContent>
           {data.countryDistribution.length === 0 ? (
             <p className="text-sm text-muted-foreground italic">
               No location data available
             </p>
           ) : (
             <div className="space-y-2">
               {data.countryDistribution.slice(0, 8).map((country) => (
                 <div 
                   key={country.country} 
                   className="flex items-center justify-between"
                 >
                   <div className="flex items-center gap-2">
                     <span className="text-foreground font-medium">{country.country}</span>
                   </div>
                   <div className="flex items-center gap-3">
                     <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-primary"
                         style={{ width: `${(country.count / data.totalCompanies) * 100}%` }}
                       />
                     </div>
                     <span className="text-sm text-muted-foreground w-16 text-right">
                       {country.count} ({country.percentage}%)
                     </span>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </CardContent>
       </Card>
 
       {/* Funding Stage Distribution */}
       {data.stageDistribution.length > 0 && (
         <Card>
           <CardHeader className="pb-3">
             <CardTitle className="text-sm text-foreground flex items-center gap-2">
               <TrendingUp className="h-4 w-4" />
               Funding Stage Distribution
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="flex flex-wrap gap-2">
               {data.stageDistribution.map((stage) => (
                 <Badge key={stage.stage} variant="secondary" className="text-xs">
                   {stage.stage}: {stage.count} ({stage.percentage}%)
                 </Badge>
               ))}
             </div>
           </CardContent>
         </Card>
       )}
     </div>
   );
 }