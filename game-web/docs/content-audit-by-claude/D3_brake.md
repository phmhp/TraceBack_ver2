# D-3 brake — 기존 사건 완성 예시 (D-2 템플릿 적용)

- 원문은 **소스 그대로**(코드 블록 verbatim). 숫자·구조 포함. D-1 ID는 해당 블록 라인에 걸린 문자열 항목.
- 필드 ID는 `SCENARIO_AUTHORING_TEMPLATE.md`의 ID.
- 도달 상태: **일반 플레이 미도달(진입 경로 없음)** — 데이터만 존재. 아래 값은 모두 `정상 플레이 미도달` 사건의 데이터

## SCN_S · scenarios.ts · SCENARIOS (레거시 사건 레지스트리)

- 대응 필드: M02, M03, M12, M14, S103, S201, S202, S203, S204, S219
- 소스: `src/game/scenarios.ts` 라인 13~67 (비연속 포함)

```ts
export const SCENARIOS: Record<CaseId, Scenario> = {
  brake: {
    title: "제동 페달 입력 대비 감속 부족",
    chapter: "선택 사건 · 제동 응답",
    symptom: "브레이크 페달을 밟았지만 회생제동만 작동하고 마찰제동 반응이 약합니다.",
    root: "brake_actuator", // id kept for save compatibility; the root cause is SW command scaling
    repair: "압력 명령 I/O 어댑터의 이중 스케일링 제거",
    evidence: [
      { id: "brake_request", label: "페달 55% 입력에도 감속이 부족함", value: "정지거리 증가를 주행 중 관찰", kind: "주행 현상" },
      { id: "regen_request", label: "회생제동 명령이 22%로 기록됨", value: "인버터 회생 명령 정상", kind: "제어 명령" },
      { id: "brake_actual", label: "캘리퍼 압력이 기대값보다 낮게 측정됨", value: "명령 42 bar · 실제 8 bar (약 19%)", kind: "물리 응답" },
    ],
    hypotheses: [
      { id: "brake_actuator", label: "압력 명령을 내보내는 SW가 값을 다시 축소했다", desc: "SW 인터페이스 스케일링 오류" },
      { id: "regen_limit", label: "회생 한계 처리 SW가 마찰 몫을 잘못 계산했다", desc: "제어 계산 오류 가능성" },
      { id: "pedal", label: "페달 입력 처리 SW의 보정값이 틀렸다", desc: "입력 데이터 처리 오류 가능성" },
    ],
  },
```

- D-1 ID(19): SCN-0052-1, SCN-0053-1, SCN-0054-1, SCN-0056-1, SCN-0058-1, SCN-0058-2, SCN-0058-3, SCN-0059-1, SCN-0059-2, SCN-0059-3, SCN-0060-1, SCN-0060-2, SCN-0060-3, SCN-0063-1, SCN-0063-2, SCN-0064-1, SCN-0064-2, SCN-0065-1, SCN-0065-2

## SCN_M · scenarios.ts · SCENARIO_META (사건 설정·가설 규칙)

- 대응 필드: M04, M05, M06, M07, M09, M10, M11, M13, S104, S220, S221, S222
- 소스: `src/game/scenarios.ts` 라인 86~156 (비연속 포함)

```ts
export const SCENARIO_META: Record<CaseId, ScenarioMeta> = {
  brake: {
    domain: "제동",
    goal: "내부 압력 계산값은 정상인데 출력값이 낮을 때, SW I/O 경계의 스케일링 오류를 다른 SW 가설과 구분한다.",
    trigger: "선택 사건: 정차 구간 제동(페달 55%)",
    injection: "Brake ECU I/O 어댑터 SW가 압력 계산값에 변환 계수 0.19를 중복 적용 (brakeCommandScale 0.19 · simModel cmdOut)",
    faultModel: "내부 압력 계산 42 bar → 전송 명령 약 8 bar → 캘리퍼 압력 약 8 bar → 감속 부족",
    normalSpec: "페달 55% → 감속 요구 3.2 m/s², 회생 가용량을 뺀 나머지를 마찰 압력으로(1 m/s² 당 20 bar)",
    fix: "I/O 어댑터의 중복 스케일링 제거 후 SW 배포",
    regression: "같은 임베디드 SW·I/O 시험 PASS + 영향 범위 신호",
    status: "optional", review: "선택 사건 · 레이스 고장 트리거 미구현(퍼즐·검증만 진행)",
    hypotheses: [
      { id: "blend_sw", label: "Brake ECU 회생·마찰 배분 SW", truth: false, stage1: "도미노 역추적: 내부 압력 계산값은 42 bar로 기준과 같았어요.", rules: [
        { levels: SW, need: { cmd: ["same"] }, verdict: "refuted", why: "SW 시험에서 압력 명령이 요구사항과 같아요." },
      ] },
      { id: "hyd_path", label: "압력 명령 I/O 어댑터 SW 스케일링", truth: true, rules: [
        { levels: ["embedded", "vehicle"], need: { cmd: ["same"], cmdOut: ["lower"] }, verdict: "supported", why: "내부 계산값은 정상인데 I/O 어댑터가 내보낸 값부터 낮아요." },
      ] },
      { id: "caliper", label: "압력 피드백 데이터 처리 SW", truth: false, rules: [
        { levels: ["embedded", "vehicle"], need: { cmdOut: ["lower"] }, verdict: "refuted", why: "피드백을 읽기 전에 전송 명령부터 낮아요." },
      ] },
    ],
  },
```

- D-1 ID(16): SCN-0136-1, SCN-0137-1, SCN-0138-1, SCN-0139-1, SCN-0140-1, SCN-0141-1, SCN-0142-1, SCN-0143-1, SCN-0144-1, SCN-0146-1, SCN-0146-2, SCN-0147-1, SCN-0149-1, SCN-0150-1, SCN-0152-1, SCN-0153-1

## DOT · DominoTrace.tsx · CASES (STEP02 도미노·의심 구간)

- 대응 필드: S205, S206, S207, S208, S209, S210, S211, S212, S213, S214, S215, S216, S217, S218
- 소스: `src/features/board/DominoTrace.tsx` 라인 50~149 (비연속 포함)

```ts
export const CASES: Record<CaseId, CaseData> = {
  brake: {
    start: "stop", first: "caliper", timeUnit: "초",
    req: "요구사항: 브레이크를 55% 밟으면 3.2 m/s²로 감속해야 한다.",
    doms: [
      { id: "stop", label: "정지 거리", img: CAR, zone: "차량", ref: 32, run: 58, unit: "m", status: "bad", t: 3, causes: ["decel", "road", "fluid"] },
      { id: "decel", label: "차량 감속", img: B("brake_request"), zone: "차량", ref: 3.2, run: 1.4, unit: "m/s²", status: "bad", t: 0.2, causes: ["pitch", "caliper", "regen"] },
      { id: "caliper", label: "I/O 어댑터 압력 명령", img: B("brake_actual"), zone: "제어기", ref: 42, run: 8, unit: "bar", status: "bad", t: 0.1, causes: ["p_cmd", "pad_temp", "bpp"], ev: "brake_actual" },
      { id: "rear_warn", label: "후방 추돌 경고", img: ECU, zone: "차량", ref: "꺼짐", run: "켜짐", unit: "", status: "bad", t: 3.2 },
      { id: "pitch", label: "차체 앞 쏠림", img: CAR, zone: "차량", ref: 3, run: 1.2, unit: "°", status: "bad", t: 0.4 },
      { id: "pad_temp", label: "브레이크 패드 온도", img: ATLAS(7), zone: "부품", ref: 180, run: 60, unit: "°C", status: "bad", t: 0.5 },
      OK("p_cmd", "압력 명령 (Brake ECU)", E("brake_ecu"), "제어기", 42, "bar"),
      OK("bpp", "브레이크 페달", E("brake_pedal"), "센서", 55, "%"),
      { ...OK("regen", "회생 제동", B("regen_request"), "제어기", 22, "%"), ev: "regen_request" },
      OK("road", "노면 마찰", CAR, "차량", 0.8, "μ"),
      OK("fluid", "브레이크액 양", ATLAS(8), "부품", 100, "%"),
    ],
    section: { name: "Brake ECU 계산값→I/O 출력 SW 경계", choices: [
      { label: "회생·마찰 배분 계산 SW", ok: false, why: "내부 압력 계산값은 기준대로 42 bar였어요. 배분 계산은 정상이에요." },
      { label: "페달 입력 처리 SW", ok: false, why: "처리된 페달 값 55%는 기준과 같아요. 입력 처리는 정상이에요." },
      { label: "Brake ECU 계산값→I/O 출력 SW 경계", ok: true, why: "내부 계산은 42 bar인데 전송값은 8 bar예요. 어떤 데이터 처리 오류인지는 검증에서 가려요." },
    ] },
    zoom: {
      where: "Brake ECU I/O 어댑터", kind: "sw",
      reference: [["압력 계산", "42 bar"], ["단위 변환", "×1.00"], ["전송 명령", "42 bar"]],
      run: [["압력 계산", "42 bar"], ["단위 변환", "×0.19 중복"], ["전송 명령", "8 bar"]],
      culprit: "압력 명령 이중 스케일링",
      lesson: "내부 계산 뒤 I/O 어댑터 SW가 변환 계수를 한 번 더 적용해 압력 명령을 19%로 줄였어요.",
    },
  },
```

- D-1 ID(45): DOT-0122-1, DOT-0123-1, DOT-0125-1, DOT-0125-2, DOT-0126-1, DOT-0126-2, DOT-0126-3, DOT-0127-1, DOT-0127-2, DOT-0128-1, DOT-0128-2, DOT-0128-3, DOT-0128-4, DOT-0129-1, DOT-0129-2, DOT-0130-1, DOT-0130-2, DOT-0130-3, DOT-0131-1, DOT-0131-2, DOT-0132-1, DOT-0132-2, DOT-0133-1, DOT-0133-2, DOT-0134-1, DOT-0134-2, DOT-0135-1, DOT-0135-2, DOT-0137-1, DOT-0138-1, DOT-0138-2, DOT-0139-1, DOT-0139-2, DOT-0140-1, DOT-0140-2, DOT-0143-1, DOT-0144-1, DOT-0144-2, DOT-0144-3, DOT-0145-1, DOT-0145-2, DOT-0145-3, DOT-0145-4, DOT-0146-1, DOT-0147-1

## EET · EeTrace.tsx · OBSERVED/REPLAY/LAMP/QUOTE/SUBSYS

- 대응 필드: S111, S112, S223, S224, S225
- 소스: `src/features/board/EeTrace.tsx` 라인 29~301 (비연속 포함)

```ts
const LAMP: Record<string, { label: string; note: string }> = {
  brake: { label: "제동 경고 없음", note: "페달 대비 감속이 부족함" },
const QUOTE: Record<string, string> = {
  brake: "브레이크를 밟았는데 생각보다 덜 서.",
const OBSERVED: Record<string, { icon: "detective" | "warning" | "clipboard" | "road"; label: string; value: string }[]> = {
  brake: [{ icon: "detective", label: "운전자 체감", value: "밟아도 덜 섬" }, { icon: "warning", label: "계기판", value: "브레이크 경고등" }, { icon: "clipboard", label: "페달 입력 기록", value: "55% 유지" }, { icon: "road", label: "노면", value: "마른 노면" }],
const REPLAY: Record<string, string> = { propulsion: "페달 60% 기록", thermal: "고속 연속 주행 기록", brake: "페달 55% 기록" };
const SUBSYS: Record<string, { where: string; inLabel: string; outLabel: string; stages: string[] }> = {
  brake: { where: "압력 출력 SW 경계", inLabel: "압력 계산 42 bar", outLabel: "전송 명령 8 bar (기준 42)", stages: ["배분 계산", "단위 변환", "I/O 전송"] },
```

- D-1 ID(20): EET-0032-1, EET-0032-2, EET-0037-1, EET-0294-1, EET-0294-2, EET-0294-3, EET-0294-4, EET-0294-5, EET-0294-6, EET-0294-7, EET-0294-8, EET-0296-1, EET-0296-2, EET-0296-3, EET-0301-1, EET-0301-2, EET-0301-3, EET-0301-4, EET-0301-5, EET-0301-6

## DLG · experiences.tsx · FaultDialogue(DRIVER_LINE)

- 대응 필드: S109, S110
- 소스: `src/experiences.tsx` 라인 1966~1974 (비연속 포함)

```ts
export function FaultDialogue({ state, send }: { state: Campaign; send: Send }) {
    brake: "브레이크를 밟았는데 차가 잘 안 서! 브레이크 경고등까지 켜졌어! 왜이러지?",
```

- D-1 ID(1): EXP-1974-1

## REF · RefPuzzle.tsx · REF·SCOPE (STEP03 퍼즐 보드)

- 대응 필드: S301, S302, S303, S304, S305, S306, S307, S308, S309
- 소스: `src/features/wiring/RefPuzzle.tsx` 라인 36~140 (비연속 포함)

```ts
const SCOPE: Record<CaseId, { unit: { name: string; ids: string[] }; swc: { name: string; ids: string[] }[] }> = {
  brake: { unit: { name: "제동 배분 SWC", ids: ["rmin", "rest", "press"] }, swc: [{ name: "제동 요구 SWC", ids: ["recv"] }, { name: "제동 배분 SWC", ids: ["rmin", "rest", "press"] }] },
const REF: Record<CaseId, Ref> = {
  brake: {
    domain: "제동", feature: "회생 + 마찰 협조 → 유압 경로", ecu: "Brake ECU → 유압", program: "blended_brake",
    board: ["pedal", "recv", "rmin", "rest", "press", "hmod", "caliper"], gaps: [1, 4, 5],
    spares: ["hmod", "slip", "press", "pressB", "recv"], joints: ["round", "square", "square", "square", "tri", "tri"],
    side: { pieces: ["bms", "avail"], into: 2, value: "회생 가능 1.1 m/s²", label: "BMS가 보내는 회생 가용량" },
    req: [
      { text: "운전자가 브레이크를 55% 밟는다", slot: 0 },
      { text: "목표 감속 3.2 m/s²를 받는다", slot: 1 },
      { text: "회생은 배터리가 받을 수 있는 만큼만 쓴다", slot: 2 },
      { text: "모자란 만큼은 마찰 제동이 채운다", slot: 3 },
      { text: "마찰 몫 2.1 m/s²는 압력 42 bar가 된다", slot: 4 },
      { text: "유압 모듈이 명령대로 라인 압력 42 bar를 만든다", slot: 5 },
      { text: "캘리퍼가 바퀴를 잡아 합계 3.2 m/s²", slot: 6 },
    ],
    blocks: {
      pedal: { id: "pedal", label: "브레이크 페달 센서", kind: "hw", img: `${T}brake_pedal.png`, out: "55%", from: "제동 · 페달 → 감속 요구" },
      recv: { id: "recv", label: "요구 수신", kind: "calc", out: "3.2 m/s²", from: "제동 · 회생·마찰 협조" },
      rmin: { id: "rmin", label: "회생 MIN", kind: "min", out: "회생 1.1", from: "제동 · 회생·마찰 협조" },
      rest: { id: "rest", label: "잔여력 계산", kind: "calc", out: "마찰 2.1", from: "제동 · 회생·마찰 협조" },
      press: { id: "press", label: "마찰 압력", tag: "표 A", spec: "표 값: 2.1 m/s² → 42 bar", kind: "lut", out: "42 bar", from: "제동 · 회생·마찰 협조" },
      pressB: { id: "pressB", label: "마찰 압력", tag: "표 B", spec: "표 값: 2.1 m/s² → 8 bar", kind: "lut", bad: "8 bar", from: "제동 · 회생·마찰 협조",
        why: "실행 결과 8 bar예요. 요구사항은 '2.1 m/s² → 42 bar'예요. 같은 '마찰 압력'이라도 표 값이 달라요." },
      slip: { id: "slip", label: "슬립 임계", kind: "switch", from: "제동 · ABS 잠김 방지",
        why: "'슬립 임계'는 바퀴가 잠기려 할 때만 끼어드는 ABS 블록이에요. 평소 협조 제동 경로에는 없어요." },
      hmod: { id: "hmod", label: "유압 모듈 · 밸브·펌프", kind: "hw", ee: true, img: `${T}brake_ecu.png`, out: "라인 42 bar", from: "제동 · 페달 → 감속 요구 (E/E)" },
      caliper: { id: "caliper", label: "캘리퍼 · 바퀴", kind: "hw", img: `${T}brake_caliper.png`, out: "감속 3.2 m/s² ✓", from: "제동 · 회생·마찰 협조" },
      bms: { id: "bms", label: "BMS 배터리 수용량", kind: "hw", img: `${T}bms.png`, out: "충전 여유 적음", from: "제동 · 회생·마찰 협조" },
      avail: { id: "avail", label: "회생 가용량", kind: "lut", out: "회생 가능 1.1 m/s²", from: "제동 · 회생·마찰 협조" },
    },
    notes: [{ domain: "brake", feature: 1, name: "제동 · 회생·마찰 협조" }],
    field: { hmod: "라인 8 bar", caliper: "감속 1.4 m/s²" },
  },
```

- D-1 ID(52): REF-0039-1, REF-0039-2, REF-0039-3, REF-0110-1, REF-0110-2, REF-0110-3, REF-0113-1, REF-0113-2, REF-0115-1, REF-0116-1, REF-0117-1, REF-0118-1, REF-0119-1, REF-0120-1, REF-0121-1, REF-0124-1, REF-0124-2, REF-0125-1, REF-0125-2, REF-0126-1, REF-0126-2, REF-0126-3, REF-0127-1, REF-0127-2, REF-0127-3, REF-0128-1, REF-0128-2, REF-0128-3, REF-0128-4, REF-0129-1, REF-0129-2, REF-0129-3, REF-0129-4, REF-0130-1, REF-0131-1, REF-0131-2, REF-0132-1, REF-0133-1, REF-0133-2, REF-0133-3, REF-0134-1, REF-0134-2, REF-0134-3, REF-0135-1, REF-0135-2, REF-0135-3, REF-0136-1, REF-0136-2, REF-0136-3, REF-0138-1, REF-0139-1, REF-0139-2

## REF2 · RefPuzzle.tsx · WHY·RIG_GOAL·SPEC·ACTUATOR

- 대응 필드: S310, S311, S312, S313, S314, S315
- 소스: `src/features/wiring/RefPuzzle.tsx` 라인 387~421 (비연속 포함)

```ts
const WHY: Record<CaseId, string> = {
  brake: "브레이크를 밟은 만큼 회생과 마찰 제동을 나눠 차를 세우기 위해서예요.",
const ACTUATOR: Record<CaseId, { id: string; ok: string; weak: string }> = {
  brake: { id: "brake_caliper", ok: "캘리퍼 42 bar · 정상 감속", weak: "압력 부족 · 감속이 약해요" },
const RIG_GOAL: Record<CaseId, string> = {
  brake: "배분 계산 SW인지, 압력 명령 I/O 어댑터 SW인지",
const SPEC: Record<CaseId, { text: string; input?: { label: string; unit: string; min: number; max: number; at: number }; expect: string }> = {
  brake: { text: "페달 55% → 목표 감속 3.2 m/s² · 회생은 가용량까지 · 나머지는 마찰(1 m/s²당 20 bar)", expect: "페달 55% → 감속 3.2 m/s²" },
```

- D-1 ID(6): REF-0390-1, REF-0396-1, REF-0396-2, REF-0414-1, REF-0421-1, REF-0421-2

## VCT · verificationContract.ts · BASE (시험 계약)

- 대응 필드: S317, S318, S319, S320, S321, S322, S323
- 소스: `src/game/verificationContract.ts` 라인 23~71 (비연속 포함)

```ts
const BASE: Record<CaseId, ContractBase> = {
  brake: {
    version: 1,
    caseId: "brake",
    objective: "제동 배분 계산 SW와 압력 명령 I/O 어댑터 SW를 같은 제동 입력에서 구분한다.",
    preconditions: ["차속 72 km/h", "D단", "SOC 82%", "ABS 비활성"],
    stimulus: { label: "정지선 제동", sequence: "제동 0→55% / 0.6 s · 정지까지 유지" },
    expectedSignal: "제동 명령과 캘리퍼 압력",
    observations: [
      { id: "input", label: "제동 요구" },
      { id: "control", label: "회생·마찰 배분" },
      { id: "output", label: "캘리퍼 압력" },
    ],
    comparison: { baseline: "STEP03 정상 기준 장치", sameInput: true, timeAxis: "정지까지 동일 시간축", units: "%, m/s², bar" },
    limitation: "협조 제동의 최초 편차를 찾되 시험 결과와 SW 근본 원인 판정을 분리한다.",
    createdBy: "STEP03",
  },
```

- D-1 ID(13): VCT-0059-1, VCT-0060-1, VCT-0060-2, VCT-0060-3, VCT-0061-1, VCT-0061-2, VCT-0062-1, VCT-0064-1, VCT-0065-1, VCT-0066-1, VCT-0068-1, VCT-0068-2, VCT-0069-1

## LAB · VerificationLab.tsx · QUESTIONS/CASE_DERIVS/FIXES/LV_ANSWER/BEST_COST/ROOT_SIGNAL

- 대응 필드: S401, S403, S408, S409, S410
- 소스: `src/features/verification/VerificationLab.tsx` 라인 486~1121 (비연속 포함)

```ts
const FIXES: Record<CaseId, Fix[]> = {
  brake: [
    { label: "I/O 어댑터 중복 스케일링 제거", img: "/assets/ending-thumbs/brake_ecu.png", ok: true, why: "내부 계산 뒤 0.19가 다시 적용되던 SW 인터페이스 오류를 제거했어요." },
    { label: "회생 제동을 더 세게 설정", img: "/assets/board-photos/regen_request.png", ok: false, why: "회생 제동은 배터리가 가득 차면 줄어들어요. 마찰 제동 고장을 가릴 뿐이에요." },
    { label: "압력 계산값을 5배로 키우기", img: "/assets/ending-thumbs/brake_ecu.png", ok: false, why: "증상만 보상하는 값이에요. 경계 조건에서 과한 압력을 만들 수 있어요." },
  ],
const CASE_DERIVS: Record<CaseId, { id: Deriv; tech: Tech; input: string }[]> = {
  brake: [
    { id: "reqa", tech: "req", input: "페달 55% · 회생 가능 (요구사항 값)" },
    { id: "bound", tech: "boundary", input: "페달 55% · 배터리 가득, 회생 0 (경계)" },
  ],
const LV_ANSWER: Record<CaseId, { answer: Lv; why: string }> = {
  brake: { answer: "embedded", why: "의심 구간이 압력 명령 I/O 어댑터 SW예요. 통합 SW·제어기 I/O 시험에서 계산값과 전송값을 비교하면 가장 먼저 잡을 수 있어요." },
const BEST_COST: Record<CaseId, number> = { propulsion: 2, thermal: 10, brake: 10 };
const ROOT_SIGNAL: Record<CaseId, string> = { propulsion: "proc", thermal: "rpm", brake: "line" };
const QUESTIONS: Record<CaseId, { hyp: string; ask: string }[]> = {
  brake: [
    { hyp: "blend_sw", ask: "회생·마찰 나누는 SW가 잘못된 거야?" },
    { hyp: "hyd_path", ask: "I/O 어댑터가 압력 명령을 다시 줄인 거야?" },
    { hyp: "caliper", ask: "압력 피드백 처리 SW가 잘못된 거야?" },
  ],
```

- D-1 ID(12): LAB-0498-1, LAB-0498-2, LAB-0499-1, LAB-0499-2, LAB-0500-1, LAB-0500-2, LAB-0594-1, LAB-0595-1, LAB-0610-1, LAB-1118-1, LAB-1119-1, LAB-1120-1

## PRED · VerificationLab.tsx · PREDICT (가설 id 키)

- 대응 필드: S402
- 소스: `src/features/verification/VerificationLab.tsx` 라인 1320~1328 (비연속 포함)

```ts
const PREDICT: Record<string, string> = {
  blend_sw: "배분 SW가 원인이라면: SW만 PC에서 돌려도 '압력 명령'이 기준과 달라야 해요.",
  hyd_path: "I/O 스케일링 SW가 원인이라면: 내부 압력 계산은 42 bar지만 전송값부터 약 8 bar여야 해요.",
  caliper: "피드백 처리 SW가 원인이라면: 전송 명령은 정상이고 읽어 온 압력값만 낮아야 해요.",
```

- D-1 ID(3): LAB-1326-1, LAB-1327-1, LAB-1328-1

## SIM · simModel.ts · 모델 함수·VIEW·TIME

- 대응 필드: S404, S405, S406, S407
- 소스: `src/features/verification/simModel.ts` 라인 69~172 (비연속 포함)

```ts
function brake(tech: Tech, fault: boolean) {
  const regenMax = tech === "boundary" ? 0 : 1.1; // battery full → no regeneration: friction carries everything
  return integrate(3, { p: 0, req: 0, regen: 0, fric: 0, cmd: 0, line: 0, cal: 0, v: 50 / 3.6, dec: 0 }, (s, t, dt) => {
    s.p = clamp((t - .05) / .2, 0, 1) * 55;
    s.req = s.p * 3.2 / 55;
    s.regen += (Math.min(s.req, regenMax) - s.regen) * dt / .05;
    s.fric = Math.max(0, s.req - s.regen);
    s.cmd = s.fric * 20;                                          // 2.1 m/s² → 42 bar
    const cmdOut = s.cmd * (fault ? .19 : 1);                     // fault: output-interface SW applies a second scale
    s.line += (cmdOut - s.line) * dt / .08;
    s.cal += (s.line - s.cal) * dt / .02;
    s.dec = s.regen + s.cal / 20;
    s.v = Math.max(0, s.v - s.dec * dt);
  }, s => ({ p: s.p, req: s.req, avail: regenMax, fric: s.fric, cmd: s.cmd, cmdOut: s.cmd * (fault ? .19 : 1), valve: s.cmd * (fault ? .19 : 1) * 1.4, cur: s.cmd * (fault ? .19 : 1) * .02, line: s.line, cal: s.cal, regen: s.regen, dec: s.dec, spd: s.v * 3.6 }));
}
const VIEW: Record<CaseId, Record<Lv, Def[]>> = {
  brake: {
    unit: [
      { id: "req", name: "입력값 인가 · 제동 요구", unit: "m/s²", max: 4, src: "req", model: true },
      { id: "avail", name: "회생 가용량", unit: "m/s²", max: 4, src: "avail", model: true },
      { id: "fric", name: "잔여력 · 마찰 몫", unit: "m/s²", max: 4, src: "fric", model: true },
      { id: "cmd", name: "마찰 압력 명령", unit: "bar", max: 70, src: "cmd", model: true },
    ],
    swint: [
      { id: "p", name: "페달 SWC 출력", unit: "%", max: 100, src: "p", model: true },
      { id: "regen", name: "회생 요청 (→ VCU)", unit: "m/s²", max: 4, src: "regen", model: true },
      { id: "cmd", name: "압력 명령", unit: "bar", max: 70, src: "cmd", model: true },
      { id: "valve", name: "밸브 PWM 명령", unit: "%", max: 110, src: "valve", model: true },
    ],
    embedded: [
      { id: "cmd", name: "압력 계산값", unit: "bar", max: 70, src: "cmd", model: true },
      { id: "cmdOut", name: "I/O 어댑터 출력값", unit: "bar", max: 70, src: "cmdOut" },
      { id: "cur", name: "밸브 구동 전류", unit: "A", max: 1.5, src: "cur", model: true },
      { id: "line", name: "유압 모델 라인 압력", unit: "bar", max: 70, src: "line" },
    ],
    vehicle: [
      { id: "cmd", name: "압력 계산값", unit: "bar", max: 70, src: "cmd" },
      { id: "cmdOut", name: "전송된 압력 명령", unit: "bar", max: 70, src: "cmdOut" },
      { id: "line", name: "캘리퍼 입구 압력 (실부품 연결)", unit: "bar", max: 70, src: "line" },
      { id: "dec", name: "차량 감속", unit: "m/s²", max: 4, src: "dec" },
    ],
  },
const TIME: Record<CaseId, [number, string]> = { propulsion: [3, "s"], thermal: [8, "분(압축)"], brake: [3, "s"] };

/** Reference = healthy design, run = field fault (or the fixed design). Same input for both. */
```

- D-1 ID(22): SIM-0144-1, SIM-0144-2, SIM-0145-1, SIM-0145-2, SIM-0146-1, SIM-0146-2, SIM-0147-1, SIM-0150-1, SIM-0151-1, SIM-0151-2, SIM-0152-1, SIM-0153-1, SIM-0156-1, SIM-0157-1, SIM-0158-1, SIM-0159-1, SIM-0162-1, SIM-0163-1, SIM-0164-1, SIM-0165-1, SIM-0165-2, SIM-0170-1

## END · CaseFileEnding.tsx · CASE_VISUAL/CASE_SAFETY/SIGNAL_PATH/CATEGORY

- 대응 필드: M08, S501, S502, S503, S504, S505, S506
- 소스: `src/ui/CaseFileEnding.tsx` 라인 48~202 (비연속 포함)

```ts
const CASE_VISUAL: Record<CaseId, {
  brake: {
    chain: [
      { img: "brake_pedal", label: "브레이크 페달", role: "입력" },
      { img: "brake_ecu", label: "Brake ECU", role: "제어" },
      { img: "brake_caliper", label: "캘리퍼", role: "출력" },
    ],
    fault: { at: "link", index: 1, label: "I/O 명령 42→8 bar" },
    meter: { label: "마찰 제동 응답", unit: "%", normal: 55, actual: 8, max: 60 },
    lesson: "내부 압력 명령은 정상, I/O 어댑터 SW가 전송값을 다시 축소",
  },
const CASE_SAFETY: Record<CaseId, { hazard: string; detect: string; safeState: string; insight: string }> = {
  brake: {
    hazard: "제동력 부족 → 정지 거리 증가",
    detect: "제동 압력 명령 vs 측정 압력 비교, 회생 실패 감시",
    safeState: "마찰 제동으로 보상 + 브레이크 경고등",
    insight: "한 제동 수단이 실패해도 다른 수단으로 보완하는 '중복' 구조",
  },
const SIGNAL_PATH: Record<CaseId, string> = {
  brake: "브레이크 입력 → Brake ECU 압력 계산 → I/O 전송 압력 명령 → 캘리퍼 압력 → 감속",
const CATEGORY: Record<CaseId, string> = {
  brake: "제어기 I/O 처리 / SW 통신·인터페이스",
```

- D-1 ID(15): END-0076-1, END-0076-2, END-0077-1, END-0077-2, END-0078-1, END-0078-2, END-0080-1, END-0081-1, END-0082-1, END-0102-1, END-0103-1, END-0104-1, END-0105-1, END-0197-1, END-0202-1

## OBK · OpenBook.tsx · BOOK (차고 노트 카드)

- 대응 필드: S101, S102
- 소스: `src/ui/OpenBook.tsx` 라인 11~17 (비연속 포함)

```ts
const BOOK: Record<CaseId, { domain: DomainId; feature: number; name: string; req: string }[]> = {
  brake: [{ domain: "brake", feature: 1, name: "제동 · 회생·마찰 협조", req: "페달 55% → 목표 감속 3.2 m/s². 회생은 배터리가 받을 수 있는 만큼, 나머지는 마찰(1 m/s²당 20 bar)." }],
```

- D-1 ID(2): OBK-0017-1, OBK-0017-2

## RACE · experiences.tsx · 레이스 트리거·증상·회귀 코드 (데이터 아님)

- 대응 필드: S105, S107, S108, S113, S115
- 소스: `src/experiences.tsx` 라인 1721~1952 (비연속 포함)

```ts
        speed = THREE.MathUtils.clamp(speed, 0, topSpeed);
        if (!allowed || parking || driveMission === "restart" || waterFall || gear === "P" || gear === "R") speed = THREE.MathUtils.damp(speed, 0, 6.2, dt);
        if (mode === "assist") speed = Math.min(speed || (allowed && !parking ? 27 : 0), 30);
        // Faults appear only under the driving condition that exposes them
        // (= the reproduction condition the player later carries to the board).
        const inOvertakeZone = mode === "normal" && previous.distance >= OVERTAKE_ZONE[0];
        const inClimbZone = mode === "resume" && state.caseId === "propulsion" && previous.distance >= CLIMB_ZONE[0];
        if (inOvertakeZone && throttle) {
        const finalBoardingZone = mode === "ship" && distance >= RAMP_START;
        const gap = finalBoardingZone
          ? Math.max(10, previous.gap)
  useEffect(() => { fired.current = false; zoneThrottle.current = 0; }, [mode]);
  useEffect(() => {
    if (fired.current) return;
    if (sim.gap <= 0) {
      fired.current = true; send({ type: "CAUGHT" });
    } else if (mode === "normal" && (zoneThrottle.current >= 1.8 || sim.distance >= OVERTAKE_ZONE[1])) {
      // A single reducer event commits the car to the ramp and prevents stale
      // distance, water fall or a 0 m pursuit tick from stealing the ending.
      send({ type: "FINISH_ESCAPE", distance: sim.distance, gap: Math.max(10, sim.gap), elapsed: sim.elapsed });
    }
      setRegression({ ok, title: "회귀 주행 · 가속 페달 끝까지 1.5초", text: `가속 ${measured.toFixed(0)} km/h/s · 정상 기준 ${expected.toFixed(0)} km/h/s · ${ok ? "증상 재발 없음" : "기준보다 낮음"}` });
    } else if (state.caseId === "thermal" && held >= 2 && sim.speed > 40) {
      const ok = sim.heat < 80;
      setRegression({ ok, title: "회귀 주행 · 고속 연속 주행 2초", text: `냉각수 ${sim.heat.toFixed(0)}°C (고장 당시 84°C 이상) · ${ok ? "출력 제한 없음" : "온도 높음"}` });
    }
  return code ? code.toLowerCase() : event.key.toLowerCase();
};
```

- D-1 ID(4): EXP-1879-1, EXP-1879-2, EXP-1882-1, EXP-1882-2

## RUN · runtime.ts · 프로그램 id·수리 후 분기 코드 (데이터 아님)

- 대응 필드: M15, S114
- 소스: `src/game/runtime.ts` 라인 66~332 (비연속 포함)

```ts
  program: {
    propulsion: "underreport_45pct",
    thermal: "open_loop_fan",
    brake: "friction_only",
  },
    case "APPLY_REPAIR":
      s.completedCases = Array.from(new Set([...s.completedCases, s.caseId]));
      unlockInvestigation(s, "done");
      s.lastRepairElapsedSeconds = s.raceElapsedSeconds;
      s.lastRepairDistance = s.raceDistance;
      if (s.caseId === "propulsion") {
        s.policeGapMeters = Math.max(105, s.policeGapMeters);
        return enter({ ...s, checkpoint: "harbor_entry" }, "CHASE_RESUME");
      }
      if (s.caseId === "thermal") {
        s.policeGapMeters = Math.max(115, s.policeGapMeters);
        return enter({ ...s, checkpoint: "dock_approach" }, "CHASE_RESUME");
      }
      s.policeGapMeters = Math.max(65, s.policeGapMeters);
      return enter(s, "SHIP_ESCAPE");
```

- D-1 ID(0): (문자열 항목 없음)

## 이 사건에 없는 TO-BE/PROPOSED 필드 (23개 — 3사건 공통으로 없음)

- M16 [선행 사건·사건 순서·해금] (PROPOSED) — H-8.1
- S106 [상태 기반 발생 전제조건] (PROPOSED) — FB-P2-02·H-8.5
- S227 [Hover 정상·이상 짧은 설명] (TO-BE) — L-4.2·M-4
- S228 [후보 STACK·정오 근거] (TO-BE) — L-4.2
- S229 [자유 실 연결 규칙] (TO-BE) — K-5.3·A-2.5
- S230 [미측정 증거 생성 금지 검수] (PROPOSED) — H-8.5·M-6.5
- S325 [STEP03 소제목 2줄] (TO-BE) — UI-RULE-01·소제목 데이터 계약
- S326 [긴 로직 줌 설정] (TO-BE) — M-04
- S327 [계약 → STEP04 시험 입력 구동] (PROPOSED) — K-6.5·H-8.5
- S413 [탭별 의문형 관찰 목표] (TO-BE) — M-09
- S414 [관찰 신호 선택 제한] (TO-BE) — M-6.4 장면 2·H-5
- S415 [모니터링 데이터 유형] (TO-BE) — M-10·M-6.3
- S416 [수리 카드 근거 연결] (TO-BE) — M-6.4 장면 6
- S417 [오답 수리 시뮬레이션] (PROPOSED) — H-5.H·I-4
- S418 [고객 한 장 요약 카드] (TO-BE) — M-6.4 장면 7
- S509 [전용 증명사진·머그샷 이미지] (PROPOSED) — (CLAUDE.md)
- X01 [헤더 2줄 소제목(자동 조합)] (TO-BE) — UI-RULE-01
- X03 [SW-only 근본 원인 검수] (TO-BE) — L-3.1~3.3
- X04 [말투 규칙 검수] (PROPOSED) — (CLAUDE.md)
- X05 [수치 일관성 검수(3 모델·데이터)] (PROPOSED) — H-8.6
- X06 [결정론 재현 테스트] (TO-BE) — H-8.6
- X07 [사건 스키마 검증기] (TO-BE) — H-8.3~H-8.4
- X08 [단일 사건 레지스트리] (PROPOSED) — H-8.1·H-8.10

## 이 사건의 AS-IS 누락 키 요약

- 없음

## 상태 구분

- [정상 플레이 미도달] 레이스 트리거·진입 이벤트 없음(B_PLAY_FLOW_INDEX B1-b)
- [부분 구현] `RefPuzzle.exampleValue`는 brake에서 null, `SPEC.input` 슬라이더 없음
- [실행 검증 필요] 위 블록의 동작은 실행하지 않음
