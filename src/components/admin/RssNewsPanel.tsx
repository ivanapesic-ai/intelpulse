import { useState } from "react";
import { Rss, RefreshCw, ExternalLink, Clock, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRssFeedSources, useFetchRss, useLatestNews } from "@/hooks/useNews";

export function RssNewsPanel() {
  const { data: sources, isLoading: sourcesLoading } = useRssFeedSources();
  const { data: latestNews, isLoading: newsLoading } = useLatestNews(15);
  const fetchRss = useFetchRss();

  return (
    <div className="space-y-6">
      {/* Feed Sources */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Rss className="h-5 w-5" />
              RSS Feed Sources
            </CardTitle>
            <CardDescription>
              Configured news feeds for technology trend monitoring
            </CardDescription>
          </div>
          <Button 
            onClick={() => fetchRss.mutate()} 
            disabled={fetchRss.isPending}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${fetchRss.isPending ? "animate-spin" : ""}`} />
            {fetchRss.isPending ? "Fetching..." : "Fetch All Feeds"}
          </Button>
        </CardHeader>
        <CardContent>
          {sourcesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : (
            <div className="space-y-2">
              {sources?.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
                >
                  <div className="flex items-center gap-3">
                    {source.is_active ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">{source.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-md">
                        {source.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {source.last_fetched_at
                      ? new Date(source.last_fetched_at).toLocaleString()
                      : "Never fetched"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Latest News */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Latest News Items</CardTitle>
          <CardDescription>
            Most recent articles from all RSS feeds
          </CardDescription>
        </CardHeader>
        <CardContent>
          {newsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : latestNews && latestNews.length > 0 ? (
            <div className="space-y-2">
              {latestNews.map((news) => (
                <a
                  key={news.id}
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start justify-between p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-medium text-foreground line-clamp-2 text-sm">
                      {news.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {news.source_name}
                      </Badge>
                      {news.published_at && (
                        <span>{new Date(news.published_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm italic">
              No news items yet. Click "Fetch All Feeds" to populate.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
