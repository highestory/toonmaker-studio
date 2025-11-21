# ToonMaker Studio Project Overview

## 1. 프로젝트 개요
**ToonMaker Studio**는 네이버 웹툰 콘텐츠 제작을 위한 **평일 5일 완성 루틴 관리** 및 **웹툰 이미지 수집**을 돕는 도구입니다. 육아와 병행하며 효율적으로 콘텐츠를 생산하기 위한 개인 사이드 프로젝트로 보입니다.

## 2. 기술 스택
- **Framework**: Next.js 16.0.3 (Pages Router)
- **Language**: JavaScript
- **Styling**: Tailwind CSS v4 (PostCSS)
- **Scraping**: Cheerio (Server-side scraping)
- **State Management**: React Hooks + LocalStorage

## 3. 주요 기능

### A. 5일 루틴 체크리스트 (`components/Checklist.js`)
월요일부터 금요일까지의 콘텐츠 제작 단계를 체크리스트로 제공합니다.
- **월**: 작품 선정 및 대본 키워드
- **화**: 대본 완성 및 녹음
- **수**: AI 이미지 생성 및 자료 정리
- **목**: 영상 편집 (오디오/컷/이미지)
- **금**: 자막, 썸네일, 업로드 예약
- *특징*: 진행 상황이 브라우저 `localStorage`에 저장되어 유지됩니다.

### B. 주간 웹툰 다운로더 (`components/Downloader.js`)
요일별로 웹툰 URL을 입력하여 이미지를 일괄 다운로드하는 기능입니다.
- **URL 분석**: 입력된 네이버 웹툰 URL에서 메타데이터(제목, 회차, 썸네일)와 본문 이미지를 추출합니다.
- **자동 폴더링**: `downloads/[회차] [웹툰명] - [에피소드명]/` 형식으로 폴더를 자동 생성하여 저장합니다.
- **일괄 다운로드**: 준비된 모든 요일의 웹툰을 한 번에 다운로드할 수 있습니다.

### C. 백엔드 API (`pages/api/`)
- **`/api/webtoon`**: `cheerio`를 사용하여 네이버 웹툰 페이지의 HTML을 파싱하고 이미지 URL을 추출합니다.
- **`/api/save-image`**: 추출된 이미지를 서버(로컬) 파일 시스템에 저장합니다. 네이버 이미지 서버의 차단을 피하기 위해 `Referer` 헤더를 조작합니다.
- **`/api/proxy-image`**: 이미지 로딩 문제 발생 시 우회를 위한 프록시 엔드포인트입니다.

## 4. 프로젝트 구조
```
toonmaker-studio/
├── components/
│   ├── Checklist.js   # 루틴 체크리스트 UI
│   └── Downloader.js  # 웹툰 다운로더 UI
├── pages/
│   ├── api/
│   │   ├── webtoon.js     # 웹툰 스크래핑 API
│   │   ├── save-image.js  # 이미지 저장 API
│   │   └── proxy-image.js # 이미지 프록시 API
│   └── index.js       # 메인 페이지 (대시보드)
├── public/            # 정적 리소스
└── styles/            # 전역 스타일
```

## 5. 실행 방법
```bash
npm run dev
# http://localhost:3000 접속
```
