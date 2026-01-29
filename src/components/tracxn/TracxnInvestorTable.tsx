import { useMemo } from "react";
import { TracxnCompany } from "@/hooks/useTracxnData";
import { formatFundingEur } from "@/types/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TracxnInvestorTableProps {
  companies: TracxnCompany[];
}

interface InvestorData {
  name: string;
  portfolioCount: number;
  totalFunding: number;
  sectors: string[];
  companies: string[];
}

export function TracxnInvestorTable({ companies }: TracxnInvestorTableProps) {
  const investorData = useMemo(() => {
    const investorMap = new Map<string, InvestorData>();

    companies.forEach((company) => {
      company.investors.forEach((investor) => {
        const existing = investorMap.get(investor) || {
          name: investor,
          portfolioCount: 0,
          totalFunding: 0,
          sectors: [],
          companies: [],
        };

        existing.portfolioCount += 1;
        existing.totalFunding += company.totalFunding.amount || 0;
        existing.companies.push(company.name);

        company.feeds.forEach((feed) => {
          if (!existing.sectors.includes(feed)) {
            existing.sectors.push(feed);
          }
        });

        investorMap.set(investor, existing);
      });
    });

    return Array.from(investorMap.values())
      .sort((a, b) => b.portfolioCount - a.portfolioCount)
      .slice(0, 50);
  }, [companies]);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Investor</TableHead>
            <TableHead className="text-right">Portfolio Count</TableHead>
            <TableHead className="text-right">Total Funding</TableHead>
            <TableHead>Sectors</TableHead>
            <TableHead>Companies</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {investorData.map((investor) => (
            <TableRow key={investor.name}>
              <TableCell className="font-medium">{investor.name}</TableCell>
              <TableCell className="text-right text-lg font-bold text-primary">
                {investor.portfolioCount}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {formatFundingEur(investor.totalFunding)}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {investor.sectors.slice(0, 3).map((sector) => (
                    <Badge key={sector} variant="outline" className="text-xs">
                      {sector.length > 12 ? sector.substring(0, 12) + "…" : sector}
                    </Badge>
                  ))}
                  {investor.sectors.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{investor.sectors.length - 3}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1 max-w-[300px]">
                  {investor.companies.slice(0, 3).map((company) => (
                    <Badge key={company} variant="secondary" className="text-xs">
                      {company.length > 15 ? company.substring(0, 15) + "…" : company}
                    </Badge>
                  ))}
                  {investor.companies.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{investor.companies.length - 3} more
                    </Badge>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
