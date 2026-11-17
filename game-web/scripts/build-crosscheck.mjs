// Builds docs/CROSSCHECK_STEP01.md: one self-contained GPT review request per domain.
// Usage: npm run crosscheck   (data source: src/features/garage/evData.ts)
import { writeFileSync } from "node:fs";
import { DOMAIN_ORDER, EV_DOMAINS } from "../src/features/garage/evData.ts";

const LAYER = ["0 기능 흐름", "1 부품·E/E", "2 SW 컴포넌트(SWC)", "3 SW 로직"];
const head = `# STEP01 도메인 데이터 교차 검토 요청 (GPT용)

사용법
1. 아래 "공통 지침"을 ChatGPT 새 대화에 먼저 붙여 넣습니다.
2. 도메인 블록을 **한 번에 하나씩** 붙여 넣고, 답변을 받으면 이 문서 맨 아래 "검토 결과 기록"에 요약합니다.
3. 지적 사항은 심각도(오류 / 개선 / 참고)별로 정리해 Claude에게 전달합니다. 수정은 Claude가 반영합니다.

## 공통 지침 (먼저 붙여 넣기)
\`\`\`
당신은 자동차 전동화(EV) 시스템 엔지니어이자 소프트웨어 검증 전문가입니다.
기준: EV 일반 아키텍처, AUTOSAR Classic(SWC, Runnable, RTE, BSW, E2E), ASPICE(SYS.2~5, SWE.1~6), ISO 26262(Part 3, 4, 6).
신입 사원 교육용 게임의 "차량 도메인 학습" 데이터를 검토합니다. 특정 OEM 사양과의 일치는 요구하지 않으며, 일반 EV 아키텍처 관점에서 틀리거나 오해를 부르는 부분만 지적하세요.
각 도메인은 기능 4개이고, 기능마다 같은 흐름을 4개 해상도로 적습니다.
0 기능 흐름(차량 관점), 1 부품·E/E 연결(센서→제어기→버스→구동기), 2 SW 컴포넌트(AUTOSAR SWC 이름), 3 SW 로직(함수·블록).
검토 항목: (a) 용어와 구조가 EV 일반 아키텍처와 맞는가 (b) 기능 4개의 중복·누락 (c) 4개 층이 같은 흐름을 일관되게 보여 주는가 (d) SWC 이름이 AUTOSAR 관례에 맞는가 (e) 안전 메커니즘이 ISO 26262 관점에서 타당한가 (f) 신입이 오해할 만한 표현.
출력 형식: 표 하나. 열 = 기능 번호 | 층 | 문제 | 심각도(오류/개선/참고) | 수정 제안. 문제가 없으면 "이상 없음"만 쓰세요. 서론과 결론은 쓰지 마세요.
\`\`\`
`;

const blocks = DOMAIN_ORDER.map(id => {
  const d = EV_DOMAINS[id];
  const body = d.features.map((f, i) =>
    `기능 ${i + 1}. ${f.name} [${f.category}]\n  설명: ${f.summary}\n` + f.layers.map((l, k) => `  층 ${LAYER[k]}: ${l.join(" → ")}`).join("\n")).join("\n\n");
  return `## ${d.group} · ${d.label}\n\`\`\`\n도메인: ${d.label} (${d.group})\n목적: ${d.purpose}\n\n${body}\n\`\`\`\n`;
});

const tail = `## 검토 결과 기록
| 도메인 | 검토 일자 | 오류 | 개선 | 참고 | Claude 반영 여부 |
|---|---|---|---|---|---|
${DOMAIN_ORDER.map(id => `| ${EV_DOMAINS[id].label} | | | | | |`).join("\n")}
`;

writeFileSync(new URL("../docs/CROSSCHECK_STEP01.md", import.meta.url), [head, ...blocks, tail].join("\n"));
console.log(`domains ${DOMAIN_ORDER.length}`);
