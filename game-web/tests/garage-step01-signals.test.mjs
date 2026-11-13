import test from "node:test";
import assert from "node:assert/strict";
import { EE_LINKS } from "../src/features/garage/eeLinks.ts";
import { swView, thermalThresholds, hasSwView } from "../src/features/garage/swModel.ts";
import { CONNECTIONS } from "../src/sim/components.ts";

const view = (d, f, over = {}) => swView(d, f, { ready: true, gearD: true, level: 60, regen: true, fanOn: false, ...over });
const val = (list, label) => list.find(c => c.label === label)?.value;

test("E/E hops come from the real registry and are marked when they are structure-only", () => {
  assert.equal(EE_LINKS["drive:0"].length, 9); // 10 chain nodes → 9 hops
  assert.equal(EE_LINKS["drive:1"].length, 3);
  assert.equal(EE_LINKS["thermal:1"].length, 2);
  for (const hops of Object.values(EE_LINKS)) for (const hop of hops.filter(Boolean)) {
    assert.ok(hop.signal && hop.unit && hop.logical && hop.physical && hop.sender && hop.receiver);
    if (hop.source === "registry") assert.ok(CONNECTIONS.some(c => c.id === hop.ref), `${hop.ref} must exist in the registry`);
  }
  const app = EE_LINKS["drive:0"][0];
  assert.deepEqual([app.signal, app.unit, app.logical, app.physical], ["APP_Position", "%", "아날로그 신호", "아날로그 배선"]);
  assert.equal(EE_LINKS["drive:1"][1].source, "structure", "the permit hop is not in the registry and must say so");
  assert.equal(EE_LINKS["thermal:1"][1].feedback, true);
});

test("Control SW view: thresholds and values are computed by the same models as STEP04", () => {
  assert.deepEqual([thermalThresholds().on, thermalThresholds().off, thermalThresholds().rpm], [65, 60, 1850]);
  const d60 = view("drive", 0), d100 = view("drive", 0, { level: 100 });
  assert.equal(val(d60.output, "토크 명령 (CAN)"), "204 Nm");
  assert.equal(val(d100.output, "토크 명령 (CAN)"), "260 Nm");
  assert.match(val(d100.decision, "한계 MIN"), /340.*260/);
  assert.equal(val(view("drive", 0, { ready: false }).output, "토크 명령 (CAN)"), "0 Nm");
  assert.equal(d60.decision.find(c => c.label.startsWith("구동 허용")).kind, "rule", "interlock is a STEP01 rule, not a model value");
  const b = view("brake", 1, { level: 55 }), bn = view("brake", 1, { level: 55, regen: false });
  assert.equal(val(b.output, "마찰 압력 명령"), "42 bar");
  assert.equal(val(bn.output, "마찰 압력 명령"), "64 bar");
  const hot = view("thermal", 1, { level: 78, fanOn: true }), off = view("thermal", 1, { level: 62, fanOn: false }), band = view("thermal", 1, { level: 62, fanOn: true });
  assert.match(val(hot.output, "팬 PWM 듀티"), /^6\d %$/);
  assert.equal(val(off.output, "팬 PWM 듀티"), "0 %");
  assert.notEqual(val(band.output, "팬 PWM 듀티"), "0 %", "inside the hysteresis band the previous state (ON) is kept");
  for (const [d, f] of [["drive", 0], ["drive", 1], ["thermal", 1], ["brake", 1]]) assert.ok(hasSwView(d, f));
  assert.equal(hasSwView("steer", 0), false, "no SW view is invented for functions without a verified model");
  assert.equal(swView("steer", 0, { ready: true, gearD: true, level: 0, regen: true, fanOn: false }), null);
});
