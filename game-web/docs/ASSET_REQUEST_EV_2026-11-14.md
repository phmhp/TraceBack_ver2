# EV 도메인 확장 에셋 요청 목록 (이미지 15장)

프롬프트 원문은 [image-prompts/14-ev-additions.md](image-prompts/14-ev-additions.md)에 있습니다. 이 문서는 **요청 순서와 저장 위치**만 정리한 체크리스트입니다.

## 진행 규칙 (꼭 지키기)
1. **한 번에 한 장만 요청합니다.** 프롬프트 코드 블록 하나 = 대화 메시지 하나 = 이미지 하나.
2. 프롬프트를 **코드 블록 그대로 통째로** 붙여 넣습니다(앞뒤에 다른 말을 덧붙이지 않기).
3. 이미지가 2장 이상 나오거나, 글자·테두리·화살표가 그려져 있으면 **버리고 다시 요청**합니다(같은 프롬프트).
4. CUT 이미지는 **같은 부품의 REF 이미지를 먼저 첨부**한 뒤 프롬프트를 붙여 넣습니다.
5. 저장할 때 **파일명을 표의 이름 그대로** 바꿔서 저장합니다(ChatGPT가 답변 끝에 파일명을 한 줄로 알려 줍니다).
6. 몇 장 저장할 때마다 `npm run assets:check`로 빠진 파일을 확인합니다. 새 폴더 `adas`는 먼저 만들어 주세요.

```bash
mkdir -p public/assets/intake/images/adas
```

## 요청 순서 (위에서 아래로)
기준 경로: `public/assets/intake/images/`

| 순서 | 파일명 | 저장 폴더 | 첨부 | 용도 | 완료 |
|---|---|---|---|---|---|
| 1 | `evcc__REF.png` | `charging/` | 없음 | 충전 제어기 3D 참고 | [ ] |
| 2 | `evcc__CUT.png` | `charging/` | `evcc__REF.png` | 충전 제어기 카드 | [ ] |
| 3 | `charge_lock_actuator__REF.png` | `charging/` | 없음 | 충전구 잠금 액추에이터 3D 참고 | [ ] |
| 4 | `charge_lock_actuator__CUT.png` | `charging/` | `charge_lock_actuator__REF.png` | 카드 | [ ] |
| 5 | `ac_compressor__REF.png` | `thermal/` | 없음 | 전동 컴프레서 3D 참고 | [ ] |
| 6 | `ac_compressor__CUT.png` | `thermal/` | `ac_compressor__REF.png` | 카드 | [ ] |
| 7 | `ptc_heater__REF.png` | `thermal/` | 없음 | PTC 히터 3D 참고 | [ ] |
| 8 | `ptc_heater__CUT.png` | `thermal/` | `ptc_heater__REF.png` | 카드 | [ ] |
| 9 | `eev__REF.png` | `thermal/` | 없음 | 전자식 팽창 밸브 3D 참고 | [ ] |
| 10 | `eev__CUT.png` | `thermal/` | `eev__REF.png` | 카드 | [ ] |
| 11 | `adas_camera__CUT.png` | `adas/` | 없음 | 전방 카메라 카드(2D) | [ ] |
| 12 | `adas_radar__CUT.png` | `adas/` | 없음 | 전방 레이더 카드(2D) | [ ] |
| 13 | `adas_ecu__REF.png` | `adas/` | 없음 | ADAS 제어기 3D 참고 | [ ] |
| 14 | `adas_ecu__CUT.png` | `adas/` | `adas_ecu__REF.png` | 카드 | [ ] |
| 15 | `tcu__CUT.png` | `network-diagnostics/` | 없음 | 텔레매틱스 제어기 카드(2D) | [ ] |

## 이미 있는 에셋 (다시 만들지 않기)
기존 7개 도메인과 충전(포트·OBC·DC 커넥터·AC 케이블), 통신·진단(CAN·진단 포트·진단 장비), 게이트웨이, VCU, 칠러·밸브·펌프·팬은 이미 있습니다. 위 15장이 새 EV 도메인(충전·히트펌프·ADAS·텔레매틱스)에 **추가로** 필요한 것입니다.
