import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const main = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8");
const garage = readFileSync(new URL("../src/experiences.tsx", import.meta.url), "utf8");
const cutscenes = readFileSync(new URL("../src/features/cutscenes/StaticCutscenes.tsx", import.meta.url), "utf8");
const verification = readFileSync(new URL("../src/features/verification/VerificationLab.tsx", import.meta.url), "utf8");
const layout = readFileSync(new URL("../src/v16.css", import.meta.url), "utf8");
const currentLayout = readFileSync(new URL("../src/v18.css", import.meta.url), "utf8");

test("v16 keeps the campaign spine while replacing fragile presentation layers", () => {
  assert.match(main, /features\/cutscenes\/StaticCutscenes/);
  assert.match(main, /features\/verification\/VerificationLab/);
  assert.match(main, /"\.\/v16\.css"/);
  assert.match(cutscenes, /BEGIN_RACE/);
  assert.match(cutscenes, /APPLY_REPAIR/);
  assert.match(cutscenes, /COMPLETE_ENDING/);
});

test("story cuts use consistent generated cat artwork and a visible pirate-ship landing", () => {
  for (const asset of [
    "cutscene-character-master-v1.png",
    "cutscene-heist-escape-v1.png",
    "cutscene-heist-board-v1.png",
    "cutscene-repair-v1.png",
    "cutscene-ship-jump-v1.png",
    "cutscene-ship-land-v1.png",
  ]) assert.equal(existsSync(new URL(`../public/assets/${asset}`, import.meta.url)), true, asset);
  assert.match(cutscenes, /오르막 램프를 타고 갑판으로 도약/);
  assert.match(cutscenes, /갑판 안착 · 탈출 성공/);
  assert.match(cutscenes, /requestedFrame/);
});

test("verification is learned through stimulus and probe choices rather than a technique quiz", () => {
  assert.match(verification, /사건 재현 입력/);
  assert.match(verification, /차이를 잡을 관측 경계/);
  assert.match(verification, /방금 사용한 검증 사고법/);
  assert.match(verification, /FIRST MISMATCH/);
  assert.match(verification, /RestoredPuzzleVisual/);
  assert.match(verification, /EmbeddedBench3D/);
  assert.match(verification, /BENCH_RESULT/);
  assert.doesNotMatch(verification, /testTechnique/);
  assert.doesNotMatch(verification, /기법.*button/);
});

test("diagnosis stays evidence-led and the restored logic uses compatible jigsaw grammar", () => {
  assert.match(garage, /관찰된 현상 · 계측 단서/);
  assert.match(garage, /가능 원인 가설/);
  assert.match(garage, /puzzleEdgeClass/);
  assert.match(garage, /edge-mismatch/);
  assert.match(currentLayout, /\.logicNode\.edge-flat-tab/);
  assert.match(currentLayout, /\.guidedLogicSlot\{[^}]*clip-path:none/);
  assert.match(currentLayout, /\.twinCompareStage\{grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);
});

test("garage learning lets players pull parts out and the v16 layout protects readable surfaces", () => {
  assert.match(garage, /빼 보기 실험/);
  assert.match(garage, /RemovedPartMarker/);
  assert.match(layout, /\.garagePredictionChoices/);
  assert.match(layout, /\.reasoningMicroRail/);
  assert.match(layout, /\.verificationShell/);
  assert.match(layout, /\.experimentFooter:not\(\.conclusive\)/);
});

test("the playable race owns the complete dock jump and commits the ending after deck settlement", () => {
  assert.match(garage, /const TRACK_LENGTH = 1380/);
  assert.match(garage, /const DECK_STOP = DECK_TOUCH \+ 12/);
  assert.match(garage, /planeGeometry args=\{\[120,320\]\}/);
  assert.match(garage, /setDeckSettled\(true\)/);
  assert.match(garage, /mode === "ship" && deckSettled/);
  const runtime = readFileSync(new URL("../src/game/runtime.ts", import.meta.url), "utf8");
  assert.match(runtime, /checkpoint: "pirate_ramp" \}, "ENDING"/);
});
