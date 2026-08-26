# 인수인계 (새 세션에서 먼저 읽을 것)

마지막 갱신: 2026-08-26 · 브랜치 `claude/hopeful-faraday-4vtgl9`

## 이 저장소가 무엇인가

갑상선 초음파 판독 도구. **HTML 파일 한 개**로 전부 동작한다 (`index.html`, 약 8,000줄).
외부 라이브러리 없음, 인터넷 없이 `file://`로 열림, 환자 정보는 그 PC 밖으로 나가지 않음.
이 세 가지가 설계의 근본 제약이므로 **깨뜨리지 말 것** — 빌드 도구나 CDN 의존성을 도입하지 않는다.

- 현재 버전: **ver2.0013** (`Thyroid_KTIRADS_ver2.0013.html` — 스냅샷은 **저장소 루트**에 있다.
  `versions/` 폴더에는 옛 ver0.x 계열만 남아 있다)
- **버전 번호는 ver1.52 다음에 ver2.0001로 다시 시작했다.** 소수 네 자리로 하나씩 올린다
  (`ver2.0001` → `ver2.0002`). ver1.53은 존재하지 않는다
- 파일명 규칙: `Thyroid_KTIRADS_verX.YYYY.html` — `index`나 다른 이름으로 만들지 말 것
- 탭 3개만 유지: Thyroid Nodule / Lymph Node / Extrathyroidal Lesion
  (Postop·RFA·Ethanol은 ver1.0x에서 의도적으로 삭제했다. 되살리지 말 것)

## 로컬 최초 설정

```bash
git clone https://github.com/limhunjong/thyroid-k-tirads-tool.git
cd thyroid-k-tirads-tool
git checkout claude/hopeful-faraday-4vtgl9
npm run setup                   # playwright + chromium (테스트에만 필요)
```

필요한 것은 Node.js(18 이상)와 Python 3뿐이다. 앱 자체는 빌드가 필요 없다 —
`index.html`을 브라우저로 열면 그대로 동작한다.

## 작업 전 반드시 실행

```bash
npm test                        # 58개 회귀 테스트, 전부 통과해야 정상
```

수정 후에도 다시 돌린다. 이 테스트는 "A를 고치니 B가 깨지는" 일이 반복돼서 만든 것이다.

## 안전 관련 — 절대 되돌리지 말 것 (ver1.13)

아무것도 입력하지 않았을 때 정상 판독문이 나가면 **누락을 정상으로 오인할 위험**이 있다.
그래서 명시적 확인 체크를 해야만 정상 판독문이 생성된다:

```js
state.normalThyroid = isThyroidStudyEmpty() && state.confirmNormalParenchyma && state.confirmNoNodule;
state.normalLymph   = isLymphStudyEmpty()   && state.confirmNormalLymph;
```

"빈 화면이면 그냥 정상으로 처리하자"는 방향의 제안은 하지 말 것.

ver2.0003부터 이 확인 3개는 화면에서도 따로 논다 — 확인 전 주황 점선, 확인 후 초록 채움,
해당 없을 때 흐림(`.confirm-chip`). 다른 칩과 같은 모양으로 되돌리지 말 것. 눌러야만
정상 판독문이 나간다는 것이 눈에 보여야 한다.

ver2.0010부터 **스터디가 완전히 비어 있는 동안에는 이 바를 숨긴다.** 그 구간은 `Normal Study`
버튼이 덮기 때문이다. 소견이 하나라도 생기면 바가 돌아오고, 그때부터는 `Normal Study`가
비활성화되므로 **칩이 유일한 확인 수단**이다 (결절 있음 + 림프절 정상이 가장 흔한 경우).
"칩이 중복이니 아예 없애자"는 제안이 나오면 이 점을 확인할 것 — 없애면 결절이 있는 환자는
판독문을 완성할 수 없다.

이 규칙은 ver1.53의 Prior Report 가져오기에도 그대로 적용된다. 이전 판독문에
"No abnormal lymph node"가 적혀 있어도 확인 체크는 켜지 않으며, **오늘 측정치
(`diamAP/T/L`)도 채우지 않는다** — 이전 크기는 `prevAP/prevT/prevL`에만 들어간다.
안 재고 넘어간 결절이 작년 크기로 판독문에 나가는 것을 막기 위한 것이므로
"편하게 오늘 칸까지 미리 채워두자"는 방향으로 바꾸지 말 것.

## 연구 데이터 수집 (ver2.0005)

New Patient를 누르면 결절 1행씩 사용자의 .xlsx에 바로 쌓인다. Research Data 다이얼로그에서
폴더를 연결하고 그 안의 워크북을 고르면 된다.

**크롬은 `file://`에서 바탕화면·문서 같은 최상위 폴더를 거부한다** ("이 폴더에는 시스템 파일이
포함되어 있으므로 file:///에서 열 수 없습니다"). 그 아래에 만든 **전용 하위 폴더**
(예: `문서/KTIRADS_research`)를 지정하면 열린다. 이 사실을 모르면 기능이 고장난 줄 알게 되므로
사용자에게 먼저 안내할 것.

워크북은 **절대 다시 만들지 않는다.** 시트 XML에 `<row>`만 끼워 넣는다 — 사용자가 나중에 손으로
채우는 FNA/CNB/OP 병리 열과 서식·셀 메모가 그대로 남아야 하기 때문이다. "엑셀 파일을 새로 생성해서
덮어쓰자"는 방향으로 바꾸지 말 것.

## 디자인 토큰 (ver2.0006~)

font-size와 border-radius는 **토큰만 쓴다.** 타입 스케일은 `--font-2xs`(11) ~ `--font-2xl`(17)
7단이고, 입력창은 `--font-xl`(16px)를 유지해야 한다 — 그 미만이면 모바일에서 포커스할 때 화면이
확대된다. monospace는 `--font-mono` 하나뿐이다.

회귀 테스트가 raw 값 **개수 예산**을 지킨다. 예산은 줄일 수만 있고 늘리면 안 된다 —
늘리는 순간 다시 20종으로 흩어진다.

칩은 2단 위계다. **주 입력 칩**(결절 옵션 등, 태블릿에서 손가락으로 누름) 16px/44px,
**보조 칩**(Quick·Risk 등) 13px/34px. 하나로 합치지 말 것.

색은 토큰을 통과해야 라이트 모드가 따라온다. 다만 **`#fff`는 예외다** — 파란·초록 채움 위
흰 글씨는 두 테마 모두 흰색이어야 하므로 `--on-accent`(불변 상수)를 쓴다. `--label1`로 바꾸면
라이트 모드에서 파란 버튼에 검은 글씨가 된다.

남은 raw 값은 의도된 것만이다 (반응형 `clamp`, SVG 뷰박스 좌표, 원형 `50%`, 그래버 `2px`).

높이는 **브레이크포인트별 사다리**다. 컨트롤은 `--control-min-h`(44 / 46 / 40px), 칩은
`--h-chip`(34px)를 따른다. 개별 선택자에 px를 다시 박지 말고 토큰을 재정의할 것.
높이도 테스트 예산이 걸려 있다.

**고정 `height`를 쓰지 말 것.** ver2.0008에서 고친 상단바 잘림이 정확히 그 원인이었다 —
`height: 30px`에 두 줄짜리 라벨이 들어가 잘렸다. `min-height`로 내용을 따라가게 둔다.

상단바 내용물은 한 줄에 **1084px**가 필요하다. 그보다 좁으면 넘치므로 ver2.0009에서
768~1099px는 두 줄로 접고, 가로 방향 짧은 화면(≤500px 높이)은 가로 스크롤로 처리했다.
상단바에 버튼을 더 추가하면 이 한계선이 올라가니 좁은 폭에서 반드시 재확인할 것.

## 크기 변화 자동 판정 (ver2.0013)

`calcSizeChangeInfo()`가 판정한다. **Increased** = 2축 이상 `≥20% & ≥2mm` 증가 또는 부피
`≥50%` 증가, **Decreased** = 그 대칭, 나머지는 **Stable**. 비교는 항상 **직전 크기**(`prev*`)
대 오늘이고, `sizeHistory`는 표시용이라 계산에 넣지 않는다.

- **감소 기준은 2015 ATA에 없다.** 가이드라인은 growth만 정의한다. 대칭 규칙은 이 도구의
  관례이므로 임상 판단이 다르면 바꿀 것.
- 부피는 세 축이 모두 있을 때만 쓴다 (타원체 `AP×T×L×0.524`).
- **판독의 선택이 항상 이긴다.** 버튼을 누르면 `sizeChangeManual`이 서고 자동값이 덮어쓰지
  않는다. "자동이 항상 맞으니 그냥 덮어쓰자"로 바꾸지 말 것 — 계산은 보조이고 판단은 사람이 한다.
- 근거(Δ, 부피 %, auto 판정)를 화면에 항상 노출한다. 숨기면 자동값을 검증할 방법이 없어진다.

## 과거에 실제로 터졌던 버그 (재발 주의)

| 증상 | 진짜 원인 |
|---|---|
| 새로고침하면 입력 내용이 전부 사라짐 (ver1.27, 심각) | 초기화 순서. 반드시 `loadState()` → `renderAll()` → `defaultExamDateToToday()` 순서 |
| Alt 단축키가 전부 먹지 않음 (ver1.39) | Escape가 입력창 가드에 먹혀 대화상자가 안 닫히고 갇힘. Escape 처리는 가드보다 **앞**에 |
| 글자가 위아래로 잘림 (4회 반복) | CSS `min-height: unset` 오버라이드. 44px 기본값을 상속하게 둘 것 |
| 드래그 후 다이어그램이 한 박자 늦게 갱신 | `lnDragActive` 렌더 락. `lnNeedsRender` 플래그로 해제 |

## 미완 / 보류 항목

- **발표자료 4번 슬라이드 문구 수정 필요.** `presentation/build_deck.py`에 "첫 요청은 한 문장이었습니다"라고
  적혀 있는데 이건 **근거 없는 서술**이다. ver0.1을 만든 실제 최초 프롬프트는 어디에도 기록이 없다
  (git 첫 커밋이 이미 ver0.1~0.10을 한꺼번에 담고 있고, CHANGELOG도 ver0.8부터만 있다).
  사용자가 실제 문장을 알려주면 인용구로 넣고, 못 찾으면 지어낸 인용처럼 보이지 않게 문구를 바꿀 것.
- NAS 수집 서버(B안): `save_report.php`가 아직 9개 열 기준이다. 연구용 58개 열로 갱신 필요.
  (ver2.0005에서 로컬 .xlsx 직접 누적이 되므로 우선순위는 내려갔다.)
- 판독문 샘플 1건을 받았고 Prior Report 파서의 기준 케이스로 테스트에 들어가 있다
  (`tests/report.test.cjs`의 `PRIOR_SAMPLE`). 도구가 **생성하는** 문장을 그 형식에
  맞춰 다듬는 일은 아직 남아 있다.
- Prior Report 후속(요청 시): 실질/임상정보/이전 biopsy 파싱, 캡처 이미지 붙여넣기
  (OS 내장 OCR 안내 + `TextDetector` 있으면 시도). 크기 이력 체인은 현재 마지막
  값만 쓰고 나머지는 확인 화면에만 보여준다.
- 미착수(요청 없었음): 태블릿 터치 드래그, JSON 백업/복원, 검증 무시하고 강제 생성, GitHub Actions CI

## 발표자료 (`presentation/`)

이 샌드박스에는 pptxgenjs·python-pptx가 없고 설치도 막혀 있어서 OOXML 작성기를 직접 만들었다.
LibreOffice도 고장나 있어(plain .txt조차 못 연다) 렌더 확인은 HTML 미러로 한다.

```bash
cd presentation
python3 render_html.py                          # build_deck.py 실행 + preview.html 생성
python3 check_pptx.py KTIRADS_vibecoding.pptx   # 구조 검증, errors: 0 이어야 함
```

**로컬에서는 사정이 다르다.** `npm install pptxgenjs`와 LibreOffice 설치가 가능하므로,
직접 만든 우회책(`pptxlite.py`, `render_html.py`, `check_pptx.py`)에 매일 필요가 없다.
슬라이드를 크게 손볼 일이 생기면 pptxgenjs로 다시 쓰는 편이 낫다
(`build_deck.js`가 그 방향으로 쓰다 만 초안이다). 문구만 고칠 거면 지금 구조 그대로가 빠르다.
LibreOffice가 있으면 `soffice --headless --convert-to pdf` → `pdftoppm`으로 실제 렌더 검수가 된다.

| 파일 | 역할 |
|---|---|
| `pptxlite.py` | 의존성 없는 .pptx 작성기 |
| `build_deck.py` | 슬라이드 19장 내용 + 발표 노트 |
| `render_html.py` | 동일 좌표계 HTML 미러 (시각 검수용) |
| `check_pptx.py` | 패키지 구조 검증 |
| `img/` | 버전별 HTML에서 뽑은 스크린샷 16장 |

Playwright는 전역 설치되어 있다 — `NODE_PATH=/opt/node22/lib/node_modules` 필요.

## 작업 방식에 대한 사용자 선호

- 큰 작업은 **먼저 계획을 보여주고 확인받은 뒤** 진행한다 (특히 연구 데이터셋 관련).
- 길이 단위는 전부 **mm**로 통일되어 있다.
- 디자인은 Thyroid Nodule 탭 기준으로 나머지 탭을 맞춘다. 체크표시 대신 **색상 변화로만** 선택 표시.
