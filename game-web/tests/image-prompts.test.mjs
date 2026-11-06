import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { COMPONENTS } from "../src/sim/components.ts";
import { PARTS, CASE_EVIDENCE } from "../scripts/image-prompt-data.mjs";
import { SCENARIOS } from "../src/game/scenarios.ts";

test("every simulated component has image prompt data, with no duplicates", () => {
  const ids = PARTS.map(part => part.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const component of COMPONENTS) assert.ok(ids.includes(component.id), component.id);
  for (const part of PARTS) if (part.styles.includes("EVID")) assert.ok(part.evid?.ok && part.evid?.fault, `${part.id} needs ok/fault states`);
});

test("case evidence prompts cover every evidence card in the scenarios", () => {
  const evidenceIds = Object.values(SCENARIOS).flatMap(scenario => scenario.evidence.map(item => item.id));
  const prompted = CASE_EVIDENCE.map(item => item.id);
  for (const id of evidenceIds) assert.ok(prompted.includes(id), id);
});

test("generated docs: one code block per image, each naming exactly one file", () => {
  const doc = readFileSync(new URL("../docs/image-prompts/01-driver-input.md", import.meta.url), "utf8");
  const blocks = doc.split("```text").slice(1).map(block => block.split("```")[0]);
  assert.ok(blocks.length > 0);
  for (const block of blocks) {
    assert.equal((block.match(/reply with only this file name/g) || []).length, 1);
    assert.match(block, /Generate exactly 1 image/);
  }
  assert.match(doc, /accel_pedal__EVID-fault\.png/);
});
