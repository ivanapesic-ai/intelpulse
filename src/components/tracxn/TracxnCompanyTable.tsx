import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ExternalLink,
  Users,
  Briefcase,
  TrendingUp,
  Target,
  Globe,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";

interface TracxnCompanyTableProps {
  companies: TracxnCompany[];
}

type SortKey = "name" | "country" | "funding" | "employees" | "founded" | "investors";
type SortDirection = "asc" | "desc";

export function TracxnCompanyTable({ companies }: TracxnCompanyTableProps) {
  const [selectedCompany, setSelectedCompany] = useState<TracxnCompany | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("funding");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const sortedCompanies = [...companies].sort((a, b) => {
    let comparison = 0;
    switch (sortKey) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "country":
        comparison = a.location.country.localeCompare(b.location.country);
        break;
      case "funding":
        comparison = (a.totalFunding.amount || 0) - (b.totalFunding.amount || 0);
        break;
      case "employees":
        comparison = (a.employeeCount || 0) - (b.employeeCount || 0);
        break;
      case "founded":
        comparison = (a.foundedYear || 0) - (b.foundedYear || 0);
        break;
      case "investors":
        comparison = a.investors.length - b.investors.length;
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const SortHeader = ({ column, label }: { column: SortKey; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 hover:bg-transparent"
      onClick={() => handleSort(column)}
    >
      {label}
      {sortKey === column ? (
        sortDirection === "asc" ? (
          <ChevronUp className="ml-1 h-4 w-4" />
        ) : (
          <ChevronDown className="ml-1 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
      )}
    </Button>
  );

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">
                <SortHeader column="name" label="Company" />
              </TableHead>
              <TableHead>
                <SortHeader column="country" label="Location" />
              </TableHead>
              <TableHead className="text-right">
                <SortHeader column="funding" label="Total Funding" />
              </TableHead>
              <TableHead className="text-right">
                <SortHeader column="employees" label="Employees" />
              </TableHead>
              <TableHead className="text-right">
                <SortHeader column="investors" label="Investors" />
              </TableHead>
              <TableHead className="text-center">
                <SortHeader column="founded" label="Founded" />
              </TableHead>
              <TableHead>Sectors</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCompanies.map((company) => (
              <TableRow
                key={company.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedCompany(company)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt=""
                        className="h-6 w-6 rounded object-contain bg-muted"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {company.name.charAt(0)}
                      </div>
                    )}
                    <span className="truncate max-w-[180px]">{company.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {company.location.city && `${company.location.city}, `}
                    {company.location.country}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {company.totalFunding.amount
                    ? formatFundingEur(company.totalFunding.amount)
                    : "—"}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {company.employeeCount || "—"}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {company.investors.length || "—"}
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {company.foundedYear || "—"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {company.feeds.slice(0, 2).map((feed) => (
                      <Badge key={feed} variant="outline" className="text-xs">
                        {feed.length > 15 ? feed.substring(0, 15) + "…" : feed}
                      </Badge>
                    ))}
                    {company.feeds.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{company.feeds.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {company.acquiredBy ? (
                    <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-600">
                      Acquired
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-green-600">
                      Active
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedCompany} onOpenChange={() => setSelectedCompany(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedCompany && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {selectedCompany.logoUrl ? (
                    <img
                      src={selectedCompany.logoUrl}
                      alt=""
                      className="h-10 w-10 rounded-lg object-contain bg-muted"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                      {selectedCompany.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <span>{selectedCompany.name}</span>
                    <p className="text-sm font-normal text-muted-foreground mt-0.5">
                      {selectedCompany.location.city}, {selectedCompany.location.country}
                      {selectedCompany.foundedYear && ` • Founded ${selectedCompany.foundedYear}`}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                <p className="text-sm text-muted-foreground">{selectedCompany.description}</p>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xl font-bold">
                      {selectedCompany.totalFunding.amount
                        ? formatFundingEur(selectedCompany.totalFunding.amount)
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Funding</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xl font-bold">{selectedCompany.employeeCount || "—"}</p>
                    <p className="text-xs text-muted-foreground">Employees</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xl font-bold">{selectedCompany.investors.length}</p>
                    <p className="text-xs text-muted-foreground">Investors</p>
                  </div>
                </div>

                {selectedCompany.founders.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Founders & Key People
                    </h4>
                    <div className="grid gap-2">
                      {selectedCompany.founders.map((founder, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-2"
                        >
                          <div>
                            <p className="font-medium">{founder.name}</p>
                            <p className="text-xs text-muted-foreground">{founder.designation}</p>
                          </div>
                          {founder.linkedin && (
                            <a
                              href={founder.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCompany.investors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      Investors
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedCompany.investors.map((investor) => (
                        <Badge key={investor} variant="secondary" className="text-xs">
                          {investor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCompany.lastFundingRound && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Last Funding Round
                    </h4>
                    <div className="text-sm bg-muted/50 rounded-lg px-3 py-2">
                      <p>
                        <span className="font-medium">{selectedCompany.lastFundingRound.type}</span>
                        {selectedCompany.lastFundingRound.amount && (
                          <span> – {formatFundingEur(selectedCompany.lastFundingRound.amount)}</span>
                        )}
                      </p>
                      {selectedCompany.lastFundingRound.date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedCompany.lastFundingRound.date}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {selectedCompany.acquiredBy && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Acquisition
                    </h4>
                    <div className="text-sm bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg px-3 py-2">
                      <p>
                        Acquired by <span className="font-medium">{selectedCompany.acquiredBy.name}</span>
                      </p>
                      {selectedCompany.acquiredBy.date && (
                        <p className="text-xs opacity-80 mt-1">{selectedCompany.acquiredBy.date}</p>
                      )}
                    </div>
                  </div>
                )}

                {selectedCompany.domain && (
                  <a
                    href={`https://${selectedCompany.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    {selectedCompany.domain}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
