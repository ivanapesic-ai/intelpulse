import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTechnologyIntelligence } from "@/hooks/useTechnologyIntelligence";
import { ArrowLeft, Search, Save, Trash2, Plus, ExternalLink, Bookmark, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleWorkspace, loadWorkspace, fmtFunding } from "./lib";
import { toast } from "sonner";

// ---------- Types ----------
type SourceType = "all" | "news" | "companies" | "research" | "standards" | "technologies";

interface Filters {
  q: string;
  source: SourceType;
  keywordId: string;     // "" = all
  dateRange: "all" | "7d" | "30d" | "90d" | "1y";
  sort: "newest" | "oldest" | "relevance";
}

const DEFAULT_FILTERS: Filters = {
  q: "",
  source: "all",
  keywordId: "",
  dateRange: "all",
  sort: "newest",
};

interface SavedSearch {
  id: string;
  name: string;
  filters: Filters;
  savedAt: number;
}

const SAVED_KEY = "n1signal:savedSearches";
const loadSaved = (): SavedSearch[] => {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); } catch { return []; }
};
const persistSaved = (list: SavedSearch[]) => localStorage.setItem(SAVED_KEY, JSON.stringify(list));

// ---------- Unified result item ----------
interface ResultItem {
  id: string;
  source: Exclude<SourceType, "all">;
  title: string;
  subtitle?: string;
  description?: string;
  date?: string;
  url?: string;
  badges?: string[];
  keywordId?: string;
  keyword?: string;
  rightMeta?: string;
}

function cutoffISO(range: Filters["dateRange"]): string | null {
  const days = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 }[range as string];
  if (!days) return null;
  const d = new Date();
  d.setDate(d.getDate() - (days as number));
  return d.toISOString();
}

// ---------- Search hook ----------
function useSearch(filters: Filters) {
  return useQuery({
    queryKey: ["compass-explore", filters],
    queryFn: async (): Promise<ResultItem[]> => {
      const out: ResultItem[] = [];
      const wantsAll = filters.source === "all";
      const text = filters.q.trim();
      const cutoff = cutoffISO(filters.dateRange);

      // -- News --
      if (wantsAll || filters.source === "news") {
        let newsIds: string[] | null = null;
        if (filters.keywordId) {
          const { data: matches } = await supabase
            .from("news_keyword_matches")
            .select("news_id")
            .eq("keyword_id", filters.keywordId)
            .limit(500);
          newsIds = (matches || []).map((m: any) => m.news_id);
          if (newsIds.length === 0) newsIds = ["00000000-0000-0000-0000-000000000000"];
        }
        let q = supabase
          .from("news_items")
          .select("id, title, description, url, source_name, published_at")
          .order("published_at", { ascending: filters.sort === "oldest", nullsFirst: false })
          .limit(wantsAll ? 30 : 100);
        if (text) q = q.or(`title.ilike.%${text}%,description.ilike.%${text}%`);
        if (cutoff) q = q.gte("published_at", cutoff);
        if (newsIds) q = q.in("id", newsIds);
        const { data } = await q;
        for (const n of data || []) {
          out.push({
            id: `news-${n.id}`,
            source: "news",
            title: n.title,
            subtitle: n.source_name || undefined,
            description: n.description || undefined,
            date: n.published_at || undefined,
            url: n.url,
          });
        }
      }

      // -- Companies (Crunchbase) --
      if (wantsAll || filters.source === "companies") {
        let q = supabase
          .from("crunchbase_companies")
          .select("id, organization_name, description, website, hq_country, total_funding_usd, last_funding_date, technology_keywords, industries")
          .order("total_funding_usd", { ascending: false, nullsFirst: false })
          .limit(wantsAll ? 30 : 100);
        if (text) q = q.or(`organization_name.ilike.%${text}%,description.ilike.%${text}%`);
        if (filters.keywordId) {
          // technology_keywords is uuid[] of keyword ids
          q = q.contains("technology_keywords", [filters.keywordId]);
        }
        const { data } = await q;
        for (const c of data || []) {
          out.push({
            id: `co-${c.id}`,
            source: "companies",
            title: c.organization_name,
            subtitle: c.hq_country || undefined,
            description: c.description || undefined,
            date: c.last_funding_date || undefined,
            url: c.website || undefined,
            badges: (c.industries || []).slice(0, 3),
            rightMeta: c.total_funding_usd ? fmtFunding(Number(c.total_funding_usd) * 0.92) : undefined,
          });
        }
      }

      // -- Research papers (from research_signals.top_papers JSONB) --
      if (wantsAll || filters.source === "research") {
        let q = supabase
          .from("research_signals")
          .select("keyword_id, top_papers, snapshot_date, technology_keywords(display_name, keyword)")
          .order("snapshot_date", { ascending: false })
          .limit(60);
        if (filters.keywordId) q = q.eq("keyword_id", filters.keywordId);
        const { data } = await q;
        const seen = new Set<string>();
        for (const r of data || []) {
          const kw = (r as any).technology_keywords;
          for (const p of ((r as any).top_papers as any[]) || []) {
            const key = p.doi || p.id || p.title;
            if (!key || seen.has(key)) continue;
            seen.add(key);
            if (text && !(p.title || "").toLowerCase().includes(text.toLowerCase())) continue;
            const dateStr = p.year ? `${p.year}-01-01` : undefined;
            if (cutoff && dateStr && dateStr < cutoff.slice(0, 10)) continue;
            out.push({
              id: `paper-${key}`,
              source: "research",
              title: p.title,
              subtitle: p.source || (p.authors || []).slice(0, 2).join(", ") || undefined,
              description: p.authors && p.authors.length ? `Authors: ${p.authors.slice(0, 4).join(", ")}` : undefined,
              date: dateStr,
              url: p.doi ? `https://doi.org/${p.doi}` : undefined,
              keyword: kw?.display_name,
              rightMeta: p.citations ? `${p.citations.toLocaleString()} citations` : undefined,
            });
            if (out.filter((o) => o.source === "research").length >= (wantsAll ? 30 : 100)) break;
          }
        }
      }

      // -- Standards --
      if (wantsAll || filters.source === "standards") {
        let q = supabase
          .from("keyword_standards")
          .select("id, standard_code, standard_title, issuing_body, url, description, keyword_id, technology_keywords(display_name, keyword)")
          .order("standard_code")
          .limit(wantsAll ? 30 : 200);
        if (text) q = q.or(`standard_code.ilike.%${text}%,standard_title.ilike.%${text}%,issuing_body.ilike.%${text}%`);
        if (filters.keywordId) q = q.eq("keyword_id", filters.keywordId);
        const { data } = await q;
        for (const s of data || []) {
          const kw = (s as any).technology_keywords;
          out.push({
            id: `std-${s.id}`,
            source: "standards",
            title: `${s.standard_code} · ${s.standard_title}`,
            subtitle: s.issuing_body,
            description: s.description || undefined,
            url: s.url || undefined,
            keyword: kw?.display_name,
          });
        }
      }

      // -- Technologies (catalog) handled outside via TI hook --

      // Sort merged "all" results by date desc when applicable
      if (filters.source === "all") {
        out.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      }
      return out;
    },
  });
}

const SOURCE_LABEL: Record<Exclude<SourceType, "all">, string> = {
  news: "News",
  companies: "Company",
  research: "Research",
  standards: "Standard",
  technologies: "Technology",
};

const SOURCE_TAB_LABEL: Record<Exclude<SourceType, "all">, string> = {
  news: "News",
  companies: "Companies",
  research: "Research",
  standards: "Standards",
  technologies: "Technologies",
};

const SOURCE_DOT: Record<Exclude<SourceType, "all">, string> = {
  news: "bg-sky-500",
  companies: "bg-emerald-500",
  research: "bg-violet-500",
  standards: "bg-amber-500",
  technologies: "bg-rose-500",
};

export default function CompassExplore() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [saved, setSaved] = useState<SavedSearch[]>(loadSaved());
  const [workspace, setWorkspace] = useState<string[]>(loadWorkspace());

  useEffect(() => {
    const h = () => setWorkspace(loadWorkspace());
    window.addEventListener("n1:workspace-changed", h);
    return () => window.removeEventListener("n1:workspace-changed", h);
  }, []);

  const { data: techs = [] } = useTechnologyIntelligence();
  const { data: results = [], isFetching } = useSearch(filters);

  const techOptions = useMemo(
    () => [...techs].sort((a, b) => a.name.localeCompare(b.name)),
    [techs],
  );

  // Build technology results client-side from techs
  const techResults: ResultItem[] = useMemo(() => {
    if (filters.source !== "all" && filters.source !== "technologies") return [];
    const text = filters.q.trim().toLowerCase();
    let list = techs;
    if (filters.keywordId) list = list.filter((t) => t.keywordId === filters.keywordId);
    if (text) list = list.filter((t) => t.name.toLowerCase().includes(text) || (t.description || "").toLowerCase().includes(text));
    return list.slice(0, filters.source === "all" ? 8 : 60).map((t) => ({
      id: `tech-${t.id}`,
      source: "technologies" as const,
      title: t.name,
      subtitle: t.domainName || undefined,
      description: t.description || undefined,
      keywordId: t.keywordId,
      keyword: t.name,
      badges: t.maturityScore != null ? [`Maturity ${t.maturityScore.toFixed(1)}`] : [],
      rightMeta: fmtFunding(t.totalFundingEur),
    }));
  }, [techs, filters]);

  const merged = useMemo(() => {
    if (filters.source === "technologies") return techResults;
    if (filters.source === "all") return [...techResults, ...results].slice(0, 120);
    return results;
  }, [results, techResults, filters.source]);

  const grouped = useMemo(() => {
    const g: Record<string, number> = {};
    for (const r of merged) g[r.source] = (g[r.source] || 0) + 1;
    return g;
  }, [merged]);

  const isDirty = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  function handleSave() {
    const name = window.prompt("Name this search:", filters.q || "Untitled search");
    if (!name) return;
    const next: SavedSearch = { id: `s_${Date.now()}`, name: name.trim(), filters, savedAt: Date.now() };
    const list = [next, ...saved].slice(0, 20);
    setSaved(list); persistSaved(list);
    toast.success("Search saved");
  }
  function handleLoad(s: SavedSearch) {
    setFilters(s.filters);
  }
  function handleDelete(id: string) {
    const list = saved.filter((s) => s.id !== id);
    setSaved(list); persistSaved(list);
  }
  function reset() { setFilters(DEFAULT_FILTERS); }

  return (
    <div className="space-y-8">
      <header>
        <Link to="/compass/signals" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to My Signals
        </Link>
        <p className="mt-4 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Advanced search</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Explore all signals</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Search across news, companies, research papers, standards and the technology catalog.
          Save searches to revisit later.
        </p>
      </header>

      {/* Saved searches */}
      {saved.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Saved:</span>
          {saved.map((s) => (
            <span key={s.id} className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card pl-3 pr-1.5 py-1 text-xs">
              <button onClick={() => handleLoad(s)} className="font-medium hover:text-primary">{s.name}</button>
              <button
                onClick={() => handleDelete(s.id)}
                aria-label={`Delete ${s.name}`}
                className="rounded-full p-0.5 text-muted-foreground opacity-60 hover:opacity-100 hover:text-rose-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              placeholder="Search titles, descriptions, organizations…"
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <select
            value={filters.keywordId}
            onChange={(e) => setFilters({ ...filters, keywordId: e.target.value })}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">All technologies</option>
            {techOptions.map((t) => (
              <option key={t.keywordId} value={t.keywordId}>{t.name}</option>
            ))}
          </select>

          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as Filters["dateRange"] })}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">Any date</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>

          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value as Filters["sort"] })}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={!isDirty}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-secondary disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Save
            </button>
            {isDirty && (
              <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground">Reset</button>
            )}
          </div>
        </div>

        {/* Source tabs */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {(["all", "news", "companies", "research", "standards", "technologies"] as SourceType[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilters({ ...filters, source: s })}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs capitalize transition-colors",
                filters.source === s
                  ? "bg-secondary text-foreground shadow-[0_0_0_1px_hsl(var(--border))]"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              {s === "all" ? "All" : SOURCE_TAB_LABEL[s as Exclude<SourceType, "all">]}
              {s !== "all" && grouped[s] != null && (
                <span className="ml-1.5 text-[10px] opacity-60">{grouped[s]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <section className="space-y-2">
        <div className="flex items-baseline justify-between">
          <p className="text-sm text-muted-foreground">
            {isFetching ? "Searching…" : `${merged.length} result${merged.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {merged.length === 0 && !isFetching && (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
            <p className="text-sm text-muted-foreground">No results match your filters.</p>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {merged.map((r) => (
            <article
              key={r.id}
              className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className={cn("h-1.5 w-1.5 rounded-full", SOURCE_DOT[r.source])} />
                    <span className="uppercase tracking-wider">{SOURCE_LABEL[r.source]}</span>
                    {r.date && <><span>·</span><span className="tabular-nums">{r.date.slice(0, 10)}</span></>}
                    {r.subtitle && <><span>·</span><span className="truncate">{r.subtitle}</span></>}
                  </div>
                  <h3 className="mt-1.5 text-sm font-medium leading-snug">
                    {r.url ? (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                        {r.title} <ExternalLink className="ml-0.5 inline h-3 w-3 opacity-50" />
                      </a>
                    ) : r.source === "technologies" && r.keyword ? (
                      <Link to={`/compass/technology/${r.keywordId}`} className="hover:text-primary">{r.title}</Link>
                    ) : (
                      r.title
                    )}
                  </h3>
                  {r.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                  )}
                  {(r.badges?.length || r.keyword) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.keyword && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{r.keyword}</span>
                      )}
                      {(r.badges || []).map((b, i) => (
                        <span key={i} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">{b}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {r.rightMeta && (
                    <span className="text-xs text-muted-foreground tabular-nums">{r.rightMeta}</span>
                  )}
                  {r.keywordId && (
                    <button
                      onClick={() => {
                        toggleWorkspace(r.keywordId!);
                        setWorkspace(loadWorkspace());
                        toast.success(workspace.includes(r.keywordId!) ? "Removed from Workspace" : "Added to Workspace");
                      }}
                      title={workspace.includes(r.keywordId) ? "In Workspace" : "Add to Workspace"}
                      className={cn(
                        "rounded-md border p-1.5 transition-colors",
                        workspace.includes(r.keywordId)
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {workspace.includes(r.keywordId) ? <Bookmark className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
