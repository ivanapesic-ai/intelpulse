import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, ExternalLink, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const INTEROP_KEYWORD_IDS = [
  "78a385d0-ca18-4367-bdd1-895cbf344096", // v2g
  "130443e2-063c-4092-ba6f-79608a914013", // v2x
  "4c641930-edf8-48f6-a6f5-e766ca6262ad", // ev_charging
  "78fa87ca-4fb1-483c-b602-997914133441", // smart_grid
  "cfeb162f-9076-452d-92c0-08fe3c6a5a7b", // smart_recharging
  "3a7c5579-29e3-4191-a65e-e0072ef0f115", // bidirectional_charging
];

interface NewsItem {
  id: string;
  title: string;
  published_at: string | null;
  source_name: string | null;
  url: string;
  keyword_name: string;
}

export function InteropNewsSection() {
  const { data: news, isLoading } = useQuery({
    queryKey: ["interop-news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_keyword_matches")
        .select(`
          news_id,
          keyword_id,
          news_items!inner(id, title, published_at, source_name, url),
          technology_keywords!inner(display_name)
        `)
        .in("keyword_id", INTEROP_KEYWORD_IDS)
        .order("news_id", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Deduplicate by news_id, keep most recent
      const seen = new Set<string>();
      const items: NewsItem[] = [];
      for (const row of data || []) {
        const ni = row.news_items as any;
        if (!ni || seen.has(ni.id)) continue;
        seen.add(ni.id);
        items.push({
          id: ni.id,
          title: ni.title,
          published_at: ni.published_at,
          source_name: ni.source_name,
          url: ni.url,
          keyword_name: (row.technology_keywords as any)?.display_name || "",
        });
      }

      // Sort by date desc and take top 6
      return items
        .sort((a, b) => {
          const da = a.published_at ? new Date(a.published_at).getTime() : 0;
          const db = b.published_at ? new Date(b.published_at).getTime() : 0;
          return db - da;
        })
        .slice(0, 6);
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["interop-news-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_keyword_matches")
        .select("keyword_id, technology_keywords!inner(display_name)")
        .in("keyword_id", INTEROP_KEYWORD_IDS);
      if (error) throw error;

      const map = new Map<string, { name: string; count: number }>();
      for (const row of data || []) {
        const name = (row.technology_keywords as any)?.display_name || "";
        const existing = map.get(row.keyword_id) || { name, count: 0 };
        existing.count++;
        map.set(row.keyword_id, existing);
      }
      return Array.from(map.values()).sort((a, b) => b.count - a.count);
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!news || news.length === 0) return null;

  const totalMentions = counts?.reduce((s, c) => s + c.count, 0) || 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Newspaper className="h-6 w-6 text-primary" />
          Interoperability in the News
        </h2>
        <p className="text-muted-foreground mt-1">
          Latest news mentions across interoperability-related technologies — EV charging, V2G, V2X, and smart grid.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5" />
          {totalMentions} total mentions
        </span>
        {counts?.slice(0, 4).map((c) => (
          <Badge key={c.name} variant="secondary" className="text-xs gap-1">
            {c.name} <span className="font-bold">{c.count}</span>
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {news.map((item) => (
          <Card key={item.id} className="border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2 flex items-start gap-1"
              >
                {item.title}
                <ExternalLink className="h-3 w-3 flex-shrink-0 mt-0.5 opacity-40" />
              </a>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-[10px] border-border">{item.keyword_name}</Badge>
                {item.source_name && (
                  <span className="text-[10px] text-muted-foreground truncate">{item.source_name}</span>
                )}
                {item.published_at && (
                  <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">
                    {new Date(item.published_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
