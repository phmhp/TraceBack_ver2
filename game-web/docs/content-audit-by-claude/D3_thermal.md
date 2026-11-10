# D-3 thermal — 기존 사건 완성 예시 (D-2 템플릿 적용)

- 원문은 **소스 그대로**(코드 블록 verbatim). 숫자·구조 포함. D-1 ID는 해당 블록 라인에 걸린 문자열 항목.
- 필드 ID는 `SCENARIO_AUTHORING_TEMPLATE.md`의 ID.
- 도달 상태: 일반 플레이 도달(필수 사건)

## SCN_S · scenarios.ts · SCENARIOS (레거시 사건 레지스트리)

- 대응 필드: M02, M03, M12, M14, S103, S201, S202, S203, S204, S219
- 소스: `src/game/scenarios.ts` 라인 13~50 (비연속 포함)

```ts
export const SCENARIOS: Record<CaseId, Scenario> = {
  thermal: {
    title: "장시간 고속 주행 후 출력 제한·경고등 점등",
    chapter: "사건 2 · 출력 제한",
    symptom: "고속으로 오래 달리자 파워다운 표시등이 켜지고 가속이 약해졌습니다.",
    root: "fan_actuator",
    repair: "팬 PWM 출력 어댑터 SW의 실행 순서 복원",
    evidence: [
      { id: "motor_temp", label: "온도 경고와 가속력 저하가 함께 발생함", value: "구동계 냉각수 온도 78.4°C", kind: "주행 현상" },
      { id: "thermal_protection", label: "구동 토크 제한 상태가 기록됨", value: "Derate flag ON", kind: "상태 계측" },
      { id: "fan_command", label: "Fan PWM 명령이 100%로 기록됨", value: "ECU 출력 명령 100%", kind: "제어 명령" },
      { id: "fan_actual", label: "팬 회전 피드백이 0 RPM으로 측정됨", value: "명령 100% · 실제 0 RPM", kind: "물리 응답" },
    ],
    hypotheses: [
      { id: "sensor", label: "온도 센서가 틀린 값을 보냈다", desc: "센서 측정 오류 가능성" },
      { id: "software_command", label: "팬 켜기 판단 로직이 잘못됐다", desc: "상태 전이 오류 가능성" },
      { id: "fan_actuator", label: "팬 요청을 PWM 출력으로 쓰는 SW가 실행되지 않았다", desc: "SW I/O 실행 순서 오류" },
    ],
  },
```

- D-1 ID(22): SCN-0034-1, SCN-0035-1, SCN-0036-1, SCN-0038-1, SCN-0040-1, SCN-0040-2, SCN-0040-3, SCN-0041-1, SCN-0041-2, SCN-0041-3, SCN-0042-1, SCN-0042-2, SCN-0042-3, SCN-0043-1, SCN-0043-2, SCN-0043-3, SCN-0046-1, SCN-0046-2, SCN-0047-1, SCN-0047-2, SCN-0048-1, SCN-0048-2

## SCN_M · scenarios.ts · SCENARIO_META (사건 설정·가설 규칙)

- 대응 필드: M04, M05, M06, M07, M09, M10, M11, M13, S104, S220, S221, S222
- 소스: `src/game/scenarios.ts` 라인 86~134 (비연속 포함)

```ts
export const SCENARIO_META: Record<CaseId, ScenarioMeta> = {
  thermal: {
    domain: "열관리",
    goal: "팬 요청은 정상인데 PWM 출력이 없을 때, SW 계산값과 I/O 어댑터 출력값을 비교해 실행 순서 오류를 분리한다.",
    trigger: "장거리 고속(연속 고부하) 구간에서 냉각수 온도 상승(레이스 CLIMB_ZONE)",
    injection: "Thermal ECU 출력 어댑터 SW가 주기 작업에서 누락되어 팬 요청을 PWM 레지스터에 쓰지 않음 (fanPwmOutputScale 0 · simModel pwmOut=0)",
    faultModel: "팬 요청 100% · PWM 출력 0% · 회전 0 rpm → 냉각수·모터 온도 상승 → 출력 제한",
    normalSpec: "냉각수 65°C 이상에서 팬 켜짐, 60°C 이하에서 꺼짐(히스테리시스), 켜지면 목표 1850 rpm으로 PI 제어",
    fix: "출력 어댑터 SW의 실행 순서 복원 후 배포",
    regression: "같은 임베디드 SW·I/O 시험 PASS + 영향 범위 신호(온도·출력 허용)",
    status: "implemented", review: "팬 요청은 정상·PWM 출력부터 FAIL인 SW I/O 경계 확인",
    hypotheses: [
      { id: "fan_sw", label: "Thermal ECU 출력 어댑터 SW 실행 순서", truth: true, rules: [
        { levels: ["embedded", "vehicle"], need: { pwm: ["lower"] }, verdict: "supported", why: "팬 요청 계산 뒤 I/O 어댑터 출력부터 0%예요. SW 실행 순서에서 처음 갈라져요." },
        { levels: ["vehicle"], need: { fpwm: ["lower"] }, verdict: "supported", why: "팬 요청은 정상인데 커넥터 PWM부터 출력되지 않아요." },
      ] },
      { id: "fan_path", label: "팬 켜기 상태 전이 SW", truth: false, rules: [
        { levels: SW, need: { duty: ["same"] }, verdict: "refuted", why: "히스테리시스와 PWM 요청 계산은 기준과 같아요." },
      ] },
      { id: "fan_motor", label: "팬 회전 피드백 처리 SW", truth: false, rules: [
        { levels: ["embedded", "vehicle"], need: { pwm: ["lower"] }, verdict: "refuted", why: "회전 피드백을 읽기 전 PWM 출력부터 없어요." },
        { levels: ["vehicle"], need: { fpwm: ["lower"] }, verdict: "refuted", why: "피드백 처리 문제가 아니라 팬으로 나가는 PWM부터 낮아요." },
      ] },
    ],
  },
```

- D-1 ID(17): SCN-0112-1, SCN-0113-1, SCN-0114-1, SCN-0115-1, SCN-0116-1, SCN-0117-1, SCN-0118-1, SCN-0119-1, SCN-0120-1, SCN-0122-1, SCN-0123-1, SCN-0124-1, SCN-0126-1, SCN-0127-1, SCN-0129-1, SCN-0130-1, SCN-0131-1

## DOT · DominoTrace.tsx · CASES (STEP02 도미노·의심 구간)

- 대응 필드: S205, S206, S207, S208, S209, S210, S211, S212, S213, S214, S215, S216, S217, S218
- 소스: `src/features/board/DominoTrace.tsx` 라인 50~120 (비연속 포함)

```ts
export const CASES: Record<CaseId, CaseData> = {
  thermal: {
    start: "accel", first: "fan_rpm", timeUnit: "초",
    req: "요구사항: 냉각수가 65°C를 넘으면 냉각 팬을 100%로 돌려야 한다.",
    doms: [
      { id: "accel", label: "차량 가속", img: CAR, zone: "차량", ref: 2.8, run: 1.9, unit: "m/s²", status: "bad", t: 72, causes: ["derate", "regen", "batt_out"] },
      { id: "derate", label: "출력 허용", img: B("thermal_protection"), zone: "제어기", ref: 100, run: 62, unit: "%", status: "bad", t: 70, causes: ["batt_out", "motor_temp", "bms_req"], ev: "thermal_protection" },
      { id: "motor_temp", label: "모터 온도", img: B("motor_temp"), zone: "부품", ref: 70, run: 96, unit: "°C", status: "bad", t: 55, causes: ["coolant", "inv_temp", "pump"] },
      { id: "coolant", label: "냉각수 온도", img: E("motor_temp_sensor"), zone: "센서", ref: 65, run: 78, unit: "°C", status: "bad", t: 40, causes: ["batt_temp", "coolant_lv", "fan_rpm"], ev: "motor_temp" },
      { id: "fan_rpm", label: "팬 PWM 출력 어댑터", img: B("fan_actual"), zone: "제어기", ref: 100, run: 0, unit: "%", status: "bad", t: 0, causes: ["fan_cmd", "air_temp", "pump"], ev: "fan_actual" },
      { id: "warn_lamp", label: "파워다운 표시등", img: ECU, zone: "차량", ref: "꺼짐", run: "켜짐", unit: "", status: "bad", t: 75 },
      { id: "batt_out", label: "배터리 출력", img: E("bms"), zone: "부품", ref: 160, run: 100, unit: "kW", status: "bad", t: 71 },
      { id: "inv_temp", label: "인버터 온도", img: E("mcu"), zone: "부품", ref: 60, run: 84, unit: "°C", status: "bad", t: 60 },
      { id: "batt_temp", label: "배터리 온도", img: E("bms"), zone: "센서", ref: 30, run: 41, unit: "°C", status: "bad", t: 50 },
      { ...OK("fan_cmd", "팬 명령 (Thermal ECU)", E("thermal_ecu"), "제어기", 100, "%"), ev: "fan_command" },
      OK("fan_pwm", "팬 커넥터 PWM 신호", ATLAS(5), "부품", 100, "%"),
      OK("fan_power", "팬 커넥터 전압", ATLAS(5), "부품", 12, "V"),
      OK("fan_block", "팬 걸림 (이물질)", E("radiator"), "부품", "없음", ""),
      OK("pump", "냉각수 펌프 유량", B("pump_flow"), "부품", 12, "L/min"),
      OK("bms_req", "BMS 출력 제한 요청", E("bms"), "제어기", "없음", ""),
      OK("coolant_lv", "냉각수 양", E("coolant_reservoir"), "부품", 100, "%"),
      OK("air_temp", "바깥 기온", SENSOR, "센서", 25, "°C", "tol", 26),
      OK("regen", "회생 제동", B("regen_request"), "제어기", 0, "%"),
    ],
    section: { name: "Thermal ECU 팬 요청→PWM 출력 SW 경계", choices: [
      { label: "팬 켜기 상태 전이 SW", ok: false, why: "팬 요청은 기준대로 100%였어요. 켜기 판단은 정상이에요." },
      { label: "Thermal ECU 팬 요청→PWM 출력 SW 경계", ok: true, why: "팬 요청은 100%인데 I/O 어댑터 출력은 0%예요. 어떤 SW 인터페이스 오류인지는 검증에서 가려요." },
      { label: "출력 제한(보호) SW", ok: false, why: "출력 제한은 온도가 오른 뒤에 달라졌어요. 시간상 결과 쪽이에요." },
    ] },
    zoom: {
      where: "Thermal ECU 출력 SW", kind: "sw",
      reference: [["팬 요청 계산", "100%"], ["주기 작업", "실행"], ["PWM 레지스터 쓰기", "100%"]],
      run: [["팬 요청 계산", "100%"], ["주기 작업", "누락"], ["PWM 레지스터 쓰기", "0%"]],
      culprit: "출력 어댑터 주기 작업 누락",
      lesson: "팬 요청 계산은 정상이지만 출력 어댑터 SW가 실행 순서에서 빠져 PWM 쓰기가 수행되지 않았어요.",
    },
  },
```

- D-1 ID(66): DOT-0086-1, DOT-0087-1, DOT-0089-1, DOT-0089-2, DOT-0089-3, DOT-0090-1, DOT-0090-2, DOT-0091-1, DOT-0091-2, DOT-0091-3, DOT-0092-1, DOT-0092-2, DOT-0092-3, DOT-0093-1, DOT-0093-2, DOT-0094-1, DOT-0094-2, DOT-0094-3, DOT-0094-4, DOT-0095-1, DOT-0095-2, DOT-0095-3, DOT-0096-1, DOT-0096-2, DOT-0096-3, DOT-0097-1, DOT-0097-2, DOT-0097-3, DOT-0098-1, DOT-0098-2, DOT-0099-1, DOT-0099-2, DOT-0100-1, DOT-0100-2, DOT-0101-1, DOT-0101-2, DOT-0101-3, DOT-0102-1, DOT-0102-2, DOT-0103-1, DOT-0103-2, DOT-0103-3, DOT-0104-1, DOT-0104-2, DOT-0105-1, DOT-0105-2, DOT-0106-1, DOT-0106-2, DOT-0108-1, DOT-0109-1, DOT-0109-2, DOT-0110-1, DOT-0110-2, DOT-0111-1, DOT-0111-2, DOT-0114-1, DOT-0115-1, DOT-0115-2, DOT-0115-3, DOT-0115-4, DOT-0116-1, DOT-0116-2, DOT-0116-3, DOT-0116-4, DOT-0117-1, DOT-0118-1

## EET · EeTrace.tsx · OBSERVED/REPLAY/LAMP/QUOTE/SUBSYS

- 대응 필드: S111, S112, S223, S224, S225
- 소스: `src/features/board/EeTrace.tsx` 라인 29~300 (비연속 포함)

```ts
const LAMP: Record<string, { label: string; note: string }> = {
  thermal: { label: "파워다운 표시등", note: "출력 제한 동작 중" },
const QUOTE: Record<string, string> = {
  thermal: "오래 밟고 달렸더니 경고등이 켜지고 힘이 빠졌어.",
const OBSERVED: Record<string, { icon: "detective" | "warning" | "clipboard" | "road"; label: string; value: string }[]> = {
  thermal: [{ icon: "detective", label: "운전자 체감", value: "고속 유지 중 힘 빠짐" }, { icon: "warning", label: "계기판", value: "파워다운 표시등" }, { icon: "clipboard", label: "주행 기록", value: "고속 연속 주행" }, { icon: "road", label: "바깥 기온", value: "25°C" }],
const REPLAY: Record<string, string> = { propulsion: "페달 60% 기록", thermal: "고속 연속 주행 기록", brake: "페달 55% 기록" };
const SUBSYS: Record<string, { where: string; inLabel: string; outLabel: string; stages: string[] }> = {
  thermal: { where: "팬 출력 SW 경계", inLabel: "팬 요청 100%", outLabel: "PWM 출력 0% (기준 100)", stages: ["팬 요청 계산", "실행 순서", "PWM 쓰기"] },
```

- D-1 ID(20): EET-0031-1, EET-0031-2, EET-0036-1, EET-0293-1, EET-0293-2, EET-0293-3, EET-0293-4, EET-0293-5, EET-0293-6, EET-0293-7, EET-0293-8, EET-0296-1, EET-0296-2, EET-0296-3, EET-0300-1, EET-0300-2, EET-0300-3, EET-0300-4, EET-0300-5, EET-0300-6

## DLG · experiences.tsx · FaultDialogue(DRIVER_LINE)

- 대응 필드: S109, S110
- 소스: `src/experiences.tsx` 라인 1966~1973 (비연속 포함)

```ts
export function FaultDialogue({ state, send }: { state: Campaign; send: Send }) {
    thermal: "오래 달렸더니 힘이 빠졌어! 계기판에 출력 제한 표시등이 켜졌어! 왜이러지?",
```

- D-1 ID(1): EXP-1973-1

## REF · RefPuzzle.tsx · REF·SCOPE (STEP03 퍼즐 보드)

- 대응 필드: S301, S302, S303, S304, S305, S306, S307, S308, S309
- 소스: `src/features/wiring/RefPuzzle.tsx` 라인 36~108 (비연속 포함)

```ts
const SCOPE: Record<CaseId, { unit: { name: string; ids: string[] }; swc: { name: string; ids: string[] }[] }> = {
  thermal: { unit: { name: "팬 제어 SWC", ids: ["hyst", "pi"] }, swc: [{ name: "온도 SWC", ids: ["range", "filter"] }, { name: "팬 제어 SWC", ids: ["hyst", "pi"] }] },
const REF: Record<CaseId, Ref> = {
  thermal: {
    domain: "열관리", feature: "냉각 팬 구동 경로", ecu: "Thermal ECU → 팬", program: "thermal_closed_loop",
    board: ["coolant", "range", "filter", "hyst", "pi", "driver", "fan"], gaps: [1, 3, 5],
    spares: ["hystB", "driver", "derate", "range", "hyst"], joints: ["tri", "tri", "tri", "zigzag", "wave", "wave"],
    side: { pieces: ["rpm"], into: 4, value: "실제 회전 1850 rpm", label: "팬 회전 피드백 (되돌아오는 값)" },
    req: [
      { text: "냉각수 온도를 잰다 (78°C)", slot: 0 },
      { text: "센서 값이 말이 되는 범위인지 확인한다", slot: 1 },
      { text: "잠깐 튀는 값은 걸러 낸다", slot: 2 },
      { text: "65°C를 넘으면 팬을 켠다 (끌 때는 60°C, 깜빡임 방지)", slot: 3 },
      { text: "실제 회전수를 보며 목표 1850 rpm이 되게 PWM을 계속 조절한다", slot: 4 },
      { text: "ECU 출력단이 PWM 신호와 12V 전원을 팬에 보낸다", slot: 5 },
      { text: "팬이 1850 rpm으로 돈다", slot: 6 },
    ],
    blocks: {
      coolant: { id: "coolant", label: "냉각수 온도 센서", kind: "hw", img: `${T}motor_temp_sensor.png`, out: "78°C", from: "열관리 · 온도 상태 만들기" },
      range: { id: "range", label: "범위 검사", kind: "check", out: "78°C ✓", from: "열관리 · 온도 상태 만들기" },
      filter: { id: "filter", label: "필터", kind: "delay", out: "78°C", from: "열관리 · 온도 상태 만들기" },
      hyst: { id: "hyst", label: "히스테리시스", tag: "표 A", spec: "설정값: 65°C 이상 켜짐, 60°C 이하 꺼짐", kind: "state", out: "팬 ON", from: "열관리 · 펌프·팬 제어" },
      hystB: { id: "hystB", label: "히스테리시스", tag: "표 B", spec: "설정값: 95°C 이상 켜짐, 90°C 이하 꺼짐", kind: "state", bad: "팬 OFF", from: "열관리 · 펌프·팬 제어",
        why: "실행 결과 팬 OFF예요. 요구사항은 '65°C를 넘으면 켠다'예요. 같은 '히스테리시스'라도 켜는 기준값이 달라요." },
      pi: { id: "pi", label: "PI 제어", kind: "pi", out: "PWM 68%", from: "열관리 · 펌프·팬 제어" },
      derate: { id: "derate", label: "단계 임계", kind: "switch", from: "열관리 · 출력 제한(보호)",
        why: "'단계 임계'는 온도가 높을 때 구동 출력을 줄이는 보호 기능 블록이에요. 팬을 돌리는 경로에는 없어요." },
      driver: { id: "driver", label: "팬 구동 출력단 · 전원", kind: "hw", ee: true, img: `${T}thermal_ecu.png`, out: "PWM 68% · 12V", from: "열관리 · 펌프·팬 제어 (E/E)" },
      fan: { id: "fan", label: "냉각 팬 모터", kind: "hw", img: `${T}cooling_fan.png`, out: "1850 rpm", from: "열관리 · 펌프·팬 제어" },
      rpm: { id: "rpm", label: "팬 회전 피드백", kind: "hw", img: "/assets/ASSET_090_Input_Sensor_Node.png", out: "실제 1850 rpm", from: "열관리 · 펌프·팬 제어" },
    },
    notes: [{ domain: "thermal", feature: 1, name: "열관리 · 펌프·팬 제어" }, { domain: "thermal", feature: 0, name: "열관리 · 온도 상태 만들기" }],
    field: { pi: "PWM 100%", driver: "PWM 100% · 12V", fan: "0 rpm" },
  },
```

- D-1 ID(46): REF-0038-1, REF-0038-2, REF-0038-3, REF-0079-1, REF-0079-2, REF-0079-3, REF-0082-1, REF-0082-2, REF-0084-1, REF-0085-1, REF-0086-1, REF-0087-1, REF-0088-1, REF-0089-1, REF-0090-1, REF-0093-1, REF-0093-2, REF-0094-1, REF-0094-2, REF-0095-1, REF-0095-2, REF-0096-1, REF-0096-2, REF-0096-3, REF-0096-4, REF-0096-5, REF-0097-1, REF-0097-2, REF-0097-3, REF-0097-4, REF-0097-5, REF-0098-1, REF-0099-1, REF-0099-2, REF-0100-1, REF-0100-2, REF-0101-1, REF-0102-1, REF-0102-2, REF-0103-1, REF-0103-2, REF-0104-1, REF-0104-2, REF-0104-3, REF-0106-1, REF-0106-2

## REF2 · RefPuzzle.tsx · WHY·RIG_GOAL·SPEC·ACTUATOR

- 대응 필드: S310, S311, S312, S313, S314, S315
- 소스: `src/features/wiring/RefPuzzle.tsx` 라인 387~420 (비연속 포함)

```ts
const WHY: Record<CaseId, string> = {
  thermal: "냉각수가 뜨거워지면 팬을 돌려 구동계 온도를 지키기 위해서예요.",
const ACTUATOR: Record<CaseId, { id: string; ok: string; weak: string }> = {
  thermal: { id: "cooling_fan", ok: "팬 1850 rpm · 정상 냉각", weak: "팬이 켜지지 않아요 · 온도 상승" },
const RIG_GOAL: Record<CaseId, string> = {
  thermal: "팬 요청 계산 SW인지, PWM 출력 어댑터 SW인지",
const SPEC: Record<CaseId, { text: string; input?: { label: string; unit: string; min: number; max: number; at: number }; expect: string }> = {
  thermal: { text: "냉각수 65°C 이상 팬 켜짐 · 60°C 이하 꺼짐 · 켜지면 실제 회전을 보며 목표 1850 rpm으로 PWM 조절 · 출력단이 PWM과 12V를 팬에 공급",
    input: { label: "냉각수 온도", unit: "°C", min: 40, max: 100, at: 78 }, expect: "냉각수 78°C → 팬 켜짐 → 팬 1850 rpm" },
```

- D-1 ID(8): REF-0389-1, REF-0395-1, REF-0395-2, REF-0413-1, REF-0419-1, REF-0420-1, REF-0420-2, REF-0420-3

## VCT · verificationContract.ts · BASE (시험 계약)

- 대응 필드: S317, S318, S319, S320, S321, S322, S323
- 소스: `src/game/verificationContract.ts` 라인 23~55 (비연속 포함)

```ts
const BASE: Record<CaseId, ContractBase> = {
  thermal: {
    version: 1,
    caseId: "thermal",
    objective: "팬 요청 계산 SW와 PWM 출력 어댑터 SW의 실행 순서를 같은 열부하에서 구분한다.",
    preconditions: ["READY", "냉각팬 OFF", "냉각수 62°C", "차량 정차"],
    stimulus: { label: "사건 열부하", sequence: "냉각수 65.1→78.4°C / 8 s" },
    expectedSignal: "팬 명령과 실제 회전",
    observations: [
      { id: "input", label: "냉각수 온도" },
      { id: "control", label: "팬 PWM 명령" },
      { id: "output", label: "팬 실제 RPM" },
    ],
    comparison: { baseline: "STEP03 정상 기준 장치", sameInput: true, timeAxis: "0~8 s 동일 시간축", units: "°C, %, rpm" },
    limitation: "SW 계산값과 I/O 출력값의 경계를 구분하며, 관찰하지 않은 HW 고장을 원인으로 만들지 않는다.",
    createdBy: "STEP03",
  },
```

- D-1 ID(13): VCT-0043-1, VCT-0044-1, VCT-0044-2, VCT-0044-3, VCT-0045-1, VCT-0045-2, VCT-0046-1, VCT-0048-1, VCT-0049-1, VCT-0050-1, VCT-0052-1, VCT-0052-2, VCT-0053-1

## LAB · VerificationLab.tsx · QUESTIONS/CASE_DERIVS/FIXES/LV_ANSWER/BEST_COST/ROOT_SIGNAL

- 대응 필드: S401, S403, S408, S409, S410
- 소스: `src/features/verification/VerificationLab.tsx` 라인 486~1116 (비연속 포함)

```ts
const FIXES: Record<CaseId, Fix[]> = {
  thermal: [
    { label: "팬 요청을 항상 100%로 고정", img: "/assets/ending-thumbs/thermal_ecu.png", ok: false, why: "팬 요청 계산은 이미 100%였어요. I/O 출력 누락은 고쳐지지 않아요." },
    { label: "출력 제한(보호) 기능 끄기", img: "/assets/board-photos/thermal_protection.png", ok: false, why: "보호 기능은 고장이 아니라 과열을 막아 준 거야. 끄면 모터가 손상돼." },
    { label: "PWM 출력 어댑터 주기 작업 복원", img: "/assets/ending-thumbs/thermal_ecu.png", ok: true, why: "팬 요청 뒤 빠져 있던 SW 실행 순서를 복원해 PWM 쓰기가 다시 수행돼요." },
  ],
const CASE_DERIVS: Record<CaseId, { id: Deriv; tech: Tech; input: string }[]> = {
  thermal: [
    { id: "reqa", tech: "req", input: "열 부하 높임 → 낮춤 (65°C 켜짐 · 60°C 꺼짐)" },
    { id: "usecase", tech: "soak", input: "장거리 고속 주행 열 부하 (사건 조건)" },
  ],
const LV_ANSWER: Record<CaseId, { answer: Lv; why: string }> = {
  thermal: { answer: "embedded", why: "의심 구간이 PWM 출력 어댑터 SW예요. 통합 SW·제어기 I/O 시험에서 요청값과 실제 출력값을 함께 보면 가장 먼저 잡을 수 있어요." },
const BEST_COST: Record<CaseId, number> = { propulsion: 2, thermal: 10, brake: 10 };
const ROOT_SIGNAL: Record<CaseId, string> = { propulsion: "proc", thermal: "rpm", brake: "line" };
const QUESTIONS: Record<CaseId, { hyp: string; ask: string }[]> = {
  thermal: [
    { hyp: "fan_sw", ask: "PWM 출력 어댑터 SW의 실행 순서가 빠진 거야?" },
    { hyp: "fan_path", ask: "팬 켜기 상태 전이 SW가 잘못된 거야?" },
    { hyp: "fan_motor", ask: "팬 회전 피드백 처리 SW가 잘못된 거야?" },
  ],
```

- D-1 ID(12): LAB-0493-1, LAB-0493-2, LAB-0494-1, LAB-0494-2, LAB-0495-1, LAB-0495-2, LAB-0590-1, LAB-0591-1, LAB-0609-1, LAB-1113-1, LAB-1114-1, LAB-1115-1

## PRED · VerificationLab.tsx · PREDICT (가설 id 키)

- 대응 필드: S402
- 소스: `src/features/verification/VerificationLab.tsx` 라인 1320~1325 (비연속 포함)

```ts
const PREDICT: Record<string, string> = {
  fan_sw: "출력 어댑터 실행 순서가 원인이라면: 팬 요청 계산은 정상이지만 임베디드 I/O 시험의 'PWM 출력값'부터 0이어야 해요.",
  fan_path: "상태 전이 SW가 원인이라면: SW 시험의 팬 요청 또는 PWM 계산값부터 기준과 달라야 해요.",
  fan_motor: "피드백 처리 SW가 원인이라면: PWM 출력은 정상이고 읽어 온 회전값만 기준과 달라야 해요.",
```

- D-1 ID(3): LAB-1323-1, LAB-1324-1, LAB-1325-1

## SIM · simModel.ts · 모델 함수·VIEW·TIME

- 대응 필드: S404, S405, S406, S407
- 소스: `src/features/verification/simModel.ts` 라인 50~172 (비연속 포함)

```ts
function thermal(tech: Tech, fault: boolean) {
  const heat = tech === "soak" || tech === "replay" ? 57 : 50; // a short requirement pulse heats less
  return integrate(8, { tc: 64, tf: 64, on: 0, int: 0, duty: 0, rpm: 0, tm: 70, der: 100 }, (s, t, dt) => {
    const load = tech === "req" && t > 2 ? 30 : heat;
    s.tc += (load - (1 + .267 * s.rpm / 1850) * (s.tc - 25)) / 3 * dt;
    s.tf += (s.tc - s.tf) * dt / .2;
    if (s.tf > 65) s.on = 1; else if (s.tf < 60) s.on = 0;    // hysteresis 65 / 60 °C
    const e = s.on ? 1850 - s.rpm : 0;
    s.int = s.on ? clamp(s.int + e * dt * .004, -40, 40) : 0;
    s.duty = s.on ? clamp(60 + .002 * e + s.int, 0, 100) : 0;   // PI on the measured fan speed
    const pwmOut = s.duty * (fault ? 0 : 1);                    // fault: output-adapter SW skips the PWM write
    const target = pwmOut / 68 * 1850;
    s.rpm += (target - s.rpm) * dt / .3;
    s.tm += ((70 + 2.6 * (s.tc - 70)) - s.tm) * dt / 1.5;
    s.der += ((s.tm > 90 ? 60 : 100) - s.der) * dt / .4;
  }, s => ({ tc: s.tc, tf: s.tf, fanReq: s.on * 100, duty: s.duty, pwmOut: s.duty * (fault ? 0 : 1), pinV: 4.5 - s.tc * .03, supply: 12, rpm: s.rpm, diag: 0, tm: s.tm, der: s.der, acc: 2.8 * s.der / 100 }));
}

// ── 제동: 페달 → (요구 → 회생 MIN → 잔여력 → 마찰 압력) → 밸브 → 유압 라인 → 캘리퍼 → 차량 감속 ──
const VIEW: Record<CaseId, Record<Lv, Def[]>> = {
  thermal: {
    unit: [
      { id: "tin", name: "입력값 인가 · 냉각수 온도", unit: "°C", max: 100, src: "tc", model: true },
      { id: "tf", name: "필터 출력", unit: "°C", max: 100, src: "tf", model: true },
      { id: "req", name: "히스테리시스 · 팬 요청", unit: "%", max: 110, src: "fanReq", model: true },
      { id: "duty", name: "PI 출력 PWM 비율", unit: "%", max: 110, src: "duty", model: true },
    ],
    swint: [
      { id: "temp", name: "온도 SWC 출력", unit: "°C", max: 100, src: "tf", model: true },
      { id: "req", name: "팬 요청 SWC", unit: "%", max: 110, src: "fanReq", model: true },
      { id: "duty", name: "PWM 서비스 비율", unit: "%", max: 110, src: "duty", model: true },
      { id: "rpmModel", name: "팬 모델 회전", unit: "rpm", max: 2100, src: "rpm", model: true },
    ],
    embedded: [
      { id: "pinV", name: "온도 센서 핀 전압", unit: "V", max: 5, src: "pinV", model: true },
      { id: "pwm", name: "PWM 출력 어댑터 값", unit: "%", max: 110, src: "pwmOut" },
      { id: "supply", name: "팬 전원 전압", unit: "V", max: 14, src: "supply", model: true },
      { id: "rpm", name: "팬 부하 모델 회전", unit: "rpm", max: 2100, src: "rpm" },
    ],
    vehicle: [
      { id: "fpwm", name: "팬 커넥터 PWM", unit: "%", max: 110, src: "pwmOut" },
      { id: "fv", name: "팬 커넥터 전원 전압", unit: "V", max: 14, src: "supply" },
      { id: "rpm", name: "팬 실제 회전 (실부품 연결)", unit: "rpm", max: 2100, src: "rpm" },
      { id: "tc", name: "냉각수 온도", unit: "°C", max: 100, src: "tc" },
      { id: "tm", name: "모터 온도", unit: "°C", max: 110, src: "tm" },
      { id: "der", name: "출력 허용", unit: "%", max: 110, src: "der" },
    ],
  },
const TIME: Record<CaseId, [number, string]> = { propulsion: [3, "s"], thermal: [8, "분(압축)"], brake: [3, "s"] };

/** Reference = healthy design, run = field fault (or the fixed design). Same input for both. */
```

- D-1 ID(24): SIM-0116-1, SIM-0116-2, SIM-0117-1, SIM-0117-2, SIM-0118-1, SIM-0119-1, SIM-0122-1, SIM-0122-2, SIM-0123-1, SIM-0124-1, SIM-0125-1, SIM-0128-1, SIM-0129-1, SIM-0130-1, SIM-0131-1, SIM-0134-1, SIM-0135-1, SIM-0136-1, SIM-0137-1, SIM-0137-2, SIM-0138-1, SIM-0138-2, SIM-0139-1, SIM-0170-1

## END · CaseFileEnding.tsx · CASE_VISUAL/CASE_SAFETY/SIGNAL_PATH/CATEGORY

- 대응 필드: M08, S501, S502, S503, S504, S505, S506
- 소스: `src/ui/CaseFileEnding.tsx` 라인 48~201 (비연속 포함)

```ts
const CASE_VISUAL: Record<CaseId, {
  thermal: {
    chain: [
      { img: "motor_temp_sensor", label: "온도 센서", role: "입력" },
      { img: "thermal_ecu", label: "Thermal ECU", role: "제어" },
      { img: "cooling_fan", label: "냉각 팬", role: "출력" },
    ],
    fault: { at: "node", index: 1, label: "PWM 출력 SW 0%" },
    meter: { label: "팬 응답 (명령 대비)", unit: "%", normal: 100, actual: 0, max: 100 },
    lesson: "팬 요청은 정상인데 PWM 출력 SW부터 0% → 출력 어댑터 실행 순서를 확인",
  },
const CASE_SAFETY: Record<CaseId, { hazard: string; detect: string; safeState: string; insight: string }> = {
  thermal: {
    hazard: "과열로 부품 손상, 주행 중 급격한 출력 상실",
    detect: "냉각수 온도 감시, 팬 명령 vs 회전 피드백 비교",
    safeState: "단계적 출력 제한(파워다운) + 경고등",
    insight: "갑자기 끄지 않고 단계적으로 줄이는 것 자체가 운전자를 위한 안전 설계",
  },
const SIGNAL_PATH: Record<CaseId, string> = {
  thermal: "냉각수 온도 → Thermal ECU 팬 요청 → PWM 출력 어댑터 → 팬 회전 → 온도·출력 제한",
const CATEGORY: Record<CaseId, string> = {
  thermal: "SW 주기·타이밍 / 제어기 I/O 처리",
```

- D-1 ID(15): END-0066-1, END-0066-2, END-0067-1, END-0067-2, END-0068-1, END-0068-2, END-0070-1, END-0071-1, END-0072-1, END-0096-1, END-0097-1, END-0098-1, END-0099-1, END-0196-1, END-0201-1

## OBK · OpenBook.tsx · BOOK (차고 노트 카드)

- 대응 필드: S101, S102
- 소스: `src/ui/OpenBook.tsx` 라인 11~16 (비연속 포함)

```ts
const BOOK: Record<CaseId, { domain: DomainId; feature: number; name: string; req: string }[]> = {
  thermal: [
    { domain: "thermal", feature: 1, name: "열관리 · 펌프·팬 제어", req: "냉각수 65°C 이상이면 팬 켜짐, 60°C 이하면 꺼짐. 켜지면 목표 1850 rpm으로 PWM 조절." },
    { domain: "thermal", feature: 3, name: "열관리 · 열 한계 출력 제한", req: "구동계가 너무 뜨거우면 보호를 위해 구동 출력을 줄여요(파워다운 표시등)." },
  ],
```

- D-1 ID(4): OBK-0014-1, OBK-0014-2, OBK-0015-1, OBK-0015-2

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

- [도달 조건] propulsion 수리 완료 후 `CHASE_RESUME`에서만 발동
- [실행 검증 필요] 위 블록의 동작은 실행하지 않음
