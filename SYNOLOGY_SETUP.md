# 시놀로지 NAS 설치 안내 (Save to NAS 기능)

판독 결과를 NAS의 엑셀 호환 CSV 파일에 자동 누적하는 기능의 설치 방법입니다.
한 번만 설정하면 어떤 인트라넷 PC에서든 브라우저로 접속해 사용할 수 있습니다.

## 1. Web Station 설치

1. DSM에 관리자로 로그인 → **패키지 센터** → **Web Station** 설치
2. Web Station 실행 → **스크립트 언어 설정** → PHP 프로필이 없으면
   패키지 센터에서 **PHP 8.x** 패키지도 설치 후 기본 프로필 생성

## 2. 파일 배치

1. **File Station**에서 `web` 공유폴더 안에 폴더 생성 (예: `web/thyroid`)
2. 이 저장소의 두 파일을 그 폴더에 업로드:
   - `index.html`
   - `save_report.php`
3. Web Station → **웹 서비스 포털**에서 해당 폴더가 PHP 프로필로
   서비스되는지 확인 (기본 포털이 `web` 폴더 전체를 서비스하면 추가 설정 불필요)

## 3. 접속 및 사용

- 인트라넷 PC 브라우저에서 `http://<NAS-IP>/thyroid/index.html` 접속
- 서버로 접속하면 상단 바에 **Save to NAS** 버튼이 자동으로 나타납니다
  (`file://`로 열면 버튼이 숨겨집니다)
- 판독 완료 후:
  1. **Patient ID** 입력 (필수 — 없으면 저장 거부)
  2. **Save to NAS** 클릭 → "Saved to NAS — total N rows" 토스트 확인

## 4. 누적 데이터 위치

- `web/thyroid/data/thyroid_reports.csv` (첫 저장 시 자동 생성)
- UTF-8 BOM이라 **Excel에서 바로 열립니다** (한글 깨짐 없음)
- 열 구성: saved_at(서버 저장 시각) / exam_date / patient_id /
  ktirads_max / nodule_count / biopsy_indicated / ln_status /
  recommendation / report_text

## 5. 보안 유의사항

- 환자 식별정보가 저장되므로 **반드시 인트라넷 내부에서만** 서비스하세요
  (DSM 방화벽에서 외부 접근 차단, QuickConnect/포트포워딩으로 노출 금지)
- `data/` 폴더는 원내 규정에 맞게 백업하세요
- 필요 시 Web Station 포털에 DSM 계정 인증(액세스 제어 프로필)을 걸 수 있습니다

## 문제 해결

| 증상 | 확인 |
|---|---|
| Save to NAS 버튼이 안 보임 | `http://`로 접속했는지 확인 (파일 더블클릭 아님) |
| "Save to NAS failed: ..." | NAS에서 PHP 프로필 활성 여부, `web/thyroid` 쓰기 권한(http 그룹) 확인 |
| CSV 한글 깨짐 | 파일을 새로 생성하게 하거나(기존 파일 이동) Excel의 UTF-8 가져오기 사용 |
