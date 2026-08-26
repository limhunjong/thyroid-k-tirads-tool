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
npm run setup    # 최초 1회 — playwright + chromium 설치
npm test         # 44개 회귀 테스트 — 수정 전후로 실행, 전부 통과해야 한다
```

앱 자체는 빌드가 필요 없다. `index.html`을 브라우저로 열면 그대로 동작한다.

## 버전 관리

수정한 뒤 `Thyroid_KTIRADS_verX.YYYY.html`로 **저장소 루트에** 스냅샷을 남기고
`docs/CHANGELOG.md`에 추가한다. (`versions/` 폴더에는 옛 ver0.x 계열만 있다.)

버전 번호는 **ver2.0001에서 다시 시작했다.** 소수 네 자리를 쓰고 하나씩 올린다 —
`ver2.0001` → `ver2.0002` → `ver2.0003`. ver1.53은 존재하지 않으니 되살리지 말 것.
파일명 규칙은 `Thyroid_KTIRADS_verX.YYYY` — `index`나 다른 형식을 쓰지 않는다.

`package.json`의 `version`은 semver라 네 자리를 못 쓴다. `ver2.0001` → `2.0.1`,
`ver2.0012` → `2.0.12` 로 맞춘다.

앱 안의 버전 문자열은 `APP_VERSION` 상수 하나뿐이다. 탭 제목과 다운로드 파일명이
여기서 만들어지므로 스냅샷을 뜰 때 `APP_VERSION`도 같이 올린다.

## 작업 방식

큰 변경은 먼저 계획을 제시하고 확인받은 뒤 진행한다.
길이 단위는 mm로 통일한다. 선택 표시는 체크표시가 아니라 색상 변화로 한다.
