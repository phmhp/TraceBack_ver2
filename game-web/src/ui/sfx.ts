// Tiny Web Audio sound kit: every sound is synthesised in code (no audio files,
// no licences). Soft, toy-like tones in the spirit of a cosy island game.
// Sound and music each have an on/off switch saved per browser.

type Sfx = "pop" | "squish" | "zip" | "stamp" | "success" | "error" | "siren" | "crash" | "alarm";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const prefs = { sfx: read("tb-sfx", true), music: read("tb-music-v2", false), raceMusic: read("tb-race-music", true) };
let musicTimer: number | undefined;
// "calm" = lab/garage music box (off by default), "race" = driving track (on by default)
let musicScene: "calm" | "race" = "calm";
const musicWanted = () => musicScene === "race" ? prefs.raceMusic : prefs.music;

function read(key: string, fallback: boolean) {
  try { const value = localStorage.getItem(key); return value === null ? fallback : value === "1"; } catch { return fallback; }
}
function write(key: string, value: boolean) {
  try { localStorage.setItem(key, value ? "1" : "0"); } catch { /* storage unavailable */ }
}

function audio() {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = .5;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** One enveloped oscillator note. */
function tone(type: OscillatorType, from: number, to: number, start: number, length: number, volume: number) {
  const ac = audio();
  if (!ac || !master) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + length);
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + .012);
  gain.gain.exponentialRampToValueAtTime(.0001, start + length);
  osc.connect(gain).connect(master);
  osc.start(start);
  osc.stop(start + length + .02);
}

function noise(start: number, length: number, volume: number, cutoff: number) {
  const ac = audio();
  if (!ac || !master) return;
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * length), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const source = ac.createBufferSource();
  const filter = ac.createBiquadFilter();
  const gain = ac.createGain();
  source.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  gain.gain.value = volume;
  source.connect(filter).connect(gain).connect(master);
  source.start(start);
}

export function play(name: Sfx, pitch = 1) {
  if (!prefs.sfx) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const vary = pitch * (.94 + Math.random() * .12); // never exactly the same → keeps clicking fun
  switch (name) {
    case "pop": tone("sine", 520 * vary, 260 * vary, t, .09, .22); tone("triangle", 1040 * vary, 700 * vary, t, .05, .05); break;
    case "squish": tone("sine", 300 * vary, 120 * vary, t, .16, .25); noise(t, .06, .05, 900); break;
    case "zip": tone("triangle", 600 * pitch, 640 * pitch, t, .035, .06); break;
    case "stamp": tone("sine", 140, 60, t, .22, .45); noise(t, .12, .25, 600); break;
    case "success": [523, 659, 784, 1047].forEach((f, i) => tone("triangle", f, f, t + i * .08, .22, .14)); break;
    case "error": tone("square", 220, 180, t, .14, .07); tone("square", 180, 140, t + .13, .18, .07); break;
    case "siren": for (let i = 0; i < 4; i++) tone("sawtooth", i % 2 ? 660 : 880, i % 2 ? 660 : 880, t + i * .22, .2, .035); break;
    case "crash": noise(t, .35, .5, 1800); tone("sine", 110, 45, t, .3, .35); break;
    case "alarm": tone("square", 440, 440, t, .12, .06); tone("square", 440, 440, t + .2, .12, .06); tone("sine", 90, 60, t, .5, .2); break;
  }
}

// Music box loop: soft pentatonic phrase, low volume.
const PHRASE = [523, 659, 784, 659, 880, 784, 659, 587, 523, 587, 659, 523, 440, 523, 587, 0];
function startMusic() {
  if (musicTimer !== undefined) return;
  let step = 0;
  const tick = () => {
    const ac = audio();
    if (!ac) return;
    const note = PHRASE[step % PHRASE.length];
    if (note) { tone("sine", note, note, ac.currentTime, .5, .045); tone("triangle", note * 2, note * 2, ac.currentTime, .25, .012); }
    if (step % 4 === 0) tone("sine", PHRASE[step % PHRASE.length] / 2 || 262, 130, ac.currentTime, .6, .03);
    step++;
  };
  musicTimer = window.setInterval(tick, 300);
}
function stopMusic() { if (musicTimer !== undefined) { clearInterval(musicTimer); musicTimer = undefined; } }

// Driving track: 150 BPM minor groove (kick, off-beat hat, pulsing bass, short arpeggio), Am–F–G–Em.
const RACE_CHORDS = [[220, 262, 330], [175, 220, 262], [196, 247, 294], [165, 196, 247]];
function startRaceMusic() {
  if (musicTimer !== undefined) return;
  let step = 0; // 16th notes
  const tick = () => {
    const ac = audio();
    if (!ac) return;
    const t = ac.currentTime, beat = step % 16, chord = RACE_CHORDS[Math.floor(step / 16) % RACE_CHORDS.length];
    if (beat % 4 === 0) tone("sine", 130, 42, t, .18, .32);                       // kick
    if (beat % 4 === 2) noise(t, .04, .05, 7000);                                   // hat
    if (beat === 4 || beat === 12) noise(t, .1, .09, 2200);                         // snare-ish
    if (beat % 2 === 0) tone("sawtooth", chord[0] / 2, chord[0] / 2, t, .09, .05);  // pulsing bass
    if (beat % 2 === 1 && step % 64 >= 32) tone("square", chord[(beat >> 1) % 3] * 2, chord[(beat >> 1) % 3] * 2, t, .06, .018); // arpeggio, every other phrase
    step++;
  };
  musicTimer = window.setInterval(tick, 100);
}
function refreshMusic() {
  stopMusic();
  if (!musicWanted()) return;
  if (musicScene === "race") startRaceMusic(); else startMusic();
}
/** Racing scenes call this on mount ("race") and unmount ("calm"). */
export function setMusicScene(scene: "calm" | "race") { if (musicScene === scene) return; musicScene = scene; refreshMusic(); dispatchEvent(new Event("tb-music-scene")); }

export const soundPrefs = () => ({ sfx: prefs.sfx, music: musicWanted() });
export function setSfx(on: boolean) { prefs.sfx = on; write("tb-sfx", on); if (on) play("pop"); }
export function setMusic(on: boolean) { if (musicScene === "race") { prefs.raceMusic = on; write("tb-race-music", on); } else { prefs.music = on; write("tb-music-v2", on); } refreshMusic(); }

let installed = false;
/** Global feel: every button pops, dragging on the board/wiring canvas zips. */
export function installGlobalSfx() {
  if (installed) return;
  installed = true;
  let drawing = false, lastX = 0, lastY = 0, travelled = 0;
  addEventListener("pointerdown", event => {
    const target = event.target as HTMLElement | null;
    if (musicWanted() && musicTimer === undefined) refreshMusic(); // browsers need a user gesture before audio
    if (target?.closest("button:not(:disabled)")) play("pop");
    if (target?.closest(".caseCorkCanvas, .wireCanvas")) { drawing = true; lastX = event.clientX; lastY = event.clientY; travelled = 0; }
  }, { capture: true });
  addEventListener("keydown", () => { if (musicWanted() && musicTimer === undefined) refreshMusic(); }, { capture: true });
  addEventListener("pointermove", event => {
    if (!drawing) return;
    travelled += Math.hypot(event.clientX - lastX, event.clientY - lastY);
    lastX = event.clientX; lastY = event.clientY;
    if (travelled > 18) { play("zip", 1 + Math.min(1, travelled / 600)); travelled = 0; }
  });
  addEventListener("pointerup", () => { if (drawing) play("squish"); drawing = false; });
}
