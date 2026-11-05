import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const outputDir = process.argv[2] ?? path.join(projectRoot, "deliverables", "TraceBack_UI_Screens_20261105");
const baseUrl = process.env.TRACEBACK_CAPTURE_URL ?? "http://127.0.0.1:5173";
const chromePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const profileDir = path.join(tmpdir(), `traceback-ui-capture-${process.pid}`);
const captureFilter = process.env.TRACEBACK_CAPTURE_FILTER;
const waitOverride = Number(process.env.TRACEBACK_CAPTURE_WAIT_OVERRIDE || 0);
const viewportWidth = Math.max(800, Number(process.env.TRACEBACK_CAPTURE_WIDTH || 1600));
const viewportHeight = Math.max(600, Number(process.env.TRACEBACK_CAPTURE_HEIGHT || 900));
const autoDriveFinale = process.env.TRACEBACK_CAPTURE_AUTODRIVE === "1";
const shipCaptureDistance = process.env.TRACEBACK_CAPTURE_SHIP_DISTANCE;

const screens = [
  { name: "00_title.png", url: "/?new=1", wait: 1200 },
  { name: "01_prologue.png", url: "/?qa=PROLOGUE", wait: 1300 },
];

const domains = [
  ["drive", "구동"], ["brake", "제동"], ["steer", "조향"], ["gear", "기어"],
  ["power", "전원"], ["thermal", "열관리"], ["suspension", "현가"],
];
const views = [[0, "system"], [1, "ee"], [2, "sw"]];
let number = 2;
for (const [domain] of domains) {
  for (const [view, viewName] of views) {
    screens.push({
      name: `${String(number++).padStart(2, "0")}_garage_${domain}_${viewName}.png`,
      url: `/?qa=GARAGE_L1&domain=${domain}&view=${view}`,
      wait: 1800,
    });
  }
}

screens.push(
  { name: `${number++}_heist_door.png`, url: "/?qa=DRIVE_BRIEFING&cut=0", wait: 1800 },
  { name: `${number++}_heist_boarding.png`, url: "/?qa=DRIVE_BRIEFING&cut=1", wait: 1800 },
  { name: `${number++}_race_start.png`, url: "/?qa=CHASE_NORMAL", wait: 3400 },
  { name: `${number++}_fault_dialogue.png`, url: "/?qa=FAULT_CUE", wait: 1500 },
  { name: `${number++}_evidence_board.png`, url: "/?qa=BOARD", wait: 1600 },
  { name: `${number++}_wiring_puzzle.png`, url: "/?qa=WIRING", wait: 1600 },
  { name: `${number++}_lab_sw.png`, url: "/?qa=TWIN_BENCH&tab=sw", wait: 1800 },
  { name: `${number++}_lab_ecu_integration.png`, url: "/?qa=TWIN_BENCH&tab=embedded", wait: 1800 },
  { name: `${number++}_lab_system.png`, url: "/?qa=TWIN_BENCH&tab=system", wait: 1800 },
  { name: `${number++}_lab_vehicle.png`, url: "/?qa=TWIN_BENCH&tab=vehicle", wait: 1800 },
  { name: `${number++}_failure_analysis.png`, url: "/?qa=VERIFY_FAIL", wait: 3900 },
  { name: `${number++}_repair.png`, url: "/?qa=REPAIR", wait: 1500 },
  { name: `${number++}_race_resume.png`, url: "/?qa=CHASE_RESUME", wait: 1600 },
  { name: `${number++}_final_dock_race.png`, url: `/?qa=SHIP_ESCAPE${shipCaptureDistance ? `&distance=${encodeURIComponent(shipCaptureDistance)}` : ""}`, wait: 1500 },
  { name: `${number++}_ship_jump.png`, url: "/?qa=SHIP_BOARDING&cut=0", wait: 1800 },
  { name: `${number++}_ship_landing.png`, url: "/?qa=SHIP_BOARDING&cut=1", wait: 1800 },
  { name: `${number++}_caught_continue.png`, url: "/?qa=CAUGHT", wait: 1200 },
  { name: `${number++}_pause.png`, url: "/?qa=PAUSE", wait: 1200 },
  { name: `${number++}_ending.png`, url: "/?qa=ENDING", wait: 1400 },
);

class CdpClient {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.waiters = new Map();
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result ?? {});
        return;
      }
      const listeners = this.waiters.get(message.method);
      if (!listeners?.length) return;
      this.waiters.set(message.method, listeners.slice(1));
      listeners[0](message.params ?? {});
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  waitFor(method, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeoutMs);
      const listeners = this.waiters.get(method) ?? [];
      listeners.push((params) => { clearTimeout(timer); resolve(params); });
      this.waiters.set(method, listeners);
    });
  }

  close() {
    this.socket.close();
  }
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const getFreePort = () => new Promise((resolve, reject) => {
  const server = createServer();
  server.unref();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    server.close((error) => error ? reject(error) : resolve(port));
  });
});

async function startChrome() {
  await mkdir(profileDir, { recursive: true });
  const debugPort = await getFreePort();
  const args = [
    "--headless=new", `--remote-debugging-port=${debugPort}`, "--remote-debugging-address=127.0.0.1", `--user-data-dir=${profileDir}`,
    `--window-size=${viewportWidth},${viewportHeight}`, "--force-device-scale-factor=1", "--hide-scrollbars",
    "--no-first-run", "--no-default-browser-check", "--disable-extensions",
    "--disable-background-networking", "--disable-sync", "--metrics-recording-only",
    "about:blank",
  ];
  const child = spawn(chromePath, args, { stdio: ["ignore", "ignore", "pipe"], windowsHide: true });
  child.once("exit", (code, signal) => {
    if (code) console.error(`Capture browser exited before connection (code ${code}, signal ${signal ?? "none"}).`);
  });
  let launchDiagnostics = "";
  const webSocketUrl = await new Promise((resolve, reject) => {
    let finished = false;
    const finish = (value) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => {
      if (finished) return;
      finished = true;
      reject(new Error(`Chrome DevTools endpoint did not start${launchDiagnostics ? `: ${launchDiagnostics.slice(-500)}` : ""}`));
    }, 20000);
    child.once("error", (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      reject(error);
    });
    child.stderr.on("data", (chunk) => {
      launchDiagnostics += String(chunk);
      const match = String(chunk).match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (!match) return;
      finish(match[1]);
    });
    const activePortFile = path.join(profileDir, "DevToolsActivePort");
    const pollActivePort = async () => {
      while (!finished) {
        try {
          const version = await fetch(`http://127.0.0.1:${debugPort}/json/version`).then((response) => response.ok ? response.json() : null);
          if (version?.webSocketDebuggerUrl) return finish(version.webSocketDebuggerUrl);
        } catch {}
        try {
          const [port, socketPath] = String(await readFile(activePortFile, "utf8")).trim().split(/\r?\n/);
          if (port && socketPath) return finish(`ws://127.0.0.1:${port}${socketPath}`);
        } catch {}
        await delay(100);
      }
    };
    void pollActivePort();
  });
  return { child, webSocketUrl };
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const captureFilters = captureFilter?.split(",").map((value) => value.trim()).filter(Boolean) ?? [];
  const selectedScreens = captureFilters.length
    ? screens.filter((screen) => captureFilters.some((filter) => screen.name.includes(filter)))
    : screens;
  if (!selectedScreens.length) throw new Error(`No screen matched ${captureFilter}`);
  const { child, webSocketUrl } = await startChrome();
  const endpoint = new URL(webSocketUrl);
  const browser = new CdpClient(webSocketUrl);
  let page;
  try {
    await browser.open();
    const target = await fetch(`http://${endpoint.host}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" }).then((response) => response.json());
    page = new CdpClient(target.webSocketDebuggerUrl);
    await page.open();
    await page.send("Page.enable");
    await page.send("Runtime.enable");
    await page.send("Emulation.setDeviceMetricsOverride", { width: viewportWidth, height: viewportHeight, deviceScaleFactor: 1, mobile: false });
    await page.send("Emulation.setVisibleSize", { width: viewportWidth, height: viewportHeight });

    for (const [index, screen] of selectedScreens.entries()) {
      const loaded = page.waitFor("Page.loadEventFired");
      await page.send("Page.navigate", { url: new URL(screen.url, baseUrl).href });
      await loaded;
      await page.send("Runtime.evaluate", {
        expression: "document.fonts?.ready ?? Promise.resolve()",
        awaitPromise: true,
        returnByValue: true,
      });
      if (autoDriveFinale && screen.name.includes("final_dock_race")) {
        await page.send("Page.bringToFront");
        await page.send("Runtime.evaluate", { expression: "window.focus(); document.body?.focus(); true", returnByValue: true });
        await page.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "w", code: "KeyW", text: "w", unmodifiedText: "w", windowsVirtualKeyCode: 87, nativeVirtualKeyCode: 87 });
        let reachedBoarding = false;
        const deadline = Date.now() + 12000;
        while (Date.now() < deadline) {
          const result = await page.send("Runtime.evaluate", { expression: "Boolean(document.querySelector('.shipBoarding, .finaleStillScene, .ending'))", returnByValue: true });
          if (result.result?.value) { reachedBoarding = true; break; }
          await delay(150);
        }
        await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: "w", code: "KeyW", windowsVirtualKeyCode: 87, nativeVirtualKeyCode: 87 });
        if (!reachedBoarding) {
          const diagnostics = await page.send("Runtime.evaluate", {
            expression: "JSON.stringify({className:document.querySelector('#root>div')?.className,race:document.querySelector('.raceV2')?.dataset ?? null,text:document.querySelector('.finalRampCommit')?.textContent ?? document.body.innerText.slice(-240)})",
            returnByValue: true,
          });
          throw new Error(`Finale regression: the car did not reach SHIP_BOARDING within 12 seconds. ${diagnostics.result?.value ?? ""}`);
        }
      }
      await delay(waitOverride || screen.wait);
      await page.send("Runtime.evaluate", {
        expression: "new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))",
        awaitPromise: true,
      });
      const { data } = await page.send("Page.captureScreenshot", {
        format: "png", fromSurface: true, captureBeyondViewport: false,
      });
      await writeFile(path.join(outputDir, screen.name), Buffer.from(data, "base64"));
      process.stdout.write(`[${index + 1}/${selectedScreens.length}] ${screen.name}\n`);
    }
  } finally {
    page?.close();
    try { await browser.send("Browser.close"); } catch {}
    browser.close();
    await delay(400);
    if (!child.killed) child.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

