import { Building2, Globe, DollarSign, Briefcase, TrendingUp, Target, Users } from "lucide-react";
import { StatCard } from "@/components/mockups/StatCard";
import { formatFundingEur } from "@/types/database";

interface TracxnStats {
  totalCompanies: number;
  totalSectors: number;
  uniqueCountries: number;
  totalFunding: number;
  uniqueInvestors: number;
  acquiredCompanies: number;
  totalFounders: number;
}

interface TracxnStatsCardsProps {
  stats: TracxnStats;
}

export function TracxnStatsCards({ stats }: TracxnStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      <StatCard
        title="Companies"
        value={stats.totalCompanies}
        icon={Building2}
      />
      <StatCard
        title="Sectors"
        value={stats.totalSectors}
        subtitle="Active"
        icon={Target}
      />
      <StatCard
        title="Countries"
        value={stats.uniqueCountries}
        icon={Globe}
      />
      <StatCard
        title="Total Funding"
        value={formatFundingEur(stats.totalFunding)}
        icon={DollarSign}
      />
      <StatCard
        title="Investors"
        value={stats.uniqueInvestors}
        subtitle="Unique"
        icon={Briefcase}
      />
      <StatCard
        title="Acquired"
        value={stats.acquiredCompanies}
        subtitle="Companies"
        icon={TrendingUp}
      />
      <StatCard
        title="Founders"
        value={stats.totalFounders}
        subtitle="Key People"
        icon={Users}
      />
    </div>
  );
}
