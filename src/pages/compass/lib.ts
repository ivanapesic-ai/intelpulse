// Helpers for the N1 Signal sandbox

import type { TechnologyIntelligence } from "@/hooks/useTechnologyIntelligence";

/** Convert 4-signal 0-2 scores into a 0-100 composite "Signal Strength". */
export function signalStrength(t: TechnologyIntelligence): number {
  const parts = [
    t.investmentScore ?? 0,
    t.researchScore ?? 0,
    t.patentsScore ?? 0,
    t.visibilityScore ?? 0,
  ];
  const sum = parts.reduce((a, b) => a + b, 0);
  return Math.round((sum / 8) * 100);
}

export function strengthBand(score: number) {
  if (score >= 75) return { label: "Strong", color: "text-emerald-500 dark:text-emerald-300", ring: "ring-emerald-400/30", bar: "bg-emerald-500 dark:bg-emerald-400" };
  if (score >= 40) return { label: "Moderate", color: "text-amber-500 dark:text-amber-300", ring: "ring-amber-400/30", bar: "bg-amber-500 dark:bg-amber-400" };
  return { label: "Emerging", color: "text-rose-500 dark:text-rose-300", ring: "ring-rose-400/30", bar: "bg-rose-500 dark:bg-rose-400" };
}

export function fmtFunding(eur: number) {
  if (!eur || eur <= 0) return "—";
  if (eur >= 1e9) return `€${(eur / 1e9).toFixed(1)}B`;
  if (eur >= 1e6) return `€${(eur / 1e6).toFixed(0)}M`;
  if (eur >= 1e3) return `€${(eur / 1e3).toFixed(0)}K`;
  return `€${eur}`;
}

/** 4-quadrant strategy matrix from challenge/opportunity scores.
 *  challengeScore: 2 = no challenge (easy), 0 = severe.
 *  opportunityScore: 2 = high opp, 0 = limited.
 */
export type Quadrant = "qw" | "bb" | "wt" | "rt";
export function getQuadrant(t: TechnologyIntelligence): Quadrant | null {
  const c = t.challengeScore;
  const o = t.opportunityScore;
  if (c === null || o === null) return null;
  const easy = c >= 1.5;     // low barrier
  const highOpp = o >= 1.5;
  if (highOpp && easy) return "qw";   // quick win
  if (highOpp && !easy) return "bb";  // big bet
  if (!highOpp && easy) return "wt";  // when time permits
  return "rt";                         // rethink
}

export const QUADRANT_META: Record<Quadrant, {
  label: string; sub: string; action: string; horizon: string;
  bg: string; text: string; ring: string;
}> = {
  qw: { label: "Quick Wins",  sub: "High opportunity · Low barrier",  action: "Execute now",  horizon: "Now",
        bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-300", ring: "border-emerald-500/30" },
  bb: { label: "Big Bets",     sub: "High opportunity · High barrier", action: "Invest strategically", horizon: "Near",
        bg: "bg-sky-500/10", text: "text-sky-600 dark:text-sky-300", ring: "border-sky-500/30" },
  wt: { label: "Monitor",      sub: "Lower opportunity · Low barrier", action: "Track, opportunistic", horizon: "Next",
        bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-300", ring: "border-amber-500/30" },
  rt: { label: "Rethink",      sub: "Lower opportunity · High barrier", action: "Reframe or drop", horizon: "Now",
        bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-300", ring: "border-rose-500/30" },
};

// ---- Stance / Workspace persistence ----

const STANCE_KEY = "n1signal:stance";
export type Stance = "bullish" | "bearish";

export function loadStances(): Record<string, { stance: Stance; addedAt: number }> {
  try {
    const raw = JSON.parse(localStorage.getItem(STANCE_KEY) || "{}");
    // migration from old format (plain Stance value)
    if (typeof Object.values(raw)[0] === "string") {
      const now = Date.now();
      const migrated: Record<string, { stance: Stance; addedAt: number }> = {};
      for (const [k, v] of Object.entries(raw)) migrated[k] = { stance: v as Stance, addedAt: now };
      return migrated;
    }
    return raw;
  } catch { return {}; }
}

export function setStance(keywordId: string, stance: Stance | null) {
  const all = loadStances();
  if (stance === null) delete all[keywordId];
  else all[keywordId] = { stance, addedAt: all[keywordId]?.addedAt || Date.now() };
  localStorage.setItem(STANCE_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event("n1:stance-changed"));
}

const WORKSPACE_KEY = "n1signal:workspace";
export function loadWorkspace(): string[] {
  try { return JSON.parse(localStorage.getItem(WORKSPACE_KEY) || "[]"); } catch { return []; }
}

export function toggleWorkspace(keywordId: string) {
  const items = loadWorkspace();
  const idx = items.indexOf(keywordId);
  if (idx >= 0) items.splice(idx, 1);
  else items.push(keywordId);
  localStorage.setItem(WORKSPACE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("n1:workspace-changed"));
  return items.includes(keywordId);
}

/* Typed workspace items (news, companies, research, standards, etc.) */
export type WorkspaceItemKind = "news" | "company" | "research" | "standard" | "import";
export interface WorkspaceItem {
  id: string;          // stable: `${kind}:${refId}`
  kind: WorkspaceItemKind;
  refId: string;
  title: string;
  subtitle?: string;
  url?: string;
  keywordId?: string;
  meta?: Record<string, unknown>;
  addedAt: number;
}

const WORKSPACE_ITEMS_KEY = "n1signal:workspaceItems";
export function loadWorkspaceItems(): WorkspaceItem[] {
  try { return JSON.parse(localStorage.getItem(WORKSPACE_ITEMS_KEY) || "[]"); } catch { return []; }
}
export function hasWorkspaceItem(kind: WorkspaceItemKind, refId: string): boolean {
  return loadWorkspaceItems().some((i) => i.kind === kind && i.refId === refId);
}
export function toggleWorkspaceItem(input: Omit<WorkspaceItem, "id" | "addedAt"> & { id?: string }): boolean {
  const id = input.id ?? `${input.kind}:${input.refId}`;
  const items = loadWorkspaceItems();
  const idx = items.findIndex((i) => i.id === id);
  let added: boolean;
  if (idx >= 0) { items.splice(idx, 1); added = false; }
  else { items.push({ ...input, id, addedAt: Date.now() }); added = true; }
  localStorage.setItem(WORKSPACE_ITEMS_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("n1:workspace-changed"));
  return added;
}
export function removeWorkspaceItem(id: string) {
  const items = loadWorkspaceItems().filter((i) => i.id !== id);
  localStorage.setItem(WORKSPACE_ITEMS_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("n1:workspace-changed"));
}

const LAST_VISIT_KEY = "n1signal:lastVisit";
export function getLastVisit(): Date | null {
  const raw = localStorage.getItem(LAST_VISIT_KEY);
  return raw ? new Date(raw) : null;
}
export function touchLastVisit() {
  localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
}
