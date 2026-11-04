# UI + content ownership

## 공통
Stitch 스크린샷은 디자인 레퍼런스이며 HTML의 버튼/이동은 권위 없음. 제목, 실측 숫자, 조건문, 정답 등을 Stitch 그림에서 추출해 실제 자동차 스펙으로 쓰면 안 됨. page UI는 `ScenarioPack`, `signalDictionary`, `requirements`, `testVectors` 등으로 주입되는 슬롯을 표현하고, 데이터 없는 곳은 '승인 대기/미검증' 표시.

| 구간 | UI에 반드시 있는 정보 | 게임 행동 | 콘텐츠 제공 주체 |
|---|---|---|---|
| TITLE | 캐릭터/차량/목적지/시작 | 시작 | 그래픽+대사(검수) |
| GARAGE L1 | 차량 도메인·기능·요구 | 도메인 선택 | 도메인 사전 |
| GARAGE L2 | 센서·ECU·액추에이터·통신/전력 연결 | 시스템 연결 클릭 | 시스템 매핑 |
| GARAGE L3 | ECU SW 컴포넌트·인터페이스 | 컴포넌트 연결 | SW 아키텍처 매핑 |
| GARAGE L4 | 자연어 요구·SW 조건·명령 | 대표 블록 조립 | 상세 설계·실행기 |
| CHASE | 도로/차량/속도/체포 위험/목적지 | 가감속/조향 | 실제 게임 상태 |
| FAULT CUE | 증상만(원인 숨김) | 관찰/리플레이 | Scenario observable |
| BOARD 08-01 | 관측 3~4, 경쟁 가설, 증거 관계, 관련 신호 | 증거 연결·가설·관측 선택 | Scenario evidence/hypotheses |
| WIRING 08-02 | 1문장 요구사항, 불완전한 신호 경로, HW 및 SW 블록 | 블록·배선 조작 | Scenario requirements/repair + runtime |
| BENCH 08-03 | 시험 카드, 같은 조건의 기준·플레이어 모델, 예상/실측, 차이, PASS/FAIL/INCONCLUSIVE/MODEL_ERROR | 카드 선택·실험·분석·회귀 | test vectors + runtime + oracle |
| REPAIR/RETURN | SW/HW 원인별 안전 조치, 제한 유지 가능성 | 적용 및 주행 | scenario recovery + ECU 상태 |
| END | 운전·추리·검증을 나눠 기록 | 종료/재도전 | 실제 플레이 기록 |

## 스크린 상태/오류
각 씬에 default, loading, missing data, success, wrong, hint, unresolved, model_error, retry를 실제 구현하는 방식 명시. 핵심 버튼/탭은 동작하는 이벤트 핸들러에 연결. 테스트 데이터가 없는데 PASS 도장을 표시하지 말 것.

## 텍스트 규모
초심자용: 한 번에 1~2문장, 더보기에서 전문용어/기술근거. 요구사항 문장을 일부 단위로 나눠도 의미/단위/안전 제약을 보존. 신호 ID는 툴팁/고급정보에서 보여주기.
