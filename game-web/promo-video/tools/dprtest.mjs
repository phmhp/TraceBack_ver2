import { launch, recorder, sleep } from "./cdp.mjs";
const S = process.argv[2];
const page = await launch({ profile: S + "/chrome-profile", scale: 2 });
await page.goto("http://127.0.0.1:5180/?qa=TWIN_BENCH&case=propulsion"); await sleep(2000);
console.log(await page.eval("devicePixelRatio"));
const rec = recorder(page, S + "/cap-dpr"); await rec.start(); await sleep(1500); console.log(await rec.stop());
await page.close();
