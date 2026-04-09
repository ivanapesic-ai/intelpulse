// supabase/functions/fetch-github-activity/index.ts
// Fetches open-source repository metrics from GitHub Search API
// Maps results to technology_keywords — gives "open-source momentum" signal
// Uses background execution (waitUntil) to avoid client timeouts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GITHUB_API = "https://api.github.com";

const KEYWORD_SEARCH_QUERIES: Record<string, string[]> = {
  "vehicle to grid": ["vehicle-to-grid", "V2G charging", "EVerest"],
  "bidirectional charging": ["bidirectional charging", "iso15118"],
  "battery management": ["battery management system", "BMS firmware"],
  "digital twin": ["digital twin automotive", "digital twin simulation"],
  "edge computing": ["edge computing IoT", "MEC automotive"],
  "lidar": ["LiDAR point cloud", "lidar autonomous driving"],
  "autonomous driving": ["autonomous driving", "self-driving car", "AUTOSAR adaptive"],
  "ev charging": ["OCPP", "ev charging station", "EVerest"],
  "smart charging": ["smart charging EV", "OCPP smart charging"],
  "smart grid": ["smart grid energy", "OpenADR"],
  "cybersecurity": ["automotive cybersecurity", "V2X security"],
  "v2x": ["V2X communication", "C-V2X", "DSRC V2X"],
  "hydrogen fuel cell": ["hydrogen fuel cell", "FCEV", "fuel cell controller"],
  "solid state battery": ["solid state battery", "all-solid-state battery"],
  "electric mobility": ["electric mobility", "EV fleet management"],
  "micro grid": ["microgrid controller", "microgrid energy management"],
  "ev motor": ["electric motor controller", "BLDC motor EV"],
  "supply chain management": ["supply chain blockchain", "supply chain automotive"],
};

function calculateActivityScore(repo: any): number {
  const stars = repo.stargazers_count || 0;
  const forks = repo.forks_count || 0;
  const pushedAt = new Date(repo.pushed_at || repo.updated_at);
  const daysSincePush = Math.max(0, (Date.now() - pushedAt.getTime()) / (1000 * 60 * 60 * 24));

  const starScore = Math.log10(Math.max(1, stars)) * 10;
  const forkScore = Math.log10(Math.max(1, forks)) * 10;
  const recencyScore = Math.max(0, 30 * (1 - daysSincePush / 365));

  return Math.round((starScore * 0.4 + forkScore * 0.3 + recencyScore * 0.3) * 100) / 100;
}

function determineMomentum(repo: any): string {
  const pushedAt = new Date(repo.pushed_at || repo.updated_at);
  const daysSincePush = (Date.now() - pushedAt.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSincePush < 30) return "rising";
  if (daysSincePush < 180) return "stable";
  return "declining";
}

async function searchGitHub(query: string, token: string | null, perPage = 30): Promise<any[]> {
  const params = new URLSearchParams({
    q: query,
    sort: "stars",
    order: "desc",
    per_page: String(perPage),
  });

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${GITHUB_API}/search/repositories?${params}`, { headers });

  if (response.status === 403) {
    const resetAt = response.headers.get("X-RateLimit-Reset");
    const waitSec = resetAt ? Math.ceil((parseInt(resetAt) * 1000 - Date.now()) / 1000) : 60;
    throw new Error(`GitHub rate limited. Resets in ${waitSec}s`);
  }

  if (!response.ok) {
    throw new Error(`GitHub API error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.items || [];
}

async function processKeywords(
  supabaseClient: any,
  keywords: { id: string; keyword: string }[],
  githubToken: string | null,
  perPage: number,
  dryRun: boolean
) {
  let totalInserted = 0;
  let totalFound = 0;

  for (const kw of keywords) {
    const queries = KEYWORD_SEARCH_QUERIES[kw.keyword.toLowerCase()] || [kw.keyword];
    const allRepos = new Map<number, any>();

    for (const query of queries) {
      console.log(`GitHub search: "${query}" (keyword: ${kw.keyword})`);

      try {
        const repos = await searchGitHub(query, githubToken, perPage);
        for (const repo of repos) {
          if (!allRepos.has(repo.id)) {
            allRepos.set(repo.id, repo);
          }
        }
        await new Promise((r) => setTimeout(r, 2000));
      } catch (err) {
        console.warn(`GitHub search failed for "${query}":`, err.message);
        if (err.message.includes("rate limited")) {
          await new Promise((r) => setTimeout(r, 10000));
        }
      }
    }

    const repos = Array.from(allRepos.values());
    totalFound += repos.length;

    let inserted = 0;
    const totalStars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
    const topRepo = repos.length > 0
      ? repos.sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))[0]?.full_name
      : null;

    if (!dryRun && repos.length > 0) {
      const now = new Date().toISOString();
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 1);

      const rows = repos.map((repo, idx) => ({
        github_id: repo.id,
        full_name: repo.full_name,
        owner: repo.owner?.login || "",
        repo_name: repo.name,
        description: (repo.description || "").slice(0, 500),
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        open_issues: repo.open_issues_count || 0,
        watchers: repo.watchers_count || 0,
        size_kb: repo.size || 0,
        language: repo.language,
        topics: repo.topics || [],
        license: repo.license?.spdx_id || null,
        created_at_gh: repo.created_at,
        updated_at_gh: repo.updated_at,
        pushed_at: repo.pushed_at,
        is_active: new Date(repo.pushed_at || repo.updated_at) > cutoff,
        activity_score: calculateActivityScore(repo),
        momentum: determineMomentum(repo),
        keyword_id: kw.id,
        keyword: kw.keyword,
        search_query: queries.join(" | "),
        relevance_rank: idx + 1,
        github_url: repo.html_url,
        homepage_url: repo.homepage || null,
        fetched_at: now,
      }));

      for (let i = 0; i < rows.length; i += 50) {
        const chunk = rows.slice(i, i + 50);
        const { data, error } = await supabaseClient
          .from("github_oss_activity")
          .upsert(chunk, {
            onConflict: "github_id,keyword_id",
            ignoreDuplicates: false,
          })
          .select("id");

        if (error) {
          console.error(`Upsert error for ${kw.keyword}:`, error.message);
        } else {
          inserted += data?.length || chunk.length;
        }
      }
    }

    totalInserted += inserted;
    console.log(`${kw.keyword}: ${repos.length} repos, ${totalStars} total stars, top: ${topRepo}`);
  }

  console.log(`Background GitHub fetch complete: ${keywords.length} keywords, ${totalFound} repos found, ${totalInserted} inserted`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const githubToken = Deno.env.get("GITHUB_TOKEN") || null;

  try {
    const body = await req.json();
    const { keyword_id, keyword, per_page = 20, dry_run = false } = body;

    let keywords: { id: string; keyword: string }[] = [];

    if (keyword_id && keyword) {
      keywords = [{ id: keyword_id, keyword }];
    } else {
      const { data: allKeywords, error: kwError } = await supabaseClient
        .from("technology_keywords")
        .select("id, keyword")
        .eq("is_active", true)
        .order("keyword");
      if (kwError) throw kwError;
      keywords = allKeywords || [];
    }

    // For single keyword, process inline; for bulk, use background execution
    if (keywords.length <= 2) {
      // Small enough to process inline
      await processKeywords(supabaseClient, keywords, githubToken, per_page, dry_run);

      return new Response(
        JSON.stringify({
          success: true,
          mode: "inline",
          keywords_queued: keywords.length,
          message: `Processed ${keywords.length} keyword(s) inline.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Background execution for bulk fetches
    const promise = processKeywords(supabaseClient, keywords, githubToken, per_page, dry_run);

    // Use EdgeRuntime.waitUntil to keep processing after response
    // @ts-ignore - EdgeRuntime is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(promise);
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode: "background",
        keywords_queued: keywords.length,
        github_token_used: !!githubToken,
        dry_run,
        message: `Queued ${keywords.length} keywords for background processing. Data will appear as it's fetched — refresh the page to see updates.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("GitHub fetch error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
