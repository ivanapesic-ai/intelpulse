import { useMemo } from "react";
import { TracxnCompany } from "@/hooks/useTracxnData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatFundingEur } from "@/types/database";

interface TracxnChartsProps {
  companies: TracxnCompany[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00C49F",
];

export function TracxnCharts({ companies }: TracxnChartsProps) {
  // Funding by Sector
  const fundingBySector = useMemo(() => {
    const sectorMap = new Map<string, number>();
    companies.forEach((c) => {
      c.feeds.forEach((feed) => {
        const current = sectorMap.get(feed) || 0;
        sectorMap.set(feed, current + (c.totalFunding.amount || 0));
      });
    });
    return Array.from(sectorMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [companies]);

  // Companies by Country
  const companiesByCountry = useMemo(() => {
    const countryMap = new Map<string, number>();
    companies.forEach((c) => {
      const country = c.location.country || "Unknown";
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });
    return Array.from(countryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [companies]);

  // Top Investors
  const topInvestors = useMemo(() => {
    const investorMap = new Map<string, number>();
    companies.forEach((c) => {
      c.investors.forEach((inv) => {
        investorMap.set(inv, (investorMap.get(inv) || 0) + 1);
      });
    });
    return Array.from(investorMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [companies]);

  // Founded Year Distribution
  const foundedYearDistribution = useMemo(() => {
    const yearMap = new Map<number, number>();
    companies.forEach((c) => {
      if (c.foundedYear && c.foundedYear >= 2010) {
        yearMap.set(c.foundedYear, (yearMap.get(c.foundedYear) || 0) + 1);
      }
    });
    return Array.from(yearMap.entries())
      .map(([year, count]) => ({ year: year.toString(), count }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [companies]);

  // Acquisition Status
  const acquisitionStatus = useMemo(() => {
    const acquired = companies.filter((c) => c.acquiredBy).length;
    const active = companies.length - acquired;
    return [
      { name: "Active", value: active },
      { name: "Acquired", value: acquired },
    ];
  }, [companies]);

  // Treemap for Sector Company Counts
  const sectorTreemap = useMemo(() => {
    const sectorMap = new Map<string, { count: number; funding: number }>();
    companies.forEach((c) => {
      c.feeds.forEach((feed) => {
        const current = sectorMap.get(feed) || { count: 0, funding: 0 };
        sectorMap.set(feed, {
          count: current.count + 1,
          funding: current.funding + (c.totalFunding.amount || 0),
        });
      });
    });
    return Array.from(sectorMap.entries())
      .map(([name, data]) => ({
        name,
        size: data.count,
        funding: data.funding,
      }))
      .sort((a, b) => b.size - a.size);
  }, [companies]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm">{label}</p>
          <p className="text-primary text-sm">{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  const FundingTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm">{label}</p>
          <p className="text-primary text-sm">{formatFundingEur(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Funding by Sector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funding by Sector</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fundingBySector} layout="vertical">
              <XAxis type="number" tickFormatter={(v) => formatFundingEur(v)} fontSize={10} />
              <YAxis type="category" dataKey="name" width={120} fontSize={11} />
              <Tooltip content={<FundingTooltip />} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Companies by Country */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Companies by Country</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={companiesByCountry}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
                fontSize={10}
              >
                {companiesByCountry.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Investors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Investors (by portfolio count)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topInvestors} layout="vertical">
              <XAxis type="number" fontSize={10} />
              <YAxis type="category" dataKey="name" width={140} fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Founded Year Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Companies by Founded Year</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={foundedYearDistribution}>
              <XAxis dataKey="year" fontSize={10} />
              <YAxis fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Acquisition Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acquisition Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={acquisitionStatus}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
              >
                <Cell fill="hsl(var(--chart-2))" />
                <Cell fill="hsl(var(--chart-4))" />
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sector Treemap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sector Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sectorTreemap.slice(0, 8)} layout="vertical">
              <XAxis type="number" fontSize={10} />
              <YAxis type="category" dataKey="name" width={120} fontSize={11} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="size" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
