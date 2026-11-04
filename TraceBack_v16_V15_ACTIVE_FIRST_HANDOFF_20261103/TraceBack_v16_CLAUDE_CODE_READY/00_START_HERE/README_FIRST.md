# TRACEBACK — 최종 Claude Code 인계 마스터 / 2026-11-03

## 사용법 / 시작하기
1. `00_START_HERE/01_RULES_AND_PRECEDENCE.md` 읽기.
2. `01_IMPLEMENTATION/01_CLAUDE_PASS_1.md`를 첫 구현 프롬프트로 사용.
3. 필요한 화면은 `02_UI_DESIGN/STITCH_SCREEN_INDEX.csv` 색인에서 **개별** 참조.
4. 코어는 `03_CONTROL_CORE/TraceBack_v14_REUSABLE_CONTROL_CORE.zip`만 기준. 대형 구 Git 저장소 읽지 않음.
5. 에셋은 `04_ASSETS/SELECTED_REFERENCE/`에서 필요한 일부만 참조. `TraceBack_Organized_3_ORIGINAL.zip` 전체 원본은 이 전달 ZIP에 포함되지 않으며, 필요하면 원 제공처에서 별도 확보.
6. 고장 스토리 후보는 `05_SCENARIOS/`의 JSON을 참조하되 **모두 PROPOSED, 실측·검증 trace 아님**.
7. 불명확/미구현/실패는 숨기지 말고 `REPORTS/OPEN_QUESTIONS.md`, `REPORTS/NOT_IMPLEMENTED.md`, `REPORTS/TEST_RESULTS.md`에 보고.

## 자료 상태
- 이 ZIP은 **개발 인계 자료**이지 완성 게임이 아님.
- v14 통합 제어는 ECU 명령과 장난감 액추에이터 플랜트를 포함; 게임의 실제 속도·위치·요/선회·충돌·AI와 아직 연결 안 됨.
- 플레이어 변경 SW 블록을 v14 통합 제어에 자동 반영하는 기능은 별도 개발 필요.
- Stitch HTML의 링크와 버튼은 동작 명세가 아니라 **시각 레퍼런스**.
- 승인되지 않은 설명/결함/허용오차/trace를 사실인 것처럼 생성 금지.
- 과거 문서들은 `07_HISTORICAL_ARCHIVE/`의 낮은 우선순위 자료. 충돌 시 이 패키지의 00/01 문서가 우선.

## 단 한 항목도 누락하지 않기 위한 정책
이 패키지는 현재 작업에서 사용하는 최신 v14, 최종 Stitch HTML 2종, 추가 Stitch 이미지 레퍼런스 7종, Organized 3 일부 선택 에셋, 시나리오 11종, 이전 인계/감사 문서들을 **원본 ZIP 그대로** 별도 보존한다. 동일한 원본의 사본이나 더 오래된 게임 전체 Git ZIP은 중복을 피하여 미포함; `SOURCE_MANIFEST.csv`와 `EXCLUSIONS_AND_DUPLICATES.md` 참고. 전달 원본의 존재/해시를 검사하되 각 압축 내부 파일을 코드로 해석한 것은 아님.
