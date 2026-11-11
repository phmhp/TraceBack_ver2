// Local static server for the promo compositor (serves the promo-video folder) + POST /save to write rendered files.
// Usage: node compositor/server.mjs   → http://127.0.0.1:5191/compositor/index.html
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { extname, join, normalize, dirname } from "node:path";

const ROOT = normalize(join(dirname(new URL(import.meta.url).pathname), ".."));
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2", ".otf": "font/otf", ".mp4": "video/mp4", ".css": "text/css" };

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  try {
    if (req.method === "POST" && url.pathname === "/save") {
      const name = url.searchParams.get("name") ?? "";
      if (!/^(output|previews)\/[\w.\-]+$/.test(name)) { res.writeHead(400).end("bad name"); return; }
      const chunks = []; for await (const c of req) chunks.push(c);
      const file = join(ROOT, name); await mkdir(dirname(file), { recursive: true }); await writeFile(file, Buffer.concat(chunks));
      res.writeHead(200).end("ok " + Buffer.concat(chunks).length); return;
    }
    const file = normalize(join(ROOT, decodeURIComponent(url.pathname)));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    const data = await readFile(file), type = TYPES[extname(file)] ?? "application/octet-stream";
    const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? "");
    if (range) { // byte ranges so the browser can seek inside the rendered MP4
      const start = range[1] ? Number(range[1]) : data.length - Number(range[2]), end = range[1] && range[2] ? Number(range[2]) : data.length - 1;
      res.writeHead(206, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Range": `bytes ${start}-${end}/${data.length}`, "Content-Length": end - start + 1, "Cache-Control": "no-store" }).end(data.subarray(start, end + 1)); return;
    }
    res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "no-store" }).end(data);
  } catch (e) { res.writeHead(404).end(String(e.message)); }
}).listen(5191, "127.0.0.1", () => console.log("compositor server http://127.0.0.1:5191/compositor/index.html"));
