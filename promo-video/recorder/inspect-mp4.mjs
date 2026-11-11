// Minimal MP4 box inspector: brand, duration, tracks, codec config, sample counts, frame-rate constancy.
import { readFileSync } from "node:fs";
const buf = readFileSync(process.argv[2]);
const u32 = o => buf.readUInt32BE(o), str = (o, n) => buf.toString("latin1", o, o + n);
const CONT = new Set(["moov", "trak", "mdia", "minf", "stbl", "edts", "dinf"]);
const out = { tracks: [] }; let cur;
function walk(s, e, depth) {
  for (let o = s; o < e;) {
    let size = u32(o), type = str(o + 4, 4), h = 8; if (size === 1) { size = Number(buf.readBigUInt64BE(o + 8)); h = 16; } if (size === 0) size = e - o;
    const b = o + h;
    if (type === "ftyp") out.brand = str(b, 4) + " compat:" + Array.from({ length: (size - 16) / 4 }, (_, i) => str(b + 8 + i * 4, 4)).join(",");
    if (type === "mvhd") { const v = buf[b]; const ts = v ? u32(b + 20) : u32(b + 12), du = v ? Number(buf.readBigUInt64BE(b + 24)) : u32(b + 16); out.duration = du / ts; }
    if (type === "trak") { cur = {}; out.tracks.push(cur); }
    if (type === "tkhd") { const v = buf[b]; const off = v ? b + 84 + 4 : b + 72 + 4; cur.width = u32(off) / 65536; cur.height = u32(off + 4) / 65536; }
    if (type === "mdhd") { const v = buf[b]; cur.timescale = v ? u32(b + 20) : u32(b + 12); cur.mdDuration = (v ? Number(buf.readBigUInt64BE(b + 24)) : u32(b + 16)) / cur.timescale; }
    if (type === "hdlr") cur.handler = str(b + 8, 4);
    if (type === "stsd") { const t = str(b + 12, 4); cur.codec = t;
      if (t === "avc1") { const avcC = buf.indexOf("avcC", b, "latin1"); cur.profile = buf[avcC + 5]; cur.level = buf[avcC + 7]; cur.sampleW = buf.readUInt16BE(b + 8 + 8 + 24); cur.sampleH = buf.readUInt16BE(b + 8 + 8 + 26); cur.colr = buf.indexOf("colr", b, "latin1") > 0 && buf.indexOf("colr", b, "latin1") < b + size; }
      if (t === "mp4a") { cur.channels = buf.readUInt16BE(b + 8 + 8 + 16); cur.sampleRate = u32(b + 8 + 8 + 24) >>> 16; const esds = buf.indexOf("esds", b, "latin1"); cur.esdsFound = esds > 0; } }
    if (type === "stts") { const n = u32(b + 4); cur.stts = Array.from({ length: n }, (_, i) => [u32(b + 8 + i * 8), u32(b + 12 + i * 8)]); }
    if (type === "stss") cur.keyframes = u32(b + 4);
    if (type === "stsz") cur.samples = u32(b + 8);
    if (CONT.has(type)) walk(b, o + size, depth + 1);
    o += size;
  }
}
walk(0, buf.length, 0);
for (const t of out.tracks) if (t.stts) { t.sttsSummary = t.stts.map(([c, d]) => `${c}×${d}`).join(" "); delete t.stts; }
console.log(JSON.stringify(out, null, 1));
