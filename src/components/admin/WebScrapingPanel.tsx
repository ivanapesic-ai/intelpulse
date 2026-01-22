import { useState } from 'react';
import { Globe, RefreshCw, CheckCircle, XCircle, Clock, ExternalLink, FileText, Zap, Newspaper, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWebScrapeLogs, useScrapedContent, useWebScrapingStats, useScrapeWebsite } from '@/hooks/useWebScraping';
import { useFetchNews, useFetchPatents } from '@/hooks/useExternalData';

const statusColors: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground border-muted',
  running: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  completed: 'bg-success/20 text-success border-success/30',
  failed: 'bg-destructive/20 text-destructive border-destructive/30',
};

const websiteLabels = {
  ceisphere: 'CEI-Sphere',
  eucloudedgeiot: 'EUCloudEdgeIoT',
};

export function WebScrapingPanel() {
  const [selectedWebsite, setSelectedWebsite] = useState<'ceisphere' | 'eucloudedgeiot'>('ceisphere');
  const [selectedType, setSelectedType] = useState<'publications' | 'news' | 'projects' | 'all'>('all');

  const { data: logs, isLoading: logsLoading } = useWebScrapeLogs(5);
  const { data: content } = useScrapedContent();
  const { data: stats } = useWebScrapingStats();
  const scrapeWebsite = useScrapeWebsite();
  const fetchNews = useFetchNews();
  const fetchPatents = useFetchPatents();

  const handleScrape = () => {
    scrapeWebsite.mutate({ website: selectedWebsite, scrapeType: selectedType });
  };

  const isRunning = logs?.some(l => l.status === 'running') || scrapeWebsite.isPending;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pages</p>
                <p className="text-2xl font-bold text-foreground">{stats?.totalPages || 0}</p>
              </div>
              <Globe className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CEI-Sphere</p>
                <p className="text-2xl font-bold text-foreground">{stats?.ceiSpherePages || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">EUCloudEdgeIoT</p>
                <p className="text-2xl font-bold text-foreground">{stats?.euCloudPages || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tech Mentions</p>
                <p className="text-2xl font-bold text-foreground">{stats?.totalMentions || 0}</p>
              </div>
              <Zap className="h-8 w-8 text-amber-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* External Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Zap className="h-5 w-5" />
            External Data Sources
          </CardTitle>
          <CardDescription>
            Fetch tech news from HackerNews and patent data from EPO
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* HackerNews */}
            <div className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-full bg-orange-500/10">
                  <Newspaper className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">HackerNews</h4>
                  <p className="text-xs text-muted-foreground">Free API • Tech news</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Search recent tech news from HackerNews for each technology keyword.
              </p>
              <Button 
                onClick={() => fetchNews.mutate({})} 
                disabled={fetchNews.isPending}
                className="w-full"
                variant="outline"
              >
                <Newspaper className={`h-4 w-4 mr-2 ${fetchNews.isPending ? 'animate-pulse' : ''}`} />
                {fetchNews.isPending ? 'Fetching News...' : 'Fetch HackerNews'}
              </Button>
            </div>

            {/* EPO Patents */}
            <div className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-full bg-blue-500/10">
                  <ScrollText className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">EPO Patents</h4>
                  <p className="text-xs text-muted-foreground">Free API • EU patents</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Search European Patent Office for patent counts per technology.
              </p>
              <Button 
                onClick={() => fetchPatents.mutate({})} 
                disabled={fetchPatents.isPending}
                className="w-full"
                variant="outline"
              >
                <ScrollText className={`h-4 w-4 mr-2 ${fetchPatents.isPending ? 'animate-pulse' : ''}`} />
                {fetchPatents.isPending ? 'Fetching Patents...' : 'Fetch Patents'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scrape Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Website Scraper
          </CardTitle>
          <CardDescription>
            Extract technology insights from CEI-Sphere and EUCloudEdgeIoT websites
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Website</label>
              <Select value={selectedWebsite} onValueChange={(v) => setSelectedWebsite(v as any)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ceisphere">CEI-Sphere</SelectItem>
                  <SelectItem value="eucloudedgeiot">EUCloudEdgeIoT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Content Type</label>
              <Select value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Content</SelectItem>
                  <SelectItem value="publications">Publications</SelectItem>
                  <SelectItem value="news">News & Updates</SelectItem>
                  <SelectItem value="projects">Project Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleScrape} disabled={isRunning}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Scraping...' : 'Start Scrape'}
            </Button>
          </div>

          {isRunning && (
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <div className="flex items-center gap-2 text-blue-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">
                  Scraping {websiteLabels[selectedWebsite]}... This may take a few minutes.
                </span>
              </div>
            </div>
          )}

          {/* Scrape History */}
          <div className="pt-4">
            <h4 className="text-sm font-medium text-foreground mb-3">Scrape History</h4>
            {logsLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : !logs?.length ? (
              <p className="text-sm text-muted-foreground">No scrapes yet. Click "Start Scrape" to begin.</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      {log.status === 'completed' && <CheckCircle className="h-4 w-4 text-success" />}
                      {log.status === 'failed' && <XCircle className="h-4 w-4 text-destructive" />}
                      {log.status === 'running' && <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />}
                      {log.status === 'pending' && <Clock className="h-4 w-4 text-muted-foreground" />}
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {websiteLabels[log.website as keyof typeof websiteLabels] || log.website}
                          <span className="text-muted-foreground ml-2">({log.scrapeType})</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.pagesScraped} pages, {log.mentionsExtracted} mentions • {new Date(log.startedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusColors[log.status]}>
                      {log.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Scraped Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground text-sm">Recent Scraped Pages</CardTitle>
        </CardHeader>
        <CardContent>
          {!content?.length ? (
            <p className="text-sm text-muted-foreground">No pages scraped yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {content.slice(0, 15).map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between p-2 rounded border border-border hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {page.title || page.url}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {websiteLabels[page.website as keyof typeof websiteLabels]} • {page.pageType}
                    </p>
                  </div>
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-muted rounded"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
