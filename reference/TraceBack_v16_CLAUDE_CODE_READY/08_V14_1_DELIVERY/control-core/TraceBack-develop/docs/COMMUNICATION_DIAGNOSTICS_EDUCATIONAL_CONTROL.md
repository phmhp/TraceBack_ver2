# TraceBack 10 — 통신·고장 진단 교육용 제어 계약 (v13)

## 구현 범위
- `src/campaign/communicationDiagnosticsModel.ts`: 범위, 타임아웃, 메시지 유효성, 이중 센서 상관성, 명령·피드백 비교, 확인 지연(debounce), 고장 래치, 정상 안정 시간, 재설정 승인, 기능별 보호 요청.
- `stepVehicleSystemsWithDiagnostics`: **선택적으로** 신호 관측값을 검사하고 기존 차량 진단 배열에 결과를 추가한다. 기본 `stepVehicleSystems`와 기존 도메인 함수는 변경되지 않는다.
- 게임 플레이용 메모판/로직 편집기/쌍둥이 시험대는 **미연결**. 10번 기능을 별도 게임 페이지로 만들지 않는다.

## 데이터 책임 및 호출 순서
1. 센서/통신/액추에이터 모델에서 독립적인 **관측값**(`value`, `ageMs`, `messageValid`) 수집. 진단기가 측정값을 임의 생성하지 않는다.
2. `stepCommunicationDiagnostics(previous, input, rules, dt)` 호출. 동일한 previous·input·dt에는 동일한 결과.
3. `result.signals[id]`는 그 주기에 신뢰할 수 있는 값만 `value`로 반환. 미수신·오류 값은 null. **진단 고장 확정 이전에도 신호 유효성은 즉시 무효가 될 수 있다.**
4. `events`, `diagnosticIds`, `request`는 보호 관련 **요청**이며, 안전 상태를 구체적으로 정하는 책임은 원래 ECU에 있다. 공통 엔진은 모터·브레이크·접촉기 명령을 임의로 변경하지 않는다.
5. `result.state`를 다음 호출의 previous로 전달.

## 신호 계약
| 이름 | 단위 | 의미 |
|---|---|---|
| `id` | 문자열 | 채널의 고유 식별자 |
| `source` | enum | SENSOR / CAN / ACTUATOR |
| `units` | 문자열 | 물리 단위 (`%`, `Nm`, `°C`, `V` 등) |
| `value` | 채널 단위 | 독립적으로 관측한 현재 값 |
| `ageMs` | ms | 관측 신호의 마지막 갱신 이후 경과 시간 |
| `messageValid` | Boolean | 수신 또는 외부 검사에서 판단한 메시지 유효성 |
| `min`, `max` | 채널 단위 | 허용 범위(끝점 포함) |
| `maxAgeMs` | ms | 허용 갱신 지연(끝점 포함) |
| `debounceSec` | s | 오류가 지속되면 고장 확정 |
| `recoverySec` | s | 정상 입력 안정화 요구 시간 |
| `plausibility` | 채널 단위 | 관련 채널과 차이 한계 |
| `tracking` | 채널 단위, s | 명령·피드백 한계 및 일시적 응답 대기 |
| `latch` | Boolean | 안정화 후에도 명시적 reset + permit 필요 여부 |
| `dt` | s | 매 주기 0초 초과~0.1초 이하; 기본 0.02초 |

모든 보정값은 규칙 호출자가 설정하며, 공통 엔진은 OEM 공통 수치·DTC 보정값을 하드코딩하지 않는다.

## 핵심 판단 흐름
```
관측 신호 / CAN 메시지 / 액추에이터 실제 응답
  → 메시지 유효성 및 갱신 시간
  → 물리 범위
  → 관련 센서 상관성
  → 출력 명령과 관측 응답 비교 (settling time 반영)
  → 고장 의심 누적 (debounce)
  → 확정 이벤트 및 발생 횟수
  → WARNING / LIMIT / BLOCK 보호 요청
  → 정상 신호 안정화, 필요 시 reset 승인
  → 고장 해제 / 다음 주기 기록
```

### 명령과 피드백 구별
`motorCommand`는 ECU가 **지시한 토크**, `motorFeedback`은 독립 Plant가 돌려준 **측정 토크**. 차이가 있어도 초기 settling 시간 동안은 추종 고장을 곧바로 확인하지 않는다. 설정한 지속 시간 이후의 초과 오차만 확정 대상.

### Debounce와 긴급 보호의 차이
이 교육 모델은 확정 고장에 대해 보호 요청을 보낸다. **신호가 무효인 즉시 각 ECU가 취할 조치**는 별도 도메인 정책이며 확정 지연과 혼동하면 안 된다. 특히 브레이크·HV 같은 고위험 기능의 즉각적 보호를 공통 debounce에 종속시키면 안 된다.

### 정상 복귀
래치 없는 고장은 신호가 `recoverySec` 동안 안정적이면 해제. 래치 고장은 안정화 + `resetRequested` + `resetPermitted` 모두 만족해야 해제. `resetPermitted`는 원래 ECU/시스템이 정차·기어·고장유형 등을 기준으로 판단해야 한다. 이 진단기는 주행 중 OTA 승인을 자동으로 하지 않는다.

## 게임 노출 블록
- 신호가 허용 범위인가?
- 신호가 제때 갱신되었는가?
- 두 센서값이 일치하는가?
- 명령과 실제 응답이 일치하는가?
- 이상이 일정 시간 지속되었는가?
- 확정된 고장에 맞춰 기능을 제한한다
- 정상 복귀 조건을 다시 확인한다

게임 추리 화면: 증상/신호 시간과 값 추적. 로직 작업대: 사건별 3~5개 핵심 문장 블록만 노출. 쌍둥이 시험대: **동일 입력 시퀀스**에서 기준 및 플레이어 그래프 평가. 현재는 공통 진단 기능만 존재하며 이 게임 연결은 구현되지 않았다.

## 변경 파일
- 신규 `src/campaign/communicationDiagnosticsModel.ts`
- 추가 `src/campaign/vehicleSystems.ts` (옵션 어댑터 하나)
- 신규 `tests/communication-diagnostics-educational.test.mjs`
- 신규 `docs/COMMUNICATION_DIAGNOSTICS_EDUCATIONAL_CONTROL.md`

## 모델 단순화 및 한계
- CAN 프레임, 버스 부하, arbitration, 실제 네트워크 계층 및 메시지 카운터/E2E 보호는 모델링하지 않음.
- `messageValid`는 외부 입력이며 CRC·alive counter 검증기 자체는 미구현.
- 여러 오류가 동시에 발생하면 한 채널에 단일 대표 오류만 유지함; fault code 우선순위 모델 없음.
- ISO 14229 DTC 상태 비트·UDS 서비스·비휘발 이력은 구현하지 않음. `diagnosticIds`는 **게임용 식별자**이지 표준 DTC 번호가 아님.
- 이중 센서 상관성은 절대 차이이며 실제 상관 비율/전달함수 보정은 규칙 설정에서 확장해야 함.
- 응답 진단은 단순 settlingSec + 오차 비교. 고급 시간 추종 모델·필터 미구현.
- 공통 엔진은 보호 *요청*만 발생시키며 ECU별 복구·안전 상태 결정 및 전체 캠페인 연결은 미구현.
