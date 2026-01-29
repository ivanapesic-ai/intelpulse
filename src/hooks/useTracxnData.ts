import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TracxnCompany {
  id: string;
  name: string;
  domain: string;
  description: string;
  foundedYear: number | null;
  location: {
    city: string;
    country: string;
    state?: string;
  };
  employeeCount: number | null;
  totalFunding: {
    amount: number | null;
    currency: string;
  };
  lastFundingRound?: {
    type: string;
    amount: number | null;
    date: string | null;
  };
  investors: string[];
  founders: {
    name: string;
    designation: string;
    linkedin?: string;
  }[];
  feeds: string[];
  status: string;
  logoUrl?: string;
  acquiredBy?: {
    name: string;
    date: string;
  };
}

export interface TracxnSearchResult {
  sector: string;
  totalCount: number;
  companies: TracxnCompany[];
  loading: boolean;
  error: string | null;
}

const parseTracxnCompany = (raw: Record<string, unknown>): TracxnCompany => {
  const description = raw.description as Record<string, string> | undefined;
  const location = raw.location as Record<string, string> | undefined;
  const employeeInfo = raw.employeeInfo as Record<string, unknown> | undefined;
  const fundingInfo = raw.fundingInfo as Record<string, unknown> | undefined;
  const logos = raw.logos as Record<string, string> | undefined;
  const acquirerInfo = raw.acquirerInfo as Record<string, unknown> | undefined;
  const statusInfo = raw.statusInfo as Record<string, unknown> | undefined;

  // Parse founders/employees
  const employeeList = (employeeInfo?.employeeList as Array<Record<string, unknown>>) || [];
  const founders = employeeList
    .filter((e) => e.isFoundingMember)
    .map((e) => ({
      name: (e.name as string) || "Unknown",
      designation: (e.designation as string) || "",
      linkedin: (e.profileLinks as Record<string, string>)?.linkedinHandle,
    }));

  // Parse funding rounds
  const fundingRounds = (fundingInfo?.fundingRoundList as Array<Record<string, unknown>>) || [];
  const latestRound = fundingRounds[0];
  const lastFundingRound = latestRound
    ? {
        type: (latestRound.roundType as string) || "Unknown",
        amount: parseAmount((latestRound.amount as Record<string, unknown>)?.amount),
        date: formatFundingDate(latestRound.date as Record<string, number>),
      }
    : undefined;

  // Parse investors
  const allInvestors: string[] = [];
  fundingRounds.forEach((round) => {
    const investorList = (round.investorList as Array<Record<string, string>>) || [];
    investorList.forEach((inv) => {
      if (inv.name && !allInvestors.includes(inv.name)) {
        allInvestors.push(inv.name);
      }
    });
  });

  // Parse total funding
  const totalFundingRaw = (fundingInfo?.totalFunding as Record<string, unknown>)?.amount;
  const totalFunding = {
    amount: parseAmount(totalFundingRaw),
    currency: "USD",
  };

  // Parse feeds (sectors)
  const feedList = (raw.feedList as Array<Record<string, string>>) || [];
  const feeds = feedList.map((f) => f.name).filter(Boolean);

  // Parse acquisition info
  const acquirerList = (acquirerInfo?.acquirerList as Array<Record<string, unknown>>) || [];
  const latestAcquisition = acquirerList[0];
  const acquiredBy = latestAcquisition
    ? {
        name:
          ((latestAcquisition.acquirers as Array<Record<string, string>>)?.[0]?.name) || "Unknown",
        date: formatFundingDate(latestAcquisition.date as Record<string, number>),
      }
    : undefined;

  return {
    id: (raw.id as string) || (raw.companyId as string) || "",
    name: (raw.name as string) || "Unknown",
    domain: (raw.domain as string) || "",
    description: description?.long || description?.short || "",
    foundedYear: (raw.foundedYear as number) || null,
    location: {
      city: location?.city || "",
      country: location?.country || "",
      state: location?.state,
    },
    employeeCount: (employeeInfo?.employeeCount as number) || null,
    totalFunding,
    lastFundingRound,
    investors: allInvestors.slice(0, 10),
    founders: founders.slice(0, 5),
    feeds,
    status: (statusInfo?.companyStatus as string) || "Active",
    logoUrl: logos?.imageUrl,
    acquiredBy,
  };
};

const parseAmount = (amount: unknown): number | null => {
  if (typeof amount === "number") return amount;
  if (typeof amount === "string") {
    if (amount === "Undisclosed") return null;
    const num = parseFloat(amount.replace(/[^0-9.]/g, ""));
    return isNaN(num) ? null : num;
  }
  return null;
};

const formatFundingDate = (date: Record<string, number> | undefined): string | null => {
  if (!date || !date.year) return null;
  const month = date.month ? String(date.month).padStart(2, "0") : "01";
  const day = date.day ? String(date.day).padStart(2, "0") : "01";
  return `${date.year}-${month}-${day}`;
};

export function useTracxnData() {
  const [results, setResults] = useState<Record<string, TracxnSearchResult>>({});
  const [isLoading, setIsLoading] = useState(false);

  const searchSector = useCallback(async (feedName: string, limit = 50) => {
    setResults((prev) => ({
      ...prev,
      [feedName]: {
        sector: feedName,
        totalCount: 0,
        companies: [],
        loading: true,
        error: null,
      },
    }));

    try {
      const { data, error } = await supabase.functions.invoke("tracxn-sync", {
        body: { action: "search", feedName: [feedName], limit },
      });

      if (error) throw error;

      const companies = (data.companies || []).map(parseTracxnCompany);

      setResults((prev) => ({
        ...prev,
        [feedName]: {
          sector: feedName,
          totalCount: data.totalCount || companies.length,
          companies,
          loading: false,
          error: null,
        },
      }));

      return { success: true, count: companies.length };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Search failed";
      setResults((prev) => ({
        ...prev,
        [feedName]: {
          sector: feedName,
          totalCount: 0,
          companies: [],
          loading: false,
          error: errorMessage,
        },
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const searchMultipleSectors = useCallback(
    async (sectors: string[]) => {
      setIsLoading(true);
      const promises = sectors.map((sector) => searchSector(sector));
      await Promise.all(promises);
      setIsLoading(false);
    },
    [searchSector]
  );

  const getAllCompanies = useCallback(() => {
    return Object.values(results).flatMap((r) => r.companies);
  }, [results]);

  const getStats = useCallback(() => {
    const allCompanies = getAllCompanies();
    const uniqueCountries = new Set(allCompanies.map((c) => c.location.country).filter(Boolean));
    const totalFunding = allCompanies.reduce((sum, c) => sum + (c.totalFunding.amount || 0), 0);
    const uniqueInvestors = new Set(allCompanies.flatMap((c) => c.investors));

    return {
      totalCompanies: allCompanies.length,
      totalSectors: Object.keys(results).length,
      uniqueCountries: uniqueCountries.size,
      totalFunding,
      uniqueInvestors: uniqueInvestors.size,
      acquiredCompanies: allCompanies.filter((c) => c.acquiredBy).length,
    };
  }, [results, getAllCompanies]);

  return {
    results,
    isLoading,
    searchSector,
    searchMultipleSectors,
    getAllCompanies,
    getStats,
  };
}
