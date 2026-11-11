// TraceBack promo — edit decision list (55.0 s @ 30 fps).
// Every shot plays a real gameplay recording (captures/<clip>) from `from` (ms) at `speed`.
// cam: [[u (0..1 of shot), centerX, centerY, width]] in game CSS px (1440×900). Height = width / 1.6 → 16:10 is never distorted.
// Times are seconds of the final video.
export const DURATION = 55.0;
export const FPS = 30;

const FULL = [720, 450, 1440];
export const SHOTS = [
  // ── 0–5.0 Opening: real chase, real fault (fault cue at clip 4.78 s → video 1.58 s)
  { t: 0.0, d: 5.0, clip: "race", from: 3200, speed: 1.0, layout: "full", cam: [[0, ...FULL], [0.3, 720, 470, 1300], [1, 720, 480, 1180]] },
  // ── 5.0–9.4 Project intro + AI process (graphic sections use quick gameplay thumbnails)
  { t: 5.0, d: 4.4, layout: "intro" },
  // ── 9.4–15.0 STEP 01 정비소
  { t: 9.4, d: 1.5, clip: "garage", from: 4300, speed: 1.33, layout: "step", step: 1, cam: [[0, ...FULL], [1, 700, 430, 1340]] },
  { t: 10.9, d: 1.8, clip: "garage", from: 9900, speed: 1.9, layout: "step", step: 1, cam: [[0, 760, 470, 1150], [1, 780, 520, 980]] },
  { t: 12.7, d: 1.2, clip: "garage", from: 14500, speed: 1.67, layout: "step", step: 1, cam: [[0, ...FULL], [1, 760, 450, 1300]] },
  { t: 13.9, d: 1.1, clip: "garage", from: 18300, speed: 2.0, layout: "step", step: 1, cam: [[0, 780, 440, 1220], [1, 790, 430, 1080]] },
  // ── 15.0–23.0 STEP 02 도미노
  { t: 15.0, d: 1.3, clip: "board", from: 1000, speed: 1.5, layout: "step", step: 2, cam: [[0, ...FULL], [1, 1160, 420, 760]] },
  { t: 16.3, d: 1.1, clip: "board", from: 3500, speed: 1.36, layout: "step", step: 2, cam: [[0, 720, 400, 1300], [1, 760, 380, 1200]] },
  { t: 17.4, d: 2.6, clip: "board", from: 10300, speed: 4.5, layout: "step", step: 2, cam: [[0, 600, 640, 1050], [1, 560, 680, 940]] },
  { t: 20.0, d: 1.7, clip: "board", from: 63000, speed: 3.1, layout: "step", step: 2, cam: [[0, 640, 520, 1200], [1, 520, 400, 1000]], focus: [{ at: 0.55, x: 343, y: 285, r: 120, label: "최초 편차 · VCU 페달 처리값" }] },
  { t: 21.7, d: 1.3, clip: "board", from: 68300, speed: 3.0, layout: "step", step: 2, cam: [[0, 640, 640, 1100], [1, 640, 660, 1050]] },
  // ── 23.0–30.0 STEP 03 퍼즐
  { t: 23.0, d: 2.6, clip: "puzzle", from: 2400, speed: 3.6, layout: "step", step: 3, cam: [[0, 640, 520, 1200], [1, 640, 500, 1150]], trail: true },
  { t: 25.6, d: 1.3, clip: "puzzle", from: 13000, speed: 2.9, layout: "step", step: 3, cam: [[0, 700, 400, 1150], [1, 720, 380, 1050]] },
  { t: 26.9, d: 1.3, clip: "puzzle", from: 18200, speed: 2.8, layout: "step", step: 3, cam: [[0, 820, 520, 1250], [1, 900, 560, 1200]] },
  { t: 28.2, d: 1.8, clip: "puzzle", from: 23200, speed: 2.9, layout: "step", step: 3, cam: [[0, 720, 470, 1440], [1, 720, 460, 1150]] },
  // ── 30.0–48.0 STEP 04 실험 검증
  { t: 30.0, d: 1.2, clip: "bench", from: 300, speed: 1.4, layout: "step", step: 4, cam: [[0, ...FULL], [1, 720, 560, 1300]] },
  { t: 31.2, d: 1.2, clip: "bench", from: 5000, speed: 3.3, layout: "step", step: 4, cam: [[0, 720, 400, 1300], [1, 720, 330, 1050]] },
  { t: 32.4, d: 1.2, clip: "bench", from: 16900, speed: 2.5, layout: "step", step: 4, cam: [[0, ...FULL], [1, 760, 520, 1300]] },
  { t: 33.6, d: 2.0, clip: "bench", from: 20200, speed: 1.8, layout: "step", step: 4, cam: [[0, 720, 470, 1400], [0.55, 1150, 420, 760], [1, 1200, 400, 660]], callout: { at: 0.5, x: 1200, y: 262, text: "FAIL = 요구사항 판정 결과", sub: "정상 기준에서 벗어났다는 뜻 · 원인 판정은 아님" } },
  { t: 35.6, d: 1.4, clip: "bench", from: 23800, speed: 1.9, layout: "step", step: 4, cam: [[0, 900, 640, 1150], [1, 820, 700, 1000]], callout: { at: 0.35, x: 1060, y: 777, text: "가설 판정 · 판단 보류", sub: "이 시험 수준에서는 가를 신호가 보이지 않음" } },
  { t: 37.0, d: 2.4, clip: "bench", from: 26200, speed: 2.75, layout: "step", step: 4, cam: [[0, 720, 470, 1440], [0.5, 700, 480, 1100], [1, 760, 480, 1000]] },
  { t: 39.4, d: 1.4, clip: "bench", from: 32900, speed: 1.7, layout: "step", step: 4, cam: [[0, 820, 560, 1250], [1, 760, 520, 1150]], callout: { at: 0.45, x: 780, y: 860, text: "근거 · 페달 처리값 60% → 27%", sub: "입력 회로 없이 SW만 실행해도 값이 낮음" } },
  { t: 40.8, d: 1.2, clip: "bench", from: 38300, speed: 4.6, layout: "step", step: 4, cam: [[0, ...FULL], [1, 760, 500, 1300]] },
  { t: 42.0, d: 1.6, clip: "bench", from: 43400, speed: 1.25, layout: "step", step: 4, cam: [[0, 720, 470, 1440], [1, 720, 560, 1050]], judge: 0.75 },
  { t: 43.6, d: 4.4, clip: "bench", from: 46400, speed: 1.18, layout: "step", step: 4, ab: true, cam: [[0, 720, 470, 1440], [0.3, 690, 470, 1180], [0.75, 690, 470, 1180], [1, 1000, 440, 1100]] },
  // ── 48.0–52.6 Repair · retest · back on the road
  { t: 48.0, d: 1.2, clip: "bench", from: 53500, speed: 1.2, layout: "step", step: 5, cam: [[0, 720, 500, 1300], [1, 720, 490, 1000]] },
  { t: 49.2, d: 1.2, clip: "bench", from: 56900, speed: 3.0, layout: "step", step: 5, cam: [[0, 720, 470, 1440], [1, 1180, 420, 720]] },
  { t: 50.4, d: 0.9, clip: "bench", from: 60800, speed: 1.4, layout: "full", cam: [[0, 1100, 480, 1100], [1, 1050, 480, 1000]] },
  { t: 51.3, d: 1.5, clip: "resume", from: 7900, speed: 2.6, layout: "full", cam: [[0, ...FULL], [1, 720, 470, 1300]] },
  // ── 52.8–55.0 Ending: real WANTED case-file poster → TraceBack title
  { t: 52.8, d: 2.2, clip: "ending", from: 0, speed: 1, layout: "full", still: true, cam: [[0, 370, 450, 700], [1, 360, 455, 640]] },
];

export const STEPS = {
  1: { no: "STEP 01", name: "정비소", en: "UNDERSTAND THE SYSTEM", q: "차량은 어떤 원리로\n움직이는가?",
       act: "도메인 · E/E · 제어 SW 관점을\n바꿔 가며 부품과 신호 흐름 탐색", why: "구조를 알아야\n신호를 추적할 수 있다",
       goal: "차량 시스템 · E/E 아키텍처 ·\nSW 제어 로직의 관계 이해" },
  2: { no: "STEP 02", name: "도미노", en: "TRACE THE DEVIATION", q: "이상은 어디서\n시작되었는가?",
       act: "증상에서 출발해 신호를 거꾸로\n측정하며 원인 후보를 좁힌다", why: "증상은 결과다 —\n먼저 달라진 신호를 찾는다",
       goal: "증상과 원인을 구분하고\n최초 편차를 추적하는 사고" },
  3: { no: "STEP 03", name: "퍼즐", en: "BUILD THE BASELINE", q: "정상이라면 어떻게\n동작해야 하는가?",
       act: "요구사항대로 정상 로직 블록을\n조립하고 기준값을 확정한다", why: "정상 기준이 있어야\n고장을 판정할 수 있다",
       goal: "요구사항을 검증 가능한\n정상 기준으로 구체화" },
  4: { no: "STEP 04", name: "실험 검증", en: "VERIFY THE ROOT CAUSE", q: "시험 결과는 원인 가설을\n뒷받침하는가?",
       act: "시험 수준·입력을 골라 실행하고\n신호 근거로 지지·반박·보류", why: "FAIL은 결과일 뿐,\n원인은 신호 증거로 판정한다",
       goal: "시험 결과와 원인 판정을\n구분하는 증거 기반 판단" },
  5: { no: "STEP 04", name: "수리 · 재시험", en: "FIX & RE-VERIFY", q: "원인을 없앴는가,\n증상만 가렸는가?",
       act: "원인을 제거하는 수리를 고르고\n같은 조건으로 다시 시험한다", why: "같은 조건의 재시험으로\n수리 효과를 확인한다",
       goal: "추론에서 검증까지\n하나의 흐름으로" },
};

// Short on-panel captions (editorial graphics, not game UI).
export const CAPTIONS = [
  { t: 3.0, d: 2.0, kind: "copy", text: "고장의 결과가 아닌, 원인을 추적하다." },
  { t: 41.6, d: 2.0, kind: "banner", text: "시험으로 확인하고, 증거로 판정하다." },
  { t: 43.8, d: 4.1, kind: "abTitle" },
  { t: 50.4, d: 2.4, kind: "banner", text: "추론에서 검증까지." },
];

export const AI_FLOW = [
  ["PROTOTYPING", "직접 만들고 플레이하며 문제 발견"],
  ["DATA VALIDATION", "도메인·고장 데이터 준비, 여러 AI로 교차 검수"],
  ["ROADMAP & DESIGN", "전체 로드맵과 단계별 요구사항 설계"],
  ["WIREFRAME & UI/UX", "화면 구조와 인터랙션을 구체화"],
  ["AI-ASSISTED CODING", "AI와 협업한 바이브코딩·기능 구현"],
  ["PLAYTEST & ITERATION", "직접 플레이하며 검수·반복 개선"],
];

// Thumbnails for the 4-step infographic (real frames from each recording, clip ms).
export const STEP_THUMBS = [
  { clip: "garage", at: 15500, label: "STEP 01", name: "정비소", en: "시스템 이해" },
  { clip: "board", at: 66900, label: "STEP 02", name: "도미노", en: "최초 편차 추적" },
  { clip: "puzzle", at: 22000, label: "STEP 03", name: "퍼즐", en: "정상 기준 구성" },
  { clip: "bench", at: 22800, label: "STEP 04", name: "실험 검증", en: "가설 검증" },
];
