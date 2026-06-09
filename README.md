# MongPass

**한국 거주 몽골인을 위한 몽골어 기반 생활 플랫폼**

[![CI](https://github.com/MONGPASS/Mongpass/actions/workflows/ci.yml/badge.svg)](https://github.com/MONGPASS/Mongpass/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages%20%7C%20D1%20%7C%20R2-F38020.svg)](https://www.cloudflare.com/)

MongPass는 한국에 거주하는 몽골인이 모국어로 지역 생활 정보를 찾고,
커뮤니티에 참여하며, 몽골인 대상 소상공인과 연결될 수 있도록 만든
오픈소스 생활 플랫폼입니다.

한국의 병원, 식당, 여행, 배송, 구인구직 등 많은 지역 서비스는 한국어
중심으로 제공됩니다. 이로 인해 한국어가 익숙하지 않은 이용자는 필요한
정보를 찾고 신뢰할 수 있는 업체를 선택하는 데 어려움을 겪습니다.

MongPass는 다음 문제를 해결하는 것을 목표로 합니다.

- **언어 장벽 해소**: 몽골어 중심 UI와 콘텐츠 제공
- **소상공인 홍보 지원**: 지역 상점과 서비스 사업자의 직접 등록 및 운영
- **이민자 커뮤니티 연결**: 생활 질문, 정보 공유, 후기와 소통
- **지역 정보 접근성 향상**: 병원, 식당, 여행, 배송, 중고거래 등 통합 탐색

## 주요 기능

- 몽골어 기반 커뮤니티 게시글, 댓글, 좋아요
- 지역 상점 등록, 관리자 승인, 카테고리별 검색
- 중고차 등록 및 상세 정보 제공
- 병원 예약, 식당 주문, 여행상품 예약, 화물 주문
- 구인구직 및 생활 정보를 게시할 수 있는 뉴스·커뮤니티 구조
- 업체와 이용자 간 채팅 및 알림
- 즐겨찾기, 최근 본 업체, 리뷰, 주문 내역
- Google OAuth 로그인과 사용자·사업자·관리자 역할 분리
- Cloudflare D1 데이터베이스와 R2 이미지 저장소

> 현재 중고거래 기능은 중고차 카테고리를 중심으로 구현되어 있습니다.
> 일반 물품 거래와 전용 구인구직 모듈은 Roadmap에 포함되어 있습니다.

## 서비스 카테고리

| 카테고리 | 제공 기능 |
| --- | --- |
| 식당 | 메뉴 관리, 장바구니, 주문 |
| 병원 | 진료과·의사 정보, 예약 |
| 여행 | 여행상품, 일정, 예약 |
| 화물 | 배송 노선, 배송 주문 |
| 중고차 | 차량 등록, 사진, 상세 정보 |
| 뷰티 | 서비스·담당자 정보, 예약 |
| 식품 | 상품 등록 및 주문 |
| 기타 | 지역 생활 서비스 등록 |

## 기술 스택

- Next.js 14 App Router
- React 18, TypeScript, Tailwind CSS
- Cloudflare Pages
- Cloudflare D1 (SQLite)
- Cloudflare R2
- Google OAuth

## 설치 방법

### 요구 사항

- Node.js 20 이상
- npm 10 이상
- Cloudflare 계정
- Google OAuth Client

### 로컬 실행

```powershell
git clone https://github.com/MONGPASS/Mongpass.git
cd Mongpass
npm ci
Copy-Item .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev
```

브라우저에서 <http://localhost:3000>을 엽니다. 로그인 기능을 테스트하려면
`.dev.vars`의 Google OAuth 값과 `AUTH_SECRET`을 실제 개발용 값으로
교체해야 합니다.

### 품질 검사

```powershell
npm run lint
npm test
npm run build
```

## 프로젝트 구조

```text
src/
├── app/
│   ├── api/          Next.js Route Handler API
│   ├── admin/        관리자 기능
│   ├── biz/          사업자 등록·운영 화면
│   ├── category/     카테고리 탐색·주문·예약
│   ├── community/    커뮤니티
│   └── profile/      사용자 프로필과 주문 내역
├── components/       공통 UI와 카테고리별 컴포넌트
└── lib/              인증, 데이터 접근, 클라이언트 스토어

migrations/           Cloudflare D1 스키마 변경
public/               정적 이미지와 아이콘
docs/                 API, 아키텍처, 다국어 문서
.github/              CI, Issue, PR 템플릿
```

자세한 설명은 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)를 참고하세요.

## API 문서

현재 구현된 API의 인증 방식, 요청·응답 예시와 엔드포인트 목록은
[`docs/API.md`](docs/API.md)에 공개되어 있습니다.

- OpenAPI 3.1 원본: [`docs/openapi.json`](docs/openapi.json)
- 실행 중인 앱의 OpenAPI JSON: `/api/openapi`

주요 공개 읽기 API:

| Method | Endpoint | 설명 |
| --- | --- | --- |
| `GET` | `/api/shops` | 승인된 지역 상점 목록 |
| `GET` | `/api/shops/{id}` | 상점 상세 정보 |
| `GET` | `/api/news` | 생활 정보와 뉴스 |
| `GET` | `/api/community/posts` | 커뮤니티 게시글 |
| `GET` | `/api/reviews?shopId={id}` | 업체 리뷰 |

작성, 주문, 채팅, 사업자 관리 API는 로그인이 필요합니다.

## 다국어 지원 구조

현재 사용자 화면은 몽골어를 기본 언어로 설계했으며 폰트는 라틴 문자와
키릴 문자를 함께 지원합니다. 한국어와 영어를 포함한 정식 locale
리소스 분리는 Roadmap에 포함되어 있습니다.

다국어 확장 원칙과 권장 디렉터리 구조는
[`docs/I18N.md`](docs/I18N.md)에 정리되어 있습니다.

## Roadmap

- [x] 몽골어 기반 모바일 UI
- [x] 지역 상점 등록과 관리자 승인
- [x] 커뮤니티, 리뷰, 채팅, 알림
- [x] 카테고리별 주문·예약
- [x] 중고차 등록과 탐색
- [ ] 일반 물품 중고거래
- [ ] 전용 구인구직 게시판과 지원 흐름
- [ ] 몽골어·한국어·영어 locale 파일 분리
- [ ] OpenAPI 3.x 자동 생성과 Swagger UI
- [ ] 접근성 및 통합 테스트 확대

## 기여

외부 개발자, 디자이너, 번역가, 한국 거주 몽골인 커뮤니티의 기여를
환영합니다. 개발 환경, PR 규칙, Issue 작성법은
[`CONTRIBUTING.md`](CONTRIBUTING.md)를 확인하세요.

- 버그와 작업 제안: [GitHub Issues](https://github.com/MONGPASS/Mongpass/issues)
- 아이디어와 질문: [GitHub Discussions](https://github.com/MONGPASS/Mongpass/discussions)
- 보안 문제: [`SECURITY.md`](SECURITY.md)

## 라이선스

MongPass 소스 코드는 [MIT License](LICENSE)로 공개됩니다. 사용자가
업로드한 이미지, 상점 정보, 게시글 등 제3자 콘텐츠의 권리는 각
권리자에게 있습니다.
