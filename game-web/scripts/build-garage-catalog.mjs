import fs from "node:fs";
import path from "node:path";
import { DOMAIN_ORDER, EV_DOMAINS } from "../src/features/garage/evData.ts";
import { CURRENT_LAYOUT_PLACEMENT_AUDIT, PHASE0_VEHICLE_SPEC, auditDomainReferences, validateVehicleSpec } from "../src/features/garage/vehicleSpec.ts";

const root = process.cwd();
const sourceCatalog = path.join(root, "docs/PLAYER_CONTENT_CATALOG_2026-11-19.jsonl");
const rows = fs.readFileSync(sourceCatalog, "utf8").trim().split(/\r?\n/).map(JSON.parse);
const garageSymbols = new Set([
  "learningLayers", "domainContent", "featureFlows", "domainHardware", "OWNER_OVERRIDE", "ROLE_TEXT", "DOMAIN_SYMPTOM",
  "ROLE_INTRO", "SIGNAL_UNIT", "ROLE_DOES", "FlowStepCard", "GaragePartPreview", "PartIntroCard", "PartInspector",
  "GarageExperience", "GV3_VIEW_NAMES", "GV3_QUESTIONS", "gv3Mission", "INPUT_MISSION", "INPUT_ACTION", "NORMAL_RESPONSE", "READY_RESPONSE",
]);
const selectedRows = rows.filter(row =>
  row.sourceFile === "src/features/garage/evData.ts" ||
  row.sourceFile.startsWith("src/features/garage/") ||
  (row.sourceFile === "src/experiences.tsx" && garageSymbols.has(row.symbol))
);

const refs = {
  data: "src/features/garage/evData.ts",
  experience: "src/experiences.tsx",
  overview: "src/features/garage/ArchitectureOverview.tsx",
  layout: "src/features/garage/VehicleLayout.tsx",
  ee: "src/features/garage/EeBlueprint.tsx",
};
const controls = [
  { id: "overview-architecture", label: "아키텍처", screen: "도메인 미선택 · 전체 차량 보기", exposure: "noDomain && level===0; overview3d=true", action: "전체 차량 3D를 닫고 ArchitectureOverview 표시", source: refs.experience, lines: "649,693-695" },
  { id: "area-picker", label: "파워트레인 / 섀시 / 차량 제어 / 도메인 협조제어", screen: "도메인 미선택 · 전체 차량 3D", exposure: "noDomain && level===0", action: "선택 영역의 아키텍처 화면으로 이동; 협조제어는 coord 상태", source: refs.experience, lines: "690-692,946-947" },
  { id: "overview-area-card", label: "영역 보기 →", screen: "아키텍처 · 전체 영역", exposure: "ArchitectureOverview.open===null", action: "선택 영역의 도메인·입출력 요약 화면 표시", source: refs.overview, lines: "99-114" },
  { id: "domain-shortcuts", label: "11개 도메인명", screen: "전체 차량 3D · 도메인 바로가기", exposure: "noDomain && overview3d", action: "선택 도메인 화면 열기; feature 기본 인덱스 0", source: refs.experience, lines: "1095-1100,1049-1051" },
  { id: "architecture-domain-buttons", label: "11개 도메인명", screen: "아키텍처 · 영역 카드/영역 상세", exposure: "ArchitectureOverview", action: "선택 도메인 기능 흐름 열기", source: refs.overview, lines: "34-42,111-113,141-145" },
  { id: "tree-area", label: "파워트레인 / 섀시 / 차량 제어", screen: "우측 아키텍처 탐색 트리", exposure: "noDomain && level===0", action: "선택 영역 논리 뷰 열기", source: refs.overview, lines: "24-43" },
  { id: "tree-vehicle", label: "차량 전체 · 3D 보기 / 차량 3D 보기", screen: "우측 아키텍처 탐색 트리", exposure: "noDomain && level===0", action: "전체 차량 3D 뷰 열기", source: refs.overview, lines: "27-45" },
  { id: "overview-crumb", label: "전체 영역 / 파워트레인 / 섀시 / 차량 제어", screen: "아키텍처 · 영역 상세", exposure: "open!==null", action: "전체 영역 카드 또는 선택 영역 화면 열기", source: refs.overview, lines: "128-131" },
  { id: "coord-signal-preview", label: "협조 신호 이름 6개 미리보기", screen: "아키텍처 · 전체 영역", exposure: "open===null; COORD_SIGNALS.slice(0,6)", action: "선택 신호의 송신/수신 도메인 경로 표시", source: refs.overview, lines: "116-124" },
  { id: "coord-signal-list", label: "협조 신호 이름 9개", screen: "아키텍처 · 영역 상세", exposure: "open!==null", action: "선택 신호 경로 토글", source: refs.overview, lines: "153-157" },
  { id: "layer-navigation", label: "기능 흐름 / 부품·E/E / SW 구성 / SW 로직", screen: "정비소 모든 상태", exposure: "항상 렌더; 도메인 미선택 시 2~4번째 버튼은 needsDomain 표시이며 클릭 핸들러가 선택을 막음", action: "routeLevel 0..3 선택", source: refs.experience, lines: "963,1089-1093" },
  { id: "domain-breadcrumb", label: "차량 전체 / 영역명 / 다른 도메인 / 영역 바꾸기", screen: "도메인 선택 상태", exposure: "chosen===true", action: "차량 전체·영역·다른 도메인 화면으로 이동", source: refs.experience, lines: "1101-1110" },
  { id: "feature-buttons", label: "선택 도메인의 기능명 4개", screen: "도메인 선택 상태 · 우측 주요 기능 패널", exposure: "chosen===true", action: "feature 인덱스 변경; 중앙 뷰·하단 흐름 데이터 동기화", source: refs.experience, lines: "1169-1173" },
  { id: "ee-mode", label: "연결 / 겹쳐 / 실제 부품", screen: "부품·E/E 관점", exposure: "chosen && routeLevel===1", action: "EeBlueprint의 eeLayer 변경; 노드 클릭의 세부 동작 변경", source: refs.experience, lines: "655-670" },
  { id: "wiring-toggle", label: "배선 숨기기 / 배선 보기", screen: "기능 흐름 3D", exposure: "level===0", action: "wiringVisible 토글; 전체/도메인 3D에 전달", source: refs.experience, lines: "615-617,683-699" },
  { id: "body-toggle", label: "차체·카울 숨기기 / 차체·카울 보기", screen: "기능 흐름 3D", exposure: "level===0", action: "전체 차량은 bodyVisible, 도메인 뷰는 shell 토글", source: refs.experience, lines: "615-616,699" },
  { id: "part-select", label: "부품 클릭 선택", screen: "도메인별 기능 흐름 3D", exposure: "level===0 && !allDomains && chosen", action: "선택 부품 정보 표시 및 활성 스텝 갱신", source: refs.experience, lines: "646-648,686-689" },
  { id: "flow-node-buttons", label: "입력·중간 단계·출력 노드명", screen: "하단 신호 흐름", exposure: "chosen===true", action: "선택 단계와 activeStep 갱신", source: refs.experience, lines: "1175-1179" },
  { id: "input-controls", label: "도메인별 인터록 버튼 + 입력 동작 버튼", screen: "도메인 선택 상태", exposure: "chosen===true; 준비조건에 따라 버튼 disabled/status 변화", action: "조건 상태 갱신 후 길게 누른 입력에서 신호 흐름 활성화", source: refs.experience, lines: "1115-1119" },
  { id: "step-controls", label: "다음 스텝 / 처음으로 · 자동재생 / 일시정지", screen: "도메인 선택 상태", exposure: "chosen===true", action: "활성 신호 단계 진행 또는 자동재생 토글", source: refs.experience, lines: "1120" },
  { id: "garage-next", label: "다음 →", screen: "정비소 본문 하단", exposure: "전체/도메인 상태 모두", action: "OPEN_LEVELS로 레벨 선택 진입", source: refs.experience, lines: "1168-1179" },
  { id: "hidden-ee-tabs", label: "흐름 따라가기 / 부품 소개", screen: "비노출 코드 경로", exposure: "SHOW_EE_TABS=false라 탭 전체가 렌더되지 않음", action: "미노출", source: refs.experience, lines: "44-45,1121-1141" },
  { id: "hidden-pull-tabs", label: "빼 보기 / 범인 찾기", screen: "비노출 코드 경로", exposure: "SHOW_PULL_TABS=false라 탭 렌더되지 않음", action: "미노출", source: refs.experience, lines: "44,1139-1141" },
  { id: "app-back", label: "이전 단계", screen: "공통 상단 단계 내비게이션", exposure: "정비소 장면", action: "feature → view → domain → 전체 차량 순으로 후퇴; 최상위에서 프롤로그 확인창", source: refs.experience, lines: "965-970" },
];

const technicalFindings = [
  { id: "GARAGE-FLOW-001", status: "confirmed_internal_mismatch", severity: "high", claim: "The propulsion E/E inspector assigns vehicle-level semantic labels to E/E boundaries, so the CAN torque boundary can be labeled as accelerator intent in percent.", evidence: [{ file: "src/features/garage/evData.ts", lines: "29-36", detail: "Propulsion vehicle-flow layer has five meanings; its E/E layer has ten nodes including VCU, CAN torque, and MCU/inverter." }, { file: "src/experiences.tsx", lines: "764-767,785-786", detail: "flowSignals evenly resamples the five vehicle meanings to E/E node count; FlowStepCard displays each as node input/output." }, { file: "src/sim/components.ts", lines: "37-42,129-132", detail: "The actual VCU-to-MCU Torque_Request contract is a CAN message in Nm." }], systemImpact: "The same system's signal name, boundary, and unit differ between the inspector and component contract, misleading the player about what crosses VCU→MCU.", verification: "Open propulsion > driver torque request interpretation > parts/E/E; inspect VCU, CAN torque, MCU nodes and compare labels/units with the declared port connection.", scope: "Code behavior confirmed; actual browser rendering and other feature mappings still need separate verification." },
  { id: "GARAGE-IO-002", status: "confirmed_label_image_mapping_mismatch", severity: "medium", claim: "Vehicle-control overview input labels do not correspond to the hardware thumbnails paired by index.", evidence: [{ file: "src/features/garage/evData.ts", lines: "411-415", detail: "Input labels are diagnostic equipment and front camera/radar." }, { file: "src/features/garage/ArchitectureOverview.tsx", lines: "93-98,108-109", detail: "The matching model IDs are generic_ecu and imu_sensor; rendering pairs image and label by array index." }], systemImpact: "A player can mistake unrelated hardware imagery as the real diagnostic device or camera/radar.", verification: "Inspect the vehicle-control area's two input cards in browser; confirm their actual model/image and whether they are explicitly presented as symbolic illustrations.", scope: "Array mismatch confirmed in code; intended symbolic use is not documented and needs product/visual confirmation." },
  { id: "GARAGE-COORD-003", status: "confirmed_model_scope_gap_educational_ambiguity", severity: "medium", claim: "The common vehicle simulation does not use the registered BMS discharge-limit or thermal-derate VCU input ports in its torque-limit calculation.", evidence: [{ file: "src/sim/components.ts", lines: "37-39,129-132,148-151", detail: "VCU ports and BMS/thermal connections are declared." }, { file: "src/sim/vehicleSim.ts", lines: "103-121", detail: "stepVehicle calculates derate locally from motor temperature and computes a local power limit; BMS limit is logged but is not an input to the torque limit." }, { file: "src/features/garage/PedalLab.tsx", lines: "6-14", detail: "PedalLab calls stepVehicle with driver inputs/state only." }], systemImpact: "The architecture depicts cross-domain limits, while the common pedal simulation does not model those signals as calculation inputs, leaving the simulation boundary unclear.", verification: "Change BMS/thermal limit conditions in the player-facing model, observe whether the pedal-lab output changes, and check whether the UI states this is a deliberately simplified scope.", scope: "Code boundary confirmed; classify as a defect only after checking intended pedagogical scope and player-facing explanation." },
  { id: "GARAGE-CASE-004", status: "confirmed_cross_stage_cause_identity_mismatch", severity: "high", claim: "The propulsion domino answer key and the experiment stage's true hypothesis/fault injection point identify different system locations.", evidence: [{ file: "src/game/scenarios.ts", lines: "18-30,195-212", detail: "Scenario root and domino candidate key are gateway, while SCENARIO_META marks vcu_sw true and describes VCU pedal-processing SW; fault injection is a VCU input coefficient ×0.45." }, { file: "src/game/runtime.ts", lines: "334-347", detail: "Domino solve answer sets root to gateway." }, { file: "src/sim/vehicleSim.ts", lines: "110-112", detail: "Pedal scale fault is applied at APP_Position processing." }], systemImpact: "The learner may infer that domino selected a gateway fault but the experiment actually tests VCU software. A compatibility alias is possible, but no explicit propulsion mapping was found.", verification: "Complete the propulsion scenario and record the displayed cause, hypothesis verdict, injected fault parameter, and repair target across domino, bench, and repair stages; verify any canonical-ID alias mapping.", scope: "Values and injection site confirmed; intended alias semantics remain unverified." },
];

const entryKey = entry => `${entry.sourceFile}:${entry.line}:${entry.column}:${entry.keyPath}`;
const unique = new Map(selectedRows.map(row => [entryKey(row), row]));
const contentEntries = [...unique.values()].sort((a, b) => a.sourceFile.localeCompare(b.sourceFile) || a.line - b.line || a.column - b.column);
const sourceLines = new Map();
function lineOf(relativePath, literal, startLine = 1) {
  const lines = sourceLines.get(relativePath) ?? fs.readFileSync(path.join(root, relativePath), "utf8").split(/\r?\n/);
  sourceLines.set(relativePath, lines);
  const needle = JSON.stringify(literal);
  const index = lines.findIndex((line, i) => i + 1 >= startLine && line.includes(needle));
  return index >= 0 ? index + 1 : null;
}
const domainValues = Object.fromEntries(DOMAIN_ORDER.map(id => {
  const meta = EV_DOMAINS[id];
  return [id, {
    id, label: meta.label, group: meta.group, purpose: meta.purpose,
    sourceFile: refs.data,
    features: meta.features.map((feature, featureIndex) => {
      const nameRow = contentEntries.find(row => row.sourceFile === refs.data && row.keyPath === `EV_DOMAINS.${id}.features.[${featureIndex}].name`);
      let searchFrom = nameRow?.line ?? 1;
      const layers = feature.layers.map((layer, layerIndex) => layer.map((value, itemIndex) => {
        const line = lineOf(refs.data, value, searchFrom);
        if (line) searchFrom = line;
        return { value, sourceFile: refs.data, line, keyPath: `EV_DOMAINS.${id}.features.[${featureIndex}].layers.[${layerIndex}].[${itemIndex}]` };
      }));
      return {
        name: feature.name, category: feature.category, summary: feature.summary,
        sourceFile: refs.data, line: nameRow?.line ?? null,
        layers: layers.map(layer => layer.map(item => item.value)),
        layerSourceRows: layers.flat(),
      };
    }),
  }];
}));
const layers = contentEntries.filter(row => row.sourceFile === refs.experience && ["learningLayers", "GV3_VIEW_NAMES"].includes(row.symbol));
const modelSources = contentEntries.filter(row => [refs.layout, "src/features/garage/vehicleSpec.ts"].includes(row.sourceFile));
const catalog = {
  metadata: {
    title: "정비소 플레이어 노출 콘텐츠·상호작용 원문 카탈로그",
    snapshotCommit: "d19e1844cee87fbea5c0a41ffe01a20da556c28b",
    generatedAt: "2026-11-19",
    sourceOfTextRows: "docs/PLAYER_CONTENT_CATALOG_2026-11-19.jsonl",
    sourceFiles: [...new Set(contentEntries.map(row => row.sourceFile))].sort(),
    textRowCount: contentEntries.length,
    controlCount: controls.length,
    domainCount: Object.keys(domainValues).length,
    featureCount: Object.values(domainValues).reduce((n, d) => n + d.features.length, 0),
    layerValueCount: Object.values(domainValues).flatMap(d => d.features).flatMap(f => f.layers).reduce((n, layer) => n + layer.length, 0),
    limits: [
      "문구/데이터 원문은 정적 소스 추출 결과이며 실제 렌더 여부는 exposure 조건과 브라우저 확인을 함께 봐야 합니다.",
      "제3자 차량 표준 적합성 판정이 아니라 내부 데이터·신호 방향·화면 동작 사이의 일관성 검수 카탈로그입니다.",
      "3D의 픽셀 배치/시각 품질과 상호작용 결과는 정적 소스만으로 승인하지 않습니다.",
    ],
  },
  viewLayers: layers,
  controls,
  domainArchitecture: Object.values(domainValues),
  physicalViewSourceRows: modelSources,
  physicalVehicleSpec: PHASE0_VEHICLE_SPEC,
  placementAudit: CURRENT_LAYOUT_PLACEMENT_AUDIT,
  builtInConsistencyChecks: {
    domainReferences: auditDomainReferences(PHASE0_VEHICLE_SPEC),
    physicalVehicleSpec: validateVehicleSpec(PHASE0_VEHICLE_SPEC),
    sourceFiles: ["src/features/garage/vehicleSpec.ts:349-373", "src/features/garage/vehicleSpec.ts:375-"],
  },
  technicalFindings,
  sourceRows: contentEntries,
};

const jsonPath = path.join(root, "docs/GARAGE_PLAYER_CONTENT_CATALOG_2026-11-19.json");
fs.writeFileSync(jsonPath, JSON.stringify(catalog, null, 2) + "\n", "utf8");

const link = (file, lines) => `[${file}:${lines}](../${file}#L${lines.split(/[-,]/)[0]})`;
let md = `# 정비소 플레이어 노출·기술 검수 카탈로그\n\n- 기준 커밋: \`${catalog.metadata.snapshotCommit}\`\n- 정적 원문 행: ${contentEntries.length} · UI 동작 항목: ${controls.length}\n- 3개 영역 · ${catalog.metadata.domainCount}개 도메인 · ${catalog.metadata.featureCount}개 기능\n- 전체 구조화 원자료: [GARAGE_PLAYER_CONTENT_CATALOG_2026-11-19.json](GARAGE_PLAYER_CONTENT_CATALOG_2026-11-19.json)\n- 원문 후보 출처: [PLAYER_CONTENT_CATALOG_2026-11-19.jsonl](PLAYER_CONTENT_CATALOG_2026-11-19.jsonl)\n\n## 직접 검수하는 순서\n\n1. 한 기능을 고르고 네 관점의 내용을 처음부터 끝까지 연결해 읽습니다. 화면에 표시된 순서만 보지 않고 입력·출력 경계, 제어 소유자, 전달 신호를 함께 확인합니다.\n2. 각 선행·후행 신호를 다른 기능과 도메인에서도 대조합니다. 신호 이름이 같으면 송신자·수신자·단위·방향·조건이 같은지 확인합니다.\n3. 구체적인 고장 시나리오가 그 기능 데이터와 실제 입력·출력 모델을 같은 방식으로 재사용하는지 대조합니다.\n4. 문제 후보는 먼저 코드 근거로 재현 가능한 불일치인지 확인합니다. 외부 기술 규격을 근거로 삼는 주장은 해당 규격의 정확한 문서·절·판본을 확보하기 전까지 ‘미확인’으로 둡니다.\n5. 렌더 조건·숨김 상태·클릭 후 결과는 브라우저에서 확인합니다. 정적 카탈로그만으로 실제 화면 노출을 확정하지 않습니다.\n\n## 판정 기준\n\n- **확인된 결함**: 동일 시스템 안의 명시적 데이터/핸들러가 서로 모순되거나, 요구된 상호작용이 코드상 도달 불가능함을 파일·줄·상태 전이로 입증할 수 있음.\n- **교육상 모호성**: 코드 안에 입력·출력/신호의 소유 경계가 없거나 서로 다른 용어를 같은 값처럼 사용해 학습자가 흐름을 유일하게 해석할 수 없음. 관찰한 화면과 원문 근거를 함께 적음.\n- **검증 대기**: 근거가 코드에 없거나 실제 렌더·모델·표준 확인을 해야만 판단 가능함. 결함으로 단정하지 않음.\n- 각 finding은 주장 → 근거(파일·줄/화면 상태) → 시스템 영향 → 확인 방법 → 판정으로 기록합니다. 반대 근거와 범위를 제한하는 조건도 함께 적습니다.\n\n## 화면 경로와 조작 인벤토리\n\n| 화면/조작 | 현재 라벨 또는 라벨 범위 | 노출 조건·동작 | 근거 |\n|---|---|---|---|\n`;
for (const c of controls) md += `| ${c.screen} | \`${c.label}\` | ${c.exposure}; ${c.action} | ${link(c.source,c.lines)} |\n`;
md += `\n## 모든 영역·도메인·기능 원문\n\n`;
for (const domain of Object.values(domainValues)) {
  md += `### ${domain.group} · ${domain.label} (\`${domain.id}\`)\n\n**목적 원문:** \`${domain.purpose}\`\n\n| 기능명 원문 | 분류 원문 | 요약 원문 | 기능 흐름 | 부품·E/E | SW 구성 | SW 로직 |\n|---|---|---|---|---|---|---|\n`;
  for (const feature of domain.features) md += `| \`${feature.name}\` | \`${feature.category}\` | \`${feature.summary}\` | ${feature.layers.map(layer => `\`${layer.join(" → ").replaceAll("|", "\\|")}\``).join(" | ")} |\n`;
  md += `\n`;
}
md += `## 물리 차량/3D 원문과 모델 배치 근거\n\n아래 원자료 JSON의 \`physicalViewSourceRows\`에는 \`VehicleLayout.tsx\`의 배치·신호 라벨 및 \`vehicleSpec.ts\`의 물리 인스턴스·조립체·배치 상태 소스 후보를 넣었습니다. \`physicalVehicleSpec\`에는 차량 3D가 구성하는 인스턴스·조립체·신호·동작 바인딩 전체가 들어 있습니다.\n\n### 저장소 자체 참조/배치 검사 결과\n\n다음은 코드에 구현된 검사 함수의 출력입니다. 검사기 자체가 모든 자동차 시스템의 옳고 그름을 증명하지 않으므로 건수는 검토 대기 항목으로 취급합니다. 세부 원소와 메시지는 JSON의 \`builtInConsistencyChecks\`를 보세요.\n\n- 차량 명세: ${PHASE0_VEHICLE_SPEC.physicalInstances.length}개 물리 인스턴스, ${PHASE0_VEHICLE_SPEC.assemblies.length}개 조립체, ${PHASE0_VEHICLE_SPEC.signalObjects.length}개 신호 객체.\n- 도메인 부품 참조 대조: 미해결 라벨 ${catalog.builtInConsistencyChecks.domainReferences.unresolvedLabels.length}개, 없는 물리/신호 참조 ${catalog.builtInConsistencyChecks.domainReferences.missingReferences.length}개. 참조 규칙은 \`vehicleSpec.ts:349-373\`에 있습니다. 규칙 매핑 누락도 가능하므로 이 수치만으로 실제 부품 결함이라 하지 않습니다.\n- 물리 명세 검사: 오류 ${catalog.builtInConsistencyChecks.physicalVehicleSpec.errors.length}개, 경고 ${catalog.builtInConsistencyChecks.physicalVehicleSpec.warnings.length}개. 검사기는 \`vehicleSpec.ts:375\` 이후에 있습니다.\n\n## 모든 정적 원문 행\n\nJSON의 \`sourceRows\`는 소스에 저장된 UI 문자열 후보와 3D/E/E 안내 문구를 보존합니다. 네 관점의 기능 레이어는 영어 SW 이름도 포함해 TypeScript 데이터에서 직접 읽어 원문을 누락 없이 저장했습니다. 각 행의 파일·라인·keyPath·rawSource는 원자료 JSON에서 확인할 수 있습니다. 아래 인덱스는 화면 문자열의 빠른 검색용입니다.\n\n| 파일·라인 | 심볼 | keyPath | 카테고리 | 원문 value |\n|---|---|---|---|---|---|\n`;
for (const row of contentEntries) {
  const value = JSON.stringify(row.value).replaceAll("|", "\\|");
  md += `| [${row.sourceFile}:${row.line}](../${row.sourceFile}#L${row.line}) | \`${row.symbol}\` | \`${row.keyPath}\` | ${row.category} | \`${value}\` |\n`;
}
md += `\n## 이 목록만으로 결론내리지 않는 범위\n\n- 이 문서는 원문·상호작용의 주소록입니다. 기술적으로 맞고 틀림을 자동 판정하지 않습니다.\n- 기본 진입 상태, URL 직접 진입, 영역/도메인 선택 후의 패널 차이가 실제 화면과 일치하는지 브라우저 검수가 필요합니다.\n- 계기·차량 모델의 물리 배치, 각 아이콘/모델의 의미, 배선 색·애니메이션은 3D 실행 화면으로 확인해야 합니다. 코드에 배치가 선언되어도 실제 모델의 방향·비율·가시성은 정적 근거만으로 확인되지 않습니다.\n- 코드에 남았지만 플래그로 막힌 \`SHOW_EE_TABS\`, \`SHOW_PULL_TABS\` 분기는 현재 플레이어에게 보이는 UI와 분리해 기록했습니다.\n`;
fs.writeFileSync(path.join(root, "docs/GARAGE_PLAYER_CONTENT_CATALOG_2026-11-19.md"), md, "utf8");
console.log(JSON.stringify({ entries: contentEntries.length, controls: controls.length, domains: catalog.metadata.domainCount, features: catalog.metadata.featureCount, layerValues: catalog.metadata.layerValueCount, files: catalog.metadata.sourceFiles.length, md: "docs/GARAGE_PLAYER_CONTENT_CATALOG_2026-11-19.md", json: "docs/GARAGE_PLAYER_CONTENT_CATALOG_2026-11-19.json" }, null, 2));
