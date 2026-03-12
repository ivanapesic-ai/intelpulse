 import { motion } from "framer-motion";
 import { TrendingUp, Users, Building2, Shield, Target, Zap, Banknote, BarChart3 } from "lucide-react";
 import { cn } from "@/lib/utils";
 import { formatFundingEur, formatNumber } from "@/types/database";
 
 interface KPIData {
   totalMarketValue: number;
   totalCompanies: number;
   totalEmployees: number;
   avgMaturity: number;
   highOpportunity: number;
   severeChallenge: number;
   euConcentration: number;
   patentsCovered: number;
 }
 
 interface InvestorKPICardsProps {
   data: KPIData;
   isLoading?: boolean;
 }
 
 export function InvestorKPICards({ data, isLoading }: InvestorKPICardsProps) {
   const cards = [
     {
       title: "Total Market Value",
       value: formatFundingEur(data.totalMarketValue),
       subtitle: "Aggregate funding raised",
       icon: Banknote,
       color: "from-emerald-500 to-emerald-600",
       bgColor: "bg-emerald-500/10",
       trend: "+12% YoY",
       trendUp: true,
     },
     {
       title: "Active Companies",
       value: formatNumber(data.totalCompanies),
       subtitle: "In tracked technologies",
       icon: Building2,
       color: "from-blue-500 to-blue-600",
       bgColor: "bg-blue-500/10",
       trend: `${data.euConcentration}% EU-based`,
       trendUp: true,
     },
     {
       title: "Market Size (Employees)",
       value: formatNumber(data.totalEmployees),
       subtitle: "Combined workforce",
       icon: Users,
       color: "from-purple-500 to-purple-600",
       bgColor: "bg-purple-500/10",
       trend: "Adoption indicator",
       trendUp: true,
     },
     {
       title: "Avg Maturity Score",
       value: `${data.avgMaturity.toFixed(1)}/2`,
       subtitle: "Technology readiness",
       icon: BarChart3,
       color: "from-cyan-500 to-cyan-600",
       bgColor: "bg-cyan-500/10",
       trend: data.avgMaturity >= 1.5 ? "Market ready" : "Emerging",
       trendUp: data.avgMaturity >= 1,
     },
     {
       title: "Quick Wins",
       value: data.highOpportunity.toString(),
       subtitle: "High opportunity techs",
       icon: Target,
       color: "from-green-500 to-green-600",
       bgColor: "bg-green-500/10",
       trend: "Actionable now",
       trendUp: true,
     },
     {
       title: "Risk Factors",
       value: data.severeChallenge.toString(),
       subtitle: "Severe challenge techs",
       icon: Shield,
       color: "from-amber-500 to-orange-500",
       bgColor: "bg-amber-500/10",
       trend: "Needs attention",
       trendUp: false,
     },
   ];
 
   return (
     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
       {cards.map((card, index) => (
         <motion.div
           key={card.title}
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: index * 0.05 }}
           className={cn(
             "relative overflow-hidden rounded-xl border border-border p-4",
             card.bgColor
           )}
         >
           {/* Gradient accent */}
           <div className={cn(
             "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
             card.color
           )} />
           
           <div className="flex items-start justify-between mb-2">
             <card.icon className="h-5 w-5 text-muted-foreground" />
             <span className={cn(
               "text-xs font-medium",
               card.trendUp ? "text-emerald-500" : "text-amber-500"
             )}>
               {card.trend}
             </span>
           </div>
           
           <div className="space-y-1">
             <p className="text-2xl font-bold text-foreground">{card.value}</p>
             <p className="text-xs text-muted-foreground">{card.subtitle}</p>
           </div>
         </motion.div>
       ))}
     </div>
   );
 }