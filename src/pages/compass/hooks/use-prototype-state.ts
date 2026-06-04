import { useCallback, useEffect, useState } from "react";
import {
  type HypothesisTest,
  type ReportTemplateId,
  type Stance,
  type WatchlistItem,
  type WorkspaceItem,
  type WorkspaceItemKind,
  addHypothesisTest,
  addToWatchlist,
  addToWorkspace,
  clearWorkspace,
  getHypothesisTests,
  getReportTemplate,
  getWatchlist,
  getWorkspace,
  removeFromWatchlist,
  removeFromWorkspace,
  removeHypothesisTest,
  setReportTemplate,
  setWatchlistStance,
  subscribe,
  toggleWatchlist,
  updateHypothesisTest,
} from "../lib/prototype-store";

function useStore<T>(get: () => T, fallback: T): T {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => {
    const sync = () => setValue(get());
    sync();
    return subscribe(sync);
  }, [get]);
  return value;
}

export function useWatchlistItems() {
  const items = useStore<WatchlistItem[]>(getWatchlist, []);
  const has = useCallback((id: string) => items.some((i) => i.techId === id), [items]);
  const stanceOf = useCallback(
    (id: string): Stance | null => items.find((i) => i.techId === id)?.stance ?? null,
    [items],
  );
  return { items, has, stanceOf, add: addToWatchlist, remove: removeFromWatchlist, toggle: toggleWatchlist, setStance: setWatchlistStance };
}

export function useWorkspace() {
  const items = useStore<WorkspaceItem[]>(getWorkspace, []);
  const hasItem = useCallback(
    (kind: WorkspaceItemKind, refId: string) => items.some((i) => i.kind === kind && i.refId === refId),
    [items],
  );
  const byKind = useCallback(
    (kind: WorkspaceItemKind) => items.filter((i) => i.kind === kind),
    [items],
  );
  return { items, hasItem, byKind, add: addToWorkspace, remove: removeFromWorkspace, clear: clearWorkspace };
}

export function useReportTemplate() {
  const value = useStore<ReportTemplateId | null>(getReportTemplate, null);
  return { selectedReportTemplate: value, setReportTemplate };
}

export function useHypothesisTests() {
  const tests = useStore<HypothesisTest[]>(getHypothesisTests, []);
  return { tests, add: addHypothesisTest, update: updateHypothesisTest, remove: removeHypothesisTest };
}
