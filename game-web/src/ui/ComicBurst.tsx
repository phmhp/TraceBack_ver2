// Comic-book spiky speech burst that pops in at a screen edge, plus the
// sound/music toggle. Used for police closing in, crashes and fault moments.
import React, { useEffect, useState } from "react";
import { play, setMusic, setSfx, soundPrefs } from "./sfx";

type BurstTone = "police" | "crash" | "fault";

const ICON: Record<BurstTone, string> = { police: "/assets/ui/icon-police.svg", crash: "/assets/ui/icon-crash.svg", fault: "/assets/ui/icon-skull.svg" };

/**
 * Tension alert shown only at the left/right screen edge: a small fish-shaped
 * speech bubble (tail toward the edge) that slides in, bobs, then slides out.
 * One short word + one small picture (icon or a transparent part cut-out).
 */
export function ComicBurst({ tone, side = "right", title, image, sound }: {
  tone: Exclude<BurstTone, "crash">; side?: "left" | "right"; title: string; image?: string; sound?: Parameters<typeof play>[0];
}) {
  useEffect(() => { if (sound) play(sound); }, [sound]);
  return <div className={`fishAlert tone-${tone} side-${side}`} role="status" aria-label={title}>
    <img className="fishShape" src={`/assets/ui/bubble-fish-${tone}.svg`} alt="" />
    <div className="fishBody">
      <img className={image ? "fishPart" : "fishIcon"} src={image ?? ICON[tone]} alt="" />
      <b>{title}</b>
    </div>
  </div>;
}

export function SoundToggle() {
  const [prefs, setPrefs] = useState(soundPrefs);
  useEffect(() => { const sync = () => setPrefs(soundPrefs()); addEventListener("tb-music-scene", sync); return () => removeEventListener("tb-music-scene", sync); }, []);
  return <div className="soundToggle">
    <button aria-label="효과음 켜기/끄기" className={prefs.sfx ? "on" : ""} onClick={() => { setSfx(!prefs.sfx); setPrefs(soundPrefs()); }}>{prefs.sfx ? "🔊" : "🔈"}</button>
    <button aria-label="배경음 켜기/끄기" className={prefs.music ? "on" : ""} onClick={() => { setMusic(!prefs.music); setPrefs(soundPrefs()); }}>🎵</button>
  </div>;
}
