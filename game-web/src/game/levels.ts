import type { Campaign, CaseId } from "./runtime";
import type { DomainId } from "../features/garage/evData";
import type { IconName } from "../ui/Icon";

/**
 * Level definitions: one level = one fault case (no random faults) in a fixed order.
 * Add a level by adding a row here and a case sheet under docs/fault-cases (see RULES.md).
 * `garage` lists the 정비소 functions the case builds on (domain id + feature index in evData.ts).
 */
export type LevelDef = {
  level: number;
  kind: "required" | "bonus" | "finale";
  caseId: CaseId | null;
  title: string;
  domainLabel: string;
  icon: IconName;
  teaser: string;
  phase: string;
  learn: string;
  difficulty: 1 | 2 | 3;
  /** shown on the card after the level is cleared ("배운 원리"); plain statements, no case-specific answers */
  principles: string[];
  garage: { domain: DomainId; feature: number }[];
};

export const LEVELS: LevelDef[] = [
  { level: 1, kind: "required", caseId: "propulsion", title: "가속이 약해요", domainLabel: "구동", icon: "gear",
    teaser: "페달을 밟아도 차가 힘없이 나가요.", phase: "추월 구간 가속", learn: "SW만 따로 실행해 계산 오류를 가르는 시험", difficulty: 1, principles: ["페달 입력은 필터와 맵을 거쳐 토크 요청이 돼요.", "SW만 따로 실행하면 입력 회로 없이 계산 오류를 가를 수 있어요.", "원인은 결과보다 먼저 달라진 신호에서 찾아요."], garage: [{ domain: "drive", feature: 0 }] },
  { level: 2, kind: "required", caseId: "thermal", title: "오래 달리면 힘이 빠져요", domainLabel: "열관리", icon: "thermo",
    teaser: "고속으로 오래 달리자 경고등이 켜지고 출력이 줄어요.", phase: "연속 고부하 주행", learn: "제어기 출력과 실제 동작을 비교해 실행 누락을 찾는 시험", difficulty: 2, principles: ["열 요구는 제어기가 PWM 출력으로 바꿔 팬을 돌려요.", "요청은 정상인데 출력이 없으면 출력 어댑터를 의심해요.", "출력 제한은 고장이 아니라 과열을 막는 보호 동작이에요."], garage: [{ domain: "thermal", feature: 1 }, { domain: "thermal", feature: 3 }] },
  { level: 3, kind: "bonus", caseId: "brake", title: "브레이크가 덜 들어요", domainLabel: "제동", icon: "disc",
    teaser: "브레이크를 밟았는데 생각보다 덜 서요.", phase: "정차 구간 제동", learn: "내부 계산값과 출력값의 차이로 변환 오류를 찾는 시험", difficulty: 2, principles: ["회생으로 줄인 몫의 나머지를 마찰 압력이 채워요.", "내부 계산값과 전송값이 다르면 변환 단계를 의심해요.", "같은 입력으로 수리 전후를 비교하면 원인 제거를 확인할 수 있어요."], garage: [{ domain: "brake", feature: 1 }] },
  { level: 4, kind: "bonus", caseId: "regen", title: "발을 떼도 가속해요", domainLabel: "구동·회생", icon: "bolt",
    teaser: "가속 페달에서 발을 뗐는데 오히려 빨라져요.", phase: "코스팅(페달 해제) 구간", learn: "값의 크기가 맞아도 부호가 틀리면 정반대로 동작한다는 것을 SW 단위 시험으로 확인", difficulty: 1, principles: ["회생 요청은 부호(방향)까지 정해진 인터페이스 규약이에요.", "크기가 맞아도 부호가 틀리면 정반대로 움직여요.", "진단 모니터는 작동 범위 밖이면 고장을 못 잡아요."],
    garage: [{ domain: "drive", feature: 2 }, { domain: "brake", feature: 1 }] },
  { level: 5, kind: "bonus", caseId: "ready", title: "시동이 안 걸려요", domainLabel: "고전압 전원", icon: "battery",
    teaser: "시동 버튼을 눌러도 READY가 켜지지 않아요.", phase: "시동 전 시퀀스", learn: "상태기계의 대기 시간과 실제 물리 응답을 함께 보는 시험", difficulty: 2, principles: ["프리차지는 커패시터를 먼저 충전한 뒤 주 접촉기를 닫는 순서예요.", "대기 시간이 실제 충전 시간보다 짧으면 정상 동작도 실패로 판정돼요.", "진단 코드는 어느 단계에서 실패했는지 알려 주고 원인은 시험으로 가려요."],
    garage: [{ domain: "power", feature: 1 }] },
  { level: 6, kind: "bonus", caseId: "gear", title: "D에 놓았는데 뒤로 가요", domainLabel: "변속·통신", icon: "gear",
    teaser: "변속 직후 출발하면 가끔 차가 뒤로 움찔해요.", phase: "정차 후 출발", learn: "버스 부하를 재현하는 시스템 통합 시험으로 통신 폴백 값 오류를 찾는 시험", difficulty: 3, principles: ["변속 위치는 20 ms마다 CAN으로 전달되고, 오래 오지 않으면 제어기가 안전 값으로 바꿔요.", "통신이 끊겼을 때 쓰는 폴백 값은 안전한 방향이어야 해요.", "간헐 고장은 재현 조건(버스 부하)을 고르면 드러나요."],
    garage: [{ domain: "gear", feature: 3 }] },
  { level: 7, kind: "finale", caseId: null, title: "최종 탈출", domainLabel: "해적선", icon: "flag",
    teaser: "수리한 차로 부두까지 달려 해적선에 올라타요.", phase: "부두 구간 주행", learn: "수리 후에도 정상 동작이 이어지는지 확인", difficulty: 1, principles: ["수리 후에도 같은 시험으로 정상 동작을 확인해요.", "정상 기준은 요구사항에서 나오고 시험 기준이 돼요.", "추리, 시험, 수리, 재시험이 검증의 기본 흐름이에요."], garage: [] },
];

export type LevelStatus = "cleared" | "open" | "locked";

export function levelStatus(state: Campaign, def: LevelDef): LevelStatus {
  const done = (id: CaseId) => state.completedCases.includes(id);
  if (def.caseId && done(def.caseId)) return "cleared";
  if (def.level === 1) return "open";
  if (def.level === 2) return done("propulsion") ? "open" : "locked";
  if (def.level >= 3 && def.level <= 6) return done("thermal") ? "open" : "locked";
  return done("propulsion") && done("thermal") ? "open" : "locked";
}

export function lockedReason(def: LevelDef) {
  if (def.level === 2) return "1레벨을 클리어하면 열려요.";
  if (def.level >= 3 && def.level <= 6) return "2레벨을 클리어하면 열려요.";
  return "1·2레벨을 클리어하면 열려요.";
}
