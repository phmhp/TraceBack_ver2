# D-3 propulsion — 기존 사건 완성 예시 (D-2 템플릿 적용)

- 원문은 **소스 그대로**(코드 블록 verbatim). 숫자·구조 포함. D-1 ID는 해당 블록 라인에 걸린 문자열 항목.
- 필드 ID는 `SCENARIO_AUTHORING_TEMPLATE.md`의 ID.
- 도달 상태: 일반 플레이 도달(필수 사건)

## SCN_S · scenarios.ts · SCENARIOS (레거시 사건 레지스트리)

- 대응 필드: M02, M03, M12, M14, S103, S201, S202, S203, S204, S219
- 소스: `src/game/scenarios.ts` 라인 13~32

```ts
export const SCENARIOS: Record<CaseId, Scenario> = {
  propulsion: {
    title: "가속 페달 입력 대비 가속 성능 저하",
    chapter: "사건 1 · 가속 응답",
    symptom: "가속 페달을 절반 이상 밟았지만 차가 힘없이 천천히 가속합니다.",
    root: "gateway",
    repair: "페달 신호 변환 비율을 정상 값으로 복원",
    evidence: [
      { id: "pedal_raw", label: "페달 60% 입력에도 차량 가속이 둔함", value: "주행 중 체감한 출력 부족", kind: "주행 현상" },
      { id: "pedal_processed", label: "VCU 입력값이 27%로 기록됨", value: "APS 원신호 60% → 처리값 27%", kind: "입력 계측" },
      { id: "torque_cmd", label: "CAN 토크 명령이 92 Nm로 기록됨", value: "정상 기준 204 Nm", kind: "제어 명령" },
      { id: "motor_actual", label: "모터 실제 토크가 91 Nm로 측정됨", value: "명령값과의 차이 1 Nm", kind: "물리 응답" },
    ],
    hypotheses: [
      { id: "aps_sensor", label: "가속 페달 센서가 틀린 값을 보냈다", desc: "입력 센서 오류 가능성" },
      { id: "gateway", label: "페달 신호를 잘못 줄여서 전달했다", desc: "입력 변환 비율 설정 오류" },
      { id: "bms", label: "배터리가 출력을 제한했다", desc: "배터리 보호 개입 가능성" },
      { id: "motor", label: "구동 모터가 힘을 내지 못했다", desc: "모터 출력 저하 가능성" },
    ],
  },
```

- D-1 ID(24): SCN-0015-1, SCN-0016-1, SCN-0017-1, SCN-0019-1, SCN-0021-1, SCN-0021-2, SCN-0021-3, SCN-0022-1, SCN-0022-2, SCN-0022-3, SCN-0023-1, SCN-0023-2, SCN-0023-3, SCN-0024-1, SCN-0024-2, SCN-0024-3, SCN-0027-1, SCN-0027-2, SCN-0028-1, SCN-0028-2, SCN-0029-1, SCN-0029-2, SCN-0030-1, SCN-0030-2

## SCN_M · scenarios.ts · SCENARIO_META (사건 설정·가설 규칙)

- 대응 필드: M04, M05, M06, M07, M09, M10, M11, M13, S104, S220, S221, S222
- 소스: `src/game/scenarios.ts` 라인 86~110

```ts
export const SCENARIO_META: Record<CaseId, ScenarioMeta> = {
  propulsion: {
    domain: "구동",
    goal: "입력 계측은 정상인데 제어기 출력이 다를 때, 하드웨어 없이 SW만 실행하는 시험으로 SW 계산 결함을 분리한다.",
    trigger: "추월 구간에서 가속 페달 전개(레이스 OVERTAKE_ZONE)",
    injection: "VCU 입력 처리 단계에 설계에 없는 보정 계수 ×0.45 (vehicleSim pedalScale 0.45 · simModel proc)",
    faultModel: "페달 60% → 처리값 27% → 토크 요청 92 Nm",
    normalSpec: "페달 0~100% → 토크 요청 0~340 Nm 선형, 60% → 204 Nm, 가용 토크 한계 260 Nm 이하",
    fix: "보정 계수 블록 제거 후 SW 배포",
    regression: "같은 SW 단위 시험(페달 60% 계단 입력) PASS + 영향 범위 신호",
    status: "implemented", review: "수치 일치 확인(60×0.45=27, 204×0.45≈92)",
    hypotheses: [
      { id: "aps", label: "가속 페달 센서·배선", truth: false, stage1: "도미노 역추적: 페달 센서 값 60%가 기준과 같았어요.", rules: [
        { levels: ["vehicle"], need: { aps: ["same"], can: ["lower"] }, verdict: "refuted", why: "페달 값은 같고 CAN 토크만 낮아요." },
      ] },
      { id: "vcu_sw", label: "VCU 페달 처리 SW(계산·보정값)", truth: true, rules: [
        { levels: SW, need: { proc: ["lower"] }, verdict: "supported", why: "입력 회로 없이 SW만 실행해도 처리값이 낮아요. SW 계산에서 생긴 차이예요." },
        { levels: SW, need: { proc: ["same"] }, verdict: "refuted", why: "SW만 실행하면 처리값이 기준과 같아요." },
      ] },
      { id: "vcu_hw", label: "VCU 입력 회로·신호 변환(HW)", truth: false, rules: [
        { levels: SW, need: { proc: ["lower"] }, verdict: "refuted", why: "입력 회로가 없는 SW 시험에서도 같은 차이가 나요. 입력 회로 탓이 아니에요." },
      ] },
      { id: "drive", label: "인버터·구동 모터", truth: false, stage1: "도미노 역추적: VCU가 보낸 CAN 토크 명령부터 이미 낮았어요.", rules: [] },
    ],
  },
```

- D-1 ID(19): SCN-0088-1, SCN-0089-1, SCN-0090-1, SCN-0091-1, SCN-0092-1, SCN-0093-1, SCN-0094-1, SCN-0095-1, SCN-0096-1, SCN-0098-1, SCN-0098-2, SCN-0099-1, SCN-0101-1, SCN-0102-1, SCN-0103-1, SCN-0105-1, SCN-0106-1, SCN-0108-1, SCN-0108-2

## DOT · DominoTrace.tsx · CASES (STEP02 도미노·의심 구간)

- 대응 필드: S205, S206, S207, S208, S209, S210, S211, S212, S213, S214, S215, S216, S217, S218
- 소스: `src/features/board/DominoTrace.tsx` 라인 50~84

```ts
export const CASES: Record<CaseId, CaseData> = {
  propulsion: {
    start: "accel", first: "vcu_in", timeUnit: "ms",
    req: "요구사항: 가속 페달을 60% 밟으면 모터가 204 Nm를 내야 한다.",
    doms: [
      { id: "accel", label: "차량 가속", img: CAR, zone: "차량", ref: 2.8, run: 1.2, unit: "m/s²", status: "bad", t: 60, causes: ["motor_tq", "regen", "brake_sw"], ev: "pedal_raw" },
      { id: "motor_tq", label: "모터 토크", img: B("motor_actual"), zone: "부품", ref: 204, run: 91, unit: "Nm", status: "bad", t: 30, causes: ["batt_i", "can_cmd", "motor_temp"], ev: "motor_actual" },
      { id: "can_cmd", label: "CAN 토크 명령", img: B("torque_cmd"), zone: "CAN", ref: 204, run: 92, unit: "Nm", status: "bad", t: 20, causes: ["inv_i", "gateway", "vcu_in"], ev: "torque_cmd" },
      { id: "vcu_in", label: "VCU 페달 처리값", img: B("pedal_processed"), zone: "제어기", ref: 60, run: 27, unit: "%", status: "bad", t: 10, causes: ["aps", "brake_sw", "gear", "bms_lim", "temp_lim"], ev: "pedal_processed" },
      // traps: abnormal, but they changed LATER than the domino they are offered for
      { id: "cluster", label: "계기판 출력 게이지", img: ECU, zone: "차량", ref: 60, run: 27, unit: "%", status: "bad", t: 70 },
      { id: "batt_i", label: "배터리 방전 전류", img: E("bms"), zone: "부품", ref: 180, run: 85, unit: "A", status: "bad", t: 40 },
      { id: "inv_i", label: "인버터 전류", img: E("mcu"), zone: "부품", ref: 310, run: 140, unit: "A", status: "bad", t: 25 },
      OK("aps", "가속 페달 센서", B("pedal_raw"), "센서", 60, "%"),
      OK("brake_sw", "브레이크 스위치", E("brake_pedal"), "센서", "꺼짐", ""),
      OK("gear", "기어 위치", SENSOR, "센서", "D", ""),
      OK("bms_lim", "BMS 허용 출력", E("bms"), "제어기", 160, "kW"),
      OK("temp_lim", "온도 보호 제한", B("thermal_protection"), "제어기", "없음", ""),
      OK("regen", "회생 제동", B("regen_request"), "제어기", 0, "%"),
      OK("motor_temp", "모터 온도", B("motor_temp"), "부품", 62, "°C"),
      OK("gateway", "게이트웨이 전달", ATLAS(1), "CAN", 100, "%"),
    ],
    section: { name: "VCU 내부 (입력 회로·페달 처리·토크 계산)", choices: [
      { label: "가속 페달 센서·배선", ok: false, why: "페달 센서 값은 60%로 기준과 같아요. 센서 쪽이 원인이면 들어오는 값부터 달랐어야 해요." },
      { label: "VCU 내부 (입력 회로·페달 처리·토크 계산)", ok: true, why: "들어오는 값은 모두 정상인데 VCU가 내놓은 값만 달라요. 의심 구간은 VCU 내부예요. 입력 회로인지 계산 SW인지는 검증에서 가려요." },
      { label: "인버터·구동 모터", ok: false, why: "인버터·모터는 VCU 다음이에요. VCU 출력부터 이미 달랐으니 이쪽은 결과예요." },
    ] },
    zoom: {
      where: "VCU", kind: "sw",
      reference: [["페달 신호 읽기", "60%"], ["토크 지도", "204 Nm"], ["CAN 토크 명령", "204 Nm"]],
      run: [["페달 신호 읽기", "60%"], ["보정 계수 ×0.45", "27%"], ["토크 지도", "92 Nm"], ["CAN 토크 명령", "92 Nm"]],
      culprit: "보정 계수 ×0.45",
      lesson: "기준 설계에 없는 '보정 계수 ×0.45' 블록이 들어가 있었어요. 페달 값을 0.45배로 줄이는 잘못된 보정값이에요.",
    },
  },
```

- D-1 ID(50): DOT-0053-1, DOT-0055-1, DOT-0055-2, DOT-0055-3, DOT-0056-1, DOT-0056-2, DOT-0056-3, DOT-0057-1, DOT-0057-2, DOT-0058-1, DOT-0058-2, DOT-0060-1, DOT-0060-2, DOT-0061-1, DOT-0061-2, DOT-0062-1, DOT-0062-2, DOT-0063-1, DOT-0063-2, DOT-0064-1, DOT-0064-2, DOT-0064-3, DOT-0065-1, DOT-0065-2, DOT-0066-1, DOT-0066-2, DOT-0067-1, DOT-0067-2, DOT-0067-3, DOT-0068-1, DOT-0068-2, DOT-0069-1, DOT-0069-2, DOT-0070-1, DOT-0072-1, DOT-0073-1, DOT-0073-2, DOT-0074-1, DOT-0074-2, DOT-0075-1, DOT-0075-2, DOT-0079-1, DOT-0079-2, DOT-0079-3, DOT-0080-1, DOT-0080-2, DOT-0080-3, DOT-0080-4, DOT-0081-1, DOT-0082-1

## EET · EeTrace.tsx · OBSERVED/REPLAY/LAMP/QUOTE/SUBSYS

- 대응 필드: S111, S112, S223, S224, S225
- 소스: `src/features/board/EeTrace.tsx` 라인 29~299 (비연속 포함)

```ts
const LAMP: Record<string, { label: string; note: string }> = {
  propulsion: { label: "가속 출력 저하", note: "경고등 없음 · 페달 대비 가속이 둔함" },
const QUOTE: Record<string, string> = {
  propulsion: "페달을 반 넘게 밟았는데 차가 힘없이 천천히 나가.",
const OBSERVED: Record<string, { icon: "detective" | "warning" | "clipboard" | "road"; label: string; value: string }[]> = {
  propulsion: [{ icon: "detective", label: "운전자 체감", value: "끝까지 밟아도 가속 약함" }, { icon: "warning", label: "계기판", value: "경고등 없음" }, { icon: "clipboard", label: "페달 입력 기록", value: "60% 유지" }, { icon: "road", label: "도로", value: "마른 평지 직선" }],
const REPLAY: Record<string, string> = { propulsion: "페달 60% 기록", thermal: "고속 연속 주행 기록", brake: "페달 55% 기록" };
const SUBSYS: Record<string, { where: string; inLabel: string; outLabel: string; stages: string[] }> = {
  propulsion: { where: "VCU", inLabel: "페달 신호 60%", outLabel: "토크 명령 92 Nm (기준 204)", stages: ["입력 회로", "페달 처리", "토크 계산"] },
```

- D-1 ID(19): EET-0030-1, EET-0030-2, EET-0035-1, EET-0292-1, EET-0292-2, EET-0292-3, EET-0292-4, EET-0292-5, EET-0292-6, EET-0292-7, EET-0292-8, EET-0296-1, EET-0296-2, EET-0296-3, EET-0299-1, EET-0299-2, EET-0299-3, EET-0299-4, EET-0299-5

## DLG · experiences.tsx · FaultDialogue(DRIVER_LINE)

- 대응 필드: S109, S110
- 소스: `src/experiences.tsx` 라인 1966~1972 (비연속 포함)

```ts
export function FaultDialogue({ state, send }: { state: Campaign; send: Send }) {
    propulsion: "페달을 끝까지 밟아도 가속이 안나와! 경고등도 안떴는데! 왜이러지?",
```

- D-1 ID(1): EXP-1972-1

## REF · RefPuzzle.tsx · REF·SCOPE (STEP03 퍼즐 보드)

- 대응 필드: S301, S302, S303, S304, S305, S306, S307, S308, S309
- 소스: `src/features/wiring/RefPuzzle.tsx` 라인 36~77 (비연속 포함)

```ts
const SCOPE: Record<CaseId, { unit: { name: string; ids: string[] }; swc: { name: string; ids: string[] }[] }> = {
  propulsion: { unit: { name: "토크 요청 SWC", ids: ["filter", "map", "permit"] }, swc: [{ name: "APS 입력 SWC", ids: ["corr", "filter"] }, { name: "토크 요청 SWC", ids: ["map", "permit"] }, { name: "토크 중재 SWC", ids: ["min", "ramp"] }, { name: "통신 SWC", ids: ["out"] }] },
const REF: Record<CaseId, Ref> = {
  propulsion: {
    domain: "구동", feature: "페달 → 토크 요청", ecu: "VCU", program: "nominal",
    board: ["aps", "corr", "filter", "map", "permit", "min", "ramp", "out", "inv"], gaps: [3, 5, 6],
    spares: ["ramp", "mapB", "min", "est", "map"], joints: ["round", "round", "round", "square", "square", "square", "square", "zigzag"],
    side: { pieces: ["bms"], into: 5, value: "한계 260 Nm", label: "BMS가 보내는 토크 한계" },
    req: [
      { text: "운전자가 가속 페달을 60% 밟는다 (센서 A·B)", slot: 0 },
      { text: "두 센서 값이 서로 같은지 먼저 확인한다", slot: 1 },
      { text: "잠깐 튀는 값은 걸러 낸다", slot: 2 },
      { text: "페달 60%는 토크 204 Nm가 된다", slot: 3 },
      { text: "D단 · READY일 때만 토크를 통과시킨다", slot: 4 },
      { text: "배터리·온도 한계를 넘으면 한계값을 쓴다", slot: 5 },
      { text: "토크는 갑자기 말고 천천히 올린다", slot: 6 },
      { text: "인버터로 보내 모터가 204 Nm를 낸다", slot: 8 },
    ],
    blocks: {
      aps: { id: "aps", label: "APS A/B 가속 페달", kind: "hw", img: `${T}accel_pedal.png`, out: "A 60% · B 60%", from: "구동 · 운전자 토크 요청" },
      corr: { id: "corr", label: "A/B 상관성", kind: "check", out: "60% ✓", from: "구동 · 운전자 토크 요청" },
      filter: { id: "filter", label: "입력 필터", kind: "delay", out: "60%", from: "구동 · 운전자 토크 요청" },
      map: { id: "map", label: "페달 맵", tag: "표 A", spec: "표 값: 60% → 204 Nm, 100% → 340 Nm", kind: "lut", out: "204 Nm", from: "구동 · 운전자 토크 요청" },
      mapB: { id: "mapB", label: "페달 맵", tag: "표 B", spec: "표 값: 60% → 92 Nm, 100% → 153 Nm", kind: "lut", bad: "92 Nm", from: "구동 · 운전자 토크 요청",
        why: "실행 결과 92 Nm예요. 요구사항은 '60% → 204 Nm'이에요. 같은 '페달 맵'이라도 안에 든 표 값이 달라요." },
      permit: { id: "permit", label: "구동 허용", kind: "switch", out: "204 Nm · D", from: "구동 · 운전자 토크 요청" },
      min: { id: "min", label: "가용 토크 MIN", kind: "min", out: "204 Nm", from: "구동 · 운전자 토크 요청" },
      est: { id: "est", label: "토크 추정", kind: "calc", from: "구동 · 모터 토크 만들기 (인버터)",
        why: "'토크 추정'은 인버터 안에서 모터가 실제로 낸 토크를 짐작하는 블록이에요. VCU의 토크 요청 경로에는 없어요." },
      ramp: { id: "ramp", label: "램프율", kind: "delay", out: "204 Nm ↗", from: "구동 · 운전자 토크 요청" },
      out: { id: "out", label: "토크 출력", kind: "calc", out: "CAN 204 Nm", from: "구동 · 운전자 토크 요청" },
      inv: { id: "inv", label: "인버터 · 전륜 모터", kind: "hw", img: `${T}traction_motor.png`, out: "모터 204 Nm", from: "구동 · 운전자 토크 요청" },
      bms: { id: "bms", label: "BMS · 온도 한계", kind: "hw", img: `${T}bms.png`, out: "한계 260 Nm", from: "배터리 · 출력 한계 계산" },
    },
    notes: [{ domain: "drive", feature: 0, name: "구동 · 운전자 토크 요청" }],
    field: { filter: "27% (×0.45)", map: "92 Nm", permit: "92 Nm · D", min: "92 Nm", ramp: "92 Nm ↗", out: "CAN 92 Nm", inv: "모터 91 Nm" },
  },
```

- D-1 ID(51): REF-0037-1, REF-0037-2, REF-0037-3, REF-0037-4, REF-0037-5, REF-0045-1, REF-0045-2, REF-0048-1, REF-0048-2, REF-0050-1, REF-0051-1, REF-0052-1, REF-0053-1, REF-0054-1, REF-0055-1, REF-0056-1, REF-0057-1, REF-0060-1, REF-0060-2, REF-0061-1, REF-0061-2, REF-0062-1, REF-0062-2, REF-0063-1, REF-0063-2, REF-0063-3, REF-0063-4, REF-0064-1, REF-0064-2, REF-0064-3, REF-0064-4, REF-0065-1, REF-0066-1, REF-0066-2, REF-0067-1, REF-0067-2, REF-0068-1, REF-0068-2, REF-0069-1, REF-0070-1, REF-0070-2, REF-0071-1, REF-0071-2, REF-0072-1, REF-0072-2, REF-0072-3, REF-0073-1, REF-0073-2, REF-0073-3, REF-0075-1, REF-0076-1

## REF2 · RefPuzzle.tsx · WHY·RIG_GOAL·SPEC·ACTUATOR

- 대응 필드: S310, S311, S312, S313, S314, S315
- 소스: `src/features/wiring/RefPuzzle.tsx` 라인 387~418 (비연속 포함)

```ts
const WHY: Record<CaseId, string> = {
  propulsion: "페달을 얼마나 밟았는지에 맞춰 차가 낼 힘을 정하기 위해서예요.",
const ACTUATOR: Record<CaseId, { id: string; ok: string; weak: string }> = {
  propulsion: { id: "traction_motor", ok: "모터 204 Nm · 정상 가속", weak: "모터 힘 부족 · 가속이 약해요" },
const RIG_GOAL: Record<CaseId, string> = {
  propulsion: "VCU 계산 SW 문제인지, 입력 회로 문제인지",
const SPEC: Record<CaseId, { text: string; input?: { label: string; unit: string; min: number; max: number; at: number }; expect: string }> = {
  propulsion: { text: "페달 0~100% → 토크 요청 0~340 Nm 선형 · 가용 토크 한계 260 Nm(BMS·온도) · D단·READY일 때만 통과",
    input: { label: "가속 페달", unit: "%", min: 0, max: 100, at: 60 }, expect: "페달 60% → 토크 요청 204 Nm → 모터 204 Nm" },
```

- D-1 ID(7): REF-0388-1, REF-0394-1, REF-0394-2, REF-0412-1, REF-0417-1, REF-0418-1, REF-0418-2

## VCT · verificationContract.ts · BASE (시험 계약)

- 대응 필드: S317, S318, S319, S320, S321, S322, S323
- 소스: `src/game/verificationContract.ts` 라인 23~39

```ts
const BASE: Record<CaseId, ContractBase> = {
  propulsion: {
    version: 1,
    caseId: "propulsion",
    objective: "가속 출력 저하가 VCU 계산 SW인지 입력 회로인지 같은 조건에서 구분한다.",
    preconditions: ["READY", "D단", "차속 60 km/h", "브레이크 해제"],
    stimulus: { label: "사건 재현 가속", sequence: "APS 0→60% / 0.3 s · 3 s 유지" },
    expectedSignal: "요청 토크와 모터 토크",
    observations: [
      { id: "input", label: "APS 원신호" },
      { id: "control", label: "VCU 토크 맵 출력" },
      { id: "output", label: "모터 실제 토크" },
    ],
    comparison: { baseline: "STEP03 정상 기준 장치", sameInput: true, timeAxis: "0~3.3 s 동일 시간축", units: "%, Nm" },
    limitation: "최초 편차와 가설의 관련성을 시험하며, 이 결과 하나만으로 근본 원인을 자동 확정하지 않는다.",
    createdBy: "STEP03",
  },
```

- D-1 ID(13): VCT-0027-1, VCT-0028-1, VCT-0028-2, VCT-0028-3, VCT-0029-1, VCT-0029-2, VCT-0030-1, VCT-0032-1, VCT-0033-1, VCT-0034-1, VCT-0036-1, VCT-0036-2, VCT-0037-1

## LAB · VerificationLab.tsx · QUESTIONS/CASE_DERIVS/FIXES/LV_ANSWER/BEST_COST/ROOT_SIGNAL

- 대응 필드: S401, S403, S408, S409, S410
- 소스: `src/features/verification/VerificationLab.tsx` 라인 486~1111 (비연속 포함)

```ts
const FIXES: Record<CaseId, Fix[]> = {
  propulsion: [
    { label: "토크 지도 값을 2.2배로 키워 보상", img: "/assets/board-photos/torque_cmd.png", ok: false, why: "증상만 가리는 임시 조치예요. 다른 페달 위치에선 토크가 너무 커져서 새 고장이 생겨!" },
    { label: "끼어든 '보정 계수 ×0.45' 블록 제거", img: "/assets/board-photos/pedal_processed.png", ok: true, why: "원인(설계에 없는 블록)을 없애 기준 설계와 같게 만들었어요." },
    { label: "모터 최대 출력 한계 올리기", img: "/assets/ending-thumbs/traction_motor.png", ok: false, why: "모터 한계는 원인이 아니에요. 안전 여유만 줄어들어요." },
  ],
const CASE_DERIVS: Record<CaseId, { id: Deriv; tech: Tech; input: string }[]> = {
  propulsion: [
    { id: "reqa", tech: "req", input: "페달 60% 계단 입력 (요구사항 값)" },
    { id: "bound", tech: "boundary", input: "페달 100% (맵 최대 · 토크 한계 260 Nm)" },
    { id: "usecase", tech: "replay", input: "추월 구간 주행 기록 (0 → 60% 밟기)" },
  ],
const LV_ANSWER: Record<CaseId, { answer: Lv; why: string }> = {
  propulsion: { answer: "unit", why: "의심 구간이 VCU 안 SW 계산이에요. 그 SW 단위에 입력값을 인가하는 SW 단위 시험에서 바로 관찰할 수 있어요. 가장 싸고 빠른 레벨이에요." },
const BEST_COST: Record<CaseId, number> = { propulsion: 2, thermal: 10, brake: 10 };
const ROOT_SIGNAL: Record<CaseId, string> = { propulsion: "proc", thermal: "rpm", brake: "line" };
const QUESTIONS: Record<CaseId, { hyp: string; ask: string }[]> = {
  propulsion: [
    { hyp: "vcu_sw", ask: "VCU 안 계산 SW가 잘못된 거야?" },
    { hyp: "vcu_hw", ask: "아니면 VCU 입력 회로(신호 변환)가 문제야?" },
  ],
```

- D-1 ID(12): LAB-0488-1, LAB-0488-2, LAB-0489-1, LAB-0489-2, LAB-0490-1, LAB-0490-2, LAB-0585-1, LAB-0586-1, LAB-0587-1, LAB-0608-1, LAB-1109-1, LAB-1110-1

## PRED · VerificationLab.tsx · PREDICT (가설 id 키)

- 대응 필드: S402
- 소스: `src/features/verification/VerificationLab.tsx` 라인 1320~1322

```ts
const PREDICT: Record<string, string> = {
  vcu_sw: "VCU SW가 원인이라면: SW만 PC에서 돌려도 '페달 처리값'이 낮게 나와요. 제어기·차량 시험에서는 이 값이 안 보여서 SW인지 입력 회로인지 구별이 안 돼요.",
  vcu_hw: "입력 회로가 원인이라면: 입력 회로가 없는 'SW만 PC' 시험에서는 '페달 처리값'이 정상으로 나와요. 제어기·차량 시험에서는 이 값이 안 보여서 구별이 안 돼요.",
```

- D-1 ID(2): LAB-1321-1, LAB-1322-1

## SIM · simModel.ts · 모델 함수·VIEW·TIME

- 대응 필드: S404, S405, S406, S407
- 소스: `src/features/verification/simModel.ts` 라인 32~172 (비연속 포함)

```ts
function propulsion(tech: Tech, fault: boolean) {
  // req: 60 % step (requirement value) · boundary: 100 % step (top of the pedal map, torque limit 260 Nm) · replay: field ramp with driver wobble
  const pedal = (t: number) => tech === "replay" ? (t < .1 ? 0 : Math.min(60, (t - .1) * 150 + Math.sin(t * 9) * 1.2)) : t < .1 ? 0 : tech === "boundary" ? 100 : 60;
  return integrate(3, { filt: 0, ramp: 0, can: 0, mot: 0, v: 60 / 3.6, acc: 0, p: 0, proc: 0, req: 0, arb: 0 }, (s, t, dt) => {
    s.p = pedal(t);
    s.filt += (s.p - s.filt) * dt / .04;
    s.proc = s.filt * (fault ? .45 : 1);           // the fault: a calibration block that is not in the design
    s.req = 3.4 * s.proc;                           // pedal map: 60 % → 204 Nm
    s.arb = Math.min(s.req, 260);                   // available torque limit (BMS · temperature)
    s.ramp += clamp(s.arb - s.ramp, -600 * dt, 600 * dt);
    s.can += (Math.round(s.ramp) - s.can) * dt / .01;
    s.mot += (s.can - s.mot) * dt / .03;
    s.acc = s.mot * 9 / .33 / 1800 - .3;
    s.v += s.acc * dt;
  }, s => ({ aps: s.p, filt: s.filt, proc: s.proc, req: s.req, arb: s.arb, can: s.can, mot: s.mot, cur: s.mot * 1.5, pin: .5 + s.p / 100 * 4, acc: s.acc, spd: s.v * 3.6 }));
}

// ── 열관리: 열 부하 → 냉각수 온도 → (범위 검사 → 필터 → 히스테리시스 → PI) → PWM 출력단 → 팬 모터 → 냉각 ──
const VIEW: Record<CaseId, Record<Lv, Def[]>> = {
  propulsion: {
    unit: [
      { id: "aps", name: "입력값 인가 · 페달", unit: "%", max: 100, src: "aps" },
      { id: "filt", name: "입력 필터 출력", unit: "%", max: 100, src: "filt" },
      { id: "proc", name: "페달 처리값 (보정 후)", unit: "%", max: 100, src: "proc" },
      { id: "req", name: "페달 맵 · 토크 요청", unit: "Nm", max: 260, src: "req" },
    ],
    swint: [
      { id: "aps", name: "APS 입력 SWC 출력", unit: "%", max: 100, src: "filt" },
      { id: "proc", name: "토크 요청 SWC · 처리값", unit: "%", max: 100, src: "proc" },
      { id: "arb", name: "토크 중재(MIN) 출력", unit: "Nm", max: 260, src: "arb" },
      { id: "cansig", name: "통신 SWC · CAN 송신값", unit: "Nm", max: 260, src: "can" },
    ],
    embedded: [
      { id: "pin", name: "APS 핀 전압", unit: "V", max: 5, src: "pin" },
      { id: "can", name: "CAN 토크 명령 (버스)", unit: "Nm", max: 260, src: "can" },
      { id: "mot", name: "인버터 모델 · 모터 토크", unit: "Nm", max: 260, src: "mot" },
      { id: "cur", name: "모터 전류", unit: "A", max: 400, src: "cur" },
    ],
    vehicle: [
      { id: "aps", name: "페달 (로거)", unit: "%", max: 100, src: "aps" },
      { id: "can", name: "CAN 토크 (로거)", unit: "Nm", max: 260, src: "can" },
      { id: "acc", name: "차량 가속도", unit: "m/s²", max: 4, src: "acc" },
      { id: "spd", name: "차량 속도", unit: "km/h", max: 110, src: "spd" },
    ],
  },
const TIME: Record<CaseId, [number, string]> = { propulsion: [3, "s"], thermal: [8, "분(압축)"], brake: [3, "s"] };

/** Reference = healthy design, run = field fault (or the fixed design). Same input for both. */
```

- D-1 ID(24): SIM-0090-1, SIM-0091-1, SIM-0092-1, SIM-0093-1, SIM-0093-2, SIM-0096-1, SIM-0097-1, SIM-0098-1, SIM-0098-2, SIM-0099-1, SIM-0099-2, SIM-0102-1, SIM-0103-1, SIM-0103-2, SIM-0104-1, SIM-0104-2, SIM-0105-1, SIM-0108-1, SIM-0109-1, SIM-0109-2, SIM-0110-1, SIM-0110-2, SIM-0111-1, SIM-0170-1

## END · CaseFileEnding.tsx · CASE_VISUAL/CASE_SAFETY/SIGNAL_PATH/CATEGORY

- 대응 필드: M08, S501, S502, S503, S504, S505, S506
- 소스: `src/ui/CaseFileEnding.tsx` 라인 48~200 (비연속 포함)

```ts
const CASE_VISUAL: Record<CaseId, {
  propulsion: {
    chain: [
      { img: "accel_pedal", label: "가속 페달", role: "입력" },
      { img: "vcu", label: "VCU", role: "제어" },
      { img: "traction_motor", label: "구동 모터", role: "출력" },
    ],
    fault: { at: "link", index: 0, label: "신호 60%→27%" },
    meter: { label: "모터 토크", unit: "Nm", normal: 204, actual: 91, max: 220 },
    lesson: "입력 신호가 줄어든 채 전달되면, 출력도 그만큼 약해진다",
  },
const CASE_SAFETY: Record<CaseId, { hazard: string; detect: string; safeState: string; insight: string }> = {
  propulsion: {
    hazard: "의도보다 약한 구동력 → 합류·추월 중 가속 부족",
    detect: "APS 두 센서 비교(타당성 검사), 요청 토크 vs 실제 토크 감시",
    safeState: "토크 제한(비상 운전) + 경고등",
    insight: "두 센서가 같은 값을 주는 SW 보정 오류는 타당성 검사로 못 잡음 → 요구사항 기반 테스트가 필요한 '체계적 고장'",
  },
const SIGNAL_PATH: Record<CaseId, string> = {
  propulsion: "APS 원신호 → VCU 페달 처리 → CAN 토크 명령 → 모터 토크",
const CATEGORY: Record<CaseId, string> = {
  propulsion: "SW 계산·보정/스케일링",
```

- D-1 ID(16): END-0056-1, END-0056-2, END-0057-1, END-0057-2, END-0058-1, END-0058-2, END-0060-1, END-0061-1, END-0061-2, END-0062-1, END-0090-1, END-0091-1, END-0092-1, END-0093-1, END-0195-1, END-0200-1

## OBK · OpenBook.tsx · BOOK (차고 노트 카드)

- 대응 필드: S101, S102
- 소스: `src/ui/OpenBook.tsx` 라인 11~12

```ts
const BOOK: Record<CaseId, { domain: DomainId; feature: number; name: string; req: string }[]> = {
  propulsion: [{ domain: "drive", feature: 0, name: "구동 · 운전자 토크 요청", req: "가속 페달 0~100% → 토크 요청 0~340 Nm, 60%면 204 Nm. 배터리·온도 한계 260 Nm 이하. D단·READY일 때만." }],
```

- D-1 ID(2): OBK-0012-1, OBK-0012-2

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

- [도달] CHASE_NORMAL 추월 구간
- [실행 검증 필요] 위 블록의 동작은 실행하지 않음
