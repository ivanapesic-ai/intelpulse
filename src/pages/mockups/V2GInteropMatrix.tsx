import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { PlatformFooter } from "@/components/mockups/PlatformFooter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatFundingUsd } from "@/types/database";
import { BookOpen, Building2, Newspaper, FileText, TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";

// The 4 V2G/charging keyword IDs from our taxonomy
const V2G_KEYWORD_IDS = [
  '78a385d0-ca18-4367-bdd1-895cbf344096', // Vehicle to Grid
  '4c641930-edf8-48f6-a6f5-e766ca6262ad', // EV Charging
  '3a7c5579-29e3-4191-a65e-e0072ef0f115', // Bidirectional Charging
  'cfeb162f-9076-452d-92c0-08fe3c6a5a7b', // Smart Recharging
];

function useV2GStandards() {
  return useQuery({
    queryKey: ['v2g-standards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('keyword_standards')
        .select('*, technology_keywords!keyword_standards_keyword_id_fkey(display_name)')
        .in('keyword_id', V2G_KEYWORD_IDS)
        .order('issuing_body');
      if (error) throw error;
      return data;
    },
  });
}

function useV2GCompanies() {
  return useQuery({
    queryKey: ['v2g-companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crunchbase_keyword_mapping')
        .select('*, crunchbase_companies!crunchbase_keyword_mapping_company_id_fkey(organization_name, hq_country, total_funding_usd, number_of_employees, patents_count, website, industries), technology_keywords!crunchbase_keyword_mapping_keyword_id_fkey(display_name)')
        .in('keyword_id', V2G_KEYWORD_IDS)
        .order('match_confidence', { ascending: false });
      if (error) throw error;
      // Deduplicate companies, keeping the first occurrence
      const seen = new Set<string>();
      return data?.filter(row => {
        const companyId = row.company_id;
        if (!companyId || seen.has(companyId)) return false;
        seen.add(companyId);
        return true;
      }) ?? [];
    },
  });
}

function useV2GNews() {
  return useQuery({
    queryKey: ['v2g-news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_keyword_matches')
        .select('*, news_items!news_keyword_matches_news_id_fkey(title, url, published_at, source_name), technology_keywords!news_keyword_matches_keyword_id_fkey(display_name)')
        .in('keyword_id', V2G_KEYWORD_IDS)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
}

function useV2GResearch() {
  return useQuery({
    queryKey: ['v2g-research'],
    queryFn: async () => {
      // Get latest snapshot per keyword
      const { data, error } = await supabase
        .from('research_signals')
        .select('*, technology_keywords!research_signals_keyword_id_fkey(display_name)')
        .in('keyword_id', V2G_KEYWORD_IDS)
        .order('snapshot_date', { ascending: false });
      if (error) throw error;
      // Keep only latest per keyword
      const seen = new Set<string>();
      return data?.filter(row => {
        if (seen.has(row.keyword_id)) return false;
        seen.add(row.keyword_id);
        return true;
      }) ?? [];
    },
  });
}

function GrowthBadge({ rate }: { rate: number | null }) {
  if (rate === null) return <Minus className="h-3 w-3 text-muted-foreground" />;
  if (rate > 0) return (
    <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
      <TrendingUp className="h-3 w-3" /> +{rate.toFixed(1)}%
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-red-400 text-xs">
      <TrendingDown className="h-3 w-3" /> {rate.toFixed(1)}%
    </span>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
    </div>
  );
}

export default function V2GInteropMatrix() {
  const standards = useV2GStandards();
  const companies = useV2GCompanies();
  const news = useV2GNews();
  const research = useV2GResearch();

  // Group standards by issuing body
  const standardsByBody = (standards.data ?? []).reduce<Record<string, typeof standards.data>>((acc, s) => {
    const body = s.issuing_body;
    if (!acc[body]) acc[body] = [];
    acc[body]!.push(s);
    return acc;
  }, {});

  const totalCompanies = companies.data?.length ?? 0;
  const totalStandards = standards.data?.length ?? 0;
  const totalNews = news.data?.length ?? 0;
  const totalResearchWorks = research.data?.reduce((sum, r) => sum + (r.total_works ?? 0), 0) ?? 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PlatformHeader />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">Live Data</Badge>
            <Badge variant="outline" className="text-xs">V2G Ecosystem</Badge>
          </div>
          <h1 className="text-3xl font-bold text-foreground mt-2">
            V2G Charging — Standards & Ecosystem Overview
          </h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Real-time view of interoperability standards, companies, research signals, and news coverage across Vehicle-to-Grid, EV Charging, Bidirectional Charging, and Smart Recharging.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{totalStandards}</p>
                <p className="text-xs text-muted-foreground">Standards</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{totalCompanies}</p>
                <p className="text-xs text-muted-foreground">Companies</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{totalResearchWorks.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Research Works</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <Newspaper className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{totalNews}</p>
                <p className="text-xs text-muted-foreground">News Articles</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="standards" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="standards" className="gap-1.5"><FileText className="h-3.5 w-3.5" />Standards ({totalStandards})</TabsTrigger>
            <TabsTrigger value="companies" className="gap-1.5"><Building2 className="h-3.5 w-3.5" />Companies ({totalCompanies})</TabsTrigger>
            <TabsTrigger value="research" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" />Research</TabsTrigger>
            <TabsTrigger value="news" className="gap-1.5"><Newspaper className="h-3.5 w-3.5" />News ({totalNews})</TabsTrigger>
          </TabsList>

          {/* Standards Tab */}
          <TabsContent value="standards">
            {standards.isLoading ? <LoadingState /> : (
              <div className="space-y-4">
                {Object.entries(standardsByBody).map(([body, items]) => (
                  <Card key={body} className="border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{body}</CardTitle>
                      <CardDescription>{items?.length} standard{items?.length !== 1 ? 's' : ''}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-36">Code</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead className="hidden md:table-cell">Keyword</TableHead>
                            <TableHead className="w-28">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items?.map(s => (
                            <TableRow key={s.id}>
                              <TableCell className="font-mono text-sm font-medium text-foreground">{s.standard_code}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{s.standard_title}</TableCell>
                              <TableCell className="hidden md:table-cell">
                                <Badge variant="secondary" className="text-xs">
                                  {(s as any).technology_keywords?.display_name ?? '—'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs capitalize">{s.status ?? 'active'}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies">
            {companies.isLoading ? <LoadingState /> : (
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Companies in V2G / Charging Ecosystem</CardTitle>
                  <CardDescription>{totalCompanies} companies mapped via Crunchbase</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company</TableHead>
                          <TableHead className="hidden sm:table-cell">Country</TableHead>
                          <TableHead>Funding</TableHead>
                          <TableHead className="hidden md:table-cell">Employees</TableHead>
                          <TableHead className="hidden lg:table-cell">Keyword</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {companies.data?.slice(0, 100).map(row => {
                          const c = (row as any).crunchbase_companies;
                          if (!c) return null;
                          return (
                            <TableRow key={row.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm text-foreground">{c.organization_name}</span>
                                  {c.website && (
                                    <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{c.hq_country ?? '—'}</TableCell>
                              <TableCell className="text-sm font-medium text-foreground">
                                {c.total_funding_usd ? formatFundingUsd(Number(c.total_funding_usd)) : '—'}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{c.number_of_employees ?? '—'}</TableCell>
                              <TableCell className="hidden lg:table-cell">
                                <Badge variant="secondary" className="text-xs">
                                  {(row as any).technology_keywords?.display_name ?? '—'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Research Tab */}
          <TabsContent value="research">
            {research.isLoading ? <LoadingState /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {research.data?.map(r => (
                  <Card key={r.id} className="border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        {(r as any).technology_keywords?.display_name ?? '—'}
                        <GrowthBadge rate={r.growth_rate_yoy} />
                      </CardTitle>
                      <CardDescription>OpenAlex research signals · {r.snapshot_date}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Works</p>
                          <p className="text-xl font-bold text-foreground">{(r.total_works ?? 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Last 2 Years</p>
                          <p className="text-xl font-bold text-foreground">{(r.works_last_2y ?? 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Citations</p>
                          <p className="text-xl font-bold text-foreground">{(r.citation_count ?? 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">h-index</p>
                          <p className="text-xl font-bold text-foreground">{r.h_index ?? 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* News Tab */}
          <TabsContent value="news">
            {news.isLoading ? <LoadingState /> : (
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Recent News Coverage</CardTitle>
                  <CardDescription>Latest {totalNews} articles mentioning V2G/charging keywords</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Article</TableHead>
                        <TableHead className="hidden md:table-cell">Source</TableHead>
                        <TableHead className="hidden sm:table-cell">Keyword</TableHead>
                        <TableHead className="w-28">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {news.data?.map(row => {
                        const article = (row as any).news_items;
                        if (!article) return null;
                        return (
                          <TableRow key={row.id}>
                            <TableCell>
                              <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2">
                                {article.title}
                              </a>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{article.source_name ?? '—'}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge variant="secondary" className="text-xs">
                                {(row as any).technology_keywords?.display_name ?? '—'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {article.published_at ? new Date(article.published_at).toLocaleDateString() : '—'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <PlatformFooter />
    </div>
  );
}
