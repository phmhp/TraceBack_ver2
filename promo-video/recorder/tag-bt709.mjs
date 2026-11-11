// Inserts a 'colr' (nclx: BT.709 primaries/transfer/matrix, limited range) box into the avc1 sample entry
// and shifts chunk offsets (moov precedes mdat). Usage: node tag-bt709.mjs in.mp4 out.mp4
import { readFileSync, writeFileSync } from "node:fs";
const [inp, outp] = process.argv.slice(2);
const buf = readFileSync(inp);
const colr = Buffer.alloc(19); colr.writeUInt32BE(19, 0); colr.write("colr", 4, "latin1"); colr.write("nclx", 8, "latin1");
colr.writeUInt16BE(1, 12); colr.writeUInt16BE(1, 14); colr.writeUInt16BE(1, 16); colr.writeUInt8(0, 18);
const CONT = new Set(["moov", "trak", "mdia", "minf", "stbl"]);
let insertAt = -1; const parents = []; let moovEnd = -1;
function walk(s, e, chain) {
  for (let o = s; o < e;) {
    const size = buf.readUInt32BE(o), type = buf.toString("latin1", o + 4, o + 8);
    if (type === "moov") moovEnd = o + size;
    if (type === "stsd") {
      const entry = o + 16, esize = buf.readUInt32BE(entry), etype = buf.toString("latin1", entry + 4, entry + 8);
      if (etype === "avc1") { insertAt = entry + esize; parents.push(...chain, o, entry); }
    }
    if (CONT.has(type)) walk(o + 8, o + size, [...chain, o]);
    o += size;
  }
}
walk(0, buf.length, []);
if (insertAt < 0 || moovEnd < 0) throw new Error("avc1 entry not found");
const out = Buffer.concat([buf.subarray(0, insertAt), colr, buf.subarray(insertAt)]);
for (const p of parents) out.writeUInt32BE(out.readUInt32BE(p) + 19, p);           // grow ancestors (offsets before insertAt are unchanged)
// shift stco/co64 entries (mdat moved by 19 bytes)
for (let o = 0; o < moovEnd + 19;) {
  const i = out.indexOf("stco", o, "latin1"), j = out.indexOf("co64", o, "latin1");
  const k = [i, j].filter(x => x > 0 && x < moovEnd + 19).sort((a, b) => a - b)[0]; if (k === undefined) break;
  const n = out.readUInt32BE(k + 8);
  if (out.toString("latin1", k, k + 4) === "stco") for (let e = 0; e < n; e++) out.writeUInt32BE(out.readUInt32BE(k + 12 + e * 4) + 19, k + 12 + e * 4);
  else for (let e = 0; e < n; e++) out.writeBigUInt64BE(out.readBigUInt64BE(k + 12 + e * 8) + 19n, k + 12 + e * 8);
  o = k + 4;
}
writeFileSync(outp, out); console.log("tagged", outp, out.length);
