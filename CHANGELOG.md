# Changelog

MongPass의 주요 변경 사항을 기록합니다. 형식은
[Keep a Changelog](https://keepachangelog.com/)를 따르며, 정식 공개
릴리스 전 현재 버전은 `0.x`로 관리합니다.

## [Unreleased]

### Added

- 역할별 최고관리자·업체 관리자 대시보드와 기간별 통계, 검색·필터·페이지 탐색
- 몽골어 업체 관리자 모바일 화면: 하단 메뉴, 주문 카드, 편집 시트, 고정 저장 버튼
- 업체 프로필·상품·소식·주문·채팅·리뷰 관리와 로그인 후 업체 관리 진입 흐름
- 실제 계정과 분리된 관리자 미리보기 및 탭 내부에만 저장하는 업체 체험 화면
- 관리자 권한·업체 소유권·통계 집계 및 체험 데이터 변경에 대한 회귀 테스트
- 오픈소스 프로젝트 README와 설치 가이드
- MIT License
- API, 아키텍처, 다국어 확장 문서
- 외부 기여 가이드와 커뮤니티 운영 문서
- GitHub Actions CI와 Issue/PR 템플릿

### Planned

- 일반 물품 중고거래
- 전용 구인구직 기능
- locale 기반 몽골어·한국어·영어 지원
- OpenAPI 3.x 자동화

## [0.1.0] - 2026-06-09

### Added

- 몽골어 기반 생활 서비스 탐색
- 지역 상점 등록과 관리자 승인
- 카테고리별 주문과 예약
- 커뮤니티, 뉴스, 채팅, 리뷰, 알림
- 중고차 및 여행상품 등록
- Cloudflare D1/R2 기반 데이터 저장

[Unreleased]: https://github.com/MONGPASS/Mongpass/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/MONGPASS/Mongpass/releases/tag/v0.1.0
