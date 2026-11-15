// "정상 기준 만들기" v2 — the reference is assembled from the SAME Control SW blocks the player
// saw in the garage (same picto, same tag, same plain words), so the moment reads "아, 정비소에서 본 거!".
// - Any piece fits any gap (shape = signal type of the board, never a hint about which piece goes where).
// - Placing a piece draws nothing and shows no value. The player checks the build by pressing ▶ 실행:
//   values flow left → right and stop at the first slot that breaks the requirement (first mismatch).
// - Parallel logic: a side input (limit / other sensors) climbs into the merge block.
// - 정비소 노트 = open book: re-open the garage Control SW drawing (costs a hint).
import { numify } from "../../ui/numify";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Campaign, CaseId } from "../../game/runtime";
import { GameHeader, SceneBackdrop, StageFolderSubtitle } from "../../ui/game-shell";
import { useReportSubStep } from "../../ui/stepRoadmap";
import { useDevActions } from "../../ui/dev/devActions";
import { play } from "../../ui/sfx";
import { KIND_TAG, Picto, blockKind, plainText, type Kind } from "../garage/SimulinkDiagram";
import { PursuitRouteBar, getFeatureLayer, piecePath, type DomainId, type Nub } from "../../experiences";
import { ENGINEER } from "../../game/cast";
import { Icon } from "../../ui/Icon";
import { StageIntro, showVerdict } from "../../ui/Verdict";
import { Canvas } from "@react-three/fiber";
import { PartModel } from "../parts/PartModel";
import { SCENARIOS, SCENARIO_META } from "../../game/scenarios";
import { buildVerificationContract, contractSignalLabel, contractStorageKey, type VerificationContract } from "../../game/verificationContract";
import { ReplayConfirm } from "../../ui/ReplayConfirm";
import { MissionBar } from "../../ui/MissionBar";
import { OpenBookButton, OpenBookModal } from "../../ui/OpenBook";
import { Directive } from "../../ui/Directive";
import "./puzzle-v3.css";

type Send = React.Dispatch<any>;
type Blk = { id: string; label: string; kind: Kind | "hw"; ee?: boolean; spec?: string; img?: string; tag?: string; out?: string; bad?: string; why?: string; from: string; does?: string };
type Ref = {
  domain: string; feature: string; ecu: string; program: string;
  board: string[]; gaps: number[]; spares: string[]; joints: Nub[];
  side: { pieces: string[]; into: number; value: string; label: string };
  req: { text: string; slot: number }[];
  blocks: Record<string, Blk>;
  notes: { domain: DomainId; feature: number; name: string }[];
  field: Record<string, string>; // values recorded in the faulty drive (only where they differ from the reference)
};
// bench views: the SW unit under test, and the SW components (SWC) that make up the ECU software
const SCOPE: Record<CaseId, { unit: { name: string; ids: string[] }; swc: { name: string; ids: string[] }[] }> = {
  propulsion: { unit: { name: "토크 요청 SWC", ids: ["filter", "map", "permit"] }, swc: [{ name: "APS 입력 SWC", ids: ["corr", "filter"] }, { name: "토크 요청 SWC", ids: ["map", "permit"] }, { name: "토크 중재 SWC", ids: ["min", "ramp"] }, { name: "통신 SWC", ids: ["out"] }] },
  thermal: { unit: { name: "팬 제어 SWC", ids: ["hyst", "pi"] }, swc: [{ name: "온도 SWC", ids: ["range", "filter"] }, { name: "팬 제어 SWC", ids: ["hyst", "pi"] }] },
  brake: { unit: { name: "제동 배분 SWC", ids: ["rmin", "rest", "press"] }, swc: [{ name: "제동 요구 SWC", ids: ["recv"] }, { name: "제동 배분 SWC", ids: ["rmin", "rest", "press"] }] },
  ready: { unit: { name: "프리차지 시퀀스 SWC", ids: ["pre", "wait", "main"] }, swc: [{ name: "시동 조건 SWC", ids: ["cond"] }, { name: "프리차지 시퀀스 SWC", ids: ["pre", "wait", "main"] }] },
  gear: { unit: { name: "변속 수신 SWC", ids: ["rx", "cmd"] }, swc: [{ name: "변속 수신 SWC", ids: ["rx"] }, { name: "토크 요청 SWC", ids: ["cmd"] }] },
  regen: { unit: { name: "토크 지령 SWC", ids: ["sign", "rlim", "ramp"] }, swc: [{ name: "회생 요청 수신 SWC", ids: ["rrecv"] }, { name: "토크 지령 SWC", ids: ["sign", "rlim", "ramp"] }, { name: "통신 SWC", ids: ["out"] }] },
};

const T = "/assets/ending-thumbs/", P = "/assets/board-photos/";
const REF: Record<CaseId, Ref> = {
  propulsion: {
    domain: "구동", feature: "페달 → 토크 요청", ecu: "VCU", program: "nominal",
    board: ["aps", "corr", "filter", "map", "permit", "min", "ramp", "out", "inv"], gaps: [3, 5, 6],
    spares: ["ramp", "mapB", "min", "est", "map"], joints: ["round", "round", "round", "square", "square", "square", "square", "zigzag"],
    side: { pieces: ["bms"], into: 5, value: "한계 260 Nm", label: "BMS가 보내는 토크 한계" },
    req: [
      { text: "가속 페달 센서 A·B가 페달 위치를 읽는다 (유효 범위 0~100%, 이번 시나리오 입력 60%)", slot: 0 },
      { text: "두 센서 값의 차이가 허용 범위 안인지 먼저 확인한다", slot: 1 },
      { text: "순간적으로 튀는 값은 필터로 걸러 낸다", slot: 2 },
      { text: "페달 맵으로 페달 위치를 토크 요청으로 바꾼다 (60% → 204 Nm)", slot: 3 },
      { text: "D단이고 READY일 때만 토크 요청을 통과시킨다", slot: 4 },
      { text: "BMS·온도 한계(260 Nm)보다 크면 한계값으로 제한한다", slot: 5 },
      { text: "토크 요청을 정해진 기울기로 천천히 올린다", slot: 6 },
      { text: "CAN으로 인버터에 보내 모터가 204 Nm를 낸다", slot: 8 },
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
  thermal: {
    domain: "열관리", feature: "냉각 팬 구동 경로", ecu: "Thermal ECU → 팬", program: "thermal_closed_loop",
    board: ["coolant", "range", "filter", "hyst", "pi", "driver", "fan"], gaps: [1, 3, 5],
    spares: ["hystB", "driver", "derate", "range", "hyst"], joints: ["tri", "tri", "tri", "zigzag", "wave", "wave"],
    side: { pieces: ["rpm"], into: 4, value: "실제 회전 1850 rpm", label: "팬 회전 피드백 (되돌아오는 값)" },
    req: [
      { text: "냉각수 온도 센서가 온도를 읽는다 (이번 시나리오 입력 78°C)", slot: 0 },
      { text: "센서 값이 물리적으로 가능한 범위인지 확인한다", slot: 1 },
      { text: "순간적으로 튀는 값은 필터로 걸러 낸다", slot: 2 },
      { text: "65°C 이상이면 팬을 켜고 60°C 이하가 되면 끈다 (켜고 끄는 기준을 달리해 깜빡임 방지)", slot: 3 },
      { text: "실제 회전수를 피드백 받아 목표 1850 rpm이 되도록 PWM을 계속 조절한다", slot: 4 },
      { text: "ECU 출력단이 PWM 신호와 12V 전원을 팬에 공급한다", slot: 5 },
      { text: "팬이 1850 rpm으로 회전한다", slot: 6 },
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
  brake: {
    domain: "제동", feature: "회생 + 마찰 협조 → 유압 경로", ecu: "Brake ECU → 유압", program: "blended_brake",
    board: ["pedal", "recv", "rmin", "rest", "press", "hmod", "caliper"], gaps: [1, 4, 5],
    spares: ["hmod", "slip", "press", "pressB", "recv"], joints: ["round", "square", "square", "square", "tri", "tri"],
    side: { pieces: ["bms", "avail"], into: 2, value: "회생 가능 1.1 m/s²", label: "BMS가 보내는 회생 가용량" },
    req: [
      { text: "브레이크 페달 센서가 페달 위치를 읽는다 (이번 시나리오 입력 55%)", slot: 0 },
      { text: "Brake ECU가 목표 감속 3.2 m/s²를 받는다", slot: 1 },
      { text: "회생 제동은 배터리가 받을 수 있는 만큼만 쓴다 (이번 조건 1.1 m/s²)", slot: 2 },
      { text: "부족한 감속은 마찰 제동이 채운다 (3.2 − 1.1 = 2.1 m/s²)", slot: 3 },
      { text: "마찰 몫 2.1 m/s²를 브레이크 압력 42 bar로 바꾼다", slot: 4 },
      { text: "유압 모듈이 명령대로 라인 압력 42 bar를 만든다", slot: 5 },
      { text: "캘리퍼가 바퀴를 잡아 회생과 합쳐 3.2 m/s²로 감속한다", slot: 6 },
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
  regen: {
    domain: "구동", feature: "회생 요청 → 토크 지령", ecu: "VCU", program: "regen_sign_applied",
    board: ["bpe", "rrecv", "sign", "rlim", "ramp", "out", "inv"], gaps: [2, 3],
    spares: ["signB", "pedmap", "rlim", "sign", "avg"], joints: ["round", "square", "square", "square", "zigzag", "wave"],
    side: { pieces: ["bms"], into: 3, value: "회생 한계 60 Nm", label: "BMS가 보내는 회생 가용 한계" },
    req: [
      { text: "Brake ECU가 감속 목표를 회생 요청으로 계산해 CAN으로 보낸다 (이번 시나리오 −40 Nm)", slot: 0 },
      { text: "VCU가 회생 요청을 수신한다", slot: 1 },
      { text: "회생 요청의 부호(음수 = 감속 방향)를 인터페이스 정의대로 반영한다", slot: 2 },
      { text: "회생 크기는 BMS가 허용하는 한계(60 Nm)를 넘지 않게 제한한다", slot: 3 },
      { text: "토크 지령의 변화 속도는 램프율로 제한한다", slot: 4 },
      { text: "토크 지령을 CAN으로 인버터에 보낸다 (−40 Nm)", slot: 5 },
      { text: "인버터가 −40 Nm 회생 토크를 만들어 평지에서 −0.5 m/s²로 감속한다", slot: 6 },
    ],
    blocks: {
      bpe: { id: "bpe", label: "Brake ECU 회생 요청", kind: "hw", ee: true, img: `${T}brake_ecu.png`, out: "회생 요청 −40 Nm", from: "제동 · 회생·마찰 협조" },
      rrecv: { id: "rrecv", label: "회생 요청 수신", kind: "calc", out: "−40 Nm", from: "구동 · 토크 배분·제한" },
      sign: { id: "sign", label: "부호 규약", tag: "표 A", spec: "표 값: 회생 요청 음수 → 토크 지령 음수 (감속)", kind: "lut", out: "−40 Nm", from: "구동 · 토크 배분·제한" },
      signB: { id: "signB", label: "부호 규약", tag: "표 B", spec: "표 값: 회생 요청 음수 → 토크 지령 양수", kind: "lut", bad: "+40 Nm", from: "구동 · 토크 배분·제한",
        why: "실행 결과 +40 Nm예요. 요구사항은 '회생 요청과 같은 방향(−40 Nm)'이에요. 같은 '부호 규약'이라도 표 값이 달라요." },
      rlim: { id: "rlim", label: "가용 회생 한계", kind: "min", out: "−40 Nm", from: "구동 · 토크 배분·제한" },
      pedmap: { id: "pedmap", label: "페달 맵", kind: "lut", from: "구동 · 운전자 토크 요청",
        why: "'페달 맵'은 가속 페달 위치를 토크 요청으로 바꾸는 블록이에요. 페달이 0%인 코스팅 회생 경로에는 없어요." },
      avg: { id: "avg", label: "평균 필터", kind: "delay", from: "구동 · 토크 배분·제한",
        why: "'평균 필터'는 요구사항에 없는 처리예요. 회생 요청을 그대로 부호·한계 처리하는 경로에는 들어가지 않아요." },
      ramp: { id: "ramp", label: "램프율", kind: "delay", out: "−40 Nm ↘", from: "구동 · 토크 배분·제한" },
      out: { id: "out", label: "토크 지령 출력", kind: "calc", out: "CAN −40 Nm", from: "구동 · 토크 배분·제한" },
      inv: { id: "inv", label: "인버터 · 전륜 모터", kind: "hw", img: `${T}traction_motor.png`, out: "회생 −40 Nm · −0.5 m/s² ✓", from: "구동 · 토크 배분·제한" },
      bms: { id: "bms", label: "BMS 회생 수용량", kind: "hw", img: `${T}bms.png`, out: "회생 한계 60 Nm", from: "제동 · 회생·마찰 협조" },
    },
    notes: [{ domain: "drive", feature: 2, name: "구동 · 토크 배분·제한" }, { domain: "brake", feature: 1, name: "제동 · 회생·마찰 협조" }],
    field: { sign: "+40 Nm", rlim: "+40 Nm", ramp: "+40 Nm ↗", out: "CAN +40 Nm", inv: "모터 +40 Nm · +0.5 m/s²" },
  },
  ready: {
    domain: "고전압 전원", feature: "시동 요청 → 프리차지 → READY", ecu: "VCU", program: "precharge_timeout_1500",
    board: ["req", "cond", "pre", "wait", "main", "ready"], gaps: [3, 4],
    spares: ["weld", "waitB", "lock", "main", "wait"], joints: ["round", "square", "square", "tri", "tri"],
    side: { pieces: ["bms"], into: 3, value: "시동 허용 1", label: "BMS가 보내는 시동 허용" },
    req: [
      { text: "브레이크를 밟고 시동 버튼을 누르면 시동 요청이 VCU로 들어온다", slot: 0 },
      { text: "VCU가 시동 조건(브레이크 ON · BMS 허용)을 확인한다", slot: 1 },
      { text: "조건이 맞으면 프리차지 접촉기를 닫아 인버터 커패시터를 먼저 충전한다", slot: 2 },
      { text: "버스 전압이 팩 전압의 95 %(380 V)에 닿을 때까지 기다린다. 대기 시간은 1500 ms이다", slot: 3 },
      { text: "95 %에 닿으면 주 접촉기를 닫는다", slot: 4 },
      { text: "READY로 전환되고 고전압이 연결된다", slot: 5 },
    ],
    blocks: {
      req: { id: "req", label: "시동 요청 · 브레이크", kind: "hw", img: `${T}brake_pedal.png`, out: "시동 1 · 브레이크 ON", from: "고전압 전원 · 프리차지·접촉기" },
      cond: { id: "cond", label: "시동 조건 확인", kind: "check", out: "허용 ✓", from: "고전압 전원 · 프리차지·접촉기" },
      pre: { id: "pre", label: "프리차지 접촉기 닫기", kind: "state", out: "충전 시작", from: "고전압 전원 · 프리차지·접촉기" },
      wait: { id: "wait", label: "프리차지 대기", tag: "표 A", spec: "설정값: 버스 95 % 도달까지 대기, 시간 제한 1500 ms", kind: "state", out: "750 ms에 95 %", from: "고전압 전원 · 프리차지·접촉기" },
      waitB: { id: "waitB", label: "프리차지 대기", tag: "표 B", spec: "설정값: 버스 95 % 도달까지 대기, 시간 제한 500 ms", kind: "state", bad: "500 ms에 실패", from: "고전압 전원 · 프리차지·접촉기",
        why: "실행 결과 500 ms에 시퀀스가 실패해요. 요구사항은 '시간 제한 1500 ms'예요. 같은 '프리차지 대기'라도 설정값이 달라요." },
      main: { id: "main", label: "주 접촉기 닫기", kind: "state", out: "접촉기 닫힘", from: "고전압 전원 · 프리차지·접촉기" },
      weld: { id: "weld", label: "용착 진단", kind: "check", from: "고전압 전원 · 프리차지·접촉기",
        why: "'용착 진단'은 접촉기가 달라붙었는지 확인하는 블록이에요. 시동 순서 안에는 들어가지 않아요." },
      lock: { id: "lock", label: "충전구 잠금 확인", kind: "switch", from: "충전 · 연결·잠금 확인",
        why: "'충전구 잠금 확인'은 충전 도메인의 블록이에요. 시동 순서에는 없어요." },
      ready: { id: "ready", label: "READY · HV 연결", kind: "hw", img: `${T}vcu.png`, out: "READY ✓", from: "고전압 전원 · 프리차지·접촉기" },
      bms: { id: "bms", label: "BMS 시동 허용", kind: "hw", img: `${T}bms.png`, out: "시동 허용 1", from: "고전압 전원 · 팩 안전 판단" },
    },
    notes: [{ domain: "power", feature: 1, name: "고전압 전원 · 프리차지·접촉기" }, { domain: "power", feature: 0, name: "고전압 전원 · 팩 안전 판단" }],
    field: { wait: "500 ms에 실패", main: "명령 없음", ready: "READY 꺼짐" },
  },
  gear: {
    domain: "변속·주차", feature: "변속 레버 → 통신 → VCU 수신 → 구동 지령", ecu: "VCU", program: "gear_fallback_n",
    board: ["lever", "gw", "can", "rx", "cmd", "motor"], gaps: [1, 3],
    spares: ["direct", "rxB", "hold", "rx", "gw"], joints: ["round", "square", "square", "tri", "tri"],
    side: { pieces: ["cluster"], into: 3, value: "D 표시", label: "클러스터가 따로 받는 변속 값" },
    req: [
      { text: "운전자가 변속 레버를 P에서 D로 바꾼다", slot: 0 },
      { text: "변속 레버 위치는 게이트웨이를 거쳐 전달된다", slot: 1 },
      { text: "CAN으로 20 ms 주기로 VCU에 전달된다", slot: 2 },
      { text: "VCU는 100 ms 안에 새 메시지가 없으면 통신 오류로 보고 안전 값 N을 쓴다", slot: 3 },
      { text: "VCU가 기어 값에 맞춰 구동 지령을 만든다 (N이면 0 Nm)", slot: 4 },
      { text: "모터가 지령대로 토크를 낸다", slot: 5 },
    ],
    blocks: {
      lever: { id: "lever", label: "변속 레버 · 시프터", kind: "hw", img: `${T}accel_pedal.png`, out: "D", from: "변속·주차 · PRND 입력 판독" },
      gw: { id: "gw", label: "게이트웨이 신호 중계", kind: "calc", out: "D · 간격 120 ms", from: "통신·진단 · 신호 수신·폴백" },
      direct: { id: "direct", label: "직결 연결 (게이트웨이 없음)", kind: "calc", from: "통신·진단 · 신호 수신·폴백",
        why: "'직결 연결'은 게이트웨이 없이 센서가 VCU에 바로 연결되는 다른 구조예요. 이 차의 변속 신호는 게이트웨이를 거쳐요." },
      can: { id: "can", label: "CAN 버스 20 ms 주기", kind: "hw", img: `${T}can_harness.png`, out: "20 ms · 부하 시 120 ms", from: "통신·진단 · 신호 수신·폴백" },
      rx: { id: "rx", label: "변속 수신 처리", tag: "표 A", spec: "타임아웃 100 ms · 폴백 값 N(중립)", kind: "check", out: "타임아웃 → N", from: "변속·주차 · 기어 상태 배포·표시" },
      rxB: { id: "rxB", label: "변속 수신 처리", tag: "표 B", spec: "타임아웃 100 ms · 폴백 값 R(후진)", kind: "check", bad: "타임아웃 → R", from: "변속·주차 · 기어 상태 배포·표시",
        why: "실행 결과 폴백 값이 R이라 후진 지령이 나와요. 요구사항은 안전 값 N이에요. 같은 '변속 수신 처리'라도 표 값이 달라요." },
      hold: { id: "hold", label: "마지막 값 유지", kind: "switch", from: "통신·진단 · 신호 수신·폴백",
        why: "'마지막 값 유지'는 끊기기 직전 값을 계속 쓰는 방식이에요. 직전 값이 D면 계속 달려서 안전 값이 아니에요." },
      cmd: { id: "cmd", label: "구동 지령 출력", kind: "calc", out: "0 Nm", from: "구동 · 토크 배분·제한" },
      motor: { id: "motor", label: "인버터 · 전륜 모터", kind: "hw", img: `${T}traction_motor.png`, out: "토크 0 Nm · 정지 유지", from: "구동 · 토크 배분·제한" },
      cluster: { id: "cluster", label: "클러스터 변속 표시", kind: "hw", img: `${T}diagnostic_port.png`, out: "D 표시", from: "변속·주차 · 기어 상태 배포·표시" },
    },
    notes: [{ domain: "gear", feature: 3, name: "변속·주차 · 기어 상태 배포·표시" }, { domain: "gear", feature: 0, name: "변속·주차 · PRND 입력 판독" }],
    field: { rx: "타임아웃 → R", cmd: "−60 Nm", motor: "후진 −6 km/h" },
  },
};

// SW blocks take the garage's own picto/tag rule, so the piece looks exactly like the garage block
Object.values(REF).forEach(ref => Object.values(ref.blocks).forEach(b => { if (b.kind !== "hw") b.kind = blockKind(b.label); }));

const PITCH = 116, PIECE = 140, MAIN_Y = 92, SIDE_Y = 284, SPARE_Y = 476, PAD = 24;
const unitOf = (out?: string) => (out?.match(/Nm|%|°C|bar|m\/s²|rpm/) ?? [""])[0];
const doesOf = (b: Blk) => b.does ?? (b.kind === "hw" ? "실제 부품" : plainText(b.label, b.kind));
const eunNeun = (word: string) => { const c = word.charCodeAt(word.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 ? "은" : "는"; };

// table/setting pieces show their values on the face, so same-name candidates are told apart by the requirement numbers
const FACE: Record<string, string> = { map: "60% → 204 Nm", mapB: "60% → 92 Nm", hyst: "65°C 켜짐 · 60°C 꺼짐", hystB: "95°C 켜짐 · 90°C 꺼짐", press: "2.1 m/s² → 42 bar", pressB: "2.1 m/s² → 8 bar", sign: "음수 → 음수", signB: "음수 → 양수", wait: "95 %까지 · 한도 1500 ms", waitB: "95 %까지 · 한도 500 ms" };
function PieceFace({ b }: { b: Blk }) {
  return <>
    {b.kind === "hw"
      ? <div className={`rpPic hw ${b.ee ? "ee" : ""}`}><img src={b.img} alt="" draggable={false} /><small>{b.ee ? "E/E" : "부품"}</small></div>
      : <div className={`rpPic sw kind-${b.kind}`}><div className="flowBlock"><Picto kind={b.kind} />{FACE[b.id] ? <small className={`rpFace ${FACE[b.id].length > 11 ? "tight" : ""}`}>{FACE[b.id]}</small> : <small>{KIND_TAG[b.kind]}</small>}</div></div>}
    {b.tag && !FACE[b.id] && <em className="rpTag">{b.tag}</em>}
    <b className="rpLabel">{b.label}</b>
  </>;
}

/** v1 (▶ 실행 graded every requirement at once). Kept unused; v2 below. */
export function RefPuzzleV1({ state, send }: { state: Campaign; send: Send }) {
  const ref = REF[state.caseId];
  const n = ref.board.length;
  const boardW = PAD * 2 + (n - 1) * PITCH + PIECE, spareGap = 156;
  const W = Math.max(boardW, ref.spares.length * spareGap + PAD * 2 + 10), H = SPARE_Y + 170;
  const ox = (W - boardW) / 2; // centre a short board above a wide spare tray
  const slotX = (i: number) => ox + PAD + i * PITCH;
  const sideStart = ref.side.into - (ref.side.pieces.length - 1);
  const spareHome = (id: string) => { const k = ref.spares.indexOf(id), gap = spareGap, w = ref.spares.length * gap - (gap - PIECE); return { x: (W - w) / 2 + k * gap, y: SPARE_Y + 14 }; };
  const [place, setPlace] = useState<Record<number, string | null>>(() => Object.fromEntries(ref.gaps.map(g => [g, null])));
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; dx: number; dy: number; moved: boolean } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [run, setRun] = useState<{ step: number; status: "running" | "fail" | "pass"; failAt?: number } | null>(null);
  const [fails, setFails] = useState(0);
  const [msg, setMsg] = useState(`오른쪽 요구사항을 읽고 빈칸 ${ref.gaps.length}곳에 블록을 넣은 뒤 ▶ 실행하세요. 모두 정비소에서 본 블록·부품이에요.`);
  const [zoom, setZoomState] = useState<{ b: Blk; x: number; y: number; up: boolean } | null>(null);
  const setZoom = (b: Blk | null, el?: HTMLElement) => { if (!b || !el || !stage.current) { setZoomState(null); return; } const r = el.getBoundingClientRect(), base = stage.current.getBoundingClientRect(); const up = r.bottom - base.top > base.height - 190; setZoomState({ b, x: Math.min(Math.max(r.left - base.left + r.width / 2, 135), base.width - 135), y: up ? r.top - base.top - 8 : r.bottom - base.top + 8, up }); };
  useEffect(() => { const key = (e: KeyboardEvent) => { if (["Delete", "Backspace", "Escape"].includes(e.key)) setZoomState(null); }; addEventListener("keydown", key); return () => removeEventListener("keydown", key); }, []);
  const [noteOpen, setNoteOpen] = useState(false);
  const [scale, setScale] = useState(.8);
  const stage = useRef<HTMLDivElement>(null);
  const noteKey = `${state.caseId}:garageNote`;
  const section = (() => { try { return sessionStorage.getItem(`tb-section-${state.caseId}`) ?? ref.ecu; } catch { return ref.ecu; } })();
  const noteUsed = Boolean(state.hintClaims[noteKey]);

  useLayoutEffect(() => {
    const fit = () => { const r = stage.current?.getBoundingClientRect(); if (r && r.width) setScale(Math.min(r.width / W, r.height / H, 1.1)); };
    fit();
    const ob = new ResizeObserver(fit); if (stage.current) ob.observe(stage.current);
    return () => ob.disconnect();
  }, [W, H]);

  const inSlot = (id: string) => { const g = ref.gaps.find(k => place[k] === id); return g === undefined ? null : g; };
  const pieceAt = (slot: number) => ref.gaps.includes(slot) ? place[slot] : ref.board[slot];
  const filled = ref.gaps.every(g => place[g]);
  const world = (cx: number, cy: number) => { const r = stage.current!.querySelector(".rpWorld")!.getBoundingClientRect(); return { x: (cx - r.left) / scale, y: (cy - r.top) / scale }; };

  const putIn = (id: string, slot: number | null) => {
    setPlace(prev => {
      const next = { ...prev };
      ref.gaps.forEach(g => { if (next[g] === id) next[g] = null; });
      if (slot !== null) next[slot] = id; // a piece already there goes back to the spare tray
      return next;
    });
    setRun(null);
  };
  const nearestGap = (x: number, y: number) => {
    let best: number | null = null, dist = 90;
    ref.gaps.forEach(g => { const d = Math.hypot(x - slotX(g), y - MAIN_Y); if (d < dist) { dist = d; best = g; } });
    return best;
  };
  const onDown = (event: React.PointerEvent, id: string) => {
    if (event.button !== 0 || run?.status === "running") return;
    const p = world(event.clientX, event.clientY);
    const slot = inSlot(id); const home = slot !== null ? { x: slotX(slot), y: MAIN_Y } : spareHome(id);
    setDrag({ id, x: home.x, y: home.y, dx: p.x - home.x, dy: p.y - home.y, moved: false });
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };
  const onMove = (event: React.PointerEvent) => {
    if (!drag) return;
    const p = world(event.clientX, event.clientY);
    const x = p.x - drag.dx, y = p.y - drag.dy;
    setDrag({ ...drag, x, y, moved: drag.moved || Math.hypot(x - drag.x, y - drag.y) > 4 });
  };
  const onUp = () => {
    if (!drag) return;
    if (!drag.moved) { // a click: pick up / put down
      const slot = inSlot(drag.id);
      if (slot !== null) { putIn(drag.id, null); play("pop"); }
      else { setPicked(picked === drag.id ? null : drag.id); play("pop"); }
    } else {
      const g = nearestGap(drag.x, drag.y);
      putIn(drag.id, g); play(g !== null ? "squish" : "pop"); setPicked(null);
    }
    setDrag(null);
  };
  const clickGap = (g: number) => { if (picked) { putIn(picked, g); setPicked(null); play("squish"); } };

  // ▶ run: values travel slot by slot and stop at the first mismatch
  const start = () => {
    if (!filled || run?.status === "running") return;
    setRun({ step: 0, status: "running" }); play("zip");
    setMsg("값이 흐르는 중이에요. 표시창 값이 요구사항과 맞는지 확인하세요.");
  };
  useEffect(() => {
    if (!run || run.status !== "running") return;
    const timer = window.setTimeout(() => {
      const slot = run.step;
      const id = pieceAt(slot)!;
      const ok = id === ref.board[slot];
      if (!ok) {
        const b = ref.blocks[id], want = ref.req.find(r => r.slot === slot);
        setRun({ step: slot, status: "fail", failAt: slot }); setFails(f => f + 1); showVerdict(false, "불일치");
        const trapHere = Boolean(b.bad) && ref.blocks[ref.board[slot]].label === b.label;
        setMsg(b.why && (trapHere || !b.bad && !ref.board.includes(id)) ? b.why : `${slot + 1}번 칸 요구사항은 "${want?.text ?? "다음 단계"}"예요. '${b.label}'${eunNeun(b.label)} "${doesOf(b)}" 블록이라 이 자리 값이 맞지 않아요.`);
        return;
      }
      if (slot === n - 1) { setRun({ step: slot, status: "pass" }); showVerdict(true, "통과"); setMsg("✓ 모든 요구사항을 만족해요. 이 값들이 이번 사건의 정상 기준이에요."); return; }
      play("pop", 1 + slot * .06);
      setRun({ step: slot + 1, status: "running" });
    }, run.step === 0 ? 350 : 520);
    return () => clearTimeout(timer);
  }, [run]); // eslint-disable-line react-hooks/exhaustive-deps

  const solve = () => { setPlace(Object.fromEntries(ref.gaps.map(g => [g, ref.board[g]]))); setRun(null); setMsg("정답 배치 완료. ▶ 실행으로 확인하세요."); };
  const reset = () => { setPlace(Object.fromEntries(ref.gaps.map(g => [g, null]))); setRun(null); setPicked(null); setMsg("초기화했어요. 요구사항을 하나씩 읽어 보세요."); play("squish"); };
  const noteReady = fails > 0 || noteUsed;
  const openNote = () => { if (!noteReady) return; if (!noteUsed) send({ type: "HINT", key: noteKey }); setNoteOpen(true); play("pop"); };
  const stars = fails === 0 ? 3 : fails === 1 ? 2 : 1;
  const reached = (slot: number) => run && (run.step > slot || (run.step === slot && run.status === "pass"));
  const valueAt = (slot: number) => {
    const id = pieceAt(slot); if (!id) return null;
    if (run?.failAt === slot) { const b = ref.blocks[id]; const trapHere = b.bad && ref.blocks[ref.board[slot]].label === b.label; return { text: trapHere ? b.bad! : "✗ ?", bad: true }; }
    if (!reached(slot)) return null;
    return { text: ref.blocks[ref.board[slot]].out ?? "", bad: false };
  };
  const sideLit = Boolean(run && run.step >= ref.side.into);
  const jointsIo = (slot: number) => ({ in: slot > 0 ? ref.joints[slot - 1] : undefined, out: slot < n - 1 ? ref.joints[slot] : undefined });

  const piece = (b: Blk, x: number, y: number, opts: { io?: { in?: Nub; out?: Nub }; locked?: boolean; cls?: string }) =>
    <div key={`${opts.locked ? "fixed" : "move"}-${b.id}`} className={`rpPiece ${b.kind === "hw" ? "hw" : "sw"} ${opts.locked ? "locked" : ""} ${opts.cls ?? ""}`}
      style={{ left: x, top: y, ...({ "--piece": opts.io ? piecePath(opts.io) : "inset(6px 12px 6px 12px round 12px)" } as React.CSSProperties) }}
      title={`${b.label} · ${doesOf(b)}`}
      onDoubleClick={event => { event.stopPropagation(); setZoom(b, event.currentTarget); }}
      onPointerDown={opts.locked ? undefined : event => onDown(event, b.id)}>
      <PieceFace b={b} />
      <button className="rpHelp" aria-label="블록 설명" onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); setZoom(zoom?.b.id === b.id ? null : b, event.currentTarget.parentElement as HTMLElement); }}>?</button>
    </div>;

  const requirementDone = (slot: number) => Boolean(reached(slot));
  return <div className="refPuzzle">
    <SceneBackdrop image="/assets/stitch23/investigation-lab.png" position="center" shade="soft" />
    <GameHeader chapter="검증 준비" title="요구사항 기반 퍼즐" progressScene={state.scene} distanceMeters={state.policeGapMeters} onPause={() => send({ type: "PAUSE" })} />
    <PursuitRouteBar compact distance={state.raceDistance} gap={state.policeGapMeters} />
    <StageIntro id="puzzle" title="요구사항 기반 퍼즐" goal="주어진 요구사항대로 퍼즐을 구성해요." steps={[
      { icon: "clipboard", text: "오른쪽 요구사항을 읽어요. 노란 줄이 이번에 맞춰야 할 칸이에요." },
      { icon: "puzzle", text: "아래 남은 조각을 빈칸으로 끌어 넣어요. 조각의 ? 버튼을 누르면 하는 일과 표 값이 나와요." },
      { icon: "monitor", text: "▶ 실행하면 값이 칸마다 흘러요. 요구사항과 처음 다른 칸에서 멈추면 그 칸을 다시 생각해요." },
    ]} />
    <header className="rpHead">
      <div><small>의심 구간 · {section}</small><h1>{ref.domain} · {ref.feature}</h1><p>요구사항대로 동작하려면 어떤 블록이 어떤 순서로 있어야 하는지 맞춥니다. <b>값의 단위가 바뀌는 곳</b>(예: % → Nm)이 단서예요.</p></div>
      <div className="rpTools">
        <button onClick={openNote} disabled={!noteReady} title={noteReady ? "" : "한 번 실행해 본 뒤 열 수 있어요"}><Icon name="book" /> 정비소 노트{noteUsed ? "" : noteReady ? " · -5m" : " · 실행 후"}</button>
        <button onClick={reset}>↺ 초기화</button>
      </div>
    </header>
    <main className="rpMain">
      <aside className="rpReq">
        <small>요구사항 · 정상이면 이렇게</small>
        {ref.req.map((r, k) => { const bad = run?.failAt === r.slot; const done = !bad && requirementDone(r.slot); return <div key={r.text} className={`${done ? "done" : ""} ${bad ? "bad" : ""} ${ref.gaps.includes(r.slot) ? "gap" : ""}`}>
          <i>{done ? "✓" : bad ? "✗" : k + 1}</i><span>{numify(r.text)}</span>
        </div>; })}
      </aside>
      <section className="rpStage" ref={stage} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => setDrag(null)}>
        <div className="rpSizer" style={{ width: W * scale, height: H * scale }}><div className="rpWorld" style={{ width: W, height: H, transform: `scale(${scale})` }}>
          <div className="rpTray main" style={{ left: slotX(0) - 14, top: MAIN_Y - 66, width: (n - 1) * PITCH + PIECE + 28, height: PIECE + 118 }}><span>입력 → 출력 · 표시창은 ▶ 실행할 때 채워져요</span></div>
          <div className="rpTray side" style={{ left: slotX(sideStart) - 10, top: SIDE_Y - 12, width: (ref.side.pieces.length - 1) * PITCH + PIECE + 20, height: PIECE + 24 }}><span>{ref.side.label}</span></div>
          <div className="rpTray spare" style={{ left: PAD, top: SPARE_Y - 10, width: W - PAD * 2, height: PIECE + 30 }}><span>남은 조각 · 끌어서 빈칸에 · 두 번 누르면 크게 보기</span></div>
          {/* side input climbing into the merge block */}
          <svg className={`rpSideWire ${sideLit ? "lit" : ""}`} width={W} height={H}>
            <path d={`M${slotX(ref.side.into) + 70} ${SIDE_Y + 4} V${MAIN_Y + PIECE - 2}`} />
            <path d={`M${slotX(ref.side.into) + 62} ${MAIN_Y + PIECE + 8} L${slotX(ref.side.into) + 70} ${MAIN_Y + PIECE - 2} L${slotX(ref.side.into) + 78} ${MAIN_Y + PIECE + 8}`} />
          </svg>
          <span className={`rpSidePill ${sideLit ? "lit" : ""}`} style={{ left: slotX(ref.side.into) + 82, top: (SIDE_Y + MAIN_Y + PIECE) / 2 - 12 }}>{ref.side.value}</span>
          {ref.side.pieces.map((id, k) => piece(ref.blocks[id], slotX(sideStart + k), SIDE_Y, { locked: true, io: { in: k > 0 ? "square" : undefined, out: k < ref.side.pieces.length - 1 ? "square" : undefined }, cls: "side" }))}
          {/* empty gaps */}
          {ref.gaps.map(g => <button key={`gap-${g}`} className={`rpGap ${picked ? "ready" : ""}`} style={{ left: slotX(g), top: MAIN_Y }} onClick={() => clickGap(g)}><b>?</b><small>{g + 1}번 칸</small></button>)}
          {/* fixed pieces of the board */}
          {ref.board.map((id, slot) => ref.gaps.includes(slot) ? null : piece(ref.blocks[id], slotX(slot), MAIN_Y, { io: jointsIo(slot), locked: true }))}
          {/* movable pieces: in a gap or in the spare tray */}
          {ref.spares.map(id => {
            const b = ref.blocks[id], slot = inSlot(id);
            const dragging = drag?.id === id && drag.moved;
            const pos = dragging ? { x: drag!.x, y: drag!.y } : slot !== null ? { x: slotX(slot), y: MAIN_Y } : spareHome(id);
            return piece(b, pos.x, pos.y, { io: slot !== null && !dragging ? jointsIo(slot) : undefined, cls: `${dragging ? "dragging" : ""} ${picked === id ? "picked" : ""} ${run?.failAt === slot && slot !== null ? "fail" : ""}` });
          })}
          {/* values that flowed during ▶ run */}
          {/* Simulink-style display blocks: the value leaving each block, filled while ▶ runs */}
          {ref.board.map((_, slot) => { const v = valueAt(slot); const x = slot < n - 1 ? slotX(slot) + 128 : slotX(slot) + 70; return <React.Fragment key={`v-${slot}`}>
            <i className="rpStem" style={{ left: x, top: slot === n - 1 ? MAIN_Y + PIECE - 6 : MAIN_Y - 22 }} />
            <span className={`rpDisplay ${v ? v.bad ? "bad" : "ok" : ""} ${slot === 0 ? "first" : ""} ${slot === n - 1 ? "last" : ""}`} style={{ left: x, top: slot === n - 1 ? MAIN_Y + PIECE + 14 : MAIN_Y - 54 }}>{slot === 0 && <small>입력</small>}{slot === n - 1 && <small>출력</small>}{v ? v.text : `? ${unitOf(ref.blocks[ref.board[slot]].out)}`}</span>
          </React.Fragment>; })}
          {ref.board.slice(0, -1).map((_, slot) => <i key={`a-${slot}`} className="rpArrow" style={{ left: slotX(slot) + 128, top: MAIN_Y + 58 }}>▶</i>)}
          {run && <i className={`rpPulse ${run.status}`} style={{ left: slotX(run.step) + 70, top: MAIN_Y + 70 }} />}
        </div>
        </div>
        {zoom && <div className={`rpBubble ${zoom.up ? "up" : ""}`} style={{ left: zoom.x, top: zoom.y }} onPointerDown={event => event.stopPropagation()}>
          <button className="rpBubbleX" aria-label="닫기" onClick={() => setZoomState(null)}>×</button>
          <small>{zoom.b.kind === "hw" ? (zoom.b.ee ? "E/E 부품" : "부품 (하드웨어)") : `SW 블록 · ${KIND_TAG[zoom.b.kind]}`}</small>
          <b>{zoom.b.label}{zoom.b.tag ? ` · ${zoom.b.tag}` : ""}</b>
          <p>{doesOf(zoom.b)}</p>
          {zoom.b.spec && <p className="rpSpec">{zoom.b.spec}</p>}
          <p className="rpFromLine">정비소에서 본 곳: {zoom.b.from}</p>
        </div>}
      </section>
    </main>
    <footer className="rpFoot">
      <div className="rpMing"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><p><b>{ENGINEER}</b>{numify(msg)}</p></div>
      <span className="rpStars">{"★".repeat(stars)}{"☆".repeat(3 - stars)}<small>실행 실패 {fails}번</small></span>
      {/* one primary action at a time: run until it passes, then move on */}
      {run?.status === "pass"
        ? <button className="rpNext" onClick={() => { send({ type: "COMPILE", program: ref.program }); send({ type: "OPEN_BENCH" }); }}>다음: 시뮬레이션 검증 →</button>
        : <button className="rpRun" disabled={!filled || run?.status === "running"} onClick={start}>{!filled ? `빈칸 ${ref.gaps.filter(g => !place[g]).length}개 남음` : run?.status === "running" ? "실행 중…" : run?.status === "fail" ? "▶ 다시 실행" : "▶ 실행해서 확인"}</button>}
    </footer>
    <button className="secretSolve" title="개발용 정답 적용" onClick={solve}>정답 보기</button>

    {noteOpen && <div className="pieceZoom" onClick={() => setNoteOpen(false)}><article className="rpNote" onClick={event => event.stopPropagation()}>
      <button className="pieceZoomClose" onClick={() => setNoteOpen(false)}>×</button>
      <small><Icon name="book" /> 정비소 노트 · Control Software</small><h2>정비소에서 본 블록 카드</h2>
      <p className="pzTip">순서는 섞여 있어요. 각 블록이 하는 일만 다시 확인하고, 순서는 요구사항으로 판단하세요.</p>
      {ref.notes.map(note => <section key={note.name}><b>{note.name}</b><div className="rpNoteCards">
        {[...getFeatureLayer(note.domain, note.feature, 3)].sort((a, b) => a.localeCompare(b, "ko")).map(label => { const kind = blockKind(label); return <div key={label} className={`rpNoteCard kind-${kind}`}><div className="flowBlock"><Picto kind={kind} /><small>{KIND_TAG[kind]}</small></div><b>{label}</b><span>{plainText(label, kind)}</span></div>; })}
      </div></section>)}
    </article></div>}
  </div>;
}

// ===== v2 (docs/PLAY_FLOW_V2 · prompt PART C) =====
// 1) build → "연결 확인" only checks that each gap holds a block of the right function (same-name table variants pass)
// 2) after a good connection, an example-input slider shows the value leaving every block (explore, nothing graded)
// 3) the player decides "요구사항과 같아요 → 기준 확정"; only then is the requirement checked (wrong table → explained)
// 4) the confirmed reference becomes the expected-value card that the bench uses as its dashed baseline.
// Why this path exists, in one plain sentence (4-3).
const WHY: Record<CaseId, string> = {
  propulsion: "페달을 얼마나 밟았는지에 맞춰 차가 낼 힘을 정하기 위해서예요.",
  thermal: "냉각수가 뜨거워지면 팬을 돌려 구동계 온도를 지키기 위해서예요.",
  brake: "브레이크를 밟은 만큼 회생과 마찰 제동을 나눠 차를 세우기 위해서예요.",
  regen: "발을 뗐을 때 회생 요청이 정확한 방향의 토크로 바뀌어야 차가 의도대로 감속하기 때문이에요.",
  ready: "전압이 충분히 오르기 전에 주 접촉기를 닫으면 돌입 전류가 커서 위험하므로, 충전이 끝날 때까지 기다려야 해요.",
  gear: "통신이 끊겨도 차가 엉뚱한 방향으로 가면 안 되므로, 끊겼을 때 쓰는 값은 가장 안전한 값이어야 해요.",
};
// The final actuator reacts in 3D: normal output when the rig matches the requirement, a weaker one when it does not.
const ACTUATOR: Record<CaseId, { id: string; ok: string; weak: string }> = {
  propulsion: { id: "traction_motor", ok: "모터 204 Nm · 정상 가속", weak: "모터 힘 부족 · 가속이 약해요" },
  thermal: { id: "cooling_fan", ok: "팬 1850 rpm · 정상 냉각", weak: "팬이 켜지지 않아요 · 온도 상승" },
  brake: { id: "brake_caliper", ok: "캘리퍼 42 bar · 정상 감속", weak: "압력 부족 · 감속이 약해요" },
  regen: { id: "traction_motor", ok: "모터 −40 Nm · 정상 회생 감속", weak: "토크가 반대 방향 · 오히려 가속해요" },
  ready: { id: "vcu", ok: "버스 380 V · 주 접촉기 닫힘 · READY", weak: "대기 중 실패 · READY가 안 켜져요" },
  gear: { id: "vcu", ok: "기어 값 N · 구동 지령 0 Nm · 정지 유지", weak: "기어 값 R · 후진 방향으로 움찔해요" },
};
function ActuatorReaction({ caseId, ok }: { caseId: CaseId; ok: boolean }) {
  const a = ACTUATOR[caseId];
  return <div className={`rpActuator ${ok ? "ok" : "weak"}`}>
    <Canvas camera={{ position: [.35, .25, .45], fov: 35 }} dpr={[1, 1.5]}>
      <hemisphereLight intensity={1.6} color="#fff5dc" groundColor="#6d8c7b" />
      <directionalLight position={[2, 3, 2]} intensity={2.4} />
      <group scale={caseId === "brake" ? 1.1 : caseId === "thermal" ? .55 : 1.2}><PartModel id={a.id} input={ok ? 18 : 2} castShadow={false} /></group>
    </Canvas>
    <b>{ok ? a.ok : a.weak}</b>
  </div>;
}

// What the finished rig is for: the hypotheses the bench will tell apart with it.
const RIG_GOAL: Record<CaseId, string> = {
  propulsion: "VCU 계산 SW 문제인지, 입력 회로 문제인지",
  thermal: "팬 요청 계산 SW인지, PWM 출력 어댑터 SW인지",
  brake: "배분 계산 SW인지, 압력 명령 I/O 어댑터 SW인지",
  regen: "VCU 토크 지령 변환 SW인지, 그 뒤 CAN·인버터 경로인지",
  ready: "프리차지 대기 시간 설정인지, 프리차지 회로(저항·접촉기)인지",
  gear: "변속 수신의 타임아웃 폴백 설정인지, 레버·게이트웨이 경로인지",
};
/** STEP03 산출물: 정상 시나리오 요구사항 문장 (STEP04 시험 자료함에서 그대로 참고). */
export const normalScenarioLines = (caseId: CaseId) => SPEC[caseId].lines;
// One-line test purpose on the design sheet (the full contract objective stays in the tooltip and in STEP04).
const SHEET_PURPOSE: Record<CaseId, string> = {
  propulsion: "VCU 계산 SW와 입력 회로 중 원인 구분",
  thermal: "팬 요청 계산 SW와 PWM 출력 SW 중 원인 구분",
  brake: "배분 계산 SW와 압력 출력 SW 중 원인 구분",
  regen: "VCU 변환 SW와 인버터 이후 경로 중 원인 구분",
  ready: "프리차지 대기 설정과 프리차지 회로 중 원인 구분",
  gear: "변속 수신 타임아웃 폴백 설정과 중계 경로(레버·게이트웨이) 중 원인 구분",
};
const SPEC: Record<CaseId, { text: string; lines: string[]; input?: { label: string; unit: string; min: number; max: number; at: number }; expect: string }> = {
  propulsion: { text: "페달 0~100% → 토크 요청 0~340 Nm 선형 · 가용 토크 한계 260 Nm(BMS·온도) · D단·READY일 때만 통과",
    lines: ["D단·READY 상태에서만 가속 페달 위치(0~100%)를 토크 요청(0~340\u00a0Nm, 비례)으로 바꾼다.", "토크 요청은 BMS·온도가 허용하는 가용 토크 260\u00a0Nm를 넘지 않는다.", "정상 시나리오: 페달 60% → 토크 요청 204\u00a0Nm → 모터 토크 204\u00a0Nm"],
    input: { label: "가속 페달", unit: "%", min: 0, max: 100, at: 60 }, expect: "페달 60% → 토크 요청 204 Nm → 모터 204 Nm" },
  thermal: { text: "냉각수 65°C 이상 팬 켜짐 · 60°C 이하 꺼짐 · 켜지면 실제 회전을 보며 목표 1850 rpm으로 PWM 조절 · 출력단이 PWM과 12V를 팬에 공급",
    lines: ["냉각수 온도가 65°C 이상이면 냉각 팬을 켜고, 60°C 이하가 되면 끈다.", "팬이 켜지면 실제 회전수를 보며 목표 1850\u00a0rpm이 되도록 PWM을 조절한다.", "ECU 출력단은 PWM 신호와 12\u00a0V 전원을 팬에 공급한다."],
    input: { label: "냉각수 온도", unit: "°C", min: 40, max: 100, at: 78 }, expect: "냉각수 78°C → 팬 켜짐 → 팬 1850 rpm" },
  brake: { text: "페달 55% → 목표 감속 3.2 m/s² · 회생은 가용량까지 · 나머지는 마찰(1 m/s²당 20 bar)",
    lines: ["브레이크 페달을 55% 밟으면 목표 감속은 3.2\u00a0m/s²이다.", "회생 제동은 배터리가 받을 수 있는 만큼만 쓰고, 나머지는 마찰 제동이 채운다.", "마찰 제동 1\u00a0m/s²는 브레이크 압력 20\u00a0bar로 만든다."], expect: "페달 55% → 감속 3.2 m/s²" },
  regen: { text: "페달 0%·40 km/h 이상에서 코스팅 회생 · 토크 지령은 회생 요청과 같은 방향(음수) · 크기는 회생 한계 이내",
    lines: ["가속 페달 0%이고 40\u00a0km/h 이상이면 코스팅 회생이 동작한다.", "토크 지령은 회생 요청과 같은 방향(음수)이다. 요청 −40\u00a0Nm이면 지령도 −40\u00a0Nm이다.", "회생 크기는 BMS가 허용하는 한계(60\u00a0Nm) 이내이고, 평지에서 80\u00a0Nm당 1\u00a0m/s²로 감속한다."], expect: "회생 요청 −40 Nm → 토크 지령 −40 Nm → 가감속 −0.5 m/s²" },
  ready: { text: "시동 요청 → 프리차지 접촉기 → 버스 95 %(380 V)까지 대기(시간 제한 1500 ms) → 주 접촉기 → READY",
    lines: ["브레이크를 밟고 시동 요청이 오면 프리차지 접촉기를 닫아 버스를 먼저 충전한다.", "버스 전압이 팩 전압의 95 %(400\u00a0V 팩이면 380\u00a0V)에 닿으면 주 접촉기를 닫아 READY로 전환한다.", "프리차지 대기 시간(시간 제한)은 1500\u00a0ms이다. 정상 충전은 약 750\u00a0ms가 걸린다."], expect: "시동 요청 → 750 ms 부근 버스 380 V 이상 → 주 접촉기 명령 → READY" },
  gear: { text: "변속 레버 → 게이트웨이 → CAN(20 ms 주기) → VCU 수신(100 ms 타임아웃 · 폴백 N) → 구동 지령",
    lines: ["변속 레버 위치는 게이트웨이를 거쳐 CAN으로 VCU에 20\u00a0ms 주기로 전달된다.", "VCU는 100\u00a0ms 안에 새 메시지가 없으면 통신 오류로 본다.", "통신 오류일 때는 안전 값 N(구동 토크 0)을 쓴다. 클러스터는 별도 경로로 변속 값을 받는다."],
    input: { label: "메시지 간격", unit: "ms", min: 0, max: 200, at: 120 }, expect: "메시지 간격 120 ms → 타임아웃 → 기어 값 N · 구동 지령 0 Nm" },
};
/** Value leaving each board slot for an example input (same numbers as simModel: 3.4 Nm/%, limit 260, 65/60 °C, 1850 rpm). */
function exampleValue(caseId: CaseId, id: string, x: number, mapId = "map"): string | null {
  if (caseId === "propulsion") {
    const tq = (k: number) => Math.round(Math.min(k, 260));
    const map = mapId === "mapB" ? 1.53 * x : 3.4 * x; // downstream follows the table actually placed in the map slot
    return ({ aps: `A ${x}% · B ${x}%`, corr: `${x}% ✓`, filter: `${x}%`, map: `${Math.round(3.4 * x)} Nm`, mapB: `${Math.round(1.53 * x)} Nm`, permit: `${Math.round(map)} Nm · D`, min: `${tq(map)} Nm`, ramp: `${tq(map)} Nm ↗`, out: `CAN ${tq(map)} Nm`, inv: `모터 ${tq(map)} Nm` } as Record<string, string>)[id] ?? null;
  }
  if (caseId === "thermal") {
    return ({ coolant: `${x}°C`, range: `${x}°C ✓`, filter: `${x}°C` } as Record<string, string>)[id] ?? null;
  }
  if (caseId === "gear") {
    const late = x > 100;                                    // no new message within 100 ms -> timeout
    return ({ lever: "D", gw: `D · 간격 ${x} ms`, can: `${x} ms`, rx: late ? "타임아웃 → N" : "D", rxB: late ? "타임아웃 → R" : "D",
      cmd: mapId === "rxB" ? (late ? "-60 Nm" : "60 Nm") : (late ? "0 Nm" : "60 Nm"), motor: mapId === "rxB" ? (late ? "후진 -6 km/h" : "전진") : (late ? "정지 유지" : "전진") } as Record<string, string>)[id] ?? null;
  }
  return null;
}

export function RefPuzzle({ state, send }: { state: Campaign; send: Send }) {
  const caseId = state.caseId;
  const ref = REF[caseId], spec = SPEC[caseId];
  const n = ref.board.length;
  const boardW = PAD * 2 + (n - 1) * PITCH + PIECE, spareGap = 156;
  const W = Math.max(boardW, ref.spares.length * spareGap + PAD * 2 + 10), H = SPARE_Y + 170;
  const ox = (W - boardW) / 2;
  const progressKey = `tb-step03-progress-${caseId}`;
  const saved = (() => { try { return JSON.parse(sessionStorage.getItem(progressKey) ?? "null") ?? {}; } catch { return {}; } })();
  const slotX = (i: number) => ox + PAD + i * PITCH;
  const sideStart = ref.side.into - (ref.side.pieces.length - 1);
  const spareHome = (id: string) => { const k = ref.spares.indexOf(id), gap = spareGap, w = ref.spares.length * gap - (gap - PIECE); return { x: (W - w) / 2 + k * gap, y: SPARE_Y + 14 }; };
  const [place, setPlace] = useState<Record<number, string | null>>(() => saved.place ?? Object.fromEntries(ref.gaps.map(g => [g, null])));
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; dx: number; dy: number; moved: boolean } | null>(null);
  const [picked, setPicked] = useState<string | null>(saved.picked ?? null);
  const [snapped, setSnapped] = useState<string | null>(null);
  const [check, setCheck] = useState<{ step: number; status: "running" | "fail" | "pass"; failAt?: number } | null>(() => saved.check?.status === "running" ? null : saved.check ?? null);
  const [x, setX] = useState(saved.x ?? spec.input?.min ?? 0);
  const [confirmed, setConfirmed] = useState(Boolean(saved.confirmed));
  const [msg, setMsg] = useState(saved.msg ?? `빈칸 ${ref.gaps.length}곳에 조각을 끌어 넣고 '연결 확인'을 누르세요. 조각의 ? 버튼으로 하는 일과 표 값을 볼 수 있어요.`);
  const [zoom, setZoomState] = useState<{ b: Blk; x: number; y: number; up: boolean } | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const setZoom = (b: Blk | null, el?: HTMLElement) => { if (!b || !el || !stage.current) { setZoomState(null); return; } const r = el.getBoundingClientRect(), base = stage.current.getBoundingClientRect(); const up = r.bottom - base.top > base.height - 190; setZoomState({ b, x: Math.min(Math.max(r.left - base.left + r.width / 2, 135), base.width - 135), y: up ? r.top - base.top - 8 : r.bottom - base.top + 8, up }); };
  useEffect(() => { const key = (e: KeyboardEvent) => { if (["Delete", "Backspace", "Escape"].includes(e.key)) setZoomState(null); }; addEventListener("keydown", key); return () => removeEventListener("keydown", key); }, []);
  const [reaction, setReaction] = useState<"ok" | "weak" | null>(null);
  const [contract, setContract] = useState<VerificationContract | null>(saved.contract ?? null);
  const [bookFocus, setBookFocus] = useState<string | null>(null);   // block label shown in the 정비소 노트 popup
  const [sheetStep, setSheetStep] = useState(Boolean(saved.sheetStep));   // step 3: the test-design draft is open
  const [panelTab, setPanelTab] = useState<"req" | "sheet">(saved.sheetStep ? "sheet" : "req");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewStep, setViewStep] = useState<number | null>(null);          // roadmap chip pointing back; null = follow progress
  const [replayOpen, setReplayOpen] = useState(false);
  const [scale, setScale] = useState(.8);
  const section = (() => { try { return sessionStorage.getItem(`tb-section-${caseId}`) ?? ref.ecu; } catch { return ref.ecu; } })();
  useEffect(() => { try { sessionStorage.setItem(progressKey, JSON.stringify({ place, picked, check: check?.status === "running" ? null : check, x, confirmed, msg, contract, sheetStep })); } catch { /* ignore */ } }, [place, picked, check, x, confirmed, msg, contract, sheetStep, progressKey]);
  // the board keeps a 44px toolbar strip (title + 정비소 노트) on top, so the puzzle fits into the space below it
  const fitStage = () => { const r = stage.current?.getBoundingClientRect(); if (r && r.width) setScale(Math.min(r.width / W, (r.height - 44) / H, 1.1)); };
  useLayoutEffect(() => {
    fitStage(); const ob = new ResizeObserver(fitStage); if (stage.current) ob.observe(stage.current); return () => ob.disconnect();
  }, [W, H]); // eslint-disable-line react-hooks/exhaustive-deps

  const inSlot = (id: string) => { const g = ref.gaps.find(k => place[k] === id); return g === undefined ? null : g; };
  const pieceAt = (slot: number) => ref.gaps.includes(slot) ? place[slot] : ref.board[slot];
  const filled = ref.gaps.every(g => place[g]);
  const connected = check?.status === "pass";
  const stepNow = confirmed || sheetStep ? 2 : connected ? 1 : 0;
  useReportSubStep("puzzle", viewStep ?? stepNow, { max: stepNow, goTo: index => { setViewStep(index === stepNow ? null : index); setPanelTab(index === 2 ? "sheet" : "req"); } });
  useEffect(() => { setViewStep(null); setPanelTab(stepNow === 2 ? "sheet" : "req"); }, [stepNow]);
  const world = (cx: number, cy: number) => { const r = stage.current!.querySelector(".rpWorld")!.getBoundingClientRect(); return { x: (cx - r.left) / scale, y: (cy - r.top) / scale }; };
  const putIn = (id: string, slot: number | null) => {
    setPlace(prev => { const next = { ...prev }; ref.gaps.forEach(g => { if (next[g] === id) next[g] = null; }); if (slot !== null) next[slot] = id; return next; });
    setCheck(null); setConfirmed(false); setSheetStep(false); setContract(null);
    if (slot !== null) { setSnapped(id); window.setTimeout(() => setSnapped(null), 260); }
  };
  // snap by piece centre → slot centre, within about one piece width
  const nearestGap = (px: number, py: number) => { let best: number | null = null, dist = PIECE * .95; ref.gaps.forEach(g => { const d = Math.hypot(px + PIECE / 2 - (slotX(g) + PIECE / 2), py + PIECE / 2 - (MAIN_Y + PIECE / 2)); if (d < dist) { dist = d; best = g; } }); return best; };
  const onDown = (event: React.PointerEvent, id: string) => {
    if (event.button !== 0 || check?.status === "running") return;
    const p = world(event.clientX, event.clientY); const slot = inSlot(id); const home = slot !== null ? { x: slotX(slot), y: MAIN_Y } : spareHome(id);
    setDrag({ id, x: home.x, y: home.y, dx: p.x - home.x, dy: p.y - home.y, moved: false }); (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };
  const onMove = (event: React.PointerEvent) => { if (!drag) return; const p = world(event.clientX, event.clientY); const nx = p.x - drag.dx, ny = p.y - drag.dy; setDrag({ ...drag, x: nx, y: ny, moved: drag.moved || Math.hypot(nx - drag.x, ny - drag.y) > 4 }); };
  const onUp = (event: React.PointerEvent) => {
    if (!drag) return;
    // use the pointer position at release (the last rendered drag position can lag behind a fast drag)
    const p = world(event.clientX, event.clientY), ux = p.x - drag.dx, uy = p.y - drag.dy;
    const moved = drag.moved || Math.hypot(ux - drag.x, uy - drag.y) > 4;
    if (!moved) { const slot = inSlot(drag.id); if (slot !== null) { putIn(drag.id, null); play("pop"); } else { setPicked(picked === drag.id ? null : drag.id); play("pop"); } }
    else { const g = nearestGap(ux, uy); putIn(drag.id, g); play(g !== null ? "squish" : "pop"); setPicked(null); }
    setDrag(null);
  };
  const clickGap = (g: number) => { if (picked) { putIn(picked, g); setPicked(null); play("squish"); } };
  const hoverGap = drag?.moved ? nearestGap(drag.x, drag.y) : null;

  // 1) connection check: the right FUNCTION in each gap (label), not yet the right numbers
  const startCheck = () => { if (!filled || check?.status === "running") return; setCheck({ step: 0, status: "running" }); play("zip"); setMsg("연결을 확인하는 중이에요."); };
  useEffect(() => {
    if (!check || check.status !== "running") return;
    const timer = window.setTimeout(() => {
      const slot = check.step, id = pieceAt(slot)!, b = ref.blocks[id], want = ref.blocks[ref.board[slot]];
      if (b.label !== want.label) {
        setCheck({ step: slot, status: "fail", failAt: slot }); showVerdict(false, "연결 안 됨");
        const prevOut = slot > 0 ? unitOf(ref.blocks[ref.board[slot - 1]].out) : "", out = unitOf(want.out);
        setMsg(b.why && !b.bad ? b.why : `${slot + 1}번 칸에는 ${prevOut ? `${prevOut}가 들어와 ` : ""}${out ? `${out}${out === prevOut ? "로 나가는" : "로 바뀌어 나가는"}` : "다음으로 넘기는"} 블록이 필요해요. '${b.label}'${eunNeun(b.label)} "${doesOf(b)}" 블록이에요.`);
        return;
      }
      if (slot === n - 1) { setCheck({ step: slot, status: "pass" }); showVerdict(true, "연결 OK"); setX(spec.input?.min ?? 0); setMsg(spec.input ? `연결은 맞아요. 아래 예시 입력(${spec.input.label})을 움직여 칸마다 값을 보세요. 요구사항과 같으면 '기준 확정'.` : "연결은 맞아요. 요구사항과 같으면 '기준 확정'을 누르세요."); return; }
      play("pop", 1 + slot * .06); setCheck({ step: slot + 1, status: "running" });
    }, check.step === 0 ? 300 : 360);
    return () => clearTimeout(timer);
  }, [check]); // eslint-disable-line react-hooks/exhaustive-deps

  // 2) example values after a good connection
  const valueAt = (slot: number): { text: string; bad: boolean } | null => {
    const id = pieceAt(slot); if (!id) return null;
    if (check?.failAt === slot) return { text: "✗ 연결 안 됨", bad: true };
    if (!connected) return check && check.step > slot ? { text: "✓ 연결", bad: false } : null;
    if (!spec.input) return { text: ref.blocks[id].bad ?? ref.blocks[ref.board[slot]].out ?? "", bad: false };
    const direct = exampleValue(caseId, id, x, pieceAt(3) ?? "map");
    if (direct) return { text: direct, bad: false };
    if (caseId === "thermal") { // hysteresis decides the rest (rising slider: on above the "on" threshold)
      const hystId = pieceAt(3)!, on = x >= (hystId === "hystB" ? 95 : 65);
      return { text: ({ hyst: on ? "팬 ON" : "팬 OFF", hystB: on ? "팬 ON" : "팬 OFF", pi: on ? "PWM 68%" : "PWM 0%", driver: on ? "PWM 68% · 12V" : "PWM 0% · 12V", fan: on ? "1850 rpm" : "0 rpm" } as Record<string, string>)[id] ?? "", bad: false };
    }
    return { text: ref.blocks[id].out ?? "", bad: false };
  };

  // 3) the player checks the reference against the requirement, reads the test-design draft, then commits it
  const hypothesisLabelOf = () => {
    const hypothesisId = state.hypothesis[caseId];
    const label = SCENARIO_META[caseId].hypotheses.find(item => item.id === hypothesisId)?.label
      ?? SCENARIOS[caseId].hypotheses.find(item => item.id === hypothesisId)?.label
      ?? "선택한 원인 후보";
    return { hypothesisId, hypothesisLabel: label };
  };
  const confirm = () => {
    const wrong = ref.gaps.find(g => place[g] !== ref.board[g]);
    if (wrong !== undefined) { const b = ref.blocks[place[wrong]!]; showVerdict(false); setReaction("weak"); setMsg(`${spec.input ? `예시 입력을 요구사항 값(${spec.input.at}${spec.input.unit})에 두고 출력을 보세요. ` : ""}${(b.why ?? "요구사항과 다른 칸이 있어요.").replace(/\s+/g, " ")}`); window.setTimeout(() => setReaction(null), 1800); return; }
    const draft = buildVerificationContract(caseId, { ...hypothesisLabelOf(), suspectSection: section, expectedValue: spec.expect });
    setContract(draft); setSheetStep(true); setReaction(null); play("zip");
    setMsg("요구사항에서 시험 조건과 기대값을 가져왔어요. 설계서를 확인하고 확정하세요.");
  };
  const commit = () => {
    if (!contract) return;
    setConfirmed(true); showVerdict(true, "기준 확정"); play("success"); window.setTimeout(() => play("stamp"), 240);
    try {
      sessionStorage.setItem(`tb-expect-${caseId}`, spec.expect);
      sessionStorage.setItem(contractStorageKey(caseId), JSON.stringify(contract));
    } catch { /* ignore */ }
    setMsg("정상 기준이 정해졌어요. 이 기대값이 실험대의 판정 기준(점선)이 돼요.");
  };
  const solve = () => { setPlace(Object.fromEntries(ref.gaps.map(g => [g, ref.board[g]]))); setCheck(null); setConfirmed(false); setMsg("정답 배치 완료. 연결 확인을 누르세요."); };
  const reset = () => { setPlace(Object.fromEntries(ref.gaps.map(g => [g, null]))); setCheck(null); setConfirmed(false); setPicked(null); setContract(null); setSheetStep(false); setX(spec.input?.min ?? 0); setMsg("초기화했어요."); try { sessionStorage.removeItem(contractStorageKey(caseId)); sessionStorage.removeItem(`tb-expect-${caseId}`); sessionStorage.removeItem(`tb-step04-progress-${caseId}`); } catch { /* ignore */ } play("squish"); };
  // the 설계서 확정 button and the footer button both go straight to STEP04 (no machine-part animation step)
  const goBench = () => { send({ type: "COMPILE", program: ref.program }); send({ type: "OPEN_BENCH" }); };
  const coach = state.completedCases.length ? "" : !filled ? "gaps" : !connected ? "check" : !confirmed ? "confirm" : "next";
  const sideLit = connected;
  const jointsIo = (slot: number) => ({ in: slot > 0 ? ref.joints[slot - 1] : undefined, out: slot < n - 1 ? ref.joints[slot] : undefined });
  const piece = (b: Blk, px: number, py: number, opts: { io?: { in?: Nub; out?: Nub }; locked?: boolean; cls?: string }) =>
    <div key={`${opts.locked ? "fixed" : "move"}-${b.id}`} className={`rpPiece ${b.kind === "hw" ? "hw" : "sw"} ${opts.locked ? "locked" : ""} ${opts.cls ?? ""}`}
      style={{ left: px, top: py, ...({ "--piece": opts.io ? piecePath(opts.io) : "inset(6px 12px 6px 12px round 12px)" } as React.CSSProperties) }}
      title={`${b.label} · ${doesOf(b)}`}
      onDoubleClick={event => { event.stopPropagation(); setZoom(b, event.currentTarget); }}
      onPointerDown={opts.locked ? undefined : event => onDown(event, b.id)}>
      <PieceFace b={b} />
      <button className="rpHelp" aria-label="블록 설명" onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); setZoom(zoom?.b.id === b.id ? null : b, event.currentTarget.parentElement as HTMLElement); }}>?</button>
    </div>;

  const remainingGaps = ref.gaps.filter(g => !place[g]).length;
  const mission = (viewStep ?? stepNow) === 0 ? { action: !filled ? `빈칸 ${remainingGaps}개에 조각 넣기` : "연결 확인으로 구성 검증하기", question: "정상이라면 어떤 로직이어야 할까?" }
    : (viewStep ?? stepNow) === 1 ? { action: "예시 입력을 움직여 값을 요구사항과 비교하기", question: "칸마다 나오는 값이 요구사항과 같을까?" }
      : { action: confirmed ? "설계서 확인 후 다음으로" : "시험 설계서를 확인하고 기준 확정하기", question: "이 기준으로 무엇을 시험할까?" };
  // spoken directions: what the player just did, what this step is, how to do it
  const dirStep = viewStep ?? stepNow;
  const dirLines: string[] = dirStep === 0
    ? [`도미노에서 의심 구간을 ${section}${(() => { const c = section.charCodeAt(section.length - 1) - 44032; return c >= 0 && c < 11172 ? (c % 28 === 0 || c % 28 === 8 ? "로" : "으로") : /[0-9013678LMNRlmnr]$/.test(section) ? "으로" : "로"; })()} 좁혔어요. 이 퍼즐은 그 구간이 정상이라면 어떻게 동작해야 하는지 맞춰 보는 거예요.`, "오른쪽 요구사항을 읽고, 빈칸에 들어갈 조각을 골라 끌어다 놓아요.", filled ? "다 채웠어요. 연결 확인을 눌러요." : "조각을 누르면 하는 일과 표 값을 볼 수 있어요."]
    : dirStep === 1
      ? ["조각 연결이 맞았어요. 이제 값이 맞는지 볼 차례예요.", "예시 입력을 움직이면 칸마다 값이 표시창에 나와요.", "표시창 값이 요구사항과 같으면 아래 버튼을 눌러요."]
      : ["요구사항과 같은 걸 확인했어요. 이 값이 정상 기준이 돼요.", "시험 설계서에는 어떤 입력을 넣고 어떤 값이 나와야 하는지 적혀 있어요.", confirmed ? "기준이 확정됐어요. 다음으로 넘어가요." : "내용을 확인하고 이 기준으로 확정해요."];
  useDevActions({ solve, label: "STEP03" });
  return <div className="refPuzzle v2" data-coach={coach}>
    {reaction && <ActuatorReaction key={reaction} caseId={caseId} ok={reaction === "ok"} />}
    <SceneBackdrop image="/assets/stitch23/investigation-lab.png" position="center" shade="soft" />
    <GameHeader chapter="검증 준비" title="요구사항 기반 퍼즐" distanceMeters={state.policeGapMeters} raceDistanceMeters={state.raceDistance} progressScene={state.scene} onPause={() => send({ type: "PAUSE" })} />
    <PursuitRouteBar compact distance={state.raceDistance} gap={state.policeGapMeters} />
    <StageFolderSubtitle step="puzzle" className="puzzleStageFolder" action="고장 원인을 구별할 시험 조건과 정상 기준을 완성하세요." detail={<>이전 결과: {section} <i>|</i> 의심 구간: {RIG_GOAL[caseId]}</>} />
    <StageIntro id="puzzle-v2" stage="STEP 03" title="퍼즐" goal="정상 동작 로직을 구성하고 시험 기준 만들기" steps={[
      { icon: "puzzle", text: "요구사항을 읽고 빈칸에 조각을 넣은 뒤 '연결 확인'" },
      { icon: "monitor", text: "예시 입력을 움직여 칸마다 값이 요구사항과 같은지 확인하기" },
      { icon: "clipboard", text: "시험 설계서를 확인하고 '기준 확정'" },
    ]} />
    <div className="rp3Work">
      <MissionBar action={mission.action} question={mission.question} progress={{ now: (viewStep ?? stepNow) + 1, total: 3 }} />
      <section className="rpStage" ref={stage} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => setDrag(null)}>
        <div className="rpStageBar" onPointerDown={event => event.stopPropagation()}>
          <nav className="rpLevels" aria-label="이 퍼즐의 아키텍처 수준">{([["시스템", "차량 시스템"], ["E/E 아키텍처", ref.ecu.split(" → ")[0]], ["도메인", ref.domain], ["기능", ref.feature]] as const).map(([level, value], index, all) => <React.Fragment key={level}><span className={index === all.length - 1 ? "on" : ""} aria-current={index === all.length - 1 ? "location" : undefined}><small>{level}</small><b>{value}</b></span>{index < all.length - 1 && <i aria-hidden="true">›</i>}</React.Fragment>)}</nav>
          <div className="rpTools">
            {confirmed && <button className="stageReplayBtn" onClick={() => setReplayOpen(true)}>다시 풀기</button>}
          </div>
        </div>
        <div className="rpBoardZoom rpZoomTools" role="group" aria-label="퍼즐 확대 축소" onPointerDown={event => event.stopPropagation()}><button onClick={() => setScale(value => Math.max(.45, value - .1))}>−</button><button onClick={fitStage}>맞춤</button><button onClick={() => setScale(value => Math.min(1.25, value + .1))}>+</button></div>
        <div className="rpSizer" style={{ width: W * scale, height: H * scale }}><div className={`rpWorld ${connected ? "flowing" : ""}`} style={{ width: W, height: H, transform: `scale(${scale})` }}>
          <div className="rpTray main" style={{ left: slotX(0) - 14, top: MAIN_Y - 66, width: (n - 1) * PITCH + PIECE + 28, height: PIECE + 118 }}><span>입력 → 출력 · 연결이 맞으면 예시 입력의 값이 표시돼요</span></div>
          <div className="rpTray side" style={{ left: slotX(sideStart) - 10, top: SIDE_Y - 12, width: (ref.side.pieces.length - 1) * PITCH + PIECE + 20, height: PIECE + 24 }}><span>{ref.side.label}</span></div>
          <div className="rpTray spare" style={{ left: PAD, top: SPARE_Y - 10, width: W - PAD * 2, height: PIECE + 30 }}><span>남은 조각 · 끌어서 빈칸에 · 두 번 누르면 크게 보기</span></div>
          <svg className={`rpSideWire ${sideLit ? "lit" : ""}`} width={W} height={H}>
            <path d={`M${slotX(ref.side.into) + 70} ${SIDE_Y + 4} V${MAIN_Y + PIECE - 2}`} />
            <path d={`M${slotX(ref.side.into) + 62} ${MAIN_Y + PIECE + 8} L${slotX(ref.side.into) + 70} ${MAIN_Y + PIECE - 2} L${slotX(ref.side.into) + 78} ${MAIN_Y + PIECE + 8}`} />
          </svg>
          <span className={`rpSidePill ${sideLit ? "lit" : ""}`} style={{ left: slotX(ref.side.into) + 82, top: (SIDE_Y + MAIN_Y + PIECE) / 2 - 12 }}>{ref.side.value}</span>
          {ref.side.pieces.map((id, k) => piece(ref.blocks[id], slotX(sideStart + k), SIDE_Y, { locked: true, io: { in: k > 0 ? "square" : undefined, out: k < ref.side.pieces.length - 1 ? "square" : undefined }, cls: "side" }))}
          {ref.gaps.map(g => <button key={`gap-${g}`} className={`rpGap ${picked ? "ready" : ""} ${hoverGap === g ? "near" : ""} ${place[g] ? "taken" : ""}`} style={{ left: slotX(g), top: MAIN_Y }} onClick={() => clickGap(g)} tabIndex={place[g] ? -1 : 0}><b>?</b><small>{g + 1}번 칸</small></button>)}
          {ref.board.map((id, slot) => ref.gaps.includes(slot) ? null : piece(ref.blocks[id], slotX(slot), MAIN_Y, { io: jointsIo(slot), locked: true }))}
          {ref.spares.map(id => {
            const b = ref.blocks[id], slot = inSlot(id); const dragging = drag?.id === id && drag.moved;
            const pos = dragging ? { x: drag!.x, y: drag!.y } : slot !== null ? { x: slotX(slot), y: MAIN_Y } : spareHome(id);
            return piece(b, pos.x, pos.y, { io: slot !== null && !dragging ? jointsIo(slot) : undefined, cls: `${dragging ? "dragging" : ""} ${picked === id ? "picked" : ""} ${snapped === id ? "snapped" : ""} ${check?.failAt === slot && slot !== null ? "fail" : ""}` });
          })}
          {ref.board.map((_, slot) => { const v = valueAt(slot); const vx = slot < n - 1 ? slotX(slot) + 128 : slotX(slot) + 70; return <React.Fragment key={`v-${slot}`}>
            <i className="rpStem" style={{ left: vx, top: slot === n - 1 ? MAIN_Y + PIECE - 6 : MAIN_Y - 22 }} />
            <span className={`rpDisplay ${v ? v.bad ? "bad" : "ok" : ""} ${slot === 0 ? "first" : ""} ${slot === n - 1 ? "last" : ""}`} style={{ left: vx, top: slot === n - 1 ? MAIN_Y + PIECE + 14 : MAIN_Y - 54 }}>{slot === 0 && <small>입력</small>}{slot === n - 1 && <small>출력</small>}{v ? v.text : `? ${unitOf(ref.blocks[ref.board[slot]].out)}`}</span>
          </React.Fragment>; })}
          {ref.board.slice(0, -1).map((_, slot) => <i key={`a-${slot}`} className="rpArrow" style={{ left: slotX(slot) + 128, top: MAIN_Y + 58 }}>▶</i>)}
          {check?.status === "running" && <i className="rpPulse running" style={{ left: slotX(check.step) + 70, top: MAIN_Y + 70 }} />}
        </div></div>
        {zoom && <div className={`rpBubble ${zoom.up ? "up" : ""}`} style={{ left: zoom.x, top: zoom.y }} onPointerDown={event => event.stopPropagation()}>
          <button className="rpBubbleX" aria-label="닫기" onClick={() => setZoomState(null)}>×</button>
          <small>{zoom.b.kind === "hw" ? (zoom.b.ee ? "E/E 부품" : "부품 (하드웨어)") : `SW 블록 · ${KIND_TAG[zoom.b.kind]}`}</small>
          <b>{zoom.b.label}{zoom.b.tag ? ` · ${zoom.b.tag}` : ""}</b>
          <p>{doesOf(zoom.b)}</p>
          {zoom.b.spec && <p className="rpSpec">{zoom.b.spec}</p>}
          <p className="rpFromLine">정비소에서 본 곳: {zoom.b.from} <button className="rpGarageLink" onClick={() => { setBookFocus(zoom.b.label); setZoomState(null); play("pop"); }}>정비소 노트에서 보기</button></p>
        </div>}
      </section>
      <aside className="rpPanel">
        <header><nav role="tablist" aria-label="요구사항과 설계서">
          <button role="tab" aria-selected={panelTab === "req"} className={panelTab === "req" ? "on" : ""} onClick={() => setPanelTab("req")}>요구사항</button>
          <button role="tab" aria-selected={panelTab === "sheet"} className={panelTab === "sheet" ? "on" : ""} disabled={!contract} onClick={() => setPanelTab("sheet")}>설계서</button>
        </nav><OpenBookButton caseId={caseId} /></header>
        {panelTab === "req" || !contract ? <div className="rpReq" role="tabpanel" aria-label="요구사항">
          <small>요구사항 · 정상이면 이렇게</small>
        {ref.req.map((r, k) => <div key={r.text} className={`${ref.gaps.includes(r.slot) ? "gap" : ""} ${confirmed ? "done" : ""}`}><i>{confirmed ? "✓" : k + 1}</i><span>{numify(r.text)}</span></div>)}
          <p className="rpWhy"><b>왜 필요한가</b> {WHY[caseId]}</p>
        </div> : <div className="rpSheetTab" role="tabpanel" aria-label="시험 설계서">
          <button className="rpFolderOpen" onClick={() => setSheetOpen(true)}><Icon name="clipboard" /> 폴더로 크게 보기</button>
          <small>시험 설계서 · STEP04로 넘어가는 기준</small>
          <h3>{contract.stimulus.label}</h3>
          <p className="ssPurpose"><span>시험 목적</span><b>{SHEET_PURPOSE[caseId]}</b></p>
          <h4>입력 조건</h4>
          <table><tbody>
            {contract.execution.initial.map(item => <tr key={item.signalId}><td>{contractSignalLabel(item.signalId)}</td><td><code>{item.value}</code></td><td>{item.unit}</td></tr>)}
            <tr className="ssInput"><td>{contractSignalLabel(contract.execution.stimulus.signalId)} (입력)</td><td><code>{contract.execution.stimulus.startValue} → {contract.execution.stimulus.endValue}</code></td><td>{contract.execution.stimulus.unit}</td></tr>
            <tr className="ssInput"><td>변화 · 유지</td><td><code>{contract.execution.stimulus.rampSeconds} · {contract.execution.stimulus.holdSeconds}</code></td><td>s</td></tr>
          </tbody></table>
          <h4>예상 출력 조건</h4>
          <table><tbody>
            {contract.execution.expectedOutputs.map((item, index) => <tr key={item.signalId}><td>{index === 0 ? contract.expected.signal : contractSignalLabel(item.signalId)}</td><td><code>{item.value}</code></td><td><code>±{item.tolerance}</code></td><td>{item.unit}</td></tr>)}
          </tbody></table>
        </div>}
      </aside>
      <footer className="rpFoot">
        <Directive who={ENGINEER} avatar="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" lines={dirLines} note={numify(msg) as unknown as string} />
        <div className="rpDockRow">
          {connected && spec.input && !sheetStep && <label className="rpSlider"><small>예시 입력 · {spec.input.label}</small><input type="range" min={spec.input.min} max={spec.input.max} value={x} onChange={event => setX(Number(event.target.value))} /><b>{x}{spec.input.unit}</b></label>}
          {confirmed ? <button className="rpExpect" onClick={() => setSheetOpen(true)}><small><Icon name="clipboard" /> 시험 설계서 보기</small><b>{spec.expect}</b></button>
            : sheetStep ? <button className="rpRun" onClick={commit}>이 기준으로 확정</button>
              : connected ? <button className="rpRun" onClick={confirm}>요구사항과 같아요 · 설계서 작성</button>
                : <button className="rpRun" disabled={!filled || check?.status === "running"} onClick={startCheck}>{!filled ? `빈칸 ${ref.gaps.filter(g => !place[g]).length}개 남음` : check?.status === "running" ? "확인 중…" : "연결 확인"}</button>}
        </div>
      </footer>
      <div className="rpNextCell"><button className="rpNext stageProgressAction" disabled={!confirmed} onClick={goBench}>다음 →</button></div>
    </div>
    {sheetOpen && contract && <div className="rpFolderBack" role="dialog" aria-modal="true" aria-label="시험 설계서 폴더" onClick={() => setSheetOpen(false)}>
      <div className="rpFolder" onClick={event => event.stopPropagation()}>
        <div className="rpFolderTabs"><span className="on">시험 설계서</span><span>요구사항</span><button aria-label="닫기" onClick={() => setSheetOpen(false)}>×</button></div>
        <div className="rpFolderPaper">
          <small>STEP04 실험대로 넘어가는 기준 · {RIG_GOAL[caseId]}</small>
          <h3>{contract.stimulus.label}</h3>
          <p className="ssPurpose"><span>시험 목적</span><b>{SHEET_PURPOSE[caseId]}</b></p>
          <div className="rpFolderCols">
            <div><h4>입력 조건</h4><table><tbody>
              {contract.execution.initial.map(item => <tr key={item.signalId}><td>{contractSignalLabel(item.signalId)}</td><td><code>{item.value}</code></td><td>{item.unit}</td></tr>)}
              <tr className="ssInput"><td>{contractSignalLabel(contract.execution.stimulus.signalId)} (입력)</td><td><code>{contract.execution.stimulus.startValue} → {contract.execution.stimulus.endValue}</code></td><td>{contract.execution.stimulus.unit}</td></tr>
              <tr className="ssInput"><td>변화 · 유지</td><td><code>{contract.execution.stimulus.rampSeconds} · {contract.execution.stimulus.holdSeconds}</code></td><td>s</td></tr>
            </tbody></table></div>
            <div><h4>예상 출력 조건</h4><table><tbody>
              {contract.execution.expectedOutputs.map((item, index) => <tr key={item.signalId}><td>{index === 0 ? contract.expected.signal : contractSignalLabel(item.signalId)}</td><td><code>{item.value}</code></td><td><code>±{item.tolerance}</code></td><td>{item.unit}</td></tr>)}
            </tbody></table></div>
          </div>
        </div>
      </div>
    </div>}
    {bookFocus !== null && <OpenBookModal caseId={caseId} layer={3} focus={bookFocus} onClose={() => setBookFocus(null)} />}
    {replayOpen && <ReplayConfirm impact="기존 시험 계약과 STEP04의 실행 기록·판정도 함께 초기화됩니다." onCancel={() => setReplayOpen(false)} onConfirm={() => { setReplayOpen(false); reset(); }} />}
  </div>;
}

/** Bench SW views in the puzzle's piece language. Displays above = normal design, below = this run.
 *  unit  : only the SW unit under test, fed by a test stimulus and read by an observer (test harness).
 *  swint : every SW component of the ECU in its own frame; parts outside the ECU are dashed models.
 *  Wheel = zoom, drag = pan, starts fitted. */
export function RefPuzzleTrack({ caseId, progress, fixed, running, mode = "swint", same = false }: { caseId: CaseId; progress: number; fixed: boolean; running: boolean; mode?: "unit" | "swint"; same?: boolean }) {
  const ref = REF[caseId], scope = SCOPE[caseId];
  const swIds = ref.board.filter(id => ref.blocks[id].kind !== "hw");
  const ids = mode === "unit" ? scope.unit.ids : ref.board;
  const n = ids.length + (mode === "unit" ? 2 : 0);
  const x = (i: number) => PAD + i * PITCH;
  const slot = (id: string) => ids.indexOf(id) + (mode === "unit" ? 1 : 0);
  const W = PAD * 2 + (n - 1) * PITCH + PIECE, H = 330, Y = 96;
  const box = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ s: .6, x: 0, y: 0 });
  const [pan, setPan] = useState<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const fit = () => { const r = box.current?.getBoundingClientRect(); if (!r?.width) return; const s = Math.min(r.width / W, r.height / H, 1); setView({ s, x: (r.width - W * s) / 2, y: (r.height - H * s) / 2 }); };
  useLayoutEffect(() => { fit(); const ob = new ResizeObserver(fit); if (box.current) ob.observe(box.current); return () => ob.disconnect(); }, [W, mode]); // eslint-disable-line react-hooks/exhaustive-deps
  const zoom = (event: React.WheelEvent) => {
    event.preventDefault();
    const r = box.current!.getBoundingClientRect(), px = event.clientX - r.left, py = event.clientY - r.top;
    setView(v => { const s = Math.min(2, Math.max(.3, v.s * (event.deltaY > 0 ? .9 : 1.1))); return { s, x: px - (px - v.x) * s / v.s, y: py - (py - v.y) * s / v.s }; });
  };
  const stepZoom = (factor: number) => setView(v => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return v;
    const s = Math.min(2, Math.max(.3, v.s * factor));
    const px = r.width / 2, py = r.height / 2;
    return { s, x: px - (px - v.x) * s / v.s, y: py - (py - v.y) * s / v.s };
  });
  const shown = Math.ceil(progress * ids.length - 1e-6);
  const io = (k: number) => ({ in: k > 0 ? "round" as Nub : undefined, out: k < n - 1 ? "round" as Nub : undefined });
  return <div className={`rpTrack ${running ? "running" : ""}`} ref={box} onWheel={zoom}
    onPointerDown={event => { setPan({ x: event.clientX, y: event.clientY, ox: view.x, oy: view.y }); (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId); }}
    onPointerMove={event => pan && setView(v => ({ ...v, x: pan.ox + event.clientX - pan.x, y: pan.oy + event.clientY - pan.y }))}
    onPointerUp={() => setPan(null)}>
    <div className="rpTrackWorld" style={{ width: W, height: H, transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})` }}>
      <span className="rpTrackTag top">정상 설계</span>
      <span className="rpTrackTag bottom">{fixed ? "고친 설계" : "시험 대상"}</span>
      {mode === "swint" && scope.swc.map(g => { const a = Math.min(...g.ids.map(slot)), b = Math.max(...g.ids.map(slot)); return <div key={g.name} className="rpSwc" style={{ left: x(a) - 6, top: Y - 14, width: (b - a) * PITCH + PIECE + 12, height: PIECE + 28 }}><span>{g.name}</span></div>; })}
      {mode === "unit" && <><div className="rpHarness" style={{ left: x(0), top: Y }}><b>입력값 인가</b><small>시험 입력을 직접 넣음</small></div><div className="rpHarness" style={{ left: x(n - 1), top: Y }}><b>결과 관측</b><small>출력 값을 기록</small></div>
        <div className="rpSwc unit" style={{ left: x(1) - 6, top: Y - 14, width: (ids.length - 1) * PITCH + PIECE + 12, height: PIECE + 28 }}><span>시험 대상 · {scope.unit.name}</span></div></>}
      {ids.map(id => { const b = ref.blocks[id], k = slot(id), model = mode === "swint" && !swIds.includes(id); return <div key={id} className={`rpPiece ${b.kind === "hw" ? "hw" : "sw"} locked ${model ? "model" : ""}`} style={{ left: x(k), top: Y, cursor: "inherit", ...({ "--piece": piecePath(io(k)) } as React.CSSProperties) }}><PieceFace b={b} />{model && <em className="rpModelTag">모델</em>}</div>; })}
      {Array.from({ length: n - 1 }, (_, k) => <i key={`a${k}`} className="rpArrow" style={{ left: x(k) + 128, top: Y + 58 }}>▶</i>)}
      {ids.map((id, i) => { const on = i < shown || progress >= 1; const want = ref.blocks[id].out ?? ""; const got = fixed || same ? want : ref.field[id] ?? want; const cx = x(slot(id)) + 70; return <React.Fragment key={`d${id}`}>
        <span className={`rpDisplay ${on ? "ok" : ""}`} style={{ left: cx, top: Y - 48 }}>{on ? want : "—"}</span>
        <span className={`rpDisplay ${on ? got === want ? "ok" : "bad" : ""}`} style={{ left: cx, top: Y + PIECE + 18 }}>{on ? got : "—"}</span>
      </React.Fragment>; })}
    </div>
    <div className="rpTrackZoom" role="group" aria-label="SW 로직 확대 축소" onPointerDown={event => event.stopPropagation()}>
      <button aria-label="축소" onClick={() => stepZoom(.82)}>−</button><button onClick={fit}>맞춤</button><button aria-label="확대" onClick={() => stepZoom(1.22)}>+</button>
    </div>
    <span className="rpTrackHint">휠/버튼: 확대·축소 · 끌기: 이동</span>
  </div>;
}
