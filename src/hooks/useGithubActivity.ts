// src/hooks/useGithubActivity.ts
// Hooks for GitHub open-source activity data

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GithubRepo {
  id: string;
  github_id: number;
  full_name: string;
  owner: string;
  repo_name: string;
  description: string | null;
  stars: number;
  forks: number;
  open_issues: number;
  watchers: number;
  language: string | null;
  topics: string[];
  license: string | null;
  created_at_gh: string;
  updated_at_gh: string;
  pushed_at: string;
  is_active: boolean;
  activity_score: number;
  momentum: "rising" | "stable" | "declining";
  keyword_id: string;
  keyword: string;
  relevance_rank: number;
  github_url: string;
  homepage_url: string | null;
  fetched_at: string;
}

export interface GithubKeywordSummary {
  keyword_id: string;
  keyword: string;
  display_name: string;
  repo_count: number;
  active_repos: number;
  total_stars: number;
  total_forks: number;
  avg_stars: number;
  max_stars: number;
  latest_activity: string | null;
  languages: string[];
  top_repos: string[];
  last_fetched: string | null;
}

export function useGithubRepos(keywordId: string | null) {
  return useQuery({
    queryKey: ["github-repos", keywordId],
    queryFn: async () => {
      if (!keywordId) return [];
      const { data, error } = await supabase
        .from("github_oss_activity" as any)
        .select("*")
        .eq("keyword_id", keywordId)
        .order("stars", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as GithubRepo[];
    },
    enabled: !!keywordId,
  });
}

export function useGithubKeywordSummary() {
  return useQuery({
    queryKey: ["github-keyword-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("github_keyword_summary" as any)
        .select("*")
        .order("total_stars", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data || []) as unknown as GithubKeywordSummary[];
    },
  });
}

export function useTopGithubRepos(limit = 10) {
  return useQuery({
    queryKey: ["github-top-repos", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("github_oss_activity" as any)
        .select("*")
        .eq("is_active", true)
        .order("stars", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as GithubRepo[];
    },
  });
}

export function useGithubLanguages() {
  return useQuery({
    queryKey: ["github-languages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("github_oss_activity" as any)
        .select("language, stars");
      if (error) throw error;

      const langs = new Map<string, { count: number; stars: number }>();
      for (const row of data || []) {
        const lang = (row as any).language || "Unknown";
        const existing = langs.get(lang) || { count: 0, stars: 0 };
        existing.count++;
        existing.stars += (row as any).stars || 0;
        langs.set(lang, existing);
      }

      return Array.from(langs.entries())
        .map(([name, { count, stars }]) => ({ name, count, stars }))
        .sort((a, b) => b.count - a.count);
    },
  });
}

export async function fetchGithubActivity(
  keywordId?: string,
  keyword?: string,
  dryRun = false
) {
  const body: Record<string, any> = { dry_run: dryRun };
  if (keywordId && keyword) {
    body.keyword_id = keywordId;
    body.keyword = keyword;
  }

  const { data, error } = await supabase.functions.invoke(
    "fetch-github-activity",
    { body }
  );

  if (error) throw error;
  return data;
}