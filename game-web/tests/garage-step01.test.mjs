import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MISSIONS, missionFor, coreMissions } from "../src/features/garage/missions.ts";
import { fillFacts, garageFacts } from "../src/features/garage/garageFacts.ts";
import { initialGarageProgress, isCoreComplete, solveQuestion, wrongAnswer, canExplain, hydrateGarageProgress, coreQuestionIds, EXPLAIN_AFTER_WRONG } from "../src/features/garage/garageProgress.ts";
import { dispatch, hydrateCampaign, initialCampaign } from "../src/game/runtime.ts";
import { simulate } from "../src/features/verification/simModel.ts";

const experiences = readFileSync(new URL("../src/experiences.tsx", import.meta.url), "utf8");

test("STEP01 missions: ids are unique and every question is answerable", () => {
  const ids = MISSIONS.flatMap(mission => mission.questions.map(question => question.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const mission of MISSIONS) {
    assert.ok(mission.questions.length > 0);
    for (const q of mission.questions) {
      assert.ok(q.id.startsWith(`${mission.domain}:${mission.feature}:`), q.id);
      if (q.kind === "choose") assert.equal(q.choices.filter(choice => choice.ok).length, 1, `${q.id} needs exactly one correct choice`);
      else assert.ok(q.answer?.length, `${q.id} needs an accepted node label`);
      assert.ok(q.cat.start && q.cat.solved && q.cat.wrong && q.recap, q.id);
    }
  }
});

test("STEP01 missions: pick answers are real nodes of the feature's Vehicle/E-E chain (no invented parts)", () => {
  // labels of getFeatureLayer(domain, feature, 1): featureLayerOverrides[domain][feature][1] ?? featureFlows[domain][feature].layers[1]
  const src = experiences;
  for (const mission of MISSIONS) for (const q of mission.questions.filter(item => item.kind === "pick")) for (const label of q.answer) {
    assert.ok(src.includes(`"${label}"`), `${q.id}: "${label}" is not a node label in experiences.tsx`);
  }
});

test("STEP01 numbers come from the simulation models, not from hand-typed values", () => {
  const facts = garageFacts();
  const full = simulate("propulsion", "boundary", true);
  assert.equal(facts.drive.req100, Math.round(full.levels.unit.find(s => s.id === "req").ref.at(-1)));
  assert.equal(facts.drive.arb100, 260); // available-torque limit used by the bench
  assert.equal(facts.drive.mot60, 204); // pedal 60 % → 204 Nm (same as the STEP03/STEP04 reference)
  assert.ok(facts.thermal.tcWithout > facts.thermal.tcWith, "without the fan the coolant is hotter");
  assert.ok(facts.thermal.tmWithout > facts.thermal.tmWith);
  assert.ok(facts.thermal.derWithout < facts.thermal.derWith, "output allowance drops when the motor overheats");
  assert.ok(facts.brake.cmdNoRegen > facts.brake.cmdWithRegen, "friction carries more when regeneration is 0");
  assert.equal(facts.brake.cmdWithRegen, 42);
  // every token used in mission text resolves
  for (const mission of MISSIONS) for (const q of mission.questions) {
    fillFacts(q.recap); for (const c of q.choices ?? []) { fillFacts(c.label); fillFacts(c.why); }
  }
  assert.throws(() => fillFacts("{drive.nope}"));
});

test("STEP01 progress: core completion, wrong counts and explanation threshold", () => {
  let p = initialGarageProgress();
  assert.equal(isCoreComplete(p), false);
  assert.ok(coreMissions().length >= 1);
  for (const id of coreQuestionIds()) { assert.equal(p.cleared, false); p = solveQuestion(p, id); }
  assert.equal(isCoreComplete(p), true);
  assert.equal(p.cleared, true);
  assert.equal(solveQuestion(p, coreQuestionIds()[0]), p, "solving twice changes nothing");
  let w = initialGarageProgress();
  const id = coreQuestionIds()[0];
  for (let i = 0; i < EXPLAIN_AFTER_WRONG - 1; i++) w = wrongAnswer(w, id);
  assert.equal(canExplain(w, id), false);
  w = wrongAnswer(w, id);
  assert.equal(canExplain(w, id), true);
  assert.equal(canExplain(w, coreQuestionIds()[1]), false, "wrong counts are per question");
});

test("STEP01 progress is saved with the campaign and old saves still load", () => {
  let state = initialCampaign();
  state = dispatch(state, { type: "GARAGE_WRONG", id: "drive:0:why" });
  state = dispatch(state, { type: "GARAGE_SOLVE", id: "drive:0:why" });
  const restored = hydrateCampaign(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored.garage.solved, ["drive:0:why"]);
  assert.equal(restored.garage.wrong["drive:0:why"], 1);
  // a save written before this feature has no `garage` key
  const old = JSON.parse(JSON.stringify(state)); delete old.garage;
  assert.deepEqual(hydrateCampaign(old).garage, initialGarageProgress());
  // damaged data never crashes the garage
  assert.doesNotThrow(() => hydrateGarageProgress({ solved: "x", wrong: 7 }));
  // new game resets
  assert.deepEqual(dispatch(state, { type: "NEW_GAME" }).garage, initialGarageProgress());
});

test("STEP01 UI: next step stays locked until the core missions are done; unverified functions are information only", () => {
  assert.match(experiences, /disabled=\{!garageCleared\}/);
  assert.match(experiences, /필수 미션 \$\{coreLeft\}개 남음/);
  const panel = readFileSync(new URL("../src/features/garage/MissionPanel.tsx", import.meta.url), "utf8");
  assert.match(panel, /기본 정보 탐색/); // functions without a verified mission are not dressed up as missions
  assert.ok(missionFor("drive", 3) === undefined, "no mission was invented for functions without verified content");
});
