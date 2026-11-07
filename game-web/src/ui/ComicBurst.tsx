// Comic-book spiky speech burst that pops in at a screen edge, plus the
// sound/music toggle. Used for police closing in, crashes and fault moments.
import React, { useEffect, useState } from "react";
import { play, setMusic, setSfx, soundPrefs } from "./sfx";

type BurstTone = "police" | "crash" | "fault";

/** Spiky star outline (urchin-shaped speech bubble). */
function starPath(points = 14, outer = 50, inner = 38) {
  const d: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer + (i % 4 === 0 ? 3 : -2);
    const a = (i / (points * 2)) * Math.PI * 2;
    d.push(`${i ? "L" : "M"}${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r * .78).toFixed(1)}`);
  }
  return d.join(" ") + "Z";
}
const STAR = starPath();

export function ComicBurst({ tone, side = "right", icon, title, text, image, sound }: {
  tone: BurstTone; side?: "left" | "right" | "top"; icon: string; title: string; text?: string; image?: string; sound?: Parameters<typeof play>[0];
}) {
  useEffect(() => { if (sound) play(sound); }, [sound]);
  return <div className={`comicBurst tone-${tone} side-${side}`} role="status">
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d={STAR} /></svg>
    <div className="comicBurstBody">
      {image ? <span className="burstShot"><img src={image} alt="" /><i>{icon}</i></span> : <i>{icon}</i>}
      <span><b>{title}</b>{text && <em>{text}</em>}</span>
    </div>
  </div>;
}

export function SoundToggle() {
  const [prefs, setPrefs] = useState(soundPrefs);
  return <div className="soundToggle">
    <button aria-label="효과음 켜기/끄기" className={prefs.sfx ? "on" : ""} onClick={() => { setSfx(!prefs.sfx); setPrefs(soundPrefs()); }}>{prefs.sfx ? "🔊" : "🔈"}</button>
    <button aria-label="배경음 켜기/끄기" className={prefs.music ? "on" : ""} onClick={() => { setMusic(!prefs.music); setPrefs(soundPrefs()); }}>🎵</button>
  </div>;
}
