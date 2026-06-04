// Helpers for the Compass sandbox

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
  if (score >= 75) return { label: "Strong", color: "text-emerald-300", ring: "ring-emerald-400/30", bar: "bg-emerald-400" };
  if (score >= 40) return { label: "Moderate", color: "text-amber-300", ring: "ring-amber-400/30", bar: "bg-amber-400" };
  return { label: "Emerging", color: "text-rose-300", ring: "ring-rose-400/30", bar: "bg-rose-400" };
}

export function fmtFunding(eur: number) {
  if (eur >= 1e9) return `€${(eur / 1e9).toFixed(1)}B`;
  if (eur >= 1e6) return `€${(eur / 1e6).toFixed(0)}M`;
  if (eur >= 1e3) return `€${(eur / 1e3).toFixed(0)}K`;
  return `€${eur}`;
}

const STANCE_KEY = "compass:stance";
export type Stance = "bullish" | "bearish";

export function loadStances(): Record<string, Stance> {
  try {
    return JSON.parse(localStorage.getItem(STANCE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function setStance(keywordId: string, stance: Stance | null) {
  const all = loadStances();
  if (stance === null) delete all[keywordId];
  else all[keywordId] = stance;
  localStorage.setItem(STANCE_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event("compass:stance-changed"));
}

const WORKSPACE_KEY = "compass:workspace";
export function loadWorkspace(): string[] {
  try {
    return JSON.parse(localStorage.getItem(WORKSPACE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function toggleWorkspace(keywordId: string) {
  const items = loadWorkspace();
  const idx = items.indexOf(keywordId);
  if (idx >= 0) items.splice(idx, 1);
  else items.push(keywordId);
  localStorage.setItem(WORKSPACE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("compass:workspace-changed"));
  return items.includes(keywordId);
}

const LAST_VISIT_KEY = "compass:lastVisit";
export function getLastVisit(): Date | null {
  const raw = localStorage.getItem(LAST_VISIT_KEY);
  return raw ? new Date(raw) : null;
}
export function touchLastVisit() {
  localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
}
