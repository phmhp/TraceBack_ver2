# 최초 Claude Code 인계: v16 게임 런타임 + v15 현재 제어 코어

## 핵심 사실
- ACTIVE 제어 코어: `03_CONTROL_CORE/ACTIVE/TraceBack_v15_INTEGRATED_CONTROL_CORE.zip`.
- 편의를 위해 동일한 v15 소스가 `03_CONTROL_CORE/ACTIVE/EXTRACTED/`에 풀려 있다. 두 번 읽을 필요 없다.
- v14 ZIP은 `03_CONTROL_CORE/ARCHIVE/`로 이동한 구형 보존본이다. 실행의 우선 기준으로 삼지 않는다.
- `08_V14_1_DELIVERY/`는 v14.1 당시 고장 주입·교육 시험 브리지와 3개 실행 사례를 보존한다.
- `09_V16_GAME_RUNTIME/`는 현행 게임 상태기·레이싱·시험 런타임이다.
- **주의: v15와 v14.1/v16 런타임이 이미 결합·통합 테스트되었다는 뜻이 아니다.** 같은 ZIP에 함께 담고 현재 버전 지정만 수정한 인계 패키지다. Claude가 어댑터 병합·충돌 해소 및 테스트를 해야 한다.

## 읽기 순서 (토큰 절약)
1. 이 문서
2. `09_V16_GAME_RUNTIME/START_HERE.md`와 최신 contracts
3. `08_V14_1_DELIVERY/contracts/CONTROL_MUTATION_API.md`
4. `03_CONTROL_CORE/ACTIVE/EXTRACTED/TraceBack-develop/docs/V15_MOTION_CORE_HANDOFF.md`
5. 구현에 필요한 ACTIVE 제어 파일 및 사건 하나의 시나리오만
6. 화면별 Stitch 및 필요한 에셋만 선택적으로 확인
과거 프롬프트, 07_HISTORY, v14 보존본은 기본적으로 읽지 말 것.

## 반드시 먼저 해결할 결합 계약
- v15 종·횡방향 운동/휠/ABS/TCS/ESC와 09_V16_GAME_RUNTIME 레이싱 계산의 **차량 운동 소유권 하나만 선택**. 이중 적분 금지.
- v14.1 교육용 게이트웨이 SW 수정과 HW 고장 주입이 v15의 실제 신호/출력에 연결되는지 확인.
- 현재 세 사건: propulsion_gateway(SW), thermal_fan(HW), brake_actuator(HW). 이전 제안형 사건과 섞지 말 것.
- 배터리/구동/제동/EPS 명령, 실제 액추에이터 피드백, 게임의 차량 위치·방향을 서로 구분.
- 변경 전후 레거시 테스트와 새로운 통합 테스트를 모두 실행.

## Stitch / 아트
- Stitch HTML은 **시각 디자인 참고용**, 버튼·링크·정답·값은 참조하지 않는다.
- 기본 폰트 Pretendard 전역 지정(합법적인 사용 경로 및 폴백 포함).
- 포근한 3D 코지 레이싱 게임, 단순 대시보드 금지; 비레이싱 고양이 상시 리깅은 불필요.

## 상태 보고
`REPORTS/CONTROL_MERGE.md`, `REPORTS/OPEN_QUESTIONS.md`, `REPORTS/NOT_IMPLEMENTED.md`, `REPORTS/TEST_RESULTS.md`, `REPORTS/SCREEN_QA.md` 작성. 통합 못한 기능, 임시 로직 및 미검증 수치는 반드시 구분.
