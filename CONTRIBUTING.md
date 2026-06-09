# MongPass 기여 가이드

MongPass는 한국 거주 몽골인의 생활 정보 접근성과 커뮤니티 연결을
개선하기 위한 오픈소스 프로젝트입니다. 개발, 디자인, 번역, 문서,
접근성, 지역 정보 검증 기여를 환영합니다.

## 기여 전 확인

1. 기존 Issue와 Discussion을 검색합니다.
2. 기능 변경이나 큰 구조 변경은 먼저 Issue 또는 Discussion에서
   제안합니다.
3. 한 Pull Request에는 한 가지 목적만 담습니다.
4. 개인정보, 실제 OAuth 키, 세션 값, 사업자 비공개 정보는 커밋하지
   않습니다.

## 개발 환경

```powershell
git clone https://github.com/MONGPASS/Mongpass.git
cd Mongpass
npm ci
Copy-Item .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev
```

제출 전 다음 명령을 모두 실행합니다.

```powershell
npm run lint
npm test
npm run build
```

## Issue 작성 가이드

버그 Issue에는 다음 정보를 포함하세요.

- 문제가 발생한 화면 또는 API
- 재현 순서
- 기대 결과와 실제 결과
- 브라우저와 실행 환경
- 개인정보를 제거한 로그 또는 스크린샷

기능 제안에는 다음 정보를 포함하세요.

- 어떤 이용자 문제를 해결하는지
- 한국 거주 몽골인 커뮤니티에 주는 가치
- 제안하는 사용자 흐름
- 고려한 대안과 범위

번역 수정은 원문, 수정안, 문맥과 가능하면 원어민 검토 정보를
포함하세요.

## Pull Request 가이드

- 관련 Issue가 있으면 `Closes #123` 형식으로 연결합니다.
- 사용자에게 달라지는 점과 구현 방식을 설명합니다.
- UI 변경에는 전후 스크린샷을 첨부합니다.
- API 변경에는 `docs/API.md`를 함께 수정합니다.
- 다국어 구조 변경에는 `docs/I18N.md`를 함께 수정합니다.
- 사용자에게 보이는 변경은 `CHANGELOG.md`의 `Unreleased`에 기록합니다.
- 새 동작에는 가능한 범위의 테스트를 추가합니다.
- 배포된 migration을 수정하지 말고 새 migration을 추가합니다.

## 코드 원칙

- 기존 Next.js App Router와 Route Handler 패턴을 따릅니다.
- 인증 사용자와 권한은 서버 세션에서 확인합니다.
- 클라이언트가 보낸 user ID나 role을 신뢰하지 않습니다.
- 새 UI 문구는 향후 locale 분리가 쉽도록 의미 단위로 작성합니다.
- 접근성 있는 HTML과 키보드 사용을 고려합니다.
- 불필요한 의존성 추가를 피합니다.

## Commit 형식

짧은 Conventional Commit 형식을 권장합니다.

```text
feat(community): add job category
fix(auth): reject expired sessions
docs(api): document shop filters
```

## 커뮤니티 규칙

모든 참여자는 [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)를 따라야
합니다. 보안 취약점은 공개 Issue 대신 [`SECURITY.md`](SECURITY.md)의
비공개 신고 절차를 이용하세요.
