import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Star, ExternalLink, ArrowUpRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const INTEROP_KEYWORDS = [
  "v2g", "v2x", "ev_charging", "smart_grid", "smart_recharging", "bidirectional_charging",
];

const MOMENTUM_STYLE: Record<string, string> = {
  rising: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  stable: "border-blue-500/30 bg-blue-500/10 text-blue-500",
  declining: "border-orange-500/30 bg-orange-500/10 text-orange-500",
};

export function InteropOSSSection() {
  const { data: repos, isLoading } = useQuery({
    queryKey: ["interop-oss-repos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("github_oss_activity")
        .select("full_name, stars, forks, language, momentum, keyword, description, github_url, pushed_at")
        .in("keyword", INTEROP_KEYWORDS)
        .eq("is_active", true)
        .order("stars", { ascending: false })
        .limit(12);
      if (error) throw error;
      // Deduplicate by full_name (repos can appear under multiple keywords)
      const seen = new Set<string>();
      return (data || []).filter((r) => {
        if (seen.has(r.full_name)) return false;
        seen.add(r.full_name);
        return true;
      }).slice(0, 8);
    },
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!repos || repos.length === 0) return null;

  const totalStars = repos.reduce((s, r) => s + (r.stars || 0), 0);
  const risingCount = repos.filter((r) => r.momentum === "rising").length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <GitBranch className="h-6 w-6 text-primary" />
          Open-Source Interop Ecosystem
        </h2>
        <p className="text-muted-foreground mt-1">
          Active open-source projects implementing interoperability standards — OCPP, ISO 15118, V2G, and EV charging stacks.
        </p>
      </div>

      <div className="flex items-center gap-4 flex-wrap text-sm">
        <span className="text-muted-foreground">
          <Star className="h-3.5 w-3.5 inline mr-1" />
          {totalStars.toLocaleString()} total stars
        </span>
        <span className="text-muted-foreground">
          {risingCount} rising momentum
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {repos.map((repo) => (
          <Card key={repo.full_name} className="border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <a
                    href={repo.github_url || `https://github.com/${repo.full_name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {repo.full_name}
                    <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-50" />
                  </a>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {repo.description || "No description"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs font-medium text-foreground flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    {(repo.stars || 0).toLocaleString()}
                  </span>
                  {repo.momentum && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${MOMENTUM_STYLE[repo.momentum] || ""}`}
                    >
                      {repo.momentum}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {repo.language && (
                  <Badge variant="secondary" className="text-[10px]">{repo.language}</Badge>
                )}
                <Badge variant="outline" className="text-[10px] border-border">{repo.keyword}</Badge>
                {repo.pushed_at && (
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    updated {new Date(repo.pushed_at).toLocaleDateString()}
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
