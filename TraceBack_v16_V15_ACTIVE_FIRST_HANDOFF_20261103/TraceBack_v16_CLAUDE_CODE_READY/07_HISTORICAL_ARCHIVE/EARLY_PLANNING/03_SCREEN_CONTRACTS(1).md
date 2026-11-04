# 02_SCREEN_CONTRACTS — 5개 씬 + 5개 오버레이
독립 페이지를 늘리지 않고 동일 state store와 동일 차량 그래프를 공유한다. 아래 텍스트는 **와이어프레임 제작용 화면 계약**이고 Figma 완성 화면이 아니다.

| ID | 플레이어가 알아낼 것/목적 | 주행/가장 먼저 보이는 정보 | 행동·인터랙션 | 공개 조건 | 실패·힌트·전환 |
|---|---|---|---|---|---|
| S0 TITLE | 두 고양이/도주 레이싱/미스터리 | 3D 항구와 개조차, 고양이 2명, 큰 Start | Start/Continue/Settings | 첫 진입 | Continue는 저장 있을 때만; Start→S1 |
| S1 GARAGE | 입력→판단→출력 기본 흐름 | 차량 중심 60%, 세 개 물리 부품 토큰, 짧은 드라이버 말풍선 | 카드 부착/신호 연결/엔진 테스트 | 시작 후 | 틀림: 잘못된 연결만 진동; 3회 실패 가이드; 완료→S2 |
| S2 CHASE | 정상·이상 차량 응답 구분 | 넓은 3D track, 하단 속도/페달·브레이크, 상단 압박, 작은 목표 | WASD/방향키, brake, 선택형 boost, replay | 개조 완료; 이상 cue는 정상 구간 완료 후 | 충돌·off-road 복구, 고장→S3 HUD+cam transition, 탈출→S4 |
| S3 ENGINEER MIND | 객관 관측→경쟁 가설→검증 | 추격 게이지 고정 헤더, 3D 차량/기억 중심, 3~4 단서, 두 가설 | submode O1/O2/O3/O4 변경; 문항당 1개 판단 | 고장 cue 후, task별 점진 공개 | 압박 100 잡힘, 시간 초과 자동 보관/다음, 검증→회귀 후 S4 |
| S4 ESCAPE & RESULT | 검증이 주행에 준 영향과 학습 요약 | 항구 램프/선박, 차량 상태와 압박, 마지막 주행 HUD | 레이싱 + 결과 확인 | regression 끝났거나 `unverified` 상태 선택 | Caught→checkpoint, finish→결과 카드/다시하기 |
| O1 QUICK REPLAY | 실제로 언제 무엇이 변했나 | 4~8초 ghost replay + 입력/응답 비교 표시 | 3개 timestamp cue 선택/재생 | 고장 이후 | 누락→가이드 데이터의 출처 표시 후 오류 복구 |
| O2 EVIDENCE BOARD | 단서끼리 지지/반박하는가 | 3~4 cards + 2 suspect badges | 카드 drag 또는 tap 2개 선택, link | 최소 2개 관측 단서 | 오연결→관계만 반박, Undo, 힌트, O3/O4 |
| O3 CONTROL TRACE | 센서→제어 판단→명령→액추에이터 | 왼 HW, 중앙 SW, 오른쪽 동작 3 column | 1~2 블록 퍼즐 snap, 자동차 highlight | 부품/기억 열람 시 | 오류: 방향/역할 피드백, skip 시 개념 요약 |
| O4 MENTAL SIM | 어떤 실험이 가설을 구분하는가 | 3개의 실험 카드, 3D miniature 차량, 예상/관측 차이 | 실험 카드→예상 패턴→실행→결론 | 가설 하나 이상과 2개 관측 | 틀림→반증/새 단서, 모델 오류면 재시도, 회귀 실험 가능 |
| O5 PAUSE/HELP | 복구와 초심자 도움 | Resume/Settings, 1~3단계 힌트 | 키/마우스 | 대부분 상태 | pause 물리·압박 동결, focus loss 자동 pause |

## 16:9 공간 배치 잠정안
**Race S2/S4:** full-bleed 3D. 77% 이상 시야는 주행 시야. 상단 좌측 mission tag ~160×48, 상단 우측 압박 bar ~260×48, 좌하단 아날로그 speed/입력 ~250×120, 우하단 mini navigation ~210×90. 이상 징후는 HUD 한 지점만 2초 pulse. 플레이어 얼굴/부자/경찰 portrait는 비상상태와 말풍선 때만 나타남.

**Engineer Mind S3:** 배경은 자동차 내부/해안이 흐르는 3D view. 좁은 상단 압박/추격 상황 10%, 좌측 55%는 관찰 차량/기억/3D, 우측 35%는 evidence/hypothesis/tiny control flow, 하단 2~3개의 큼직한 물리적 인터랙션. 전용 full-screen 데이터 그래프 금지. 상세 데이터는 선택한 1~2 신호 trace만, expert detail은 선택형.

**Garage S1:** 차량 3D 공간 60%, 물리적 정비 보드/부품 30%, 조작 CTA 10%. 기본 학습 텍스트 한 번에 최대 두 문장. 실제 부품 종류 및 이름은 모델/자산 확인 전 예시로 취급.

## 8필드 완료 검사
위 각 행은 purpose/primary action/priority/reveal/state/error-feedback-transition을 요약했다. 실제 Figma에서는 `default, hover, success, wrong, hint, loading, caught, data-error` 중 관련 상태의 프레임을 포함해야 함. 액션별 마이크로카피와 확정 px은 디자인 승인 시 정해야 함.
