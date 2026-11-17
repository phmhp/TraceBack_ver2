import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./scaled-frame.css";

export const CANVAS_W = 1600;
export const CANVAS_H = 900;

const fit = () => Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H);

/** Fixed-ratio host kept for the legacy embed entry point. */
function ScaledFrame() {
  const [scale, setScale] = useState(fit);
  const frame = useRef<HTMLIFrameElement>(null);
  const src = useMemo(() => { const url = new URL(location.href); url.searchParams.set("embed", "1"); return url.toString(); }, []);
  useEffect(() => {
    const onResize = () => setScale(fit());
    const refocus = () => frame.current?.contentWindow?.focus();
    window.addEventListener("resize", onResize);
    window.addEventListener("focus", refocus);
    return () => { window.removeEventListener("resize", onResize); window.removeEventListener("focus", refocus); };
  }, []);
  return <div className="scaleHost">
    <iframe ref={frame} className="scaleFrame" title="TraceBack" src={src} allow="autoplay; fullscreen"
      onLoad={() => frame.current?.contentWindow?.focus()}
      style={{ width: CANVAS_W, height: CANVAS_H, transform: `translate(-50%, -50%) scale(${scale})` }} />
  </div>;
}

export function mountScaledFrame() {
  createRoot(document.getElementById("root")!).render(<ScaledFrame />);
}
