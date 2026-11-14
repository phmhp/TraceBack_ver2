// Race collisions: impact level from the closing speed, and what each level does to the car.
// Kept free of React/Three so the rules are unit-testable (tests/collision.test.mjs).
export type ImpactLevel = 1 | 2 | 3;

export type ImpactEffect = {
  level: ImpactLevel;
  /** share of the player's speed that survives the hit (never below the other car's speed) */
  keep: number;
  /** strong hits trigger the EV crash response: airbags, high-voltage cut, power off until the driver restarts */
  hvCut: boolean;
  /** pursuit gap lost at once (m) on top of the lost speed */
  gapPenalty: number;
  label: string;
  toast: string;
};

const EFFECTS: Record<ImpactLevel, Omit<ImpactEffect, "level">> = {
  1: { keep: .82, hvCut: false, gapPenalty: 0, label: "경미한 접촉", toast: "경미한 접촉 · 속도가 줄고 차체가 튕겨요" },
  2: { keep: .5, hvCut: false, gapPenalty: 4, label: "중간 충돌", toast: "충돌 · 크게 감속하고 차체가 흔들려요" },
  3: { keep: .15, hvCut: true, gapPenalty: 10, label: "강한 충돌", toast: "강한 충돌 · 에어백 전개 · 고전압 차단 · R로 재시동" },
};

/** closing speed (km/h) between the player and what it touched (0 for a fixed object) */
export function classifyImpact(closingKph: number): ImpactLevel {
  const v = Math.abs(closingKph);
  return v < 18 ? 1 : v < 45 ? 2 : 3;
}

export function impactEffect(closingKph: number): ImpactEffect {
  const level = classifyImpact(closingKph);
  return { level, ...EFFECTS[level] };
}

/** player speed after the hit: loses speed by level but never drops below the other (slower) car */
export function speedAfterImpact(playerKph: number, otherKph: number, effect: ImpactEffect) {
  return Math.max(otherKph * .6, playerKph * effect.keep);
}
