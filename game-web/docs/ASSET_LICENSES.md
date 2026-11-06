# 3D 에셋 출처·라이선스 대장

게임 빌드에 포함되는 모든 3D 에셋을 기록합니다. 외부 에셋을 추가할 때마다 한 줄씩 추가하고,
`src/sim/components.ts`의 해당 부품 `modelFidelity`를 `"sourced"`로 바꿉니다.

## 게임에 포함된 3D 에셋

| 에셋 | 사용 위치 | 출처 | 제작자 | 라이선스 | 표기 의무 | 원본 보관 |
|---|---|---|---|---|---|---|
| 히어로 오픈카 (`src/features/vehicle/HeroConvertible.tsx`, `carBody.ts`) | 레이싱, 도주 컷신, 해적선 점프 | 코드로 직접 제작 | TraceBack 프로젝트 | 프로젝트 소유 | 없음 | 소스 코드 자체 |
| 루·밍 고양이 (`src/features/vehicle/CatCharacter.tsx`) | 오픈카 탑승 | `public/assets/cutscene-character-master-v1.png` 원화를 기반으로 코드로 제작 | TraceBack 프로젝트 | 프로젝트 소유 | 없음 | 소스 코드 자체 |

외부에서 받은 3D 파일은 현재 **0개**입니다.

## 검토 후 채택하지 않은 외부 에셋

| 에셋 | URL | 라이선스 | 탈락 사유 |
|---|---|---|---|
| Convertible (Poly by Google) | https://poly.pizza/m/bKbYpEwLXDv | CC-BY | 바퀴가 차체와 한 메시(회전·조향 불가), 비율 과장 |
| Convertible (Poly by Google) | https://poly.pizza/m/8ACz9InIO0c | CC-BY | 각진 저폴리, 품질 미달 |
| Convertible (Poly by Google) | https://poly.pizza/m/dggOiBLYyuR | CC-BY | 텍스처 1.7 MB 대비 형상 단순 |
| Cat (Quaternius) | https://poly.pizza/m/qKICY6xla2 | CC0 | 4족 보행 자세, 캐릭터 원화와 불일치 |
| Cat (J-Toastie) | https://poly.pizza/m/DJ9rpAhrh3 | CC-BY | 각진 회색 저폴리, 캐릭터 원화와 불일치 |
