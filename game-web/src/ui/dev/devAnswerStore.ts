// DEV-ONLY. Stages publish "what is being asked right now and what the answer is" so the shared viewer can show it.
// Read-only: the store never touches Campaign, saved data or judgments. Call sites are wrapped in
// `import.meta.env.DEV && ...` so production builds drop both the call and the data passed to it.
import { useEffect, useSyncExternalStore } from "react";

export type DevRow = { k: string; v: string; tone?: "ok" | "no" };
export type DevCurrent = { stage: string; question: string; rows: DevRow[] } | null;

let current: DevCurrent = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach(fn => fn());

export function useDevAnswerCurrent(value: DevCurrent) {
  const key = JSON.stringify(value);
  useEffect(() => { current = value; emit(); return () => { current = null; emit(); }; }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
}
export function useDevCurrent(): DevCurrent {
  return useSyncExternalStore(fn => { subs.add(fn); return () => { subs.delete(fn); }; }, () => current);
}
