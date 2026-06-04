// N1 Signal — client-side prototype state (localStorage)
// Ported verbatim from remix: watchlist (with stance), workspace, hypothesis, templates.

export type Stance = "bullish" | "bearish";

export interface WatchlistItem {
  techId: string;
  stance: Stance;
  note?: string;
  addedAt: number;
}

export type WorkspaceItemKind =
  | "technology"
  | "chart"
  | "insight"
  | "news"
  | "standard"
  | "relationship"
  | "import";

export interface WorkspaceItem {
  id: string;
  kind: WorkspaceItemKind;
  refId: string;
  title: string;
  subtitle?: string;
  techId?: string;
  payload?: Record<string, unknown>;
  addedAt: number;
}

export type ReportTemplateId =
  | "executive-brief"
  | "deep-dive"
  | "investor-memo"
  | "standards-review"
  | "watchlist-digest";

export interface HypothesisTest {
  id: string;
  title: string;
  statement: string;
  status: "draft" | "running" | "supported" | "rejected" | "inconclusive";
  techIds: string[];
  metric?: string;
  createdAt: number;
  result?: { confidence: number; summary: string; evidence: string[] };
}

const K = {
  watchlist: "n1:watchlist:v2",
  workspace: "n1:workspace",
  reportTemplate: "n1:reportTemplate",
  hypothesisTests: "n1:hypothesisTests",
} as const;

const EVT = "n1:prototype-change";

function isBrowser() { return typeof window !== "undefined"; }

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch { return fallback; }
}

function write<T>(key: string, value: T) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(EVT, { detail: { key } }));
}

export function subscribe(listener: () => void) {
  if (!isBrowser()) return () => {};
  const handler = () => listener();
  window.addEventListener(EVT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVT, handler);
    window.removeEventListener("storage", handler);
  };
}

/* Watchlist */
export function getWatchlist(): WatchlistItem[] {
  const v = read<WatchlistItem[] | null>(K.watchlist, null);
  if (Array.isArray(v)) {
    return v.filter((x): x is WatchlistItem => !!x && typeof x.techId === "string");
  }
  return [];
}
export function setWatchlist(items: WatchlistItem[]) { write(K.watchlist, items); }

export function addToWatchlist(techId: string, stance: Stance = "bullish") {
  const items = getWatchlist();
  const existing = items.find((i) => i.techId === techId);
  if (existing) {
    existing.stance = stance;
    setWatchlist([...items]);
  } else {
    setWatchlist([...items, { techId, stance, addedAt: Date.now() }]);
  }
}
export function removeFromWatchlist(techId: string) {
  setWatchlist(getWatchlist().filter((i) => i.techId !== techId));
}
export function setWatchlistStance(techId: string, stance: Stance) {
  const items = getWatchlist();
  setWatchlist(items.map((i) => (i.techId === techId ? { ...i, stance } : i)));
}
export function toggleWatchlist(techId: string, stance: Stance = "bullish") {
  const items = getWatchlist();
  if (items.some((i) => i.techId === techId)) removeFromWatchlist(techId);
  else addToWatchlist(techId, stance);
}

/* Workspace */
export function getWorkspace(): WorkspaceItem[] { return read<WorkspaceItem[]>(K.workspace, []); }
export function setWorkspace(items: WorkspaceItem[]) { write(K.workspace, items); }

export function addToWorkspace(item: Omit<WorkspaceItem, "id" | "addedAt"> & { id?: string }) {
  const id = item.id ?? `${item.kind}:${item.refId}`;
  const items = getWorkspace();
  if (items.some((i) => i.id === id)) return;
  setWorkspace([...items, { ...item, id, addedAt: Date.now() }]);
}
export function removeFromWorkspace(id: string) {
  setWorkspace(getWorkspace().filter((i) => i.id !== id));
}
export function clearWorkspace() { setWorkspace([]); }

/* Report template */
export function getReportTemplate(): ReportTemplateId | null {
  return read<ReportTemplateId | null>(K.reportTemplate, null);
}
export function setReportTemplate(id: ReportTemplateId | null) { write(K.reportTemplate, id); }

/* Hypothesis */
export function getHypothesisTests(): HypothesisTest[] { return read<HypothesisTest[]>(K.hypothesisTests, []); }
export function setHypothesisTests(tests: HypothesisTest[]) { write(K.hypothesisTests, tests); }
export function addHypothesisTest(test: Omit<HypothesisTest, "id" | "createdAt" | "status"> & Partial<Pick<HypothesisTest, "id" | "status">>): HypothesisTest {
  const created: HypothesisTest = {
    id: test.id ?? `hyp_${Date.now().toString(36)}`,
    status: test.status ?? "draft",
    createdAt: Date.now(),
    ...test,
  };
  setHypothesisTests([created, ...getHypothesisTests()]);
  return created;
}
export function updateHypothesisTest(id: string, patch: Partial<HypothesisTest>) {
  setHypothesisTests(getHypothesisTests().map((t) => (t.id === id ? { ...t, ...patch } : t)));
}
export function removeHypothesisTest(id: string) {
  setHypothesisTests(getHypothesisTests().filter((t) => t.id !== id));
}
