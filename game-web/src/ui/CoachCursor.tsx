import { useEffect, useState, type ReactNode } from "react";
import "./common-v3.css";

/**
 * "해설 시연": a cursor glides to the element the player should use and a ring pulses around it.
 * It is a pure overlay — it never clicks, drags or changes the play state.
 */
export function useCoach(): { show: (element: Element | null | undefined) => void; overlay: ReactNode } {
  const [target, setTarget] = useState<{ x: number; y: number; w: number; h: number; n: number } | null>(null);
  useEffect(() => { if (!target) return; const timer = window.setTimeout(() => setTarget(null), 3600); return () => window.clearTimeout(timer); }, [target]);
  const show = (element: Element | null | undefined) => {
    if (!element) return;
    const r = element.getBoundingClientRect();
    setTarget({ x: r.left, y: r.top, w: r.width, h: r.height, n: Date.now() });
  };
  const overlay = target ? (
    <div className="tbCoach" key={target.n} aria-hidden="true" style={{ left: target.x, top: target.y, width: target.w, height: target.h }}>
      <i className="tbCoachRing" />
      <svg className="tbCoachCursor" viewBox="0 0 24 24" width="34" height="34"><path d="M5 3l14 8-6 1.8L10.5 19z" fill="#fff" stroke="#33291f" strokeWidth="1.6" strokeLinejoin="round" /></svg>
    </div>
  ) : null;
  return { show, overlay };
}
