import { useEffect, useRef } from "react";

/** Dev-only quick-progress hooks.  Active stages register what "auto answer" means for them;
 *  the DEV menu calls it.  In production builds the hook is a no-op and DevMenu is not bundled. */
export type DevActions = { solve?: () => void; label?: string };

let registered: DevActions | null = null;
const listeners = new Set<() => void>();

export const getDevActions = () => registered;
export const subscribeDevActions = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };

export function useDevActions(actions: DevActions) {
  const ref = useRef(actions);
  ref.current = actions;
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const entry: DevActions = { label: actions.label, solve: () => ref.current.solve?.() };
    registered = entry;
    listeners.forEach(fn => fn());
    return () => { if (registered === entry) { registered = null; listeners.forEach(fn => fn()); } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions.label]);
}
