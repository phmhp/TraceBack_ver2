# Tier C 부품 확보 방안 — 직접 제작 + 무료 AI 생성 프롬프트

작성일: 2026-11-06 · 대상: 공개 3D 에셋(CC0/CC-BY)에서 적합 후보가 0건이었던 부품

배터리 팩·모듈, BMS, HV 정션박스, 프리차지, DC/DC, OBC, 충전 포트, 감속기·차동, 드라이브샤프트,
EPS 모터·랙·타이로드, 너클·컨트롤암, 휠 속도 센서, 유압 모듈레이터

---

## 1. 결론 — 두 가지 경로를 병행

| 경로 | 적합한 부품 | 장점 | 한계 |
|---|---|---|---|
| **A. 코드로 직접 제작** (이번에 만든 오픈카와 같은 방식) | 감속기·차동, 드라이브샤프트(CV 조인트), EPS 랙·타이로드, 너클·컨트롤암, 휠 속도 센서, 배터리 셀→모듈→팩, 정션박스, 컨택터 | 게임 고유 저작물(라이선스 문제 없음), 부품 분리·회전 피벗·포트 위치를 정확히 지정, 같은 재질 체계로 통일, 저폴리로 성능 관리 | 실제 CAD 수준 디테일은 아님 → 화면에 "교육용 단순화 모델" 표시 유지 |
| **B. 무료 AI 이미지→3D 생성** | 외형 위주 박스형 부품: OBC, DC/DC, BMS 하우징, 충전 포트, 유압 모듈레이터 외관 | 빠른 외형 확보, 사실적인 표면 질감 | 기어 이빨·랙 같은 기계 구조가 뭉개짐, 좌우 비대칭, 부품 분리 불가, 폴리곤 과다 → 정리 필요 |

**추천:** 움직이거나 분해해서 보여줘야 하는 부품(감속기, 차동, 랙, 샤프트, 셀/모듈)은 **A**, 외관만 보이는 상자형 전장품은 **B**로 시도하고 품질이 나쁘면 A로 대체합니다.

---

## 2. 무료 AI 3D 생성 사이트 (2026-11-06 확인)

| 사이트 | 비용 | 생성물 라이선스 | 판단 |
|---|---|---|---|
| **Microsoft TRELLIS** (Hugging Face Space, 이미지→3D, GLB 출력) | 무료 | 원본 저장소 MIT 라이선스 | **1순위.** Space마다 라이선스 표기를 한 번 더 확인 |
| **Meshy** 무료 플랜 | 무료(월 크레딧, Meshy 6 Lite 모델만 다운로드) | CC BY 4.0, 상업 이용 시 "Model created with Meshy – CC BY 4.0 License" 표기 | 2순위. 출처 표기 의무를 `ASSET_LICENSES.md`에 기록 |
| Tripo 무료 플랜 | 무료(월 크레딧) | CC BY 4.0, 공개 모델. 상업 이용 해석이 출처마다 다름 | **보류** — 공모전·사업화 목적엔 불확실 |
| Tencent Hunyuan3D | 무료 | 커뮤니티 라이선스가 **EU·영국·한국을 사용 지역에서 제외** | **사용 금지** (한국 사용자) |

이미지 생성은 ChatGPT(GPT 이미지)를 사용합니다. 생성 이미지는 3D 변환의 참고 입력일 뿐 게임에 직접 넣지 않습니다.

### 작업 순서
1. ChatGPT에 아래 **이미지 프롬프트**를 넣어 정면 3/4 시점 참고 이미지를 생성 (흰 배경, 단일 부품)
2. 이미지를 TRELLIS Space(또는 Meshy 무료)에 업로드 → GLB 다운로드
3. `game-web/asset-intake/<부품ID>/`에 원본 GLB + 사용한 사이트·날짜·프롬프트를 메모로 저장
4. 제가 크기·피벗 정리, 폴리곤 감축, 재질 색을 프로젝트 팔레트로 교체, 포트 위치 지정 후 `public/models/parts/`에 배치

---

## 3. 이미지 생성 프롬프트 (ChatGPT용)

> 전체 부품(입력장치·센서·ECU·액추에이터·기계부품·충전·확장 도메인)과 메모판 증거용 프롬프트는
> [PART_IMAGE_PROMPTS.md](PART_IMAGE_PROMPTS.md)에 통합했습니다. 아래 표는 Tier C 부분만 남겨 둔 것입니다.

모든 프롬프트 공통 접미사 — 3D 변환 품질을 높이기 위한 조건입니다.

```
Single isolated object, three-quarter front view from slightly above, plain pure white background,
soft even studio lighting, no shadows on background, no text, no logos, no brand names,
realistic industrial product render, clean geometry, entire object visible with margin.
```

| 부품 ID | 프롬프트 (앞에 붙여 사용) |
|---|---|
| `hv_battery` 배터리 팩 | Flat rectangular electric-vehicle traction battery pack enclosure, cast aluminum lid with stiffening ribs, bolted perimeter flange, two orange high-voltage connectors and one black low-voltage connector on the front edge, coolant inlet and outlet pipe stubs, generic design |
| `battery_module` 배터리 모듈 | Lithium-ion battery module made of many cylindrical cells in a plastic holder, nickel busbar strips across the top, aluminum end plates, small grey sensing harness connector, generic design |
| `bms` BMS | Automotive battery management system control unit, black plastic housing with aluminum base plate, two multi-pin grey connectors, four mounting tabs, generic design |
| `hv_junction_box` 정션박스 | Automotive high-voltage junction box, grey die-cast housing, several orange high-voltage cable glands, warning label area without text, bolted cover, generic design |
| `main_contactor` 컨택터 | High-voltage DC contactor for electric vehicles, cylindrical black body, two large threaded copper terminals on top, small two-pin coil connector, mounting flange, generic design |
| `dcdc_converter` DC/DC | Automotive DC-DC converter module, finned cast aluminum housing, one orange high-voltage connector and one thick 12-volt output stud, coolant pipe stubs, generic design |
| `obc` 차량 탑재 충전기 | Electric vehicle on-board charger unit, rectangular aluminum housing with cooling fins, AC input connector and orange DC output connector, coolant ports, generic design |
| `charging_port` 충전 포트 | Electric vehicle combined charging inlet socket in a black plastic housing with hinged flap open, AC pins on top and two large DC pins below, generic design |
| `hydraulic_modulator` 유압 모듈레이터 | Automotive ABS hydraulic modulator unit, machined aluminum valve block with brake line ports, attached black electronic control module with connector, small electric pump motor cylinder, generic design |
| `reduction_gear` 감속기 | Single-speed electric vehicle reduction gearbox, cast aluminum housing, input shaft opening for motor, two output shaft flanges, mounting bosses, generic design |
| `eps_rack` EPS 랙 | Electric power steering rack assembly, long aluminum rack housing with rubber bellows boots at both ends, tie rods with ball joints, electric assist motor mounted parallel to the rack, generic design |

> 기어 이빨, 랙 내부, CV 조인트처럼 **움직임을 보여줘야 하는 부품은 AI 생성 결과가 학습용으로 부적합**하므로 경로 A(직접 제작)로 처리합니다.

---

## 4. 경로 A — 직접 제작 시 규격

- 단위 m, 부품 원점 = 장착 기준점, 회전 부품은 회전축을 로컬 X축에 정렬
- 재질은 프로젝트 공통 팔레트만 사용: 알루미늄 주조 `#a9adb0`, 건메탈 `#4a4f55`, 스틸 `#8e9396`, 무광 고무 `#1c1e20`, 다크 플라스틱 `#2a2d31`, 고전압 케이블 오렌지 `#e8742a`, 구리 단자 `#b8733d`, 냉각수 라인 보조색 `#3f8fb0`
- 정적 부품은 재질별로 병합(draw call 최소화), 움직이는 부품만 분리
- 포트 위치는 `src/sim/components.ts`의 포트 ID와 같은 이름의 앵커로 지정
- 화면에는 `modelFidelity: "educational_simplified"` 배지를 표시 (실제 CAD가 아니라는 사실을 명시)

## 5. 이번 작업에서 확인한 사실 (레이싱 차량)

- Poly Pizza에서 로그인 없이 GLB를 받을 수 있는 오픈카 4종(Poly by Google, CC-BY)과 고양이 모델(Quaternius CC0 등)을 실제로 내려받아 검토했습니다.
  - 가장 나은 오픈카(`poly.pizza/m/bKbYpEwLXDv`)는 바퀴가 차체와 한 메시라 회전·조향 불가, 폭/길이 비율이 0.6으로 만화풍이라 탈락
  - 부품이 분리된 오픈카(`poly.pizza/m/8ACz9InIO0c`)는 각진 저폴리로 품질 미달
  - 고양이 모델은 4족 보행 자세라 운전석에 앉히기 어렵고 캐릭터 원화와 달라 탈락
- 따라서 레이싱 차량과 두 고양이는 **원화 기반으로 직접 제작**했습니다(외부 에셋 미사용, 라이선스 의무 없음). 내려받은 검토용 파일은 프로젝트 밖 임시 폴더에만 있고 게임에 포함되지 않았습니다.
