import { motion } from "framer-motion";
import { Building2, Banknote, FileText, Layers, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DomainOverview, formatCompactNumber } from "@/hooks/useDomainHierarchy";

interface HierarchyKPICardsProps {
  domains: DomainOverview[];
  totalKeywords: number;
}

export function HierarchyKPICards({ domains, totalKeywords }: HierarchyKPICardsProps) {
  const totalCompanies = domains.reduce((sum, d) => sum + d.companyCount, 0);
  const totalFunding = domains.reduce((sum, d) => sum + d.totalFundingUsd, 0);
  const totalPatents = domains.reduce((sum, d) => sum + d.totalPatents, 0);
  const strategicCount = domains.filter(d => d.strategicQuadrant === "Strategic Investment").length;
  const highRiskCount = domains.filter(d => d.strategicQuadrant === "High-Risk High-Reward").length;

  const kpis = [
    {
      label: "Companies",
      value: totalCompanies.toLocaleString(),
      icon: Building2,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Total Funding",
      value: formatCompactNumber(totalFunding),
      icon: Banknote,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Patents",
      value: totalPatents.toLocaleString(),
      icon: FileText,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Keywords",
      value: totalKeywords.toString(),
      icon: Layers,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Strategic",
      value: strategicCount.toString(),
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "High-Risk",
      value: highRiskCount.toString(),
      icon: AlertTriangle,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpis.map((kpi, index) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="h-full">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className={cn("p-2 rounded-lg", kpi.bgColor)}>
                  <kpi.icon className={cn("h-4 w-4", kpi.color)} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
