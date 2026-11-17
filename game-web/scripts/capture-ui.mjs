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
const skipIntros = process.env.TRACEBACK_CAPTURE_SKIP_INTROS === "1";
const printMetrics = process.env.TRACEBACK_CAPTURE_METRICS === "1";
const activateGarageInput = process.env.TRACEBACK_CAPTURE_GARAGE_ACTIVE === "1";
const solveBoard = process.env.TRACEBACK_CAPTURE_BOARD_SOLVED === "1";
const zoomBoardEvidence = process.env.TRACEBACK_CAPTURE_BOARD_ZOOM === "1";
const interactBoard = process.env.TRACEBACK_CAPTURE_BOARD_INTERACTIONS === "1";
const flowBoard = process.env.TRACEBACK_CAPTURE_BOARD_FLOW === "1";
const flowBoardDev = process.env.TRACEBACK_CAPTURE_BOARD_FLOW_DEV === "1";
const forceIntros = process.env.TRACEBACK_CAPTURE_FORCE_INTROS === "1";
const solvePuzzle = process.env.TRACEBACK_CAPTURE_PUZZLE_SOLVED === "1";
const openPuzzleContract = process.env.TRACEBACK_CAPTURE_PUZZLE_CONTRACT === "1";
const seedBenchContract = process.env.TRACEBACK_CAPTURE_BENCH_CONTRACT === "1";
const driveBench = process.env.TRACEBACK_CAPTURE_BENCH_DRIVE === "1";
const benchRerun = process.env.TRACEBACK_CAPTURE_BENCH_RERUN === "1";
const benchFinal = process.env.TRACEBACK_CAPTURE_BENCH_FINAL === "1";
const puzzleState = process.env.TRACEBACK_CAPTURE_PUZZLE_STATE === "1";
const benchJudgement = process.env.TRACEBACK_CAPTURE_BENCH_JUDGEMENT === "1";
const dragPuzzle = process.env.TRACEBACK_CAPTURE_DRAG_TEST === "1";
const auditLayout = process.env.TRACEBACK_CAPTURE_LAYOUT_AUDIT === "1";
const auditGarageInteractions = process.env.TRACEBACK_CAPTURE_GARAGE_INTERACTIONS === "1";
const clickGarageArchitecture = process.env.TRACEBACK_CAPTURE_GARAGE_ARCHITECTURE_CLICK === "1";
const clickGarageTreeDomain = process.env.TRACEBACK_CAPTURE_GARAGE_TREE_DOMAIN === "1";
const clickLevelSelect = process.env.TRACEBACK_CAPTURE_LEVEL_CLICK === "1";
const inspectGarageParts = process.env.TRACEBACK_CAPTURE_GARAGE_PART_INSPECT === "1";

const screens = [
  { name: "00_title.png", url: "/?new=1", wait: 1200 },
  { name: "01_prologue.png", url: "/?qa=PROLOGUE", wait: 1300 },
  { name: "01b_level_select.png", url: "/?qa=LEVEL_SELECT", wait: 1300 },
  { name: "01c_garage_architecture.png", url: "/?qa=GARAGE_L1", wait: 1800 },
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
  { name: `${number++}_lab_sw_logic.png`, url: "/?qa=TWIN_BENCH&tab=sw", wait: 1800 },
  { name: `${number++}_lab_ecu_io.png`, url: "/?qa=TWIN_BENCH&tab=ecu", wait: 1800 },
  { name: `${number++}_lab_parts_vehicle.png`, url: "/?qa=TWIN_BENCH&tab=plant", wait: 1800 },
  { name: `${number++}_lab_signal_graph.png`, url: "/?qa=TWIN_BENCH&tab=graph", wait: 1800 },
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
    if (skipIntros || forceIntros) {
      await page.send("Page.addScriptToEvaluateOnNewDocument", {
        source: `["garage","puzzle","puzzle-v2","trace-v2","trace-v3","bench","bench-qa","bench-qa2"].forEach(id => localStorage.${forceIntros ? "removeItem" : "setItem"}("tb-intro-" + id${forceIntros ? "" : ", \"1\""}));`,
      });
    }
    if (seedBenchContract) {
      await page.send("Page.addScriptToEvaluateOnNewDocument", {
        source: `sessionStorage.setItem("tb-expect-propulsion", "페달 60% → 토크 요청 204 Nm → 모터 204 Nm"); sessionStorage.setItem("tb-verification-contract-propulsion", JSON.stringify({version:1,caseId:"propulsion",hypothesisId:"gateway",hypothesisLabel:"페달 신호를 잘못 줄여서 전달했다",suspectSection:"VCU",objective:"가속 출력 저하가 VCU 계산 SW인지 입력 회로인지 같은 조건에서 구분한다.",preconditions:["READY","D단","차속 60 km/h","브레이크 해제"],stimulus:{label:"사건 재현 가속",sequence:"APS 0→60% / 0.3 s · 3 s 유지"},expected:{signal:"요청 토크와 모터 토크",value:"페달 60% → 토크 요청 204 Nm → 모터 204 Nm"},observations:[{id:"input",label:"APS 원신호"},{id:"control",label:"VCU 토크 맵 출력"},{id:"output",label:"모터 실제 토크"}],comparison:{baseline:"STEP03 정상 기준 장치",sameInput:true,timeAxis:"0~3.3 s 동일 시간축",units:"%, Nm"},limitation:"결과 하나로 근본 원인을 자동 확정하지 않는다.",createdBy:"STEP03"}));`,
      });
    }

    for (const [index, screen] of selectedScreens.entries()) {
      const loaded = page.waitFor("Page.loadEventFired");
      await page.send("Page.navigate", { url: new URL(screen.url, baseUrl).href });
      await loaded;
      await page.send("Runtime.evaluate", {
        expression: "document.fonts?.ready ?? Promise.resolve()",
        awaitPromise: true,
        returnByValue: true,
      });
      if (skipIntros) {
        await delay(800);
        await page.send("Runtime.evaluate", {
          expression: `(async () => { const wait = ms => new Promise(resolve => setTimeout(resolve, ms)); for (let i = 0; i < 12; i += 1) { const d = document.querySelector('.scaleFrame')?.contentDocument ?? document; const button = d.querySelector('.stageIntro button, .nutOk'); if (!button) break; button.click(); await wait(120); } })()`,
          awaitPromise: true,
          returnByValue: true,
        });
        await delay(180);
      }
      if (clickLevelSelect && screen.url.includes("qa=LEVEL_SELECT")) {
        const result = await page.send("Runtime.evaluate", {
          expression: `(async () => { const wait = ms => new Promise(resolve => setTimeout(resolve, ms)); const root = document.querySelector('.scaleFrame')?.contentDocument ?? document; const open = root.querySelector('.lvNode.open'); const firstBefore = root.querySelector('.lvNode.sel'); open?.click(); await wait(160); const selected = root.querySelector('.lvNode.sel'); const start = root.querySelector('.lvStart button'); const enabled = Boolean(start && !start.disabled); start?.click(); await wait(700); return JSON.stringify({ open: Boolean(open), selected: Boolean(selected), enabled, transitioned: !root.querySelector('.levelSelect') }); })()` ,
          awaitPromise: true,
          returnByValue: true,
        });
        const state = JSON.parse(result.result?.value ?? "{}");
        process.stdout.write(`[level-interaction] ${screen.name} ${JSON.stringify(state)}\n`);
        if (!state.open || !state.selected || !state.enabled || !state.transitioned) throw new Error(`Level selection interaction QA failed: ${JSON.stringify(state)}`);
      }
      if (inspectGarageParts && screen.url.includes("qa=GARAGE_L1") && screen.name.includes("01c_garage_architecture")) {
        const result = await page.send("Runtime.evaluate", {
          expression: `(async () => { const wait = ms => new Promise(resolve => setTimeout(resolve, ms)); const ids = ["steering_angle_sensor", "coolant_temperature_sensor", "park_pawl", "wheel", "steering_knuckle", "brake_caliper"]; const checks = []; for (const partId of ids) { window.dispatchEvent(new CustomEvent("tb-part-inspect", { detail: { domain: "drive", feature: 0, index: 0, partId, label: partId } })); await wait(180); const dialog = document.querySelector('.partInspect'); checks.push({ partId, dialog: Boolean(dialog), canvas: Boolean(dialog?.querySelector('canvas')), label: dialog?.querySelector('h2')?.textContent?.trim() ?? '' }); dialog?.querySelector('.piClose')?.click(); await wait(80); } return JSON.stringify({ checks }); })()`,
          awaitPromise: true,
          returnByValue: true,
        });
        const state = JSON.parse(result.result?.value ?? "{}");
        process.stdout.write(`[garage-inspect] ${screen.name} ${JSON.stringify(state)}\n`);
        if (!state.checks?.length || state.checks.some(item => !item.dialog || !item.canvas || item.label !== item.partId)) throw new Error(`Garage part inspector QA failed: ${JSON.stringify(state)}`);
      }
      if (activateGarageInput && screen.url.includes("qa=GARAGE_L1")) {
        await page.send("Runtime.evaluate", {
          expression: `(async () => { const wait = ms => new Promise(resolve => setTimeout(resolve, ms)); for (;;) { const next = [...document.querySelectorAll(".conditionCtl")].find(button => !button.disabled && !button.classList.contains("on")); if (!next) break; next.click(); await wait(120); } const input = document.querySelector(".mainCtl"); input?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 1, pointerType: "mouse", isPrimary: true })); })()`,
          awaitPromise: true,
        });
      }
      if (auditGarageInteractions && screen.name.includes("01c_garage_architecture")) {
        const result = await page.send("Runtime.evaluate", {
          expression: `(async () => { const wait = ms => new Promise(resolve => setTimeout(resolve, ms)); const root = document.querySelector('.scaleFrame')?.contentDocument ?? document; const button = [...root.querySelectorAll('button')].find(item => item.textContent?.includes('협조 신호 보기')); button?.click(); await wait(180); return JSON.stringify({ clicked: Boolean(button), overlay: Boolean(root.querySelector('.garageCoordOverlay')) }); })()`,
          awaitPromise: true,
          returnByValue: true,
        });
        const state = JSON.parse(result.result?.value ?? "{}");
        process.stdout.write(`[garage-interaction] ${screen.name} ${JSON.stringify(state)}\n`);
        if (!state.clicked || !state.overlay) throw new Error(`Garage cooperation signal control did not open its panel: ${JSON.stringify(state)}`);
      }
      if (auditGarageInteractions && screen.url.includes("domain=drive") && screen.name.includes("02_garage_drive_system")) {
        const result = await page.send("Runtime.evaluate", {
          expression: `(async () => { const wait = ms => new Promise(resolve => setTimeout(resolve, ms)); const root = document.querySelector('.scaleFrame')?.contentDocument ?? document; const buttons = [...root.querySelectorAll('button')]; const button = buttons.find(item => (item.textContent ?? '').includes('배선')); const before = button?.textContent ?? ''; button?.click(); await wait(120); return JSON.stringify({ clicked: Boolean(button), before, after: button?.textContent ?? '', toggled: Boolean(button && before !== button.textContent), rootClass: root.querySelector('#root>div')?.className ?? '', buttons: buttons.map(item => ({ text: item.textContent?.trim() ?? '', cls: String(item.className ?? '') })).slice(-20), body: root.body?.innerText?.slice(0, 500) ?? '' }); })()`,
          awaitPromise: true,
          returnByValue: true,
        });
        const state = JSON.parse(result.result?.value ?? "{}");
        process.stdout.write(`[garage-interaction] ${screen.name} ${JSON.stringify(state)}\n`);
        if (!state.clicked || !state.toggled) throw new Error(`Garage wiring control did not toggle: ${JSON.stringify(state)}`);
      }
      if (clickGarageArchitecture && screen.name.includes("01c_garage_architecture")) {
        const result = await page.send("Runtime.evaluate", {
          expression: `(async () => { const wait = ms => new Promise(resolve => setTimeout(resolve, ms)); await wait(700); const root = document.querySelector('.scaleFrame')?.contentDocument ?? document; const button = [...root.querySelectorAll('button')].find(item => item.textContent?.includes('아키텍처')); button?.click(); await wait(360); const arch = Boolean(root.querySelector('.archView')); let domain = false; let directDomain = false; let directDomains = []; if (${clickGarageTreeDomain ? "true" : "false"}) { const group = [...root.querySelectorAll('.archTreeGroup')].find(item => item.textContent?.includes('파워트레인')); group?.click(); await wait(220); const item = [...root.querySelectorAll('.archTreeDomains button')].find(button => button.textContent?.includes('구동')); item?.click(); await wait(360); domain = Boolean(root.querySelector('.garageBreadcrumb')) || Boolean(root.querySelector('.domainFunctionShelf')); const select = root.querySelector('.garageDomainSwitch select'); if (select) { const values = [...select.options].map(option => option.value); for (const value of values) { select.value = value; select.dispatchEvent(new Event('change', { bubbles: true })); await wait(180); directDomains.push({ value, selected: select.value, shelf: Boolean(root.querySelector('.domainFunctionShelf')) }); } directDomain = directDomains.length === values.length && directDomains.every(item => item.selected === item.value && item.shelf); } } return JSON.stringify({ arch, domain, directDomain, directDomains }); })()`,
          awaitPromise: true,
          returnByValue: true,
        });
        const state = JSON.parse(result.result?.value ?? "{}");
        process.stdout.write(`[garage-navigation] ${screen.name} ${JSON.stringify(state)}\n`);
        if (!state.arch || (clickGarageTreeDomain && (!state.domain || !state.directDomain))) throw new Error(`Garage architecture navigation did not reach the requested view: ${JSON.stringify(state)}`);
      }
      if (screen.url.includes("qa=BOARD") && solveBoard) {
        const solveDiag = await page.send("Runtime.evaluate", { expression: "JSON.stringify((() => { const root=document.querySelector('.scaleFrame')?.contentDocument ?? document; const buttons=[...root.querySelectorAll('.secretSolve')]; return {count:buttons.length, text:buttons.map(b=>b.textContent), cls:root.querySelector('.eeTrace,.dtBoard')?.className ?? ''}; })())", returnByValue: true });
        process.stdout.write(`[board-solve] ${screen.name} ${solveDiag.result?.value ?? '{}'}\n`);
        await page.send("Runtime.evaluate", { expression: "(document.querySelector('.scaleFrame')?.contentDocument ?? document).querySelector('.secretSolve')?.click()" });
        await delay(220);
      }
      if (screen.url.includes("qa=BOARD") && interactBoard) {
        const wrongResult = await page.send("Runtime.evaluate", {
          expression: `(async () => { const wait = ms => new Promise(resolve => setTimeout(resolve, ms)); const root = document.querySelector('.scaleFrame')?.contentDocument ?? document; await wait(500); const wrong = root.querySelector('.etFlags .no'); wrong?.click(); await wait(120); return JSON.stringify({ wrongFeedback: Boolean(root.querySelector('.nutNote.bad')) && Boolean(root.querySelector('.verdictLayer')), candidate: root.querySelector('.etCand')?.textContent ?? '', flags: root.querySelectorAll('.etFlags button').length }); })()`,
          awaitPromise: true,
          returnByValue: true,
        });
        const wrongState = JSON.parse(wrongResult.result?.value ?? "{}");
        // Open the real section-choice boundary through a development-only QA
        // query. This keeps the production flow untouched while testing the
        // hint in the same React state that follows trace judging.
        const reloaded = page.waitFor("Page.loadEventFired");
        await page.send("Page.navigate", { url: new URL("/?qa=BOARD&hint=1", baseUrl).href });
        await reloaded;
        await delay(450);
        await page.send("Runtime.evaluate", { expression: "(document.querySelector('.scaleFrame')?.contentDocument ?? document).querySelector('.stageIntro button, .nutOk')?.click()" });
        await page.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
        await page.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
        await delay(220);
        const result = await page.send("Runtime.evaluate", {
          expression: `(async () => { const root = document.querySelector('.scaleFrame')?.contentDocument ?? document; const hint = root.querySelector('.etHintButton'); hint?.click(); await new Promise(resolve => setTimeout(resolve, 180)); return JSON.stringify({ hint: Boolean(hint), hintText: hint?.textContent?.trim() ?? '', zoneTab: Boolean(root.querySelector('.etZoneTab')), phase: root.querySelector('.eeTrace')?.className ?? '' }); })()`,
          awaitPromise: true,
          returnByValue: true,
        });
        const state = { ...wrongState, ...JSON.parse(result.result?.value ?? "{}") };
        process.stdout.write(`[board-interaction] ${screen.name} ${JSON.stringify(state)}\n`);
        if (!state.wrongFeedback || !state.hint || !state.zoneTab) throw new Error(`Board interaction QA failed: ${JSON.stringify(state)}`);
      }
      if (screen.url.includes("qa=BOARD") && flowBoard) {
        const result = await page.send("Runtime.evaluate", {
          expression: `(async () => {
            const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
            const root = document.querySelector('.scaleFrame')?.contentDocument ?? document;
            await wait(700);
            root.querySelector('.nutPopup .nutOk')?.click();
            await wait(120);
            const text = el => (el?.textContent ?? '').replace(/\\s+/g, ' ').trim();
            if (${flowBoardDev ? "true" : "false"}) {
              root.querySelector('.devToggle')?.click();
              await wait(80);
              [...root.querySelectorAll('.devPanel button')].find(button => text(button).includes('정답 적용'))?.click();
              await wait(220);
            }
            let traceJudged = 0;
            for (let attempt = 0; attempt < 30; attempt++) {
              const card = root.querySelector('.etDockTrace .etCand');
              const flags = card?.querySelectorAll('.etFlags button');
              if (!card || !flags?.length) break;
              const before = text(card);
              flags[1]?.click();
              await wait(140);
              const afterYes = root.querySelector('.etDockTrace .etCand');
              if (afterYes && text(afterYes) === before && afterYes.querySelectorAll('.etFlags button').length) {
                root.querySelector('.nutOk, .verdictLayer button')?.click();
                await wait(80);
                afterYes.querySelector('.etFlags .yes')?.click();
                await wait(180);
              }
              root.querySelector('.nutOk, .verdictLayer button')?.click();
              traceJudged++;
              await wait(80);
            }
            await wait(1150);
            let sectionCorrect = false;
            for (const choice of [...root.querySelectorAll('.etDockSection .etChoices button')]) {
              choice.click();
              await wait(180);
              if (choice.classList.contains('right')) { sectionCorrect = true; break; }
              root.querySelector('.nutOk, .verdictLayer button')?.click();
              await wait(100);
            }
            await wait(1100);
            let hypothesesJudged = 0;
            for (let attempt = 0; attempt < 8; attempt++) {
              const card = root.querySelector('.etDock .etCand.hyp');
              const flags = card?.querySelectorAll('.etFlags button');
              if (!card || !flags?.length) break;
              const before = text(card);
              flags[0].click();
              await wait(140);
              const afterYes = root.querySelector('.etDock .etCand.hyp');
              if (afterYes && text(afterYes) === before && afterYes.querySelectorAll('.etFlags button').length) {
                root.querySelector('.nutOk, .verdictLayer button')?.click();
                await wait(80);
                root.defaultView?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
                await wait(180);
              }
              root.querySelector('.nutOk, .verdictLayer button')?.click();
              hypothesesJudged++;
              await wait(120);
            }
            const carry = root.querySelector('.etDock .etChoices button');
            if (carry) { carry.click(); await wait(180); }
            const hypTab = [...root.querySelectorAll('.etEvidenceTabs [role="tab"]')].find(item => text(item).includes('가설 후보'));
            hypTab?.click();
            await wait(180);
            const hypCards = [...root.querySelectorAll('.etHypTab .etHyp')];
            const next = root.querySelector('.etNextCell button');
            return JSON.stringify({
              traceJudged, sectionCorrect, hypothesesJudged,
              hypothesisTab: Boolean(hypTab), hypothesisCards: hypCards.length,
              hypothesisPhotos: hypCards.filter(card => card.querySelector('.etHypGraphic img')).length,
              selectedHypothesis: text(root.querySelector('.etDock .etAsk')),
              nextEnabled: Boolean(next && !next.disabled), phase: root.querySelector('.eeTrace')?.className ?? '',
              dock: text(root.querySelector('.etMugs')),
              phaseBridge: text(root.querySelector('.etPhaseBridge')),
              flagsLeft: root.querySelectorAll('.etFlags button').length,
              sectionChoices: root.querySelectorAll('.etDockSection .etChoices button').length
            });
          })()`,
          awaitPromise: true,
          returnByValue: true,
        });
        const state = JSON.parse(result.result?.value ?? "{}");
        process.stdout.write(`[board-flow] ${screen.name} ${JSON.stringify(state)}\n`);
        if (!state.hypothesisTab || state.hypothesisCards !== 2 || state.hypothesisPhotos !== 2 || !state.nextEnabled) {
          throw new Error(`Board full flow QA failed: ${JSON.stringify(state)}`);
        }
      }
      if (screen.url.includes("qa=BOARD") && zoomBoardEvidence) {
        await page.send("Runtime.evaluate", { expression: "document.querySelector('.pol.record')?.click()" });
      }
      if (screen.url.includes("qa=WIRING") && solvePuzzle) {
        const dragWait = 180;
        const correctPropulsion = [{ pieceIndex: 4, gap: 3 }, { pieceIndex: 2, gap: 5 }, { pieceIndex: 0, gap: 6 }];
        for (const target of correctPropulsion) {
          const source = await page.send("Runtime.evaluate", {
            expression: `(() => { const frame = document.querySelector('.scaleFrame'); const root = frame?.contentDocument ?? document; const piece = [...root.querySelectorAll('.rpChoicePiece')][${target.pieceIndex}]; const gap = root.querySelector('.rpGap[aria-label^="${target.gap + 1}번"]'); if (!piece || !gap) return null; const a = piece.getBoundingClientRect(), b = gap.getBoundingClientRect(), f = frame?.getBoundingClientRect() ?? {left:0,top:0}; return { sx:f.left+a.left+a.width/2, sy:f.top+a.top+a.height/2, gx:f.left+b.left+b.width/2, gy:f.top+b.top+b.height/2 }; })()`,
            returnByValue: true,
          });
          const point = source.result?.value;
          if (!point) break;
          await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.sx, y: point.sy });
          await page.send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.sx, y: point.sy, button: "left", clickCount: 1 });
          await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: (point.sx + point.gx) / 2, y: (point.sy + point.gy) / 2, button: "left" });
          await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.gx, y: point.gy, button: "left" });
          await page.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.gx, y: point.gy, button: "left", clickCount: 1 });
          await delay(dragWait);
        }
        await page.send("Runtime.evaluate", { expression: "(document.querySelector('.scaleFrame')?.contentDocument ?? document).querySelector('.rpRun:not([disabled])')?.click()" });
        await delay(3000);
        await page.send("Runtime.evaluate", { expression: "(document.querySelector('.scaleFrame')?.contentDocument ?? document).querySelector('.rpRun:not([disabled])')?.click()" });
        await delay(350);
        await page.send("Runtime.evaluate", { expression: "(document.querySelector('.scaleFrame')?.contentDocument ?? document).querySelector('.rpRun:not([disabled])')?.click()" });
        await delay(400);
        if (openPuzzleContract) await page.send("Runtime.evaluate", { expression: "(document.querySelector('.scaleFrame')?.contentDocument ?? document).querySelector('.rpExpect')?.click()" });
      }
      if (screen.url.includes("qa=WIRING") && puzzleState) {
        const correctPropulsion = [{ pieceIndex: 4, gap: 3 }, { pieceIndex: 2, gap: 5 }, { pieceIndex: 0, gap: 6 }];
        for (const target of correctPropulsion) {
          const source = await page.send("Runtime.evaluate", {
            expression: `(() => { const frame = document.querySelector('.scaleFrame'); const root = frame?.contentDocument ?? document; const piece = [...root.querySelectorAll('.rpChoicePiece')][${target.pieceIndex}]; const gap = root.querySelector('.rpGap[aria-label^="${target.gap + 1}번"]'); if (!piece || !gap) return null; const a = piece.getBoundingClientRect(), b = gap.getBoundingClientRect(), f = frame?.getBoundingClientRect() ?? {left:0,top:0}; return { sx:f.left+a.left+a.width/2, sy:f.top+a.top+a.height/2, gx:f.left+b.left+b.width/2, gy:f.top+b.top+b.height/2 }; })()`,
            returnByValue: true,
          });
          const point = source.result?.value;
          if (!point) continue;
          await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.sx, y: point.sy });
          await page.send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.sx, y: point.sy, button: "left", clickCount: 1 });
          await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: (point.sx + point.gx) / 2, y: (point.sy + point.gy) / 2, button: "left" });
          await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.gx, y: point.gy, button: "left" });
          await page.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.gx, y: point.gy, button: "left", clickCount: 1 });
          await delay(180);
        }
        const result = await page.send("Runtime.evaluate", {
          expression: `(async () => {
            const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
            const root = document.querySelector('.scaleFrame')?.contentDocument ?? document;
            const text = el => (el?.textContent ?? '').replace(/\\s+/g, ' ').trim();
            const correct = [{ pieceIndex: 4, gap: 3 }, { pieceIndex: 2, gap: 5 }, { pieceIndex: 0, gap: 6 }];
            for (const target of correct) {
              const point = await new Promise(resolve => { const piece = [...root.querySelectorAll('.rpChoicePiece')][target.pieceIndex]; const gap = root.querySelector('.rpGap[aria-label^="${target.gap + 1}번"]'); if (!piece || !gap) return resolve(null); const a = piece.getBoundingClientRect(), b = gap.getBoundingClientRect(); resolve({ sx:a.left+a.width/2, sy:a.top+a.height/2, gx:b.left+b.width/2, gy:b.top+b.height/2 }); });
              if (!point) continue;
              const p = point;
              await new Promise(resolve => { const win = root.defaultView ?? window; const fire = (type, target, x, y) => target.dispatchEvent(new win.PointerEvent(type, { bubbles: true, pointerId: 11, pointerType: 'mouse', isPrimary: true, clientX: x, clientY: y, buttons: type === 'pointerup' ? 0 : 1 })); const piece = [...root.querySelectorAll('.rpChoicePiece')][target.pieceIndex]; fire('pointermove', piece, p.sx, p.sy); fire('pointerdown', piece, p.sx, p.sy); fire('pointermove', win, (p.sx+p.gx)/2, (p.sy+p.gy)/2); fire('pointermove', win, p.gx, p.gy); fire('pointerup', win, p.gx, p.gy); setTimeout(resolve, 180); });
            }
            const clickRun = label => { const item = [...root.querySelectorAll('.rpRun')].find(button => text(button).includes(label) && !button.disabled); item?.click(); return Boolean(item); };
            const filled = root.querySelectorAll('.rpGap.taken').length;
            const checked = clickRun('연결 확인'); await wait(5000);
            const connected = Boolean([...root.querySelectorAll('.rpRun')].find(button => text(button).includes('설계서 작성')));
            const drafted = clickRun('설계서 작성'); await wait(220);
            const documentOpen = Boolean(root.querySelector('.rpFolderBack[role="dialog"]'));
            root.querySelector('.rpFolderTabs button[aria-label="닫기"]')?.click(); await wait(120);
            const committed = clickRun('기준으로 확정'); await wait(220);
            const confirmed = Boolean(root.querySelector('.stageReplayBtn')) && Boolean(root.querySelector('.rpNext:not([disabled])'));
            const beforeNav = text(root.querySelector('.missionBar'));
            root.querySelector('.stageBackButton:not([disabled])')?.click(); await wait(180);
            const movedBack = text(root.querySelector('.missionBar')) !== beforeNav;
            root.querySelector('.stageForwardButton:not([disabled])')?.click(); await wait(180);
            const movedForward = text(root.querySelector('.missionBar')) === beforeNav;
            const statePreserved = root.querySelectorAll('.rpGap.taken').length === filled;
            root.querySelector('.stageReplayBtn')?.click(); await wait(120);
            const replayDialog = Boolean(root.querySelector('.replayConfirm[role="dialog"]'));
            root.querySelector('.replayConfirmAction')?.click(); await wait(220);
            const reset = root.querySelectorAll('.rpGap.taken').length === 0 && !root.querySelector('.replayConfirm[role="dialog"]') && !root.querySelector('.rpNext:not([disabled])');
            return JSON.stringify({ filled, checked, connected, drafted, documentOpen, committed, confirmed, movedBack, movedForward, statePreserved, replayDialog, reset });
          })()` ,
          awaitPromise: true,
          returnByValue: true,
        });
        const state = JSON.parse(result.result?.value ?? "{}");
        process.stdout.write(`[puzzle-state] ${screen.name} ${JSON.stringify(state)}\n`);
        if (!state.filled || !state.checked || !state.connected || !state.drafted || !state.documentOpen || !state.committed || !state.confirmed || !state.movedBack || !state.movedForward || !state.statePreserved || !state.replayDialog || !state.reset) throw new Error(`Puzzle state QA failed: ${JSON.stringify(state)}`);
      }
      if (screen.url.includes("qa=WIRING") && dragPuzzle) {
        await delay(900);
        const source = await page.send("Runtime.evaluate", {
          expression: `(() => { const frame = document.querySelector('.scaleFrame'); const root = frame?.contentDocument ?? document; const piece = root.querySelector('.rpChoicePiece'); const gap = root.querySelector('.rpGap:not(.taken)'); if (!piece || !gap) return null; const a = piece.getBoundingClientRect(), b = gap.getBoundingClientRect(), f = frame?.getBoundingClientRect() ?? {left:0,top:0}; return { sx:f.left+a.left+a.width/2, sy:f.top+a.top+a.height/2, gx:f.left+b.left+b.width/2, gy:f.top+b.top+b.height/2 }; })()`,
          returnByValue: true,
        });
        const point = source.result?.value;
        if (!point) {
          const diagnostic = await page.send("Runtime.evaluate", { expression: "JSON.stringify((() => { const root=document.querySelector('.scaleFrame')?.contentDocument ?? document; return {pieces:root.querySelectorAll('.rpChoicePiece').length,gaps:root.querySelectorAll('.rpGap').length,root:root.querySelector('#root>div')?.className,text:root.body?.innerText.slice(0,180) }; })())", returnByValue: true });
          throw new Error(`Puzzle drag QA could not find a spare piece and an empty gap: ${diagnostic.result?.value ?? "{}"}`);
        }
        process.stdout.write(`[drag-point] ${screen.name} ${JSON.stringify(point)}\n`);
        const dragGeometry = await page.send("Runtime.evaluate", {
          expression: `JSON.stringify((() => { const frame=document.querySelector('.scaleFrame'); const root=frame?.contentDocument ?? document; const stage=root.querySelector('.rpStage'), world=root.querySelector('.rpWorld'), gap=root.querySelector('.rpGap:not(.taken)'); const p=${JSON.stringify(point)}; const source=root.elementFromPoint(p.sx,p.sy), target=root.elementFromPoint(p.gx,p.gy); return { frame:frame?.getBoundingClientRect().toJSON(), stage:stage?.getBoundingClientRect().toJSON(), world:world?.getBoundingClientRect().toJSON(), gap:gap?.getBoundingClientRect().toJSON(), sourceElement:{tag:source?.tagName,cls:source?.className,pe:source ? getComputedStyle(source).pointerEvents : null}, targetElement:{tag:target?.tagName,cls:target?.className,pe:target ? getComputedStyle(target).pointerEvents : null}, worldStyle:world ? getComputedStyle(world).transform : null, inner:[root.defaultView?.innerWidth, root.defaultView?.innerHeight], dpr:devicePixelRatio }; })())`,
          returnByValue: true,
        });
        process.stdout.write(`[drag-geometry] ${screen.name} ${dragGeometry.result?.value ?? "{}"}\n`);
        await page.send("Runtime.evaluate", { expression: `(() => { window.__tbDragEvents=[]; for (const type of ["pointerdown","pointermove","pointerup","mousedown","mouseup"]) document.addEventListener(type, event => window.__tbDragEvents.push({ type, x:event.clientX, y:event.clientY, target:event.target?.className ?? "" }), true); })()` });
        await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.sx, y: point.sy });
        await page.send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.sx, y: point.sy, button: "left", clickCount: 1 });
        await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: (point.sx + point.gx) / 2, y: (point.sy + point.gy) / 2, button: "left" });
        await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.gx, y: point.gy, button: "left" });
        await page.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.gx, y: point.gy, button: "left", clickCount: 1 });
        await delay(240);
        const result = await page.send("Runtime.evaluate", {
          expression: "JSON.stringify((() => { const root=document.querySelector('.scaleFrame')?.contentDocument ?? document; return {taken:root.querySelectorAll('.rpGap.taken').length, spare:root.querySelectorAll('.rpChoicePiece').length, dragging:root.querySelectorAll('.rpPiece.dragging').length, events:window.__tbDragEvents ?? []}; })())",
          returnByValue: true,
        });
        const state = JSON.parse(result.result?.value ?? "{}");
        process.stdout.write(`[drag-audit] ${screen.name} ${JSON.stringify(state)}\n`);
        if (!state.taken || state.dragging) throw new Error(`Puzzle drag QA failed: ${JSON.stringify(state)}`);
      }
      if (screen.name.includes("lab_signal_graph")) {
        await page.send("Runtime.evaluate", { expression: "(document.querySelector('.scaleFrame')?.contentDocument ?? document).querySelector('.vbGo')?.click()" });
        await delay(2300);
      }
      if (driveBench && screen.url.includes("qa=TWIN_BENCH")) {
        const result = await page.send("Runtime.evaluate", {
          expression: `(async () => { const wait = ms => new Promise(resolve => setTimeout(resolve, ms)); const root = document.querySelector('.scaleFrame')?.contentDocument ?? document; const click = (selector, index = 0) => { const item = [...root.querySelectorAll(selector)][index]; item?.click(); return Boolean(item); }; const state = {}; state.hypothesis = click('.b4HypChoices .b4Card', ${screen.url.includes("tab=ecu") ? 1 : 0}); await wait(180); state.level = click('.b4Cards .levelChoice', ${screen.url.includes("tab=plant") ? 2 : screen.url.includes("tab=ecu") ? 1 : 0}); await wait(180); const docs = [...root.querySelectorAll('.b4DocBtns button')]; state.tcOpen = Boolean(docs[0]); docs[0]?.click(); await wait(120); state.tcDialog = Boolean(root.querySelector('.rpFolderBack[role="dialog"]')); root.querySelector('.rpFolderTabs button[aria-label="닫기"]')?.click(); await wait(100); docs[1]?.click(); await wait(120); state.logDialog = Boolean(root.querySelector('.rpFolderBack[role="dialog"]')); root.querySelector('.rpFolderTabs button[aria-label="닫기"]')?.click(); await wait(100); state.input = click('.b4Cards .b4Card.input', ${screen.url.includes("tab=plant") ? 2 : screen.url.includes("tab=ecu") ? 1 : 0}); await wait(160); if (${benchRerun ? "true" : "false"}) { const change = [...root.querySelectorAll('.b4Cards .b4Card')].find(item => (item.textContent ?? '').includes('입력 조건 바꾸기')); change?.click(); await wait(120); const inputs = root.querySelectorAll('.b4Cards .b4Card.input'); inputs[1]?.click(); state.inputChanged = Boolean(change && inputs[1]); await wait(160); } state.run = click('.b4Cards .b4Card.run'); await wait(4800); state.tabs = [...root.querySelectorAll('.b4Panel > header nav button')].map(b => b.textContent?.trim() ?? ''); state.result = Boolean(root.querySelector('.qaResultState')); return JSON.stringify(state); })()`,
          awaitPromise: true,
          returnByValue: true,
        });
        const state = JSON.parse(result.result?.value ?? "{}");
        if (!state.hypothesis || !state.level || !state.input || (benchRerun && !state.inputChanged) || !state.run || state.tabs.join("|") !== "시험 설계 조건|가설 테스트 결과|시험 결과" || !state.result) throw new Error(`Bench interaction QA failed: ${JSON.stringify(state)}`);
        process.stdout.write(`[bench-interaction] ${screen.name} ${JSON.stringify(state)}\n`);
        if (benchJudgement && screen.name.includes("lab_sw_logic")) {
          const judged = await page.send("Runtime.evaluate", {
            expression: `(async () => { const wait = ms => new Promise(resolve => setTimeout(resolve, ms)); const root = document.querySelector('.scaleFrame')?.contentDocument ?? document; const text = el => (el?.textContent ?? '').replace(/\\s+/g, ' ').trim(); const open = [...root.querySelectorAll('.b4Cards .ans-open')].find(button => !button.disabled); open?.click(); await wait(220); return JSON.stringify({ clicked: Boolean(open), judgeMark: [...root.querySelectorAll('.b4WhyLevel mark, .qaResultState mark')].map(text), feedback: text(root.querySelector('.nutNote')) }); })()`,
            awaitPromise: true,
            returnByValue: true,
          });
          const judgement = JSON.parse(judged.result?.value ?? "{}");
          process.stdout.write(`[bench-judgement] ${screen.name} ${JSON.stringify(judgement)}\n`);
          if (!judgement.clicked || !judgement.judgeMark.some(value => value.includes('판단할 수 있어요') || value.includes('판단할 수 없어요'))) throw new Error(`Bench judgement QA failed: ${JSON.stringify(judgement)}`);
        }
      }
      if (benchFinal && screen.url.includes("qa=TWIN_BENCH") && screen.name.includes("lab_sw_logic")) {
        const final = await page.send("Runtime.evaluate", {
          expression: `(async () => { const wait = ms => new Promise(resolve => setTimeout(resolve, ms)); const root = document.querySelector('.scaleFrame')?.contentDocument ?? document; const text = el => (el?.textContent ?? '').replace(/\\s+/g, ' ').trim(); root.querySelector('.devToggle')?.click(); await wait(80); [...root.querySelectorAll('.devPanel button')].find(item => text(item).includes('정답 적용'))?.click(); await wait(220); const report = Boolean(root.querySelector('.b4Report .reportPolaroid')) && Boolean(root.querySelector('.b4Report h3 mark')); const cause = [...root.querySelectorAll('.b4Card.cause')].find(item => text(item).includes('설계 외 보정') || text(item).includes('페달 처리 SW')); cause?.click(); await wait(220); const run = [...root.querySelectorAll('.b4Cards .b4Card.run')].find(item => text(item).includes('두 모델')); run?.click(); await wait(3000); return JSON.stringify({ report, cause: Boolean(cause), ab: Boolean(root.querySelector('.abView')), match: [...root.querySelectorAll('.abView .vbStamp')].some(item => text(item).includes('정상과 일치')), finish: Boolean(root.querySelector('.qaFinishBtn')) }); })()`,
          awaitPromise: true,
          returnByValue: true,
        });
        const finalState = JSON.parse(final.result?.value ?? "{}");
        process.stdout.write(`[bench-final] ${screen.name} ${JSON.stringify(finalState)}\n`);
        if (!finalState.report || !finalState.cause || !finalState.ab || !finalState.match) throw new Error(`Bench final-cause QA failed: ${JSON.stringify(finalState)}`);
      }
      if (screen.name.includes("lab_sw_logic")) {
        const benchDiag = await page.send("Runtime.evaluate", {
          expression: `JSON.stringify((() => { const root=document.querySelector('.scaleFrame')?.contentDocument ?? document; const dock=root.querySelector('.b4Dock'); return { choices: root.querySelectorAll('.b4Choices').length, cards: root.querySelectorAll('.b4Choices .b4Card').length, dock: dock ? [...dock.children].map(el => { const r=el.getBoundingClientRect(); return {cls:String(el.className||''),text:(el.textContent||'').trim().slice(0,80),x:r.x,y:r.y,w:r.width,h:r.height,display:getComputedStyle(el).display}; }) : [], b4Cards: [...root.querySelectorAll('.b4Cards')].map(el => { const r=el.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height,display:getComputedStyle(el).display}; }) }; })())`,
          returnByValue: true,
        });
        process.stdout.write(`[bench-diagnostic] ${screen.name} ${benchDiag.result?.value ?? "{}"}\n`);
      }
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
      if (printMetrics) {
        const metrics = await page.send("Runtime.evaluate", {
          expression: `JSON.stringify(Object.fromEntries([".garageLayerNav",".garageStudio",".garageMechanismCard",".domainFunctionShelf",".garageFlowPanel",".inputBar"].map(selector => { const element = document.querySelector(selector); if (!element) return [selector, null]; const box = element.getBoundingClientRect(); return [selector, { x: box.x, y: box.y, width: box.width, height: box.height }]; })))`,
          returnByValue: true,
        });
        process.stdout.write(`[metrics] ${screen.name} ${metrics.result?.value ?? "{}"}\n`);
      }
      if (auditLayout) {
        const audit = await page.send("Runtime.evaluate", {
          expression: `JSON.stringify((() => {
            const root = document.querySelector('.scaleFrame')?.contentDocument ?? document;
            const doc = root.documentElement, body = root.body;
            const key = [...root.querySelectorAll('button,[role="tab"],.missionBar,.garageMechanismCard,.domainFunctionShelf,.garageFlowPanel,.rpStage,.rpPanel,.rpFoot,.vbMonitor,.rpFolder')]
              .filter(el => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && r.width > 0 && r.height > 0; })
              .map(el => { const r = el.getBoundingClientRect(); return { tag:el.tagName, cls:String(el.className||''), x:r.x, y:r.y, right:r.right, bottom:r.bottom, clientW:el.clientWidth, scrollW:el.scrollWidth, clientH:el.clientHeight, scrollH:el.scrollHeight }; });
            return { viewport:[innerWidth,innerHeight], page:[doc?.scrollWidth ?? 0,doc?.scrollHeight ?? 0,body?.scrollWidth ?? 0,body?.scrollHeight ?? 0], overflow:key.filter(x=>x.right>innerWidth+1 || x.bottom>innerHeight+1 || x.scrollW>x.clientW+2 || x.scrollH>x.clientH+2).slice(0,20) };
          })())`,
          returnByValue: true,
        });
        process.stdout.write(`[layout-audit] ${screen.name} ${audit.result?.value ?? "{}"}\n`);
      }
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

