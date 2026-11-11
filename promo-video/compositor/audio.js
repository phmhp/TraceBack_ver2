// Synthesized soundtrack: original music bed + editorial sound effects, rendered offline (48 kHz stereo).
// No third-party audio is used. Effects are placed from the real click/drag events of each shot plus a few edit cues.
import { SHOTS, DURATION } from "./timeline.js";

const SR = 48000;
export async function renderAudio(clips) {
  const ac = new OfflineAudioContext(2, Math.ceil(SR * DURATION), SR);
  const master = ac.createDynamicsCompressor(); master.threshold.value = -14; master.ratio.value = 3; master.attack.value = .01; master.release.value = .2;
  const out = ac.createGain(); out.gain.value = .9; master.connect(out).connect(ac.destination);
  const music = ac.createGain(); music.gain.value = 1.0; music.connect(master);
  const sfx = ac.createGain(); sfx.gain.value = 1.15; sfx.connect(master);
  const noise = (() => { const b = ac.createBuffer(1, SR * 2, SR), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; })();
  const env = (g, t, a, peak, d, end = .0001) => { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(end, t + a + d); };
  const osc = (type, f, t, dur, peak, dest, a = .005, f2) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur); env(g, t, a, peak, dur); o.connect(g).connect(dest); o.start(t); o.stop(t + a + dur + .05); };
  const nz = (t, dur, peak, dest, type = "highpass", f = 6000, q = .7, f2) => { const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noise; fl.type = type; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur); fl.Q.value = q; env(g, t, .004, peak, dur); s.connect(fl).connect(g).connect(dest); s.start(t, Math.random()); s.stop(t + dur + .05); };

  // ── music: 120 BPM, A minor (Am – F – C – G), sections follow the edit
  const beat = .5, bar = 2;
  const chords = [[57, 60, 64], [53, 57, 60], [48, 55, 60], [55, 59, 62]];
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const level = t => t < 2.3 ? .45 : t < 5 ? .8 : t < 9.4 ? .65 : t < 30 ? .75 : t < 48 ? .9 : t < 52.8 ? .85 : .7;
  // tension drone + riser before the title
  osc("sawtooth", hz(33), 0, 2.4, .12, music, 1.2); nz(0.4, 1.9, .10, music, "bandpass", 400, 1.5, 5000);
  for (let t = 2.3; t < DURATION - .6; t += beat) {
    const b = Math.round((t - 2.3) / beat), ch = chords[Math.floor((t - 2.3) / (bar * 2)) % 4], L = level(t);
    if (b % 2 === 0 || t > 30) { // kick
      const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + .22); env(g, t, .003, .55 * L, .28); o.connect(g).connect(music); o.start(t); o.stop(t + .35);
    }
    if (t > 30 && b % 4 === 2) nz(t, .16, .22 * L, music, "bandpass", 1800, .9); // clap in STEP04
    for (let h = 0; h < 2; h++) nz(t + h * .25, .04, (h ? .05 : .08) * L, music, "highpass", 8000);
    // bass eighths
    for (let e = 0; e < 2; e++) { const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(); o.type = "sawtooth"; o.frequency.value = hz(ch[0] - 24); f.type = "lowpass"; f.frequency.value = 380 + 300 * L; env(g, t + e * .25, .01, .16 * L, .2); o.connect(f).connect(g).connect(music); o.start(t + e * .25); o.stop(t + e * .25 + .3); }
    // arpeggio (STEP sections)
    if (t > 9.4 && t < 52.8) for (let e = 0; e < 2; e++) osc("triangle", hz(ch[(b * 2 + e) % 3] + 12), t + e * .25, .18, .06 * L, music);
  }
  // pads per bar
  for (let t = 2.3; t < DURATION; t += bar * 2) { const ch = chords[Math.floor((t - 2.3) / (bar * 2)) % 4]; ch.forEach(m => [-6, 6].forEach(det => { const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(); o.type = "sawtooth"; o.frequency.value = hz(m); o.detune.value = det; f.type = "lowpass"; f.frequency.value = 900; g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.025 * level(t), t + .8); g.gain.linearRampToValueAtTime(.0001, Math.min(DURATION, t + 4)); o.connect(f).connect(g).connect(music); o.start(t); o.stop(Math.min(DURATION, t + 4.05)); })); }
  // ending swell + brand sting
  [57, 64, 69, 72, 76].forEach((m, i) => osc("triangle", hz(m), 53.2 + i * .09, 1.4, .09, music, .01));
  osc("sine", hz(45), 53.2, 1.6, .35, music, .01);
  music.gain.setValueAtTime(1.0, DURATION - .8); music.gain.linearRampToValueAtTime(.0001, DURATION);

  // ── sound effects
  const click = t => { osc("sine", 2300, t, .035, .18, sfx, .001, 1500); nz(t, .02, .08, sfx, "highpass", 5000); };
  const swipe = t => nz(t, .22, .12, sfx, "bandpass", 900, 1.2, 3500);
  const paper = t => { nz(t, .12, .2, sfx, "bandpass", 2500, .6); nz(t + .05, .08, .12, sfx, "lowpass", 900); };
  const whoosh = t => nz(t - .15, .45, .22, sfx, "bandpass", 300, 1.1, 6000);
  const scan = t => osc("sine", 600, t, .35, .07, sfx, .01, 2400);
  const stamp = t => { osc("sine", 140, t, .2, .5, sfx, .002, 60); nz(t, .07, .25, sfx, "lowpass", 1500); };
  const chime = t => { osc("sine", hz(84), t, .35, .16, sfx, .004); osc("sine", hz(88), t + .09, .5, .14, sfx, .004); };
  const buzz = t => osc("square", 110, t, .22, .06, sfx, .005, 90);
  const boom = t => { osc("sine", 70, t, 1.0, .7, sfx, .004, 38); nz(t, .5, .2, sfx, "lowpass", 600); osc("triangle", hz(57), t, 1.1, .08, sfx, .01); };
  const engine = (t, d) => { const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(); o.type = "sawtooth"; o.frequency.setValueAtTime(55, t); o.frequency.linearRampToValueAtTime(95, t + d); f.type = "lowpass"; f.frequency.value = 500; g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.08, t + .2); g.gain.linearRampToValueAtTime(.0001, t + d); o.connect(f).connect(g).connect(sfx); o.start(t); o.stop(t + d + .05); };

  for (const shot of SHOTS) {
    if (!shot.clip || shot.still) continue;
    const c = clips[shot.clip];
    for (const e of c.events) {
      const vt = shot.t + (e.t - shot.from) / 1000 / shot.speed;
      if (vt < shot.t || vt >= shot.t + shot.d) continue;
      if (e.type === "click") (shot.clip === "board" && shot.t === 15.0 ? paper : click)(vt);
      if (e.type === "down") swipe(vt);
    }
  }
  engine(0, 2.0);
  buzz(1.58); nz(1.58, .4, .18, sfx, "bandpass", 1200, 4); // fault warning
  boom(2.4);                                               // title impact
  [5.0, 9.4, 15.0, 23.0, 30.0, 48.0, 50.4, 52.8].forEach(t => { whoosh(t); scan(t + .05); });
  [7.05, 7.29, 7.53, 7.77, 8.01, 8.25].forEach(t => click(t)); // AI process nodes
  scan(20.95);                                             // first deviation focus
  stamp(39.65); stamp(41.72);                               // hypothesis stamps (지지 / 반박)
  buzz(34.55);                                             // FAIL result
  stamp(35.68);                                            // 판단 보류 recorded
  boom(43.2);                                             // final cause confirmed
  engine(44.35, 2.1); chime(46.4);                          // A/B run → match
  chime(49.77);                                             // retest PASS
  engine(51.3, 1.5);
  return ac.startRendering();
}
