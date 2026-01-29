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
import { Target, ExternalLink, Globe } from "lucide-react";

interface TracxnAcquisitionTableProps {
  companies: TracxnCompany[];
}

export function TracxnAcquisitionTable({ companies }: TracxnAcquisitionTableProps) {
  const acquiredCompanies = useMemo(() => {
    return companies
      .filter((c) => c.acquiredBy)
      .sort((a, b) => {
        const dateA = a.acquiredBy?.date || "0";
        const dateB = b.acquiredBy?.date || "0";
        return dateB.localeCompare(dateA);
      });
  }, [companies]);

  // Group by acquirer
  const acquirerStats = useMemo(() => {
    const acquirerMap = new Map<string, { count: number; companies: string[]; totalFunding: number }>();
    acquiredCompanies.forEach((c) => {
      const acquirer = c.acquiredBy?.name || "Unknown";
      const existing = acquirerMap.get(acquirer) || { count: 0, companies: [], totalFunding: 0 };
      existing.count += 1;
      existing.companies.push(c.name);
      existing.totalFunding += c.totalFunding.amount || 0;
      acquirerMap.set(acquirer, existing);
    });
    return Array.from(acquirerMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [acquiredCompanies]);

  if (acquiredCompanies.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No acquired companies in the dataset</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Acquirers */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Top Acquirers</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          {acquirerStats.map((acquirer) => (
            <div
              key={acquirer.name}
              className="p-4 rounded-lg border bg-card hover:border-primary/30 transition-colors"
            >
              <p className="font-semibold text-sm truncate" title={acquirer.name}>
                {acquirer.name}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-2xl font-bold text-primary">{acquirer.count}</span>
                <span className="text-xs text-muted-foreground">acquisitions</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatFundingEur(acquirer.totalFunding)} total raised
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Acquisition Table */}
      <div>
        <h3 className="text-lg font-semibold mb-4">All Acquisitions ({acquiredCompanies.length})</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Company</TableHead>
                <TableHead>Acquired By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Pre-Acquisition Funding</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Sectors</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {acquiredCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {company.logoUrl ? (
                        <img
                          src={company.logoUrl}
                          alt=""
                          className="h-6 w-6 rounded object-contain bg-muted"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-600">
                          {company.name.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium truncate max-w-[140px]">{company.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-600">
                      {company.acquiredBy?.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {company.acquiredBy?.date || "Unknown"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {company.totalFunding.amount
                      ? formatFundingEur(company.totalFunding.amount)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {company.location.city && `${company.location.city}, `}
                    {company.location.country}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {company.feeds.slice(0, 2).map((feed) => (
                        <Badge key={feed} variant="outline" className="text-xs">
                          {feed.length > 12 ? feed.substring(0, 12) + "…" : feed}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {company.domain && (
                      <a
                        href={`https://${company.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
