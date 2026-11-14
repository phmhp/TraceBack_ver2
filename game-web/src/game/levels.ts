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
  garage: { domain: DomainId; feature: number }[];
};

export const LEVELS: LevelDef[] = [
  { level: 1, kind: "required", caseId: "propulsion", title: "가속이 약해요", domainLabel: "구동", icon: "gear",
    teaser: "페달을 밟아도 차가 힘없이 나가요.", phase: "추월 구간 가속", learn: "SW만 따로 실행해 계산 오류를 가르는 시험", difficulty: 1, garage: [{ domain: "drive", feature: 0 }] },
  { level: 2, kind: "required", caseId: "thermal", title: "오래 달리면 힘이 빠져요", domainLabel: "열관리", icon: "thermo",
    teaser: "고속으로 오래 달리자 경고등이 켜지고 출력이 줄어요.", phase: "연속 고부하 주행", learn: "제어기 출력과 실제 동작을 비교해 실행 누락을 찾는 시험", difficulty: 2, garage: [{ domain: "thermal", feature: 1 }, { domain: "thermal", feature: 3 }] },
  { level: 3, kind: "bonus", caseId: "brake", title: "브레이크가 덜 들어요", domainLabel: "제동", icon: "disc",
    teaser: "브레이크를 밟았는데 생각보다 덜 서요.", phase: "정차 구간 제동", learn: "내부 계산값과 출력값의 차이로 변환 오류를 찾는 시험", difficulty: 2, garage: [{ domain: "brake", feature: 1 }] },
  { level: 4, kind: "finale", caseId: null, title: "최종 탈출", domainLabel: "해적선", icon: "flag",
    teaser: "수리한 차로 부두까지 달려 해적선에 올라타요.", phase: "부두 구간 주행", learn: "수리 후에도 정상 동작이 이어지는지 확인", difficulty: 1, garage: [] },
];

export type LevelStatus = "cleared" | "open" | "locked";

export function levelStatus(state: Campaign, def: LevelDef): LevelStatus {
  const done = (id: CaseId) => state.completedCases.includes(id);
  if (def.caseId && done(def.caseId)) return "cleared";
  if (def.level === 1) return "open";
  if (def.level === 2) return done("propulsion") ? "open" : "locked";
  if (def.level === 3) return done("thermal") ? "open" : "locked";
  return done("propulsion") && done("thermal") ? "open" : "locked";
}

export function lockedReason(def: LevelDef) {
  if (def.level === 2) return "1레벨을 클리어하면 열려요.";
  if (def.level === 3) return "2레벨을 클리어하면 열려요.";
  return "1·2레벨을 클리어하면 열려요.";
}
