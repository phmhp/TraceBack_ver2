// Dev-only: exposes `window.__tbProbe[name](frames)` which renders the current
// scene synchronously N times and reports ms/frame, draw calls and triangles.
// Works even when the tab is in the background (requestAnimationFrame paused).
import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

type ProbeResult = { msPerFrame: number; drawCalls: number; triangles: number };
declare global { interface Window { __tbProbe?: Record<string, (frames?: number) => ProbeResult> } }

export function DevRenderProbe({ name }: { name: string }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    window.__tbProbe ??= {};
    window.__tbProbe[name] = (frames = 60) => {
      const context = gl.getContext();
      const pixel = new Uint8Array(4);
      gl.render(scene, camera);
      context.readPixels(0, 0, 1, 1, context.RGBA, context.UNSIGNED_BYTE, pixel);
      const start = performance.now();
      for (let i = 0; i < frames; i++) gl.render(scene, camera);
      context.readPixels(0, 0, 1, 1, context.RGBA, context.UNSIGNED_BYTE, pixel); // wait for the GPU
      const msPerFrame = (performance.now() - start) / frames;
      return { msPerFrame: Math.round(msPerFrame * 100) / 100, drawCalls: gl.info.render.calls, triangles: gl.info.render.triangles };
    };
    return () => { delete window.__tbProbe?.[name]; };
  }, [gl, scene, camera, name]);
  return null;
}
