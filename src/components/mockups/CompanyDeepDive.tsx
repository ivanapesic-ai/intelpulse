import { useState, useMemo } from "react";
import { ExternalLink, Building2, Users, DollarSign, MapPin, Calendar, Search, ChevronDown, ChevronUp, TrendingUp, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatFundingEur, formatNumber } from "@/types/database";
import { useCompaniesForTechnology, type CompanyForTechnology } from "@/hooks/useCompaniesForTechnology";

interface CompanyDeepDiveProps {
  keywordId?: string;
  technologyName: string;
}

type SortField = "funding" | "employees" | "founded" | "name";
type SortDirection = "asc" | "desc";

export function CompanyDeepDive({ keywordId, technologyName }: CompanyDeepDiveProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("funding");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

  const { data: companies, isLoading, error } = useCompaniesForTechnology(keywordId);

  const countries = useMemo(() => {
    if (!companies) return [];
    const uniqueCountries = [...new Set(companies.map(c => c.hqCountry).filter(Boolean))];
    return uniqueCountries.sort();
  }, [companies]);

  const filteredAndSortedCompanies = useMemo(() => {
    if (!companies) return [];

    return companies
      .filter((company) => {
        const matchesSearch =
          company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.tagline?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCountry = !countryFilter || company.hqCountry === countryFilter;
        return matchesSearch && matchesCountry;
      })
      .sort((a, b) => {
        const direction = sortDirection === "asc" ? 1 : -1;
        switch (sortField) {
          case "funding":
            return (a.totalFundingEur - b.totalFundingEur) * direction;
          case "employees":
            return (a.employeesCount - b.employeesCount) * direction;
          case "founded":
            return ((a.foundedYear || 0) - (b.foundedYear || 0)) * direction;
          case "name":
            return a.name.localeCompare(b.name) * direction;
          default:
            return 0;
        }
      });
  }, [companies, searchQuery, countryFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getStatusBadge = (company: CompanyForTechnology) => {
    if (company.acquiredBy) {
      return (
        <Badge variant="secondary" className="text-xs">
          Acquired by {company.acquiredBy}
        </Badge>
      );
    }
    if (company.growthStage) {
      return (
        <Badge variant="outline" className="text-xs capitalize">
          {company.growthStage}
        </Badge>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error loading companies: {error.message}</p>
      </div>
    );
  }

  if (!companies || companies.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No companies linked to {technologyName} yet.</p>
        <p className="text-sm mt-2">Run Dealroom sync to populate company data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="h-10 text-sm rounded border border-border bg-background px-3 text-foreground"
        >
          <option value="">All Countries</option>
          {countries.map((country) => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
      </div>

      {/* Sort buttons */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground self-center">Sort by:</span>
        {([
          { field: "funding", label: "Funding" },
          { field: "employees", label: "Employees" },
          { field: "founded", label: "Founded" },
          { field: "name", label: "Name" },
        ] as const).map(({ field, label }) => (
          <Button
            key={field}
            variant={sortField === field ? "secondary" : "ghost"}
            size="sm"
            onClick={() => handleSort(field)}
            className="gap-1"
          >
            {label}
            {sortField === field && (
              sortDirection === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
            )}
          </Button>
        ))}
      </div>

      {/* Results summary */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredAndSortedCompanies.length} of {companies.length} companies
      </p>

      {/* Company list */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {filteredAndSortedCompanies.map((company) => (
          <Card 
            key={company.id}
            className={`cursor-pointer transition-colors hover:border-primary/50 ${
              expandedCompany === company.id ? "border-primary" : ""
            }`}
            onClick={() => setExpandedCompany(expandedCompany === company.id ? null : company.id)}
          >
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-foreground truncate">{company.name}</h4>
                    {getStatusBadge(company)}
                  </div>
                  {company.tagline && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {company.tagline}
                    </p>
                  )}
                </div>
                
                {company.website && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(company.website, "_blank");
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium text-foreground">
                    {formatFundingEur(company.totalFundingEur)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="font-medium text-foreground">
                    {formatNumber(company.employeesCount)}
                  </span>
                </div>
                {company.hqCountry && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{company.hqCity ? `${company.hqCity}, ` : ""}{company.hqCountry}</span>
                  </div>
                )}
                {company.foundedYear && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{company.foundedYear}</span>
                  </div>
                )}
              </div>

              {/* Expanded view */}
              {expandedCompany === company.id && (
                <div className="mt-4 pt-4 border-t border-border">
                  {company.industries && company.industries.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-2">Industries</p>
                      <div className="flex flex-wrap gap-1">
                        {company.industries.slice(0, 5).map((industry) => (
                          <Badge key={industry} variant="outline" className="text-xs">
                            {industry}
                          </Badge>
                        ))}
                        {company.industries.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{company.industries.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {company.website && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(company.website, "_blank");
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Website
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://dealroom.co/companies/${company.dealroomId}`, "_blank");
                      }}
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Dealroom
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
