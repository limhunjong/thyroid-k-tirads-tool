# Thyroid K-TIRADS Reporting Tool

**작업을 시작하기 전에 `docs/HANDOFF.md`를 읽을 것.** 과거 버그, 보류 항목, 하지 말아야 할 것이 정리되어 있다.

## 근본 제약 (깨뜨리지 말 것)

- **HTML 파일 한 개**로 전부 동작한다 (`index.html`). 빌드 도구, npm 패키지, CDN 링크를 도입하지 않는다.
- 인터넷 없이 `file://`로 열려야 한다. 외부 서버와 통신하지 않는다.
- 환자 정보는 그 PC 밖으로 나가지 않는다.
- 탭은 3개만: Thyroid Nodule / Lymph Node / Extrathyroidal Lesion.
- 아무것도 입력하지 않았을 때 정상 판독문이 나가면 안 된다. 명시적 확인 체크가 있어야만 생성된다.

## 명령

```bash
node tests/report.test.cjs    # 44개 회귀 테스트 — 수정 전후로 실행, 전부 통과해야 한다
```

## 버전 관리

수정한 뒤 `versions/Thyroid_KTIRADS_verX.YZ.html`로 스냅샷을 남기고 `docs/CHANGELOG.md`에 추가한다.
파일명 규칙은 `Thyroid_KTIRADS_verX.YZ` — `index`나 다른 형식을 쓰지 않는다.

## 작업 방식

큰 변경은 먼저 계획을 제시하고 확인받은 뒤 진행한다.
길이 단위는 mm로 통일한다. 선택 표시는 체크표시가 아니라 색상 변화로 한다.
