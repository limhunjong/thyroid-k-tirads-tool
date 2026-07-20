# 단축키(KeyTips) 시스템 계획서

## 1. 목표

- **Alt + 숫자/알파벳** 조합으로 마우스 없이 주요 동작 실행
- **외울 필요 없음**: Alt를 누르고 있으면 화면의 각 대상 옆에 키 배지가 떠서,
  보고 누르면 됨 (MS Office 리본 KeyTips 방식)
- 기존 단독키 단축키(R, N, 1/2/3, Esc)는 그대로 유지 — Alt 체계는 그 확장

## 2. 발동 방식

| 동작 | 결과 |
|---|---|
| **Alt 누르고 있기** | 현재 화면의 모든 단축 대상 옆에 키 배지 표시 |
| **Alt 뗌 / Esc** | 배지 사라짐 |
| **Alt+키 동시 입력** | 배지 표시 여부와 무관하게 즉시 실행 |
| 입력창(텍스트/textarea) 포커스 중 | Alt 조합은 정상 작동 (단독키와 달리 타이핑과 충돌 없음) |

## 3. 키맵 설계

### 전역 (모든 탭)

| 키 | 동작 | 비고 |
|---|---|---|
| Alt+1 | Thyroid Nodule 탭 | 기존 `1` 유지 |
| Alt+2 | Lymph Node 탭 | 기존 `2` 유지 |
| Alt+3 | Extrathyroidal Lesion 탭 | 기존 `3` 유지 |
| Alt+R | Report 생성 | 기존 `R` 유지 |
| Alt+N | New Patient | 기존 `N` 유지 |
| Alt+M | Normal Study (all norMal) | 신규 |
| Alt+S | Save to NAS (서버 구동 시) | 신규 |
| Alt+Z | Undo (토스트 표시 중일 때) | 신규 |

### Thyroid Nodule 탭

| 키 | 동작 |
|---|---|
| Alt+P | Normal **P**arenchyma 확인 칩 토글 |
| Alt+O | N**o** thyroid nodule 확인 칩 토글 |
| Alt+Q | 오른쪽 엽 결절 추가 (+Add Right) |
| Alt+W | 협부 결절 추가 (+Add Isthmus) |
| Alt+E | 왼쪽 엽 결절 추가 (+Add Left) |

### Lymph Node 탭

| 키 | 동작 |
|---|---|
| Alt+L | No abnormal **L**ymph node 확인 칩 토글 |
| Alt+I | 다이어그램 모드 → **I**ndeterminate |
| Alt+U | 다이어그램 모드 → S**u**spicious |

### Report 다이얼로그 열림 중

| 키 | 동작 |
|---|---|
| Alt+C | **C**opy to Clipboard |
| Alt+N | New Patient |

### 예약/회피 조합 (사용하지 않음)

- **Alt+D, Alt+F, Alt+E(주소창/메뉴)** — 브라우저 예약과 겹치는 위험 조합 중
  D·F는 회피, E는 Chrome에서 안전 확인 후 사용 (충돌 시 대체키로 변경)
- **Alt+←/→** — 브라우저 뒤로/앞으로
- **Alt+Tab / Alt+F4** — OS 예약

## 4. 힌트 배지 UI

- 각 대상 요소에 `data-hotkey="P"` 속성 부여 → 렌더 함수가 자동으로 배지 생성
- 배지 스타일: 작은 알약형, `Alt+P` 표기, 진한 배경 + 흰 글자, 대상의
  우상단 모서리에 겹쳐 표시 (position: absolute)
- Alt를 누르는 동안만 `body.show-keytips` 클래스로 일괄 표시/숨김 —
  평소 화면은 지금과 완전히 동일 (시각적 비용 0)
- 현재 탭에 없는 대상의 배지는 표시 안 함 (숨겨진 요소 자동 제외)

## 5. 기술 유의사항

1. **macOS**: Option+글자는 특수문자를 입력함 (Option+P = π).
   `e.key` 대신 **`e.code`** (KeyP, Digit1) 기준으로 판정해 OS 무관하게 동작
2. **preventDefault**: Alt 단독 keyup이 브라우저 메뉴 포커스를 훔치는 것 방지
3. **입력창 포커스 중**: Alt 조합은 허용 (타이핑과 무충돌), 단독키는 기존대로 차단
4. **다이얼로그 열림 중**: 전역 키 차단, 다이얼로그 전용 키만 허용 (기존 로직 확장)
5. 배지는 `getBoundingClientRect` 기반 오버레이 1회 생성 → Alt 누를 때마다
   위치 재계산 (스크롤/리사이즈 대응)

## 6. 구현 단계

1. **인프라**: HOTKEYS 테이블(키 → 셀렉터/액션/컨텍스트), keydown/keyup 핸들러
   (`e.code` 기반), `body.show-keytips` 토글
2. **배지 렌더러**: data-hotkey 대상 수집 → 오버레이 배지 배치
3. **키맵 연결**: 위 표의 전역 + 탭별 + 다이얼로그 키
4. **회귀 테스트**: Alt+조합 실행(탭 전환·칩 토글·결절 추가·다이얼로그 Copy),
   배지 표시/숨김, macOS 시뮬레이션(e.code), 입력창 포커스 중 동작
5. **문서화**: README 단축키 표 갱신

## 7. 예상 규모

- 코드: CSS ~30줄 + JS ~120줄 (한 파일 내)
- 위험도: 낮음 (기존 기능 무변경, 추가 레이어)
