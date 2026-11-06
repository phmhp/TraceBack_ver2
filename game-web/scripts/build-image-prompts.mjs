// Generates copy-paste image prompts: one prompt = one image = one file name.
// Output: docs/PART_IMAGE_PROMPTS.md (guide + index) and docs/image-prompts/*.md.
// Run: npm run prompts
import { mkdirSync, writeFileSync } from "node:fs";
import { DOMAINS, PARTS, CASE_EVIDENCE } from "./image-prompt-data.mjs";

const docsDir = new URL("../docs/", import.meta.url);
const outDir = new URL("../docs/image-prompts/", import.meta.url);
mkdirSync(outDir, { recursive: true });

const STYLE_ORDER = ["REF", "TURN", "EXPL", "CUT", "EVID"];
const STYLE_KO = { REF: "3D 참고 이미지", TURN: "4면도 시트", EXPL: "분해도", CUT: "게임 카드 컷아웃", "EVID-ok": "메모판 사진 · 정상", "EVID-fault": "메모판 사진 · 고장", EVID: "메모판 사진" };

const ONE = [
  "Generate exactly 1 image. Only one image in this reply: no extra images, no alternatives, no variations, no second attempt.",
  "The image shows ONE view of ONE object. No collage, no grid, no panels, no contact sheet, no side-by-side comparison.",
];
const NO_MARKS = "Do not put any text, letters, numbers, logos, brand names, frame, border, tape, caption, label, arrow, circle highlight or user-interface element in the image.";
const GENERIC = "Generic passenger electric vehicle part, not resembling any specific manufacturer.";
const STYLE = {
  REF: [
    "Style: realistic industrial product render.",
    "Camera: three-quarter front view from slightly above. The object is centered and fills about 75% of a square 1:1 canvas, fully visible with margin on every side.",
    "Background: plain pure white, soft even studio lighting, no cast shadow on the background.",
  ],
  TURN: [
    "Style: technical turnaround reference sheet on a landscape 3:2 canvas.",
    "Layout: a clean 2x2 grid of the SAME object only: front view, side view, top view and one three-quarter view. Orthographic projection for the three flat views, identical scale and alignment.",
    "Background: neutral light grey, flat even lighting, realistic materials.",
  ],
  EXPL: [
    "Style: clean exploded-view illustration on a landscape 3:2 canvas, the components separated along one axis with even spacing, realistic materials.",
    "Background: neutral light grey, soft studio lighting.",
  ],
  CUT: [
    "Style: photorealistic automotive component product shot, crisp machined and cast-metal surface detail, soft key light from upper left with a gentle rim light.",
    "Camera: three-quarter front-left view. The object is centered and fills about 80% of a square 1:1 canvas.",
    "Background: real transparent PNG background with an alpha channel. No floor, no cast shadow, no background objects.",
  ],
  EVID: [
    "Style: square 1:1 close-up photograph that fills the whole canvas edge to edge. No border, no frame, no tape, no tilt; the camera is level and straight.",
    "Composition: the key subject centered and occupying about 70% of the frame; keep the top-left corner free of important detail.",
    "Setting: dim warm-lit EV repair workshop, shallow depth of field, cinematic amber and teal lighting, photographic realism, no people's faces.",
  ],
};

function promptBlock({ file, lines }) {
  return ["```text", ...lines, `After the image, reply with only this file name (never draw it in the image): ${file}`, "```"].join("\n");
}

function partJobs(part) {
  const styles = STYLE_ORDER.filter(style => part.styles.includes(style));
  const jobs = [];
  const base = () => jobs[0]?.file; // first generated image is the design reference for the rest
  for (const style of styles) {
    if (style === "EVID") {
      const okFile = `${part.id}__EVID-ok.png`;
      const ref = base();
      jobs.push({ kind: "EVID-ok", file: okFile, attach: ref ? [ref] : [], lines: [
        ...ONE,
        ...(ref ? [`Design reference: the attached ${ref}. The part must look exactly the same (shape, proportions, materials, colors).`] : []),
        `Subject: ${GENERIC} ${part.evid.scene}.`,
        `Condition: normal and healthy — ${part.evid.ok}. Calm, cool teal ambient light.`,
        ...STYLE.EVID, NO_MARKS,
      ] });
      jobs.push({ kind: "EVID-fault", file: `${part.id}__EVID-fault.png`, attach: [okFile], lines: [
        ...ONE,
        `Reference: the attached ${okFile}. Keep exactly the same part, camera position, framing and composition; change only the condition below.`,
        `Subject: ${GENERIC} ${part.evid.scene}.`,
        `Condition: faulty — ${part.evid.fault}. Show the fault only as a physical, visible state of the part. Slightly warmer, reddish ambient light.`,
        ...STYLE.EVID, NO_MARKS,
      ] });
      continue;
    }
    const ref = base();
    const header = style === "TURN"
      ? ["Generate exactly 1 image: one turnaround sheet of one object. No extra images, no alternatives, no other styles, no photos, no exploded views."]
      : ONE;
    jobs.push({ kind: style, file: `${part.id}__${style}.png`, attach: ref ? [ref] : [], lines: [
      ...header,
      ...(ref ? [`Design reference: the attached ${ref}. Keep exactly the same object design, shape, proportions, materials and colors.`] : []),
      `Subject: ${GENERIC} ${part.subject}.`,
      ...STYLE[style], NO_MARKS,
    ] });
  }
  return jobs;
}

const methodNote = { "직접": "직접 — 이 이미지를 기준으로 코드로 모델링", AI: "AI — REF 이미지를 TRELLIS로 3D 변환 시도", "2D": "2D — 이미지만 게임에 사용" };
let totalImages = 0;
const indexRows = [];

for (const domain of DOMAINS) {
  const parts = PARTS.filter(part => part.domain === domain.file);
  const out = [`# ${domain.title} — 이미지 생성 프롬프트`, "", "> 자동 생성 파일입니다. 수정은 `scripts/image-prompt-data.mjs`에서 하고 `npm run prompts`를 실행하세요.", "> 사용 규칙은 [../PART_IMAGE_PROMPTS.md](../PART_IMAGE_PROMPTS.md)를 보세요. **코드 블록 하나 = 요청 1번 = 이미지 1장**입니다.", ""];
  for (const part of parts) {
    const jobs = partJobs(part);
    totalImages += jobs.length;
    indexRows.push(`| \`${part.id}\` | ${part.ko} | ${part.method} | ${jobs.length} | [${domain.title}](image-prompts/${domain.file}.md#${part.id}) |`);
    out.push(`<a id="${part.id}"></a>`, `## ${part.id} — ${part.ko}`, "", `3D 방식: ${methodNote[part.method]}`, "");
    out.push("| 순서 | 생성물 | 파일명 | 대화에 첨부할 이미지 |", "|---|---|---|---|");
    jobs.forEach((job, index) => out.push(`| ${index + 1} | ${job.kind} (${STYLE_KO[job.kind]}) | \`${job.file}\` | ${job.attach.length ? job.attach.map(file => `\`${file}\``).join(", ") : "없음"} |`));
    out.push("");
    jobs.forEach((job, index) => {
      out.push(`### ${index + 1}. ${job.kind} — \`${job.file}\``);
      if (job.attach.length) out.push("", `먼저 ${job.attach.map(file => `\`${file}\``).join(", ")} 이미지를 첨부한 뒤 아래 프롬프트를 붙여 넣으세요.`);
      out.push("", promptBlock(job), "");
    });
  }
  writeFileSync(new URL(`${domain.file}.md`, outDir), out.join("\n"));
}

// Case evidence (memo board)
const caseOut = ["# 메모판 사건 증거 사진 — 이미지 생성 프롬프트", "", "> 자동 생성 파일입니다. 증거 ID는 `src/game/scenarios.ts`와 같습니다. 증거 1개당 중립 사진 1장이며, 값과 라벨은 게임이 카드에 표시합니다.", "", "| 사건 | 증거 ID | 파일명 |", "|---|---|---|"];
for (const evidence of CASE_EVIDENCE) caseOut.push(`| ${evidence.caseKo} | \`${evidence.id}\` | \`${evidence.id}__EVID.png\` |`);
caseOut.push("");
for (const evidence of CASE_EVIDENCE) {
  const file = `${evidence.id}__EVID.png`;
  totalImages++;
  caseOut.push(`## ${evidence.caseKo} · ${evidence.id}`, "", promptBlock({ file, lines: [...ONE, `Subject: ${evidence.scene}.`, ...STYLE.EVID, NO_MARKS] }), "");
}
writeFileSync(new URL("12-case-evidence.md", outDir), caseOut.join("\n"));

// Guide + index
const guide = `# EV 부품 이미지 생성 프롬프트 (v3)

> 자동 생성 파일입니다. 수정은 \`scripts/image-prompt-data.mjs\`에서 하고 \`npm run prompts\`를 실행하세요.
> 생성 도구: ChatGPT(GPT 이미지) · 3D 변환: [TRELLIS.2 데모](https://huggingface.co/spaces/microsoft/TRELLIS.2)(MIT) · 부품 ID 기준: \`src/sim/components.ts\`

부품 ${PARTS.length}종 + 사건 증거 ${CASE_EVIDENCE.length}종 = **이미지 총 ${totalImages}장**

## 1. 규칙 — 코드 블록 하나 = 요청 1번 = 이미지 1장

v2에서는 한 번에 여러 스타일을 요청해 비슷한 이미지가 여러 장 나오거나, 필요한 스타일이 빠지는 문제가 있었습니다. v3는 **스타일마다 완성된 프롬프트를 따로** 드립니다.

1. 부품 문서를 열고, 부품의 **순서표**를 위에서부터 차례로 진행합니다.
2. **이미지 1장마다 ChatGPT 새 대화**를 여는 것을 권장합니다. 대화가 길어지면 이전 요청을 섞어 여러 장을 만드는 경향이 있습니다.
3. 순서표의 **"대화에 첨부할 이미지"** 칸에 파일이 있으면, 그 이미지를 먼저 첨부하고 프롬프트를 붙여 넣습니다. 이렇게 해야 같은 부품이 모든 이미지에서 같은 모양으로 나옵니다.
4. ChatGPT가 이미지 아래에 **파일명을 답해 줍니다.** 그 이름 그대로 저장합니다.
   - 저장 위치: \`game-web/asset-intake/images/\`
5. 그래도 여러 장이 나오면 **첫 장만** 저장하고, 다음 요청 전에 새 대화를 엽니다.
6. \`CUT\` 결과에 회색·흰색 **체크무늬가 그려져 있으면** 가짜 투명 배경입니다. 프롬프트의 \`Background:\` 줄을 \`Background: plain pure white.\`로 바꿔 다시 요청하세요. 배경 제거는 제가 하겠습니다.

## 2. 파일명 형식

| 생성물 | 파일명 | 용도 |
|---|---|---|
| REF | \`<부품ID>__REF.png\` | 3D 모델링 기준, TRELLIS 입력 |
| TURN | \`<부품ID>__TURN.png\` | 직접 모델링용 정면·측면·윗면·3/4 시트 |
| EXPL | \`<부품ID>__EXPL.png\` | 분해도·내부 구조 학습 |
| CUT | \`<부품ID>__CUT.png\` | 실험대·배선 작업대 부품 카드 |
| EVID 정상 | \`<부품ID>__EVID-ok.png\` | 메모판 사진, 정상 상태 비교 |
| EVID 고장 | \`<부품ID>__EVID-fault.png\` | 메모판 사진, 고장 상태 비교 (정상 사진과 같은 구도) |
| 사건 증거 | \`<증거ID>__EVID.png\` | 메모판 증거 카드 |

\`EVID\` 사진은 **틀 없는 정사각형**입니다. 폴라로이드 틀(\`polaroid-frame-real-v1.png\`)과 캡션 글자는 게임이 씌웁니다.

예시 — \`accel_pedal\`

| 순서 | 생성물 | 파일명 |
|---|---|---|
| 1 | REF | \`accel_pedal__REF.png\` |
| 2 | TURN | \`accel_pedal__TURN.png\` |
| 3 | CUT | \`accel_pedal__CUT.png\` |
| 4 | EVID 정상 | \`accel_pedal__EVID-ok.png\` |
| 5 | EVID 고장 | \`accel_pedal__EVID-fault.png\` |

## 3. 우선순위

사건 순서대로 진행하면 게임 반영 효과가 가장 큽니다.
1. 구동: \`accel_pedal\`, \`vcu\`, \`inverter\`, \`traction_motor\`, \`motor_stator\`, \`motor_rotor\`, \`reduction_gear\`, \`drive_shaft\`
2. 열관리: \`motor_temp_sensor\`, \`thermal_ecu\`, \`cooling_pump\`, \`radiator\`, \`cooling_fan\`
3. 제동: \`brake_pedal\`, \`brake_booster\`, \`hydraulic_modulator\`, \`brake_caliper\`, \`brake_disc\`, \`brake_pad\`, \`wheel_speed_sensor\`
4. 운전자 입력장치: \`steering_wheel\`, \`gear_selector\`, \`start_button\`
5. 전원: \`battery_cell\`, \`battery_module\`, \`hv_battery\`, \`main_contactor\`, \`precharge_circuit\`
6. [사건 증거 사진 11장](image-prompts/12-case-evidence.md)
7. 그 외 부품

## 4. 부품 목록

| ID | 부품 | 3D 방식 | 이미지 수 | 프롬프트 |
|---|---|---|---|---|
${indexRows.join("\n")}
`;
writeFileSync(new URL("PART_IMAGE_PROMPTS.md", docsDir), guide);
console.log(`parts ${PARTS.length}, case evidence ${CASE_EVIDENCE.length}, images ${totalImages}, files ${DOMAINS.length + 2}`);
