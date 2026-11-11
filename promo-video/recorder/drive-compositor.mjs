// Drives the compositor page: node --experimental-websocket drive-compositor.mjs snap 0.5,1.6,...  |  render
import { launch, sleep } from "./cdp.mjs";
const [mode, arg] = process.argv.slice(2);
const b = await launch({ profile: process.env.S + "/chrome-comp", port: 9335 });
b.listeners.add(m => { if (m.method === "Runtime.consoleAPICalled") console.error("page:", m.params.args.map(a => a.value ?? a.description).join(" ")); if (m.method === "Runtime.exceptionThrown") console.error("EXC", JSON.stringify(m.params.exceptionDetails).slice(0, 600)); });
await b.goto("http://127.0.0.1:5191/compositor/index.html");
await b.eval("window.__ready");
if (mode === "snap") console.log(await b.eval(`snap([${arg}], ${JSON.stringify(process.argv[4] ?? "p")})`));
else console.log(JSON.stringify(await b.eval(`renderVideo(${arg ? JSON.stringify(arg) : ""})`)));
b.close(); process.exit(0);
