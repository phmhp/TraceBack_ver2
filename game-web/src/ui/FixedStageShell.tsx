import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./fixed-stage.css";

/**
 * WP0 — fixed 16:9 game canvas.
 *
 * The game (src/main.tsx) is a fluid layout written with vw/vh/clamp units.  Wrapping it in a
 * `transform: scale()` div would keep those units tied to the real window and would also skew
 * R3F pointer maths.  Instead the whole game runs in a same-origin <iframe> that is always laid out
 * at the design size (1600×900), and only the iframe is scaled to fit the window (letterboxed).
 * The browser maps pointer events into the iframe's own coordinate space, so 3D picking, drag and
 * viewport units inside the game see a constant 1600×900 viewport.
 */
export const DESIGN_W = 1600;
export const DESIGN_H = 900;

export const fitStage = (winW: number, winH: number) => {
  const scale = Math.min(winW / DESIGN_W, winH / DESIGN_H);
  return { scale, x: (winW - DESIGN_W * scale) / 2, y: (winH - DESIGN_H * scale) / 2 };
};

const measure = () => fitStage(window.innerWidth, window.innerHeight);

export function FixedStageShell() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [fit, setFit] = useState(measure);
  useLayoutEffect(() => {
    const update = () => setFit(measure());
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => { window.removeEventListener("resize", update); window.visualViewport?.removeEventListener("resize", update); };
  }, []);
  const focusGame = useCallback(() => { try { frame.current?.contentWindow?.focus(); } catch { /* cross-origin never happens here */ } }, []);
  useEffect(() => { window.addEventListener("focus", focusGame); return () => window.removeEventListener("focus", focusGame); }, [focusGame]);
  const src = `${location.pathname}${location.search}${location.hash}`;
  return (
    <div className="fixedStageShell" data-fixed-stage-scale={fit.scale.toFixed(4)} onPointerDown={focusGame}>
      <iframe
        ref={frame}
        className="fixedStageFrame"
        title="TraceBack"
        src={src}
        allow="fullscreen; autoplay"
        onLoad={focusGame}
        style={{ width: DESIGN_W, height: DESIGN_H, transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.scale})` }}
      />
    </div>
  );
}

export function mountShell(root: HTMLElement) {
  createRoot(root).render(<FixedStageShell />);
}
