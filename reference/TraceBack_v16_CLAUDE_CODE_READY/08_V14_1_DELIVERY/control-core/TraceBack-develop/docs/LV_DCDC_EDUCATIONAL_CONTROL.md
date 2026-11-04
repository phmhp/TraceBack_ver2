# TraceBack — LV / DC-DC 교육용 제어 계약 (v12)

## 적용 범위
단일 BEV의 12 V 저전압 전원과 DC/DC Enable 및 부하 차단 요청을 단순화한 교육용 기능이다. 특정 OEM 보정, 양산 ECU, 안전 인증, 실제 장비 정비 절차가 아니다. 기존 `stepVehicleSystems()`의 `dcDc.active/voltageV`를 변경하지 않고 **선택형** `stepVehicleSystemsWithLv()`를 제공한다. 이번 버전에서 UI 또는 게임 캠페인 로직은 바꾸지 않았다.

## 기존 코드 감사
- 기존 `src/campaign/vehicleSystems.ts`는 `dcDcActive=packAvailable||chargeActive`에 따라 정해진 전압을 즉시 출력했으며 LV 부하와 12 V 배터리 상태·명령과 실제 응답을 구분하지 않았다.
- `src/campaign/vehicleArchitecture.ts`는 OBC/DC-DC/12 V 계층을 설명하지만 실제 부하 우선순위 모델을 실행하지는 않는다.
- 기존 `tests/vehicle-systems.test.mjs`에는 DC/DC 전압의 단순 상태 기반 테스트가 존재한다.
- 기존 BMS·HV·VCU·Gear·Propulsion·Braking·EPS·Thermal은 독립적인 선택형 통합 실행 경로를 갖는다. 전체 통합 실행 루프는 아직 없으며 이번 작업에서도 만들지 않았다.

## 제어 흐름
```text
측정: HV Ready, 12 V 버스 전압, LV SOC, 부하 요구, DC/DC 진단·출력 피드백
 → 센서 범위·신호 신선도 검증
 → DC/DC 사용 가능 판단 (HV Ready AND DC/DC Healthy)
 → 목표 전압 13.8 V 및 공급 가능 용량 결정
 → 중요 부하 우선 / 비중요 부하 차단(Load Shed)
 → ECU DC/DC Enable 및 공급량 요청
 → 독립 플랜트에서 DC/DC 응답·버스 전압·배터리 SOC 계산
 → 관측 전압, 응답/피드백 불일치, 저전압 지속 진단
 → 명시적 리셋과 안정 조건에 따른 진단 복귀
```

## 신호 계약
| 신호 | 방향 | 단위 | 의미 |
| --- | --- | --- | --- |
| `hvReady` | 입력 | Boolean | HV 시스템 준비 관측. LV 스스로 HV READY 판정하지 않음 |
| `lvVoltageV` | 측정 | V | **실제 저전압 버스** 전압 |
| `lvBatterySocPct` | 측정 | % | 12 V 보조 배터리 SOC 추정값 |
| `lvLoadRequestW` | 입력 | W | 전체 LV 부하 요구 |
| `criticalLoadRequestW` | 입력 | W | 필수 부하 요구; 전체 부하 이하 |
| `dcdcHealthy` | 진단 입력 | Boolean | DC/DC 고장 상태 정보 |
| `dcdcObservedActive` | 피드백 | Boolean | DC/DC 가상 플랜트 실제 동작 관측 |
| `dcdcObservedVoltageV` | 피드백 | V | DC/DC 플랜트 출력 전압(버스 전압과 다름) |
| `signalAgeMs` / `feedbackAgeMs` | 입력 | ms | 측정·피드백 신선도 |
| `vehicleSpeedKmh` | 입력 | km/h | 복귀 시 정차 조건 검사 |
| `resetRequested` | 입력 | Boolean | 진단 해제 요청 |
| `commands.dcdcEnable` | ECU 출력 | Boolean | DC/DC 구동 지시, 실제 기기 상태 아님 |
| `commands.targetVoltageV` | ECU 출력 | V | 교육용 목표 전압 |
| `commands.suppliedLoadRequestW` | ECU 출력 | W | 우선순위 반영한 공급 요구. 실제 전달전력 아님 |
| `commands.loadShedRequest` | ECU 출력 | Boolean | 비중요 부하 차단 요청 |
| `feedback.lvPowerAvailable` | 판정 | Boolean | 유효한 실제 버스 측정이 허용 구간에 있는지 |
| `mode` | 내부 | Enum | `OFF/SUPPLY/LIMITED/FAULT` |
| `diagnostics` | 내부 | Code | 범위·시한·전압·응답 진단 |

전압 명령과 버스 전압, `LoadShedRequest`와 실제 부하 차단 성공은 별개이다. 이번 플랜트의 부하 응답은 **간이 시뮬레이션**이며 독립적인 차단 확인 센서는 없다.

## 시뮬레이션 설정(교육용 값)
- 20ms 기본 실행 주기, 유효 범위 `(0, 100ms]`
- 목표 DC/DC 전압 13.8 V
- 저전압 한계 11.4 V, 중대 저전압 10.2 V, 복귀 전압 12.0 V
- LV SOC 저하 경계 25%, 심각한 SOC 감소 기준 8%
- DC/DC 자체 공급 용량 1,250 W; 배터리 보조 허용 200 W, SOC가 낮으면 80 W
- 신호 최대 나이 100 ms
- 저전압 확인 0.4 s, DC/DC 미응답 및 출력 편차 확인 0.5 s
- 복구는 정차 ≤0.5 km/h, 명시적 Reset, 정상 측정 지속 0.5 s

이 값들은 **규범값도 OEM 보정값도 아니다.** DC/DC 사용불가 상태에서도 LV 배터리만으로 일부 전장 기능이 살아 있을 수 있도록 한다. 필수 부하가 공급용량을 넘으면 부족분은 남으며 전력을 만들어내지 않는다.

## 교육용 상태 / 진단
- `OFF`: HV/DC-DC 공급 불가; 12 V 배터리 측정이 정상이라면 LV 버스는 살아 있을 수 있다.
- `SUPPLY`: DC/DC 공급 가능하고 부하 요구가 용량 내.
- `LIMITED`: 부하 초과 또는 저 SOC / 저전압으로 부하 축소 요청.
- `FAULT`: 유효하지 않은 신호, 지속 저전압, DC/DC 미응답/출력 이상, 또는 치명적 저전압. 고장 코드 래치.

정상 복귀는 `OFF`로 전환했다고 자동 완성되는 것이 아니다. 별도의 안전한 리셋 조건을 요구한다. 실제 저전압 손실 상황에서는 독립 ECU가 재시작할 수 있으나, 그 로직은 이번 범위 외다.

## 문장형 블록으로 보여줄 범위
1. `HV가 준비되었고 DC/DC가 정상인가?`
2. `저전압 버스 전압이 허용 범위인가?`
3. `부하 요구가 공급 가능한 전력을 넘는가?`
4. `초과하면 중요 부하를 우선한다`
5. `DC/DC 명령과 실제 출력이 일치하는가?`
6. `저전압이 지속되면 고장으로 확정한다`

전압 응답 지연, 타임아웃 누적, 저전압 배터리 SOC 변화는 내부 계산으로 유지한다. 전체 3D 게임 / 실제 퍼즐 연결 작업은 하지 않았다.

## 단순화된 점
- 상세 DC/DC PWM/전류 제어, 실제 12 V 배터리 OCV/SOC 추정, DC/DC 효율 맵, 충전 전류·온도 제한, 실제 부하의 등급별 회로 차단, CAN 및 ECU Brownout/재부팅은 생략.
- 고장 상태의 공급 유지/차단은 교육용 예시. LV 모델의 고장이 차량 모터와 제동까지 즉시 차단한다는 식으로 자동 연결하지 않는다.
- `stepLvPlant`는 1차 응답, 과부하에 따른 버스 전압 감소, 간이 SOC 소비만 모델링한다. 실제 저전압 전기회로 검증이 아니다.
- 실제 셀 SOC, LV 전압 측정, 부하 요구값과 장치 피드백은 호출자가 공급해야 하며, 기존 `SystemInput`의 팩 SOC를 LV 배터리 SOC로 대체하지 않는다.

## 테스트 및 실행
`node --experimental-strip-types --test tests/lv-power-educational.test.mjs`

전체 회귀: `node --experimental-strip-types --test tests/*.test.mjs`

현재 환경의 Node v22.16.0은 TS 직접 읽기에 플래그가 필요했고, 외부 Rapier 패키지는 설치되지 않은 상태다.
