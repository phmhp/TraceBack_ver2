// STEP01 learning missions. Only functions whose signal flow and numbers are backed by the simulation
// models carry a mission; every other function stays "info exploration" until its content is verified
// (decision D5: no invented questions, values or signals).
//
// Chain labels below are the labels of `getFeatureLayer(domain, feature, 1)` in experiences.tsx — the Vehicle/System
// and E/E views show the same chain, so a "pick" answer works in both views.
// Numbers are `{group.key}` tokens resolved from the models by garageFacts.ts.
import type { CaseId } from "../../game/runtime";

export type DomainKey = "drive" | "brake" | "steer" | "power" | "gear" | "thermal" | "suspension";
export type Lens = 0 | 1 | 2; // 0 Vehicle/System · 1 E/E · 2 Control SW

export type Choice = { label: string; ok: boolean; why: string };
export type MissionQuestion = {
  id: string;
  lens: Lens;
  tag: string; // what the player is learning in this question
  q: string;
  how: string; // one-line instruction for the action
  kind: "pick" | "choose";
  needsInput?: boolean; // pick: the live input must be selected first (signal visible)
  answer?: string[]; // pick: accepted chain labels
  choices?: Choice[];
  recap: string; // concept summary after solving
  cat: { start: string; solved: string; wrong: string };
};
export type Mission = {
  domain: DomainKey;
  feature: number;
  core: boolean; // required for STEP01 completion (covers Vehicle, E/E and Control SW concepts)
  caseLink?: CaseId; // recommended before this fault case; not required for STEP01
  title: string;
  questions: MissionQuestion[];
  summary: string;
};

export const MISSIONS: Mission[] = [
  {
    domain: "drive", feature: 0, core: true, caseLink: "propulsion", title: "운전자 토크 요청",
    summary: "페달 값은 확인·필터링·맵·한계·램프를 거쳐 토크 명령이 되고, CAN을 타고 인버터와 모터로 가서 차량 가속이 됩니다.",
    questions: [
      {
        id: "drive:0:why", lens: 0, tag: "기능의 필요성", kind: "choose",
        q: "페달 입력을 그대로 모터 토크로 쓰면 안 되는 이유는 무엇일까요?",
        how: "이유를 하나 고르세요",
        choices: [
          { label: "센서 값은 확인·정리가 필요하고, 페달 끝까지 밟으면 차가 낼 수 있는 한계를 넘는 요청이 되어서", ok: true, why: "맞아요. 페달 100%를 그대로 쓰면 {drive.req100} Nm를 요청하는데, 이 차의 가용 토크 한계는 {drive.arb100} Nm예요(BMS·온도 한계)." },
          { label: "모터가 페달 신호의 모양을 이해하지 못해서", ok: false, why: "신호 모양은 변환하면 돼요. 문제는 값이 항상 안전하고 가능한 범위라는 보장이 없다는 점이에요." },
          { label: "토크는 클수록 항상 좋아서", ok: false, why: "가용 한계를 넘는 요청은 배터리와 모터를 보호하려면 낼 수 없어요." },
        ],
        recap: "제어기는 운전자 입력을 그대로 전달하지 않고, 안전하게 낼 수 있는 토크 요청으로 바꿔요.",
        cat: { start: "먼저 왜 이런 기능이 필요한지 생각해 볼까?", solved: "페달 값은 그대로 쓰기엔 위험해서 제어기가 다듬어 줘요.", wrong: "센서 값과 차의 한계를 같이 떠올려 보세요." },
      },
      {
        id: "drive:0:first", lens: 1, tag: "신호 경로", kind: "pick", needsInput: true, answer: ["VCU"],
        q: "가속 페달 센서의 값을 받아 판단하는 제어기는 어디일까요?",
        how: "E/E 관점에서 READY·D단을 켜고 입력을 꾹 누른 뒤, 노드를 눌러 답하세요",
        recap: "APS 센서 A/B 값은 VCU(차량 제어기)로 들어가요. 토크를 정하는 판단은 VCU 안에서 해요.",
        cat: { start: "입력을 꾹 눌러서 신호를 흘려 보내 봐!", solved: "맞아요! 센서 값은 VCU가 받아서 판단해요.", wrong: "센서 바로 다음에 신호가 들어가는 제어기를 찾아보세요." },
      },
      {
        id: "drive:0:bus", lens: 1, tag: "통신 경로", kind: "pick", needsInput: true, answer: ["CAN 토크"],
        q: "VCU가 계산한 토크 명령은 어떤 통신을 타고 인버터 쪽으로 갈까요?",
        how: "E/E 도면에서 토크 명령을 나르는 노드를 눌러 답하세요",
        recap: "토크 명령은 CAN 메시지로 MCU·인버터 ECU에 전달돼요. 센서→제어기, 제어기→제어기 연결은 서로 달라요.",
        cat: { start: "이번엔 E/E 도면이야. 명령이 지나가는 길을 찾아봐.", solved: "CAN 통신으로 명령이 전달돼요.", wrong: "제어기 사이에서 메시지를 나르는 노드예요." },
      },
      {
        id: "drive:0:permit", lens: 2, tag: "SW 판단 조건", kind: "choose",
        q: "VCU 안에서 D단과 READY가 모두 맞을 때만 토크를 통과시키는 블록은 무엇일까요?",
        how: "블록 이름을 고르세요",
        choices: [
          { label: "구동 허용", ok: true, why: "맞아요. 구동 허용 블록은 D단이고 READY일 때만 토크 요청을 다음으로 넘겨요." },
          { label: "입력 필터", ok: false, why: "입력 필터는 순간적으로 튀는 값을 걸러내요. 조건 판단은 하지 않아요." },
          { label: "램프율", ok: false, why: "램프율은 토크 요청이 급하게 변하지 않도록 기울기를 제한해요." },
        ],
        recap: "제어 SW는 입력값뿐 아니라 D단·READY 같은 허용 조건을 먼저 확인해요.",
        cat: { start: "SW 블록도에서 조건을 확인하는 블록을 떠올려 봐.", solved: "조건을 확인한 뒤에야 토크가 나가요.", wrong: "‘조건이 맞을 때만 통과’시키는 블록이에요." },
      },
      {
        id: "drive:0:limit", lens: 2, tag: "토크 제한이 필요한 이유", kind: "choose",
        q: "‘가용 토크 MIN’ 블록이 없다면 페달을 끝까지 밟았을 때 무슨 일이 생길까요?",
        how: "결과를 고르세요",
        choices: [
          { label: "{drive.req100} Nm 요청이 그대로 나가 가용 한계 {drive.arb100} Nm를 넘어요", ok: true, why: "맞아요. 맵은 페달 100%를 {drive.req100} Nm로 바꾸고, MIN 블록이 가용 한계 {drive.arb100} Nm로 잘라 줘요. (정상 모델 계산값)" },
          { label: "토크가 0이 돼요", ok: false, why: "MIN은 큰 값을 한계로 자르는 블록이에요. 요청이 0이 되지는 않아요." },
          { label: "아무 차이가 없어요", ok: false, why: "페달을 많이 밟을수록 요청과 한계의 차이가 커져요." },
        ],
        recap: "토크 제한(MIN)은 차가 낼 수 없는 요청이 하위 시스템으로 전달되지 않게 막아요.",
        cat: { start: "숫자를 비교해 보면 이유가 보여요.", solved: "한계 블록이 안전을 지켜 줘요.", wrong: "맵이 만든 값과 가용 토크 한계를 비교해 보세요." },
      },
      {
        id: "drive:0:result", lens: 0, tag: "시스템 통합", kind: "choose",
        q: "토크 명령이 CAN과 인버터, 모터, 감속기를 거치면 차량에는 최종적으로 어떤 결과가 나타날까요?",
        how: "결과를 하나 고르세요",
        choices: [
          { label: "바퀴가 노면에 구동력을 전달해 차량이 가속해요", ok: true, why: "맞아요. 페달 60%는 모터 {drive.mot60} Nm가 되어 차량 가속 약 {drive.acc60} m/s²로 나타나요. (정상 모델 계산값)" },
          { label: "배터리가 충전되며 차량이 감속해요", ok: false, why: "충전(회생)은 제동 때 생겨요. 가속할 때는 배터리 에너지를 써서 구동력을 만들어요." },
          { label: "아무 변화가 없어요", ok: false, why: "토크 명령이 끝까지 전달되면 바퀴가 구동력을 내서 속도가 변해요." },
        ],
        recap: "페달 입력은 센서→VCU 판단→CAN 명령→인버터·모터→감속기→바퀴를 거쳐 차량 가속이 돼요. 세 관점은 같은 흐름을 다른 수준에서 본 거예요.",
        cat: { start: "처음부터 끝까지 이어서 생각해 봐!", solved: "페달에서 바퀴까지 한 흐름으로 연결됐어요.", wrong: "토크가 끝까지 전달되면 바퀴에서 어떤 일이 생길까요?" },
      },
    ],
  },
  {
    domain: "drive", feature: 1, core: false, title: "D단 구동 인터록",
    summary: "D단과 READY 조건이 모두 맞을 때만 구동 토크를 허용합니다.",
    questions: [
      {
        id: "drive:1:why", lens: 0, tag: "기능의 필요성", kind: "choose",
        q: "D단이 아닌데도 가속 페달에 토크가 나가면 어떤 문제가 생길까요?",
        how: "결과를 고르세요",
        choices: [
          { label: "차가 의도하지 않은 방향으로 움직일 수 있어요", ok: true, why: "맞아요. 변속 위치와 구동 허용이 맞지 않으면 운전자가 원하지 않는 움직임이 생길 수 있어요." },
          { label: "연비가 좋아져요", ok: false, why: "안전과 직결된 조건이라 연비와 관계가 없어요." },
          { label: "아무 일도 생기지 않아요", ok: false, why: "구동 허용은 의도하지 않은 출발을 막는 안전 조건이에요." },
        ],
        recap: "인터록은 조건이 맞지 않을 때 출력을 막아 안전을 지켜요.",
        cat: { start: "조건이 없다면 어떨지 상상해 봐요.", solved: "인터록이 의도하지 않은 출발을 막아 줘요.", wrong: "‘조건이 안 맞는데 움직이면?’을 생각해 보세요." },
      },
      {
        id: "drive:1:permit", lens: 1, tag: "신호 경로", kind: "pick", needsInput: true, answer: ["VCU Interlock"],
        q: "구동을 허락할지 판단하는 노드는 어디일까요?",
        how: "E/E 도면에서 노드를 눌러 답하세요",
        recap: "PRND 센서의 기어 신호를 VCU의 인터록이 받아 판단하고, 허락 신호(CAN Permit)를 인버터 Enable로 보내요.",
        cat: { start: "기어 신호가 어디서 판단되는지 찾아봐.", solved: "VCU 인터록이 허락 여부를 정해요.", wrong: "센서 값을 받아 판단하는 제어기 쪽이에요." },
      },
      {
        id: "drive:1:cond", lens: 2, tag: "SW 판단 조건", kind: "choose",
        q: "허락 신호(Permit)가 나가려면 어떤 조건이 모두 맞아야 할까요?",
        how: "조건을 고르세요",
        choices: [
          { label: "기어가 D단이고 READY일 때", ok: true, why: "맞아요. Gear==D 와 HV READY 조건이 맞아야 Permit Gate가 열려요." },
          { label: "페달을 밟기만 하면", ok: false, why: "페달은 입력일 뿐이에요. 허락 조건은 별도로 확인해요." },
          { label: "차량이 정차 중일 때만", ok: false, why: "허락 조건은 기어와 준비 상태예요." },
        ],
        recap: "제어 SW는 여러 조건을 모두 확인(AND)한 뒤에 출력을 허락해요.",
        cat: { start: "SW 블록 이름에 힌트가 있어요.", solved: "조건이 모두 맞아야 허락이 나가요.", wrong: "Gear와 READY 블록을 떠올려 보세요." },
      },
    ],
  },
  {
    domain: "thermal", feature: 1, core: false, caseLink: "thermal", title: "펌프·팬 제어",
    summary: "냉각수 온도에 따라 팬을 켜고 끄며, 팬이 멈추면 냉각이 약해져 온도가 오르고 출력이 제한됩니다.",
    questions: [
      {
        id: "thermal:1:why", lens: 0, tag: "기능의 필요성", kind: "choose",
        q: "냉각 팬이 돌지 않으면 어떤 순서로 문제가 이어질까요?",
        how: "순서를 고르세요",
        choices: [
          { label: "팬 정지 → 냉각수 온도 상승 → 모터 온도 상승 → 출력 제한", ok: true, why: "맞아요. 모델 계산(팬에 명령이 나가지 않을 때): 냉각수 {thermal.tcWith}→{thermal.tcWithout} °C, 모터 {thermal.tmWith}→{thermal.tmWithout} °C, 출력 허용 {thermal.derWith}→{thermal.derWithout} %." },
          { label: "출력 제한 → 팬 정지 → 온도 상승", ok: false, why: "출력 제한은 온도가 오른 뒤 부품을 보호하려고 걸려요. 원인이 아니라 결과예요." },
          { label: "모터 온도 상승 → 팬 정지 → 냉각수 온도 상승", ok: false, why: "팬이 멈춰서 냉각이 약해지면 냉각수가 먼저 오르고, 그다음 모터가 따라 올라요." },
        ],
        recap: "냉각 팬 제어가 있어야 온도가 유지되고, 실패하면 온도 상승과 출력 제한으로 이어져요.",
        cat: { start: "팬이 멈추면 어떤 일이 연쇄로 생길까?", solved: "원인과 결과의 순서가 중요해요.", wrong: "원인이 먼저, 보호 동작은 나중이에요." },
      },
      {
        id: "thermal:1:ecu", lens: 1, tag: "신호 경로", kind: "pick", needsInput: true, answer: ["Thermal ECU"],
        q: "팬에 명령(PWM)을 내보내는 제어기는 어디일까요?",
        how: "E/E 도면에서 제어기를 눌러 답하세요",
        recap: "Thermal ECU가 온도를 보고 팬·펌프에 명령을 내보내고, 팬 회전 피드백(RPM)을 다시 받아요.",
        cat: { start: "명령을 만드는 쪽을 찾아봐요.", solved: "Thermal ECU가 팬을 제어해요.", wrong: "팬이 아니라 팬에 명령을 주는 쪽이에요." },
      },
      {
        id: "thermal:1:hyst", lens: 2, tag: "SW 판단 조건", kind: "choose",
        q: "65°C에서 팬을 켠 뒤 60°C 아래로 내려갈 때까지 켜 두는 이유는 무엇일까요?",
        how: "이유를 고르세요",
        choices: [
          { label: "켜고 끄는 기준을 달리해 팬이 자주 깜빡이는 것을 막으려고", ok: true, why: "맞아요. 이것이 히스테리시스예요." },
          { label: "온도 센서가 60°C까지 틀리기 때문에", ok: false, why: "센서 오차가 아니라 제어 방식의 이유예요." },
          { label: "팬을 오래 돌리면 전기가 절약돼서", ok: false, why: "켜고 끄는 기준을 다르게 두는 이유는 잦은 켜짐·꺼짐을 줄이는 것이에요." },
        ],
        recap: "히스테리시스는 켜짐·꺼짐 기준을 다르게 두어 출력이 불필요하게 떨리는 것을 막아요.",
        cat: { start: "SW 블록 ‘히스테리시스’를 떠올려 봐요.", solved: "기준을 두 개 두면 안정적이에요.", wrong: "켜는 온도와 끄는 온도가 다른 이유를 생각해 보세요." },
      },
    ],
  },
  {
    domain: "brake", feature: 1, core: false, caseLink: "brake", title: "회생·마찰 협조",
    summary: "가능한 회생제동을 먼저 쓰고, 부족한 감속은 마찰제동이 채웁니다.",
    questions: [
      {
        id: "brake:1:why", lens: 0, tag: "기능의 필요성", kind: "choose",
        q: "배터리가 가득 차 회생이 0이 되면 마찰 제동 압력은 어떻게 될까요?",
        how: "결과를 고르세요",
        choices: [
          { label: "마찰이 전부 맡아 압력이 {brake.cmdWithRegen} bar에서 {brake.cmdNoRegen} bar로 커져요", ok: true, why: "맞아요. 같은 감속을 내려면 회생이 줄어든 만큼 마찰이 더 일해요. (정상 모델 계산값)" },
          { label: "압력은 그대로예요", ok: false, why: "회생이 줄면 같은 감속을 위해 마찰 몫이 늘어요." },
          { label: "압력이 0이 돼요", ok: false, why: "마찰 제동은 부족한 몫을 채워요. 회생이 0이면 오히려 커져요." },
        ],
        recap: "협조 제동은 회생 가용량에 따라 마찰 몫을 계속 조정해 일정한 감속을 유지해요.",
        cat: { start: "회생이 없어지면 누가 대신할까?", solved: "마찰이 부족한 몫을 채워요.", wrong: "목표 감속은 그대로라는 점을 기억하세요." },
      },
      {
        id: "brake:1:bms", lens: 1, tag: "신호 경로", kind: "pick", needsInput: true, answer: ["BMS"],
        q: "배터리가 받을 수 있는 회생 가용량을 알려 주는 부품은 어디일까요?",
        how: "E/E 도면에서 노드를 눌러 답하세요",
        recap: "BMS가 배터리 상태로 회생 가용량을 알려 주고, Brake ECU가 그 값으로 회생과 마찰을 나눠요.",
        cat: { start: "배터리 상태를 아는 부품을 찾아봐요.", solved: "BMS가 회생 가능량을 알려줘요.", wrong: "배터리 쪽 제어기를 떠올려 보세요." },
      },
      {
        id: "brake:1:rest", lens: 2, tag: "SW 판단 조건", kind: "choose",
        q: "회생을 먼저 쓰고 남은 제동력을 계산하는 블록은 무엇일까요?",
        how: "블록 이름을 고르세요",
        choices: [
          { label: "잔여력 계산", ok: true, why: "맞아요. 목표 감속에서 회생으로 낸 만큼을 빼고 남은 몫을 마찰이 맡아요." },
          { label: "회생 MIN", ok: false, why: "회생 MIN은 회생을 가용량 이하로 제한해요." },
          { label: "요구 수신", ok: false, why: "요구 수신은 목표 감속을 받아오는 블록이에요." },
        ],
        recap: "남은 제동력 = 목표 감속 − 회생 몫. 이 값이 마찰 압력으로 변환돼요.",
        cat: { start: "빼기를 하는 블록을 찾아봐요.", solved: "남은 몫이 마찰 압력이 돼요.", wrong: "‘남은’이라는 말이 힌트예요." },
      },
    ],
  },
];

export const missionFor = (domain: string, feature: number): Mission | undefined => MISSIONS.find(item => item.domain === domain && item.feature === feature);
export const missionKey = (domain: string, feature: number) => `${domain}:${feature}`;
export const coreMissions = () => MISSIONS.filter(item => item.core);
export const questionIds = (mission: Mission) => mission.questions.map(item => item.id);
