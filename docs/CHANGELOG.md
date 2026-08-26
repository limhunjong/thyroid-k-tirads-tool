# Changelog

## ver2.0012

- **Prior Report의 크기 이력을 더 이상 버리지 않는다.** `1.7x1.2x2.5 → 1.5x1.6x2.4 → 2.3x1.6x3.1
  → 1.93x1.30x2.69` 같은 체인에서 지금까지는 마지막 값만 `prev`로 담고 앞의 것들은
  "Earlier sizes (not imported)"로 보여주기만 했다. 이제 전부 결절에 담긴다.
- 결절에 `sizeHistory: [[AP, T, L], ...]` 배열이 생겼다 (mm, 오래된 순). 판독문에 날짜 칸이
  없으므로 **순서만** 보존한다. 직전 크기는 지금처럼 `prevAP/prevT/prevL`에 남는다.
- 판독문이 한 줄의 체인으로 나간다:
  `R1: mid, decreased (25×12×17 → 24×16×15 → 31×16×23 → 26.9×13×19.3 → 28×15×21 mm, +1.1 mm (+4%))`
- 증감 계산(Δ, significant growth 판정)은 **직전 크기 기준 그대로**다. 이력은 표시만 하고
  계산에 끼어들지 않는다.
- Size Change 행에서 이력을 직접 **추가·수정·삭제**할 수 있다. Prior Report 없이 예전 필름을
  보며 손으로 넣는 경우와, 잘못 파싱된 값을 지우는 경우를 위해서다.
- 연구 CSV·엑셀 58열에는 해당 칸이 없어 나가지 않는다.
- 회귀 테스트 추가 (56 → 57): 샘플 판독문의 세 개 이력이 순서와 축 배정까지 맞게 들어가는지,
  크기가 하나뿐인 결절이 없는 이력을 지어내지 않는지, 판독문이 체인으로 출력되는지,
  재렌더 후에도 남아 있는지.

## ver2.0011

- **칩 글씨 굵기를 하나로 맞췄다.** `.inline-check-label`과 `.check-group label` 기본 규칙에만
  `font-weight`가 빠져 있어 400을 상속하고 있었다. `.radio-group` 칩·Risk 칩·확인 칩·preset 칩은
  전부 600이라, Research Data의 multi-select 칩(PEF characteristics, Comet tail location, Halo,
  Specific features)과 위치 칩, `No prior exam`만 유독 가늘게 보였다.
- 이제 모든 옵션 칩이 선택 전 600, 선택 후 700이다.
- 회귀 테스트 추가 (55 → 56): 화면에 보이는 모든 옵션 칩의 계산된 `font-weight`가 600 미만이면
  실패한다. 어느 칩군이 빠지면 바로 잡힌다.
- 굵어진 만큼 글자 폭이 늘어나므로 1500·1024·768·390px에서 가로 넘침과 잘림을 ver2.0010과
  비교했다 — 양쪽 모두 0으로 동일하다.

## ver2.0010

- **아무것도 입력하지 않은 동안에는 확인 칩 바를 숨긴다.** 그 구간에서는 `Normal Study` 한 번이
  칩 세 개를 다 켜므로 칩은 같은 조작의 두 번째 사본일 뿐이었다. 첫 화면이 깨끗해진다.
- 소견이 하나라도 입력되면 바가 다시 나타난다. 이때부터는 `Normal Study`가 비활성화되므로
  칩이 **유일한** 확인 수단이다 (예: 결절 있음 + 림프절 정상).
- 숨겨진 칩은 단축키에도 응답하지 않는다 (`confirmChipActive()`). 보이지 않는 컨트롤이
  Alt+P로 상태를 바꾸는 것은 단축키가 없는 것보다 나쁘다. 빈 화면에서는 Alt+M(Normal Study)만 뜬다.
- Lymph 탭 액션 바를 `justify-content:flex-end` + `.confirm-bar { margin-right:auto }`로 바꿔
  바가 숨겨져도 `Reset Lymph Node`가 오른쪽에 남게 했다.
- **안전 규칙은 그대로다.** 명시적으로 누르지 않으면 정상 판독문이 나가지 않고, 어느 경로로도
  확인을 건너뛸 수 없다. 눌러야 할 것이 하나뿐인 구간에서 하나만 보여줄 뿐이다.
- 테스트: 빈 화면에서 바가 숨겨지고 소견 입력 시 돌아오는지, 숨겨진 칩이 단축키 배지를 내보내지
  않는지 검사한다. 기존 KeyTips·hotkey trap 테스트는 빈 화면에서 유효한 Alt+M 기준으로 갱신했다.

## ver2.0009

**상단바 버튼이 화면 밖으로 나가 안 눌리던 문제를 고쳤다.** 실측해보니 상단바 내용물은
1084px를 요구하는데 `flex-wrap: nowrap` + `overflow: visible`이라, 그보다 좁으면 오른쪽
버튼들이 그냥 화면 밖으로 밀려났다. 아이패드 세로(768·834px)에서 Reset All·연구 데이터·
다운로드·테마 버튼을 아예 누를 수 없었다.

- **768~1099px**: 두 줄로 접는다. 767px 이하에 이미 있던 `.top-spacer` 방식을 그대로 쓰되
  타이포는 데스크톱 그대로 둔다 — 줄바꿈만 바뀐다. 바 높이 56 → 102px, 본문 여백은
  `adjustMainTop()`이 이미 실측해서 따라간다.
- **가로 방향 짧은 화면**(폰 가로, 높이 ≤500px): 두 줄로 접으면 390px짜리 화면의 20%를
  먹으므로 대신 **가로 스크롤**로 바꿨다. 바는 40px를 유지하고 옆으로 밀어 끝까지 닿는다.
  스크롤바는 감췄다.
- 검사: 7개 화면 크기에서 마지막 버튼까지 도달 가능하고 잘림 0건.
  1500·1024·768·390px에서는 스크롤이 필요 없고, 844×390·932×430·667×375에서는
  스크롤로 끝까지 닿는다.

## ver2.0008

디자인 통일 3단계 — 컨트롤 높이. 조사해보니 높이 20종은 드리프트가 아니라 **브레이크포인트별
사다리**였다 (데스크톱=보통, 좁은 화면=터치용으로 크게, 가로 짧은 화면=압축). 진짜 문제는
같은 성격의 컨트롤이 **같은 화면폭에서 서로 다른 높이**를 갖는 것이었다.

- 컨트롤 5종(`input`·`select`·`.radio-group label`·`.check-group label`·`.inline-check-label`)이
  ≤767px에서 44·44·46·46·48px로 흩어져 있던 것을 `--control-min-h` 하나로 모았다. 사다리는
  이제 브레이크포인트마다 토큰을 재정의하는 방식이라 한 곳에서 읽힌다 (44 / 46 / 40px).
- 결과 변화: 기본 화면에서 `.check-group label`·`.inline-check-label` 42→44px,
  ≤767px에서 `input`·`select` 44→46px·`.inline-check-label` 48→46px,
  가로 짧은 화면에서 `input`·`select` 38→40px.
- 34px 칩군에 `--h-chip` 이름을 붙였다 (값 변화 없음).
- **가로 방향 짧은 화면에서 상단바 `Report`·`Reset All` 글자가 잘리던 버그를 고쳤다.**
  30px로 못박은 높이 안에서 라벨이 두 줄로 접혀 잘렸다. HANDOFF가 4번 재발했다고 적어둔
  바로 그 유형이라, 같은 처방(고정 `height` 제거, `min-height`로 내용을 따라가게)을 적용했다.
- 검사: 11개 화면 크기(1500~667px, 세로·가로)에서 **글자 잘림 0건**. 변경 전 ver2.0007에서는
  844×390과 932×430에서 4건이 잡혔다.
- 회귀 테스트에 높이 예산을 추가했다 (raw px 높이 54개). font-size·radius와 마찬가지로 줄어들 수만 있다.

**남은 기존 버그 (이번 변경과 무관, 전후 수치 동일):** 상단바가 좁은 화면에서 넘친다 —
768px에서 316px, 834px에서 250px, 1024px에서 60px. 아이패드 세로에서 오른쪽 버튼들이
화면 밖으로 밀린다는 뜻이라 별도로 다룰 필요가 있다.

## ver2.0007

디자인 통일 2단계 — 어긋난 값을 스케일에 붙이고 색을 토큰으로 옮겼다.

- **라이트 모드에 다크용 진한 틴트가 깔려 있던 12곳을 고쳤다.** 다크 모드는 한 곳도 바뀌지 않는다.
  `rgba(10,132,255,0.18)`(다크 `--blue-bg` 값)을 raw로 박아둔 5곳, `--fill2`·`--red-bg`·`--orange`
  각각의 다크 값, `body.light` 안의 `#000000` 2곳이 이제 토큰을 통과한다.
- **`#fff` 22곳은 바꾸지 않았다.** 파란·초록 채움 위 흰 글씨라 라이트 모드에서도 흰색이 맞다.
  `--label1`로 치환했으면 파란 버튼에 검은 글씨가 됐을 것이다. 대신 두 테마에서 불변인
  `--on-accent`·`--surface-solid` 상수 토큰으로 의미를 붙였다.
- 어긋난 font-size 10곳을 스케일로 스냅했다: `11.5→12`, `12.5→13`, `13.5→13`, `14.5→15`,
  `18→17`, `10→11`(상단 탭·섹션 캐럿·탭 버튼).
- raw border-radius 10곳을 토큰으로: `6·7·9px→--r-xs`, `14·15px→--r-lg`, `26px→--r-pill`.
- 반복되던 파란 틴트 2종에 `--blue-line`·`--blue-tint` 이름을 붙였다 (8곳).
- 남은 raw 값은 **의도된 것만**이다 — font-size 3개(반응형 `clamp` 1개, SVG 뷰박스 좌표 2개),
  radius 6개(원형 `50%` 3, 그래버 `2px` 2, 한쪽 모서리 1). 테스트 예산을 13→3, 16→6으로 줄였다.
- 하드코딩 색상 168회/113종 → 125회/104종.
- 확인: 상단바 넘침과 글자 잘림을 1024·1280·1440·1500px에서 검사했다. 1024px 넘침 60px은
  **이번 변경 전에도 동일**했던 기존 문제다 (10→11px 때문이 아니다).

## ver2.0006

디자인 통일 1단계 — **화면은 1px도 바뀌지 않는다.** 전후 스크린샷 24장(데스크톱/태블릿/모바일
× 다크/라이트 × 4개 상태)이 바이트 단위로 동일한 것을 확인했다.

- 타입 스케일을 실제 쓰임에 맞춰 다시 깔았다. 기존 토큰은 가장 많이 쓰이는 12·14px에 이름이
  없어서(그래서 다들 raw px를 썼다) `--font-2xs`(11) ~ `--font-2xl`(17) 7단으로 재정의했다.
- 기존 `var(--font-*)` 32곳을 계산값이 그대로이도록 재매핑하고, raw px font-size **145곳**을
  토큰으로 바꿨다. HTML 인라인 `style=`과 JS `cssText`까지 포함한다.
- `--font-md`와 `--font-base`가 둘 다 16px로 중복이던 것을 정리했다 (`--font-base` 삭제).
- border-radius raw 값 17곳을 `--r-*`로, 알약형은 `--r-pill`로 바꿨다.
- monospace 스택이 3종류이던 것을 `--font-mono` 하나로 통일했다.
- 입력창은 16px(`--font-xl`)를 유지한다 — 그 미만이면 모바일 브라우저가 포커스 시 화면을 확대한다.
- 회귀 테스트 1개 추가 (54 → 55): raw font-size/radius **개수 예산**을 걸어 새 raw 값이 들어오면
  실패한다. 예산은 줄어들 수만 있다. `--font-base` 부활과 monospace 스택 재분화도 막는다.

남은 것 (2·3단계): `11.5px`·`12.5px`·`10px` 같은 어긋난 값 13곳, raw radius 16곳,
하드코딩 색상(hex 23종·rgba 129종), 컨트롤 높이 20종.

## ver2.0005

- **연구 데이터가 사용자의 .xlsx에 직접 누적된다.** New Patient를 누르면 결절 1행씩
  지정한 엑셀 워크북에 추가된다. 열 구성(58열)은 이전부터 연구 시트와 일치하고 있었다.
- 라이브러리 없이 .xlsx를 읽고 쓴다 — 브라우저 내장 `CompressionStream`/`DecompressionStream`과
  직접 만든 CRC32로 ZIP을 다룬다. `file://`에서 그대로 동작한다.
- **워크북을 다시 만들지 않는다.** 시트 XML의 `</sheetData>` 바로 앞에 `<row>`만 문자열로 끼워
  넣고 나머지 바이트는 건드리지 않는다. 그래서 열 너비·굵은 헤더·셀 메모, 그리고 **나중에 손으로
  채우는 FNA/CNB/OP 병리 열**이 전부 보존된다. 문자열은 `inlineStr`로 넣어 `sharedStrings.xml`도
  손대지 않는다.
- 대상 워크북은 Research Data 다이얼로그에서 폴더 안의 .xlsx 중에 고른다. 엑셀 잠금 파일(`~$…`)과
  도구가 만든 `*_backup.xlsx`는 목록에서 제외된다.
- 안전장치: 쓰기 전 직전 버전을 `*_backup.xlsx`로 남기고, CSV 미러와 localStorage 백업도 계속 쓴다.
  헤더 열 수가 데이터와 다르면 **쓰지 않고 거부**한다 (엉뚱한 워크북에 58열을 쏟지 않도록).
- 엑셀에서 파일을 열어둔 채로는 저장이 실패한다. 실패를 조용히 넘기지 않고 토스트로 알린다.
- 회귀 테스트 1 → 3개 추가 (53 → 54): 실제 .xlsx 픽스처로 ① 시트 외 엔트리가 하나도 바뀌지 않는지
  ② 셀 메모가 살아남는지 ③ 백업이 쓰기 직전 원본과 바이트 단위로 같은지 ④ 열 수가 안 맞으면 거부하는지.

## ver2.0004

- `REQUIRED FOR A NORMAL REPORT` 캡션을 확인 칩 **위로** 올려 세로로 쌓았다 (Thyroid·Lymph 두 탭 모두).
  Lymph 탭의 `Reset Lymph Node` 버튼은 캡션이 아니라 칩 줄과 같은 높이에 오도록 맞췄다.
- Risk Factor 문구를 뜻이 드러나게 고쳤다:
  `FHx thyroid cancer` → `FHx. thyroid cancer`, `Neck RT Hx` → `Neck RT Hx.`,
  `Hemithyroidectomy (ca)` → `Hemithyroidectomy for cancer`.
- FHx 개수 입력칸이 `n` 하나뿐이라 툴팁을 봐야 뜻을 알 수 있던 것을, 옆에 `affected relatives`를
  상시 표시하도록 바꿨다. 화면만 보고 "갑상선암 가족 2명"으로 읽힌다.
- Risk 라벨은 UI 전용이라 판독문·연구 CSV(숫자 코드 사용)에는 영향이 없다.
- 회귀 테스트 1개 추가 + 기존 게이트 테스트 확장 (51 → 52): 캡션이 칩보다 위에 있는지(경계 상자 비교),
  라벨 문구와 단위 텍스트가 화면에 보이는지.

## ver2.0003

- **정상 판독문을 여는 확인 3개(Normal parenchyma / No thyroid nodule / No abnormal lymph node)를
  다른 형식으로 분리했다.** 지금까지는 테두리도 없는 흐린 회색 글씨라 선택적인 빠른 버튼처럼 보였다.
  이제 확인 전에는 **주황 점선**(해야 할 일), 확인 후에는 **초록 채움**(끝난 일), 소견이 입력되어
  해당 없을 때는 흐려진다. 각 바에 `REQUIRED FOR A NORMAL REPORT` 캡션을 달았다.
- 선택 표시는 여전히 색상 변화만 쓴다 (체크표시 없음).
- Clinical Risk Factor 칩을 그 아래 QUICK 칩과 같은 타입 스케일로 맞췄다 (13px / 600 / 34px).
  두 줄이 한 가족으로 읽힌다. FHx 옆 개수 입력칸 높이도 같이 맞췄다.
- 회귀 테스트 1개 추가 (50 → 51): 확인 칩이 전용 클래스를 갖는지, 확인 전/후 테두리가
  점선/실선으로 갈리는지, 캡션이 두 바에 다 있는지, risk 칩과 quick 칩의 타입 스케일이 같은지.

## ver2.0002

- 탭 제목이 `ver0.85`에 68개 버전 뒤처져 있던 것을 고쳤다. 제목은 이제 `APP_VERSION`에서
  자동으로 만들어지므로 버전 문자열은 `APP_VERSION` 한 곳만 올리면 된다.
- **Download current version 버튼이 없는 파일을 받으려 하던 버그 수정.** 파일명을
  `Thyroid_K-TIRADS_verX.html`로 만들고 있었는데 실제 스냅샷은 `Thyroid_KTIRADS_verX.YYYY.html`이다.
- `APP_VERSION`을 `ver1.52` → `ver2.0002`로 맞췄다.
- 회귀 테스트 1개 추가 (49 → 50): 탭 제목·버튼 툴팁·다운로드 파일명이 모두 같은 버전을 가리키는지 검사.

## ver2.0001

버전 번호를 여기서 다시 시작한다. ver1.52 다음은 ver1.53이 아니라 **ver2.0001**이고,
이후로는 `ver2.0002`, `ver2.0003` … 처럼 소수 네 자리로 올린다.

- Added **Prior Report** import: paste a previous report and the follow-up nodules are prefilled.
- Parsed per nodule: side/label (R1, Lt., isthmus, or the section header above), location (upper/mid/lower), the **last** size in a `a -> b -> c` chain, composition, echogenicity, orientation, margin, calcifications, and comet tail artifact. Sizes convert cm to mm; axis order is selectable (L x T x AP by default).
- Wrapped report lines are joined to the nodule line above them, so findings that spill onto a second line are not lost.
- Negated features ("without microcalcification") are not imported.
- Imported nodules are marked as Follow-up and only their **previous** size is filled — today's diameters stay empty on purpose, so an unmeasured nodule can never leave with last year's size.
- The normal-study confirmations are never set by an import: wording such as "No abnormal lymph node" in the old report cannot confirm today's study (ver1.13 rule).
- Every parsed item is shown for review before it is applied, unrecognised lines are listed instead of dropped, and Apply is undoable.
- Regression tests: 44 -> 49.
- 파일명 규칙 변경: `Thyroid_KTIRADS_verX.YYYY.html` (소수 네 자리).

## ver0.39

- Restored the Thyroid diagram light-mode card background styling so the day-mode diagram no longer appears black.
- Centered the Postop diagram more consistently in its section.
- Added Thyroid-like drag/resize behavior for Postop residual nodules and draggable Postop op-bed lesion markers.

## ver0.38

- Made the Postop diagram open a popup input window on click, matching the Thyroid diagram behavior instead of only scrolling to cards.
- Tightened the Postop diagram shell so its visible size stays closer to the Thyroid diagram reference layout.
- Kept the 3-compartment Postop anatomy map and residual-vs-op-bed state logic intact while improving the input flow.

## ver0.37

- Consolidated the visible Postop UX into a Thyroid-style three-compartment layout driven by the operative anatomy map.
- Kept the residual-vs-op-bed split internally for compatibility, but rendered the visible section with Right / Isthmus / Left compartments and dynamic labels based on operation status.
- Removed visible `residual` wording from diagram labels, hints, section titles, and report text so remaining thyroid tissue keeps its anatomical names while only removed structures are shown as thyroidectomy sites.
- Synchronized Postop diagram, card titles, and report labels with the same operation-state-driven anatomy map and kept the single-file HTML runnable.

## ver0.36

- Added a hybrid `with Isthmusectomy` checkbox that becomes available for `Right lobectomy` and `Left lobectomy`, persists in Postop state, and is automatically cleared/disabled for `Total thyroidectomy`, standalone `Isthmusectomy`, and `Other / Custom`.
- Added an anatomy mapping engine for postoperative right/isthmus/left sections so residual thyroid tissue and thyroidectomy-site/op-bed labels switch dynamically between `Right Lobe`, `Left Lobe`, `Isthmus`, `Right Thyroidectomy Site`, `Left Thyroidectomy Site`, `Isthmusectomy Site`, and `Central / Isthmus Bed`.
- Synchronized section headers, residual nodule card titles, op-bed lesion card titles, SVG `<title>` tooltips, clickable diagram zones, and report text with the dynamic anatomical labels.
- Updated report Findings/Conclusion/Recommendation text to distinguish residual thyroid parenchymal nodules from thyroidectomy site / operation bed lesions.
- Hardened Postop state hydration so residual nodule and op-bed lesion arrays remain available while the operation type is changed repeatedly.
- Verified JavaScript syntax and browser scenarios for right/left lobectomy with and without isthmusectomy, total thyroidectomy mutual exclusion, standalone isthmusectomy, diagram click-to-add, dynamic labels, and report output.

## ver0.35

- Replaced the Postop section-card diagram with a clickable thyroid-style postoperative SVG diagram that reuses the existing visual language.
- Operation-type anatomy is now visible in the diagram: right lobectomy shows `Right Op. Bed` plus residual `Isthmus` and `Left Lobe`; isthmusectomy shows residual `Right Lobe` and `Left Lobe` plus `Isthmus Op. Bed`; total thyroidectomy shows op-bed/central thyroidectomy sites.
- Clicking residual thyroid tissue in the Postop diagram adds a residual thyroid nodule with the clicked lobe/zone prefilled.
- Clicking dashed thyroidectomy-site/op-bed regions adds a corresponding operation-bed lesion card.
- Removed the bottom `아래 판독문에 추가하기` checkbox/label.
- Verified JavaScript syntax and browser scenarios for operation-type diagram mapping, diagram click-to-add behavior, marker creation, and removal of the bottom add-to-report option.

## ver0.34

- Added a new top-level `Postop` tab between `Thyroid` and `Cervical Lymph Node`, preserving the existing tab styling and overall app design language.
- Added operation-type-driven section rendering for right lobectomy, left lobectomy, total thyroidectomy, isthmusectomy, and custom/other postop anatomy.
- Added postop operation-bed lesion cards with existing nodule-card visual styling, dedicated op-bed lesion fields, automatic impression-category suggestions, deletion, and lesion-level reset.
- Added separate Postop state for residual thyroid nodules and op-bed lesions so the original Thyroid tab nodule state and K-TIRADS calculation logic are not directly polluted.
- Integrated Postop findings, residual thyroid nodules, recommendations, Postop reset, op-bed reset, residual nodule reset, and global reset behavior into the live preview workflow.
- Verified JavaScript syntax and browser scenarios for operation-type section visibility, op-bed lesion add/delete, residual nodule add/delete, suspicious-recurrence auto-impression, preview text generation, and reset behavior.

## ver0.33

- Increased small UI typography tokens and supporting label/chip text sizes so previously tiny labels, preset chips, section headers, and preview title are easier to read.
- Reworked nodule card headers to show `Nodule R1`, `Nodule I1`, and `Nodule L1` as clear blue-tinted pills.
- Removed the empty K-TIRADS dash badge from nodule headers when no K-TIRADS category has been calculated yet; the badge appears only when a real value exists.
- Anchored the Report Preview close `×` button absolutely to the preview pane's upper-right corner across desktop, tablet/mobile sheet, and compact landscape layouts.
- Verified JavaScript syntax, browser-computed nodule header text/no-dash state, preview close button position, and absence of console errors.

## ver0.32

- Reworked nodule option controls into a tokenized equal-grid button system using shared CSS variables for column width, gaps, minimum height, and horizontal padding.
- Fixed selected blue backgrounds in multi-option groups so examples like `Macro` and `Rim` use the same rectangle width/height with symmetric left/right padding.
- Applied the same systematic layout to two-option and 3+ option nodule rows while keeping sparse rows compact rather than stretching them across the full column.
- Verified representative nodule option groups including Echogenic foci, Orientation, Diffuse lesion, Margin, Composition, Echogenicity, and Vascularity.

## ver0.31

- Changed isthmus nodule `Location` controls from `Upper / Middle / Lower` to optional `Right / Left / Paraisthmus` modifiers.
- Enforced mutual exclusivity between `Right` and `Left` for isthmus nodules while allowing `Paraisthmus` to combine with either side.
- Allowed no isthmus location modifier as a valid central-isthmus state; validation no longer requires Location for isthmus nodules, but still requires Location for right/left lobe nodules.
- Updated report formatting so central isthmus nodules omit the extra location comma, while selected modifiers appear as text such as `Right Paraisthmus`.
- Kept diagram-created isthmus nodules valid without auto-setting `Middle`, and verified diagram popup/card location UI synchronization.

## ver0.30

- Fixed the Diagram-opened nodule Quick add row where `PTC` and `Follicular Neoplasm` still looked vertically off because the surrounding `.preset-strip.in-card` had asymmetric top/bottom padding.
- Made `.preset-strip` padding symmetric and gave in-card preset strips a control-height row with centered alignment.
- Set preset chips to a fixed 34px height with zero vertical padding and centered flex alignment, producing equal top/bottom spacing in both the popup and nodule add areas.
- Verified JavaScript syntax, browser-computed popup Quick add top/bottom gaps, and visual alignment in the Diagram nodule popup and below-diagram nodule add area.

## ver0.29

- Centered QUICK ADD preset-chip labels such as `PTC` and `Follicular Neoplasm` by converting `.preset-chip` to `inline-flex` with `align-items: center` and `justify-content: center`.
- Removed asymmetric vertical chip padding in favor of fixed min-height plus symmetric horizontal padding so labels sit visually centered in rounded buttons.
- Verified JavaScript syntax, browser-computed preset-chip alignment, and visual centering of both top-level and in-card QUICK ADD chips.

## ver0.28

- Refined nodule option-control layout so sparse long choices such as `Extensive parenchymal PEF` and `Diffuse infiltrative lesion` stay compact instead of stretching with excessive right-side whitespace.
- Added equal-width wrapping grid behavior for nodule option sections with 3+ choices, improving alignment and consistency across Composition, Echogenicity, Margin, Echogenic foci, Vascularity, and ETE-style groups.
- Preserved compact two-option groups such as `Initial` / `Follow-up` and long diffuse lesion choices without forcing full-row expansion.
- Changed validation errors triggered by `판독문` from bottom-sheet placement to a centered alert dialog, and removed the inline `max-width:500px` override so centered alert CSS applies consistently.
- Verified JavaScript syntax, browser-computed control widths, compact long-option groups, equal-width 3+ groups, and centered validation dialog placement.

## ver0.27

- Fixed visual centering for Date `Year` / `MM` / `DD` selects by removing asymmetric select padding and assigning explicit compact date widths.
- Applied the same date-select sizing to dynamically generated biopsy date controls via `data-date-part` attributes.
- Changed segmented controls from full-row stretching to compact `fit-content` sizing with similar button widths.
- Removed mobile `radio-group` forced `width:100%` and `label flex:1`, so sparse groups such as `Initial` / `Follow-up` keep natural, consistent widths.
- Verified JavaScript syntax, browser-computed date select alignment, compact segmented group widths, and visual layout in browser.

## ver0.26

- Added shared typography/control tokens for more consistent font sizing across the tool.
- Increased base body/form typography for better legibility while preserving the existing compact clinical layout.
- Center-aligned text and placeholders inside text inputs and selects, including Clinical Information `custom` and Thyroid Size AP/T/L boxes.
- Standardized segmented controls, checkbox labels, table labels, date selects, nodule cells, and lymph-node table typography/weights.
- Verified JavaScript syntax and browser-computed styles for centered inputs/selects and larger consistent font sizes.

## ver0.25

- Replaced single-item Diagram delete restore with a multi-item delete history stack.
- Repeated `복원` clicks now restore previously deleted nodules sequentially, not only the immediately deleted one.
- The inline Diagram undo bar now shows how many deleted nodules remain restorable.
- Updated the top-right `판독문` button styling: inactive state uses a white background, while active preview state changes to green with white text.
- Verified JavaScript syntax, multi-item delete/restore behavior, and inactive/active report button colors in browser.

## ver0.24

- Reduced QUICK ADD presets to only `PTC` and `Follicular Neoplasm`.
- Added QUICK ADD to existing nodule forms, including nodules opened from the Diagram popup, so presets can be applied after diagram-based nodule creation.
- Redesigned Diagram span resize controls from plain blue circles into polished blue pill-shaped grip handles with subtle stems and grip marks.
- Verified PTC/Follicular preset application, popup QUICK ADD rendering, and handle SVG shape replacement in browser.

## ver0.23

- Split Diagram marker interactions into two explicit modes.
- Dragging the marker body now moves/repositions the nodule while preserving span size: single-zone stays single-zone, two-zone stays two-zone, and three-zone stays Upper-to-lower.
- Added separate blue upper/lower span handles; dragging these handles changes the location span/marker size intentionally.
- Verified body drag `Middle → Lower` becomes `Lower`, handle drag `Middle → Lower` becomes `Middle to lower`, and body drag `Upper to middle → Lower` shifts to `Middle to lower`.

## ver0.22

- Fixed existing Diagram marker drag so a marker dragged from Middle to Lower is recognized as `Middle to lower`, not only `Lower`.
- Existing markers now support left-click drag span editing within the same lobe: Middle→Lower, Middle→Upper, Upper→Lower, and shifting Upper-to-middle downward to Middle-to-lower.
- Dropped multi-zone markers are re-centered on the selected zone span so the visual ellipse continues to cover the recognized locations.

## ver0.21

- Diagram marker drag now updates the nodule `Location` state to match the marker's dropped anatomical zone.
- Moving an existing marker to Upper / Middle / Lower updates the corresponding Location checkbox and downstream report text.
- The nodule edit popup refreshes after a diagram drag so visible Location checkboxes stay synchronized.

## ver0.20

- Standardized the Diagram nodule marker delete `×` badge position.
- The badge now uses a fixed marker-local upper-right offset instead of changing with marker ellipse size or active-state size.
- This keeps the `×` placement visually consistent across single-zone, multi-zone, and active markers.

## ver0.19

- Report Preview is hidden by default on desktop so the main form can use the full screen width.
- The top-right `판독문` button now toggles the live Report Preview pane instead of requiring the preview to stay permanently visible.
- When the preview is opened, the app temporarily reserves right-side space; closing it restores full-width editing.
- On tablet/mobile, the same `판독문` button opens the existing bottom-sheet preview behavior.

## ver0.18

- Repositioned the Diagram marker delete `×` badge so it remains close to the nodule but no longer covers the center `R1` / `L1` label.
- Reduced the delete badge size slightly and placed it just outside the marker's upper-right edge.
- Verified the delete circle does not overlap the marker label bounding box, while deletion and one-step restore still work.

## ver0.17

- Moved the Diagram marker delete `×` badge closer to the marker itself.
- The delete badge now overlaps the marker's upper-right shoulder using proportional offsets, so it remains visually attached for both small circular markers and taller multi-zone ellipses.
- Preserved in-diagram deletion and one-step restore behavior from ver0.16.

## ver0.16

- Diagram is now visible by default when the Thyroid Nodule section loads.
- Diagram sizing is responsive and expands toward the largest practical size for the current viewport while preserving the SVG aspect ratio.
- Added a small red `×` delete control above each Diagram nodule marker for quick in-diagram deletion.
- Added one-step restore for accidental Diagram deletion via an inline `복원` undo bar.

## ver0.15

- Added fine-grained Diagram marker positioning with persisted `diagramX` / `diagramY` coordinates.
- Dragged markers now remain at the exact dropped SVG position instead of snapping back to fixed zone centers.
- Newly added Diagram nodules are placed at the clicked/dropped point within the selected lobe.
- Coarse location flags and report text still follow Upper / Middle / Lower zone logic, while the marker can be visually positioned more precisely.

## ver0.14

- Added a live ghost marker while dragging an existing Diagram nodule marker.
- The dragged nodule now follows the mouse cursor visually during movement.
- The original marker is dimmed during drag, while the cursor-following marker remains prominent.
- Drop behavior from ver0.13 is preserved: releasing the marker updates the existing nodule location and report.

## ver0.13

- Added drag-to-move interaction for existing Diagram nodule markers.
- Dragging a marker updates the nodule's stored location and generated report without creating a duplicate nodule.
- Dragging a single-zone marker reassigns it to the dropped zone; dragging a two-zone marker preserves a two-zone span when moved.
- Markers can be moved across right lobe, left lobe, and isthmus when the destination lobe is not full.
- Clicking a marker still opens the existing edit popup.

## ver0.12

- Enlarged the interactive Diagram display from 320px to 640px width.
- Removed redundant side `R` / `L` orientation pills while keeping the bottom `Right` / `Left` labels.
- Changed Diagram markers from fixed circles to ellipses.
- Multi-zone dragged nodules now render as taller vertical markers spanning the selected zone range, including Upper to middle and Upper to lower.

## ver0.11

- Moved Diagram bottom `Right` / `Left` labels upward so they no longer overlap the rounded diagram box border.
- Added click-and-drag zone selection in the Diagram.
- Dragging within the same lobe now creates multi-zone nodules such as Upper to middle, Middle to lower, or Upper to lower.
- Single-zone click behavior is preserved.

## ver0.10

- Redesigned the interactive Diagram thyroid schematic.
- Replaced plain ellipse/rectangle anatomy with smoother SVG path lobes and curved isthmus.
- Added subtle gradients, soft shadow, rounded background, zone divider lines, and R/L orientation pills.
- Preserved all existing click-zone IDs and behavior.

## ver0.9

- Fixed Extrathyroidal Lesion textarea state handling.
- Added explicit input handler so typed text updates `state.extraLesion`.
- Confirmed Extrathyroidal Lesion appears in Findings and Conclusion.

## ver0.8

- Improved Bethesda and CNB category select row layout.
- Prevented long option text from expanding outside nodule card boundaries.

## ver0.7

- Corrected lobe order to Right lobe → Isthmus → Left lobe.

## ver0.6

- Hid Follow-up subtype choices when Initial is selected.

## ver0.5

- Converted Size Change Initial / Follow-up controls to mutually exclusive radio behavior.

## ver0.4

- Fixed size input blur/click race that sometimes required double-clicking subsequent controls.

## ver0.3

- Fixed mobile/narrow nodule-card layout overflow by stacking label/data cells and wrapping controls.

## ver0.2

- Restructured biopsy section into Previous Biopsy and Current Biopsy.
- Added nodule-level previous biopsy entries and current biopsy procedure details.

## ver0.1

- Baseline original HTML tool.
