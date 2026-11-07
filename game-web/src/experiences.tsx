import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { Campaign, CaseId } from "./game/runtime";
import { SCENARIOS } from "./game/scenarios";
import { GameHeader, JourneyProgress, SceneBackdrop } from "./ui/game-shell";
import { HeroConvertible } from "./features/vehicle/HeroConvertible";
import { DevRenderProbe } from "./features/vehicle/DevRenderProbe";
import { FittedPart } from "./features/parts/PartModel";
import { hasPartModel } from "./features/parts/partModels";
import { ComicBurst } from "./ui/ComicBurst";
import { play } from "./ui/sfx";
import { ECUS } from "./sim/components";
import { getComponent } from "./sim/registry";
import { Picto, SimulinkDiagram, blockKind } from "./features/garage/SimulinkDiagram";
import { EeBlueprint } from "./features/garage/EeBlueprint";
// Dev-only A/B switch for render-cost checks: `?car=legacy` shows the previous placeholder car.
const DEV_LEGACY_CAR = import.meta.env.DEV && new URLSearchParams(location.search).get("car") === "legacy";

const A = "/assets/";
type Send = React.Dispatch<any>;
type DomainId = "drive" | "brake" | "steer" | "gear" | "power" | "thermal" | "suspension";

const learningLayers = [
  { name: "Vehicle / System", tag: "운전자 입력·차량 기능·실제 거동" },
  { name: "E/E Architecture", tag: "동일 위치의 센서·ECU·액추에이터" },
  { name: "Control Software", tag: "핵심 제어 로직·상태·보호·출력" },
] as const;

// Garage navigation has three learning lenses.  The content model keeps a
// separate SW architecture row for later integration views, while the garage
// deliberately jumps to the useful detailed controller view instead of
// presenting two nearly identical SW pages.
const garageLayerSource = [0, 1, 3] as const;

const domainContent = {
  drive: {
    label: "구동",
    icon: "⚡",
    accent: "#ef6b54",
    purpose: "운전자 가속 의도를 모터 토크와 바퀴 구동력으로 바꿉니다.",
    functions: ["운전자 토크 요청", "D단 구동 인터록", "인버터 전류·토크 제어", "감속기·차동기어 전달"],
    paths: [
      ["가속 의도", "요구 토크", "전륜 구동력", "차량 가속"],
      ["APS 센서", "VCU", "CAN", "인버터", "PMSM 모터"],
      ["Signal Adapter", "Driver Request", "Drive Permit", "Torque Command"],
      ["입력 제한", "페달 맵", "가용 토크 MIN", "허용 조건 GATE"],
    ],
  },
  brake: {
    label: "제동",
    icon: "◉",
    accent: "#5a86b8",
    purpose: "감속 요구를 회생제동과 마찰제동으로 나눠 안전하게 멈춥니다.",
    functions: ["제동력 요구 계산", "회생·마찰 협조", "ABS·EBD 휠 제어", "ESC 차체 안정 제어"],
    paths: [
      ["감속 의도", "제동력 요구", "휠 제동력", "차량 감속"],
      ["페달 센서", "Brake ECU", "CAN", "인버터·캘리퍼"],
      ["Brake Request", "Blend Manager", "Wheel Control", "Actuator Cmd"],
      ["슬립 판단", "회생 한계", "마찰 보상", "압력 제어"],
    ],
  },
  steer: {
    label: "조향",
    icon: "↔",
    accent: "#8a72b5",
    purpose: "핸들 입력과 EPS 보조를 앞바퀴 각도와 차량 방향으로 바꿉니다.",
    functions: ["전륜 각도 요청", "EPS 보조 토크", "랙·타이로드 전달", "요레이트 안정 협조"],
    paths: [
      ["조향 의도", "보조 토크", "전륜 각도", "진로 변경"],
      ["토크·각도 센서", "EPS ECU", "모터", "랙·타이로드"],
      ["Input Plausibility", "Assist Map", "Current Control", "Angle Feedback"],
      ["속도별 맵", "토크 제한", "전류 PI", "진단 폴백"],
    ],
  },
  power: {
    label: "전원",
    icon: "⏻",
    accent: "#4a9a82",
    purpose: "고전압을 안전하게 연결하고 각 도메인에 사용 가능한 전력을 알립니다.",
    functions: ["Pack Safe 판단", "프리차지·접촉기", "출력 가용량 계산", "OBC·DC/DC·12V 공급"],
    paths: [
      ["START 요청", "전원 안전 판단", "HV 연결", "READY"],
      ["전압·절연 센서", "BMS·VCU", "접촉기", "인버터·부하"],
      ["Pack Monitor", "Power State", "Limit Manager", "Power Enable"],
      ["절연 조건", "프리차지 상태기", "토크 상한", "고장 차단"],
    ],
  },
  gear: {
    label: "변속·주차", icon: "PRND", accent: "#b17752", purpose: "운전자 변속 의도를 검증해 주행 방향과 주차 잠금을 안전하게 결정합니다.",
    functions: ["PRND 입력 판독", "방향 전환 인터록", "P단 잠금 제어", "기어 상태 표시"],
    paths: [["변속 의도", "안전 조건", "주행 방향", "차량 이동"], ["PRND 센서", "VCU", "Park ECU", "구동 허용"], ["Gear Adapter", "Shift Arbiter", "Park Control", "State Output"], ["입력 디바운스", "차속 조건", "브레이크 조건", "상태 래치"]],
  },
  thermal: {
    label: "열관리", icon: "♨", accent: "#d77857", purpose: "배터리·모터·인버터 온도를 목표 범위로 유지해 성능과 수명을 보호합니다.",
    functions: ["온도 상태 추정", "펌프·팬 제어", "냉각 회로 배분", "열 한계 출력 제한"],
    paths: [["발열·외기", "열 요구", "냉각 동작", "온도 유지"], ["온도 센서", "Thermal ECU", "펌프·밸브", "팬"], ["Temp Adapter", "Thermal State", "Actuator Manager", "Feedback"], ["범위 검증", "히스테리시스", "목표 유량", "고장 디레이팅"]],
  },
  suspension: {
    label: "현가", icon: "↕", accent: "#6f8d7c", purpose: "노면 충격을 흡수하고 타이어 접지와 차체 자세를 안정적으로 유지합니다.",
    functions: ["노면 충격 흡수", "댐핑력 제어", "차고·자세 유지", "접지 상태 감시"],
    paths: [["노면 입력", "휠 상하 운동", "스프링·댐퍼", "차체 안정"], ["가속도·높이 센서", "Chassis ECU", "댐퍼 밸브", "현가 장치"], ["Motion Input", "Damping Map", "Valve Command", "Ride Feedback"], ["센서 필터", "차속별 맵", "전류 제한", "폴백 댐핑"]],
  },
} satisfies Record<DomainId, {
  label: string;
  icon: string;
  accent: string;
  purpose: string;
  functions: string[];
  paths: string[][];
}>;

type FeatureFlow = { summary: string; layers: [string[], string[], string[], string[]] };
const featureFlows: Record<DomainId, FeatureFlow[]> = {
  drive: [
    { summary: "페달 요구를 차량이 낼 수 있는 안전한 토크 요청으로 변환합니다.", layers: [["운전자 가속", "차량 토크 요구", "전륜 추진력", "차량 가속"], ["APS 이중 센서", "VCU", "CAN Torque", "인버터·모터"], ["Signal Adapter", "Driver Request SWC", "Torque Arbiter", "Command Port"], ["입력 상관성", "페달 맵", "가용 토크 MIN", "출력 제한"]] },
    { summary: "D단과 READY 조건이 모두 맞을 때만 구동 토크를 허용합니다.", layers: [["D단 선택", "구동 허용", "토크 전달", "안전 출발"], ["PRND 센서", "VCU Interlock", "CAN Permit", "인버터 Enable"], ["Gear Adapter", "Drive Permit SWC", "Safety Gate", "Enable Port"], ["Gear==D", "READY 확인", "고장 래치", "Permit Gate"]] },
    { summary: "토크 명령을 인버터 전류와 모터 축 토크로 정밀하게 만듭니다.", layers: [["토크 요구", "전류 변환", "모터 회전", "축 토크"], ["VCU", "인버터 ECU", "3상 전력", "PMSM 모터"], ["Torque Command", "Current Control", "PWM Service", "Rotor Feedback"], ["dq 변환", "전류 PI", "PWM 제한", "토크 추정"]] },
    { summary: "모터 회전을 전륜 감속기와 차동기어로 나누어 양쪽 바퀴에 전달합니다.", layers: [["모터 회전", "감속", "좌우 분배", "노면 구동력"], ["모터", "감속기", "차동기어", "전륜 속도센서"], ["Speed Observer", "Slip Monitor", "Torque Vector", "Wheel Feedback"], ["기어비", "차동 보정", "슬립 제한", "피드백 필터"]] },
  ],
  brake: [
    { summary: "페달 입력을 목표 감속도와 총 제동력 요구로 변환합니다.", layers: [["페달 조작", "감속 요구", "제동력 계산", "차량 감속"], ["페달 센서", "Brake ECU", "압력 명령", "캘리퍼"], ["Pedal Adapter", "Brake Request", "Force Target", "Command Port"], ["입력 유효성", "감속 맵", "힘 제한", "출력 램프"]] },
    { summary: "가능한 회생제동을 먼저 쓰고 부족분을 마찰제동으로 보충합니다.", layers: [["총 제동 요구", "회생 배분", "마찰 보상", "일관된 감속"], ["Brake ECU", "VCU·인버터", "Hydraulic ECU", "모터·캘리퍼"], ["Blend Manager", "Regen Limit", "Friction Comp", "Actuator Ports"], ["배터리 수용량", "회생 MIN", "잔여력 계산", "압력 변환"]] },
    { summary: "휠 슬립을 감시해 잠김 직전의 바퀴 압력을 빠르게 조절합니다.", layers: [["휠 잠김 징후", "슬립 판단", "압력 조절", "조향 가능 제동"], ["휠속 센서", "ABS ECU", "유압 모듈레이터", "캘리퍼"], ["Wheel Adapter", "Slip Estimator", "ABS State", "Valve Command"], ["차속 추정", "슬립 임계", "감압·유지·증압", "밸브 PWM"]] },
    { summary: "차량의 요 움직임을 감지해 바퀴별 제동력으로 자세를 안정화합니다.", layers: [["회전 불안정", "요 오차", "개별 휠 제동", "차체 안정"], ["요·가속도 센서", "ESC ECU", "Brake ECU", "4륜 캘리퍼"], ["Motion Observer", "Yaw Control", "Wheel Allocator", "Pressure Ports"], ["목표 요율", "오차 PI", "휠 선택", "압력 제한"]] },
  ],
  steer: [
    { summary: "운전자 핸들 각을 목표 전륜 각도로 바꾸고 실제 각도를 추종합니다.", layers: [["핸들 회전", "전륜각 요구", "랙 이동", "진로 변경"], ["각도 센서", "EPS ECU", "랙 위치센서", "전륜"], ["Angle Adapter", "Steer Target", "Rack Command", "Angle Feedback"], ["비율 맵", "각도 제한", "추종 PI", "오차 진단"]] },
    { summary: "차속과 운전자 토크에 맞춰 자연스러운 EPS 보조 토크를 만듭니다.", layers: [["운전자 힘", "보조량 계산", "EPS 모터", "가벼운 조향"], ["토크 센서", "EPS ECU", "모터 인버터", "조향축"], ["Torque Adapter", "Assist Map", "Current Control", "Motor Port"], ["센터 보정", "속도별 맵", "전류 PI", "토크 제한"]] },
    { summary: "EPS 모터의 회전을 랙과 타이로드를 통해 양쪽 전륜에 전달합니다.", layers: [["모터 회전", "랙 직선 이동", "타이로드", "전륜 각도"], ["EPS 모터", "감속기", "랙 센서", "타이로드"], ["Rack Observer", "Travel Limit", "Angle Convert", "Feedback Port"], ["기어비", "스트로크 제한", "좌우 기하", "센서 필터"]] },
    { summary: "요율과 횡가속도를 이용해 불안정한 조향 요구를 보정합니다.", layers: [["조향 요구", "차체 반응", "안정 보정", "진로 유지"], ["조향각 센서", "ESC ECU", "EPS ECU", "전륜"], ["Motion Input", "Stability Coord", "Overlay Torque", "EPS Port"], ["요율 오차", "보정 게인", "개입 제한", "폴백"]] },
  ],
  power: [
    { summary: "전압·절연·온도를 확인해 고전압 팩이 사용 가능한지 판단합니다.", layers: [["START 요청", "팩 안전 확인", "전원 허용", "READY 준비"], ["전압·절연 센서", "BMS", "VCU", "HV 부하"], ["Pack Monitor", "Safety State", "PackSafe Port", "Power Coordinator"], ["전압 범위", "절연 임계", "온도 제한", "Safe Latch"]] },
    { summary: "인버터 커패시터를 먼저 충전한 뒤 주 접촉기를 안전하게 닫습니다.", layers: [["전원 요청", "프리차지", "주 접촉기", "HV 연결"], ["팩 전압센서", "BMS", "프리차지 릴레이", "Main Contactor"], ["Voltage Adapter", "Precharge State", "Contactor Driver", "HV Feedback"], ["전압비 계산", "타임아웃", "용착 진단", "상태 전이"]] },
    { summary: "배터리 상태와 열 한계로 각 도메인이 쓸 수 있는 출력 상한을 계산합니다.", layers: [["팩 상태", "출력 한계", "도메인 배분", "가용 성능"], ["BMS", "VCU", "CAN Limit", "인버터·부하"], ["Limit Receiver", "Power Budget", "Domain Allocator", "Limit Ports"], ["SOC 보정", "온도 디레이팅", "합계 제한", "램프율"]] },
    { summary: "고전압과 저전압 부하를 변환·충전해 차량 전장품을 계속 공급합니다.", layers: [["외부·팩 전력", "전력 변환", "12V 공급", "전장품 동작"], ["충전 인렛", "OBC", "DC/DC", "12V 배터리"], ["Charge Control", "DCDC Manager", "LV Monitor", "Supply Port"], ["충전 인터록", "전압 목표", "전류 제한", "저전압 보호"]] },
  ],
  gear: [
    { summary: "PRND 스위치의 접점과 통신 신호를 서로 검증해 운전자 의도를 확정합니다.", layers: [["PRND 조작", "변속 의도", "유효 상태"], ["PRND 센서", "VCU", "Cluster"], ["Gear Adapter", "Plausibility", "Gear State"], ["디바운스", "상관성", "상태 래치"]] },
    { summary: "차량이 움직이는 중 반대 방향 선택을 막고 브레이크 조건을 확인합니다.", layers: [["방향 요청", "차속·브레이크 확인", "방향 허용"], ["PRND", "VCU", "Brake ECU", "Inverter"], ["Shift Request", "Safety Interlock", "Direction Permit"], ["차속 임계", "브레이크 조건", "거부 진단"]] },
    { summary: "P단에서 파킹 폴 또는 전동 파킹 액추에이터를 안전하게 체결합니다.", layers: [["P 요청", "정지 확인", "잠금 체결", "차량 고정"], ["VCU", "Park ECU", "Lock Actuator", "Position Sensor"], ["Park Request", "Actuator Control", "Lock Feedback"], ["차속 0", "전류 제한", "체결 확인"]] },
    { summary: "확정된 기어 상태를 계기판과 관련 제어기에 일관되게 전달합니다.", layers: [["기어 상태", "네트워크 배포", "표시·제어"], ["VCU", "CAN", "Cluster·ECU"], ["State Publisher", "Timeout Monitor", "Consumers"], ["상태 인코딩", "E2E 확인", "타임아웃"]] },
  ],
  thermal: [
    { summary: "여러 온도 센서를 검증·필터링해 보호에 사용할 열 상태를 만듭니다.", layers: [["부품 발열", "온도 측정", "열 상태"], ["NTC 센서", "Thermal ECU", "VCU"], ["Temp Adapter", "Plausibility", "State Estimator"], ["범위 검사", "필터", "최대값 선택"]] },
    { summary: "목표 온도에 따라 펌프 유량과 팬 회전수를 폐루프로 제어합니다.", layers: [["열 요구", "유량·풍량", "온도 저감"], ["Thermal ECU", "Pump·Fan", "RPM Feedback"], ["Target Manager", "PWM Control", "Feedback Monitor"], ["히스테리시스", "PI 제어", "무응답 진단"]] },
    { summary: "배터리·구동계·실내 회로 사이에서 냉각수 경로와 밸브를 배분합니다.", layers: [["열원 우선순위", "회로 선택", "밸브 전환"], ["VCU", "Valve Manifold", "Coolant Loop"], ["Mode Manager", "Valve Command", "Position Feedback"], ["모드 상태기", "전환 지연", "피드백 확인"]] },
    { summary: "냉각 능력이 부족할 때 구동 출력을 단계적으로 낮춰 부품을 보호합니다.", layers: [["온도 초과", "출력 제한", "부품 보호"], ["Thermal ECU", "VCU", "Inverter"], ["Derate Request", "Torque Limit", "Recovery"], ["단계 임계", "램프 제한", "복귀 히스테리시스"]] },
  ],
  suspension: [
    { summary: "스프링과 댐퍼가 노면 충격을 흡수해 차체로 전달되는 진동을 줄입니다.", layers: [["노면 요철", "휠 운동", "스프링·댐퍼", "차체 진동 저감"], ["타이어", "스프링", "댐퍼", "차체"], ["Road Input", "Ride Model", "Body Response"], ["변위", "속도", "감쇠력"]] },
    { summary: "전자제어 댐퍼가 차속과 차체 운동에 맞춰 감쇠력을 조절합니다.", layers: [["차체 운동", "댐핑 목표", "밸브 전류", "감쇠력"], ["IMU", "Chassis ECU", "Damper Valve", "Damper"], ["Motion Adapter", "Damping Map", "Current Command"], ["필터", "맵 보간", "전류 제한"]] },
    { summary: "차고 센서와 공기 스프링을 이용하는 사양에서는 높이와 자세를 유지합니다.", layers: [["차고 오차", "압력 조절", "차고 복원"], ["Height Sensor", "Chassis ECU", "Compressor·Valve", "Air Spring"], ["Height Control", "Pressure Command", "Feedback"], ["목표 차고", "밸브 상태기", "누설 진단"]] },
    { summary: "휠 가속도와 차고 변화를 감시해 접지 저하 또는 센서 고장을 판별합니다.", layers: [["휠 운동", "접지 추정", "보호 모드"], ["Wheel Sensor", "Chassis ECU", "ESC"], ["Contact Observer", "Fault Monitor", "Fallback"], ["스펙트럼", "임계 판단", "고정 댐핑"]] },
  ],
};

// A vehicle function does not magically have four stages.  Each learning
// lens exposes the number of boundaries that actually matter for that
// function, while retaining the compact source data above as a fallback.
const featureLayerOverrides: Record<DomainId, Record<number, Partial<Record<number, string[]>>>> = {
  drive: {
    0: { 0: ["가속 페달 조작", "가속 의도", "가용 토크 판단", "전륜 추진력", "차량 가속"], 1: ["APS A/B 가속 페달", "VCU", "CAN 토크", "인버터", "전륜 PMSM·감속기"], 3: ["A/B 상관성", "입력 필터", "페달 맵", "구동 허용", "가용 토크 MIN", "램프율", "토크 출력"] },
    1: { 0: ["D단 선택", "READY 확인", "구동 허용", "안전 출발"], 1: ["PRND 센서", "VCU Interlock", "CAN Permit", "인버터 Enable"], 3: ["Gear==D", "HV READY", "브레이크 인터록", "고장 래치", "Permit Gate"] },
    2: { 0: ["토크 요구", "전류 목표", "dq 제어", "PWM", "모터 회전", "축 토크"], 1: ["VCU", "CAN", "인버터 MCU", "3상 브리지", "PMSM", "리졸버"], 3: ["명령 수신", "dq 변환", "전류 PI", "전압 제한", "PWM 생성", "리졸버 피드백", "토크 추정"] },
    3: { 0: ["모터 회전", "1단 감속", "차동 분배", "전륜 반축", "노면 구동력"], 1: ["PMSM", "전륜 감속기", "차동기어", "좌·우 드라이브샤프트", "전륜"], 3: ["회전속도", "기어비", "차동 보정", "슬립 제한", "휠 피드백"] },
  },
  brake: {
    0: { 0: ["페달 조작", "감속 의도", "목표 감속도", "총 제동력", "차량 감속"], 1: ["페달 A/B 센서", "Brake ECU", "압력 제어기", "유압 라인", "4륜 캘리퍼"], 3: ["입력 상관성", "페달 필터", "감속 맵", "힘 제한", "압력 변환", "출력 램프"] },
    1: { 0: ["총 제동 요구", "배터리 수용량", "회생 한계", "마찰 보상", "전·후륜 배분", "일관된 감속"], 1: ["Brake ECU", "VCU", "BMS", "인버터", "Hydraulic ECU", "모터·캘리퍼"], 3: ["요구 수신", "회생 가용량", "회생 MIN", "잔여력 계산", "마찰 압력", "블렌딩 피드백"] },
    2: { 0: ["휠 잠김 징후", "차속 추정", "슬립 계산", "밸브 조절", "조향 가능 제동"], 1: ["4륜 속도센서", "ABS ECU", "유압 모듈레이터", "솔레노이드 밸브", "캘리퍼"], 3: ["휠속 필터", "기준 차속", "슬립 임계", "감압·유지·증압", "밸브 PWM", "재평가"] },
    3: { 0: ["회전 불안정", "목표 요율", "요 오차", "개별 휠 제동", "차체 안정"], 1: ["요·횡가속 센서", "ESC ECU", "Brake ECU", "유압 모듈", "4륜 캘리퍼"], 3: ["센서 융합", "목표 요율", "오차 PI", "휠 선택", "압력 제한", "개입 종료"] },
  },
  steer: {
    0: { 0: ["핸들 회전", "운전자 조향 의도", "목표 전륜각", "랙 이동", "진로 변경"], 1: ["핸들각 센서", "EPS ECU", "EPS 모터", "랙·타이로드", "전륜"], 3: ["각도 보정", "조향비 맵", "목표 랙 위치", "추종 PI", "각도 제한", "피드백 진단"] },
    1: { 0: ["운전자 토크", "차속 보정", "보조 토크", "EPS 모터", "가벼운 조향"], 1: ["토크 센서", "차속 CAN", "EPS ECU", "모터 인버터", "조향축"], 3: ["센터 보정", "토크 필터", "속도별 맵", "복원 토크", "전류 PI", "보호 제한"] },
    2: { 0: ["EPS 모터", "웜 감속", "피니언", "랙 직선 이동", "타이로드", "좌·우 전륜각"], 1: ["EPS 모터", "감속기", "피니언", "랙", "타이로드", "전륜 너클"], 3: ["모터각", "기어비", "랙 변환", "스트로크 제한", "아커만 보정", "각도 피드백"] },
    3: { 0: ["조향 요구", "차체 요 반응", "안정도 판단", "오버레이 토크", "진로 유지"], 1: ["조향각 센서", "IMU", "ESC ECU", "EPS ECU", "전륜"], 3: ["요율 오차", "횡가속 검증", "안정 협조", "보정 게인", "개입 제한", "폴백"] },
  },
  power: {
    0: { 0: ["시동 버튼", "START 요청", "팩 안전 확인", "전원 허용", "READY"], 1: ["START 버튼", "전압·절연·온도 센서", "BMS", "VCU", "HV 부하"], 3: ["START 입력", "전압 범위", "절연 임계", "온도 제한", "Crash 신호", "PackSafe 래치"] },
    1: { 0: ["전원 요청", "부하측 전압 확인", "프리차지", "전압 동기화", "주 접촉기", "HV 연결"], 1: ["팩 전압센서", "BMS", "프리차지 저항", "릴레이", "주 접촉기", "HV 버스"], 3: ["전압비 계산", "Precharge 상태기", "타임아웃", "주 접촉기 명령", "용착 진단", "HV 피드백"] },
    2: { 0: ["팩 상태", "열·SOC 한계", "출력 예산", "도메인 배분", "가용 성능"], 1: ["BMS", "VCU", "Power Coordinator", "CAN Limit", "인버터·부하"], 3: ["SOC 보정", "온도 디레이팅", "충방전 한계", "합계 제한", "도메인 우선순위", "램프율"] },
    3: { 0: ["외부·팩 전력", "OBC", "HV 버스", "DC/DC", "12V 배터리", "전장품 공급"], 1: ["충전 인렛", "OBC", "HV Junction", "DC/DC", "12V 배터리", "LV 부하"], 3: ["충전 인터록", "전압 목표", "전류 제한", "DCDC 제어", "LV 모니터", "저전압 보호"] },
  },
  gear: {},
  thermal: {},
  suspension: {},
};

const getFeatureLayer = (domain: DomainId, feature: number, layer: number) =>
  featureLayerOverrides[domain]?.[feature]?.[layer] ?? featureFlows[domain][feature].layers[layer];

function Tire({ position, steer = false, spin = 0 }: { position: [number, number, number]; steer?: boolean; spin?: number }) {
  return (
    <group position={position} rotation={[spin, steer ? Math.sin(spin * .28) * .42 : 0, Math.PI / 2]}>
      <mesh castShadow><torusGeometry args={[.34, .12, 14, 40]} /><meshStandardMaterial color="#28302f" roughness={.72} /></mesh>
      <mesh><cylinderGeometry args={[.2, .2, .18, 20]} /><meshStandardMaterial color="#ced7d1" metalness={.5} /></mesh>
    </group>
  );
}

function PartLabel({ children, position, className = "" }: { children: React.ReactNode; position: [number, number, number]; className?: string }) {
  return <Html center position={position} distanceFactor={6}><span className={`garage3dLabel ${className}`.trim()}>{children}</span></Html>;
}

function SignalCable({ from, to, color = "#ef8c58", via = [] }: { from: [number, number, number]; to: [number, number, number]; color?: string; via?: [number, number, number][] }) {
  const pulses = useRef<THREE.Mesh[]>([]);
  const curve = useMemo(() => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const points = via.length
      ? [a, ...via.map(point => new THREE.Vector3(...point)), b]
      : [a, a.clone().add(new THREE.Vector3(.3, .55, 0)), b.clone().add(new THREE.Vector3(-.3, .55, 0)), b];
    return new THREE.CatmullRomCurve3(points);
  }, [from.join(","), to.join(","), via.flat().join(",")]);
  useFrame(({ clock }) => {
    pulses.current.forEach((pulse, index) => {
      if (!pulse) return;
      const point = curve.getPointAt((clock.elapsedTime * .22 + index / 3) % 1);
      pulse.position.copy(point);
    });
  });
  return <group>
    <mesh><tubeGeometry args={[curve, 64, .032, 10, false]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.24} transparent opacity={.82} /></mesh>
    {[0, 1, 2].map(index => <mesh key={index} ref={element => { if (element) pulses.current[index] = element; }}><sphereGeometry args={[.075, 16, 12]} /><meshStandardMaterial color="#fff7b7" emissive={color} emissiveIntensity={2.4} /></mesh>)}
  </group>;
}

function GarageFlowPart({ label, position, kind, active, running, role, partId }: { label: string; position: [number, number, number]; kind: HardwareKind; active: boolean; running: boolean; role: string; partId?: string }) {
  const [hovered, setHovered] = useState(false);
  return <group
    position={position}
    scale={active ? 1.08 : .82}
    onPointerOver={event => { event.stopPropagation(); setHovered(true); document.body.style.cursor = "help"; }}
    onPointerOut={() => { setHovered(false); document.body.style.cursor = ""; }}
  >
    <HardwarePart kind={kind} active={active} running={running} partId={partId} />
    {hovered && <PartLabel position={[0, 1.16, 0]}>{role} · {label}</PartLabel>}
  </group>;
}

function GarageWheel({ position, active }: { position: [number, number, number]; active: boolean }) {
  const wheel = useRef<THREE.Group>(null!);
  useFrame((_, delta) => { if (wheel.current) wheel.current.rotation.x += delta * (active ? 2.2 : .25); });
  return <group ref={wheel} position={position}>
    <mesh castShadow rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[.34, .12, 18, 48]} /><meshStandardMaterial color="#1d2424" roughness={.72} /></mesh>
    <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.19, .19, .22, 28]} /><meshStandardMaterial color="#d6d9d4" metalness={.75} roughness={.2} /></mesh>
    {Array.from({ length: 5 }, (_, index) => <mesh key={index} rotation={[0, 0, index * Math.PI / 2.5]}><boxGeometry args={[.035, .32, .035]} /><meshStandardMaterial color="#7b8581" metalness={.65} /></mesh>)}
  </group>;
}

type HardwareKind = "pedal" | "brakepedal" | "gear" | "startbutton" | "sensor" | "ecu" | "motor" | "fan" | "hydraulic" | "caliper" | "steering" | "rack" | "contactor" | "battery";

const domainHardware: Record<DomainId, { kinds: HardwareKind[]; labels: string[] }> = {
  drive: { kinds: ["pedal", "ecu", "motor", "motor"], labels: ["APS 이중 페달 센서", "VCU 제어기", "인버터", "PMSM 모터·감속기"] },
  brake: { kinds: ["brakepedal", "ecu", "hydraulic", "caliper"], labels: ["브레이크 페달·이중 센서", "Brake ECU", "유압 모듈레이터", "디스크·캘리퍼"] },
  steer: { kinds: ["steering", "ecu", "motor", "rack"], labels: ["조향각·토크 센서", "EPS ECU", "EPS 보조 모터", "랙·타이로드"] },
  gear: { kinds: ["gear", "ecu", "contactor", "motor"], labels: ["PRND 셀렉터", "VCU 변속 중재", "P단 잠금 액추에이터", "인버터 방향 허용"] },
  power: { kinds: ["startbutton", "ecu", "contactor", "battery"], labels: ["START 시동 버튼", "BMS·VCU", "프리차지·접촉기", "고전압 배터리"] },
  thermal: { kinds: ["sensor", "ecu", "hydraulic", "fan"], labels: ["온도·유량 센서", "Thermal ECU", "냉각 펌프·밸브", "라디에이터 팬"] },
  suspension: { kinds: ["sensor", "ecu", "hydraulic", "rack"], labels: ["차고·가속도 센서", "Chassis ECU", "전자 댐퍼 밸브", "스프링·댐퍼"] },
};

// Garage/bench label → code-built part model (src/features/parts). Labels without a
// model yet keep the primitive HardwarePart below, so new models appear automatically.
const partModelFor = (domain: DomainId, label: string): string | undefined => {
  const id =
    /START 버튼|시동 버튼|START 시동/.test(label) ? "start_button"
    : /^PRND/.test(label) ? "gear_selector"
    : /APS|페달/.test(label) ? (domain === "brake" ? "brake_pedal" : "accel_pedal")
    : /조향각|^각도 센서/.test(label) ? "steering_wheel"
    : /휠속|Wheel Sensor|속도센서/.test(label) ? "wheel_speed_sensor"
    : /리졸버/.test(label) ? "rotor_position_sensor"
    : /NTC/.test(label) ? "motor_temp_sensor"
    : /^BMS/.test(label) ? "bms"
    : /^VCU/.test(label) ? "vcu"
    : /인버터 ECU|MCU/.test(label) ? "mcu"
    : /Thermal ECU/.test(label) ? "thermal_ecu"
    : /(Brake|ABS|ESC|Hydraulic) ECU/.test(label) ? "brake_ecu"
    : /EPS ECU/.test(label) ? "eps_ecu"
    : /EPS 모터/.test(label) ? "eps_motor"
    : /고전압 배터리/.test(label) ? "hv_battery"
    : /12V 배터리/.test(label) ? "lv_battery"
    : /Main Contactor|접촉기|프리차지/.test(label) ? "main_contactor"
    : /DC\/DC/.test(label) ? "dcdc_converter"
    : /^OBC/.test(label) ? "obc"
    : /충전 인렛/.test(label) ? "charging_port"
    : /^인버터|Inverter/.test(label) ? "inverter"
    : /PMSM|^모터$/.test(label) ? "traction_motor"
    : /감속기/.test(label) ? "reduction_gear"
    : /차동기어/.test(label) ? "differential"
    : /드라이브 ?샤프트/.test(label) ? "drive_shaft"
    : /^전륜$|휠·허브/.test(label) ? "wheel"
    : /유압 모듈레이터/.test(label) ? "hydraulic_modulator"
    : /캘리퍼/.test(label) ? "brake_caliper"
    : /타이로드|랙·/.test(label) ? "steering_rack"
    : /냉각 팬|라디에이터 팬/.test(label) ? "cooling_fan"
    : /냉각 펌프|Pump·Fan/.test(label) ? "cooling_pump"
    : undefined;
  return id && hasPartModel(id) ? id : undefined;
};

function HardwarePart({ kind, active = true, running = true, partId }: { kind: HardwareKind; active?: boolean; running?: boolean; partId?: string }) {
  if (partId) return <group rotation={[0, -.55, 0]}><FittedPart id={partId} size={1.3} demo={active && running} /></group>;
  return <PrimitiveHardwarePart kind={kind} active={active} running={running} />;
}

function PrimitiveHardwarePart({ kind, active = true, running = true }: { kind: HardwareKind; active?: boolean; running?: boolean }) {
  const root = useRef<THREE.Group>(null!);
  useFrame(({ clock }, delta) => {
    if (!root.current) return;
    const pulse = Math.sin(clock.elapsedTime * 5.2);
    if (kind === "sensor") root.current.scale.setScalar(running && active ? 1 + pulse * .045 : 1);
    else root.current.scale.setScalar(1);
    if (!running) return;
    if (kind === "motor" || kind === "fan") root.current.rotation.z += delta * (active ? 2.6 : .18);
    if (kind === "steering") root.current.rotation.y = Math.sin(clock.elapsedTime * 1.2) * .22;
    if (kind === "pedal" || kind === "brakepedal") root.current.rotation.x = active ? -.08 + Math.sin(clock.elapsedTime * 3.2) * .09 : 0;
    if (kind === "gear") root.current.rotation.z = active ? Math.sin(clock.elapsedTime * 1.7) * .06 : 0;
    if (kind === "startbutton") root.current.position.z = active ? Math.max(0, pulse) * -.035 : 0;
  });
  const hot = active ? "#f08a52" : "#81918d";
  const glow = active ? .65 : .02;
  return <group ref={root}>
    {kind === "pedal" && <><RoundedBox args={[.72,.12,.74]} radius={.06} position={[-.23,-.62,0]}><meshStandardMaterial color="#606967" metalness={.72} roughness={.25} /></RoundedBox><mesh position={[-.08,-.17,0]} rotation={[0,0,-.22]} castShadow><boxGeometry args={[.17,1.03,.14]} /><meshStandardMaterial color="#b9c3c0" metalness={.86} roughness={.18} /></mesh><RoundedBox args={[.66,.45,.16]} radius={.06} position={[.13,.36,0]} rotation={[0,0,-.22]} castShadow><meshStandardMaterial color="#242a29" roughness={.65} /></RoundedBox>{[-.18,0,.18].map(y => <mesh key={y} position={[.13,.36+y, .09]} rotation={[0,0,-.22]}><boxGeometry args={[.5,.035,.025]} /><meshStandardMaterial color="#7d8985" /></mesh>)}<mesh position={[-.39,-.52,.04]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.2,.2,.34,28]} /><meshStandardMaterial color={hot} metalness={.48} emissive={hot} emissiveIntensity={glow*.45} /></mesh><mesh position={[-.39,-.52,.23]}><boxGeometry args={[.18,.14,.2]} /><meshStandardMaterial color="#d2b86c" metalness={.7} /></mesh></>}
    {kind === "brakepedal" && <><RoundedBox args={[.82,.13,.78]} radius={.06} position={[-.24,-.62,0]}><meshStandardMaterial color="#5f6966" metalness={.74} /></RoundedBox><mesh position={[-.05,-.14,0]} rotation={[0,0,-.1]}><boxGeometry args={[.2,1.05,.16]} /><meshStandardMaterial color="#c3cbc8" metalness={.9} /></mesh><RoundedBox args={[.78,.4,.18]} radius={.045} position={[0,.38,0]}><meshStandardMaterial color="#252b2a" roughness={.7} /></RoundedBox>{[-.26,-.09,.09,.26].map(x => <mesh key={x} position={[x,.38,.1]}><boxGeometry args={[.05,.28,.025]} /><meshStandardMaterial color="#7f8986" /></mesh>)}<mesh position={[-.34,-.48,.02]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.12,.12,.52,24]} /><meshStandardMaterial color={hot} emissive={hot} emissiveIntensity={glow*.55} metalness={.58} /></mesh><mesh position={[-.68,-.48,.02]}><sphereGeometry args={[.16,20,14]} /><meshStandardMaterial color="#c7d3cf" metalness={.82} /></mesh></>}
    {kind === "gear" && <><RoundedBox args={[1.02,.34,.78]} radius={.13} position={[0,-.38,0]}><meshStandardMaterial color="#303a38" roughness={.42} metalness={.35} /></RoundedBox><mesh position={[0,.02,0]} rotation={[0,0,-.17]}><cylinderGeometry args={[.09,.12,.72,22]} /><meshStandardMaterial color="#c6cfcb" metalness={.85} /></mesh><RoundedBox args={[.38,.36,.32]} radius={.1} position={[.06,.43,0]} rotation={[0,0,-.17]}><meshStandardMaterial color={hot} roughness={.32} metalness={.42} emissive={hot} emissiveIntensity={glow*.3} /></RoundedBox><mesh position={[-.31,-.18,.4]} rotation={[Math.PI/2,0,0]}><circleGeometry args={[.1,24]} /><meshStandardMaterial color="#63c49a" emissive="#32ad7c" emissiveIntensity={1.3} /></mesh></>}
    {kind === "startbutton" && <><RoundedBox args={[1.05,.66,.82]} radius={.14}><meshStandardMaterial color="#3a4643" metalness={.55} roughness={.28} /></RoundedBox><mesh position={[0,.02,.44]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.28,.07,18,48]} /><meshStandardMaterial color={hot} emissive={hot} emissiveIntensity={glow*1.5} metalness={.65} /></mesh><mesh position={[0,.02,.45]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.21,.21,.08,36]} /><meshStandardMaterial color="#16201e" metalness={.42} roughness={.22} /></mesh><mesh position={[0,.07,.5]}><torusGeometry args={[.075,.018,12,24,Math.PI*1.55]} /><meshStandardMaterial color="#b9f1d8" emissive="#62d8a6" emissiveIntensity={1.6} /></mesh><mesh position={[0,.13,.5]}><boxGeometry args={[.018,.11,.018]} /><meshStandardMaterial color="#b9f1d8" emissive="#62d8a6" emissiveIntensity={1.6} /></mesh></>}
    {kind === "sensor" && <><mesh castShadow><cylinderGeometry args={[.34, .4, .78, 32]} /><meshStandardMaterial color="#d2ddd9" metalness={.75} roughness={.22} /></mesh><mesh position={[0, .5, 0]}><cylinderGeometry args={[.14, .14, .3, 20]} /><meshStandardMaterial color={hot} emissive={hot} emissiveIntensity={glow} /></mesh>{[-.16, .16].map(x => <mesh key={x} position={[x, -.5, 0]}><boxGeometry args={[.09, .3, .09]} /><meshStandardMaterial color="#d7b96b" /></mesh>)}</>}
    {kind === "ecu" && <><RoundedBox args={[1.15, .72, .84]} radius={.13} castShadow><meshStandardMaterial color={active ? "#7563a4" : "#707c79"} metalness={.55} roughness={.24} emissive={active ? "#3b285f" : "#000"} emissiveIntensity={glow * .45} /></RoundedBox><RoundedBox args={[.78, .08, .46]} radius={.02} position={[0, .4, 0]}><meshStandardMaterial color="#b5d7cc" metalness={.5} /></RoundedBox>{[-.42, -.14, .14, .42].map(x => <mesh key={x} position={[x, -.43, .28]}><boxGeometry args={[.08, .22, .12]} /><meshStandardMaterial color="#e4c874" metalness={.7} /></mesh>)}</>}
    {kind === "motor" && <><mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[.55, .55, .92, 40]} /><meshStandardMaterial color="#aab5b2" metalness={.78} roughness={.22} /></mesh>{[-.28, 0, .28].map(z => <mesh key={z} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, z]}><torusGeometry args={[.39, .055, 12, 36]} /><meshStandardMaterial color={hot} emissive={hot} emissiveIntensity={glow} metalness={.5} /></mesh>)}<mesh position={[0, 0, -.62]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.14, .14, .42, 24]} /><meshStandardMaterial color="#d7dcd8" metalness={.9} /></mesh></>}
    {kind === "fan" && <><mesh><cylinderGeometry args={[.16, .16, .28, 24]} /><meshStandardMaterial color="#d9e1de" metalness={.72} /></mesh>{Array.from({ length: 7 }, (_, index) => <mesh key={index} rotation={[0, 0, index * Math.PI * 2 / 7]} position={[0, .38, 0]}><RoundedBox args={[.22, .7, .08]} radius={.08} position={[.08, .25, 0]}><meshStandardMaterial color={hot} emissive={hot} emissiveIntensity={glow} metalness={.35} /></RoundedBox></mesh>)}<mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.78, .08, 16, 48]} /><meshStandardMaterial color="#667873" metalness={.48} /></mesh></>}
    {kind === "hydraulic" && <><RoundedBox args={[1.1, .62, .82]} radius={.12} castShadow><meshStandardMaterial color="#b5c1bd" metalness={.7} /></RoundedBox>{[-.34, -.11, .11, .34].map(x => <mesh key={x} position={[x, .46, 0]}><cylinderGeometry args={[.09, .12, .36, 18]} /><meshStandardMaterial color={hot} emissive={hot} emissiveIntensity={glow} /></mesh>)}<mesh position={[0, -.44, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.08, .08, 1.42, 16]} /><meshStandardMaterial color="#d8a75d" /></mesh></>}
    {kind === "caliper" && <><mesh rotation={[0, Math.PI / 2, 0]}><cylinderGeometry args={[.64, .64, .14, 42]} /><meshStandardMaterial color="#a8b1ae" metalness={.8} roughness={.28} /></mesh><mesh rotation={[0, Math.PI / 2, 0]} position={[.04, 0, 0]}><torusGeometry args={[.39, .12, 14, 34, Math.PI * 1.45]} /><meshStandardMaterial color={hot} emissive={hot} emissiveIntensity={glow} /></mesh></>}
    {kind === "steering" && <><mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.58, .11, 14, 40]} /><meshStandardMaterial color="#394845" roughness={.55} /></mesh>{[0, 1, 2].map(i => <mesh key={i} rotation={[Math.PI / 2, 0, i * Math.PI * 2 / 3]}><boxGeometry args={[.11, 1.02, .1]} /><meshStandardMaterial color={hot} emissive={hot} emissiveIntensity={glow} /></mesh>)}<mesh position={[0, -.65, 0]}><cylinderGeometry args={[.09, .09, .7, 18]} /><meshStandardMaterial color="#c6cfcb" metalness={.7} /></mesh></>}
    {kind === "rack" && <><mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.11, .11, 1.9, 24]} /><meshStandardMaterial color="#bec7c3" metalness={.82} /></mesh>{[-.92, .92].map(x => <group key={x} position={[x, 0, 0]}><mesh rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[.36, .1, 14, 32]} /><meshStandardMaterial color="#27322f" /></mesh><mesh><boxGeometry args={[.18, .58, .18]} /><meshStandardMaterial color={hot} /></mesh></group>)}</>}
    {kind === "contactor" && <><RoundedBox args={[1.15, .65, .9]} radius={.13} castShadow><meshStandardMaterial color="#485c57" metalness={.5} /></RoundedBox>{[-.31, .31].map(x => <group key={x} position={[x, .48, 0]}><mesh><cylinderGeometry args={[.12, .16, .26, 22]} /><meshStandardMaterial color={hot} emissive={hot} emissiveIntensity={glow} /></mesh><mesh position={[0, .2, 0]}><torusGeometry args={[.15, .045, 10, 24]} /><meshStandardMaterial color="#e2bd65" /></mesh></group>)}</>}
    {kind === "battery" && <><RoundedBox args={[1.45, .42, 1.1]} radius={.12} castShadow><meshStandardMaterial color={active ? "#4c8c82" : "#778783"} metalness={.38} emissive={active ? "#214e46" : "#000"} emissiveIntensity={glow * .5} /></RoundedBox>{[-.48, 0, .48].flatMap(x => [-.32, .32].map(z => <mesh key={`${x}-${z}`} position={[x, .29, z]}><cylinderGeometry args={[.12, .12, .28, 18]} /><meshStandardMaterial color="#d7dedb" metalness={.68} /></mesh>))}<mesh position={[0, .53, 0]}><boxGeometry args={[1.2, .08, .08]} /><meshStandardMaterial color={hot} emissive={hot} emissiveIntensity={glow} /></mesh></>}
  </group>;
}

const hardwareKindFor = (domain: DomainId, label: string, index: number, last: number): HardwareKind => {
  if (/START|시동/.test(label)) return "startbutton";
  if (/PRND|기어|D단/.test(label)) return "gear";
  if (/페달/.test(label)) return domain === "brake" ? "brakepedal" : "pedal";
  if (/핸들|조향각|토크 센서/.test(label)) return index === 0 ? "steering" : "sensor";
  if (/센서|IMU|리졸버/.test(label)) return "sensor";
  if (/ECU|VCU|BMS|CAN|Coordinator|Interlock|MCU/.test(label)) return "ecu";
  if (/유압|밸브|릴레이/.test(label)) return "hydraulic";
  if (/캘리퍼|디스크/.test(label)) return "caliper";
  if (/랙|타이로드|피니언|너클/.test(label)) return "rack";
  if (/접촉기|Precharge|HV Junction/.test(label)) return "contactor";
  if (/배터리|HV 버스|LV 부하|HV 부하/.test(label)) return "battery";
  if (/팬/.test(label)) return "fan";
  if (/모터|인버터|PMSM|감속기|차동|드라이브샤프트|전륜/.test(label)) return "motor";
  return index === last ? (domain === "brake" ? "caliper" : domain === "steer" || domain === "suspension" ? "rack" : domain === "power" ? "battery" : domain === "thermal" ? "fan" : domain === "gear" ? "gear" : "motor") : "ecu";
};

function DomainSignature({ domain, activeStep }: { domain: DomainId; activeStep: number }) {
  if (domain === "drive") return <group position={[1.55, .16, -.95]}>
    <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.12, .12, 3.3, 20]} /><meshStandardMaterial color="#727c79" metalness={.84} /></mesh>
    <mesh><sphereGeometry args={[.42, 24, 18]} /><meshStandardMaterial color="#9aa6a2" metalness={.78} roughness={.22} /></mesh>
    {[-1.65, 1.65].map(x => <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[.46, .12, 16, 36]} /><meshStandardMaterial color="#27312f" /></mesh>)}
    <SignalCable from={[-1.4, .18, .25]} to={[1.25, .18, .25]} color={activeStep > 1 ? "#ff7b49" : "#8c9892"} />
  </group>;
  if (domain === "brake") return <group position={[0, .12, 0]}>
    {[-2.25, 2.25].flatMap(x => [-.92, .92].map(z => <group key={`${x}-${z}`} position={[x, 0, z]} scale={.47}><HardwarePart kind="caliper" active={activeStep >= 2} running={false} /></group>))}
    {[-.92, .92].map(z => <React.Fragment key={z}><SignalCable from={[-1.5, .24, z]} to={[2.05, .24, z]} color={activeStep >= 2 ? "#4b9dc1" : "#81918d"} /></React.Fragment>)}
  </group>;
  if (domain === "steer") return <group position={[.45, .15, .5]}>
    <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.11, .11, 4.5, 26]} /><meshStandardMaterial color="#c5cdc8" metalness={.85} /></mesh>
    {[-2.3, 2.3].map(x => <group key={x} position={[x, 0, 0]} rotation={[0, activeStep > 1 ? Math.sign(x) * .22 : 0, 0]}><mesh rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[.52, .14, 18, 42]} /><meshStandardMaterial color="#26302e" /></mesh><SignalCable from={[0, .06, 0]} to={[Math.sign(x) * .65, .06, 0]} color="#8d75b6" /></group>)}
  </group>;
  if (domain === "gear") return <group position={[0,.18,0]}>
    <group position={[-2.1,.45,.25]} scale={.72}><HardwarePart kind="gear" active={activeStep < 2} partId={partModelFor("gear", "PRND")} /></group>
    <RoundedBox args={[1.55,.7,1.05]} radius={.16} position={[0,.38,0]}><meshPhysicalMaterial color="#667672" metalness={.62} roughness={.24} clearcoat={.55} /></RoundedBox>
    {[-.5,0,.5].map(x => <mesh key={x} position={[x,.4,.58]}><cylinderGeometry args={[.13,.13,.18,24]} /><meshStandardMaterial color={activeStep>1?"#f0a154":"#b7c1bc"} metalness={.75} /></mesh>)}
    <group position={[2.05,.32,-.15]} scale={.78}><HardwarePart kind="contactor" active={activeStep>1} /></group>
    <SignalCable from={[-1.55,.65,.05]} to={[-.72,.65,.05]} color="#b17752" /><SignalCable from={[.72,.65,.05]} to={[1.55,.65,.05]} color="#ef8a4f" />
  </group>;
  if (domain === "thermal") return <group position={[0,.16,0]}>
    <group position={[-2.15,.55,0]} scale={.58}><HardwarePart kind="sensor" active={activeStep<2} partId={partModelFor("thermal", "NTC 센서")} /></group>
    <mesh position={[0,.44,0]} rotation={[0,0,Math.PI/2]}><torusGeometry args={[1.12,.13,18,60]} /><meshStandardMaterial color="#4d94aa" metalness={.44} roughness={.32} /></mesh>
    <group position={[2.05,.55,0]} scale={.78}><HardwarePart kind="fan" active={activeStep>1} /></group>
    <SignalCable from={[-1.55,.62,.12]} to={[-.7,.62,.12]} color="#4b9dc1" /><SignalCable from={[.72,.62,.12]} to={[1.48,.62,.12]} color="#d77857" />
  </group>;
  if (domain === "suspension") return <group position={[0,.08,0]}>
    {[-2.05,2.05].flatMap(x=>[-.78,.78].map(z=><group key={`${x}-${z}`} position={[x,.55,z]}><mesh><cylinderGeometry args={[.13,.17,1.15,20]} /><meshStandardMaterial color="#aab5b1" metalness={.72} /></mesh><mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[.28,.06,12,30]} /><meshStandardMaterial color={activeStep>1?"#6f8d7c":"#6a7470"} metalness={.65} /></mesh></group>))}
    <RoundedBox args={[4.9,.18,1.75]} radius={.08} position={[0,.38,0]}><meshStandardMaterial color="#5a6d67" metalness={.48} /></RoundedBox>
    {[-.78,.78].map(z=><SignalCable key={z} from={[-1.8,.86,z]} to={[1.8,.86,z]} color={activeStep>1?"#6f8d7c":"#91a19a"} />)}
  </group>;
  return <group position={[0, .04, 0]}>
    <RoundedBox args={[4.8, .24, 1.7]} radius={.12}><meshStandardMaterial color="#3e8578" metalness={.42} roughness={.36} emissive="#174a40" emissiveIntensity={activeStep > 1 ? .45 : .1} /></RoundedBox>
    {[-1.65,-.55,.55,1.65].flatMap(x => [-.48,.48].map(z => <mesh key={`${x}-${z}`} position={[x,.18,z]}><boxGeometry args={[.72,.12,.54]} /><meshStandardMaterial color="#9ebdb2" metalness={.35} /></mesh>))}
    <SignalCable from={[-2.05, .32, -.62]} to={[2.05, .32, -.62]} color={activeStep > 1 ? "#f08a42" : "#83918c"} />
  </group>;
}

/** Empty slot left after "빼 보기": a red dashed ring where the part used to be. */
function RemovedPartMarker({ position }: { position: [number, number, number] }) {
  return <group position={position}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.38, 0]}><ringGeometry args={[.42, .5, 40]} /><meshBasicMaterial color="#e0483c" transparent opacity={.85} /></mesh>
    <PartLabel position={[0, .25, 0]} className="removedPartLabel">🚫 빠짐</PartLabel>
  </group>;
}

function DomainFlowRig({ domain, feature, activeStep = 0, compact = false, running = true, removed = null }: { domain: DomainId; feature: number; activeStep?: number; compact?: boolean; running?: boolean; removed?: number | null }) {
  const labels = getFeatureLayer(domain, feature, 1);
  const last = labels.length - 1;
  const positions = labels.map((_, index) => {
    const t = last ? index / last : .5;
    if (index === 0) return [-2.72, .5, 1.22] as [number, number, number];
    if (index === last) return [2.66, .78, -1.04] as [number, number, number];
    const x = -2.65 + t * 5.3;
    const direction = domain === "drive" || domain === "power" ? -1 : 1;
    const z = (t - .5) * 1.35 * direction;
    const y = domain === "power" ? .62 - Math.abs(t - .5) * .18 : domain === "steer" ? .68 + (t - .5) * -.18 : .7;
    return [x, y, z] as [number, number, number];
  });
  return <group scale={compact ? .58 : labels.length > 5 ? .68 : .76}>
    <DomainSignature domain={domain} activeStep={activeStep} />
    {labels.map((label, index) => { const position = positions[index]; const kind = hardwareKindFor(domain, label, index, last); const role = index === 0 ? "INPUT" : index === last ? "OUTPUT" : /ECU|VCU|BMS|CAN/.test(label) ? "CONTROL" : "PLANT"; return removed === index ? <RemovedPartMarker key={`${label}-${index}`} position={position} /> : <GarageFlowPart key={`${label}-${index}`} label={label} position={position} kind={kind} active={activeStep === index} running={running} role={role} partId={partModelFor(domain, label)} />; })}
    {positions.slice(0, -1).map((position, index) => { const next = positions[index + 1]; return <SignalCable key={`${position.join("-")}`} from={[position[0] + .32, position[1] + .04, position[2]]} to={[next[0] - .32, next[1] + .04, next[2]]} color={removed !== null && (index === removed || index + 1 === removed) ? "#e0483c" : index < activeStep ? "#f2c653" : index === activeStep ? "#ff7b49" : domain === "brake" ? "#4b9dc1" : domain === "steer" ? "#8d75b6" : domain === "power" ? "#4a9a82" : "#7ca8b3"} />; })}
    {!compact && <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0,-.04,0]}><ringGeometry args={[3.45,3.55,96]} /><meshStandardMaterial color="#c3d2cb" transparent opacity={.42} /></mesh>}
  </group>;
}

function VehiclePlatformShell({ active }: { active: boolean }) {
  const bodyProfile = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-3.6, .32);
    shape.lineTo(-3.48, .72);
    shape.quadraticCurveTo(-3.25, 1.02, -2.65, 1.08);
    shape.lineTo(-1.82, 1.12);
    shape.lineTo(-1.06, 2.02);
    shape.quadraticCurveTo(-.72, 2.34, -.14, 2.42);
    shape.lineTo(1.25, 2.4);
    shape.quadraticCurveTo(1.65, 2.34, 2.05, 1.88);
    shape.lineTo(2.58, 1.15);
    shape.lineTo(3.3, 1.02);
    shape.quadraticCurveTo(3.55, .94, 3.62, .62);
    shape.lineTo(3.58, .32);
    shape.closePath();
    return shape;
  }, []);
  const harnessBranches: { from: [number, number, number]; to: [number, number, number]; color: string; via: [number, number, number][] }[] = [
    { from: [-2.86,.27,-.92], to: [2.72,.34,-.92], color: "#f18a43", via: [[-1.95,.16,-.92],[0,.14,-.92],[1.65,.16,-.92]] },
    { from: [-2.7,.22,-.62], to: [2.58,.25,-.55], color: "#f2a15f", via: [[-1.5,.11,-.62],[.15,.1,-.6],[1.75,.13,-.56]] },
    { from: [-2.82,.2,.78], to: [2.74,.22,.72], color: "#4f91a9", via: [[-1.7,.08,.82],[-.25,.07,.8],[1.45,.1,.75]] },
    { from: [-2.3,.2,.52], to: [1.9,.22,.45], color: "#d7bf58", via: [[-1.25,.06,.52],[0,.05,.5],[1.05,.08,.46]] },
    { from: [-1.9,.18,-.28], to: [.82,.2,-.25], color: "#7f6aa4", via: [[-1.1,.04,-.3],[-.15,.04,-.28],[.38,.08,-.26]] },
  ];
  return <group position={[0, .12, 0]}>
    <mesh position={[0,.03,-1.4]} castShadow>
      <extrudeGeometry args={[bodyProfile,{depth:2.8,bevelEnabled:true,bevelThickness:.07,bevelSize:.06,bevelSegments:3}]} />
      <meshPhysicalMaterial color="#d94e45" transparent opacity={active ? .2 : .035} transmission={active ? .18 : 0} roughness={.16} metalness={.34} clearcoat={.9} clearcoatRoughness={.13} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
    <RoundedBox args={[6.86,.17,2.42]} radius={.08} position={[0,.28,0]}><meshStandardMaterial color="#53645f" metalness={.78} roughness={.25} transparent opacity={active?.72:.25} /></RoundedBox>
    <RoundedBox args={[3.95,.22,2.08]} radius={.16} position={[-.05,.08,0]}><meshStandardMaterial color="#305f58" metalness={.46} roughness={.35} emissive="#173b36" emissiveIntensity={.18} /></RoundedBox>
    {[-2.55, 2.55].flatMap(x => [-1.19, 1.19].map(z => <GarageWheel key={`${x}-${z}`} position={[x, .46, z]} active={active} />))}
    {[-1.08,1.08].map(z => <mesh key={z} position={[0,.3,z]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.055,.055,5.72,18]} /><meshStandardMaterial color="#8d9995" metalness={.82} transparent opacity={active?.66:.22} /></mesh>)}
    {harnessBranches.map((wire,index)=><SignalCable key={index} {...wire} />)}
    {[[-1.85,-.9],[-.55,.88],[.6,-.84],[1.72,.82]].map(([x,z],index)=><React.Fragment key={`${x}-${z}`}>
      <SignalCable from={[x,.14,z]} to={[x,.72,z]} via={[[x,.08,z],[x+.12,.28,z]]} color={index%2?"#4f91a9":"#d7bf58"} />
      <group position={[x,.7,z]} scale={.34}><HardwarePart kind="ecu" active={index===1} running /></group>
    </React.Fragment>)}
    {[[-.72,-.58],[.72,-.58]].map(([x,z])=><group key={x} position={[x,.78,z]}><RoundedBox args={[.54,.72,.5]} radius={.14}><meshStandardMaterial color="#c6b89d" roughness={.72} /></RoundedBox><RoundedBox args={[.54,.18,.5]} radius={.1} position={[-.14,.4,0]}><meshStandardMaterial color="#9e917b" /></RoundedBox></group>)}
    <PartLabel className="garageStaticLabel" position={[0,2.82,0]}>세단 패키지 4.70m × 1.85m × 1.45m · 하부 배터리/HV·LV 분기 하니스</PartLabel>
  </group>;
}

function FullVehicleSystem({ domain, feature, activeStep, removed = null, shell = false }: { domain: DomainId; feature: number; activeStep: number; removed?: number | null; shell?: boolean }) {
  return <group rotation={[0, -.18, 0]}>
    {shell && <VehiclePlatformShell active />}
    <DomainFlowRig domain={domain} feature={feature} activeStep={activeStep} removed={removed} />
    <PartLabel className="garageStaticLabel" position={[0, 2.12, 0]}>{domainContent[domain].functions[feature]} · 운전자 입력에서 차량 거동까지</PartLabel>
  </group>;
}

// Whole vehicle: every domain's chain side by side (selected domain runs, others idle)
function AllDomainsSystem({ domain, overlay = false }: { domain: DomainId; overlay?: boolean }) {
  const ids = Object.keys(domainContent) as DomainId[];
  const slot = (index: number): [number, number, number] => { const col = index % 4, row = Math.floor(index / 4); return [(col - (row ? 1 : 1.5)) * 3.4, 0, row * 3.3 - 1.65]; };
  // labels live outside the rigs so a slow part model never hides a name
  const labels = ids.map((id, index) => {
    const position: [number, number, number] = overlay ? [-3.6 + index * 1.2, 2.3 + (index % 2) * .35, 0] : [slot(index)[0], 1.7, slot(index)[2]];
    return <PartLabel key={`label-${id}`} className={`allDomainLabel ${id === domain ? "allDomainOn" : ""}`} position={position}>{domainContent[id].icon} {domainContent[id].label}</PartLabel>;
  });
  // overlay: every domain sits in the same vehicle space, like layers of one car
  // the very first label after the canvas remounts is dropped by the label library, so a hidden one goes first
  const spacer = <PartLabel className="labelSpacer" position={[0, -20, 0]}>{" "}</PartLabel>;
  if (overlay) return <group rotation={[0, -.18, 0]}>
    {spacer}{labels}
    {ids.map((id, index) => <group key={id} position={[0, index * .02, 0]}><DomainFlowRig domain={id} feature={0} running={id === domain} /></group>)}
  </group>;
  return <group>
    {spacer}{labels}
    {ids.map((id, index) => <group key={id} position={slot(index)} scale={.78}><DomainFlowRig domain={id} feature={0} compact running={id === domain} /></group>)}
  </group>;
}

function EeArchitectureRig({ domain, feature, activeStep, removed = null, shell = false }: { domain: DomainId; feature: number; activeStep: number; removed?: number | null; shell?: boolean }) {
  return <group rotation={[0, -.18, 0]}>
    {shell && <VehiclePlatformShell active={false} />}
    <DomainFlowRig domain={domain} feature={feature} activeStep={activeStep} removed={removed} />
    <PartLabel className="garageStaticLabel" position={[0, 2.12, 0]}>차체를 벗겨도 센서·ECU·액추에이터 위치는 그대로</PartLabel>
  </group>;
}

function EcuSoftwareRig({ domain, feature, detailed }: { domain: DomainId; feature: number; detailed: boolean }) {
  const pulse = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => { if (pulse.current) pulse.current.position.x = -1.55 + (clock.elapsedTime * .8) % 3.1; });
  const blocks = detailed ? featureFlows[domain][feature].layers[3] : featureFlows[domain][feature].layers[2];
  return <group rotation={[0, -.2, 0]}>
    <RoundedBox args={[4.15, .28, 2.65]} radius={.18} position={[0, .13, 0]} castShadow><meshStandardMaterial color="#6e7774" metalness={.66} roughness={.32} /></RoundedBox>
    <RoundedBox args={[3.78, .12, 2.3]} radius={.08} position={[0, .34, 0]}><meshStandardMaterial color="#315d53" roughness={.65} /></RoundedBox>
    {blocks.map((block, index) => { const x = -1.45 + index * .96; return <group key={block} position={[x, .62, 0]}><RoundedBox args={[.75, .38, 1.25]} radius={.09} castShadow><meshStandardMaterial color={index % 2 ? "#8b73ad" : "#4d90a7"} emissive={index % 2 ? "#4b2d68" : "#27566a"} emissiveIntensity={.18} /></RoundedBox>{Array.from({ length: 6 }, (_, pin) => <mesh key={pin} position={[-.31 + (pin % 3) * .31, -.22, pin < 3 ? -.48 : .48]}><boxGeometry args={[.06, .16, .12]} /><meshStandardMaterial color="#d9c987" metalness={.7} /></mesh>)}<PartLabel position={[0, .48, 0]}>{block}</PartLabel></group>; })}
    {blocks.slice(0, -1).map((_, index) => <SignalCable key={index} from={[-1.05 + index * .96, .68, 0]} to={[-.57 + index * .96, .68, 0]} color={detailed ? "#f2c454" : "#e78755"} />)}
    <group ref={pulse} position={[-1.55, 1.02, 0]}><mesh><sphereGeometry args={[.09, 16, 12]} /><meshStandardMaterial color="#fff1a6" emissive="#ffe05e" emissiveIntensity={2.2} /></mesh></group>
    <PartLabel className="garageStaticLabel" position={[0, 1.42, -1.1]}>{detailed ? "SW Detailed Design · 조건과 상태" : "ECU SW Architecture · SWC와 포트"}</PartLabel>
  </group>;
}

function MechanismModel({ domain, level, feature, activeStep, removed = null, shell = false }: { domain: DomainId; level: number; feature: number; activeStep: number; removed?: number | null; shell?: boolean }) {
  if (level === 0) return <FullVehicleSystem domain={domain} feature={feature} activeStep={activeStep} removed={removed} shell={shell} />;
  return <EeArchitectureRig domain={domain} feature={feature} activeStep={activeStep} removed={removed} shell={shell} />;
}

function SimulinkFlow({ domain, feature, level, activeStep }: { domain: DomainId; feature: number; level: number; activeStep: number }) {
  const base = getFeatureLayer(domain, feature, level);
  const boundary = domainHardware[domain];
  return <div className={`simulinkFlow level-${level}`}>
    <div className="simulinkToolbar"><b>CORE CONTROL · {domain.toUpperCase()}_{feature + 1}</b><span>LIVE INPUT</span><span>STATE / PROTECTION</span><span>10 ms</span></div>
    <div className="softwarePhysicalBoundary inputBoundary"><i /><small>PHYSICAL INPUT</small><b>{boundary.labels[0]}</b><em>입력 신호가 ECU로 이동</em></div>
    <SimulinkDiagram logic={base} components={getFeatureLayer(domain, feature, 2)} inputLabel={boundary.labels[0]} outputLabel={boundary.labels[3]} activeStep={activeStep} />
    <div className="softwarePhysicalBoundary outputBoundary"><i /><small>PHYSICAL OUTPUT</small><b>{boundary.labels[3]}</b><em>명령이 실제 액추에이터를 구동</em></div>
    <div className="simulinkScope"><span>INPUT</span><svg viewBox="0 0 380 42"><path d="M0 30 L45 30 L48 8 L135 8 L138 24 L220 24 L225 12 L380 12" /></svg><b>OUTPUT</b></div>
  </div>;
}

function MechanismViewer({ domain, level, feature, activeStep, removed = null, onPick }: { domain: DomainId; level: number; feature: number; activeStep: number; removed?: number | null; onPick?: (index: number) => void }) {
  const [shell, setShell] = useState(false);
  const [view3d, setView3d] = useState<"one" | "grid" | "overlay">("one");
  const allDomains = view3d !== "one";
  const sourceLevel = garageLayerSource[level] ?? 3;
  if (level === 1) {
    const chain = getFeatureLayer(domain, feature, 1);
    return <div className="mechanismViewer eeView eeBlueprintView"><EeBlueprint chain={chain} roles={chain.map((label, index) => partRole(label, index, chain.length))} active={activeStep} removed={removed} onPick={onPick} signals={flowSignals(domain, feature, chain.length)} /></div>;
  }
  if (level >= 2) return <div className="mechanismViewer softwareView"><SimulinkFlow domain={domain} feature={feature} level={sourceLevel} activeStep={activeStep} /><span className="liveBadge"><i /> 실제 입력 → 핵심 제어 로직 → 출력 액추에이터</span></div>;
  return <div className={`mechanismViewer ${level === 0 ? "xrayView" : "eeView"}`}>
    <Canvas key={`${domain}-${feature}-${view3d}`} shadows camera={{ position: view3d === "grid" ? [7.2, 7.4, 9.4] : view3d === "overlay" ? [6.4, 4.6, 7.6] : [5.9, 3.35, 6.6], fov: 36 }} dpr={[1, 1.3]} gl={{ antialias: true, powerPreference: "high-performance" }}>
      {import.meta.env.DEV && <DevRenderProbe name="garage" />}
      <color attach="background" args={["#eef5ef"]} />
      <hemisphereLight intensity={2.25} color="#fff8e5" groundColor="#6d8c7b" />
      <directionalLight castShadow position={[4, 7, 5]} intensity={3.1} shadow-mapSize={[1024, 1024]} />
      {allDomains && level === 0 ? <AllDomainsSystem domain={domain} overlay={view3d === "overlay"} /> : <MechanismModel domain={domain} level={level} feature={feature} activeStep={activeStep} removed={removed} shell={shell} />}
      <OrbitControls makeDefault enablePan enableZoom enableRotate minDistance={2.5} maxDistance={allDomains ? 22 : 10} maxPolarAngle={Math.PI * .49} target={[0, .65, 0]} />
    </Canvas>
    <span className="liveBadge"><i /> 좌클릭 회전 · 휠 확대/축소 · 우클릭 이동</span>
    <div className="viewToggles">
      {level === 0 && <span className="view3dSeg">{([["one", "🔎 이 도메인"], ["grid", "🧩 나란히"], ["overlay", "🚗 겹쳐 보기"]] as const).map(([id, label]) => <button key={id} className={`shellToggle ${view3d === id ? "on" : ""}`} onClick={() => setView3d(id)}>{label}</button>)}</span>}
      {!allDomains && <button className={`shellToggle ${shell ? "on" : ""}`} onClick={() => setShell(value => !value)}>🚗 차체 {shell ? "숨기기" : "보기"}</button>}
    </div>
  </div>;
}

// ── "빼 보기" experiment: what breaks when one part of the chain is missing ──
type PartRole = "input" | "control" | "network" | "actuator" | "result";
const partRole = (label: string, index: number, length: number): PartRole => {
  if (index === 0) return "input";
  if (/CAN|통신|메시지|Permit|Torque$|Limit$/.test(label) && !/ECU|VCU|BMS/.test(label)) return "network";
  if (/ECU|VCU|BMS|MCU|Interlock|Coordinator|제어기/.test(label)) return "control";
  if (index === length - 1 && (/^(차량|차체|노면)/.test(label) || /(가속|감속|진로 변경|거동|안정|유지|고정|복원|저감|추진력|구동력)$/.test(label))) return "result";
  return "actuator";
};
const ROLE_TEXT: Record<PartRole, { tag: string; what: string; safe: string; clue: string }> = {
  input: { tag: "입력·센서", what: "제어기가 상황을 몰라요", safe: "기능 제한 + 경고등", clue: "제어기는 멀쩡한데 들어오는 값이 0이래" },
  control: { tag: "제어기(ECU)", what: "명령이 하나도 안 나가요", safe: "기능 정지 + 경고등", clue: "센서 값은 잘 오는데 아무 명령도 안 나간대" },
  network: { tag: "통신(메시지)", what: "제어기끼리 소식이 끊겨요", safe: "안전한 기본값 사용", clue: "양쪽 제어기는 멀쩡한데 서로 연락이 끊겼대" },
  actuator: { tag: "액추에이터·부품", what: "명령은 오는데 안 움직여요", safe: "고장 감지 + 경고등", clue: "명령은 100% 나갔는데 실제로는 안 움직였대" },
  result: { tag: "차량 반응", what: "부품이 아니라 결과예요!", safe: "", clue: "" },
};
const DOMAIN_SYMPTOM: Record<DomainId, string> = {
  drive: "🚗 페달을 밟아도 가속이 안 되거나 약해져요",
  brake: "🛑 제동이 약해지거나 정지 거리가 늘어나요",
  steer: "🌀 핸들이 무거워지거나 원하는 만큼 안 돌아요",
  power: "🔋 READY가 안 켜지거나 출력이 제한돼요",
  gear: "🅿️ 변속이 안 되거나 P에서 안 풀려요",
  thermal: "🌡️ 온도가 올라 출력이 제한돼요(파워다운)",
  suspension: "〰️ 승차감이 나빠지고 자세 제어가 약해져요",
};

function PullOutBubble({ domain, label, role }: { domain: DomainId; label: string; role: PartRole }) {
  const text = ROLE_TEXT[role];
  return <div className="pullOutBubble" key={label}>
    <img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" />
    <p><b>{label} 빠짐!</b>{text.what}{role !== "result" && <span className="pullOutChips"><em>{DOMAIN_SYMPTOM[domain]}</em><em className="safe">🛡 {text.safe}</em></span>}</p>
  </div>;
}

// Controller intro card: what it receives, what it does, what it commands (icon chips, no paragraphs).
const ecuIdFor = (label: string) =>
  /^VCU/.test(label) ? "vcu" : /MCU|인버터 ECU/.test(label) ? "mcu" : /^BMS/.test(label) ? "bms"
    : /Thermal ECU/.test(label) ? "thermal_ecu" : /(Brake|ABS|ESC|Hydraulic) ECU/.test(label) ? "brake_ecu" : /EPS ECU/.test(label) ? "eps_ecu" : undefined;
const ROLE_INTRO: Record<PartRole, string> = {
  input: "운전자나 차의 상태를 재서 제어기에 알려 주는 눈·귀",
  control: "받은 값을 판단해 명령을 내리는 두뇌",
  network: "제어기끼리 값을 주고받는 편지(통신 메시지)",
  actuator: "명령을 받아 실제로 움직이는 손발",
  result: "부품들이 함께 만든 차량의 실제 반응",
};
// What each step of the chain sends on (plain words + example unit), from the vehicle-level layer.
const SIGNAL_UNIT: [RegExp, string][] = [[/페달|가속 의도|운전자 가속|조작/, "0~100%"], [/토크|힘|추진/, "Nm"], [/온도|열/, "°C"], [/압력|제동력/, "bar"], [/감속|가속/, "m/s²"], [/회전|속도|RPM/, "rpm"], [/전류/, "A"], [/전압|전력/, "V"], [/조향|각/, "°"], [/허용|판단|요구|요청|명령|선택/, "명령"]];
const flowSignals = (domain: DomainId, feature: number, length: number) => {
  const meanings = getFeatureLayer(domain, feature, 0);
  return Array.from({ length }, (_, index) => meanings[Math.round(index * (meanings.length - 1) / Math.max(1, length - 1))]);
};
const unitOf = (text: string) => SIGNAL_UNIT.find(([pattern]) => pattern.test(text))?.[1] ?? "신호";
const ROLE_DOES: Record<PartRole, (out: string) => string> = {
  input: out => `실제 상황을 재서 ‘${out}’ 값을 전기 신호로 바꿔요`,
  control: out => `받은 값으로 계산해서 ‘${out}’을(를) 정해요`,
  network: out => `‘${out}’을(를) 메시지에 실어 다른 제어기로 배달해요`,
  actuator: out => `명령대로 움직여서 ‘${out}’을(를) 실제로 만들어요`,
  result: out => `최종 결과: 운전자가 ‘${out}’을(를) 느껴요`,
};

function FlowStepCard({ chain, signals, step, onStep }: { chain: string[]; signals: string[]; step: number; onStep: (index: number) => void }) {
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    if (!auto) return;
    const timer = window.setTimeout(() => { if (step < chain.length - 1) onStep(step + 1); else setAuto(false); }, 2200);
    return () => clearTimeout(timer);
  }, [auto, step]); // eslint-disable-line react-hooks/exhaustive-deps
  const role = partRole(chain[step], step, chain.length);
  const input = step === 0 ? "운전자·도로의 실제 상황" : signals[step - 1];
  const output = signals[step];
  return <div className="flowStepCard">
    <div className="flowStepHead"><b>{step + 1}/{chain.length}단계</b><span>{ROLE_TEXT[role].tag}</span><strong>{chain[step]}</strong>
      <div className="flowStepNav">
        <button disabled={step === 0} onClick={() => onStep(step - 1)}>◀</button>
        <span className="flowDots">{chain.map((_, index) => <i key={index} className={index === step ? "on" : index < step ? "done" : ""} onClick={() => onStep(index)} />)}</span>
        <button disabled={step === chain.length - 1} onClick={() => onStep(step + 1)}>▶</button>
        <button onClick={() => { if (step === chain.length - 1) onStep(0); setAuto(value => !value); }}>{auto ? "⏸ 멈춤" : "▶ 자동 재생"}</button>
      </div>
    </div>
    <div className="flowStepBody">
      <div className="fsIn"><small>받는 값</small><b>{input}</b>{step > 0 && <em>{unitOf(input)}</em>}</div>
      <i>→</i>
      <div className="fsDo"><small>하는 일</small><b>{ROLE_DOES[role](output)}</b></div>
      <i>→</i>
      <div className={`fsOut ${step === chain.length - 1 ? "final" : ""}`}><small>{step === chain.length - 1 ? "최종 출력" : "보내는 값"}</small><b>{output}</b><em>{unitOf(output)}</em></div>
    </div>
  </div>;
}

function PartIntroCard({ label, role, domain, onClose, onPull }: { label: string; role: PartRole; domain: DomainId; onClose: () => void; onPull: () => void }) {
  if (role === "control") return <ControllerCard label={label} onClose={onClose} onPull={onPull} />;
  const partId = partModelFor(domain, label);
  return <div className="ecuCard" role="dialog">
    <button className="ecuClose" onClick={onClose} aria-label="닫기">×</button>
    {partId && ["accel_pedal", "brake_pedal", "traction_motor", "brake_caliper", "motor_temp_sensor", "cooling_fan"].includes(partId) ? <img src={`/assets/ending-thumbs/${partId}.png`} alt="" /> : <span className="ecuGeneric">{role === "input" ? "👀" : role === "network" ? "✉️" : role === "actuator" ? "🦾" : "🚗"}</span>}
    <div><small>{ROLE_TEXT[role].tag}</small><b>{label}</b><div className="ecuRow"><i>💡</i><span><em className="do">{ROLE_INTRO[role]}</em></span></div>
    {role !== "result" && <button className="ecuPull" onClick={onPull}>이 부품 빼 보기</button>}</div>
  </div>;
}

function ControllerCard({ label, onPull, onClose }: { label: string; onPull: () => void; onClose: () => void }) {
  const ecu = ECUS.find(item => item.id === ecuIdFor(label));
  const ko = (id: string) => getComponent(id)?.nameKo ?? id;
  return <div className="ecuCard" role="dialog">
    <button className="ecuClose" onClick={onClose} aria-label="닫기">×</button>
    {ecu ? <img src={`/assets/ending-thumbs/${ecu.id}.png`} alt="" /> : <span className="ecuGeneric">🧠</span>}
    <div>
      <small>제어기 소개</small>
      <b>{label}</b>
      {ecu ? <>
        <div className="ecuRow"><i>👀</i><span>{ecu.sensors.length ? ecu.sensors.map(id => <em key={id}>{ko(id)}</em>) : <em>다른 제어기의 메시지</em>}</span></div>
        <div className="ecuRow"><i>🧠</i><span>{ecu.functions.map(item => <em key={item} className="do">{item}</em>)}</span></div>
        <div className="ecuRow"><i>🦾</i><span>{ecu.actuators.length ? ecu.actuators.map(id => <em key={id}>{ko(id)}</em>) : <em>다른 제어기에 명령 전달</em>}</span></div>
        <div className="ecuRow"><i>✉️</i><span>{ecu.interfaces.map(item => <em key={item} className="bus">{item}</em>)}</span></div>
      </> : <div className="ecuRow"><i>🧠</i><span><em className="do">센서 값을 판단해 명령을 내리는 두뇌</em></span></div>}
      <button className="ecuPull" onClick={onPull}>이 제어기 빼 보기</button>
    </div>
  </div>;
}

export function GarageExperience({ state, send }: { state: Campaign; send: Send }) {
  const garageParams = useMemo(() => new URLSearchParams(location.search), []);
  const requestedDomain = garageParams.get("domain") as DomainId | null;
  const requestedView = Number(garageParams.get("view"));
  const requestedFeature = Number(garageParams.get("feature"));
  const [routeLevel, setRouteLevel] = useState(Number.isInteger(requestedView) ? THREE.MathUtils.clamp(requestedView, 0, 2) : 0);
  const [domain, setDomain] = useState<DomainId>(requestedDomain && requestedDomain in domainContent ? requestedDomain : "drive");
  const [feature, setFeature] = useState(Number.isInteger(requestedFeature) ? Math.max(0, requestedFeature) : 0);
  const [activeStep, setActiveStep] = useState(0);
  const [lessonHits, setLessonHits] = useState<Set<string>>(() => new Set());
  const [removed, setRemoved] = useState<number | null>(null);
  const [triedRemovals, setTriedRemovals] = useState<Set<string>>(() => new Set());
  const [ecuCard, setEcuCard] = useState<number | null>(null);
  const [labMode, setLabMode] = useState<"flow" | "intro" | "pull" | "hunt">("flow");
  // "범인 찾기" mini-game: one part is secretly missing, the player finds it from the clue.
  const [culprit, setCulprit] = useState<number | null>(null);
  const [guess, setGuess] = useState<{ index: number; right: boolean } | null>(null);
  const [caught, setCaught] = useState(0);
  const content = domainContent[domain];
  const selectedFeature = featureFlows[domain][feature];
  const chain = getFeatureLayer(domain, feature, 1);
  const selectLevel = (level: number) => { setRouteLevel(level); setLessonHits(previous => new Set(previous).add(`${domain}-${feature}-layer-${level}`)); };
  const inspectStep = (index: number, step: number) => {
    setActiveStep(step);
    setLessonHits(previous => new Set(previous).add(`${domain}-${feature}-${routeLevel}-${index}`));
  };
  useEffect(() => { setFeature(0); setActiveStep(0); setRemoved(null); setEcuCard(null); setCulprit(null); setGuess(null); }, [domain]);
  useEffect(() => { setActiveStep(0); setRemoved(null); setEcuCard(null); setCulprit(null); setGuess(null); setLabMode("flow"); }, [feature, routeLevel]);
  useEffect(() => {
    const flowLength = routeLevel === 2 ? getFeatureLayer(domain, feature, 3).length : getFeatureLayer(domain, feature, 1).length;
    const timer = window.setInterval(() => setActiveStep(value => (value + 1) % flowLength), 1450);
    return () => window.clearInterval(timer);
  }, [domain, feature, routeLevel]);
  return <div className="garageV2">
    <SceneBackdrop image={`${A}stitch23/investigation-lab.png`} position="center" shade="soft" />
    <GameHeader chapter="GARAGE · VEHICLE LOGIC LAB" title="차량 도메인 동작 원리" progressScene={state.scene} onPause={() => send({ type: "PAUSE" })} />
    <nav className="garageLayerNav" aria-label="설계 추상화 단계">
      <small className="viewAxisLabel">VIEWPOINT · 도메인과 독립된 관점 축</small>
      {learningLayers.map((layer, index) => <button key={layer.name} onClick={() => selectLevel(index)} className={routeLevel === index ? "active" : ""}>
        <span>{String(index + 1).padStart(2, "0")}</span><b>{layer.name}</b><small>{layer.tag}</small>
      </button>)}
    </nav>
    <main className="garageStudio">
      <nav className="domainTabs">{(Object.keys(domainContent) as DomainId[]).map((id, index) => <button key={id} className={domain === id ? "active" : ""} style={{ "--domain": domainContent[id].accent } as React.CSSProperties} onClick={() => setDomain(id)}><span>{domainContent[id].icon}</span><b>{domainContent[id].label}</b><small>{index < 4 ? "필수" : "확장"}</small></button>)}</nav>
      <section className="garageMechanismCard">
        <header><small>차량 시스템 › {content.label} 도메인 › {content.functions[feature]}</small><h1>{learningLayers[routeLevel].name}</h1><p>{content.purpose}</p></header>
        <MechanismViewer domain={domain} level={routeLevel} feature={feature} activeStep={activeStep} removed={removed} onPick={index => { setActiveStep(index); if (labMode === "intro") setEcuCard(ecuCard === index ? null : index); else if (labMode === "pull") setRemoved(removed === index ? null : index); }} />
        <div className="mechanismLegend"><span>주황 · 현재 선택 단계</span><span>파랑 · 입력/센서</span><span>보라 · ECU/SW</span></div>
        {routeLevel === 1 && (() => {
          const parts = chain.map((label, index) => ({ label, index, role: partRole(label, index, chain.length) })).filter(item => item.role !== "result");
          const pullOut = (index: number) => { setRemoved(index); setActiveStep(index); setEcuCard(null); setTriedRemovals(previous => new Set(previous).add(`${domain}-${feature}-${index}`)); play("squish"); };
          const startHunt = () => {
            const pick = parts[Math.floor(Math.random() * parts.length)];
            setCulprit(pick.index); setGuess(null); setRemoved(null); setEcuCard(null); setLabMode("hunt"); play("siren");
          };
          const answer = (index: number) => {
            if (culprit === null || guess?.right) return;
            const right = index === culprit;
            setGuess({ index, right });
            if (right) { setRemoved(index); setCaught(value => value + 1); window.setTimeout(() => { play("stamp"); play("success"); }, 60); } else play("error");
          };
          return <div className={`pullOutLab mode-${labMode}`}>
            <header>
              <nav className="labTabs">
                <button className={labMode === "flow" ? "on" : ""} onClick={() => { setLabMode("flow"); setRemoved(null); setCulprit(null); setEcuCard(null); setActiveStep(0); }}>🧭 흐름 따라가기</button>
                <button className={labMode === "intro" ? "on" : ""} onClick={() => { setLabMode("intro"); setRemoved(null); setCulprit(null); }}>① 부품 소개</button>
                <button className={labMode === "pull" ? "on" : ""} onClick={() => { setLabMode("pull"); setCulprit(null); setEcuCard(null); }}>② 빼 보기</button>
                <button className={labMode === "hunt" ? "on" : ""} onClick={startHunt}>③ 범인 찾기{caught ? ` · ${caught}` : ""}</button>
              </nav>
              <em>{labMode === "flow" ? "입력 값이 부품을 하나씩 지나 출력이 되는 과정을 따라가요" : labMode === "intro" ? "부품을 눌러 무슨 일을 하는지 보세요" : labMode === "pull" ? "부품을 하나 빼면 차가 어떻게 될까?" : "밍의 퀴즈: 어느 부품이 빠졌을까?"}</em>
            </header>
            {labMode !== "flow" && <div className="pullOutChain">{chain.map((label, index) => { const role = partRole(label, index, chain.length); return <React.Fragment key={`${label}-${index}`}>
              {index > 0 && <i className={removed !== null && (removed === index || removed === index - 1) ? "broken" : ""}>→</i>}
              <button disabled={labMode === "hunt" || (role === "result" && labMode === "pull")} className={`${removed === index ? "is-out" : ""} ${ecuCard === index ? "is-open" : ""} role-${role}`} onClick={() => {
                if (labMode === "intro") { setEcuCard(ecuCard === index ? null : index); setActiveStep(index); play("pop"); return; }
                if (removed === index) { setRemoved(null); return; }
                pullOut(index);
              }}>
                <small>{ROLE_TEXT[role].tag}</small><b>{label}</b>
                <em>{labMode === "intro" ? "소개" : labMode === "hunt" ? "?" : removed === index ? "↩ 다시 끼우기" : role === "result" ? "결과" : "빼 보기"}</em>
              </button>
            </React.Fragment>; })}</div>}
            {labMode === "flow" && <FlowStepCard chain={chain} signals={flowSignals(domain, feature, chain.length)} step={Math.min(activeStep, chain.length - 1)} onStep={index => { setActiveStep(index); play("pop", 1 + index * .08); }} />}
            {labMode === "intro" && ecuCard !== null && <PartIntroCard label={chain[ecuCard]} role={partRole(chain[ecuCard], ecuCard, chain.length)} domain={domain} onClose={() => setEcuCard(null)} onPull={() => { setLabMode("pull"); pullOut(ecuCard); }} />}
            {labMode === "pull" && removed !== null && <PullOutBubble domain={domain} label={chain[removed]} role={partRole(chain[removed], removed, chain.length)} />}
            {labMode === "hunt" && culprit !== null && <div className="pullOutBubble huntQuiz"><img src="/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png" alt="" /><div>
              <p><b>{guess?.right ? "정답! 범인 검거 🎉" : guess ? "땡! 그 부품은 멀쩡해" : "사건 발생! 어느 부품이 빠졌을까?"}</b>{DOMAIN_SYMPTOM[domain]}<span className="pullOutChips"><em>🔎 단서: {ROLE_TEXT[partRole(chain[culprit], culprit, chain.length)].clue}</em></span></p>
              <div className="quizChoices">{parts.map(item => <button key={item.index} disabled={Boolean(guess?.right)} className={guess?.index === item.index ? guess.right ? "right" : "wrong" : guess?.right && item.index === culprit ? "right" : ""} onClick={() => answer(item.index)}>{item.label}</button>)}</div>
              {guess?.right && <button className="huntButton" onClick={startHunt}>한 번 더!</button>}
            </div></div>}
          </div>;
        })()}
      </section>
      <aside className="domainFunctionShelf">
        <small>CORE CONTROL FUNCTIONS</small><h2>{content.label}의 주요 기능</h2>
        {content.functions.map((item, index) => <button key={item} className={feature === index ? "active" : ""} onClick={() => setFeature(index)}><span>{index + 1}</span><b>{item}</b><i>›</i></button>)}
        <div className="functionNote"><b>{content.functions[feature]}</b><p>{selectedFeature.summary}</p><small>주요 기능들은 서로 이어지는 단계가 아니라 같은 도메인 안의 형제 기능입니다.</small></div>
      </aside>
      <section className="garageFlowPanel">
        <small>{content.functions[feature]} · {learningLayers[routeLevel].tag}</small>
        <b className="flowRelationship">{routeLevel === 2 ? "핵심 제어 SW를 물리 입력·출력 경계와 함께 추적" : "선택한 기능에 필요한 경계만 표시 · 단계 수는 기능마다 달라집니다"}</b>
        <div>{(routeLevel === 2 ? [getFeatureLayer(domain, feature, 1)[0], getFeatureLayer(domain, feature, 1).at(-1)!] : getFeatureLayer(domain, feature, garageLayerSource[routeLevel])).map((node, index, flow) => { const step = index ? (routeLevel === 2 ? getFeatureLayer(domain, feature, 3).length - 1 : index) : 0; return <React.Fragment key={`${node}-${index}`}><button onClick={() => inspectStep(index, step)} className={`${index === 0 || index === flow.length - 1 ? "focus" : ""} ${(activeStep === index || routeLevel === 2 && index === 1 && activeStep === getFeatureLayer(domain, feature, 3).length - 1) ? "activeStep" : ""}`}><i>{index + 1}</i><b>{node}</b><span>{index === 0 ? "PHYSICAL INPUT" : index === flow.length - 1 ? "OUTPUT ACTUATOR" : routeLevel === 0 ? "VEHICLE FUNCTION" : "HW / ECU"}</span></button>{index < flow.length - 1 && <em>→</em>}</React.Fragment>; })}</div>
        <button className="garageProceed primary" onClick={() => send({ type: "START_RACE" })}>학습 마치고 도주 장면으로 →</button>
      </section>
    </main>
  </div>;
}

function HeistCat3D({ groupRef, coat, role }: { groupRef: React.RefObject<THREE.Group | null>; coat: string; role: "driver" | "engineer" }) {
  const leftArm = useRef<THREE.Group>(null!);
  const rightArm = useRef<THREE.Group>(null!);
  const leftLeg = useRef<THREE.Group>(null!);
  const rightLeg = useRef<THREE.Group>(null!);
  const tail = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    const gait = Math.sin(clock.elapsedTime * 11.5);
    if (leftArm.current) leftArm.current.rotation.x = gait * .72;
    if (rightArm.current) rightArm.current.rotation.x = -gait * .72;
    if (leftLeg.current) leftLeg.current.rotation.x = -gait * .62;
    if (rightLeg.current) rightLeg.current.rotation.x = gait * .62;
    if (tail.current) tail.current.rotation.z = -.45 + Math.sin(clock.elapsedTime * 4.5) * .24;
  });
  const fur = coat;
  const outfit = role === "driver" ? "#f5f0e5" : "#35565a";
  return <group ref={groupRef} scale={.7}>
    <mesh position={[0,.72,0]} scale={[.66,.84,.58]} castShadow><sphereGeometry args={[.62,36,26]} /><meshPhysicalMaterial color={outfit} roughness={.64} clearcoat={.16} /></mesh>
    <mesh position={[0,1.57,.02]} scale={[1.08,.94,.9]} castShadow><sphereGeometry args={[.62,40,28]} /><meshPhysicalMaterial color={fur} roughness={.82} /></mesh>
    {[-.35,.35].map((x,index)=><group key={x} position={[x,1.99,.02]} rotation={[0,0,index?-.14:.14]}><mesh castShadow><coneGeometry args={[.23,.48,5]} /><meshStandardMaterial color={fur} roughness={.82} /></mesh><mesh position={[0,-.045,.12]} scale={[.55,.62,.4]}><coneGeometry args={[.18,.36,5]} /><meshStandardMaterial color="#eaa8a0" roughness={.8} /></mesh></group>)}
    {[-.22,.22].map(x=><mesh key={x} position={[x,1.65,.56]} scale={[.72,1,.45]}><sphereGeometry args={[.09,24,18]} /><meshStandardMaterial color="#17201f" roughness={.25} /></mesh>)}
    <mesh position={[0,1.48,.59]} rotation={[Math.PI/2,0,0]}><coneGeometry args={[.065,.09,4]} /><meshStandardMaterial color="#d57772" /></mesh>
    {[-.16,.16].map(x=><mesh key={x} position={[x,1.41,.57]} rotation={[0,0,x<0?-.18:.18]}><torusGeometry args={[.11,.018,10,18,Math.PI*.72]} /><meshStandardMaterial color="#5c4a43" /></mesh>)}
    {[-.28,.28].map((x,index)=><group key={x} ref={index?rightLeg:leftLeg} position={[x,.22,0]}><mesh position={[0,-.1,0]}><capsuleGeometry args={[.13,.38,10,20]} /><meshStandardMaterial color={outfit} roughness={.72} /></mesh><RoundedBox args={[.37,.16,.58]} radius={.08} position={[0,-.34,.16]}><meshStandardMaterial color="#263130" roughness={.76} /></RoundedBox></group>)}
    {[-.5,.5].map((x,index)=><group key={x} ref={index?rightArm:leftArm} position={[x,.94,0]}><mesh position={[0,-.28,.02]} rotation={[0,0,Math.sign(x)*-.16]}><capsuleGeometry args={[.11,.5,10,18]} /><meshStandardMaterial color={outfit} roughness={.7} /></mesh><mesh position={[0,-.61,.04]}><sphereGeometry args={[.14,20,14]} /><meshStandardMaterial color={fur} /></mesh></group>)}
    <group ref={tail} position={[-.45,.72,-.28]} rotation={[0,0,-.45]}><mesh position={[-.34,.12,0]} rotation={[0,0,Math.PI/2]}><capsuleGeometry args={[.105,.62,10,18]} /><meshStandardMaterial color={fur} roughness={.82} /></mesh></group>
    {[-.68,.68].map((x,index)=><group key={x} position={[x,.45,.28]} rotation={[0,0,index?.12:-.12]}><mesh scale={[.72,.82,.5]}><sphereGeometry args={[.46,28,20]} /><meshStandardMaterial color="#8c6747" roughness={.96} /></mesh><mesh position={[0,.42,0]}><torusGeometry args={[.2,.045,12,26,Math.PI]} /><meshStandardMaterial color="#4b4035" /></mesh>{[-.15,0,.15].map(gx=><mesh key={gx} position={[gx,.02,.42]}><boxGeometry args={[.12,.08,.05]} /><meshStandardMaterial color="#e4bd54" metalness={.72} roughness={.25} /></mesh>)}</group>)}
    {role === "driver" ? <><mesh position={[0,.96,.52]}><boxGeometry args={[.7,.09,.05]} /><meshStandardMaterial color="#c74c43" /></mesh><mesh position={[0,.76,.52]}><boxGeometry args={[.08,.48,.05]} /><meshStandardMaterial color="#c74c43" /></mesh></> : <><mesh position={[0,2.12,.28]} rotation={[.05,0,0]}><torusGeometry args={[.42,.07,14,36,Math.PI]} /><meshStandardMaterial color="#6d4f3d" /></mesh>{[-.22,.22].map(x=><mesh key={x} position={[x,1.72,.55]}><torusGeometry args={[.14,.035,12,28]} /><meshPhysicalMaterial color="#6f8795" clearcoat={1} metalness={.35} /></mesh>)}<mesh position={[0,.95,.53]}><boxGeometry args={[.72,.08,.05]} /><meshStandardMaterial color="#d7aa58" /></mesh></>}
  </group>;
}

function HeistCutsceneScene({ onBeat, onDone }: { onBeat: (beat: number) => void; onDone: () => void }) {
  const catA = useRef<THREE.Group>(null);
  const catB = useRef<THREE.Group>(null);
  const car = useRef<THREE.Group>(null);
  const carCrew = useRef<THREE.Group>(null);
  const doorLeft = useRef<THREE.Group>(null);
  const doorRight = useRef<THREE.Group>(null);
  const alarm = useRef<THREE.PointLight>(null);
  const started = useRef<number | null>(null);
  const lastBeat = useRef(-1);
  const finished = useRef(false);
  useFrame(({ clock }) => {
    if (started.current === null) started.current = clock.elapsedTime;
    const t = Math.min(8.4, clock.elapsedTime - started.current);
    const beat = Math.min(7, Math.floor(t / 1.05));
    if (beat !== lastBeat.current) { lastBeat.current = beat; onBeat(beat); }
    const doorOpen = THREE.MathUtils.smoothstep(t, .65, 1.65);
    const escape = THREE.MathUtils.smoothstep(t, 1.45, 6.8);
    const boarded = t >= 7.0;
    const placeCat = (group: THREE.Group | null, offset: number) => {
      if (!group) return;
      group.position.set(THREE.MathUtils.lerp(offset * .86, 3.1 + offset * 1.28, escape), .05 + Math.abs(Math.sin(t * 8 + offset)) * .13, THREE.MathUtils.lerp(-1.72, .58 + offset * .12, escape));
      group.rotation.y = Math.PI / 2;
      group.rotation.z = Math.sin(t * 8 + offset) * (escape > 0 ? .08 : .025);
      group.scale.setScalar(t < 1.15 || boarded ? 0 : .7);
    };
    placeCat(catA.current, -.72);
    placeCat(catB.current, .72);
    // The running cats vanish as they board; the seated crew appears in the same instant.
    if (carCrew.current) carCrew.current.visible = boarded;
    if (doorLeft.current) doorLeft.current.rotation.y = -doorOpen * Math.PI * .48;
    if (doorRight.current) doorRight.current.rotation.y = doorOpen * Math.PI * .48;
    if (alarm.current) alarm.current.intensity = t > 4.8 && t < 7 ? (Math.sin(t * 15) > 0 ? 7 : .3) : 0;
    if (car.current) {
      car.current.position.x = t < 6.1 ? 4.2 : THREE.MathUtils.lerp(4.2, t > 7.15 ? 8.3 : 3.2, THREE.MathUtils.smoothstep(t, 6.1, 8.4));
      car.current.position.z = .65;
      car.current.rotation.y = -Math.PI / 2;
      car.current.rotation.z = t > 7.1 ? Math.sin(t * 8) * .015 : 0;
    }
    if (t >= 8.3 && !finished.current) { finished.current = true; onDone(); }
  });
  return <>
    <color attach="background" args={["#122728"]} />
    <fog attach="fog" args={["#122728",10,24]} />
    <hemisphereLight intensity={1.8} color="#fff0d1" groundColor="#263a35" />
    <directionalLight castShadow position={[-4,8,6]} intensity={3.2} color="#ffe1a4" />
    <pointLight ref={alarm} position={[0,4,1]} color="#ff2538" distance={12} intensity={0} />
    <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,-.02,0]}><planeGeometry args={[18,8]} /><meshStandardMaterial color="#8b775f" roughness={.8} /></mesh>
    <group position={[0,0,-2.2]}>
      <RoundedBox args={[10,5,.5]} radius={.18} position={[0,2.45,0]} castShadow><meshStandardMaterial color="#d8c39c" roughness={.72} /></RoundedBox>
      {[-3.9,-2.65,2.65,3.9].map(x => <group key={x} position={[x,2.35,.38]}><mesh><cylinderGeometry args={[.24,.3,4.5,24]} /><meshStandardMaterial color="#f0dfbd" roughness={.62} /></mesh><mesh position={[0,2.24,0]}><boxGeometry args={[.72,.18,.72]} /><meshStandardMaterial color="#b89568" /></mesh></group>)}
      <RoundedBox args={[3.6,3.7,.28]} radius={.14} position={[0,1.82,.4]}><meshStandardMaterial color="#3f3028" roughness={.74} /></RoundedBox>
      <group position={[-1.72,.1,.59]}><group ref={doorLeft}><RoundedBox args={[1.68,3.42,.22]} radius={.08} position={[.84,1.72,0]} castShadow><meshStandardMaterial color="#6d4933" roughness={.68} /></RoundedBox>{[.58,1.25,1.92,2.59].map(y=><mesh key={y} position={[.84,y,.13]}><boxGeometry args={[1.28,.08,.06]} /><meshStandardMaterial color="#b88955" /></mesh>)}<mesh position={[1.5,1.72,.2]}><sphereGeometry args={[.09,18,12]} /><meshStandardMaterial color="#d9b65f" metalness={.8} /></mesh></group></group>
      <group position={[1.72,.1,.59]}><group ref={doorRight}><RoundedBox args={[1.68,3.42,.22]} radius={.08} position={[-.84,1.72,0]} castShadow><meshStandardMaterial color="#6d4933" roughness={.68} /></RoundedBox>{[.58,1.25,1.92,2.59].map(y=><mesh key={y} position={[-.84,y,.13]}><boxGeometry args={[1.28,.08,.06]} /><meshStandardMaterial color="#b88955" /></mesh>)}<mesh position={[-1.5,1.72,.2]}><sphereGeometry args={[.09,18,12]} /><meshStandardMaterial color="#d9b65f" metalness={.8} /></mesh></group></group>
      {[-3,3].map(x => <group key={x} position={[x,2.25,.34]}>{[0,.55,1.1].map(y => <RoundedBox key={y} args={[1.15,.36,.1]} radius={.05} position={[0,y-.55,0]}><meshStandardMaterial color="#ffe58d" emissive="#d39d28" emissiveIntensity={.3} metalness={.65} /></RoundedBox>)}</group>)}
    </group>
    <HeistCat3D groupRef={catA} coat="#f4ead8" role="driver" /><HeistCat3D groupRef={catB} coat="#f0e1cc" role="engineer" />
    <group ref={car} scale={.72}><HeroConvertible spin={0} crewRef={carCrew} /></group>
    {Array.from({length:20},(_,i) => <mesh key={i} position={[-.75+(i%5)*.28,.18+Math.floor(i/5)*.12,-.65]} rotation={[0,0,(i%3)*.2]}><boxGeometry args={[.2,.09,.05]} /><meshStandardMaterial color="#d8b556" metalness={.72} /></mesh>)}
  </>;
}

export function DriveBriefing({ state, send }: { state: Campaign; send: Send }) {
  const [ready, setReady] = useState(false);
  const [heistFrame, setHeistFrame] = useState(0);
  const heistCaptions = ["부잣집 진입", "경보 패널 우회", "금고 발견", "현금·금괴 확보", "경보 발생!", "가방 들고 탈출", "도주 차량 탑승", "시동 완료 · 출발 준비"];
  return <div className="driveBriefing heistIntro">
    <SceneBackdrop image={`${A}stitch23/prologue-night-drive.png`} position="center" shade="deep" />
    <GameHeader chapter="HEIST COMPLETE · GETAWAY" title="부잣집 탈출 작전" progressScene={state.scene} onPause={() => send({ type: "PAUSE" })} />
    <main>
      <section className="heistStage">
        <Canvas shadows camera={{position:[0,3.15,9.2],fov:45}} dpr={[1,1.35]} gl={{antialias:true,powerPreference:"high-performance"}}><HeistCutsceneScene onBeat={setHeistFrame} onDone={() => setReady(true)} /></Canvas>
        <div className="heistFrameRail">{heistCaptions.map((caption, index) => <i key={caption} className={index < heistFrame ? "done" : index === heistFrame ? "active" : ""} />)}</div>
        <div className="heistCaption"><small>HEIST CUTSCENE · {heistFrame + 1}/8</small><b>{heistCaptions[heistFrame]}</b><span>{ready ? "루와 밍이 차에 탔습니다. 이제 직접 운전합니다." : "금고에서 도주 차량까지 실제 장면이 이어집니다."}</span></div>
      </section>
      <section className="briefingPanel heistPanel"><small>GETAWAY CONTROLS</small><h1>부잣집 탈출 완료<br />해안 도로로 도주!</h1><div className="briefingChecklist"><span><i>W / S</i><b>가속 · 브레이크</b></span><span><i>A / D</i><b>부드러운 조향</b></span><span><i>Q / E</i><b>기어 내림 · 올림</b></span></div><div className="briefingStatus"><span><small>DRIVE</small><b>D · 단일 감속기 · 회생 0–3</b></span><span><small>POLICE</small><b>출발 후 뒤에서 합류</b></span><span><small>COURSE</small><b>CURVED COAST RUN</b></span></div><button className="primary" disabled={!ready} onClick={() => send({ type: "BEGIN_RACE" })}>{ready ? "3 · 2 · 1 도주 시작 →" : `${heistCaptions[heistFrame]}…`}</button></section>
    </main>
  </div>;
}

type RaceMode = "normal" | "assist" | "resume" | "ship";
type DriveSim = { speed: number; lane: number; steer: number; distance: number; gap: number; heat: number; elapsed: number };

function formatRaceTime(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}

export function PursuitRouteBar({ distance, gap, compact = false }: { distance: number; gap: number; compact?: boolean }) {
  const routeProgress = Math.min(100, distance / (1200 / 100));
  const playerMarker = Math.max(5, routeProgress);
  const policeProgress = Math.max(1, Math.min(96, playerMarker - Math.max(4, gap / 12)));
  return <div className={`routeTracker ${compact ? "compactRouteTracker" : ""}`}><div className="routeLabels"><span>START</span><b>추격차와 {Math.round(gap)}m</b><span>FINISH</span></div><div className="routeLine"><i className="policeIcon" style={{ left: `${policeProgress}%` }}>🚓</i><i className="playerIcon" style={{ left: `${playerMarker}%` }}>🚗</i><em /></div></div>;
}

function CatRider({ color, x }: { color: string; x: number }) {
  return <group position={[x, 1.16, .08]}>
    <mesh position={[0, -.29, .03]} scale={[.82, 1.05, .72]} castShadow><sphereGeometry args={[.22, 20, 15]} /><meshStandardMaterial color={color} roughness={.82} /></mesh>
    <mesh castShadow><sphereGeometry args={[.25, 22, 16]} /><meshStandardMaterial color={color} roughness={.8} /></mesh>
    {[-.14, .14].map((dx, i) => <mesh key={dx} position={[dx, .22, 0]} rotation={[0, 0, i ? -.32 : .32]}><coneGeometry args={[.11, .25, 4]} /><meshStandardMaterial color={color} /></mesh>)}
    {[-.08, .08].map(dx => <mesh key={dx} position={[dx, .03, -.23]}><sphereGeometry args={[.024, 12, 8]} /><meshStandardMaterial color="#243135" /></mesh>)}
  </group>;
}

function RaceWheel({ x, z, steer, spin }: { x: number; z: number; steer: number; spin: number }) {
  const front = z < 0;
  return <group position={[x, .3, z]} rotation={[0, front ? -steer : 0, 0]}>
    <group rotation={[spin, 0, 0]}>
      <mesh rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[.3, .105, 18, 38]} /><meshStandardMaterial color="#181f1f" roughness={.78} /></mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.15, .15, .21, 20]} /><meshStandardMaterial color="#d2d9d4" metalness={.72} roughness={.2} /></mesh>
      {Array.from({ length: 5 }, (_, index) => <mesh key={index} rotation={[index * Math.PI * .4, 0, 0]} position={[0, .11, 0]}><boxGeometry args={[.02, .2, .035]} /><meshStandardMaterial color="#6f7a76" metalness={.65} /></mesh>)}
    </group>
  </group>;
}

function Convertible({ police = false, steer = 0, spin = 0 }: { police?: boolean; steer?: number; spin?: number }) {
  const color = police ? "#315d91" : "#ef5649";
  return <group>
    <RoundedBox args={[1.9, .48, 3.55]} radius={.25} smoothness={5} position={[0, .48, 0]} castShadow><meshStandardMaterial color={color} roughness={.24} metalness={.18} /></RoundedBox>
    <RoundedBox args={[1.82, .22, 1.2]} radius={.18} smoothness={5} position={[0, .73, 1.22]} castShadow><meshPhysicalMaterial color={color} roughness={.2} metalness={.18} clearcoat={.72} /></RoundedBox>
    <RoundedBox args={[1.7, .16, .34]} radius={.08} position={[0, .42, 1.74]}><meshStandardMaterial color="#2b3332" metalness={.42} roughness={.3} /></RoundedBox>
    {[-.59, .59].map(x => <RoundedBox key={`tail-${x}`} args={[.46, .18, .08]} radius={.06} position={[x, .65, 1.81]}><meshStandardMaterial color="#e83f46" emissive="#ff293d" emissiveIntensity={1.7} /></RoundedBox>)}
    <RoundedBox args={[.5, .18, .055]} radius={.035} position={[0, .58, 1.84]}><meshStandardMaterial color="#f4ead1" /></RoundedBox>
    <mesh position={[0, .58, 1.875]}><planeGeometry args={[.32, .11]} /><meshStandardMaterial color="#3c615b" emissive="#24443f" emissiveIntensity={.2} /></mesh>
    <RoundedBox args={[1.58, .25, 1.15]} radius={.18} position={[0, .83, .42]}><meshStandardMaterial color="#2b3d43" /></RoundedBox>
    {[-.43, .43].map(x => <group key={`seat-${x}`} position={[x, .99, .42]}><RoundedBox args={[.52, .55, .46]} radius={.13}><meshStandardMaterial color="#c4936d" roughness={.72} /></RoundedBox><RoundedBox args={[.46, .28, .36]} radius={.11} position={[0, .38, .02]}><meshStandardMaterial color="#d4a67c" roughness={.74} /></RoundedBox></group>)}
    <RoundedBox args={[1.48, .1, .12]} radius={.04} position={[0, 1.25, -.23]} rotation={[-.24, 0, 0]}><meshStandardMaterial color="#bfe5eb" transparent opacity={.7} /></RoundedBox>
    {[-.76, .76].map(x => <mesh key={`wind-frame-${x}`} position={[x, 1.03, -.18]} rotation={[-.24, 0, 0]}><boxGeometry args={[.055, .55, .055]} /><meshStandardMaterial color="#263b3c" metalness={.65} /></mesh>)}
    {[-1.02, 1.02].map(x => <group key={`mirror-${x}`} position={[x, .92, -.42]}><RoundedBox args={[.24, .16, .32]} radius={.08}><meshPhysicalMaterial color={color} clearcoat={.8} roughness={.18} /></RoundedBox><mesh position={[-Math.sign(x) * .14, -.06, .04]} rotation={[0, 0, Math.sign(x) * .35]}><cylinderGeometry args={[.035, .045, .24, 12]} /><meshStandardMaterial color="#253231" metalness={.6} /></mesh></group>)}
    <RoundedBox args={[1.55, .34, 1.25]} radius={.18} position={[0, .74, -1.05]}><meshStandardMaterial color={color} /></RoundedBox>
    <RoundedBox args={[1.72, .16, .72]} radius={.12} position={[0, .82, -1.52]}><meshStandardMaterial color={police ? "#234a78" : "#f36d5b"} metalness={.24} /></RoundedBox>
    <mesh position={[0, .88, -1.83]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.34, .05, 10, 28, Math.PI]} /><meshStandardMaterial color="#1c292c" metalness={.5} /></mesh>
    {[-.55, .55].map(x => <mesh key={`lamp-${x}`} position={[x, .66, -1.82]}><sphereGeometry args={[.17, 20, 14]} /><meshStandardMaterial color="#fff0bd" emissive="#ffe4a0" emissiveIntensity={1.4} /></mesh>)}
    {!police && <><CatRider x={-.37} color="#d7a878" /><CatRider x={.37} color="#e9d6b1" /></>}
    {police && <group position={[0, 1.23, .45]}>{[-.22, .22].map((x, i) => <mesh key={x} position={[x, 0, 0]}><boxGeometry args={[.38, .12, .18]} /><meshStandardMaterial color={i ? "#48a8ff" : "#ff4058"} emissive={i ? "#48a8ff" : "#ff4058"} emissiveIntensity={2} /></mesh>)}</group>}
    {[-.72, .72].flatMap(x => [-1.08, 1.08].map(z => <RaceWheel key={`${x}-${z}`} x={x} z={z} steer={steer} spin={spin} />))}
  </group>;
}

function PoliceInterceptor({ spin = 0 }: { spin?: number }) {
  return <group>
    <RoundedBox args={[2.02, .48, 3.72]} radius={.22} smoothness={6} position={[0, .46, 0]} castShadow><meshPhysicalMaterial color="#132c49" metalness={.42} roughness={.2} clearcoat={.9} /></RoundedBox>
    <RoundedBox args={[1.72, .72, 1.76]} radius={.25} position={[0, .91, .2]} castShadow><meshPhysicalMaterial color="#17232c" metalness={.28} roughness={.12} clearcoat={1} /></RoundedBox>
    <mesh position={[0, .98, -.7]} rotation={[-.22, 0, 0]}><planeGeometry args={[1.55, .72]} /><meshPhysicalMaterial color="#8fc1d0" transmission={.45} transparent opacity={.72} roughness={.08} /></mesh>
    {[-.56,.56].map(x => <RoundedBox key={x} args={[.68,.08,.2]} radius={.04} position={[x,.65,-1.88]}><meshStandardMaterial color="#eaf9ff" emissive="#d8f5ff" emissiveIntensity={2.4} /></RoundedBox>)}
    <RoundedBox args={[1.55,.16,.5]} radius={.09} position={[0,.5,-1.78]}><meshStandardMaterial color="#0a151d" metalness={.6} /></RoundedBox>
    <RoundedBox args={[1.12,.12,.3]} radius={.04} position={[0,1.38,.1]}><meshStandardMaterial color="#293331" /></RoundedBox>
    {[-.34,.34].map((x,index) => <RoundedBox key={x} args={[.58,.16,.24]} radius={.045} position={[x,1.48,.1]}><meshStandardMaterial color={index ? "#ef344b" : "#2696ff"} emissive={index ? "#ff1838" : "#168cff"} emissiveIntensity={3.8} /></RoundedBox>)}
    {[-.78,.78].flatMap(x => [-1.12,1.12].map(z => <RaceWheel key={`${x}-${z}`} x={x} z={z} steer={0} spin={spin} />))}
    <mesh position={[0,.28,-1.94]}><boxGeometry args={[1.45,.06,.04]} /><meshStandardMaterial color="#5bc3dc" emissive="#36a9d1" emissiveIntensity={1.2} /></mesh>
  </group>;
}

// The final escape starts at 1,050 m. Keep a full road approach after that
// hand-off so the player sees the existing chase continue toward the dock
// instead of spawning halfway up the ramp.
const TRACK_LENGTH = 1380;
const RAMP_START = TRACK_LENGTH - 170;
const RAMP_END = RAMP_START + 52;
const RAMP_RISE = 3.55;
const DECK_TOUCH = RAMP_END + 18;
const DECK_STOP = DECK_TOUCH + 12;
const trackFrame = (distance: number, lane = 0) => {
  const s = THREE.MathUtils.clamp(distance, -40, TRACK_LENGTH + 80);
  const centerX = Math.sin(s / 74) * 5.4 + Math.sin(s / 181) * 3.2;
  const dx = Math.cos(s / 74) * (5.4 / 74) + Math.cos(s / 181) * (3.2 / 181);
  const yaw = -Math.atan2(dx, 1);
  return {
    x: centerX + Math.cos(yaw) * lane,
    z: -s - Math.sin(yaw) * lane,
    yaw,
  };
};

const boardingPose = (distance: number) => {
  if (distance < RAMP_START) return { y: .02, pitch: 0, airborne: false };
  if (distance <= RAMP_END) {
    const t = THREE.MathUtils.clamp((distance - RAMP_START) / (RAMP_END - RAMP_START), 0, 1);
    const eased = THREE.MathUtils.smoothstep(t, 0, 1);
    return { y: .02 + eased * RAMP_RISE, pitch: .035 + Math.sin(t * Math.PI) * .11, airborne: false };
  }
  if (distance < DECK_TOUCH) {
    const t = THREE.MathUtils.clamp((distance - RAMP_END) / (DECK_TOUCH - RAMP_END), 0, 1);
    return { y: RAMP_RISE + .02 + Math.sin(t * Math.PI) * 1.5 + t * .03, pitch: .12 - t * .2, airborne: true };
  }
  return { y: 3.6, pitch: 0, airborne: false };
};

const trackSamples = Array.from({ length: Math.ceil(TRACK_LENGTH / 20) + 1 }, (_, index) => index * 20);

function StylizedRoadTree({ tone = "#5d956b" }: { tone?: string }) {
  return <group>
    <mesh position={[0,1.15,0]} castShadow><cylinderGeometry args={[.16,.24,2.3,14]} /><meshStandardMaterial color="#79563e" roughness={.92} /></mesh>
    <mesh position={[0,2.55,0]} castShadow><sphereGeometry args={[1.05,22,16]} /><meshStandardMaterial color={tone} roughness={.86} /></mesh>
    <mesh position={[-.58,2.28,.08]} castShadow><sphereGeometry args={[.72,20,14]} /><meshStandardMaterial color={tone} roughness={.88} /></mesh>
    <mesh position={[.6,2.32,-.05]} castShadow><sphereGeometry args={[.78,20,14]} /><meshStandardMaterial color={tone} roughness={.88} /></mesh>
  </group>;
}

function CoastalHouse({ color, roof }: { color: string; roof: string }) {
  return <group>
    <RoundedBox args={[4.2,2.4,3.4]} radius={.24} position={[0,1.2,0]} castShadow><meshStandardMaterial color={color} roughness={.76} /></RoundedBox>
    <mesh position={[0,3.05,0]} rotation={[0,Math.PI/4,0]} castShadow><coneGeometry args={[3.05,1.75,4]} /><meshStandardMaterial color={roof} roughness={.72} /></mesh>
    <RoundedBox args={[.95,1.65,.18]} radius={.08} position={[0,.85,-1.78]}><meshStandardMaterial color="#6c4b39" /></RoundedBox>
    {[-1.25,1.25].map(x => <group key={x} position={[x,1.45,-1.79]}><RoundedBox args={[.86,.82,.12]} radius={.06}><meshStandardMaterial color="#bfe3e7" emissive="#f6d486" emissiveIntensity={.28} /></RoundedBox><mesh position={[0,0,.08]}><boxGeometry args={[.06,.76,.04]} /><meshStandardMaterial color="#f2e4c4" /></mesh><mesh position={[0,0,.08]}><boxGeometry args={[.8,.06,.04]} /><meshStandardMaterial color="#f2e4c4" /></mesh></group>)}
  </group>;
}

function RoadsideEnvironment() {
  return <>{Array.from({ length: 17 }, (_, index) => {
    const distance = 55 + index * 68;
    // Keep the inhabited coast on the landward side.  The sea side remains
    // visually open instead of growing trees and houses out of the water.
    const side = -1;
    const frame = trackFrame(distance, side * (11.2 + index % 3));
    return <group key={index} position={[frame.x,0,frame.z]} rotation={[0,frame.yaw,0]}>
      <group position={[side * 2.4,0,0]} scale={.85 + (index%3)*.08}><StylizedRoadTree tone={["#5d956b","#73a66f","#a28d68"][index%3]} /></group>
      {index % 3 === 0 && <group position={[side * 6.2,0,0]} rotation={[0,side>0?-.1:.1,0]} scale={.72}><CoastalHouse color={["#d88972","#7fafaa","#d8b76c"][index%3]} roof={index%2?"#635869":"#80604c"} /></group>}
      <group position={[side * 7.55,0,-2.2]}><mesh position={[0,2.1,0]}><cylinderGeometry args={[.07,.1,4.2,12]} /><meshStandardMaterial color="#33413e" metalness={.65} /></mesh><mesh position={[0,4.2,0]}><sphereGeometry args={[.28,18,12]} /><meshStandardMaterial color="#fff0b3" emissive="#ffd76d" emissiveIntensity={2.4} /></mesh></group>
    </group>;
  })}</>;
}

const trafficPalette = ["#737b7d", "#a8ada9", "#4d5559", "#8b9090", "#646b70", "#b6b4ac", "#555d61"];

function CivilianCar({ color, spin = 0 }: { color: string; spin?: number }) {
  return <group>
    <RoundedBox args={[1.95,.5,3.55]} radius={.23} smoothness={6} position={[0,.47,0]} castShadow><meshPhysicalMaterial color={color} metalness={.28} roughness={.24} clearcoat={.65} /></RoundedBox>
    <RoundedBox args={[1.72,.78,1.82]} radius={.28} smoothness={6} position={[0,.92,.12]} castShadow><meshPhysicalMaterial color="#28363a" metalness={.24} roughness={.14} clearcoat={1} /></RoundedBox>
    <mesh position={[0,1.03,-.72]} rotation={[-.2,0,0]}><planeGeometry args={[1.5,.72]} /><meshPhysicalMaterial color="#9cc6ce" transparent opacity={.68} transmission={.35} roughness={.08} /></mesh>
    <RoundedBox args={[1.52,.18,.52]} radius={.08} position={[0,.56,-1.62]}><meshStandardMaterial color="#202828" /></RoundedBox>
    {[-.56,.56].map(x => <mesh key={x} position={[x,.62,-1.82]}><sphereGeometry args={[.15,18,12]} /><meshStandardMaterial color="#fff1c2" emissive="#ffe5a0" emissiveIntensity={1.2} /></mesh>)}
    {[-.78,.78].flatMap(x => [-1.1,1.1].map(z => <RaceWheel key={`${x}-${z}`} x={x} z={z} steer={0} spin={spin} />))}
  </group>;
}

function trafficStateFor(sim: DriveSim, index: number) {
  const opposite = index % 2 === 1;
  const speedKph = 38 + index * 3.5;
  const start = 105 + index * 148;
  const travel = sim.elapsed * speedKph / 3.6;
  const distance = opposite
    ? THREE.MathUtils.euclideanModulo(TRACK_LENGTH - start - travel, TRACK_LENGTH - 40)
    : THREE.MathUtils.euclideanModulo(start + travel, TRACK_LENGTH - 40);
  let lane = opposite ? (index % 4 === 1 ? -1.72 : -5.1) : index % 4 === 0 ? 1.68 : 5.05;
  const playerLane = 3.35 + sim.lane;
  const approachingPlayer = !opposite && distance > sim.distance && distance - sim.distance < 17;
  if (approachingPlayer && Math.abs(lane - playerLane) < 1.38) lane = lane < 3.35 ? 5.05 : 1.68;
  return { opposite, distance, lane, speedKph };
}

function TrafficFleet({ sim }: { sim: DriveSim }) {
  const cars = useRef<THREE.Group[]>([]);
  useFrame((_, delta) => {
    cars.current.forEach((car, index) => {
      if (!car) return;
      const traffic = trafficStateFor(sim, index);
      const frame = trackFrame(traffic.distance, traffic.lane);
      const target = new THREE.Vector3(frame.x, .02, frame.z);
      car.position.lerp(target, 1 - Math.exp(-delta * 8));
      const targetYaw = frame.yaw + (traffic.opposite ? Math.PI : 0);
      car.rotation.y = THREE.MathUtils.damp(car.rotation.y, targetYaw, 8, delta);
    });
  });
  return <>{Array.from({ length: 7 }, (_, index) => <group key={index} ref={element => { if (element) cars.current[index] = element; }} scale={.94}>
    <CivilianCar color={trafficPalette[index]} spin={sim.distance*.09} />
  </group>)}</>;
}

// Sky dome whose horizon colour equals the fog colour, so far ground and sea
// fade into the sky with no visible edge (replaces the flat painted backdrop).
const SKY = { top: "#4f9fe0", mid: "#93cdf0", horizon: "#d6eef0" };
// [angle around the camera (rad, 0 = straight ahead), height, scale]
const CLOUDS: [number, number, number][] = [[-.5, 120, 1.4], [-.15, 160, 1], [.25, 110, 1.2], [.6, 150, .9], [1.2, 130, 1.3], [-1.1, 140, 1.1], [2.2, 120, 1], [-2.4, 150, 1.2], [3.1, 130, 1]];
function SkyDome() {
  const dome = useRef<THREE.Mesh>(null!);
  const geometry = useMemo(() => {
    const g = new THREE.SphereGeometry(900, 32, 24);
    const top = new THREE.Color(SKY.top), mid = new THREE.Color(SKY.mid), horizon = new THREE.Color(SKY.horizon);
    const colors: number[] = [];
    const position = g.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const h = position.getY(i) / 900; // -1 bottom … 1 top
      const c = h <= 0 ? horizon.clone() : h < .08 ? horizon.clone().lerp(mid, h / .08) : mid.clone().lerp(top, Math.min(1, (h - .08) / .35));
      colors.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return g;
  }, []);
  const sky = useRef<THREE.Group>(null!);
  useFrame(({ camera }) => { if (sky.current) sky.current.position.set(camera.position.x, 0, camera.position.z); });
  return <group ref={sky}>
    <mesh ref={dome} geometry={geometry} renderOrder={-10}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>
    {CLOUDS.map(([angle, height, size], index) => <group key={index} position={[Math.sin(angle) * 620, height, -Math.cos(angle) * 620]} scale={size}>
      {[[0, 0, 0, 14], [13, -3, 2, 10], [-13, -4, 1, 10], [6, 6, -2, 9], [-6, 5, 2, 8]].map(([x, y, z, r], k) => <mesh key={k} position={[x, y, z]} renderOrder={-9}><sphereGeometry args={[r, 14, 10]} /><meshLambertMaterial color="#ffffff" emissive="#dfeefa" emissiveIntensity={.55} fog={false} /></mesh>)}
    </group>)}
  </group>;
}

function RaceWorldScene({ sim, ship, policeVisible, waterFall = false }: { sim: DriveSim; ship: boolean; policeVisible: boolean; waterFall?: boolean }) {
  const player = useRef<THREE.Group>(null!);
  const police = useRef<THREE.Group>(null!);
  const lookTarget = useRef(new THREE.Vector3());
  const deckFrame = trackFrame(DECK_TOUCH + 28);
  const harborFrame = trackFrame((RAMP_START + DECK_STOP) / 2);
  useFrame(({ camera }, delta) => {
    const roadLane = 3.35 + sim.lane;
    const playerFrame = trackFrame(sim.distance, roadLane);
    const boarding = ship ? boardingPose(sim.distance) : { y: .02, pitch: 0, airborne: false };
    // Keep the chase car physically behind the player model.  A zero gap is
    // handled by the state machine before the meshes are allowed to overlap.
    const freePoliceDistance = Math.max(0, sim.distance - Math.max(5.8, sim.gap));
    const policeDistance = ship && sim.distance >= RAMP_START ? Math.min(RAMP_START - 12, freePoliceDistance) : freePoliceDistance;
    const policeFrame = trackFrame(policeDistance, 3.35 + sim.lane * .42);
    player.current.position.x = THREE.MathUtils.damp(player.current.position.x, playerFrame.x, waterFall ? 2.2 : 10, delta);
    player.current.position.y = THREE.MathUtils.damp(player.current.position.y, waterFall ? -2.2 : boarding.y, waterFall ? 2.2 : 11, delta);
    player.current.position.z = THREE.MathUtils.damp(player.current.position.z, playerFrame.z, waterFall ? 2.2 : 10, delta);
    // Front-wheel steering: the front axle turns first and the body follows a
    // smaller bicycle-model yaw.  Rear wheels never receive a steering angle.
    player.current.rotation.y = THREE.MathUtils.damp(player.current.rotation.y, playerFrame.yaw - sim.steer * .34, 9, delta);
    player.current.rotation.z = THREE.MathUtils.damp(player.current.rotation.z, -sim.steer * .08, 10, delta);
    player.current.rotation.x = THREE.MathUtils.damp(player.current.rotation.x, waterFall ? .72 : boarding.pitch, waterFall ? 2.3 : 9, delta);
    police.current.position.x = THREE.MathUtils.damp(police.current.position.x, policeFrame.x, 8, delta);
    police.current.position.y = THREE.MathUtils.damp(police.current.position.y, .02, 8, delta);
    police.current.position.z = THREE.MathUtils.damp(police.current.position.z, policeFrame.z, 8, delta);
    police.current.rotation.y = THREE.MathUtils.damp(police.current.rotation.y, policeFrame.yaw, 8, delta);
    const sideView = ship && boarding.airborne;
    const chaseCam = trackFrame(sim.distance - (sideView ? 2 : 10.5), sideView ? -11.5 : 3.35 + sim.lane * .58);
    const look = trackFrame(sim.distance + 17, 3.35 + sim.lane * .2);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, chaseCam.x, 5.2, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, (sideView ? 4.35 : 3.92) + boarding.y * .45, 5.2, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, chaseCam.z, 5.2, delta);
    lookTarget.current.x = THREE.MathUtils.damp(lookTarget.current.x, look.x, 6.5, delta);
    lookTarget.current.y = THREE.MathUtils.damp(lookTarget.current.y, .78 + boarding.y, 6.5, delta);
    lookTarget.current.z = THREE.MathUtils.damp(lookTarget.current.z, look.z, 6.5, delta);
    camera.lookAt(lookTarget.current);
  });
  return <>
    <fog attach="fog" args={[SKY.horizon, 70, 260]} />
    <SkyDome />
    <hemisphereLight intensity={1.8} color="#fff5dc" groundColor="#4c735d" />
    <directionalLight castShadow position={[-12, 22, 10]} intensity={2.8} />
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-300, -.12, -TRACK_LENGTH / 2]}><planeGeometry args={[800, TRACK_LENGTH + 1400]} /><meshStandardMaterial color="#76b47d" roughness={1} /></mesh>
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[315, -.095, -TRACK_LENGTH / 2]}><planeGeometry args={[600, TRACK_LENGTH + 1400, 12, 80]} /><meshPhysicalMaterial color="#4f9fb5" roughness={.24} metalness={.08} clearcoat={.7} /></mesh>
    {Array.from({ length: 9 }, (_, index) => <group key={`landmark-${index}`} position={[-25 - (index % 2) * 8, 0, -80 - index * 138]}>
      <mesh position={[0, 3.2 + (index % 3), 0]} castShadow><coneGeometry args={[5.5 + (index % 2) * 2, 7 + (index % 3) * 2, 9]} /><meshStandardMaterial color={index % 2 ? "#668c73" : "#7d9d78"} roughness={1} /></mesh>
      <mesh position={[0, 6.4 + (index % 3), 0]}><coneGeometry args={[2.1, 2.2, 9]} /><meshStandardMaterial color="#d8e2d5" roughness={1} /></mesh>
    </group>)}
    {/* Far layers: mountains on land and islands at sea, softened by fog for depth */}
    {Array.from({ length: 14 }, (_, index) => <mesh key={`far-mtn-${index}`} position={[-150 - (index % 3) * 45, 0, 120 - index * 130]}><coneGeometry args={[60 + (index % 4) * 14, 55 + (index % 3) * 22, 7]} /><meshStandardMaterial color={index % 2 ? "#6f9a86" : "#7fa892"} roughness={1} flatShading /></mesh>)}
    {Array.from({ length: 7 }, (_, index) => <mesh key={`island-${index}`} position={[170 + (index % 2) * 60, -.5, 60 - index * 230]} scale={[1, .35, 1]}><sphereGeometry args={[30 + (index % 3) * 10, 14, 10]} /><meshStandardMaterial color="#8fb58c" roughness={1} /></mesh>)}
    {trackSamples.map((s, i) => { if (ship && s >= RAMP_START) return null; const frame = trackFrame(s); return <group key={s} position={[frame.x, 0, frame.z]} rotation={[0, frame.yaw, 0]}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[14.8, 20.35]} /><meshStandardMaterial color={i % 2 ? "#48545b" : "#4b575e"} roughness={.96} /></mesh>
      {[-3.7, 3.7].map(x => <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, .012, 0]}><planeGeometry args={[.08, 3.5]} /><meshStandardMaterial color="#ece7d9" /></mesh>)}
      {[-.16, .16].map(x => <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, .014, 0]}><planeGeometry args={[.07, 20.2]} /><meshStandardMaterial color="#f2c95f" /></mesh>)}
      {s < TRACK_LENGTH - 72 && [-7.7, 7.7].map(x => <React.Fragment key={x}>
        <RoundedBox args={[.24, .48, 20.3]} radius={.06} position={[x, .2, 0]}><meshStandardMaterial color="#f0e5cd" /></RoundedBox>
        {i % 4 === 0 && <group position={[x + Math.sign(x) * 2.15, 0, 0]}><mesh position={[0, 1.1, 0]}><sphereGeometry args={[.88, 18, 14]} /><meshStandardMaterial color={i % 8 ? "#5b9b67" : "#e0ad72"} roughness={.9} /></mesh><mesh position={[0, .35, 0]}><cylinderGeometry args={[.13, .2, .8, 12]} /><meshStandardMaterial color="#74533e" /></mesh></group>}
        {i % 10 === 0 && <RoundedBox args={[2.5, 1.1 + (i % 3) * .35, 3.1]} radius={.3} position={[x + Math.sign(x) * 4.3, .65, 0]} castShadow><meshStandardMaterial color={["#e98970", "#76b2aa", "#e6bf67", "#8da8c7"][i % 4]} roughness={.72} /></RoundedBox>}
      </React.Fragment>)}
    </group>})}
    {[300, 620, 920].map(s => { const f = trackFrame(s); const missionSignalRed = s === 620 && sim.distance >= 540 && sim.distance <= 612.5; return <group key={`junction-${s}`} position={[f.x, .025, f.z]} rotation={[0, f.yaw, 0]}>
      {Array.from({ length: 9 }, (_, index) => <mesh key={index} rotation={[-Math.PI / 2, 0, 0]} position={[-6.4 + index * 1.6, .015, 0]}><planeGeometry args={[.72, 4.2]} /><meshStandardMaterial color="#f5efe2" /></mesh>)}
      {[-7.1, 7.1].map(x => <group key={x} position={[x, 2.25, -2.8]}><mesh><boxGeometry args={[.15, 4.5, .15]} /><meshStandardMaterial color="#303b39" metalness={.65} /></mesh><RoundedBox args={[.6, 1.45, .35]} radius={.12} position={[0, 1.7, 0]}><meshStandardMaterial color="#25302e" /></RoundedBox>{[-.42, 0, .42].map((y, n) => { const lit = missionSignalRed ? n === 0 : n === 2; const lamp = missionSignalRed ? "#ff554d" : "#50d47a"; return <mesh key={y} position={[0, 1.7 + y, -.2]}><sphereGeometry args={[.14, 18, 12]} /><meshStandardMaterial color={lit ? lamp : "#473f3b"} emissive={lit ? lamp : "#000"} emissiveIntensity={lit ? 2.4 : 0} /></mesh>; })}</group>)}
    </group>; })}
    <RoadsideEnvironment />
    <TrafficFleet sim={sim} />
    {ship && <>
      {/* A continuous harbor basin sits above the green terrain plane from the
          final road approach through the far end of the ship. */}
      <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[harborFrame.x,-.075,harborFrame.z]}><planeGeometry args={[120,320]} /><meshPhysicalMaterial color="#3f91a8" roughness={.24} clearcoat={.82} /></mesh>
      {Array.from({ length: 11 }, (_, index) => {
        const start = RAMP_START + index * ((RAMP_END - RAMP_START) / 11);
        const end = RAMP_START + (index + 1) * ((RAMP_END - RAMP_START) / 11);
        const mid = (start + end) / 2;
        const frame = trackFrame(mid);
        const y = ((mid - RAMP_START) / (RAMP_END - RAMP_START)) * RAMP_RISE;
        const pitch = Math.atan2(RAMP_RISE, RAMP_END - RAMP_START);
        return <group key={`ramp-${index}`} position={[frame.x,y,frame.z]} rotation={[pitch,frame.yaw,0]}>
          <RoundedBox args={[7.25,.3,end-start+.18]} radius={.08} castShadow receiveShadow><meshStandardMaterial color={index%2?"#9a714f":"#a9825c"} roughness={.78} /></RoundedBox>
          {[-3.2,3.2].map(x => <mesh key={x} position={[x,.42,0]}><boxGeometry args={[.13,.72,end-start]} /><meshStandardMaterial color="#d4b17c" /></mesh>)}
        </group>;
      })}
      <group position={[deckFrame.x,1.22,deckFrame.z]} rotation={[0,deckFrame.yaw,0]}>
        <RoundedBox args={[12.4,4.35,70]} radius={1.05} position={[0,.08,0]} castShadow><meshPhysicalMaterial color="#352725" roughness={.4} metalness={.2} clearcoat={.32} /></RoundedBox>
        <RoundedBox args={[11.5,.32,69]} radius={.16} position={[0,2.32,0]} castShadow receiveShadow><meshStandardMaterial color="#8e6849" roughness={.78} /></RoundedBox>
        {Array.from({length:26},(_,index)=><mesh key={index} position={[0,2.5,-32+index*2.55]}><boxGeometry args={[11.2,.07,.1]} /><meshStandardMaterial color="#5f422f" /></mesh>)}
        {/* Keep the landing lane open. The cabin and mast are placed beyond
            the automatic stop point instead of intersecting the car path. */}
        <RoundedBox args={[8.2,2.2,10]} radius={.45} position={[0,3.55,-22]}><meshStandardMaterial color="#604532" roughness={.67} /></RoundedBox>
        <mesh position={[0,8.7,-24]}><cylinderGeometry args={[.18,.28,10,18]} /><meshStandardMaterial color="#332823" /></mesh>
        <mesh position={[2.5,8.1,-24]} rotation={[0,0,-.22]}><planeGeometry args={[6.2,5]} /><meshStandardMaterial color="#bd4945" side={THREE.DoubleSide} /></mesh>
        <PartLabel position={[0,5.35,-14]}>FINAL · THE RED WHISKER · PHYSICAL DECK</PartLabel>
      </group>
    </>}
    <group ref={player}>{DEV_LEGACY_CAR ? <Convertible steer={sim.steer} spin={sim.distance * .11} /> : <HeroConvertible steer={sim.steer} spin={sim.distance * .11} speed={sim.speed} />}</group>
    <group ref={police} visible={policeVisible}><PoliceInterceptor spin={sim.distance * .11} /></group>
    {import.meta.env.DEV && <DevRenderProbe name="race" />}
  </>;
}

function RaceWorld({ sim, ship, policeVisible = true, waterFall = false }: { sim: DriveSim; ship: boolean; policeVisible?: boolean; waterFall?: boolean }) {
  return <div className="raceWorldCanvas"><Canvas shadows camera={{ position: [0, 3.6, 10.5], fov: 54 }} dpr={[1, 1.08]} gl={{ antialias: true, powerPreference: "high-performance" }}><RaceWorldScene sim={sim} ship={ship} policeVisible={policeVisible} waterFall={waterFall} /></Canvas></div>;
}

function RearMirror3D({ gap, visible }: { gap: number; visible: boolean }) {
  const depth = THREE.MathUtils.clamp(2.2 + gap / 10, 2.4, 14);
  return <div className={`policeMirror ${visible ? "policeJoined" : "waitingPolice"}`}>
    <Canvas camera={{position:[0,1.55,5.2],fov:34}} dpr={[1,1.15]} gl={{antialias:true,powerPreference:"high-performance"}}>
      <color attach="background" args={["#9ccbd3"]} />
      <fog attach="fog" args={["#a9d4d8",8,25]} />
      <hemisphereLight intensity={1.8} color="#fff4d7" groundColor="#4c5b55" />
      <directionalLight position={[-4,7,5]} intensity={2.4} />
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.06,-8]}><planeGeometry args={[15,34]} /><meshStandardMaterial color="#465156" roughness={.9} /></mesh>
      {[-2.9,2.9].map(x => <mesh key={x} rotation={[-Math.PI/2,0,0]} position={[x,-.03,-8]}><planeGeometry args={[.1,34]} /><meshStandardMaterial color="#ece5d5" /></mesh>)}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.025,-8]}><planeGeometry args={[.08,32]} /><meshStandardMaterial color="#e8c75f" /></mesh>
      {Array.from({length:8},(_,i) => <group key={i} position={[i%2?-5.6:5.6,.4,-i*4]}><mesh position={[0,.55,0]}><cylinderGeometry args={[.08,.12,1.1,10]} /><meshStandardMaterial color="#70533e" /></mesh><mesh position={[0,1.35,0]}><sphereGeometry args={[.72,18,12]} /><meshStandardMaterial color="#5e9470" roughness={.9} /></mesh></group>)}
      <group visible={visible} position={[0,.02,-depth]} rotation={[0,Math.PI,0]} scale={.78}><PoliceInterceptor spin={gap*.08} /></group>
    </Canvas>
    <small>REAR MIRROR · SAME 3D WORLD</small><em>{visible ? `${Math.round(gap)}m` : "…"}</em><strong>{visible ? "후방 카메라 실시간 렌더" : "출발 후 경찰차 합류"}</strong>
  </div>;
}

export function RaceExperience({ state, send, mode }: { state: Campaign; send: Send; mode: RaceMode }) {
  const firstStart = mode === "normal" && state.raceDistance < 1;
  const [countdown, setCountdown] = useState(firstStart ? 3 : 0);
  const [goFlash, setGoFlash] = useState(false);
  const [sim, setSim] = useState<DriveSim>(() => ({ speed: 0, lane: 0, steer: 0, distance: state.raceDistance, gap: state.policeGapMeters, heat: state.caseId === "thermal" ? 66 : 36, elapsed: state.raceElapsedSeconds }));
  // EVs use a single-speed reduction gear: no gear steps. Q/E set the regen level (0–3).
  const [regen, setRegen] = useState(1);
  const [impact, setImpact] = useState(0);
  const [impactMessage, setImpactMessage] = useState("가드레일 접촉 · 속도 감소 및 차체 반발");
  const [parking, setParking] = useState(false);
  const [driveMission, setDriveMission] = useState<"idle" | "red" | "restart" | "done">("idle");
  const [waterFall, setWaterFall] = useState(false);
  const [deckSettled, setDeckSettled] = useState(false);
  const assistTarget = state.raceDistance + 42;
  const keys = useRef(new Set<string>());
  const collisionCooldown = useRef(0);
  const zoneThrottle = useRef(0); // seconds of full throttle inside the overtake zone
  useEffect(() => { if (impact) play("crash"); }, [impact]);
  const simRef = useRef(sim);
  useEffect(() => { simRef.current = sim; }, [sim]);
  useEffect(() => {
    if (mode !== "ship") return;
    ["/assets/cutscene-ship-jump-v1.png", "/assets/cutscene-ship-land-v1.png"].forEach(src => { const image = new Image(); image.src = src; });
  }, [mode]);
  useEffect(() => {
    if (!countdown) return;
    const timer = window.setTimeout(() => {
      if (countdown === 1) { setCountdown(0); setGoFlash(true); window.setTimeout(() => setGoFlash(false), 650); }
      else setCountdown(value => value - 1);
    }, 820);
    return () => clearTimeout(timer);
  }, [countdown]);
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keys.current.add(event.key.toLowerCase());
      if (!event.repeat && event.key.toLowerCase() === "q") setRegen(value => Math.max(0, value - 1));
      if (!event.repeat && event.key.toLowerCase() === "e") setRegen(value => Math.min(3, value + 1));
      if (!event.repeat && event.key.toLowerCase() === "r" && driveMission === "restart") setDriveMission("done");
      if (event.key === "Escape") {
        const current = simRef.current;
        send({ type: "SYNC_RACE", distance: current.distance, gap: current.gap, elapsed: current.elapsed });
        send({ type: "PAUSE" });
      }
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    addEventListener("keydown", down); addEventListener("keyup", up);
    let last = performance.now(); let frame = 0;
    const loop = (now: number) => {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      setSim(previous => {
        const k = keys.current;
        const allowed = countdown === 0;
        const throttle = allowed && (k.has("w") || k.has("arrowup"));
        const braking = k.has("s") || k.has("arrowdown");
        // Motor characteristic: full torque at low speed, then constant power (accel falls with speed).
        const topSpeed = 165;
        let speed = previous.speed;
        if (throttle) speed += 46 * Math.min(1, 70 / Math.max(speed, 1)) * dt;
        else speed -= [2.15, 5.5, 9, 13][regen] * dt; // coasting: regen level sets the deceleration
        if (braking) speed -= 62 * dt;
        speed = THREE.MathUtils.clamp(speed, 0, topSpeed);
        if (!allowed || parking || driveMission === "restart" || waterFall) speed = THREE.MathUtils.damp(speed, 0, 6.2, dt);
        if (mode === "assist") speed = Math.min(speed || (allowed && !parking ? 27 : 0), 30);
        // Faults appear only under the driving condition that exposes them
        // (= the reproduction condition the player later carries to the board).
        const inOvertakeZone = mode === "normal" && previous.distance >= OVERTAKE_ZONE[0];
        const inClimbZone = mode === "resume" && state.caseId === "propulsion" && previous.distance >= CLIMB_ZONE[0];
        if (inOvertakeZone && throttle) {
          zoneThrottle.current += dt;
          speed = Math.min(previous.speed + (speed - previous.speed) * .45, Math.max(previous.speed, 55)); // pedal signal scaled to 45%
        }
        const derating = inClimbZone && previous.heat >= 80;
        if (derating) speed = Math.min(speed, 38);
        const firstSymptom = inOvertakeZone && zoneThrottle.current > .25;
        const secondSymptom = derating;
        const steerInput = (k.has("a") || k.has("arrowleft") ? -1 : 0) + (k.has("d") || k.has("arrowright") ? 1 : 0);
        const steerTarget = steerInput * THREE.MathUtils.clamp(.14 + speed / 220, .14, .43);
        const steer = THREE.MathUtils.damp(previous.steer, steerTarget, steerInput ? 7.5 : 4.8, dt);
        // Bicycle-model inspired lateral movement: the body yaws into the
        // turn and follows a shallow arc instead of translating like a crab.
        let lane = previous.lane + Math.sin(steer) * (speed / 3.6) * .62 * dt;
        const dockApproach = mode === "ship" && previous.distance >= RAMP_START - 80;
        const dockCommitted = mode === "ship" && previous.distance >= RAMP_START;
        // The final dock is a constrained ramp, not another free-lane road
        // segment.  Once committed, guide the car onto the physical centre of
        // the timber ramp and keep enough momentum for the jump cinematic.
        if (dockApproach) {
          lane = THREE.MathUtils.damp(lane, -3.35, dockCommitted ? 7.2 : 3.4, dt);
        }
        if (dockCommitted) {
          speed = THREE.MathUtils.damp(speed, Math.max(64, speed), 3.2, dt);
        }
        // Once all four wheels reach the deck the player no longer has to
        // fight the throttle. The car visibly rolls out, settles and stops on
        // the physical deck before the ending report is opened.
        if (mode === "ship" && previous.distance >= DECK_TOUCH) {
          speed = THREE.MathUtils.damp(speed, 0, 2.25, dt);
          lane = THREE.MathUtils.damp(lane, -3.35, 8.5, dt);
        }
        const roadOffset = 3.35 + lane;
        const pushingOutward = steerInput !== 0 && Math.sign(steerInput) === Math.sign(roadOffset);
        const hitRail = !dockApproach && Math.abs(roadOffset) > 6.92 && pushingOutward;
        if (hitRail) {
          lane = Math.sign(roadOffset) * 6.78 - 3.35;
          speed *= .72;
          const nowSeconds = now / 1000;
          if (nowSeconds > collisionCooldown.current) {
            collisionCooldown.current = nowSeconds + .8;
            setImpactMessage("가드레일 접촉 · 속도 감소 및 차체 반발");
            setImpact(value => value + 1);
            send({ type: "COLLISION" });
          }
        }
        let distance = previous.distance + speed * dt / 3.6;
        if (mode === "ship" && distance > DECK_STOP) distance = DECK_STOP;
        if (driveMission === "red" && distance >= 612) {
          distance = 612;
          speed = THREE.MathUtils.damp(speed, 0, 8.5, dt);
        }
        const playerRoadLane = 3.35 + lane;
        const trafficHit = dockApproach ? undefined : Array.from({ length: 7 }, (_, index) => trafficStateFor({ ...previous, lane, steer, distance, speed }, index)).find(traffic => !traffic.opposite && Math.abs(traffic.distance - distance) < 3.35 && Math.abs(traffic.lane - playerRoadLane) < 1.18);
        if (trafficHit) {
          speed = Math.min(speed, trafficHit.speedKph) * .42;
          distance = Math.max(previous.distance, distance - .45);
          lane = THREE.MathUtils.clamp(lane + (playerRoadLane <= trafficHit.lane ? -.3 : .3), -9.9, 3.45);
          const nowSeconds = now / 1000;
          if (nowSeconds > collisionCooldown.current) {
            collisionCooldown.current = nowSeconds + 1.1;
            setImpactMessage("일반 차량과 접촉 · 상대 속도 반영 및 차체 반발");
            setImpact(value => value + 1);
            send({ type: "COLLISION" });
          }
        }
        const floor = state.completedCases.length < 2 ? 10 : 0;
        const policeHasJoined = mode !== "normal" || (previous.elapsed >= 3 && previous.distance >= 45);
        const policeSpeed = speed < 4 ? 24 : THREE.MathUtils.clamp(68 + speed * .12, 68, 88);
        const finalBoardingZone = mode === "ship" && distance >= RAMP_START;
        const gap = finalBoardingZone
          ? Math.max(10, previous.gap)
          : allowed && policeHasJoined
            ? THREE.MathUtils.clamp(previous.gap + (speed - policeSpeed) * dt / 3.6, floor, 220)
            : previous.gap;
        const heat = THREE.MathUtils.clamp(previous.heat + (inClimbZone ? (throttle ? (12 + speed * .2) * dt : -dt * .4) : -dt * .7), 35, 94);
        const elapsed = previous.elapsed + (allowed ? dt : 0);
        return { speed, lane, steer, distance, gap, heat, elapsed };
      });
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(frame); removeEventListener("keydown", down); removeEventListener("keyup", up); };
  }, [countdown, driveMission, regen, mode, parking, send, state.caseId, state.completedCases, state.lastRepairDistance, state.lastRepairElapsedSeconds, waterFall]);
  useEffect(() => {
    if (mode !== "resume" || state.caseId !== "propulsion" || driveMission !== "idle" || sim.distance < 550) return;
    setDriveMission("red");
  }, [driveMission, mode, sim.distance, state.caseId]);
  useEffect(() => {
    if (driveMission === "red" && sim.distance >= 611.8 && sim.speed < 3) setDriveMission("restart");
  }, [driveMission, sim.distance, sim.speed]);
  useEffect(() => {
    if (mode !== "ship" || waterFall || sim.distance < TRACK_LENGTH - 230 || sim.distance >= RAMP_START) return;
    const roadOffset = 3.35 + sim.lane;
    if (Math.abs(roadOffset) < 8.35) return;
    setWaterFall(true);
    setImpactMessage("해수 추락 · EV 고전압 차단과 절연 점검 필요");
    setImpact(value => value + 1);
    const timer = window.setTimeout(() => send({ type: "CAUGHT" }), 1800);
    return () => window.clearTimeout(timer);
  }, [mode, send, sim.distance, sim.lane, waterFall]);
  const hasTouchedDeck = mode === "ship" && sim.distance >= DECK_TOUCH;
  useEffect(() => {
    if (!hasTouchedDeck) { setDeckSettled(false); return; }
    const timer = window.setTimeout(() => setDeckSettled(true), 2100);
    return () => window.clearTimeout(timer);
  }, [hasTouchedDeck]);
  const fired = useRef(false);
  // CHASE_RESUME and SHIP_ESCAPE intentionally reuse the same RaceExperience
  // instance so speed/camera continuity is preserved. Reset only the segment
  // gate when the mode changes; otherwise the resume fault event permanently
  // blocks the later deck-arrival event.
  useEffect(() => { fired.current = false; zoneThrottle.current = 0; }, [mode]);
  useEffect(() => {
    if (fired.current) return;
    if (sim.gap <= 0) {
      fired.current = true; send({ type: "CAUGHT" });
    } else if (mode === "normal" && (zoneThrottle.current >= 1.8 || sim.distance >= OVERTAKE_ZONE[1])) {
      fired.current = true; send({ type: "FAULT_CUE", caseId: "propulsion", distance: sim.distance, gap: sim.gap, elapsed: sim.elapsed });
    } else if (mode === "resume" && state.caseId === "propulsion" && (sim.heat >= 84 || sim.distance >= CLIMB_ZONE[1])) {
      fired.current = true; send({ type: "FAULT_CUE", caseId: "thermal", distance: sim.distance, gap: sim.gap, elapsed: sim.elapsed });
    } else if (mode === "resume" && state.caseId === "thermal" && sim.distance >= 1050) {
      fired.current = true; send({ type: "SYNC_RACE", distance: sim.distance, gap: sim.gap, elapsed: sim.elapsed }); send({ type: "START_FINAL_ESCAPE" });
    } else if (mode === "ship" && deckSettled) {
      fired.current = true;
      // A single reducer event commits the car to the ramp and prevents stale
      // distance, water fall or a 0 m pursuit tick from stealing the ending.
      send({ type: "FINISH_ESCAPE", distance: sim.distance, gap: Math.max(10, sim.gap), elapsed: sim.elapsed });
    }
  }, [deckSettled, mode, send, sim.distance, sim.elapsed, sim.gap, state.caseId, state.lastRepairDistance, state.lastRepairElapsedSeconds]);
  const symptom = (mode === "normal" && zoneThrottle.current > .25) || (mode === "resume" && state.caseId === "propulsion" && sim.heat >= 80);
  const zone = mode === "normal" && sim.distance >= OVERTAKE_ZONE[0] - 40 && sim.distance < OVERTAKE_ZONE[1]
    ? { icon: "🏁", title: "추월 구간", text: "W를 끝까지 밟아 추격차를 따돌려!" }
    : mode === "resume" && state.caseId === "propulsion" && sim.distance >= CLIMB_ZONE[0] - 40 && sim.distance < CLIMB_ZONE[1]
      ? { icon: "⛰️", title: "오르막 고부하 구간", text: "속도를 유지하며 계속 밟아 올라가자!" }
      : null;
  useEffect(() => {
    if (mode !== "assist" || parking || sim.distance < assistTarget) return;
    setParking(true);
    send({ type: "SYNC_RACE", distance: sim.distance, gap: sim.gap, elapsed: sim.elapsed });
  }, [assistTarget, mode, parking, send, sim.distance, sim.elapsed, sim.gap]);
  useEffect(() => {
    if (!parking) return;
    const timer = window.setTimeout(() => send({ type: "OPEN_BOARD" }), 1350);
    return () => clearTimeout(timer);
  }, [parking, send]);
  const routeProgress = Math.min(100, sim.distance / (TRACK_LENGTH / 100));
  const playerMarker = Math.max(5, routeProgress);
  const policeProgress = Math.max(1, Math.min(96, playerMarker - Math.max(4, sim.gap / 9)));
  const mapPoint = (progress: number) => ({ x: 45 + Math.sin(progress / 12) * 18 + Math.sin(progress / 29) * 8, y: 92 - progress * .78 });
  const mapPlayer = mapPoint(routeProgress);
  const mapPolice = mapPoint(policeProgress);
  const policeJoined = mode !== "normal" || (sim.elapsed >= 3 && sim.distance >= 45);
  const policeInWorld = policeJoined && !(mode === "ship" && sim.distance >= TRACK_LENGTH - 82);
  return <div className={`raceV2 raceMode-${mode} ${impact ? "raceImpact" : ""} ${waterFall ? "waterFall" : ""}`} data-race-mode={mode} data-race-distance={sim.distance.toFixed(2)} data-race-speed={sim.speed.toFixed(2)} data-race-gap={sim.gap.toFixed(2)}>
    <RaceWorld sim={sim} ship={mode === "ship"} policeVisible={policeInWorld} waterFall={waterFall} />
    <JourneyProgress scene={mode === "ship" ? "SHIP_ESCAPE" : "CHASE_NORMAL"} />
    <div className="raceIdentity"><button onClick={() => { send({ type: "SYNC_RACE", distance: sim.distance, gap: sim.gap, elapsed: sim.elapsed }); send({ type: "PAUSE" }); }}><img src={`${A}ASSET_003_Cat_Face_Identity_REFERENCE.png`} alt="" /><span>TraceBack</span></button><div><small>{mode === "ship" ? "FINAL RUN" : "CHAPTER 04"}</small><b>{mode === "assist" ? "LIMITED DRIVE" : "ESCAPE RUN"}</b></div></div>
    <PursuitRouteBar distance={sim.distance} gap={sim.gap} />
    <div className="raceTripHud"><span><small>ELAPSED</small><b>{formatRaceTime(sim.elapsed)}</b></span><span><small>DRIVE · 회생 Q/E</small><b>D · 회생 {regen}</b></span><em>회생제동 단계 {regen} · Q 약하게 / E 강하게</em></div>
    <div className="cockpitGauge"><small>SPEED</small><b>{Math.round(sim.speed)}</b><span>km/h</span><div><i style={{ width: `${Math.min(100, sim.speed)}%` }} /></div><em>{state.caseId === "thermal" ? `${Math.round(sim.heat)}°C` : "HV READY"}</em></div>
    <RearMirror3D gap={sim.gap} visible={policeInWorld} />
    <div className="raceMiniMap"><b>LIVE CURVE MAP</b><svg viewBox="0 0 90 100"><path d="M45 98 C20 83 72 70 42 55 S16 30 48 8" /><circle className="cop" cx={mapPolice.x} cy={mapPolice.y} r="4" /><circle className="me" cx={mapPlayer.x} cy={mapPlayer.y} r="4.5" /></svg><small><i /> 자차 <em /> 경찰</small></div>
    <div className="raceControls keyBar">
      <span><kbd>W</kbd><em>가속</em></span><span><kbd>S</kbd><em>브레이크</em></span><span><kbd>A</kbd><kbd>D</kbd><em>조향</em></span>
      <span><kbd>Q</kbd><kbd>E</kbd><em>회생 −/+</em></span><span><kbd>R</kbd><em>재시동</em></span><span><kbd className="wide">Esc</kbd><em>멈춤</em></span>
    </div>
    {mode === "normal" && (countdown > 0 || sim.speed < 3) && sim.distance < 40 && <div className="keyGuideCard" aria-label="조작법">
      <b>조작법</b>
      <div className="wasd"><kbd className="k-w">W</kbd><kbd className="k-a">A</kbd><kbd className="k-s">S</kbd><kbd className="k-d">D</kbd></div>
      <ul><li><kbd>W</kbd> 가속 · <kbd>S</kbd> 브레이크</li><li><kbd>A</kbd><kbd>D</kbd> 좌우 조향</li><li><kbd>Q</kbd><kbd>E</kbd> 회생제동 약하게/강하게</li><li><kbd>R</kbd> 멈췄을 때 READY 재시동</li></ul>
    </div>}
    {impact > 0 && <div className="impactToast" key={impact}>{impactMessage}</div>}
    {(countdown > 0 || goFlash) && <div className="startCountdown"><small>GET READY</small><b>{goFlash ? "GO!" : countdown}</b></div>}
    {sim.gap > 0 && sim.gap < 40 && !symptom && <ComicBurst tone="police" side="left" title="바짝 붙었어!" sound="siren" />}
    {symptom && <ComicBurst tone="fault" side="right" image={mode === "normal" ? "/assets/ending-thumbs/accel_pedal.png" : "/assets/ending-thumbs/cooling_fan.png"} title={mode === "normal" ? "힘이 없어!" : "과열!"} sound="alarm" />}
    {zone && !symptom && <div className="raceZoneSign" key={zone.title}><i>{zone.icon}</i><span><small>DRIVING ZONE</small><b>{zone.title}</b><em>{zone.text}</em></span></div>}
    {symptom && <div className="faultBeacon" role="alert"><span /><div><small>VEHICLE WARNING</small><b>{mode === "normal" ? "가속 입력 대비 출력 저하" : "온도 상승 · 보호 출력 제한"}</b><em>원인은 아직 알 수 없습니다</em></div></div>}
    {mode === "assist" && <div className={`assistStop ${parking ? "parking" : ""}`}><span>{parking ? "안전 정차 완료" : "출력 제한 주행"}</span><b>{parking ? "주행 기록을 동결하고 추리 화면으로 이동합니다" : `${Math.max(0, Math.round(assistTarget - sim.distance))}m 후 자동 정차`}</b>{parking && <i className="parkingSpinner" />}</div>}
    {driveMission !== "idle" && driveMission !== "done" && <div className={`driveMission ${driveMission}`}><small>DRIVING MISSION · 다음 검증용 주행 로그</small><b>{driveMission === "red" ? "적색 신호 정지 · 제동 시퀀스 기록" : "정차 후 READY 재인가 · R 키로 재시동"}</b><span>{driveMission === "red" ? `${Math.max(0,Math.round(612-sim.distance))}m · S로 부드럽게 제동 · 정지선 이탈 금지` : "이 재출발 기록이 열관리 고장 재현 미션의 초기조건이 됩니다"}</span></div>}
    {mode === "ship" && sim.distance >= TRACK_LENGTH - 230 && <div className="finalRampCommit"><small>FINAL DOCK</small><b>{deckSettled ? "갑판 정차 완료 · 탈출 성공" : sim.distance >= DECK_TOUCH ? "해적선 갑판 착지 · 자동 감속" : sim.distance >= RAMP_START ? "실물 오르막 램프 진입" : "해적선 연결 램프 접근"}</b><span>{sim.distance >= RAMP_END && sim.distance < DECK_TOUCH ? "차량 도약 중 · 측면 카메라" : sim.distance >= DECK_TOUCH ? "네 바퀴 착지 확인 · 엔딩 전환 준비" : "중앙 유도 · 램프와 갑판 충돌면 활성"}</span></div>}
  </div>;
}

// Driving zones on the existing course where each fault shows up [start, fallback trigger] in metres.
const OVERTAKE_ZONE = [150, 330] as const;
const CLIMB_ZONE = [720, 920] as const;

// Warning lamp the driver sees for each case (generic EV cluster behaviour).
const faultLamp: Record<CaseId, { icon: string; glyph: string; label: string; note: string }> = {
  propulsion: { icon: "none", glyph: "—", label: "경고등 없음", note: "제어기가 고장을 감지하지 못한 채 출력만 약해짐 (운전자 체감만 있음)" },
  thermal: { icon: "power", glyph: "⚡", label: "파워다운(출력 제한) 표시등", note: "구동계 온도가 높아 보호를 위해 출력을 줄이는 중" },
  brake: { icon: "brake", glyph: "(!)", label: "브레이크 경고등", note: "제동 계통 이상 — 제동 거리가 늘어날 수 있음" },
};

export function FaultDialogue({ state, send }: { state: Campaign; send: Send }) {
  const [step, setStep] = useState(0);
  const [dialogueSim, setDialogueSim] = useState<DriveSim>({ speed: state.caseId === "thermal" ? 38 : 31, lane: 0, steer: 0, distance: state.raceDistance, gap: state.policeGapMeters, heat: state.caseId === "thermal" ? 84 : 39, elapsed: state.raceElapsedSeconds });
  const scenario = SCENARIOS[state.caseId];
  const dialogue = [
    { who: "드라이버 루", role: "DRIVER", text: "뭐야, 차 제대로 개조했다는 거 아니었어? 차 고장 나면 우리 다 끝장이야!", tone: "driver" },
    { who: "엔지니어 밍", role: "ENGINEER", text: "헉, 큰일 났다! 기억이 잘 안 나는데… 일단 내가 고쳐볼게!", tone: "engineer" },
  ];
  const advance = () => step === 0 ? setStep(1) : send({ type: "CONTINUE_FAULT" });
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (event.code === "Space" || event.key === "Enter") { event.preventDefault(); advance(); } };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [step, send]);
  useEffect(() => {
    const started = performance.now();
    let frame = 0;
    const loop = (now: number) => {
      const t = (now - started) / 1000;
      setDialogueSim(previous => ({ ...previous, steer: Math.sin(t * .8) * .035, lane: Math.sin(t * .8) * .12, distance: state.raceDistance + (t * (previous.speed / 3.6)) % 24, gap: state.policeGapMeters }));
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [state.policeGapMeters, state.raceDistance]);
  return <div className="faultDialogueScene">
    <RaceWorld sim={dialogueSim} ship={false} policeVisible />
    <div className="faultDialogueShade" />
    <JourneyProgress scene="FAULT_CUE" />
    <div className="warningWash"><i /><i /></div>
    <main>
      <div className="faultSignalTitle"><span>!</span><div><small>DRIVE ANOMALY RECORDED</small><h1>주행 이상 감지</h1><p>{scenario.symptom}</p></div></div>
      {/* Like a real repair order: only the customer-visible symptom and warning lamp.
          Internal values stay "?" until they are measured on the board. */}
      <div className="faultLamp"><span className={`lampIcon lamp-${faultLamp[state.caseId].icon}`} aria-hidden="true">{faultLamp[state.caseId].glyph}</span><div><small>계기판 경고등</small><b>{faultLamp[state.caseId].label}</b><em>{faultLamp[state.caseId].note}</em></div></div>
      <div className="quickTrace isUnknown"><span><small>INPUT</small><b>?</b></span><i /><span><small>COMMAND</small><b>?</b></span><i /><span><small>ACTUAL</small><b>?</b></span><p>입력·명령·출력 값은 메모판에서 측정해 채웁니다</p></div>
      <div className={`catSpeech ${dialogue[step].tone}`}><div className="speechPortrait"><img src={`${A}ASSET_003_Cat_Face_Identity_REFERENCE.png`} alt="" /><i>{dialogue[step].role}</i></div><div><b>{dialogue[step].who}</b><p>{dialogue[step].text}</p><small>Enter로 대화 넘기기 · 대화 중 추격 격차는 고정</small></div><button className="primary" onClick={advance}>{step === 0 ? "다음 대화" : "차는 제한 속도로 계속 주행 · 추리 시작"} →</button></div>
    </main>
  </div>;
}

const evidenceAtlasCell: Record<string, number> = {
  // diagnostic-evidence-sheet-v1 contains eight single, situation-specific
  // photographs (4 × 2). Reuse them by meaning instead of substituting a
  // generic component thumbnail or showing a four-image collage per card.
  pedal_raw: 0, pedal_processed: 1, torque_cmd: 2, motor_actual: 3, gateway: 2, bms: 4, motor: 3,
  motor_temp: 4, fan_command: 5, fan_actual: 6, thermal_protection: 5, sensor: 4, software_command: 5, fan_actuator: 6,
  brake_request: 0, regen_request: 4, brake_actual: 7, brake_actuator: 7, regen_limit: 4, pedal: 0,
};

const componentCutoutCell: Record<string, number> = {
  pedal_raw: 0, pedal: 0, gateway: 1, software_command: 1, bms: 1, torque_cmd: 2,
  motor_actual: 3, motor: 3, motor_temp: 4, sensor: 4, fan_actual: 5, fan_actuator: 5,
  brake_request: 0, brake_actual: 7, brake_actuator: 7,
};

// Picture inside a polaroid: driving-symptom photo, a small meter screen for
// measured values (normal vs measured), or the suspect part for a hypothesis.
const CARD_PHOTO: Record<string, string> = Object.fromEntries(["pedal_raw", "pedal_processed", "torque_cmd", "motor_actual", "motor_temp", "thermal_protection", "brake_request", "regen_request", "brake_actual"].map(id => [id, id]));
const CARD_CUTOUT: Record<string, string> = { fan_command: "thermal_ecu", fan_actual: "cooling_fan" };
const SUSPECT_PART: Record<string, string> = {
  gateway: "vcu", bms: "bms", motor: "traction_motor", aps_sensor: "accel_pedal", sensor: "motor_temp_sensor", software_command: "thermal_ecu",
  fan_actuator: "cooling_fan", brake_actuator: "brake_caliper", regen_limit: "bms", pedal: "brake_pedal",
};
export type Reading = { value: string; ok: boolean };
/** Photo of where the clue came from; a measured value appears as a sticker only after it is measured. */
export function CardGraphic({ id, kind, reading }: { id: string; kind: string; masked?: boolean; reading?: Reading }) {
  const tag = <span className="cardKindTag">{kind === "HYPOTHESIS" ? "원인 후보" : kind}</span>;
  const sticker = reading && <em className={`valueSticker ${reading.ok ? "ok" : "bad"}`}>{reading.ok ? "✓" : "✗"} {reading.value}</em>;
  if (CARD_PHOTO[id]) return <div className="polaroidGraphic photoFill"><img src={`/assets/board-photos/${CARD_PHOTO[id]}.png`} alt="" />{tag}{sticker}</div>;
  const part = SUSPECT_PART[id] ?? CARD_CUTOUT[id];
  if (part) return <div className="polaroidGraphic partFill"><img src={`/assets/ending-thumbs/${part}.png`} alt="" />{tag}{sticker}</div>;
  const cell = evidenceAtlasCell[id] ?? 1;
  const column = cell % 4, row = Math.floor(cell / 4);
  return <div className="polaroidGraphic evidenceAssetPhoto" style={{ "--evidence-x": `${column * 33.333}%`, "--evidence-y": `${row * 100}%` } as React.CSSProperties}>{tag}{sticker}</div>;
}

function Polaroid({ id, title, value, kind, selected, picked = false, onToggle, onZoom, dragData, tool = "move", reading }: { id: string; title: string; value: string; kind: string; selected: boolean; picked?: boolean; onToggle?: () => void; onZoom?: () => void; dragData?: string; tool?: "move" | "thread" | "erase" | "pencil"; reading?: Reading }) {
  return <button draggable={tool === "move" && Boolean(dragData)} onDragStart={event => { if (tool === "move" && dragData) { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", dragData); } }} onDoubleClick={event => { event.stopPropagation(); if (tool === "move") onZoom?.(); }} onClick={event => { event.stopPropagation(); if (tool === "move") onToggle?.(); }} className={`polaroidCard tool-${tool} ${selected ? "pinned" : ""} ${picked ? "picked" : ""}`}>
    <i className="pushPin" /><CardGraphic id={id} kind={kind} reading={reading} /><div className="polaroidCaption"><b>{title}</b><span>{value}</span></div>
  </button>;
}

export function ReplayRaceView({ caseId }: { caseId: CaseId }) {
  const [sim, setSim] = useState<DriveSim>({ speed: 72, lane: 0, steer: 0, distance: 140, gap: 56, heat: caseId === "thermal" ? 72 : 38, elapsed: 36 });
  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const loop = (now: number) => {
      const seconds = ((now - start) / 1000) % 6;
      const faultPhase = seconds > 3.8;
      const speed = faultPhase ? 30 : 72;
      const steer = Math.sin(seconds * 1.15) * .12;
      setSim({ speed, lane: Math.sin(seconds * 1.15) * .45, steer, distance: 140 + seconds * (faultPhase ? 8 : 20), gap: 56 - seconds * 1.4, heat: caseId === "thermal" ? 69 + seconds * 2.1 : 38, elapsed: 36 + seconds });
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [caseId]);
  return <div className="replayRaceWorld"><RaceWorld sim={sim} ship={false} /><div className="replayHud"><span>LAST 8.0 SEC</span><b>{Math.round(sim.speed)} km/h</b><em>{sim.speed < 40 ? "⚠ OUTPUT DROP" : "HV READY"}</em></div></div>;
}

// Signal measurement rail: stops along the signal chain. Measuring a stop shows
// normal vs measured; the first ✗ is where the fault starts. Hypotheses whose
// part measured fine, or sits after the first mismatch, are auto-stamped "반박".
type RailStop = { at: string; value: string; expect: string; ok: boolean; ev: string };
export const MEASURE_RAIL: Record<CaseId, { stops: RailStop[]; hypothesisAt: Record<string, number> }> = {
  propulsion: {
    stops: [
      { at: "가속 페달(APS)", value: "60%", expect: "60%", ok: true, ev: "pedal_raw" },
      { at: "VCU 입력 처리", value: "27%", expect: "60%", ok: false, ev: "pedal_processed" },
      { at: "CAN 토크 명령", value: "92 Nm", expect: "204 Nm", ok: false, ev: "torque_cmd" },
      { at: "모터 실제 토크", value: "91 Nm", expect: "204 Nm", ok: false, ev: "motor_actual" },
    ],
    hypothesisAt: { aps_sensor: 0, gateway: 1, bms: 2, motor: 3 },
  },
  thermal: {
    stops: [
      { at: "냉각수 온도 센서", value: "78.4°C", expect: "실제 고온", ok: true, ev: "motor_temp" },
      { at: "출력 제한 상태", value: "LEVEL 1", expect: "고온 시 제한", ok: true, ev: "thermal_protection" },
      { at: "팬 PWM 명령", value: "100%", expect: "100%", ok: true, ev: "fan_command" },
      { at: "팬 실제 회전", value: "0 RPM", expect: "1850 RPM", ok: false, ev: "fan_actual" },
    ],
    hypothesisAt: { sensor: 0, software_command: 2, fan_actuator: 3 },
  },
  brake: {
    stops: [
      { at: "브레이크 페달", value: "55%", expect: "55%", ok: true, ev: "brake_request" },
      { at: "회생 제동 명령", value: "22%", expect: "가능 범위", ok: true, ev: "regen_request" },
      { at: "캘리퍼 제동 응답", value: "8%", expect: "부족분 보충", ok: false, ev: "brake_actual" },
    ],
    hypothesisAt: { pedal: 0, regen_limit: 1, brake_actuator: 2 },
  },
};
/** The fault boundary is known once the first ✗ and the stop just before it (a ✓) are both measured. */
export const boundaryFound = (rail: (typeof MEASURE_RAIL)[CaseId], measured: number[]) => {
  const firstBad = rail.stops.findIndex(stop => !stop.ok);
  return firstBad >= 0 && measured.includes(firstBad) && (firstBad === 0 || measured.includes(firstBad - 1));
};
const verdictFor = (rail: (typeof MEASURE_RAIL)[CaseId], measured: number[], hypothesisId: string): "rebut" | "likely" | undefined => {
  const at = rail.hypothesisAt[hypothesisId];
  if (at === undefined) return undefined;
  const firstBad = rail.stops.findIndex(stop => !stop.ok);
  const firstBadKnown = boundaryFound(rail, measured);
  if (measured.includes(at) && rail.stops[at].ok) return "rebut";
  if (firstBadKnown && at > firstBad) return "rebut";
  if (firstBadKnown && at === firstBad) return "likely";
  return undefined;
};

const MEASURE_BUDGET = 3;
function MeasureRail({ caseId, measured, budget, onMeasure, onBuy }: { caseId: CaseId; measured: number[]; budget: number; onMeasure: (index: number) => void; onBuy: () => void }) {
  const rail = MEASURE_RAIL[caseId];
  const firstBad = rail.stops.findIndex(stop => !stop.ok);
  const found = boundaryFound(rail, measured);
  const used = measured.length - 1; // the output (last stop) is measured for free: that is the symptom
  const left = budget - used;
  const stars = used <= 2 ? 3 : used === 3 ? 2 : 1;
  return <div className={`measureRail ${found ? "is-found" : ""}`}>
    <span className="railTitle">{found ? <><b>찾았다!</b><em className="railStars">{"★".repeat(stars)}{"☆".repeat(3 - stars)}</em></> : <><b>🔍 출력이 이상해! ✓와 ✗의 경계를 찾자</b><em>측정 기회 {"●".repeat(Math.max(0, left))}{"○".repeat(Math.max(0, budget - Math.max(0, left)))}</em></>}</span>
    {rail.stops.map((stop, index) => { const done = measured.includes(index); return <React.Fragment key={stop.at}>
      {index > 0 && <i className={`railWire ${done && measured.includes(index - 1) ? (rail.stops[index - 1].ok ? "ok" : "bad") : ""}`} />}
      <button disabled={!done && (left <= 0 || found)} className={`railStop ${done ? stop.ok ? "ok" : "bad" : ""} ${found && index === firstBad ? "first" : ""}`} onClick={() => !done && left > 0 && !found && onMeasure(index)}>
        <small>{stop.at}</small>
        {done ? <b>{stop.ok ? "✓" : "✗"} {stop.value}</b> : <b className="tap">{found ? "—" : "측정하기"}</b>}
        {done && <em>정상 {stop.expect}</em>}
        {found && index === firstBad && <span className="firstFlag">처음 어긋남!</span>}
      </button>
    </React.Fragment>; })}
    {!found && left <= 0 && <button className="railBuy" onClick={onBuy}>측정 +1<small>추격 −5m</small></button>}
  </div>;
}

export function InvestigationBoard({ state, send }: { state: Campaign; send: Send }) {
  const scenario = SCENARIOS[state.caseId];
  const selectedEvidence = state.evidence[state.caseId];
  const selectedHypothesis = state.hypothesis[state.caseId];
  const [replay, setReplay] = useState(false);
  const [zoomCard, setZoomCard] = useState<{ id: string; label: string; value: string; kind: string } | null>(null);
  const [feedback, setFeedback] = useState("");
  const [rulesOpen, setRulesOpen] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const [cardPositions, setCardPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [linkedEvidence, setLinkedEvidence] = useState<string[]>([]);
  const [threadPaths, setThreadPaths] = useState<Record<string, { x: number; y: number }[]>>({});
  const [boardTool, setBoardTool] = useState<"move" | "thread" | "erase">("move");
  const [threadDraft, setThreadDraft] = useState<{ from: string; points: { x: number; y: number }[] } | null>(null);
  const [measured, setMeasured] = useState<number[]>(() => [MEASURE_RAIL[state.caseId].stops.length - 1]);
  useEffect(() => {
    const last = MEASURE_RAIL[state.caseId].stops.at(-1)!;
    if (!state.evidence[state.caseId].includes(last.ev)) send({ type: "RECORD_EVIDENCE", id: last.ev });
  }, []); // the symptom at the output is known from the start
  const [extraMeasures, setExtraMeasures] = useState(0);
  const readingFor = (id: string): Reading | undefined => { const index = MEASURE_RAIL[state.caseId].stops.findIndex(stop => stop.ev === id); return index >= 0 && measured.includes(index) ? { value: MEASURE_RAIL[state.caseId].stops[index].value, ok: MEASURE_RAIL[state.caseId].stops[index].ok } : undefined; };
  const rail = MEASURE_RAIL[state.caseId];
  const measure = (index: number) => {
    const stop = rail.stops[index];
    setMeasured(previous => [...previous, index]);
    play("zip"); window.setTimeout(() => play(stop.ok ? "pop" : "error"), 140);
    if (!selectedEvidence.includes(stop.ev)) send({ type: "RECORD_EVIDENCE", id: stop.ev });
    setCardPositions(previous => previous[stop.ev] ? previous : ({ ...previous, [stop.ev]: { x: 4 + index * (68 / Math.max(1, rail.stops.length - 1)), y: 30 + (index % 2) * 26 } }));
    const nowMeasured = [...measured, index];
    const firstBad = rail.stops.findIndex(item => !item.ok);
    const nowFound = boundaryFound(rail, nowMeasured);
    if (nowFound) window.setTimeout(() => { play("stamp"); play("success"); }, 420);
    setFeedback(nowFound ? `찾았다! ${firstBad > 0 ? `${rail.stops[firstBad - 1].at}(✓)과 ` : ""}${rail.stops[firstBad].at}(✗) 사이에서 고장이 시작됐어요` : stop.ok ? `${stop.at}: 정상 ✓ — 고장은 이 뒤쪽에서 시작됐어요` : `${stop.at}: 여기도 이상해요 ✗ — 더 앞쪽을 재 볼까요?`);
  };
  const hintKey = `${state.caseId}:board`;
  const hintUsed = Boolean(state.hintClaims[hintKey]);
  useEffect(() => { const timer = window.setInterval(() => setSeconds(value => value + 1), 1000); return () => clearInterval(timer); }, []);
  const movePinned = (id: string, event: React.DragEvent) => {
    if (!boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    setCardPositions(previous => ({ ...previous, [id]: {
      x: THREE.MathUtils.clamp((event.clientX - rect.left) / rect.width * 100 - 10, 1, 78),
      y: THREE.MathUtils.clamp((event.clientY - rect.top) / rect.height * 100 - 13, 1, 67),
    } }));
  };
  const boardPoint = (clientX: number, clientY: number) => {
    const rect = boardRef.current!.getBoundingClientRect();
    return { x: (clientX - rect.left) / rect.width * 100, y: (clientY - rect.top) / rect.height * 100 };
  };
  const dropOnBoard = (event: React.DragEvent) => {
    event.preventDefault();
    const data = event.dataTransfer.getData("text/plain");
    const point = boardPoint(event.clientX, event.clientY);
    if (data.startsWith("evidence:")) {
      const id = data.slice(9);
      if (!selectedEvidence.includes(id)) send({ type: "RECORD_EVIDENCE", id });
      setCardPositions(previous => ({ ...previous, [id]: { x: THREE.MathUtils.clamp(point.x - 9, 1, 70), y: THREE.MathUtils.clamp(point.y - 14, 8, 66) } }));
      setFeedback("관찰·계측 단서를 놓았습니다. 이 단서가 지지하는 가능 원인 가설과 이어 보세요.");
    }
    if (data.startsWith("cause:")) {
      const id = data.slice(6);
      if (selectedHypothesis !== id) send({ type: "SELECT_HYPOTHESIS", id });
      setCardPositions(previous => ({ ...previous, [`cause:${id}`]: { x: THREE.MathUtils.clamp(point.x - 9, 1, 78), y: THREE.MathUtils.clamp(point.y - 14, 8, 67) } }));
      setFeedback("가능 원인 가설을 놓았습니다. 관련 단서 두 장 이상으로 지지한 뒤 다음 단계에서 검증합니다.");
    }
  };
  const selectedCards = scenario.evidence.filter(item => selectedEvidence.includes(item.id));
  const cause = scenario.hypotheses.find(item => item.id === selectedHypothesis);
  const freehandPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return "";
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let index = 1; index < points.length - 1; index += 1) {
      const point = points[index], next = points[index + 1];
      path += ` Q ${point.x} ${point.y} ${(point.x + next.x) / 2} ${(point.y + next.y) / 2}`;
    }
    const last = points.at(-1)!;
    return `${path} L ${last.x} ${last.y}`;
  };
  const beginThread = (id: string, event: React.PointerEvent) => {
    if (boardTool !== "thread") return;
    event.stopPropagation();
    if (!cause) { setFeedback("오른쪽 원인 후보를 먼저 코르크판으로 끌어오세요."); return; }
    setThreadDraft({ from: id, points: [boardPoint(event.clientX, event.clientY)] });
  };
  const finishThread = (event: React.PointerEvent) => {
    if (!threadDraft || !cause) return;
    event.stopPropagation();
    const completedPath = [...threadDraft.points, boardPoint(event.clientX, event.clientY)];
    setLinkedEvidence(previous => previous.includes(threadDraft.from) ? previous : [...previous, threadDraft.from]);
    setThreadPaths(previous => ({ ...previous, [threadDraft.from]: completedPath }));
    setFeedback("관찰·계측 단서와 가능 원인 가설을 붉은 실로 연결했습니다.");
    setThreadDraft(null);
  };
  const eraseThread = (id: string) => {
    if (boardTool !== "erase") return;
    setLinkedEvidence(previous => previous.filter(item => item !== id));
    setThreadPaths(previous => { const next = { ...previous }; delete next[id]; return next; });
  };
  return <div className="boardV2 boardV3">
    <SceneBackdrop image={`${A}stitch23/investigation-lab.png`} position="center" shade="soft" />
    <GameHeader chapter="INCIDENT INVESTIGATION" title="증거 메모판" progressScene={state.scene} onPause={() => send({ type: "PAUSE" })} />
    <PursuitRouteBar compact distance={state.raceDistance} gap={state.policeGapMeters} />
    <main className="investigationBoard detectiveLayout">
      <header><div><small>OBSERVE · MEASURE · HYPOTHESIZE</small><h1>{scenario.title}</h1><div className="reasoningMicroRail"><span>현상 확인</span><i>→</i><span>계측 단서</span><i>→</i><span>가능 원인 가설</span><i>→</i><span>후속 검증</span></div></div><div className="boardToolbox"><button className={boardTool === "move" ? "active" : ""} onClick={() => setBoardTool("move")}><img src={`${A}cursor-hand-open-v1.png`} alt="" /><span>손</span></button><button className={boardTool === "thread" ? "active" : ""} onClick={() => setBoardTool("thread")}><img src={`${A}detective-pencil-v1.png`} alt="" /><span>연필</span></button><button className={boardTool === "erase" ? "active" : ""} onClick={() => setBoardTool("erase")}><img src={`${A}detective-eraser-v1.png`} alt="" /><span>지우개</span></button></div><button onClick={() => setRulesOpen(value => !value)}>규칙</button><button onClick={() => setReplay(true)}>▶ QUICK REPLAY</button><button className="hintButton" disabled={seconds < 60 || hintUsed} onClick={() => { send({ type: "HINT", key: hintKey }); setFeedback(`힌트: ${scenario.hypotheses.find(item => item.id === scenario.root)?.label} 가설을 명령값과 실제 반응으로 검토해 보세요. (-5m)`); }}>{hintUsed ? "힌트 사용됨" : seconds < 60 ? `힌트 ${60 - seconds}초` : "힌트 보기 · -5m"}</button></header>
      {rulesOpen && <aside className="boardRules"><b>🕵️ 목표 · 신호를 따라가며 고장이 시작된 곳을 찾고, 범인 가설을 증거로 묶기</b><ol>
        <li><b>▶ QUICK REPLAY</b>로 운전자가 겪은 증상을 확인해요.</li>
        <li><b>🔍 신호 측정</b>: 맨 오른쪽 <b>출력은 이미 ✗</b>(증상)예요. 레일의 지점을 눌러 정상값과 비교하며 <b>✓와 ✗가 바뀌는 경계</b>를 찾아요. 출력에서 거꾸로 올라가도, 입력부터 따라가도 OK! 기회는 <b>3번</b>, 가운데부터 재면 더 빨라요. (부족하면 <b>측정 +1</b>, 추격차가 5m 가까워져요)</li>
        <li>측정할수록 오른쪽 가설에 <b>반박</b>·<b>유력</b> 도장이 찍혀요. 적게 측정할수록 ★이 많아요.</li>
        <li><b>유력</b> 가설을 코르크판으로 끌어오고, <b>✏️ 연필</b>로 증거 사진에서 가설 카드까지 쭉 그어 실로 이어요. (지우개로 실 삭제)</li>
        <li>증거 <b>2장 이상</b>을 이으면 다음 단계(경로 복원)로!</li>
      </ol><button onClick={() => setRulesOpen(false)}>알겠어!</button></aside>}
      <aside className="evidenceInventory"><h2>관찰된 현상 · 계측 단서</h2><p>주행 현상과 입력·명령·실제 반응을 구분</p><div>{scenario.evidence.map(card => <div key={card.id} className={selectedEvidence.includes(card.id) ? "used" : ""}><Polaroid reading={readingFor(card.id)} id={card.id} title={card.label} value={card.value} kind={card.kind} selected={false} tool={boardTool} dragData={boardTool === "move" ? `evidence:${card.id}` : undefined} onZoom={() => setZoomCard({ id: card.id, label: card.label, value: card.value, kind: card.kind })} /></div>)}</div></aside>
      <section className={`caseCorkCanvas tool-${boardTool}`} ref={boardRef} onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }} onDrop={dropOnBoard} onPointerMove={event => { if (!threadDraft) return; const point = boardPoint(event.clientX, event.clientY); setThreadDraft(previous => { if (!previous) return previous; const last = previous.points.at(-1)!; return Math.hypot(point.x - last.x, point.y - last.y) < .45 ? previous : { ...previous, points: [...previous.points, point] }; }); }} onPointerUp={() => threadDraft && setThreadDraft(null)}>
        <MeasureRail caseId={state.caseId} measured={measured} budget={MEASURE_BUDGET + extraMeasures} onMeasure={measure} onBuy={() => { send({ type: "HINT", key: `${state.caseId}:measure${extraMeasures + 1}` }); setExtraMeasures(value => value + 1); play("squish"); }} />
        <div className="caseBoardTitle"><b>원인 가설 검토 보드</b><span>사실 단서와 가능 원인 가설을 놓고 지지 관계를 이으세요</span><em>{linkedEvidence.length} LINKED</em></div>
        <svg className={`evidenceThreads ${boardTool === "erase" ? "erasing" : ""}`} viewBox="0 0 100 100" preserveAspectRatio="none">{cause && selectedCards.filter(card => linkedEvidence.includes(card.id)).map(card => <path key={card.id} d={freehandPath(threadPaths[card.id] ?? [])} onPointerEnter={() => eraseThread(card.id)} onClick={() => eraseThread(card.id)} />)}{threadDraft && <path className="threadDraft" d={freehandPath(threadDraft.points)} />}</svg>
        {selectedCards.map((card, index) => { const pos = cardPositions[card.id] ?? { x: 6 + (index % 3) * 24, y: 25 + Math.floor(index / 3) * 36 }; const linked = linkedEvidence.includes(card.id); return <div className={`boardPinnedCard ${linked ? "threaded" : ""}`} draggable={boardTool === "move"} key={card.id} style={{ left: `${pos.x}%`, top: `${pos.y}%` }} onDragEnd={event => boardTool === "move" && movePinned(card.id, event)} onPointerDown={event => beginThread(card.id, event)}><Polaroid reading={readingFor(card.id)} id={card.id} title={card.label} value={card.value} kind={card.kind} selected tool={boardTool} onZoom={() => setZoomCard({ id: card.id, label: card.label, value: card.value, kind: card.kind })} /></div>; })}
        {cause && (() => { const pos = cardPositions[`cause:${cause.id}`] ?? { x: 78, y: 40 }; return <div className="boardCausePin freePosition" draggable={boardTool === "move"} style={{ left: `${pos.x}%`, top: `${pos.y}%` }} onDragEnd={event => boardTool === "move" && movePinned(`cause:${cause.id}`, event)} onPointerUp={finishThread}><Polaroid id={cause.id} title={cause.label} value={cause.desc} kind="HYPOTHESIS" selected tool={boardTool} onZoom={() => setZoomCard({ id: cause.id, label: cause.label, value: cause.desc, kind: "HYPOTHESIS" })} /></div>; })()}
        {!selectedCards.length && <div className="emptyCaseBoard"><b>① 증거 사진을 이곳으로 끌어오세요</b><span>② 원인 후보도 끌어온 뒤 ③ 연필로 압정 사이를 잇습니다</span></div>}
      </section>
      <aside className="causeCandidates"><h2>가능 원인 가설</h2><p>검증할 가설 한 장을 보드에 배치</p>{scenario.hypotheses.map(item => { const verdict = verdictFor(rail, measured, item.id); return <div key={item.id} className={`${selectedHypothesis === item.id ? "selected" : ""} ${verdict ? `verdict-${verdict}` : ""}`}>{verdict && <span className={`verdictStamp ${verdict}`}>{verdict === "rebut" ? "반박" : "유력"}</span>}{verdict === "likely" && selectedHypothesis !== item.id && <span className="dragMeBadge">보드로 끌어오기 ↙</span>}<Polaroid id={item.id} title={item.label} value={item.desc} kind="원인 가설" selected={false} tool={boardTool} dragData={boardTool === "move" ? `cause:${item.id}` : undefined} onZoom={() => setZoomCard({ id: item.id, label: item.label, value: item.desc, kind: "원인 가설" })} /></div>; })}</aside>
      <footer className="boardDecisionBar">{(() => { const steps = [
          { label: "✓·✗ 경계 찾기", done: boundaryFound(rail, measured) },
          { label: "'유력' 가설을 보드로", done: Boolean(selectedHypothesis) },
          { label: "연필로 증거 2장 잇기", done: linkedEvidence.length >= 2 },
        ]; const current = steps.findIndex(step => !step.done); return <div className="boardStepper">
          {steps.map((step, index) => <span key={step.label} className={step.done ? "done" : index === current ? "now" : ""}><i>{step.done ? "✓" : index + 1}</i>{step.label}</span>)}
          {feedback && <em className="boardFeedback">{feedback}</em>}
        </div>; })()}<button className="primary" disabled={linkedEvidence.length < 2 || !selectedHypothesis} onClick={() => send({ type: "OPEN_WIRING" })}>{linkedEvidence.length < 2 ? `단서 연결 ${linkedEvidence.length}/2` : "가설 채택 · 제어 경로 검증 →"}</button></footer>
    </main>
    <button className="secretSolve" title="개발용 정답 적용" onClick={() => { send({ type: "SOLVE_BOARD" }); setLinkedEvidence(state.caseId === "propulsion" ? ["pedal_raw", "pedal_processed", "torque_cmd"] : state.caseId === "thermal" ? ["motor_temp", "fan_command", "fan_actual"] : ["brake_request", "regen_request", "brake_actual"]); }}>정답 보기</button>
    {zoomCard && <div className="evidenceZoom" onClick={() => setZoomCard(null)}><article onClick={event => event.stopPropagation()}><button onClick={() => setZoomCard(null)} aria-label="확대 카드 닫기">×</button><CardGraphic id={zoomCard.id} kind={zoomCard.kind} reading={readingFor(zoomCard.id)} /><div className="zoomPolaroidCaption"><small>{zoomCard.kind}</small><h2>{zoomCard.label}</h2><p>{zoomCard.value}</p></div></article></div>}
    {replay && <div className="replayModal" onClick={() => setReplay(false)}><div onClick={event => event.stopPropagation()}><button onClick={() => setReplay(false)}>×</button><small>QUICK REPLAY · LAST 8.0 SEC</small><h2>고장 직전 실제 주행 재생</h2><ReplayRaceView caseId={state.caseId} /><div className="replaySignals"><span>운전자 입력<b>{state.caseId === "propulsion" ? "60%" : "주행 유지"}</b></span><span>차량 명령<b>{state.caseId === "propulsion" ? "27%" : "FAN ON"}</b></span><span>실제 반응<b>{state.caseId === "propulsion" ? "출력 저하" : "0 RPM"}</b></span></div><p>레이싱 당시 카메라·오픈카·추격차를 그대로 재생합니다. 원인명은 표시하지 않습니다.</p></div></div>}
  </div>;
}

type LogicNode = { id: string; label: string; kind: "HW" | "SW"; detail: string; x: number; y: number };
type WirePoint = { x: number; y: number };
type LogicEdge = { from: string; to: string; points?: WirePoint[] };
const logicGlyph = (id: string) => id.includes("sensor") || ["aps", "temp", "pedal"].includes(id) ? "⌁" : id.includes("map") || id.includes("threshold") || id.includes("blend") ? "▦" : id.includes("can") || id.includes("pwm") || id.includes("pressure") ? "⇢" : id.includes("logger") ? "▤" : id.includes("ecu") || id === "vcu" ? "▣" : id.includes("fan") ? "✣" : id.includes("inverter") ? "⚙" : "◆";
const componentAtlasCell: Record<string, number> = {
  aps: 0, adapter: 1, map100: 1, map45: 1, can: 1, vcu: 1, inverter: 2, logger: 1,
  temp: 3, filter: 1, threshold: 1, forceoff: 1, pwm: 5, thermalecu: 5, fan: 4,
  pedal: 6, request: 1, blend: 1, regenonly: 8, pressure: 8, brakeecu: 8, caliper: 7,
};
const puzzlePerspective: Record<CaseId, { active: string; depth: string; input: string; middle: string; output: string }> = {
  propulsion: { active: "SW 로직", depth: "기능 슬라이스 · 상세 제어", input: "변수·신호·상태", middle: "검증·계산·제어·중재", output: "토크 명령값" },
  thermal: { active: "E/E + 물리 피드백", depth: "ECU–액추에이터 통합", input: "온도 센서·ECU 신호", middle: "ECU·PWM·전원·피드백", output: "팬 회전·RPM" },
  brake: { active: "차량 제어 통합", depth: "회생·마찰 제동 협조", input: "운전자 감속 요구", middle: "제동력 배분·ECU·I/O", output: "유압·휠 감속" },
};
const puzzleMission: Record<CaseId, { domain: string; feature: string; input: string; output: string }> = {
  propulsion: { domain: "구동", feature: "운전자 토크 요청", input: "가속 페달 APS A/B", output: "인버터·전륜 모터 토크" },
  thermal: { domain: "열관리", feature: "냉각 팬 폐루프 제어", input: "냉각수 온도 센서", output: "팬 PWM·실제 RPM" },
  brake: { domain: "제동", feature: "회생·마찰 협조 제동", input: "브레이크 페달 요구", output: "캘리퍼 압력·휠 감속" },
};
const puzzleConfig: Record<CaseId, { requirement: string[]; blocks: Omit<LogicNode, "x" | "y">[]; correct: string[]; program: string; faulty: string }> = {
  propulsion: {
    requirement: ["APS 입력 0~100%", "IF 신호 유효", "페달 맵·가용토크", "THEN CAN 토크 명령", "모터 실제 토크"],
    blocks: [
      { id: "aps", label: "APS 이중 센서", kind: "HW", detail: "운전자 페달 입력" }, { id: "adapter", label: "APS Signal Adapter", kind: "SW", detail: "범위·상관성 진단" },
      { id: "map100", label: "Driver Torque Map 100%", kind: "SW", detail: "정상 토크 변환" }, { id: "map45", label: "Legacy Scale 45%", kind: "SW", detail: "오류 후보 블록" },
      { id: "can", label: "CAN Torque Command", kind: "SW", detail: "VCU→Inverter 명령" }, { id: "vcu", label: "VCU Controller", kind: "HW", detail: "SW 실행 제어기" },
      { id: "inverter", label: "Inverter + PMSM", kind: "HW", detail: "전류·모터 토크" }, { id: "logger", label: "Trace Logger", kind: "SW", detail: "관측 전용" },
    ], correct: ["aps", "adapter", "map100", "can", "vcu", "inverter"], program: "nominal", faulty: "underreport_45pct",
  },
  thermal: {
    requirement: ["냉각수 온도 입력", "IF 65°C 초과", "히스테리시스 판단", "THEN Fan PWM", "팬 실제 회전"],
    blocks: [
      { id: "temp", label: "Coolant Temp Sensor", kind: "HW", detail: "냉각수 NTC 온도 입력" }, { id: "filter", label: "Temperature Filter", kind: "SW", detail: "센서 노이즈 제거" },
      { id: "threshold", label: "65°C Hysteresis", kind: "SW", detail: "ON/OFF 기준" }, { id: "forceoff", label: "Fan Force-OFF", kind: "SW", detail: "오류 후보 블록" },
      { id: "pwm", label: "Fan PWM Command", kind: "SW", detail: "냉각 명령 생성" }, { id: "thermalecu", label: "Thermal ECU", kind: "HW", detail: "SW 실행·출력" },
      { id: "fan", label: "Cooling Fan + Feedback", kind: "HW", detail: "회전·RPM 피드백" }, { id: "logger", label: "Trace Logger", kind: "SW", detail: "관측 전용" },
    ], correct: ["temp", "filter", "threshold", "pwm", "thermalecu", "fan"], program: "thermal_closed_loop", faulty: "open_loop_fan",
  },
  brake: {
    requirement: ["제동 페달 입력", "IF 감속 요청", "회생 한계 계산", "THEN 마찰 보상", "휠 감속 응답"],
    blocks: [
      { id: "pedal", label: "Brake Pedal Sensor", kind: "HW", detail: "운전자 감속 의도" }, { id: "request", label: "Brake Force Request", kind: "SW", detail: "요구 제동력" },
      { id: "blend", label: "Regen/Friction Blend", kind: "SW", detail: "회생·마찰 배분" }, { id: "regenonly", label: "Regen Only", kind: "SW", detail: "오류 후보 블록" },
      { id: "pressure", label: "Pressure Command", kind: "SW", detail: "캘리퍼 압력" }, { id: "brakeecu", label: "Brake ECU", kind: "HW", detail: "휠 제어기" },
      { id: "caliper", label: "Caliper + Wheel", kind: "HW", detail: "마찰 제동 응답" }, { id: "logger", label: "Trace Logger", kind: "SW", detail: "관측 전용" },
    ], correct: ["pedal", "request", "blend", "pressure", "brakeecu", "caliper"], program: "blended_brake", faulty: "friction_only",
  },
};

// Real part photos (whole object visible, kept inside the piece's safe area) and plain-language pictos for SW
const PART_PHOTO: Record<string, string> = {
  aps: "accel_pedal", vcu: "vcu", inverter: "traction_motor", temp: "motor_temp_sensor", thermalecu: "thermal_ecu",
  fan: "cooling_fan", pedal: "brake_pedal", brakeecu: "brake_ecu", caliper: "brake_caliper",
};
function PiecePicture({ node }: { node: { id: string; label: string; kind: string } }) {
  return <div className={`logicNodePhoto piecePicture ${node.kind === "HW" ? "hw" : "sw"}`}>
    {node.kind === "HW" && PART_PHOTO[node.id] ? <img src={`/assets/ending-thumbs/${PART_PHOTO[node.id]}.png`} alt="" draggable={false} /> : <Picto kind={/Adapter|Sensor Check|진단/.test(node.label) ? "check" : /Map|Scale/.test(node.label) ? "lut" : /Filter/.test(node.label) ? "delay" : /Hysteresis/.test(node.label) ? "state" : /Force|Only|Gate/.test(node.label) ? "switch" : /Blend|Request/.test(node.label) ? "min" : blockKind(node.label)} />}
    <small>{node.kind === "HW" ? "부품" : "SW 블록"}</small>
  </div>;
}

const puzzleEdgeClass = (index: number, total: number) => {
  if (index === 0) return "edge-flat-tab";
  if (index === total - 1) return "edge-notch-flat";
  return index % 2 === 1 ? "edge-notch-notch" : "edge-tab-tab";
};

export function RestoredPuzzleVisual({ caseId, running, works, reference }: { caseId: CaseId; running: boolean; works: boolean; reference: boolean }) {
  const config = puzzleConfig[caseId];
  const wrongId = caseId === "propulsion" ? "map45" : caseId === "thermal" ? "forceoff" : "regenonly";
  const path = config.correct.map((id, index) => !reference && !works && index === 2 ? wrongId : id);
  return <section className={`restoredPuzzleVisual ${running ? "running" : ""} ${works ? "works" : "broken"}`}>
    <header><small>RESTORED CONTROL PATH</small><b>{reference ? "정상 기준 경로" : "앞 단계에서 복원한 경로"}</b><em>{running ? "신호 흐름 추적 중" : works ? "홈·순서 일치" : "불일치 홈 감지"}</em></header>
    <div className="restoredPuzzleTrack">
      {path.map((id, index) => {
        const block = config.blocks.find(item => item.id === id)!;
        return <div className="restoredPuzzleWrap" key={`${id}-${index}`} title={`${block.label} · ${block.detail}`}>
          <article className={`restoredPuzzlePiece ${puzzleEdgeClass(index, path.length)} ${block.kind.toLowerCase()} ${!reference && !works && index === 2 ? "mismatch" : ""}`}>
            {block.kind === "HW" ? <i className={`restoredPiecePhoto componentAssetPhoto asset-${componentAtlasCell[id] ?? 2}`} /> : <i className="restoredPiecePhoto restoredLogicGlyph"><b>f(u)</b><span>→</span></i>}
            <span><small>{block.kind}</small><b>{block.label}</b></span>
          </article>
        </div>;
      })}
      <i className="restoredSignal" />
    </div>
    <footer><span>INPUT</span><i /> <span>VALIDATE</span><i /> <span>CONTROL</span><i /> <span>COMMAND</span><i /> <span>ECU / I·O</span><i /> <span>PLANT</span></footer>
  </section>;
}

// Signal value leaving each block (shown on the wire), trap-block reactions, and
// which requirement row each block of the correct path implements.
const SIGNAL_VALUE: Record<CaseId, Record<string, string>> = {
  propulsion: { aps: "60%", adapter: "60% ✓", map100: "204 Nm", can: "204 Nm", vcu: "204 Nm" },
  thermal: { temp: "78.4°C", filter: "78.4°C", threshold: "팬 ON", pwm: "100%", thermalecu: "PWM 100%" },
  brake: { pedal: "55%", request: "3.2 m/s²", blend: "회생+마찰", pressure: "42 bar", brakeecu: "42 bar" },
};
const TRAP_MSG: Record<string, string> = {
  map45: "🕵️ 이 블록이 범인! 페달 60%를 27%로 줄여서 토크가 92 Nm밖에 안 나와",
  forceoff: "🕵️ 이 블록이 범인! 온도가 높아도 팬을 강제로 꺼 버려",
  regenonly: "🕵️ 이 블록이 범인! 회생만 쓰고 모자란 제동력을 마찰로 채우지 않아",
  logger: "📝 기록 전용 블록이라 신호를 바꾸지 않아. 경로에는 안 넣어도 돼",
};
const REQ_OF_STEP = [0, 1, 2, 3, 3, 4];
// Jigsaw tab shape = signal type, so only pieces with matching units fit together.
type Nub = "round" | "square" | "zigzag" | "wave" | "tri";
const NUB_NAME: Record<Nub, string> = { round: "% 신호", square: "힘·토크", zigzag: "통신 명령", wave: "PWM 구동", tri: "온도·압력" };
// Jigsaw silhouette on the 140×140 piece box: right edge has a tab, left edge a matching socket.
const TAB: Record<Nub, string> = {
  round: "V 46 C 128 42 140 42 140 58 C 140 74 128 74 128 70",
  square: "V 46 H 140 V 70 H 128",
  tri: "V 44 L 140 58 L 128 72",
  zigzag: "V 44 L 136 44 L 140 50 L 136 58 L 140 66 L 136 72 L 128 72",
  wave: "V 44 Q 140 44 136 51 Q 132 58 140 65 Q 140 72 128 72",
};
const SOCKET: Record<Nub, string> = {
  round: "V 70 C 12 74 24 74 24 58 C 24 42 12 42 12 46",
  square: "V 70 H 24 V 46 H 12",
  tri: "V 72 L 24 58 L 12 44",
  zigzag: "V 72 L 16 72 L 24 66 L 20 58 L 24 50 L 16 44 L 12 44",
  wave: "V 72 Q 24 72 20 65 Q 16 58 24 51 Q 24 44 12 44",
};
const piecePath = (io: { in?: Nub; out?: Nub }) =>
  `path("M 18 6 H 122 Q 128 6 128 12 ${io.out ? TAB[io.out] : ""} V 128 Q 128 134 122 134 H 18 Q 12 134 12 128 ${io.in ? SOCKET[io.in] : ""} V 12 Q 12 6 18 6 Z")`;
const PIECE_IO: Record<CaseId, Record<string, { in?: Nub; out?: Nub }>> = {
  propulsion: { aps: { out: "round" }, adapter: { in: "round", out: "round" }, map100: { in: "round", out: "square" }, map45: { in: "round", out: "square" }, can: { in: "square", out: "zigzag" }, vcu: { in: "zigzag", out: "zigzag" }, inverter: { in: "zigzag" }, logger: { in: "round" } },
  thermal: { temp: { out: "tri" }, filter: { in: "tri", out: "tri" }, threshold: { in: "tri", out: "zigzag" }, forceoff: { in: "tri", out: "zigzag" }, pwm: { in: "zigzag", out: "wave" }, thermalecu: { in: "wave", out: "wave" }, fan: { in: "wave" }, logger: { in: "tri" } },
  brake: { pedal: { out: "round" }, request: { in: "round", out: "square" }, blend: { in: "square", out: "square" }, regenonly: { in: "square", out: "square" }, pressure: { in: "square", out: "tri" }, brakeecu: { in: "tri", out: "tri" }, caliper: { in: "tri" }, logger: { in: "round" } },
}; // correct path index → requirement row

export function WiringPuzzle({ state, send }: { state: Campaign; send: Send }) {
  const config = puzzleConfig[state.caseId];
  const perspective = puzzlePerspective[state.caseId];
  const mission = puzzleMission[state.caseId];
  const flowSlots = config.correct.map((_, index) => ({ x: 24 + index * 156, y: 105 }));
  const gapIndexes = [2, 3];
  const gapIds = gapIndexes.map(index => config.correct[index]);
  const spreadNodes = () => {
    let looseIndex = 0;
    return config.blocks.map(block => {
      const correctIndex = config.correct.indexOf(block.id);
      if (correctIndex >= 0 && !gapIndexes.includes(correctIndex)) return { ...block, ...flowSlots[correctIndex] };
      const position = { x: 90 + looseIndex * 220, y: 300 };
      looseIndex += 1;
      return { ...block, ...position };
    });
  };
  const starterEdges = () => config.correct.slice(0, -1).map((id, index) => ({ from: id, to: config.correct[index + 1] })).filter((_, index) => !gapIndexes.includes(index) && !gapIndexes.includes(index + 1));
  const [nodes, setNodes] = useState<LogicNode[]>(spreadNodes);
  const [edges, setEdges] = useState<LogicEdge[]>(starterEdges);
  const [source, setSource] = useState("");
  const [wireDraft, setWireDraft] = useState<{ points: WirePoint[] } | null>(null);
  const [dragging, setDragging] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const initialWireScale = () => window.innerWidth < 1100 ? .72 : .9;
  const [view, setView] = useState({ x: 0, y: 0, scale: initialWireScale() });
  // start fitted: the whole puzzle (pieces x 0–980, y 90–460) is visible without zooming
  useEffect(() => {
    const fit = () => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || !rect.width) return;
      const scale = Math.min(rect.width / 990, rect.height / 400, 1.1);
      setView({ scale, x: (rect.width - 990 * scale) / 2, y: (rect.height - 400 * scale) / 2 - 80 * scale });
    };
    const timer = window.setTimeout(fit, 50);
    addEventListener("resize", fit);
    return () => { clearTimeout(timer); removeEventListener("resize", fit); };
  }, []);
  const [panning, setPanning] = useState<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [wireTool, setWireTool] = useState<"move" | "pencil" | "erase">("move");
  const eraser = wireTool === "erase";
  const [rulesOpen, setRulesOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [zoomNode, setZoomNode] = useState<LogicNode | null>(null);
  const [puzzleFeedback, setPuzzleFeedback] = useState("연결되는 조각은 홈 모양과 제어 순서가 함께 맞습니다.");
  const [seconds, setSeconds] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const hintKey = `${state.caseId}:wiring`;
  const hintUsed = Boolean(state.hintClaims[hintKey]);
  useEffect(() => { const timer = window.setInterval(() => setSeconds(value => value + 1), 1000); return () => clearInterval(timer); }, []);
  const localPoint = (clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: (clientX - rect.left - view.x) / view.scale, y: (clientY - rect.top - view.y) / view.scale };
  };
  const connect = (to: string) => {
    if (!source || source === to) return;
    const sourceIndex = config.correct.indexOf(source);
    const targetIndex = config.correct.indexOf(to);
    if (sourceIndex < 0 || targetIndex !== sourceIndex + 1) {
      setPuzzleFeedback("이 두 조각은 홈 방향 또는 제어 순서가 맞지 않습니다.");
      play("error");
      setSource(""); setWireDraft(null);
      return;
    }
    const target = nodes.find(node => node.id === to);
    const points = wireDraft && target ? [...wireDraft.points, { x: target.x + 12, y: target.y + 70 }] : undefined;
    setEdges(previous => [...previous.filter(edge => edge.to !== to), { from: source, to, points }]);
    setPuzzleFeedback(`연결 성공! 신호가 ${SIGNAL_VALUE[state.caseId][source] ?? ""} 로 흘러가요`);
    play("success");
    setSource(""); setWireDraft(null);
  };
  const chooseWireNode = (node: LogicNode) => {
    if (wireTool !== "pencil") return;
    if (source) { connect(node.id); return; }
    if (config.correct.indexOf(node.id) < 0) {
      setPuzzleFeedback(TRAP_MSG[node.id] ?? "오류 후보와 기록 블록은 정상 경로에 연결되지 않습니다.");
      play("error");
      return;
    }
    setSource(node.id);
    setWireDraft({ points: [{ x: node.x + 128, y: node.y + 70 }] });
  };
  const curveFromPoints = (points: WirePoint[]) => {
    if (points.length < 2) return "";
    return points.slice(1).reduce((path, point, index) => {
      const previous = points[index];
      const midX = (previous.x + point.x) / 2, midY = (previous.y + point.y) / 2;
      return `${path} Q ${previous.x} ${previous.y} ${midX} ${midY}`;
    }, `M ${points[0].x} ${points[0].y}`) + ` T ${points.at(-1)!.x} ${points.at(-1)!.y}`;
  };
  const snapDraggedNode = (clientX?: number, clientY?: number) => {
    if (!dragging) return;
    const gapIndex = config.correct.indexOf(dragging.id);
    const storedNode = nodes.find(node => node.id === dragging.id);
    if (!storedNode) return;
    const pointer = clientX !== undefined && clientY !== undefined ? localPoint(clientX, clientY) : null;
    const draggedNode = pointer ? { ...storedNode, x: THREE.MathUtils.clamp(pointer.x - dragging.dx / view.scale, 5, 1075), y: THREE.MathUtils.clamp(pointer.y - dragging.dy / view.scale, 5, 525) } : storedNode;
    if (!gapIndexes.includes(gapIndex)) {
      if (gapIndexes.some(index => Math.hypot(draggedNode.x - flowSlots[index].x, draggedNode.y - flowSlots[index].y) < 130)) { setPuzzleFeedback(TRAP_MSG[draggedNode.id] ?? "이 조각의 홈은 빈 경로와 맞지 않습니다."); play("error"); }
      return;
    }
    const slot = flowSlots[gapIndex];
    if (Math.hypot(draggedNode.x - slot.x, draggedNode.y - slot.y) >= 130) return;
    setNodes(previous => previous.map(node => node.id === dragging.id ? { ...node, ...slot } : node));
    // jigsaw: a piece that fits connects itself to its neighbours (no pencil needed)
    setEdges(previous => {
      const id = config.correct[gapIndex], before = config.correct[gapIndex - 1], after = config.correct[gapIndex + 1];
      const next = previous.filter(edge => edge.to !== id && edge.from !== id);
      if (before) next.push({ from: before, to: id });
      if (after) next.push({ from: id, to: after });
      return next;
    });
    setPuzzleFeedback(`${draggedNode.label} 조각이 맞는 홈에 끼워졌습니다.`);
    play("squish");
  };
  const solvePuzzle = () => {
    const solved = spreadNodes().map(node => { const index = config.correct.indexOf(node.id); return index >= 0 ? { ...node, ...flowSlots[index] } : node; });
    setNodes(solved);
    setEdges(config.correct.slice(0, -1).map((id, index) => ({ from: id, to: config.correct[index + 1] })));
    setPuzzleFeedback("정상 제어 경로가 완성되었습니다.");
    setSource(""); setWireDraft(null); setWireTool("move");
  };
  const isCorrect = config.correct.every((id, index) => index === config.correct.length - 1 || edges.some(edge => edge.from === id && edge.to === config.correct[index + 1]));
  const slotsFilled = gapIndexes.every(index => {
    const node = nodes.find(item => item.id === config.correct[index]);
    const slot = flowSlots[index];
    return Boolean(node && Math.hypot(node.x - slot.x, node.y - slot.y) < 8);
  });
  const ready = slotsFilled && isCorrect;
  return <div className="wiringV2">
    <SceneBackdrop image={`${A}stitch23/prologue-plan.png`} position="center" shade="soft" />
    <GameHeader chapter="BUILD THE REFERENCE" title="정상 기준 만들기" progressScene={state.scene} distanceMeters={state.policeGapMeters} onPause={() => send({ type: "PAUSE" })} />
    <div className="wiringTitle"><div><small>CONTROL PATH RESTORATION · GUIDED FUNCTION SLICE</small><h1><em className="puzzlePerspectiveTag" onMouseEnter={() => setHelpOpen(true)} onMouseLeave={() => setHelpOpen(false)} onFocus={() => setHelpOpen(true)}>{perspective.active} 수준</em><span>{mission.domain} 도메인 · {mission.feature}</span></h1><p><b>관찰 입력</b> {mission.input}<i>→</i><b>관찰 출력</b> {mission.output}</p></div><span>{source ? `${nodes.find(node => node.id === source)?.label} → 다음 카드` : `빈칸 ${gapIds.length}개 · 확대 ${Math.round(view.scale * 100)}%`}</span><div className="wiringToolbox"><button className={wireTool === "move" ? "active" : ""} onClick={() => { setWireTool("move"); setSource(""); setWireDraft(null); }}><img src={`${A}cursor-hand-open-v1.png`} alt="" /><small>이동</small></button><button className={wireTool === "pencil" ? "active" : ""} onClick={() => setWireTool("pencil")}><img src={`${A}detective-pencil-v1.png`} alt="" /><small>배선</small></button><button className={wireTool === "erase" ? "active" : ""} onClick={() => { setWireTool("erase"); setSource(""); setWireDraft(null); }}><img src={`${A}detective-eraser-v1.png`} alt="" /><small>지우개</small></button></div><button onClick={() => setHelpOpen(value => !value)}>도움말</button><button onClick={() => setRulesOpen(value => !value)}>규칙</button><button className="wiringHint" disabled={seconds < 60 || hintUsed} onClick={() => send({ type: "HINT", key: hintKey })}>{hintUsed ? `힌트: ${gapIds.join(" → ")}` : seconds < 60 ? `힌트 ${60 - seconds}초` : "힌트 · -5m"}</button><button onClick={() => { setNodes(spreadNodes()); setEdges(starterEdges()); setSource(""); setWireDraft(null); setView({ x: 0, y: 0, scale: initialWireScale() }); }}>초기화</button></div>
    {helpOpen && <aside className="perspectiveHelp"><button onClick={() => setHelpOpen(false)}>×</button><b>완성된 핵심 흐름의 빈칸 두 곳만 복원합니다</b><p><strong>현재 관점</strong> {perspective.active} · {perspective.depth}</p><p><strong>경계</strong> {perspective.input} → {perspective.middle} → {perspective.output}</p><p><strong>주의</strong> HW가 반드시 양끝일 필요는 없습니다. 이번 고장과 직접 연결된 기능 경계만 봅니다.</p></aside>}
      {rulesOpen && <aside className="wiringRules"><button className="wiringRulesClose" onClick={() => setRulesOpen(false)} aria-label="규칙 닫기">×</button><b>정상 기준 만들기 규칙</b><ol><li>요구사항(오른쪽)대로 <b>정상 로직</b>을 조립해요. 이게 메모판에서 이번 주행과 비교할 <b>기준</b>이 돼요.</li><li>아래 조각을 끌어 빈칸에 끼우면 자동으로 이어져요. <b>홈 모양이 같은 신호 종류</b>끼리만 맞아요.</li><li>모양이 맞아도 <b>사양이 다른 함정 조각</b>이 있어요. 눌러 보면 무슨 일을 하는지 알려 줘요.</li><li>선 아래 <b>신호 값</b>과 요구사항 ✓를 확인하고 완성해요.</li></ol></aside>}
    <main className="eePuzzle">
      <aside className="verticalRequirement"><small>REQUIREMENT FLOW</small>{config.requirement.map((item, index) => { const steps = REQ_OF_STEP.map((row, k) => row === index ? k : -1).filter(k => k >= 0); const done = steps.every(k => k === 0 ? edges.some(edge => edge.from === config.correct[0]) : edges.some(edge => edge.to === config.correct[k] && edge.from === config.correct[k - 1])); return <React.Fragment key={item}><div className={done ? "reqDone" : ""}>{done && <em className="reqTick">✓</em>}<span>{index === 0 ? "INPUT" : index === 1 ? "IF" : index === 3 ? "THEN" : index === 4 ? "OUTPUT" : "CONTROL"}</span><b>{item}</b></div>{index < config.requirement.length - 1 && <i>↓</i>}</React.Fragment>; })}</aside>
      <section className={`wireCanvas tool-${wireTool} ${eraser ? "erasing" : ""}`} ref={canvasRef} onContextMenu={event => event.preventDefault()} onWheel={event => { event.preventDefault(); setView(previous => ({ ...previous, scale: THREE.MathUtils.clamp(previous.scale * (event.deltaY > 0 ? .9 : 1.1), .48, 1.5) })); }} onPointerDown={event => { if (event.button === 2) setPanning({ x: event.clientX, y: event.clientY, ox: view.x, oy: view.y }); }} onPointerMove={event => { if (!canvasRef.current) return; if (panning) { setView(previous => ({ ...previous, x: panning.ox + event.clientX - panning.x, y: panning.oy + event.clientY - panning.y })); return; } const point = localPoint(event.clientX, event.clientY); if (wireTool === "pencil" && wireDraft) setWireDraft(previous => { if (!previous) return previous; const last = previous.points.at(-1)!; return Math.hypot(point.x - last.x, point.y - last.y) < 7 ? previous : { points: [...previous.points, point] }; }); if (!dragging) return; setNodes(previous => previous.map(node => node.id === dragging.id ? { ...node, x: THREE.MathUtils.clamp(point.x - dragging.dx / view.scale, 5, 1075), y: THREE.MathUtils.clamp(point.y - dragging.dy / view.scale, 5, 525) } : node)); }} onPointerUp={event => { snapDraggedNode(event.clientX, event.clientY); setDragging(null); setPanning(null); }} onPointerLeave={event => { snapDraggedNode(event.clientX, event.clientY); setDragging(null); setPanning(null); }}>
        <div className="wireWorld" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
        <div className="canvasGrid" />
        {gapIndexes.map(index => { const slot = flowSlots[index]; const node = nodes.find(item => item.id === config.correct[index]); const filled = Boolean(node && Math.hypot(node.x - slot.x, node.y - slot.y) < 8); return <div key={index} className={`guidedLogicSlot ${filled ? "filled" : ""}`} style={{ left: slot.x, top: slot.y }}><b>빈칸 {index - 1}</b><span>{config.correct[index] === gapIds[0] ? "판단·변환" : "명령·전달"}</span></div>; })}
        <svg viewBox="0 0 1000 560">{edges.map((edge, index) => { const a = nodes.find(node => node.id === edge.from); const b = nodes.find(node => node.id === edge.to); if (!a || !b) return null; const x1 = a.x + 128, y1 = a.y + 70, x2 = b.x + 12, y2 = b.y + 70, direction = index % 2 ? 1 : -1; const d = edge.points?.length ? curveFromPoints(edge.points) : `M ${x1} ${y1} C ${x1 + 55} ${y1 + 45 * direction}, ${x2 - 55} ${y2 - 45 * direction}, ${x2} ${y2}`; const pill = SIGNAL_VALUE[state.caseId][edge.from]; return <g key={`${edge.from}-${edge.to}`}>{pill && <g className="wirePill" transform={`translate(${(x1 + x2) / 2} ${(y1 + y2) / 2 + 92})`}><path d="M0 -24 L0 -12" className="pillStem" /><rect x={-38} y={-12} width={76} height={24} rx={12} /><text textAnchor="middle" y={5}>{pill}</text></g>}<path className="wormWire" d={d} onPointerEnter={() => eraser && setEdges(previous => previous.filter(item => item !== edge))} onClick={() => eraser && setEdges(previous => previous.filter(item => item !== edge))} /></g>; })}{source && wireDraft && <path className="wormWire wireDraft" d={curveFromPoints(wireDraft.points)} />}</svg>
        {nodes.map((node) => { const correctIndex = config.correct.indexOf(node.id); const locked = correctIndex >= 0 && !gapIndexes.includes(correctIndex); const inFlow = locked || flowSlots.some(slot => Math.hypot(node.x - slot.x, node.y - slot.y) < 8); const edgeClass = !inFlow ? "edge-square" : correctIndex >= 0 ? puzzleEdgeClass(correctIndex, config.correct.length) : "edge-mismatch"; return <div className={`logicNode puzzlePiece ${edgeClass} ${node.kind.toLowerCase()} ${source === node.id ? "source" : ""} ${locked ? "locked" : ""}`} style={{ left: node.x, top: node.y, ...(PIECE_IO[state.caseId][node.id] && inFlow ? { clipPath: piecePath(PIECE_IO[state.caseId][node.id]) } : {}) }} title={[PIECE_IO[state.caseId][node.id]?.in && `들어오는 신호: ${NUB_NAME[PIECE_IO[state.caseId][node.id].in!]}`, PIECE_IO[state.caseId][node.id]?.out && `나가는 신호: ${NUB_NAME[PIECE_IO[state.caseId][node.id].out!]}`].filter(Boolean).join(" · ")} key={node.id} onDoubleClick={event => { event.stopPropagation(); if (wireTool === "move") setZoomNode(node); }} onClick={event => { event.stopPropagation(); chooseWireNode(node); }} onPointerDown={event => { if (locked || wireTool !== "move" || event.button !== 0) return; const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect(); setDragging({ id: node.id, dx: event.clientX - rect.left, dy: event.clientY - rect.top }); (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId); }}>
          <PiecePicture node={node} /><div className="logicNodeCaption"><b>{node.label}</b><span>{node.detail}</span></div>
        </div>; })}
        </div>
        <div className="canvasHelp">조각을 끌어 빈칸에 끼우면 자동으로 이어져요 · 홈 모양 = 신호 종류(● % · ■ 힘·토크 · ⚡ 통신 명령 · ∿ PWM · ▶ 온도·압력) · 휠: 확대 · 우클릭 드래그: 작업대 이동</div>
      </section>
    </main>
    <button className="secretSolve" title="개발용 정답 적용" onClick={solvePuzzle}>정답 보기</button>
    <div className="wiringFooter"><span>{puzzleFeedback}</span><button className="primary" disabled={!ready} onClick={() => { send({ type: "COMPILE", program: isCorrect ? config.program : config.faulty }); send({ type: "OPEN_BOARD" }); }}>정상 기준 완성 → 메모판에서 비교</button></div>
    {zoomNode && <div className="evidenceZoom logicZoom" onClick={() => setZoomNode(null)}><article className="logicZoomCard" onClick={event => event.stopPropagation()}><button onClick={() => setZoomNode(null)}>×</button>{zoomNode.kind === "HW" ? <div className={`logicNodePhoto componentAssetPhoto asset-${componentAtlasCell[zoomNode.id] ?? 2}`}><small>HW · REAL PART</small></div> : <div className="logicNodePhoto simulinkNodeArt"><small>SW · CONTROL LOGIC</small><b>f(u)</b><i /><i /><i /></div>}<div className="logicZoomCopy"><small>{zoomNode.kind === "HW" ? "실물 부품 경계" : "제어 로직 블록"}</small><h2>{zoomNode.label}</h2><p>{zoomNode.detail}</p></div></article></div>}
  </div>;
}

export type BenchTab = "sw" | "embedded" | "system" | "vehicle";
function LabRaceView({ running, works, caseId }: { running: boolean; works: boolean; caseId: CaseId }) {
  const [sim, setSim] = useState<DriveSim>({ speed: 0, lane: 0, steer: 0, distance: 80, gap: 48, heat: caseId === "thermal" ? 68 : 38, elapsed: 18 });
  useEffect(() => {
    if (!running) return;
    const start = performance.now();
    let frame = 0;
    const loop = (now: number) => {
      const progress = Math.min(1, (now - start) / 1200);
      const distance = 80 + progress * (works ? 95 : 24);
      const speed = works ? 72 : Math.max(12, 46 - progress * 34);
      const steer = works ? Math.sin(progress * Math.PI) * .11 : .18;
      setSim({ speed, lane: works ? Math.sin(progress * Math.PI) * .35 : progress * .7, steer, distance, gap: 48 - progress * 7, heat: caseId === "thermal" ? 68 + progress * 5 : 38, elapsed: 18 + progress * 8 });
      if (progress < 1) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [running, works, caseId]);
  return <div className={`labRaceWorld ${works ? "works" : "broken"}`}><RaceWorld sim={sim} ship={false} /><div className="labRaceHud"><span>{Math.round(sim.speed)} km/h</span><b>{works ? "차량 응답 정상" : "명령 대비 출력 저하"}</b></div></div>;
}

function EmbeddedBenchScene({ caseId, running, works }: { caseId: CaseId; running: boolean; works: boolean }) {
  const inputKind: HardwareKind = caseId === "thermal" ? "sensor" : caseId === "brake" ? "brakepedal" : "pedal";
  const outputKind: HardwareKind = caseId === "thermal" ? "fan" : caseId === "brake" ? "caliper" : "motor";
  const labels = caseId === "thermal" ? ["냉각수 온도 센서(NTC)", "THERMAL ECU", "냉각 팬"] : caseId === "brake" ? ["페달 센서", "BRAKE ECU", "캘리퍼"] : ["APS 이중 센서", "VCU", "인버터·모터"];
  return <>
    {import.meta.env.DEV && <DevRenderProbe name="bench" />}
    <color attach="background" args={[works ? "#eaf5ee" : "#f5e8e3"]} />
    <hemisphereLight intensity={2.2} color="#fff8e8" groundColor="#678077" />
    <directionalLight castShadow position={[3, 6, 4]} intensity={2.8} />
    <group position={[-2.25, .62, 0]} scale={.94}><HardwarePart kind={inputKind} active running={running} partId={partModelFor(caseId === "brake" ? "brake" : caseId === "thermal" ? "thermal" : "drive", labels[0])} /><PartLabel position={[0, 1.32, 0]}>INPUT · {labels[0]}</PartLabel></group>
    <SignalCable from={[-1.72, .78, .04]} to={[-.68, .78, .04]} color="#4f9ab5" />
    <SignalCable from={[-1.72, .68, -.12]} to={[-.68, .68, -.12]} color="#e5c451" />
    <group position={[0, .72, 0]} scale={1.12}>
      <HardwarePart kind="ecu" active running={running} />
      <mesh position={[0, .02, .435]}><boxGeometry args={[.82, .4, .025]} /><meshStandardMaterial color="#263c37" roughness={.6} /></mesh>
      {[.26, .08, -.1, -.28].map((x, index) => <mesh key={x} position={[x, .04, .458]}><boxGeometry args={[.11, .18, .018]} /><meshStandardMaterial color={index === 3 ? (works ? "#f2c753" : "#c95a52") : index % 2 ? "#7bb9b0" : "#9b83c4"} emissive={index === 3 ? (works ? "#a37300" : "#6b1510") : "#172c28"} emissiveIntensity={running ? .8 : .15} /></mesh>)}
      <mesh position={[0, -.16, .46]}><boxGeometry args={[.76, .055, .025]} /><meshStandardMaterial color={works ? "#56b997" : "#cf665d"} emissive={works ? "#1f7f61" : "#8b201a"} emissiveIntensity={running ? 1.2 : .2} /></mesh>
      <PartLabel position={[0, 1.26, 0]}>CONTROL UNIT · {labels[1]} · SW 내장</PartLabel>
    </group>
    <SignalCable from={[.68, .78, .04]} to={[1.66, .78, .04]} color={works ? "#ef8a4f" : "#be514f"} />
    <SignalCable from={[1.66, .62, -.16]} to={[.68, .62, -.16]} color={works ? "#56a68d" : "#7f7772"} />
    <group position={[2.25, .68, 0]} scale={.96}><HardwarePart kind={outputKind} active={works} running={running && works} partId={partModelFor(caseId === "brake" ? "brake" : caseId === "thermal" ? "thermal" : "drive", labels[2])} /><PartLabel position={[0, 1.32, 0]}>OUTPUT · {labels[2]} {works ? "정상 응답" : "무응답"}</PartLabel></group>
    <group position={[0, .03, -.7]}>
      <RoundedBox args={[5.65, .16, 2.5]} radius={.12}><meshStandardMaterial color="#cfd9d2" roughness={.74} /></RoundedBox>
      {[-2.55, 2.55].flatMap(x => [-.95, .95].map(z => <mesh key={`${x}-${z}`} position={[x, -.38, z]}><cylinderGeometry args={[.08, .08, .8, 14]} /><meshStandardMaterial color="#77847f" metalness={.7} /></mesh>))}
    </group>
    <group position={[0, .45, -1.36]}><RoundedBox args={[1.45, .66, .5]} radius={.1}><meshStandardMaterial color="#6c7d76" metalness={.55} /></RoundedBox><mesh position={[0, .03, .27]}><boxGeometry args={[1.08, .28, .025]} /><meshStandardMaterial color="#b9e0cd" emissive="#387862" emissiveIntensity={running ? .7 : .15} /></mesh><PartLabel position={[0, .72, 0]}>I/O LOAD · 전원·부하·계측</PartLabel></group>
  </>;
}

export function EmbeddedBench3D({ caseId, running, works, wide = false, compact = false }: { caseId: CaseId; running: boolean; works: boolean; wide?: boolean; compact?: boolean }) {
  const camera = compact ? { position: [0, 2.25, 4.35] as [number, number, number], fov: 36 } : { position: [0, wide ? 3.8 : 3.15, wide ? 9.1 : 7.2] as [number, number, number], fov: wide ? 43 : 40 };
  return <div className={`benchEmbedded3D ${running ? "running" : ""} ${works ? "works" : "broken"} ${wide ? "wideView" : ""} ${compact ? "compactView" : ""}`}><Canvas shadows camera={camera} dpr={[1, 1.15]}><EmbeddedBenchScene caseId={caseId} running={running} works={works} /><OrbitControls enablePan minDistance={compact ? 3.6 : wide ? 7.1 : 5.8} maxDistance={compact ? 8 : 12} maxPolarAngle={Math.PI * .48} target={[0, .5, -.25]} /></Canvas><div className="embeddedBoundaryLabels"><span>INPUT SENSOR / DRIVER DEVICE</span><b>REAL ECU + I/O HARNESS</b><em>OUTPUT ACTUATOR + FEEDBACK</em></div></div>;
}

export function BenchVisual({ tab, caseId, running, works }: { tab: BenchTab; caseId: CaseId; running: boolean; works: boolean }) {
  const swNodes = caseId === "propulsion" ? [["APS A/B", "60.0 / 60.2%"], ["PLAUSIBILITY", "MATCH · 10ms"], ["DRIVER REQUEST", works ? "204Nm" : "92Nm"], ["DRIVE PERMIT", "D · READY"], ["TRACTION LIMIT", "NO SLIP"], ["POWER LIMIT", "MIN 240Nm"], ["TORQUE RAMP", works ? "+24Nm/s" : "+9Nm/s"], ["CAN COMMAND", works ? "204Nm" : "92Nm"]] : caseId === "thermal" ? [["COOLANT NTC", "78.4°C"], ["RANGE CHECK", "VALID"], ["DEBOUNCE", "120ms"], ["HYSTERESIS", ">65°C ON"], ["DERATE STATE", "LEVEL 1 · 토크 제한"], ["FAN TARGET", "1850RPM"], ["PWM DRIVER", "100%"], ["FEEDBACK", works ? "1846RPM" : "0RPM"]] : [["PEDAL A/B", "55 / 55.3%"], ["VALIDATE", "MATCH"], ["DECEL TARGET", "3.2m/s²"], ["REGEN LIMIT", "1.1m/s²"], ["BLEND", works ? "REGEN+FRICTION" : "REGEN ONLY"], ["ABS GUARD", "NO SLIP"], ["PRESSURE CMD", works ? "42bar" : "8bar"], ["WHEEL RESPONSE", works ? "DECEL" : "LOW DECEL"]];
  const swPositions = [[4,14],[27,14],[50,14],[73,14],[73,62],[50,62],[27,62],[4,62]];
  if (tab === "sw") return <div className={`benchSwVisual detailed ${running ? "running" : ""} ${works ? "works" : "broken"}`}><div className="simulinkModelHeader"><b>요구사항 기반 실행 모델 · MIL/SIL 개념</b><span>입력 검증 → 상태/분기 → 제어 계산 → 제한 → 출력 → 폐루프 피드백</span></div><div className="swFlowchart"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M13 25 H27 M36 25 H50 M59 25 H73 M82 25 V62 M73 74 H59 M50 74 H36 M27 74 H13" /><path className="feedback" d="M13 74 C3 74 3 25 13 25" /></svg>{swNodes.map(([name,value],index)=><span key={name} style={{left:`${swPositions[index][0]}%`,top:`${swPositions[index][1]}%`}} className={`swDiagramBlock ${index===1?"decision":""} ${index===7?"sink":""}`}><i>{index===1?"◇":String(index+1).padStart(2,"0")}</i><b>{name}</b><small>{value}</small><u className="swInPort" /><u className="swOutPort" /></span>)}<em className="swFeedbackLabel">FEEDBACK · 상태/진단 경계로 되먹임</em></div></div>;
  if (tab === "embedded") return <EmbeddedBench3D caseId={caseId} running={running} works={works} />;
  if (tab === "system") return <div className={`systemBenchVisual ${running ? "running" : ""} ${works ? "works" : "broken"}`}><header><b>차량 시스템 통합 · 가상 차량/네트워크</b><span>여러 ECU와 물리 플랜트의 상호작용을 한 기능 시나리오로 검증</span></header><section><article><small>DRIVER / ENV</small><b>{caseId === "thermal" ? "열부하 78.4°C" : caseId === "brake" ? "제동 요구 55%" : "가속 요구 60%"}</b></article><i>CAN FD</i><article><small>DOMAIN CONTROLLERS</small><b>VCU · BMS · Brake · Thermal</b><em className="networkBus" /></article><i>COMMAND</i><article><small>VEHICLE PLANT</small><b>{works ? "요구 성능 만족" : "통합 경계에서 불일치"}</b></article></section><footer><span>요구사항</span><i /><span>기능 네트워크</span><i /><span>차량 거동</span></footer></div>;
  return <div className={`benchVehicleVisual ${running ? "running" : ""} ${works ? "works" : "broken"}`}><LabRaceView running={running} works={works} caseId={caseId} /><div className="vehicleReadout"><span>요구<b>{caseId === "propulsion" ? "60%" : caseId === "thermal" ? "72°C" : "55%"}</b></span><span>응답<b>{works ? "정상 범위" : "반응 없음"}</b></span></div></div>;
}

function TwinDesign({ title, subtitle, tab, caseId, running, works, result }: { title: string; subtitle: string; tab: BenchTab; caseId: CaseId; running: boolean; works: boolean; result?: boolean }) {
  const scope = tab === "sw" ? "SW 요구사항·로직 경계" : tab === "embedded" ? "실 ECU I/O·하니스·가상 Plant" : tab === "system" ? "다중 ECU·차량 기능 통합" : "주행 시나리오·차량 응답";
  const designKind = title.startsWith("정상") ? "referenceDesign" : "playerDesign";
  return <section className={`twinDesign ${designKind} ${result === undefined ? "idle" : result ? "pass" : "fail"}`}><header><div><small>{subtitle}</small><h2>{title}</h2></div></header><BenchVisual tab={tab} caseId={caseId} running={running} works={works} /><footer><span>{scope}</span><b>{result === undefined ? "시험 전" : result ? "기대 경로와 일치" : tab === "sw" ? "로직 출력이 처음 갈라짐" : tab === "embedded" ? "ECU I/O 또는 부품 피드백 불일치" : tab === "system" ? "ECU 간 기능 통합 불일치" : "차량 수준 성능 불일치"}</b></footer></section>;
}

export function TwinBenchExperience({ state, send }: { state: Campaign; send: Send }) {
  const tabs = [{ id: "sw", label: "SW", desc: "모델/코드 로직" }, { id: "embedded", label: "ECU 통합", desc: "HIL 개념·I/O" }, { id: "system", label: "시스템", desc: "다중 ECU·기능" }, { id: "vehicle", label: "차량", desc: "주행 시나리오" }] as const;
  const requestedTab = new URLSearchParams(location.search).get("tab") as BenchTab | null;
  const [tab, setTab] = useState<BenchTab>(requestedTab && ["sw", "embedded", "system", "vehicle"].includes(requestedTab) ? requestedTab : "sw");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Partial<Record<BenchTab, boolean>>>({});
  const [testTechnique, setTestTechnique] = useState<"requirement" | "boundary" | "fault">("requirement");
  const [stimulus, setStimulus] = useState<"nominal" | "limit">("nominal");
  const scenario = SCENARIOS[state.caseId];
  const correctCause = state.hypothesis[state.caseId] === scenario.root;
  const expectedProgram = state.caseId === "propulsion" ? "nominal" : state.caseId === "thermal" ? "thermal_closed_loop" : "blended_brake";
  const correctProgram = state.program[state.caseId] === expectedProgram;
  const works = correctCause && correctProgram;
  const allRun = tabs.every(item => results[item.id] !== undefined);
  const activeResult = results[tab];
  const report = state.caseId === "propulsion"
    ? { id: "REQ-DRV-01", expected: "APS 60% → 204 Nm", actual: works ? "204 Nm" : "92 Nm", boundary: "Driver Torque Map" }
    : state.caseId === "thermal"
      ? { id: "REQ-THM-02", expected: "78.4°C → Fan 1850 RPM", actual: works ? "1846 RPM" : "0 RPM", boundary: "Fan PWM / feedback" }
      : { id: "REQ-BRK-03", expected: "Pedal 55% → 42 bar", actual: works ? "42 bar" : "8 bar", boundary: "Regen/Friction Blend" };
  const run = () => { setRunning(true); window.setTimeout(() => { setRunning(false); setResults(previous => ({ ...previous, [tab]: works })); }, 1250); };
  const revealAnswer = () => { send({ type: "DEV_SOLVE" }); setResults({ sw: true, embedded: true, system: true, vehicle: true }); };
  const actualValue = activeResult === undefined ? "실행 전" : activeResult ? report.actual : state.caseId === "propulsion" ? "92 Nm" : state.caseId === "thermal" ? "0 RPM" : "8 bar";
  return <div className={`benchV2 labTab-${tab}`}>
    <SceneBackdrop image={`${A}stitch23/investigation-lab.png`} position="center" shade="soft" />
    <GameHeader chapter="MING'S V-MODEL LAB" title="요구사항 기반 V-모델 검증 실험실" progressScene={state.scene} distanceMeters={state.policeGapMeters} onPause={() => send({ type: "PAUSE" })} />
    <main className="catLab">
      <header className="labHeader"><div className="labCat"><img src={`${A}ASSET_003_Cat_Face_Identity_REFERENCE.png`} alt="" /><span><b>엔지니어 밍의 3D 통합 실험실</b><small>같은 요구사항·시험 입력을 SW→ECU→시스템→차량 경계에서 비교합니다.</small></span></div><nav>{tabs.map(item => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}><b>{item.label}</b><small>{item.desc}</small>{results[item.id] !== undefined && <i className={results[item.id] ? "ok" : "bad"} />}</button>)}</nav></header>
      <div className="twinCompare"><TwinDesign title="정상 시나리오 설계" subtitle="REFERENCE DESIGN" tab={tab} caseId={state.caseId} running={running} works result={activeResult === undefined ? undefined : true} /><div className="versus"><span>동일 입력</span><b>VS</b><i /></div><TwinDesign title="내가 만든 설계" subtitle="PLAYER DESIGN" tab={tab} caseId={state.caseId} running={running} works={works} result={activeResult} /></div>
      {activeResult === false && <aside className="benchExplanation fail"><b>최초 불일치 경계 · {report.boundary}</b><p>{tab === "sw" ? "선택한 블록 또는 연결 순서 때문에 CONTROL 경계부터 기준 출력과 달라졌습니다." : tab === "embedded" ? "실 ECU의 I/O 또는 가상 Plant 피드백에서 명령과 반응이 갈라졌습니다." : tab === "system" ? "ECU 간 신호·기능 통합에서 요구 차량 기능이 성립하지 않았습니다." : "앞 단계의 차이가 누적되어 차량 시나리오 성능이 기준에 못 미칩니다."}</p></aside>}
      <div className="labConsole tcConsole"><section className="tcWorkbench"><header><small>TEST CASE · {report.id}</small><b>{tabs.find(item => item.id === tab)?.label} 경계 시험</b></header><div className="tcChoices"><span>기법</span><button className={testTechnique === "requirement" ? "active" : ""} onClick={() => setTestTechnique("requirement")}>요구사항 기반</button><button className={testTechnique === "boundary" ? "active" : ""} onClick={() => setTestTechnique("boundary")}>경계값</button><button className={testTechnique === "fault" ? "active" : ""} onClick={() => setTestTechnique("fault")}>고장 주입</button><span>인가값</span><button className={stimulus === "nominal" ? "active" : ""} onClick={() => setStimulus("nominal")}>정상값</button><button className={stimulus === "limit" ? "active" : ""} onClick={() => setStimulus("limit")}>한계값</button></div><dl><div><dt>INPUT</dt><dd>{stimulus === "nominal" ? report.expected.split("→")[0] : "경계 ±1 step"}</dd></div><div><dt>EXPECTED</dt><dd>{report.expected.split("→").at(-1)}</dd></div><div><dt>ACTUAL</dt><dd>{actualValue}</dd></div><div><dt>VERDICT</dt><dd>{activeResult === undefined ? "—" : activeResult ? "PASS" : "FAIL"}</dd></div></dl></section><button className="runLab" disabled={running} onClick={run}>{running ? "실험 중…" : `▶ ${tabs.find(item => item.id === tab)?.label} 시험 실행`}</button><button className="primary" disabled={!allRun} onClick={() => send({ type: "BENCH_RESULT", pass: works, causeCorrect: correctCause })}>{!allRun ? `검증 ${Object.keys(results).length}/4` : works ? "수리 적용으로 →" : "실패 원인 해설 보기 →"}</button></div>
    </main>
    <button className="secretSolve" title="개발용 정답 적용" onClick={revealAnswer}>정답 보기</button>
  </div>;
}

export function FailureAnalysis({ state, send }: { state: Campaign; send: Send }) {
  const [step, setStep] = useState(0);
  const scenario = SCENARIOS[state.caseId];
  const config = puzzleConfig[state.caseId];
  const root = scenario.hypotheses.find(item => item.id === scenario.root)!;
  const correctLabels = config.correct.map(id => config.blocks.find(block => block.id === id)?.label ?? id);
  useEffect(() => { const timer = window.setInterval(() => setStep(value => Math.min(4, value + 1)), 850); return () => clearInterval(timer); }, []);
  const expected = state.caseId === "propulsion" ? "APS 60% → Torque 204Nm" : state.caseId === "thermal" ? "Fan CMD 100% → 1850RPM" : "Brake 55% → 42bar";
  const actual = state.caseId === "propulsion" ? "APS 60% → Torque 92Nm" : state.caseId === "thermal" ? "Fan CMD 100% → 0RPM" : "Brake 55% → 8bar";
  return <div className="failureAnalysis">
    <SceneBackdrop image={`${A}stitch23/investigation-lab.png`} position="center" shade="deep" />
    <GameHeader chapter="GUIDED DIAGNOSIS" title="실패 원인 해설" progressScene={state.scene} onPause={() => send({ type: "PAUSE" })} />
    <PursuitRouteBar compact distance={state.raceDistance} gap={state.policeGapMeters} />
    <main><section className="analysisHeader"><img src={`${A}ASSET_003_Cat_Face_Identity_REFERENCE.png`} alt="" /><div><small>ENGINEER MING · STEP BY STEP</small><h1>틀린 지점부터 정상 경로까지 직접 재생할게</h1><p>다시 메모판으로 돌려보내지 않고, 이번 한 판 안에서 풀이를 완성한 뒤 수리와 주행 복귀까지 이어집니다.</p></div></section><section className="analysisCompare"><div><small>EXPECTED</small><b>{expected}</b></div><i>≠</i><div><small>ACTUAL</small><b>{actual}</b></div></section><section className="guidedSteps">{[
      ["1 · 최초 차이", `기준과 실제가 처음 갈라진 경계는 ${state.caseId === "thermal" ? "ECU 명령 이후 실제 팬 피드백" : state.caseId === "brake" ? "제동력 배분 이후 마찰 압력" : "토크 맵 출력"}입니다.`],
      ["2 · 원인 판정", `${root.label}: ${root.desc}`],
      ["3 · 정상 연결", correctLabels.join(" → ")],
      ["4 · 수정 결과", `${expected}로 회복되는 것을 SW·임베디드·차량 수준에서 다시 확인했습니다.`],
    ].map(([title, body], index) => <article key={title} className={step > index ? "shown" : ""}><span>{step > index ? "✓" : index + 1}</span><div><b>{title}</b><p>{body}</p></div></article>)}</section>{step >= 4 && <button className="primary" onClick={() => send({ type: "GUIDED_REPAIR" })}>해설의 정상 설계를 적용하고 수리 계속 →</button>}</main>
  </div>;
}

export function RepairSequence({ state, send }: { state: Campaign; send: Send }) {
  const [ready, setReady] = useState(false);
  const [countdown, setCountdown] = useState(3);
  useEffect(() => { const timer = window.setTimeout(() => setReady(true), 1900); return () => clearTimeout(timer); }, []);
  useEffect(() => {
    if (!ready) return;
    if (countdown <= 0) { send({ type: "APPLY_REPAIR" }); return; }
    const timer = window.setTimeout(() => setCountdown(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, ready, send]);
  const isOta = state.caseId === "propulsion";
  return <div className="repairV2">
    <SceneBackdrop image={`${A}stitch23/investigation-lab.png`} position="center" shade="soft" />
    <GameHeader chapter="RECOVERY SEQUENCE" title="검증된 수리 적용" progressScene={state.scene} distanceMeters={state.policeGapMeters} onPause={() => send({ type: "PAUSE" })} />
    <main><section className={`repairMechanism repairMechanism3D ${ready ? "fixed" : "working"}`}><EmbeddedBench3D caseId={state.caseId} running works={ready} wide /><span>{ready ? "입력 센서 → ECU의 검증된 SW → 출력 액추에이터 정상 응답" : isOta ? "검증된 제어 로직을 ECU에 OTA 전송 중…" : "ECU 명령과 실제 출력 액추에이터 응답 복원 중…"}</span></section><section className="repairDialogue"><img src={`${A}ASSET_003_Cat_Face_Identity_REFERENCE.png`} alt="" /><div><small>ENGINEER MING</small><h1>{ready ? "수리 완료!" : "복구 적용 중"}</h1><p>{ready ? (isOta ? "OTA 업데이트로 페달 신호 변환을 정상화했어! 휴, 달리던 곳으로 바로 돌아가자." : "제어 명령과 실제 출력 액추에이터 응답을 모두 복원했어! 달리던 지점으로 돌아가자.") : "검증을 통과한 설계만 ECU와 실제 부품에 적용하고 있어."}</p><b>현재 주행 지점 {Math.round(state.raceDistance)}m · 추격차 격차 {Math.round(state.policeGapMeters)}m</b></div>{ready && <div className="autoResumeCountdown"><strong>{Math.max(0, countdown)}</strong><span>초 후 달리던 지점에서 자동 주행 복귀</span></div>}</section></main>
  </div>;
}

function ShipJumpScene({ onBeat }: { onBeat: (beat: number) => void }) {
  const car = useRef<THREE.Group>(null!);
  const ramp = useRef<THREE.Group>(null!);
  const police = useRef<THREE.Group>(null!);
  const start = useRef<number | null>(null);
  const lastBeat = useRef(-1);
  useFrame(({ clock, camera }) => {
    if (start.current === null) start.current = clock.elapsedTime;
    const seconds = Math.min(5.4, clock.elapsedTime - start.current);
    const beat = Math.min(4, Math.floor(seconds / 1.08));
    if (beat !== lastBeat.current) { lastBeat.current = beat; onBeat(beat); }
    const takeoff = THREE.MathUtils.smoothstep(seconds, .45, 1.45);
    const flight = THREE.MathUtils.smoothstep(seconds, 1.35, 4.4);
    const landing = THREE.MathUtils.smoothstep(seconds, 4.15, 5.05);
    ramp.current.rotation.z = THREE.MathUtils.lerp(.03, .22, takeoff);
    const x = THREE.MathUtils.lerp(-6.3, 5.3, flight);
    // Deterministic ballistic motion: the take-off velocity is chosen so the
    // car returns to deck height at the end of the 3.05 s flight.
    const flightDuration = 3.05;
    const flightTime = flight * flightDuration;
    const gravity = 2.9;
    const launchVelocityY = gravity * flightDuration * .5;
    const arc = launchVelocityY * flightTime - .5 * gravity * flightTime * flightTime;
    const verticalVelocity = launchVelocityY - gravity * flightTime;
    const horizontalVelocity = 11.6 / flightDuration;
    car.current.position.set(x, flight < .995 ? .62 + Math.max(0, arc) : .62, 0);
    car.current.rotation.z = flight < .995 ? -Math.atan2(verticalVelocity, horizontalVelocity) * .32 : THREE.MathUtils.lerp(.12, 0, landing);
    car.current.rotation.y = Math.PI / 2 - .16;
    police.current.position.x = THREE.MathUtils.lerp(-8.4, -5.9, takeoff);
    camera.position.lerp(new THREE.Vector3(0,3.35,12.8), .08);
    camera.lookAt(0,1.35,0);
  });
  return <>
    <color attach="background" args={["#f2b77f"]} />
    <fog attach="fog" args={["#efbd8d",22,55]} />
    <hemisphereLight intensity={2.2} color="#fff4d8" groundColor="#4b7772" />
    <directionalLight castShadow position={[-6,10,8]} intensity={3.4} color="#ffe2aa" />
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.5,0]}><planeGeometry args={[40,30]} /><meshPhysicalMaterial color="#3b93ac" roughness={.24} clearcoat={.75} /></mesh>
    <group position={[-7.2,0,0]}><RoundedBox args={[8,.5,4.2]} radius={.16} position={[0,-.02,0]}><meshStandardMaterial color="#75523a" roughness={.82} /></RoundedBox><PartLabel position={[0,.65,0]}>PIER · TAKE-OFF ZONE</PartLabel></group>
    <group ref={ramp} position={[-4.75,.12,0]}>
      <RoundedBox args={[5.9,.34,3.05]} radius={.12} position={[2.95,0,0]} castShadow><meshStandardMaterial color="#b18356" roughness={.75} /></RoundedBox>
      {Array.from({length:8},(_,i)=><mesh key={i} position={[.4+i*.75,.21,0]}><boxGeometry args={[.1,.1,2.85]} /><meshStandardMaterial color="#65442f" /></mesh>)}
      {[-1.38,1.38].map(z => <mesh key={z} position={[3,.48,z]} rotation={[0,0,-.03]}><boxGeometry args={[5.7,.1,.1]} /><meshStandardMaterial color="#ead3a1" emissive="#6b4b2d" emissiveIntensity={.25} /></mesh>)}
      <PartLabel position={[2.8,.82,0]}>UPHILL LEVER RAMP</PartLabel>
    </group>
    <group position={[6.4,.4,0]}><RoundedBox args={[8.6,1.25,5.7]} radius={.7} position={[0,-.12,0]} castShadow><meshPhysicalMaterial color="#352522" roughness={.5} metalness={.16} clearcoat={.25} /></RoundedBox><RoundedBox args={[7.4,.34,4.6]} radius={.18} position={[-.3,.67,0]}><meshStandardMaterial color="#9c744f" roughness={.78} /></RoundedBox><mesh position={[1.2,4.7,0]}><cylinderGeometry args={[.13,.22,7.8,18]} /><meshStandardMaterial color="#322722" /></mesh><mesh position={[3.25,4.55,0]} rotation={[0,0,-.13]}><planeGeometry args={[4.2,3.2]} /><meshStandardMaterial color="#bd4945" side={THREE.DoubleSide} /></mesh><PartLabel position={[0,2.1,0]}>THE RED WHISKER · DECK</PartLabel></group>
    <group ref={car} scale={.84}><HeroConvertible steer={0} spin={18} speed={60} /></group>
    <group ref={police} position={[-8.4,.02,0]} rotation={[0,Math.PI/2,0]} scale={.76}><PoliceInterceptor spin={12} /></group>
  </>;
}

export function ShipBoardingSequence({ send }: { send: Send }) {
  const [beat, setBeat] = useState(0);
  useEffect(() => { const endTimer = window.setTimeout(() => send({ type: "COMPLETE_ENDING" }), 5900); return () => window.clearTimeout(endTimer); }, [send]);
  const captions = ["부두 끝 · 갑판이 올라간다!", "나무 연결판이 지렛대처럼 들린다", "루와 밍의 붉은 EV, 도약!", "측면 비행 · 경찰차는 부두에 멈춤", "해적선 갑판 안착 — 탈출 성공"];
  return <div className={`shipBoarding shipJump beat-${beat}`}><Canvas shadows camera={{position:[0,3.35,12.8],fov:43}} dpr={[1,1.3]} gl={{antialias:true,powerPreference:"high-performance"}}><ShipJumpScene onBeat={setBeat} /></Canvas><div className="boardingCaption"><small>FINAL · THELMA-STYLE DOCK JUMP</small><h1>{captions[beat]}</h1><p>{beat < 4 ? "올라가는 나무 램프를 타고 해적선 갑판으로 날아갑니다." : "차량과 두 고양이가 모두 갑판에 안전하게 착지했습니다."}</p></div></div>;
}
