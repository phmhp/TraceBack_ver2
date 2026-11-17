# 사건 구현 후 대조 검수표

사건 시트의 값과 화면이 같은지 **화면마다 직접** 대조합니다. 하나라도 어긋나면 완료가 아닙니다.

## A. 규칙 (RULES.md)
- [ ] R1 오답 선택지: 모든 오답에 반박 근거가 있고 모호한 선지가 없다. 형식·길이 균일, 정답 위치가 다른 사건과 다르다
- [ ] R2 HW 가설은 0~1개이고 정답이 아니다
- [ ] R3 말투(해요체), 감탄·반말·이모지·면책 문구 없음
- [ ] R4 증상 카드 = 실제 증상 1 + 영향 없는 출력 2
- [ ] R5 숫자가 시트와 모든 화면에서 같다
- [ ] R6~R10 시점/노드/퍼즐/수준/수리 규칙
- [ ] R11 진단 채널 항목이 화면(계기판·증거)과 맞다
- [ ] R13 오픈북·정비소 연결
## B. 화면별 대조
| 화면 | 확인 | 파일 |
|---|---|---|
| 사건 제목·요약 | | `game/scenarios.ts` |
| 레이싱: 시점·트리거·연출·경고등 | | `experiences.tsx`, `sim/vehicleSim.ts` |
| 컷신·대화 | | `features/cutscenes/*` |
| STEP02 진술·계기판·관찰·증거 | | `features/board/EeTrace.tsx` |
| STEP02 노드·시점·함정 | | `features/board/DominoTrace.tsx` |
| STEP02 증상 카드 3장 | | 〃 |
| STEP02 의심 구간 3지선다·구간 들여다보기 | | 〃 |
| STEP02 가설·반박 근거 | | `game/scenarios.ts` |
| 오픈북 | | `ui/OpenBook.tsx` |
| STEP03 요구사항·블록·빈칸·조각·함정 | | `features/wiring/RefPuzzle.tsx` |
| STEP03 시험 설계서 | | `game/verificationContract.ts` |
| STEP04 질문·신호표·판정 규칙 | | `features/verification/VerificationLab.tsx`, `simModel.ts` |
| STEP04 원인 카드·수리 선택지·회귀 | | 〃 |
| 엔딩 그림·교훈·안전 토글 | | `ui/CaseFileEnding.tsx` |
| DEV 메뉴 이동 | | `ui/dev/DevMenu.tsx` |
| 이미지 프롬프트 | | `scripts/image-prompt-data.mjs` |
## C. 자동·UI 검수
- [ ] `npm test` 통과, `tsc -b` 통과
- [ ] 사건 전 과정을 브라우저에서 순회(STEP02 → STEP03 → STEP04), 1600×900 위반 0 (`DESIGN_DECISIONS_V3.md` 10절)
- [ ] 시트 상태를 "구현완료·검수완료"로 갱신하고 결정 기록 문서에 한 줄 추가
