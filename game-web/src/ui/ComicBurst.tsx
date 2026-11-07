// Comic-book spiky speech burst that pops in at a screen edge, plus the
// sound/music toggle. Used for police closing in, crashes and fault moments.
import React, { useEffect, useState } from "react";
import { play, setMusic, setSfx, soundPrefs } from "./sfx";

type BurstTone = "police" | "crash" | "fault";

const ICON: Record<BurstTone, string> = { police: "/assets/ui/icon-police.svg", crash: "/assets/ui/icon-crash.svg", fault: "/assets/ui/icon-skull.svg" };

/**
 * Racing-game style alert: dashes in from the screen edge with squash & overshoot,
 * holds briefly, then dashes out. Title is one short word (no wrapping).
 * `image` shows only the object (transparent cut-out), with the tone icon as a badge.
 */
export function ComicBurst({ tone, side = "right", title, image, sound }: {
  tone: BurstTone; side?: "left" | "right" | "top"; title: string; image?: string; sound?: Parameters<typeof play>[0];
}) {
  useEffect(() => { if (sound) play(sound); }, [sound]);
  return <div className={`comicBurst tone-${tone} side-${side}`} role="status" aria-label={title}>
    <img className="burstBg" src={`/assets/ui/burst-${tone}.svg`} alt="" />
    <div className="comicBurstBody">
      {image ? <span className="burstShot"><img src={image} alt="" /><img className="burstBadge" src={ICON[tone]} alt="" /></span> : <img className="burstIcon" src={ICON[tone]} alt="" />}
      <b>{title}</b>
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
