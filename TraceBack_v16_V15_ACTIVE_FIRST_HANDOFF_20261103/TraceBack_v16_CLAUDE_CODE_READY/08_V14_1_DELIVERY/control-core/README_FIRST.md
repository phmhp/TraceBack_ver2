# TraceBack v14 — Claude Code 전달용 CORE (선별본)

이 폴더는 v14 **전체 게임이 아니다**. 자동차 SW 제어·진단·블록 실행 관련 소스와 일부 테스트/문서만 남겼다. 선별 과정에서 원본 코드 본문은 수정하지 않았다.

## 권장 작업 순서
1. `src/campaign/integratedVehicleModel.ts` 와 10개 도메인 모델 및 `vehicleSystems.ts`의 입력/출력·상태 소유권 조사.
2. `src/engineering/torqueModel.ts`, `src/engineering/actuator-lab/engine.mjs`, `src/campaign/signalBlocks.ts`, `src/engine/*`를 대조, 중복 실행기는 무조건 합치지 말고 어댑터/정규화된 IR 설계.
3. 플레이어 블록 변경 → 동일한 시험 입력 → ECU 명령 → plant actual → expected/actual 비교로 추적 가능한 인터페이스 설계.
4. 전체 원본 ZIP과 게임 UI/에셋은 이후 완성 게임으로 병합할 때만 사용. 이 선별본을 기존 TraceBack 루트에 덮어쓰지 말 것.

## 실행 제약
- Node >=22.18.0 권장; 실제 환경의 의존성에 따라 일부 시험은 패키지가 필요함.
- 원본의 전체 `package.json`, `node_modules`, `vite` UI는 제외. `node --experimental-strip-types --test tests/<file>.test.mjs` 형식으로 독립 시험 시도 가능.
- 실제 게임 빌드/브라우저/안전인증은 선별본에서 확인할 수 없음.

함께 제공하는 `TraceBack_v14_REUSE_AUDIT.md`에서 재사용 이유, 제한, 검증 학습 개선안을 확인.
