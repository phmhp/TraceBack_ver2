import { launch, sleep } from "./cdp.mjs";
const b = await launch({ profile: process.env.S + "/chrome-play", port: 9336 });
await b.goto("http://127.0.0.1:5191/compositor/verify.html");
console.log(JSON.stringify(await b.eval(`check([0.8, 3.6, 7.6, 12.0, 19.0, 21.2, 24.5, 34.9, 39.9, 45.8, 49.9, 54.2])`)));
b.close(); process.exit(0);
