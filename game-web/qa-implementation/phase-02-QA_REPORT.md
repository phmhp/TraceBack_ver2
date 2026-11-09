# 단계 2 Chrome QA — 대표 구동 상태와 전달 경로

## 실행 환경

- 대상: `http://127.0.0.1:5173/`
- 브라우저: 설치된 Google Chrome을 CDP로 직접 실행
- 뷰포트: 1054×723
- 화면: Vehicle/System, E/E Architecture, Control Software
- 상태: OFF와 READY→D→가속 입력 활성 상태를 각각 별도 캡처

## 자동 검증

- `npm test`: 44/44 통과
- `npm run build`: 통과
- 회귀 계약: OFF에서는 활성 경로가 없고, 선행 조건 완료 전 D/가속 입력이 잠긴다.
- 대표 경로 계약: APS→VCU→MCU/인버터→PMSM 모터→감속기→차동기어→드라이브 샤프트→전륜과 HV 배터리→주 접촉기→인버터를 포함한다.

## 레이아웃 측정

세 관점과 OFF/ACTIVE 상태에서 아래 좌표가 동일했다.

| 영역 | x | y | width | height |
|---|---:|---:|---:|---:|
| `.garageLayerNav` | 18 | 124 | 162 | 462 |
| `.garageStudio` | 195 | 72 | 847 | 644 |
| `.garageMechanismCard` | 195 | 124 | 613 | 462 |
| `.domainFunctionShelf` | 816 | 124 | 226 | 462 |
| `.garageFlowPanel` | 195 | 594 | 847 | 122 |
| `.inputBar` | 207.265625 | 534 | 588.46875 | 40 |

## 수동 시각 검수

- OFF: E/E 전달선과 장치가 중립색이며 `차량 OFF · READY 켜기부터 켜세요`를 표시한다.
- 조건: READY→D 순으로만 열리고, 이전 조건을 끄면 뒤 조건도 해제된다.
- ACTIVE: 제어 신호/CAN, 고전압 전력, 기계 토크가 서로 다른 범례와 흐름으로 표시된다.
- 세 관점: 중앙 표현만 바뀌며 좌측 관점 선택, 우측 기능, 입력 바, 하단 흐름 위치는 움직이지 않는다.
- 간섭: 팝업·이전/다음·입력·자동 재생·하단 카드 사이의 겹침이나 잘림을 발견하지 못했다.

## 캡처

- OFF: `phase-02-final-off/02_garage_drive_system.png`, `03_garage_drive_ee.png`, `04_garage_drive_sw.png`
- ACTIVE: `phase-02-final-active/02_garage_drive_system.png`, `03_garage_drive_ee.png`, `04_garage_drive_sw.png`

## 남은 범위

- 이 단계는 대표 구동 기능을 먼저 완성했다. 제동·조향·전원·변속/주차·열관리·현가에 동일 상태 모델을 확장하는 일은 후속 단계로 추적한다.
- E/E 실제 물리 포트 앵커와 논리↔물리 매핑의 세부 검증은 별도 단계로 남긴다.
