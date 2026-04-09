import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket, BookOpen, Newspaper, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const ACTIVE_KEYWORD_IDS = [
  "f891626f-69f5-49c2-800c-3959c9f16a08",
  "5fa48a30-5446-4834-a467-8bfef5cdfd9c",
  "7b4f9bba-4820-441a-a7c3-2c7ec705e96c",
  "dccf074f-dae7-460c-b678-aae2670d62f2",
  "3f230e3f-97a7-4fb0-b04b-a1d219187976",
  "8bbe7a00-6ea9-49a0-9690-ebd2a928c922",
  "4c641930-edf8-48f6-a6f5-e766ca6262ad",
  "70ba572a-3590-4ff8-b339-642c27ddf9f1",
  "b5ffaadb-cbb8-4a13-98f7-34111287a17e",
  "130443e2-063c-4092-ba6f-79608a914013",
  "78a385d0-ca18-4367-bdd1-895cbf344096",
];

const INTEROP_KEYWORD_IDS = [
  "78a385d0-ca18-4367-bdd1-895cbf344096",
  "130443e2-063c-4092-ba6f-79608a914013",
  "4c641930-edf8-48f6-a6f5-e766ca6262ad",
  "7b4f9bba-4820-441a-a7c3-2c7ec705e96c",
  "b5ffaadb-cbb8-4a13-98f7-34111287a17e",
  "3f230e3f-97a7-4fb0-b04b-a1d219187976",
];

export function InnovationPipelineSection() {
  const { data: cordisProjects, isLoading: cordisLoading } = useQuery({
    queryKey: ["interop-cordis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cordis_eu_projects")
        .select("id, title, acronym, framework_programme, eu_contribution_eur, start_date, end_date, status, cordis_url, keyword")
        .in("keyword_id", ACTIVE_KEYWORD_IDS)
        .order("eu_contribution_eur", { ascending: false })
        .limit(8);
      
      if (error || !data || data.length === 0) {
        const { data: fallback } = await supabase
          .from("cordis_eu_projects")
          .select("id, title, acronym, framework_programme, eu_contribution_eur, start_date, end_date, status, cordis_url, keyword")
          .order("eu_contribution_eur", { ascending: false })
          .limit(8);
        return fallback || [];
      }
      return data;
    },
  });

  const { data: news, isLoading: newsLoading } = useQuery({
    queryKey: ["interop-pipeline-news"],
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
      
      const seen = new Set<string>();
      const items: Array<{ id: string; title: string; published_at: string | null; source_name: string | null; url: string; keyword: string }> = [];
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
          keyword: (row.technology_keywords as any)?.display_name || "",
        });
      }
      return items
        .sort((a, b) => (b.published_at ? new Date(b.published_at).getTime() : 0) - (a.published_at ? new Date(a.published_at).getTime() : 0))
        .slice(0, 8);
    },
  });

  const isLoading = cordisLoading || newsLoading;
  if (isLoading) return <Skeleton className="h-60 w-full" />;

  const hasCordis = cordisProjects && cordisProjects.length > 0;
  const hasNews = news && news.length > 0;

  if (!hasCordis && !hasNews) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Rocket className="h-6 w-6 text-primary" />
          Innovation Pipeline
        </h2>
        <p className="text-muted-foreground mt-1">
          What's coming next? EU-funded research and industry news driving interoperability forward.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CORDIS Column */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              EU R&D Projects
            </CardTitle>
            <CardDescription className="text-xs">Horizon Europe & framework programme funded research</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {hasCordis ? cordisProjects!.slice(0, 6).map((p) => (
              <div key={p.id} className="space-y-1">
                <a
                  href={p.cordis_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-foreground hover:text-primary transition-colors line-clamp-2 flex items-start gap-1"
                >
                  {p.acronym ? <span className="font-bold">{p.acronym}</span> : null}
                  {p.acronym ? " — " : ""}{p.title}
                  <ExternalLink className="h-2.5 w-2.5 flex-shrink-0 mt-0.5 opacity-40" />
                </a>
                <div className="flex items-center gap-1.5">
                  {p.framework_programme && (
                    <Badge variant="outline" className="text-[10px] border-border">{p.framework_programme}</Badge>
                  )}
                  {p.eu_contribution_eur && (
                    <span className="text-[10px] text-muted-foreground">
                      €{(Number(p.eu_contribution_eur) / 1e6).toFixed(1)}M
                    </span>
                  )}
                </div>
              </div>
            )) : (
              <p className="text-xs text-muted-foreground">No CORDIS projects linked yet.</p>
            )}
          </CardContent>
        </Card>

        {/* News Column */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-primary" />
              Industry News
            </CardTitle>
            <CardDescription className="text-xs">Latest mentions across interoperability topics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {hasNews ? news!.map((n) => (
              <div key={n.id} className="space-y-1">
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-foreground hover:text-primary transition-colors line-clamp-2 flex items-start gap-1"
                >
                  {n.title}
                  <ExternalLink className="h-2.5 w-2.5 flex-shrink-0 mt-0.5 opacity-40" />
                </a>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] border-border">{n.keyword}</Badge>
                  {n.source_name && (
                    <span className="text-[10px] text-muted-foreground">{n.source_name}</span>
                  )}
                  {n.published_at && (
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {new Date(n.published_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            )) : (
              <p className="text-xs text-muted-foreground">No interop news found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
