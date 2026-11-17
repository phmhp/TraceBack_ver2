# TraceBack 홍보 에셋 카탈로그

- 조사일: 2026-11-16
- 기준 경로: public/assets
- 파일 단위: 현재 파일시스템에 있는 시각 에셋 기준
- 크기: 파일 크기는 KB 단위로 반올림, 픽셀 크기는 이미지 헤더에서 읽음
- [확인] 실제 파일/코드 참조/기존 캡처에서 확인
- [제안] 홍보 사용 우선순위
- [주의] 파일은 있으나 라이브 화면에서 직접 사용되는지 별도 확인이 필요한 것

## 1. 전체 요약

| 범위 | 수량 | 형식/크기 특징 | 홍보 판단 |
|---|---:|---|---|
| public/assets 전체 파일 | 328 | PNG 309, SVG 15, OTF 1, .DS_Store 3 | 시각 에셋은 324개 |
| 핵심 합성/컷신/배경 | 30여 개 | 1376×768, 1672×941, 1536×1024 혼합 | P0/P1 홍보 소재 |
| board-photos | 11 | 360×360 또는 384×384 | 도미노·증거 카드 P0 |
| ending-thumbs | 20 | 256×256 | 엔딩·원인 카드 P1 |
| intake/images | 229 | 대부분 1254×1254, 설명/회전은 1536×1024 | 대량 부품 자료; 선별 사용 |
| ui | PNG 2 + SVG 15 | 아이콘/보드/검증 소재 | 보조 UI 소재 |
| 폰트 | 1 | Jalnan2.otf 2,695.4 KB | 외부 공개 전 라이선스 확인 |

.DS_Store 3개는 홍보 에셋으로 제외한다.

## 2. 홍보 우선순위

### P0 — 첫 화면/핵심 장면

| 경로 | 크기 | 역할·사용 위치 |
|---|---:|---|
| public/assets/stitch23/menu-garage.png | 1376×768 / 1512.4 KB | 타이틀 배경. 로고·붉은 EV·고양이 2마리·해안도로. src/main.tsx:519 |
| public/assets/stitch23/chase-coast.png | 1376×768 / 1272.9 KB | 해안 추격 대표 컷. 외부 홍보 히어로/스크롤 전환 후보 |
| public/assets/traceback-red-ev-v2.png | 1536×1024 / 1867.6 KB | 차고·추리 화면의 붉은 EV 카드 |
| public/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png | 1276×1233 / 871.8 KB | 타이틀·대화·도미노·퍼즐·검증·수리 안내의 반복 캐릭터 |
| public/assets/stitch23/investigation-lab.png | 1376×768 / 1636.1 KB | 차고·도미노·퍼즐·검증 배경 |
| public/assets/cutscene-ship-jump-v1.png | 1672×941 / 2247.1 KB | 마지막 도약. ShipBoardingSequence |
| public/assets/cutscene-ship-land-v1.png | 1672×941 / 2205.7 KB | 마지막 착지. ShipBoardingSequence |

### P1 — 추리·학습 가치

| 경로 | 크기 | 역할·사용 위치 |
|---|---:|---|
| public/assets/board-photos/*.png | 360×360/384×384 | 입력·처리값·토크·온도·팬·브레이크 등 실제 증거 카드 |
| public/assets/ASSET_090_Input_Sensor_Node.png | 800×600 / 43.1 KB | 입력 노드/퍼즐·차고 E/E |
| public/assets/ASSET_091_ECU_Controller_Node.png | 800×600 / 42.7 KB | ECU 노드/수리 카드 |
| public/assets/ASSET_092_Actuator_Node.png | 800×600 / 43.2 KB | 출력 노드 |
| public/assets/ASSET_100_Empty_Cork_Evidence_Board.png | 1448×1086 / 2478.7 KB | 증거판 참고 이미지 |
| public/assets/lab-comparison-board-v1.png | 1672×941 / 2168.4 KB | 정상/고장 비교 보드 참고 |
| public/assets/ui/verification-spec-sheet.png | 1536×1024 / 2048.1 KB | 시험 설계서/검증 시각 소재 |
| public/assets/traceback-engineering-evidence-atlas-v1.png | 1254×1254 / 2442.9 KB | 증거 아틀라스 |
| public/assets/system-atlas-v7.png | 1672×941 / 2475.9 KB | 차량 시스템 지도 |
| public/assets/vehicle-component-cutouts-v1.png | 1774×887 / 1758.0 KB | 차량 부품 컷아웃 시트 |

### P2 — 아이콘·보조 장식

- public/assets/ui/icons/police-car.svg, getaway-car.svg, flag.svg: 추격 레일
- public/assets/ui/icons/cat-ming.svg, book.svg, probe.svg, check.svg: 학습·검증 UI
- public/assets/ui/burst-police.svg, burst-fault.svg, burst-crash.svg: 경찰·고장·충돌 말풍선
- public/assets/ui/icon-police.svg, icon-skull.svg, icon-crash.svg: 상태 아이콘
- public/assets/cursor-hand-open-v1.png, cursor-hand-grab-v1.png: 보드/퍼즐 도구 커서
- public/assets/detective-pencil-v1.png, detective-eraser-v1.png: 추리 도구

## 3. 파일명 규칙과 사용 위치

### [확인] intake 파일 suffix

| suffix | 의미 | 홍보 사용 |
|---|---|---|
| __CUT | 배경 제거/컷아웃 부품 | 부품 카드·퍼즐·엔딩 원인 카드 |
| __REF | 참고/정면 자료 | PartShowroom·동적 모델 매핑 |
| __EVID-fault | 고장 당시 증거 | 도미노/검증/보고 카드 |
| __EVID-ok | 정상 기준 증거 | 도미노/검증 비교 카드 |
| __EXPL | 분해·설명 이미지 | 학습/AI 제작 과정 보조 |
| __TURN | 회전·동작 참고 | 3D 동작 설명/보조 |

### [확인] 주요 코드 참조

- 타이틀/배경: src/main.tsx, src/features/cutscenes/StaticCutscenes.tsx
- 도미노/증거: src/features/board/EeTrace.tsx, src/features/board/DominoTrace.tsx
- 정상 로직 퍼즐: src/features/wiring/RefPuzzle.tsx
- 검증/엔딩: src/features/verification/VerificationLab.tsx, src/ui/CaseFileEnding.tsx
- 부품 카드·3D: src/experiences.tsx, src/features/parts/partModels.ts, src/features/parts/PartShowroom.tsx
- 공통 추격 HUD: src/ui/game-shell.tsx, src/ui/icons/*.svg

### [주의] 실제 라이브 화면과 과거 캡처의 차이

--help와 deliverables에는 여러 시점의 실행 캡처가 있고, 코드에는 레거시 화면 컴포넌트가 보존되어 있다. 홍보 최종 캡처는 현재 main.tsx 라이브 분기와 일치하는지 확인한다. 특히 BOARD는 현재 EeTraceV2가 라이브이고 DominoTrace는 보존 코드다.

## 4. 전체 파일 목록

아래 표는 현재 public/assets에서 확인한 PNG/SVG/OTF 파일 전체다. intake/images는 파일명 suffix와 폴더 기준으로 사용 위치를 기록했다.

| 실제 경로 | 형식 | 픽셀 크기 | 파일 크기 | 사용 위치/홍보 역할 |
|---|---|---:|---:|---|
| public/assets/ASSET_003_Cat_Face_Identity_REFERENCE.png | PNG | 1276x1233 | 871.8 KB | 타이틀·대화·추리·검증·수리의 고양이 얼굴 |
| public/assets/ASSET_004_Red_EV_Exterior_REFERENCE.png | PNG | 278x270 | 119.1 KB | 차량 외관 참고/차량 관련 카드 |
| public/assets/ASSET_005_EV_Cutaway_REFERENCE.png | PNG | 1536x1024 | 2174.2 KB | EV 컷어웨이/차량 구조 참고 |
| public/assets/ASSET_030_Radiator_Cooling_Fan_TRANSPARENT.png | PNG | 512x512 | 127.8 KB | 열관리 수리 카드·고장 시각 |
| public/assets/ASSET_090_Input_Sensor_Node.png | PNG | 800x600 | 43.1 KB | 차고/E/E·퍼즐 입력 노드 |
| public/assets/ASSET_091_ECU_Controller_Node.png | PNG | 800x600 | 42.7 KB | 차고/E/E·수리 ECU 노드 |
| public/assets/ASSET_092_Actuator_Node.png | PNG | 800x600 | 43.2 KB | 차고/E/E 출력 액추에이터 노드 |
| public/assets/ASSET_100_Empty_Cork_Evidence_Board.png | PNG | 1448x1086 | 2478.7 KB | 도미노/증거판 시각 소재 |
| public/assets/ASSET_120_Prologue_Pitlane_Backdrop.png | PNG | 286x270 | 122.3 KB | 프롤로그 피트레인 소재 |
| public/assets/ASSET_123_Police_Chase_Scene.png | PNG | 281x270 | 121 KB | 경찰 추격 소재 |
| public/assets/ASSET_125_Pirate_Ship_Backdrop.png | PNG | 286x301 | 149.2 KB | 해적선 소재 |
| public/assets/board-photos/brake_actual.png | PNG | 360x360 | 213.2 KB | BOARD 관찰·계측 증거 폴라로이드; EeTrace/DominoTrace |
| public/assets/board-photos/brake_request.png | PNG | 360x360 | 201.5 KB | BOARD 관찰·계측 증거 폴라로이드; EeTrace/DominoTrace |
| public/assets/board-photos/fan_actual.png | PNG | 384x384 | 252.7 KB | BOARD 관찰·계측 증거 폴라로이드; EeTrace/DominoTrace |
| public/assets/board-photos/motor_actual.png | PNG | 360x360 | 220.7 KB | BOARD 관찰·계측 증거 폴라로이드; EeTrace/DominoTrace |
| public/assets/board-photos/motor_temp.png | PNG | 360x360 | 211.8 KB | BOARD 관찰·계측 증거 폴라로이드; EeTrace/DominoTrace |
| public/assets/board-photos/pedal_processed.png | PNG | 360x360 | 225.6 KB | BOARD 관찰·계측 증거 폴라로이드; EeTrace/DominoTrace |
| public/assets/board-photos/pedal_raw.png | PNG | 360x360 | 215.8 KB | BOARD 관찰·계측 증거 폴라로이드; EeTrace/DominoTrace |
| public/assets/board-photos/pump_flow.png | PNG | 384x384 | 234.3 KB | BOARD 관찰·계측 증거 폴라로이드; EeTrace/DominoTrace |
| public/assets/board-photos/regen_request.png | PNG | 360x360 | 222.5 KB | BOARD 관찰·계측 증거 폴라로이드; EeTrace/DominoTrace |
| public/assets/board-photos/thermal_protection.png | PNG | 360x360 | 167.5 KB | BOARD 관찰·계측 증거 폴라로이드; EeTrace/DominoTrace |
| public/assets/board-photos/torque_cmd.png | PNG | 360x360 | 222.5 KB | BOARD 관찰·계측 증거 폴라로이드; EeTrace/DominoTrace |
| public/assets/cursor-hand-grab-v1.png | PNG | 64x64 | 2.9 KB | 드래그 도구 커서; 보드/퍼즐 |
| public/assets/cursor-hand-open-v1.png | PNG | 64x64 | 3.2 KB | 드래그 도구 커서; 보드/퍼즐 |
| public/assets/cutscene-character-master-v1.png | PNG | 1536x1024 | 2041.7 KB | 컷신 캐릭터 원본/고양이 캐릭터 |
| public/assets/cutscene-heist-board-v1.png | PNG | 1672x941 | 2471.1 KB | 범행/도주 컷신 |
| public/assets/cutscene-heist-escape-v1.png | PNG | 1672x941 | 2404.2 KB | 저택 탈출 컷신 |
| public/assets/cutscene-repair-v1.png | PNG | 1672x941 | 2253.9 KB | 수리 적용 컷신 |
| public/assets/cutscene-ship-jump-v1.png | PNG | 1672x941 | 2247.1 KB | 해적선 도약 컷신 |
| public/assets/cutscene-ship-land-v1.png | PNG | 1672x941 | 2205.7 KB | 해적선 착지 컷신 |
| public/assets/detective-eraser-v1.png | PNG | 1536x1024 | 1603 KB | 도미노 보드 도구 |
| public/assets/detective-pencil-v1.png | PNG | 1536x1024 | 1371.6 KB | 도미노 보드 도구 |
| public/assets/diagnostic-evidence-sheet-v1.png | PNG | 1774x887 | 2233.6 KB | 진단 증거 시트 |
| public/assets/ending-thumbs/accel_pedal.png | PNG | 256x256 | 42.1 KB | 엔딩 사건 보고·원인/수리 카드; CaseFileEnding/검증 |
| public/assets/ending-thumbs/bms.png | PNG | 256x256 | 55.6 KB | 엔딩 사건 보고·원인/수리 카드; CaseFileEnding/검증 |
| public/assets/ending-thumbs/brake_caliper.png | PNG | 256x256 | 89.7 KB | 엔딩 사건 보고·원인/수리 카드; CaseFileEnding/검증 |
| public/assets/ending-thumbs/brake_ecu.png | PNG | 256x256 | 82.1 KB | 엔딩 사건 보고·원인/수리 카드; CaseFileEnding/검증 |
| public/assets/ending-thumbs/brake_pedal.png | PNG | 256x256 | 49.1 KB | 엔딩 사건 보고·원인/수리 카드; CaseFileEnding/검증 |
| public/assets/ending-thumbs/can_harness.png | PNG | 256x256 | 50.3 KB | 엔딩 사건 보고·원인/수리 카드; CaseFileEnding/검증 |
| public/assets/ending-thumbs/charging_port.png | PNG | 256x256 | 74.7 KB | 엔딩 사건 보고·원인/수리 카드; CaseFileEnding/검증 |
| public/assets/ending-thumbs/coolant_reservoir.png | PNG | 256x256 | 67.2 KB | 엔딩 사건 보고·원인/수리 카드; CaseFileEnding/검증 |
| public/assets/ending-thumbs/coolant_valve.png | PNG | 256x256 | 64 KB | 엔딩 사건 보고·원인/수리 카드; CaseFileEnding/검증 |
| public/assets/ending-thumbs/cooling_fan.png | PNG | 256x256 | 85.6 KB | 엔딩 사건 보고·원인/수리 카드; CaseFileEnding/검증 |
| public/assets/ending-thumbs/cooling_pump.png | PNG | 256x256 | 82.2 KB | 엔딩 사건 보고·원인/수리 카드; CaseFileEnding/검증 |
| public/assets/ending-thumbs/diagnostic_port.png | PNG | 256x256 | 52.5 KB | 엔딩 사건 보고·원인/수리 카드; CaseFileEnding/검증 |
| public/assets/ending-thumbs/eps_ecu.png | PNG | 256x256 | 65.4 KB | 엔딩 사건 보고·원인/수리 카드; CaseFileEnding/검증 |
| public/assets/ending-thumbs/mcu.png | PNG | 256x256 | 98.6 KB | 엔딩 사건 보고·원인/수리 카드; CaseFileEnding/검증 |
| public/assets/ending-thumbs/motor_temp_sensor.png | PNG | 256x256 | 21.3 KB | 엔딩 사건 보고·원인/수리 카드; CaseFileEnding/검증 |
| public/assets/ending-thumbs/obc.png | PNG | 256x256 | 71.6 KB | 엔딩 사건 보고·원인/수리 카드; CaseFileEnding/검증 |
| public/assets/ending-thumbs/radiator.png | PNG | 256x256 | 82.1 KB | 엔딩 사건 보고·원인/수리 카드; CaseFileEnding/검증 |
| public/assets/ending-thumbs/thermal_ecu.png | PNG | 256x256 | 65.3 KB | 엔딩 사건 보고·원인/수리 카드; CaseFileEnding/검증 |
| public/assets/ending-thumbs/traction_motor.png | PNG | 256x256 | 83.5 KB | 엔딩 사건 보고·원인/수리 카드; CaseFileEnding/검증 |
| public/assets/ending-thumbs/vcu.png | PNG | 256x256 | 64.3 KB | 엔딩 사건 보고·원인/수리 카드; CaseFileEnding/검증 |
| public/assets/heist-cutscene-sheet-v1.png | PNG | 1774x887 | 2325.2 KB | 범행 컷신 시트 |
| public/assets/intake/images/adas/adas_camera__CUT.png | PNG | 1254x1254 | 1763.8 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/adas/adas_ecu__CUT.png | PNG | 1254x1254 | 1363.4 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/adas/adas_ecu__REF.png | PNG | 1254x1254 | 1667.4 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/adas/adas_radar__CUT.png | PNG | 1254x1254 | 1705.7 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/brake/brake_booster__CUT.png | PNG | 1254x1254 | 1545.1 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/brake/brake_booster__REF.png | PNG | 1254x1254 | 1743 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/brake/brake_caliper__CUT.png | PNG | 1254x1254 | 2360.2 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/brake/brake_caliper__EVID-fault.png | PNG | 1254x1254 | 2549.8 KB | 고장 증거 카드; intake 보관본 |
| public/assets/intake/images/brake/brake_caliper__EVID-ok.png | PNG | 1254x1254 | 2487.3 KB | 정상 증거 카드; intake 보관본 |
| public/assets/intake/images/brake/brake_caliper__EXPL.png | PNG | 1536x1024 | 2248.8 KB | 분해/설명용; intake 보관본 |
| public/assets/intake/images/brake/brake_caliper__REF.png | PNG | 1254x1254 | 2243.6 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/brake/brake_disc__CUT.png | PNG | 1254x1254 | 1635.5 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/brake/brake_disc__REF.png | PNG | 1254x1254 | 1849.7 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/brake/brake_line__CUT.png | PNG | 1254x1254 | 629.1 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/brake/brake_line__EVID-fault.png | PNG | 1254x1254 | 2391.9 KB | 고장 증거 카드; intake 보관본 |
| public/assets/intake/images/brake/brake_line__EVID-ok.png | PNG | 1254x1254 | 2358.6 KB | 정상 증거 카드; intake 보관본 |
| public/assets/intake/images/brake/brake_pad__CUT.png | PNG | 1254x1254 | 1597.9 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/brake/brake_pad__EVID-fault.png | PNG | 1254x1254 | 2468.4 KB | 고장 증거 카드; intake 보관본 |
| public/assets/intake/images/brake/brake_pad__EVID-ok.png | PNG | 1254x1254 | 2668.9 KB | 정상 증거 카드; intake 보관본 |
| public/assets/intake/images/brake/hydraulic_modulator__EVID-fault.png | PNG | 1254x1254 | 2112.2 KB | 고장 증거 카드; intake 보관본 |
| public/assets/intake/images/brake/hydraulic_modulator__EVID-ok.png | PNG | 1254x1254 | 2220.8 KB | 정상 증거 카드; intake 보관본 |
| public/assets/intake/images/brake/hydraulic_modulator__REF.png | PNG | 1254x1254 | 1770.6 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/brake/master_cylinder__CUT.png | PNG | 1254x1254 | 1332.3 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/brake/master_cylinder__EXPL.png | PNG | 1536x1024 | 1796.5 KB | 분해/설명용; intake 보관본 |
| public/assets/intake/images/brake/master_cylinder__REF.png | PNG | 1254x1254 | 1534.3 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/charging/ac_charge_cable__CUT.png | PNG | 1254x1254 | 1460.7 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/charging/charge_lock_actuator__CUT.png | PNG | 1254x1254 | 1096.8 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/charging/charge_lock_actuator__REF.png | PNG | 1254x1254 | 1556.3 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/charging/charging_port__CUT.png | PNG | 1254x1254 | 1608.5 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/charging/charging_port__EVID-fault.png | PNG | 1254x1254 | 2492.4 KB | 고장 증거 카드; intake 보관본 |
| public/assets/intake/images/charging/charging_port__EVID-ok.png | PNG | 1254x1254 | 2360 KB | 정상 증거 카드; intake 보관본 |
| public/assets/intake/images/charging/charging_port__REF.png | PNG | 1254x1254 | 1751.5 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/charging/dc_charge_connector__CUT.png | PNG | 1254x1254 | 1189.6 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/charging/dc_charge_connector__REF.png | PNG | 1254x1254 | 1467.4 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/charging/evcc__CUT.png | PNG | 1254x1254 | 1400.2 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/charging/evcc__REF.png | PNG | 1254x1254 | 1675.2 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/charging/obc__CUT.png | PNG | 1254x1254 | 1531.9 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/charging/obc__REF.png | PNG | 1254x1254 | 1727.9 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/drivetrain/differential__EXPL.png | PNG | 1536x1024 | 1659.1 KB | 분해/설명용; intake 보관본 |
| public/assets/intake/images/drivetrain/differential__REF.png | PNG | 1254x1254 | 1949.4 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/drivetrain/drive_shaft__CUT.png | PNG | 1254x1254 | 530.1 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/drivetrain/drive_shaft__REF.png | PNG | 1254x1254 | 1231.1 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/drivetrain/inverter__EVID-fault.png | PNG | 1254x1254 | 2423.9 KB | 고장 증거 카드; intake 보관본 |
| public/assets/intake/images/drivetrain/inverter__EVID-ok.png | PNG | 1254x1254 | 2352.4 KB | 정상 증거 카드; intake 보관본 |
| public/assets/intake/images/drivetrain/inverter__EXPL.png | PNG | 1536x1024 | 2007.4 KB | 분해/설명용; intake 보관본 |
| public/assets/intake/images/drivetrain/inverter__REF.png | PNG | 1254x1254 | 1525.8 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/drivetrain/motor_rotor__EXPL.png | PNG | 1536x1024 | 1576.2 KB | 분해/설명용; intake 보관본 |
| public/assets/intake/images/drivetrain/motor_rotor__REF.png | PNG | 1254x1254 | 1892.7 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/drivetrain/motor_stator__EXPL.png | PNG | 1536x1024 | 2151.8 KB | 분해/설명용; intake 보관본 |
| public/assets/intake/images/drivetrain/motor_stator__REF.png | PNG | 1254x1254 | 2348.3 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/drivetrain/reduction_gear__CUT.png | PNG | 1254x1254 | 1640.5 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/drivetrain/reduction_gear__EXPL.png | PNG | 1536x1024 | 1882.1 KB | 분해/설명용; intake 보관본 |
| public/assets/intake/images/drivetrain/reduction_gear__REF.png | PNG | 1254x1254 | 1935.4 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/drivetrain/traction_motor__CUT.png | PNG | 1254x1254 | 1971.8 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/drivetrain/traction_motor__EVID-fault.png | PNG | 1254x1254 | 2467.8 KB | 고장 증거 카드; intake 보관본 |
| public/assets/intake/images/drivetrain/traction_motor__EVID-ok.png | PNG | 1254x1254 | 2435.1 KB | 정상 증거 카드; intake 보관본 |
| public/assets/intake/images/drivetrain/traction_motor__REF.png | PNG | 1254x1254 | 1991.5 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/drivetrain/traction_motor__TURN.png | PNG | 1536x1024 | 1843.3 KB | 회전/동작 참고; intake 보관본 |
| public/assets/intake/images/drivetrain/wheel__CUT.png | PNG | 1254x1254 | 1963.3 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/drivetrain/wheel__REF.png | PNG | 1254x1254 | 1960.6 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/ecu/bms__CUT.png | PNG | 1254x1254 | 1264.1 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/ecu/bms__REF.png | PNG | 1254x1254 | 1562.9 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/ecu/brake_ecu__CUT.png | PNG | 1254x1254 | 1945.9 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/ecu/cell_monitor_board__CUT.png | PNG | 1254x1254 | 1762.2 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/ecu/cell_monitor_board__EVID-fault.png | PNG | 1254x1254 | 2257.5 KB | 고장 증거 카드; intake 보관본 |
| public/assets/intake/images/ecu/cell_monitor_board__EVID-ok.png | PNG | 1254x1254 | 2308.9 KB | 정상 증거 카드; intake 보관본 |
| public/assets/intake/images/ecu/eps_ecu__CUT.png | PNG | 1254x1254 | 1456.5 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/ecu/gateway__CUT.png | PNG | 1254x1254 | 1242.1 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/ecu/mcu__CUT.png | PNG | 1254x1254 | 2077.1 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/ecu/mcu__EXPL.png | PNG | 1536x1024 | 2184.9 KB | 분해/설명용; intake 보관본 |
| public/assets/intake/images/ecu/thermal_ecu__CUT.png | PNG | 1254x1254 | 1578.2 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/ecu/vcu__CUT.png | PNG | 1254x1254 | 1440.6 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/ecu/vcu__EVID-fault.png | PNG | 1254x1254 | 2410 KB | 고장 증거 카드; intake 보관본 |
| public/assets/intake/images/ecu/vcu__EVID-ok.png | PNG | 1254x1254 | 2395.8 KB | 정상 증거 카드; intake 보관본 |
| public/assets/intake/images/ecu/vcu__REF.png | PNG | 1254x1254 | 1819 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/garage-additions/air_compressor__CUT.png | PNG | 1254x1254 | 1568.5 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/garage-additions/air_compressor__REF.png | PNG | 1254x1254 | 1748.8 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/garage-additions/air_spring__CUT.png | PNG | 1254x1254 | 1061.4 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/garage-additions/air_spring__REF.png | PNG | 1254x1254 | 1473.8 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/garage-additions/cdc_damper__CUT.png | PNG | 1254x1254 | 530.2 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/garage-additions/cdc_damper__REF.png | PNG | 1254x1254 | 1253.3 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/garage-additions/chassis_ecu__CUT.png | PNG | 1254x1254 | 1414.6 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/garage-additions/chassis_ecu__REF.png | PNG | 1254x1254 | 1679.9 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/garage-additions/eps_power_pack__CUT.png | PNG | 1254x1254 | 1224.8 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/garage-additions/eps_power_pack__REF.png | PNG | 1254x1254 | 1704 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/garage-additions/isolation_monitor__CUT.png | PNG | 1254x1254 | 1563 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/garage-additions/isolation_monitor__REF.png | PNG | 1254x1254 | 1690.6 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/garage-additions/park_ecu__CUT.png | PNG | 1254x1254 | 1186.9 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/garage-additions/park_ecu__REF.png | PNG | 1254x1254 | 1577.2 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/garage-additions/park_lock_actuator__CUT.png | PNG | 1254x1254 | 1095.2 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/garage-additions/park_lock_actuator__REF.png | PNG | 1254x1254 | 1594.9 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/garage-additions/park_position_sensor__CUT.png | PNG | 1254x1254 | 962 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/garage-additions/park_position_sensor__REF.png | PNG | 1254x1254 | 1396.2 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/garage-additions/ride_height_sensor__CUT.png | PNG | 1254x1254 | 939 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/garage-additions/ride_height_sensor__REF.png | PNG | 1254x1254 | 1445 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/HMI/accel_pedal__CUT.png | PNG | 1254x1254 | 829.8 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/HMI/accel_pedal__EVID-fault.png | PNG | 1254x1254 | 2510.7 KB | 고장 증거 카드; intake 보관본 |
| public/assets/intake/images/HMI/accel_pedal__EVID-ok.png | PNG | 1254x1254 | 2561.5 KB | 정상 증거 카드; intake 보관본 |
| public/assets/intake/images/HMI/accel_pedal__REF.png | PNG | 1254x1254 | 1417.5 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/HMI/accel_pedal__TURN.png | PNG | 1536x1024 | 1359.8 KB | 회전/동작 참고; intake 보관본 |
| public/assets/intake/images/HMI/brake_pedal__CUT.png | PNG | 1254x1254 | 948.1 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/HMI/brake_pedal__EVID-fault.png | PNG | 1254x1254 | 2350.5 KB | 고장 증거 카드; intake 보관본 |
| public/assets/intake/images/HMI/brake_pedal__EVID-ok.png | PNG | 1254x1254 | 2402 KB | 정상 증거 카드; intake 보관본 |
| public/assets/intake/images/HMI/brake_pedal__REF.png | PNG | 1254x1254 | 1314.6 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/HMI/brake_pedal__TURN.png | PNG | 1536x1024 | 1338.6 KB | 회전/동작 참고; intake 보관본 |
| public/assets/intake/images/HMI/epb_switch__CUT.png | PNG | 1254x1254 | 1893.8 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/HMI/gear_selector__CUT.png | PNG | 1254x1254 | 1449.9 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/HMI/gear_selector__REF.png | PNG | 1254x1254 | 1748.6 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/HMI/instrument_cluster__CUT.png | PNG | 1254x1254 | 1094.3 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/HMI/instrument_cluster__EVID-fault.png | PNG | 1254x1254 | 1762.3 KB | 고장 증거 카드; intake 보관본 |
| public/assets/intake/images/HMI/instrument_cluster__EVID-ok.png | PNG | 1254x1254 | 1795.1 KB | 정상 증거 카드; intake 보관본 |
| public/assets/intake/images/HMI/start_button__CUT.png | PNG | 1254x1254 | 2043.1 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/HMI/start_button__EVID-fault.png | PNG | 1254x1254 | 2601.9 KB | 고장 증거 카드; intake 보관본 |
| public/assets/intake/images/HMI/start_button__EVID-ok.png | PNG | 1254x1254 | 2611.4 KB | 정상 증거 카드; intake 보관본 |
| public/assets/intake/images/HMI/start_button__REF.png | PNG | 1254x1254 | 2235.2 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/HMI/steering_column__REF.png | PNG | 1254x1254 | 1615.8 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/HMI/steering_column__TURN.png | PNG | 1536x1024 | 1572.3 KB | 회전/동작 참고; intake 보관본 |
| public/assets/intake/images/HMI/steering_wheel__CUT.png | PNG | 1254x1254 | 1627.3 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/HMI/steering_wheel__REF.png | PNG | 1254x1254 | 1922.7 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/HMI/steering_wheel__TURN.png | PNG | 1536x1024 | 1460.5 KB | 회전/동작 참고; intake 보관본 |
| public/assets/intake/images/network-diagnostics/can_harness__CUT.png | PNG | 1254x1254 | 863.4 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/network-diagnostics/can_harness__EVID-fault.png | PNG | 1254x1254 | 2341.7 KB | 고장 증거 카드; intake 보관본 |
| public/assets/intake/images/network-diagnostics/can_harness__EVID-ok.png | PNG | 1254x1254 | 2196.2 KB | 정상 증거 카드; intake 보관본 |
| public/assets/intake/images/network-diagnostics/diagnostic_port__CUT.png | PNG | 1254x1254 | 1182.9 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/network-diagnostics/diagnostic_port__EVID-fault.png | PNG | 1254x1254 | 2264.1 KB | 고장 증거 카드; intake 보관본 |
| public/assets/intake/images/network-diagnostics/diagnostic_port__EVID-ok.png | PNG | 1254x1254 | 1968.3 KB | 정상 증거 카드; intake 보관본 |
| public/assets/intake/images/network-diagnostics/diagnostic_tool__EVID-fault.png | PNG | 1254x1254 | 2180.2 KB | 고장 증거 카드; intake 보관본 |
| public/assets/intake/images/network-diagnostics/diagnostic_tool__EVID-ok.png | PNG | 1254x1254 | 2128.8 KB | 정상 증거 카드; intake 보관본 |
| public/assets/intake/images/network-diagnostics/tcu__CUT.png | PNG | 1312x1199 | 1220.8 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/power-battery/battery_cell__CUT.png | PNG | 1254x1254 | 1377.4 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/power-battery/battery_cell__REF.png | PNG | 1254x1254 | 1553.6 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/power-battery/battery_cooling_plate__EXPL.png | PNG | 1536x1024 | 1934.9 KB | 분해/설명용; intake 보관본 |
| public/assets/intake/images/power-battery/battery_cooling_plate__REF.png | PNG | 1254x1254 | 1624 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/power-battery/battery_module__CUT.png | PNG | 1254x1254 | 1635.7 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/power-battery/battery_module__EXPL.png | PNG | 1536x1024 | 1904.2 KB | 분해/설명용; intake 보관본 |
| public/assets/intake/images/power-battery/battery_module__REF.png | PNG | 1254x1254 | 1648.9 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/power-battery/dcdc_converter__CUT.png | PNG | 1254x1254 | 1682.2 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/power-battery/dcdc_converter__REF.png | PNG | 1254x1254 | 1666.5 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/power-battery/hv_battery__CUT.png | PNG | 1254x1254 | 1512.6 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/power-battery/hv_battery__EXPL.png | PNG | 1536x1024 | 2221 KB | 분해/설명용; intake 보관본 |
| public/assets/intake/images/power-battery/hv_battery__REF.png | PNG | 1254x1254 | 1703.7 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/power-battery/hv_cable__CUT.png | PNG | 1254x1254 | 1133.7 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/power-battery/hv_cable__EVID-fault.png | PNG | 1254x1254 | 2489.5 KB | 고장 증거 카드; intake 보관본 |
| public/assets/intake/images/power-battery/hv_cable__EVID-ok.png | PNG | 1254x1254 | 2476.7 KB | 정상 증거 카드; intake 보관본 |
| public/assets/intake/images/power-battery/hv_cable__REF.png | PNG | 1254x1254 | 1491 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/power-battery/hv_junction_box__CUT.png | PNG | 1254x1254 | 1837.5 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/power-battery/hv_junction_box__REF.png | PNG | 1254x1254 | 1811.3 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/power-battery/lv_battery__CUT.png | PNG | 1254x1254 | 1667.2 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/power-battery/lv_battery__REF.png | PNG | 1254x1254 | 1575.1 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/power-battery/lv_harness__CUT.png | PNG | 1254x1254 | 1181.9 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/power-battery/lv_harness__EVID-fault.png | PNG | 1254x1254 | 2555.9 KB | 고장 증거 카드; intake 보관본 |
| public/assets/intake/images/power-battery/lv_harness__EVID-ok.png | PNG | 1254x1254 | 2488.5 KB | 정상 증거 카드; intake 보관본 |
| public/assets/intake/images/power-battery/main_contactor__CUT.png | PNG | 1254x1254 | 1603.8 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/power-battery/main_contactor__EVID-fault.png | PNG | 1254x1254 | 2289.4 KB | 고장 증거 카드; intake 보관본 |
| public/assets/intake/images/power-battery/main_contactor__EVID-ok.png | PNG | 1254x1254 | 2352.3 KB | 정상 증거 카드; intake 보관본 |
| public/assets/intake/images/power-battery/main_contactor__REF.png | PNG | 1254x1254 | 1769 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/power-battery/precharge_circuit__CUT.png | PNG | 1254x1254 | 1634.6 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/power-battery/precharge_circuit__REF.png | PNG | 1254x1254 | 1675.5 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/power-battery/service_disconnect__CUT.png | PNG | 1254x1254 | 1435.2 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/power-battery/service_disconnect__REF.png | PNG | 1254x1254 | 1560.4 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/sensors/brake_pressure_sensor__CUT.png | PNG | 1254x1254 | 1156.6 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/sensors/brake_pressure_sensor__REF.png | PNG | 1254x1254 | 1547.7 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/sensors/coolant_temp_sensor__CUT.png | PNG | 1254x1254 | 1125.5 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/sensors/coolant_temp_sensor__REF.png | PNG | 1254x1254 | 1614.2 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/sensors/imu_sensor__CUT.png | PNG | 1254x1254 | 1410 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/sensors/motor_temp_sensor__CUT.png | PNG | 1254x1254 | 347.8 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/sensors/motor_temp_sensor__EVID-fault.png | PNG | 1254x1254 | 2109.2 KB | 고장 증거 카드; intake 보관본 |
| public/assets/intake/images/sensors/motor_temp_sensor__EVID-ok.png | PNG | 1254x1254 | 2105.4 KB | 정상 증거 카드; intake 보관본 |
| public/assets/intake/images/sensors/motor_temp_sensor__REF.png | PNG | 1254x1254 | 1119.8 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/sensors/pack_current_sensor__CUT.png | PNG | 1254x1254 | 1664.5 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/sensors/pack_current_sensor__REF.png | PNG | 1254x1254 | 1702.4 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/sensors/rotor_position_sensor__CUT.png | PNG | 1254x1254 | 1695.4 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/sensors/rotor_position_sensor__EXPL.png | PNG | 1536x1024 | 1831.8 KB | 분해/설명용; intake 보관본 |
| public/assets/intake/images/sensors/rotor_position_sensor__REF.png | PNG | 1254x1254 | 1812.7 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/sensors/steering_angle_sensor__CUT.png | PNG | 1254x1254 | 1377 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/sensors/steering_angle_sensor__REF.png | PNG | 1254x1254 | 1704.8 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/sensors/steering_torque_sensor__REF.png | PNG | 1254x1254 | 1613.9 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/sensors/teering_torque_sensor__EXPL.png | PNG | 1536x1024 | 1956.6 KB | 분해/설명용; intake 보관본 |
| public/assets/intake/images/sensors/wheel_speed_sensor__CUT.png | PNG | 1254x1254 | 892.4 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/sensors/wheel_speed_sensor__EVID-fault.png | PNG | 1254x1254 | 2455.8 KB | 고장 증거 카드; intake 보관본 |
| public/assets/intake/images/sensors/wheel_speed_sensor__EVID-ok.png | PNG | 1254x1254 | 2461.2 KB | 정상 증거 카드; intake 보관본 |
| public/assets/intake/images/sensors/wheel_speed_sensor__REF.png | PNG | 1254x1254 | 1395.9 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/steering-suspension/anti_roll_bar__CUT.png | PNG | 1024x1024 | 1431.6 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/steering-suspension/anti_roll_bar__REF.png | PNG | 1254x1254 | 1089.3 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/steering-suspension/coil_spring__CUT.png | PNG | 1254x1254 | 866.6 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/steering-suspension/coil_spring__REF.png | PNG | 1254x1254 | 1395 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/steering-suspension/control_arm__CUT.png | PNG | 1254x1254 | 766.9 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/steering-suspension/control_arm__REF.png | PNG | 1254x1254 | 1337 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/steering-suspension/damper__CUT.png | PNG | 1254x1254 | 435.6 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/steering-suspension/damper__EXPL.png | PNG | 1536x1024 | 1310.1 KB | 분해/설명용; intake 보관본 |
| public/assets/intake/images/steering-suspension/damper__REF.png | PNG | 1254x1254 | 1147.1 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/steering-suspension/eps_motor__CUT.png | PNG | 1254x1254 | 1930.1 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/steering-suspension/eps_motor__EXPL.png | PNG | 1536x1024 | 2111.2 KB | 분해/설명용; intake 보관본 |
| public/assets/intake/images/steering-suspension/eps_motor__REF.png | PNG | 1254x1254 | 1893.6 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/steering-suspension/knuckle__REF.png | PNG | 1254x1254 | 1735.4 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/steering-suspension/knuckle__TURN.png | PNG | 1536x1024 | 1654.7 KB | 회전/동작 참고; intake 보관본 |
| public/assets/intake/images/steering-suspension/steering_rack__CUT.png | PNG | 1254x1254 | 508.3 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/steering-suspension/steering_rack__EXPL.png | PNG | 1536x1024 | 1395.9 KB | 분해/설명용; intake 보관본 |
| public/assets/intake/images/steering-suspension/steering_rack__REF.png | PNG | 1254x1254 | 1168.2 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/steering-suspension/strut_assembly__CUT.png | PNG | 1254x1254 | 641.2 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/steering-suspension/strut_assembly__REF.png | PNG | 1254x1254 | 1312.9 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/steering-suspension/tie_rod__CUT.png | PNG | 1254x1254 | 534.6 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/steering-suspension/tie_rod__REF.png | PNG | 1254x1254 | 1251.9 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/thermal/ac_compressor__CUT.png | PNG | 1254x1254 | 1984.5 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/thermal/ac_compressor__REF.png | PNG | 1254x1254 | 2028.9 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/thermal/chiller__CUT.png | PNG | 1254x1254 | 1755.4 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/thermal/chiller__REF.png | PNG | 1254x1254 | 2005.3 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/thermal/coolant_reservoir__CUT.png | PNG | 1254x1254 | 1399.2 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/thermal/coolant_reservoir__REF.png | PNG | 1254x1254 | 1509.4 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/thermal/coolant_valve__CUT.png | PNG | 1254x1254 | 1531.5 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/thermal/coolant_valve__REF.png | PNG | 1254x1254 | 1733.1 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/thermal/cooling_fan__CUT.png | PNG | 1254x1254 | 1749.5 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/thermal/cooling_fan__EVID-fault.png | PNG | 1254x1254 | 2564.7 KB | 고장 증거 카드; intake 보관본 |
| public/assets/intake/images/thermal/cooling_fan__EVID-ok.png | PNG | 1254x1254 | 2219.2 KB | 정상 증거 카드; intake 보관본 |
| public/assets/intake/images/thermal/cooling_fan__REF.png | PNG | 1254x1254 | 1730.1 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/thermal/cooling_pipe__CUT.png | PNG | 1024x1024 | 1658.3 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/thermal/cooling_pipe__EVID-fault.png | PNG | 1254x1254 | 2339.5 KB | 고장 증거 카드; intake 보관본 |
| public/assets/intake/images/thermal/cooling_pipe__EVID-ok.png | PNG | 1254x1254 | 2211.6 KB | 정상 증거 카드; intake 보관본 |
| public/assets/intake/images/thermal/cooling_pump__CUT.png | PNG | 1254x1254 | 1925.6 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/thermal/cooling_pump__EVID-fault.png | PNG | 1254x1254 | 2259.5 KB | 고장 증거 카드; intake 보관본 |
| public/assets/intake/images/thermal/cooling_pump__EVID-ok.png | PNG | 1254x1254 | 2251.8 KB | 정상 증거 카드; intake 보관본 |
| public/assets/intake/images/thermal/cooling_pump__EXPL.png | PNG | 1536x1024 | 1987.8 KB | 분해/설명용; intake 보관본 |
| public/assets/intake/images/thermal/cooling_pump__REF.png | PNG | 1254x1254 | 1990.2 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/thermal/eev__CUT.png | PNG | 1254x1254 | 1206 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/thermal/eev__REF.png | PNG | 1254x1254 | 1505.4 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/thermal/ptc_heater__CUT.png | PNG | 1254x1254 | 1505.3 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/thermal/ptc_heater__REF.png | PNG | 1254x1254 | 1681.8 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/intake/images/thermal/radiator__CUT.png | PNG | 1254x1254 | 2156 KB | 부품 컷아웃/차고·퍼즐 카드; intake 보관본 |
| public/assets/intake/images/thermal/radiator__REF.png | PNG | 1254x1254 | 2254.1 KB | 부품 참고/PartShowroom·동적 모델 매핑; intake 보관본 |
| public/assets/Jalnan2.otf | OTF | — | 2695.4 KB | 폰트; CSS에서 사용 여부와 라이선스 확인 |
| public/assets/lab-comparison-board-v1.png | PNG | 1672x941 | 2168.4 KB | 실험 비교 보드 소재 |
| public/assets/polaroid-frame-real-v1.png | PNG | 1086x1448 | 1006.5 KB | 폴라로이드 프레임 참고 |
| public/assets/police-interceptor-cutout-v1.png | PNG | 1774x887 | 1927.3 KB | 경찰차 컷아웃 |
| public/assets/stitch23/chase-coast.png | PNG | 1376x768 | 1272.9 KB | 스토리/배경 컷신 후보; 파일명 기준 사용 위치 |
| public/assets/stitch23/chase-sunrise.png | PNG | 1376x768 | 1499.4 KB | 스토리/배경 컷신 후보; 파일명 기준 사용 위치 |
| public/assets/stitch23/coast-overlook.png | PNG | 1376x768 | 1385.4 KB | 스토리/배경 컷신 후보; 파일명 기준 사용 위치 |
| public/assets/stitch23/fail-rain.png | PNG | 1376x768 | 1308.2 KB | 스토리/배경 컷신 후보; 파일명 기준 사용 위치 |
| public/assets/stitch23/fault-breakdown.png | PNG | 1376x768 | 1549.4 KB | 스토리/배경 컷신 후보; 파일명 기준 사용 위치 |
| public/assets/stitch23/harbor-approach.png | PNG | 1376x768 | 1538.9 KB | 스토리/배경 컷신 후보; 파일명 기준 사용 위치 |
| public/assets/stitch23/harbor-cutscene.png | PNG | 1376x768 | 1431.4 KB | 스토리/배경 컷신 후보; 파일명 기준 사용 위치 |
| public/assets/stitch23/investigation-lab.png | PNG | 1376x768 | 1636.1 KB | 스토리/배경 컷신 후보; 파일명 기준 사용 위치 |
| public/assets/stitch23/menu-garage.png | PNG | 1376x768 | 1512.4 KB | 스토리/배경 컷신 후보; 파일명 기준 사용 위치 |
| public/assets/stitch23/prologue-loss.png | PNG | 1376x768 | 1525.3 KB | 스토리/배경 컷신 후보; 파일명 기준 사용 위치 |
| public/assets/stitch23/prologue-night-drive.png | PNG | 1376x768 | 1342.4 KB | 스토리/배경 컷신 후보; 파일명 기준 사용 위치 |
| public/assets/stitch23/prologue-plan.png | PNG | 1376x768 | 1525.4 KB | 스토리/배경 컷신 후보; 파일명 기준 사용 위치 |
| public/assets/stitch23/prologue-race.png | PNG | 1376x768 | 1352.7 KB | 스토리/배경 컷신 후보; 파일명 기준 사용 위치 |
| public/assets/stitch23/ship-escape.png | PNG | 1376x768 | 1485.3 KB | 스토리/배경 컷신 후보; 파일명 기준 사용 위치 |
| public/assets/system-atlas-v7.png | PNG | 1672x941 | 2475.9 KB | 시스템 아틀라스 |
| public/assets/traceback-engineering-evidence-atlas-v1.png | PNG | 1254x1254 | 2442.9 KB | 공학 증거 아틀라스 |
| public/assets/traceback-red-ev-v2.png | PNG | 1536x1024 | 1867.6 KB | 차고 붉은 EV 이미지 |
| public/assets/traceback-title-garage-v2.png | PNG | 1672x941 | 2184.7 KB | 타이틀/차고 합성 이미지 |
| public/assets/ui-button-plate-v1.png | PNG | 2172x724 | 1568.3 KB | 버튼 플레이트 참고 |
| public/assets/ui/bubble-fish-fault.svg | SVG | — | 0.7 KB | UI/검증 보드 소재; 해당 기능 컴포넌트 |
| public/assets/ui/bubble-fish-police.svg | SVG | — | 0.6 KB | UI/검증 보드 소재; 해당 기능 컴포넌트 |
| public/assets/ui/burst-crash.svg | SVG | — | 1.8 KB | UI/검증 보드 소재; 해당 기능 컴포넌트 |
| public/assets/ui/burst-fault.svg | SVG | — | 1.8 KB | UI/검증 보드 소재; 해당 기능 컴포넌트 |
| public/assets/ui/burst-police.svg | SVG | — | 1.8 KB | UI/검증 보드 소재; 해당 기능 컴포넌트 |
| public/assets/ui/icon-crash.svg | SVG | — | 0.3 KB | UI/검증 보드 소재; 해당 기능 컴포넌트 |
| public/assets/ui/icon-police.svg | SVG | — | 1.2 KB | UI/검증 보드 소재; 해당 기능 컴포넌트 |
| public/assets/ui/icon-skull.svg | SVG | — | 1.3 KB | UI/검증 보드 소재; 해당 기능 컴포넌트 |
| public/assets/ui/icons/book.svg | SVG | — | 0.3 KB | HUD·추격 레일·공통 아이콘; game-shell |
| public/assets/ui/icons/cat-ming.svg | SVG | — | 0.9 KB | HUD·추격 레일·공통 아이콘; game-shell |
| public/assets/ui/icons/check.svg | SVG | — | 0.2 KB | HUD·추격 레일·공통 아이콘; game-shell |
| public/assets/ui/icons/flag.svg | SVG | — | 0.3 KB | HUD·추격 레일·공통 아이콘; game-shell |
| public/assets/ui/icons/getaway-car.svg | SVG | — | 0.7 KB | HUD·추격 레일·공통 아이콘; game-shell |
| public/assets/ui/icons/police-car.svg | SVG | — | 0.6 KB | HUD·추격 레일·공통 아이콘; game-shell |
| public/assets/ui/icons/probe.svg | SVG | — | 0.4 KB | HUD·추격 레일·공통 아이콘; game-shell |
| public/assets/ui/level-select-board.png | PNG | 1672x941 | 2176.3 KB | UI/검증 보드 소재; 해당 기능 컴포넌트 |
| public/assets/ui/verification-spec-sheet.png | PNG | 1536x1024 | 2048.1 KB | UI/검증 보드 소재; 해당 기능 컴포넌트 |
| public/assets/vehicle-component-cutouts-v1.png | PNG | 1774x887 | 1758 KB | 차량 부품 컷아웃 시트 |
| public/assets/vehicle-cutaway-v4.png | PNG | 1536x1024 | 2174.2 KB | 차량 컷어웨이 |

## 5. 별도 실행 캡처 목록

### [확인] game-web/--help

- 42개 PNG
- 전부 1600×900, 파일 크기 20,299 bytes
- 파일명은 화면 흐름을 나타내지만, 현재 라이브 화면과 동일하다고 단정하지 않음

00_title.png, 01_prologue.png, 02_garage_drive_system.png, 03_garage_drive_ee.png, 04_garage_drive_sw.png, 05_garage_brake_system.png, 06_garage_brake_ee.png, 07_garage_brake_sw.png, 08_garage_steer_system.png, 09_garage_steer_ee.png, 10_garage_steer_sw.png, 11_garage_gear_system.png, 12_garage_gear_ee.png, 13_garage_gear_sw.png, 14_garage_power_system.png, 15_garage_power_ee.png, 16_garage_power_sw.png, 17_garage_thermal_system.png, 18_garage_thermal_ee.png, 19_garage_thermal_sw.png, 20_garage_suspension_system.png, 21_garage_suspension_ee.png, 22_garage_suspension_sw.png, 23_heist_door.png, 24_heist_boarding.png, 25_race_start.png, 26_fault_dialogue.png, 27_evidence_board.png, 28_wiring_puzzle.png, 29_lab_sw_logic.png, 30_lab_ecu_io.png, 31_lab_parts_vehicle.png, 32_lab_signal_graph.png, 33_failure_analysis.png, 34_repair.png, 35_race_resume.png, 36_final_dock_race.png, 37_ship_jump.png, 38_ship_landing.png, 39_caught_continue.png, 40_pause.png, 41_ending.png.

### [확인] game-web/deliverables

v17-check-small, v17-check-small-2, v19-puzzle-lab-check, v19-embedded-check-2, TraceBack_UI_Screens_20261105, v19-title-font-check 등 여러 검수 시점의 PNG가 있다. 파일은 홍보 후보가 될 수 있지만, 사용 전 캡처 시점과 현재 코드 분기를 확인한다.

## 6. 최종 추천 묶음

### [제안] 게시판용 최소 세트

1. stitch23/menu-garage.png
2. stitch23/chase-coast.png
3. board-photos/pedal_processed.png 또는 torque_cmd.png
4. ui/verification-spec-sheet.png
5. cutscene-ship-jump-v1.png + cutscene-ship-land-v1.png
6. ASSET_003_Cat_Face_Identity_REFERENCE.png와 ui/icons/cat-ming.svg

### [제안] 외부 랜딩페이지 확장 세트

위 최소 세트에 investigation-lab.png, fault-breakdown.png, traceback-engineering-evidence-atlas-v1.png, lab-comparison-board-v1.png, 선택 사건의 __EVID-fault/ok 쌍을 추가한다. 부품 intake 229개를 모두 노출하지 말고, 실제 홍보 흐름에 해당하는 8~12개만 선별한다.

