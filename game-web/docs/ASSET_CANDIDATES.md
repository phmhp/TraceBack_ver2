# 공개 3D 에셋 후보 (실제 검색 결과)

검색일: 2026-11-06 · 방법: Sketchfab 공개 검색 API(`downloadable=true`, `license=cc0|by`), Poly Haven API, BlenderKit 검색 API, Kenney 페이지 조회.
아래 URL은 모두 API가 실제로 반환한 값이다. **아직 아무것도 다운로드하지 않았다.**

## 도구 접근성

| 사이트 | 검색 | 다운로드 | 라이선스 확인 |
|---|---|---|---|
| Sketchfab | 가능 (API 200) | **불가 — 로그인/API 토큰 필요 (401)** | 가능 (API에 표기) |
| Poly Haven | 가능 | 가능 (CC0, 인증 불필요) | 전 에셋 CC0 |
| BlenderKit | 가능 | 계정 + Blender 애드온 필요 | "Royalty Free" — 에셋 재배포 제한, 웹 배포 시 해석 확인 필요 |
| GrabCAD | **불가 (403)** | 로그인 필요 | — |
| Kenney | 가능 | 가능 (zip) | CC0 확인 |

- Poly Haven 모델 521개 중 EV 부품은 0개. 차고 배경 소품(공구함, 회로기판, 멀티미터 등)만 활용 가능.
- CC-BY(Sketchfab): 상업 이용·수정·재배포 허용, **제작자 표기 의무**. CC0: 표기 의무 없음.
- 브랜드 재현 모델(Lamborghini, BMW, Mustang, Cadillac, Toyota 등)은 상표·디자인권 문제로 **제외**했다.
- 미리보기 이미지는 각 URL 페이지에서 확인. 부품 분리 여부·실제 형상은 미리보기로 **아직 검증하지 않았다**(사용자 확인 필요).
- Sketchfab 다운로드 가능 모델은 glTF/GLB 변환본을 제공한다.

## Tier A — 반드시 필요 (P0)

### 레이싱 차체 (경량)
| 후보 | 제작자 | 라이선스 | 면 수 | 적합성 / 가공 |
|---|---|---|---|---|
| Kenney Car Kit — https://kenney.nl/assets/car-kit | Kenney | CC0 | 저폴리 | 라이선스 최상. 토이풍이라 기존 화풍과 맞음. 오픈카 형태 여부 확인 필요 |
| Low poly Car — https://sketchfab.com/3d-models/none-f822f0c500a24ca9ac2af183d2e630b4 | reyad.bader | CC-BY | 4.8k | 일반 세단 비율. 지붕 제거 가공 필요 |
| Morris Minor — https://sketchfab.com/3d-models/none-7a20ff15235c4c2f909c7955534a0df3 | artfletch | CC-BY | 6.3k | 실존 차종(1948~) 디자인. 상표 위험 낮지만 확인 필요 |
| POLICE CAR - LOW POLY — https://sketchfab.com/3d-models/none-0f5b12ea1f474887b9664fd7a171c17a | jasmin.daniel | CC-BY | 3.9k | 경찰차 대체 후보 |

### 운전자 입력장치
| 부품 | 후보 | 제작자 | 라이선스 | 면 수 | 비고 |
|---|---|---|---|---|---|
| Steering Wheel | Steering Wheel (Racing) — https://sketchfab.com/3d-models/none-56fb4b31c3c546feaa328b1edc300a2c | Cakeservant | CC-BY | 19k | 비브랜드 |
| Steering Wheel | Steering wheel — https://sketchfab.com/3d-models/none-0e5968d9c8224c16b8b8c522ee7f35bc | Adim007 | CC-BY | 8.7k | 경량 |
| Gear Selector | Gear Selector/Gear shifter (CVT) — https://sketchfab.com/3d-models/none-5c078ceab6984dcc882d66db3011ec5e | DtestING | CC-BY | 2.7k | PRND형 셀렉터에 가장 가까움 |
| Gear Selector | Manual Transmission Shifter — https://sketchfab.com/3d-models/none-dff28ef3fae0432db721049c3891c322 | kryoxshade | CC-BY | 54k | 수동 레버형이라 EV엔 부적합할 수 있음 |
| Start/Stop Button | Button Start-Stop USSR — https://sketchfab.com/3d-models/none-cb6904be8caf437a86906a2252ac0307 | crfrog | CC-BY | 288 | 형상 단순, 확인 필요 |
| Accelerator/Brake Pedal | **후보 없음** (검색 결과는 페달카 장난감뿐) | — | — | — | 교육용 단순화 또는 추가 탐색 |
| Instrument Cluster | **단품 후보 없음** (브랜드 차량 실내 통째뿐) | — | — | — | HUD(2D)로 대체 권장 |

### 구동 (사건 1)
| 부품 | 후보 | 제작자 | 라이선스 | 면 수 | 비고 |
|---|---|---|---|---|---|
| Electric Motor | Electric Motor — https://sketchfab.com/3d-models/none-66b2ea9eb6e5468d91d814395036a537 | Scarecrow_original | CC-BY | 36k | 산업용 형상(차량용 PMSM과 다름) |
| Electric Motor | Electric motor — https://sketchfab.com/3d-models/none-19d028eb4e504314bf909a381b6796eb | takeboncog | CC-BY | 20k | |
| Electric Motor | ELECTRIC MOTOR — https://sketchfab.com/3d-models/none-4133763481d84dc49d77764acb022efb | siotech2011 | CC-BY | 84k | **애니메이션 1개 포함** — 분해/회전 가능성 확인 필요 |
| Inverter | AC Inverter — https://sketchfab.com/3d-models/none-e8d19ae2e41645dc9eae55c9f948b34b | vanhalen3d | CC-BY | 20k | 차량용 아님(산업용 추정) |

### 열관리 (사건 2)
| 부품 | 후보 | 제작자 | 라이선스 | 면 수 | 비고 |
|---|---|---|---|---|---|
| Radiator | Engine Radiator — https://sketchfab.com/3d-models/none-590a29882e764c368c857ebaba4fd01b | terllok | CC-BY | 812 | 매우 경량 |
| Radiator + Fan | Dual radiator cooling fan assembly — https://sketchfab.com/3d-models/none-bf3c6f6fb066496f8c0e15821747d64b | colleywolly | CC-BY | 877k | 고폴리 — 감축 필요 |
| Cooling Pump | Water Pump — https://sketchfab.com/3d-models/none-dfa91788ea8d40b0bc61b13b141f5ec5 | 2w | CC-BY | 58k | |
| Cooling Pump | Water Pump — https://sketchfab.com/3d-models/none-76ca12fd7aec4748b96445892b1a5d95 | Mohit.Lodhi | CC-BY | 150k | 감축 필요 |

## Tier B — 핵심 시나리오 보조 (P1)

| 부품 | 후보 | 제작자 | 라이선스 | 면 수 | 비고 |
|---|---|---|---|---|---|
| Brake Disc+Caliper | Brake Disk and Caliper — https://sketchfab.com/3d-models/none-5feda9dbf20a49cf9fd29d550e55e4b9 | vladivpg | CC-BY | 6.2k | 경량·인기 |
| Brake Disc | Car Disc Brake — https://sketchfab.com/3d-models/none-9e2440a2fa624b31abd0963902217407 | joko_p | CC-BY | 17k | |
| Wheel+Brake | Car wheel with brake disc - Low poly — https://sketchfab.com/3d-models/none-5b9bb83857674cd5a866f35fbf7fe8d4 | mmcworks | CC-BY | 8.2k | 레이싱 휠로도 사용 가능 |
| Master Cylinder | Brake Master Cylinder — https://sketchfab.com/3d-models/none-1d331c9876c846f0a1c6a4d7ad8e9b47 | Antonio36996 | CC-BY | 50k | |
| Battery Cell | Li-ion 18650 (MidPoly) — https://sketchfab.com/3d-models/none-eefe894897f746f689b899f80b15d325 | damir_cgi | CC-BY | 20k | 인스턴싱으로 모듈 구성 가능 |
| Battery Cell | 18650 Battery — https://sketchfab.com/3d-models/none-251370a5725c41d18e6c507193701fbc | sinnervoncrawsz | CC-BY | 21k | |
| Contactor | CJX2s AC Contactor — https://sketchfab.com/3d-models/none-96a235b342f5447a9b16d9de0f0e7ac7 | cncelectric | CC-BY | 85k | 제조사 업로드. 산업용 AC 컨택터(EV HV 컨택터와 형상 다름) |
| ECU 하우징 | Industrial Electrical Box — https://sketchfab.com/3d-models/none-de13c96dad014bf098df03030f314fee | Krystofeles | CC-BY | 8.7k | ECU 추상 노드 외형으로 가능 |

## Tier C — 후보 없음 / 매우 부족

배터리 팩·모듈, BMS, HV 정션박스, 프리차지, DC/DC, OBC, 충전 포트, 감속기·차동, 드라이브샤프트, EPS 모터·랙·타이로드, 너클·컨트롤암, 휠 속도 센서, 유압 모듈레이터 — Sketchfab CC0/CC-BY 및 BlenderKit 무료 검색에서 적합 후보 0건.

## BlenderKit 참고 (라이선스 확인 후에만 사용)

- Electric Motor PL-01 (Pierre-Louis Baril) — https://www.blenderkit.com/asset-gallery-detail/00db58de-4044-4e48-b5e7-90bd5eea42d6/
- Car Radiator (Low Poly) PL (Pierre-Louis Baril) — https://www.blenderkit.com/asset-gallery-detail/55dcdb0b-8a74-4766-a67a-8806777c8389/

## 다음 단계

1. 사용자가 위 후보 페이지에서 미리보기를 보고 채택할 모델을 고른다.
2. 사용자가 직접 로그인해 GLB로 다운로드하여 `game-web/asset-intake/<부품명>/`에 넣는다(원본 보관).
3. 제가 라이선스 대장(`docs/ASSET_LICENSES.md`) 작성 → 크기·재질 통일·압축 → `public/models/`에 최적화본 배치.
