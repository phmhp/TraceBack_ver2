# CLAUDE CODE — PASS 1 (새 프로젝트, 실제 실행 가능한 첫 사건)

이 마스터 ZIP의 00_START_HERE 3개 문서를 먼저 읽고, `01_IMPLEMENTATION/00_ARCHITECTURE_AND_GAME_FLOW.md`, `02_CONTROL_INTEGRATION_CONTRACT.md`, `03_SCREEN_AND_CONTENT_CONTRACT.md`, `04_QA_AND_ACCEPTANCE.md`를 읽어라. 대형 원본 전체는 먼저 읽지 않는다. 기존 Git 저장소를 클론/분석하지 않는다.

**구현 목표**: 단일 실행 가능한 PC 16:9 3D 게임, 차고 4층 대표 기능, 연속 주행·추격, 가속 고장 발생, 08-01 추리/증거, 08-02 문장형 블록 실제 계산, 08-03 카드 시험·기준/수정 비교·실패 분석·회귀, 게임 복귀.

1. 새 프로젝트 구조를 만들고 실행 명령/의존성을 명시. 기존 v14 코어는 별도 모듈/어댑터로 격리하여 차후 교체 가능하게 한다.
2. FIRST READ: `03_CONTROL_CORE/TraceBack_v14_REUSABLE_CONTROL_CORE.zip`의 `docs/INTEGRATED_VEHICLE_CONTROL_EDUCATIONAL.md`, `src/campaign/integratedVehicleModel.ts`, `tests/integrated-vehicle-educational.test.mjs`와 관련 deps만 추출·읽고, 원본 재사용 부위를 문서화한다.
3. 운전자 입력→코어 ECU 명령→모터/브레이크 등 명령/피드백→게임 차량 속도·방향/위치 → 다음 제어 틱의 차속 피드백까지 일관된 데이터 흐름 구현. 조향 물리 모델은 경량 아케이드로 가능; EPS 보조를 조향각과 동치 취급 금지.
4. 핵심 로직 블록을 executor로 실제 실행하고 **플레이어 수정이 통합 제어 출력에 영향을 미치는 경로**가 있음을 자동 테스트로 증명. 미구현 시 데모용 stub으로 속이지 말고 차단 사유 보고.
5. 기준 모델과 플레이어 모델 각각 초기 상태 복제/리셋, 동일 dt/입력 시퀀스 적용; 정상/경계/고장/복귀 시험. PASS는 요구사항 기반 기대값으로 판정; 기준 모델과 단순 동일하다는 이유로 PASS 처리 금지.
6. Stitch의 화면 구조·비주얼만 참고, HTML 링크 그대로 연결 금지. `screen.png`를 우선 비교; 개별 `code.html`은 해당 화면 구현 때만 읽는다. UI 콘텐츠는 JSON 시나리오 데이터 제공 영역으로 구성.
7. `06_INPUTS_AND_DECISIONS/`의 OPEN 항목은 사용자의 승인 없이 확정하지 않는다. 데모에 필요한 임시 결정은 `PROVISIONAL` 및 적용 범위 기재. 결함/신호가 검증되지 않으면 '예시'라고 공개한다.
8. 출시 수준의 모든 도메인 구현을 주장 금지. 1사건의 실사용 가능한 수직 슬라이스와 위험/미완료 보고를 우선 완성.
9. 작업 종료 전에 `REPORTS/OPEN_QUESTIONS.md`, `REPORTS/NOT_IMPLEMENTED.md`, `REPORTS/TEST_RESULTS.md`, `REPORTS/FILE_CHANGES.md`, `REPORTS/SCREENSHOTS.md`, `REPORTS/NEXT_PASS.md` 작성. '질문 없음'이어도 빈 목록을 적는다.

**최종 응답 형식**:
A. 실제 동작한 기능/실행 방법
B. 참고한 원본 파일 경로 및 재사용 방식
C. 실제 실행한 테스트와 PASS/FAIL(명령 포함)
D. 확인이 필요한 모호한 결정(P0/P1), 본인의 임시 선택과 영향
E. 못 만들었거나 stub 처리한 기능(데이터, 3D 모델, 테스트, 화면)
F. 우선 수정해야 할 5가지

시각적으로만 성공해 보이는 가짜 PASS, mock 결과를 '실제 시험'으로 주장, 빈 3D 맵, 단추만 있는 연결 안 된 화면은 완료로 간주하지 않는다.
