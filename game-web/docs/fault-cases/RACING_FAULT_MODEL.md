# 레이싱 고장 스케줄 모델 (구현 기준)

코드: `src/game/faultSchedule.ts` (순수 함수, React·three 없음) · 테스트: `tests/fault-schedule.test.mjs`
상위 규칙: `RULES.md` R6(시점·트리거), R17(레이싱 영향·추격 연동), `../FAULT_CASE_SELECTION_V3.md` 4절(분류).

## 1. 고장은 "세 가지"가 아니다
모델은 아래 14개 시점(phase)을 모두 평가합니다. 처음 레이싱에 연출까지 붙인 것이 시동 전(prestart)·정차(stationary)·페달 뗌(release) 세 가지일 뿐이며, 나머지도 `triggerHolds`와 테스트는 이미 있습니다(화면 연출만 사건별로 추가).

| phase | 현실 예 | 조건 필드 |
|---|---|---|
| prestart | READY 불가, 시동 후 점검 정지 | `ready=false` |
| stationary | 신호 대기 중 READY 꺼짐, P 해제 불가 | 속도 0, `holdSec` |
| launch | 출발 울컥임·지연 | 속도 25 미만 + 페달 |
| accel | 추월 가속 시 힘 빠짐 | 페달, 속도 25 이상, `pedal:"full"` |
| cruise | 정속 중 간헐 출력 저하 | 페달 중간 |
| release | 페달 뗐는데 가속(부호 오류), 코스팅 회생 이상 | 페달 0, `minSpeedKph` |
| braking | 제동 중 끊김, 회생-마찰 협조 불량 | 브레이크 |
| steering | 저속·고속 조향 무거움·쏠림 | `steerMin` |
| sustained | 연속 고부하 후 과열 출력 제한 | `holdSec` + `decay` |
| environment | 노면·온도·경사·터널 구간 | `zone` 태그 |
| elapsed | 주행 N초/N m 뒤 카운터·타이머 | `afterElapsedS`, `afterDistanceM` |
| event | 충돌·변속·재시동 직후 | `afterEvent`, `withinSec` |
| random | 재현율 낮은 간헐 | `probabilityPerSec` |
| always | 설정·구성 오류, 처음부터 | 없음 |

지속성: `permanent`(조건 동안) / `latched`(한 번 켜지면 R 재시동까지) / `intermittent`(`burst` 켜짐·쉼 반복).
추가 필드: `holdSec`(조건 유지 시간), `delaySec`(발현 지연), `pedal`/`gear`/속도 창.

## 2. 효과(FaultEffect) = 사건이 플레이어에게서 빼앗는 것
`pedalScale`, `speedCapKph`, `coastAccelKphPerS`(페달 없이 가속), `brakeScale`, `steerScale`, `shutdown`(READY 상실, R 재시동), `readyBlockedTries`(시동 전 R 반복), `driveCut`, `reverseOnly`, `cluster`(계기판 정전·경고등). 여러 고장은 `mergeEffects`로 합칩니다(제한은 가장 강한 쪽, 가속은 합산).

## 3. 추격 연동 (R17)
`policeSpeedKph(speed)` / `gapRateMps(speed)` / `secondsToCatch(gap, speed)`. 정지·후진일수록 경찰이 빨리 붙고, 후진 속도(음수)는 정지보다 불리합니다. 사건 시트의 "추격차 변화" 표는 이 함수의 결과와 일치해야 합니다.

## 4. 레이싱에 연결된 곳 (`src/experiences.tsx` RaceExperience)
- 루프 안에서 `FaultContext`를 만들어 `stepFault` → `mergeEffects` → 가속·코스팅·제동·조향·상한·READY 반영.
- 개발 스위치 `?faultdemo=release|stationary|prestart` (`DEMO_FAULTS`). 예: `/?embed=1&qa=CHASE_NORMAL&case=propulsion&faultdemo=release`
- 시동 전: R을 `readyBlockedTries`번 눌러야 READY. 정차: 4초 정지 시 래치 정전, R로 해제.
- 기존 사건(구동 추월 구간·열관리 연속 고부하)은 아직 하드코딩 상태(`OVERTAKE_ZONE`/`CLIMB_ZONE`). 새 사건부터 스펙으로 등록하고, 기존 둘은 같은 모양의 스펙으로 옮기는 작업이 남아 있습니다.

## 5. 새 사건을 추가하는 법
1. 사건 시트(`TEMPLATE_CASE_SHEET.md`)에 시점·트리거·지속성·효과·추격 영향을 적고 승인받는다.
2. `FaultSpec`을 만든다(`caseId`, `trigger`, `persistence`, `effect`, `chase.note`).
3. 레이싱의 스펙 등록 지점(현재 `FAULT_DEMO` 자리)에 넣고, `tests/fault-schedule.test.mjs`에 조건·효과 테스트를 추가한다.
4. 정상 동작(충돌 시 HV 차단 등)과 고장을 혼동하지 않도록 R17 표를 채운다.

## 6. 아직 안 된 것
- 후진(`reverseOnly`)의 실제 주행: 현재 레이스는 속도 0 이상만 허용, R 기어는 정지로 처리. 모델·테스트만 있음.
- `environment` 구간 태그(`zones`)는 항상 빈 배열. 맵 구간 정의가 생기면 채움.
- `event` 중 `restart`는 컨텍스트에 연결 안 됨(collision·gearChange만 연결).
- 경고등 `cluster` 표시는 HUD에 아직 안 그림.
