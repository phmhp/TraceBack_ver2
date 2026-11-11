import { launch, sleep } from "./cdp.mjs";
const S = process.env.S;
const b = await launch({ profile: S + "/chrome-prof" });
await b.goto("http://127.0.0.1:5180/?qa=CHASE_NORMAL&case=propulsion");
await sleep(4000);
console.log(await b.eval(`(() => { const c = document.createElement("canvas").getContext("webgl2"); const d = c && c.getExtension("WEBGL_debug_renderer_info"); return { gl: !!c, renderer: d ? c.getParameter(d.UNMASKED_RENDERER_WEBGL) : null, scene: document.body.className, text: document.body.innerText.slice(0,200) }; })()`));
await b.shot(S + "/probe-race.jpg");
await b.startRec(S + "/probe-rec"); await sleep(3000); console.log(await b.stopRec());
b.close(); process.exit(0);
