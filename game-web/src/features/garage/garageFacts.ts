// Numbers shown in STEP01 missions come from the SAME healthy/fault models that STEP04 uses
// (src/features/verification/simModel.ts). Nothing here is typed in by hand, so STEP01 cannot drift
// away from the bench. Values are computed once and rounded for display.
import { simulate, type Series } from "../verification/simModel.ts";

export type GarageFacts = {
  drive: { req100: number; arb100: number; mot60: number; acc60: number };
  thermal: { tcWith: number; tcWithout: number; tmWith: number; tmWithout: number; derWith: number; derWithout: number };
  brake: { cmdWithRegen: number; cmdNoRegen: number };
};

const last = (series: Series | undefined) => series?.ref[series.ref.length - 1] ?? NaN;
const lastRun = (series: Series | undefined) => series?.run[series.run.length - 1] ?? NaN;
const find = (list: Series[], id: string) => list.find(item => item.id === id);
const round = (value: number, digits = 0) => { const k = 10 ** digits; return Math.round(value * k) / k; };

let cache: GarageFacts | null = null;

export function garageFacts(): GarageFacts {
  if (cache) return cache;
  // propulsion: pedal 100 % step (boundary) shows the torque map and the available-torque limit; 60 % is the reference point
  const full = simulate("propulsion", "boundary", true);
  const ref60 = simulate("propulsion", "req", true);
  // thermal: legacy closed-loop path (the cooling loop is computed, not scripted). "without" = the fan receives no PWM.
  const heat = simulate("thermal", "soak", false);
  // brake: normal run vs. battery full (regeneration 0)
  const brakeNormal = simulate("brake", "req", true);
  const brakeNoRegen = simulate("brake", "boundary", true);
  cache = {
    drive: {
      req100: round(last(find(full.levels.unit, "req"))),
      arb100: round(last(find(full.levels.swint, "arb"))),
      mot60: round(last(find(ref60.levels.vehicle, "mot"))),
      acc60: round(last(find(ref60.levels.vehicle, "acc")), 1),
    },
    thermal: {
      tcWith: round(last(find(heat.levels.vehicle, "tc"))), tcWithout: round(lastRun(find(heat.levels.vehicle, "tc"))),
      tmWith: round(last(find(heat.levels.vehicle, "tm"))), tmWithout: round(lastRun(find(heat.levels.vehicle, "tm"))),
      derWith: round(last(find(heat.levels.vehicle, "der"))), derWithout: round(lastRun(find(heat.levels.vehicle, "der"))),
    },
    brake: {
      cmdWithRegen: round(last(find(brakeNormal.levels.unit, "cmd"))),
      cmdNoRegen: round(last(find(brakeNoRegen.levels.unit, "cmd"))),
    },
  };
  return cache;
}

/** Replaces `{drive.req100}`-style tokens with computed model values. Unknown tokens throw (caught by the tests). */
export function fillFacts(text: string, facts: GarageFacts = garageFacts()): string {
  return text.replace(/\{(\w+)\.(\w+)\}/g, (_, group: string, key: string) => {
    const value = (facts as Record<string, Record<string, number>>)[group]?.[key];
    if (value === undefined || Number.isNaN(value)) throw new Error(`unknown STEP01 fact ${group}.${key}`);
    return String(value);
  });
}
