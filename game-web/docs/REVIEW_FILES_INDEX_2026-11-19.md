# 검수 자료 파일 안내

기준 커밋: `d19e1844cee87fbea5c0a41ffe01a20da556c28b`  
정비소 원문 인벤토리 범위: 화면 문구·상호작용 경로·도메인 기능·차량 모델 선언

## 검수 자료

| 자료 | 경로 | 용도 |
|---|---|---|
| 시나리오별 플레이어 원문 카탈로그 | `docs/PLAYER_CONTENT_CATALOG_2026-11-19.md` | 시나리오별 플레이어 노출 문구와 소스 위치를 읽기 쉽게 확인 |
| 시나리오별 행 단위 원자료 | `docs/PLAYER_CONTENT_CATALOG_2026-11-19.jsonl` | 각 콘텐츠 행의 원문, 분류, 파일·줄·keyPath 등 기계 처리 가능한 자료 |
| 정비소 원문·조작 카탈로그 | `docs/GARAGE_PLAYER_CONTENT_CATALOG_2026-11-19.md` | 영역·도메인·기능·레이어와 조작/노출 조건 목록 |
| 정비소 원자료 JSON | `docs/GARAGE_PLAYER_CONTENT_CATALOG_2026-11-19.json` | 정비소 원문, UI 조작, 전체 차량 spec, 배치/내부 검사 결과 및 기술 finding 구조 |
| 기술 검수 안내 및 근거 기록 | `docs/GARAGE_TECHNICAL_REVIEW_2026-11-19.md` | 독립 검토 범위, 시스템 단위 검수 방법, 확인된 논점과 재현 근거 |
| 정비소 카탈로그 생성기 | `scripts/build-garage-catalog.mjs` | 원자료 JSON과 정비소 Markdown 카탈로그 재생성 |

## 해석 시 유의점

- 경로·keyPath는 원문을 수정할 때 해당 값을 찾는 주소입니다. 여러 상태에서 렌더되는지 여부는 카탈로그의 노출 조건과 실행 화면을 함께 확인합니다.
- 정비소 기술 검수 항목은 저장소 내부 일관성 검토입니다. 외부 자동차 표준 적합성 판정을 뜻하지 않습니다.
- 정적 코드 분석만으로는 3D 에셋의 실제 모양, 화면 크기별 레이아웃, 인터랙션의 체감 품질을 확인할 수 없습니다.
- 카탈로그를 재생성하려면 저장소 루트에서 `node --import=tsx scripts/build-garage-catalog.mjs`를 실행합니다. 이 명령은 정비소 Markdown/JSON을 갱신하며, 시나리오별 자료는 해당 원문 카탈로그의 생성 경로를 따릅니다.
