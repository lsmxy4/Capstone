# FitMap

현재 위치의 날씨·대기질을 바탕으로 운동을 추천하고 주변 운동 장소를 찾는 웹 서비스입니다. 로그인하면 즐겨찾기와 날짜별 이동 경로를 저장하고 마이페이지에서 확인할 수 있습니다.

- 서비스: [fitmap.store](https://fitmap.store/)
- 상세 문서: [배포 안내](deploy/README.md) · [백엔드 API](backend/README.md) · [외부 API 설정](frontend/API_SETUP.md)

## 주요 화면

| 화면 | 경로 | 기능 |
| --- | --- | --- |
| 서비스 소개 | `/` | 서비스 안내, 로그인·회원가입 진입 |
| 대시보드 | `/dashboard` | 날씨·대기질·자외선, 운동 선택과 추천, 주변 장소 요약 |
| 운동 정보 | `/exercise` | 운동별 가이드, 추천 시간·강도, 이동 거리 측정과 날짜별 경로 |
| 주변 장소 | `/places` | 지도, 반경 10km 장소 검색, 실내·실외 필터, 즐겨찾기 |
| 즐겨찾기 | `/favorites` | 시설 유형별 SVG 이미지, 저장한 장소 검색·분류·정렬·삭제, 길찾기 |
| 마이페이지 | `/mypage` | 이름·이메일, 저장 장소 수, 경로 기록 날짜, 최근 저장 장소, 로그아웃 |
| 로그인·회원가입 | `/login`, `/signup` | 세션 인증, 로그인 후 원래 페이지로 복귀 |

서비스 소개는 보라색 브랜드 테마, 주요 서비스 화면은 크림·딥그린 테마와 반응형 레이아웃을 사용합니다. 게스트는 기본 정보를 둘러볼 수 있으며, 즐겨찾기와 서버 경로 저장에는 로그인이 필요합니다.

카카오 로그인과 비밀번호 찾기는 현재 비활성 상태입니다. 이메일 회원가입·로그인을 사용할 수 있습니다.

## 기술 구성

- **프런트엔드:** React 19, TypeScript, Vite 8, SCSS
- **계정·데이터 서버:** Java 21, Spring Boot, JDBC, 파일 기반 H2
- **외부 API 서버:** Node.js 22, TypeScript — 위치 기반 외부 데이터 조회·가공
- **지도·장소·주소:** Kakao Maps JavaScript SDK, Kakao Local API
- **날씨:** 기상청 API허브 AWS(자동기상관측장비) 매분관측, 공공데이터포털 단기예보
- **대기질:** AirKorea, 조회 실패 시 Open-Meteo 추정치로 대체
- **자외선:** 기상청 생활기상지수 조회서비스(4.0), 3시간 간격 예보
- **위치:** 브라우저 Geolocation API
- **운영 배포:** Docker Compose, Nginx, Caddy

개발 환경에서는 Vite 플러그인이 외부 API 요청을 처리합니다.

```text
브라우저
  └─ Vite 서버 (기본 5173)
      ├─ /api/fitmap/* → 카카오·기상청·AirKorea·Open-Meteo
      └─ /api/auth/*   → Spring Boot (기본 8080) → H2
```

운영 환경에서는 외부 API 서버를 별도 컨테이너로 실행합니다.

```text
브라우저 → Caddy (HTTPS/443) → Nginx 프런트엔드 (80)
                              ├─ /              → React 정적 파일
                              ├─ /api/auth/*    → Spring Boot (8080) → H2
                              └─ /api/fitmap/*  → Node API (3000) → 외부 API
```

Spring Boot는 로그인 세션과 사용자별 즐겨찾기·이동 경로를 관리합니다. Node API는 날씨·지역·장소·대기질·자외선을 조회하며, 운동 추천과 시설 이미지 선택은 프런트엔드에서 처리합니다.

## 실행 방법

### 1. API 키 준비

프로젝트 루트에서 실행합니다. 이미 `.env.local`이 있다면 복사하지 말고 기존 값을 확인하세요.

```powershell
Copy-Item frontend/.env.example frontend/.env.local
```

`frontend/.env.local`에 아래 값을 설정합니다.

| 변수 | 용도 |
| --- | --- |
| `KAKAO_REST_API_KEY` | 주소 조회·주변 장소 검색 |
| `VITE_KAKAO_JAVASCRIPT_KEY` | 브라우저 지도 SDK |
| `KMA_SERVICE_KEY` | 기상청 단기예보 |
| `KMA_API_HUB_KEY` | 기상청 API허브 AWS 매분자료·지상관측 지점정보 |
| `AIRKOREA_SERVICE_KEY` | AirKorea 측정소·대기질 |
| `AUTH_API_TARGET` | 인증 서버 주소. 직접 실행 시 기본 `http://localhost:8080` |

키 변경 후 Vite 서버를 재시작합니다. 실제 키가 들어 있는 `.env.local`은 커밋하지 마세요. `VITE_`가 붙은 변수는 브라우저에 노출되므로 서버용 키에는 붙이지 않습니다. 자세한 설정은 [API 연결 안내](frontend/API_SETUP.md)를 참고하세요.

### 2-A. Docker Compose로 실행

Docker Compose를 사용할 수 있는 환경에서 프로젝트 루트에서 실행합니다.

```powershell
docker compose up -d --build
```

- 웹: [http://localhost:5173](http://localhost:5173)
- 백엔드: `http://localhost:8080` — 루트 접속 시 웹 화면으로 이동
- 로그 확인: `docker compose logs -f`
- 종료: `docker compose down`

H2 데이터는 `auth-data` 볼륨에 보존됩니다. 현재 Compose는 Vite 개발 서버를 실행하는 개발용 구성입니다.

### 배포용 실행

개발 PC와 서버의 루트 `.env`에 배포 설정을 준비합니다. 처음에는 루트 `.env.example`을 복사하되 기존 `.env`는 덮어쓰지 않습니다. 현재 서비스 도메인은 `SITE_ADDRESS=fitmap.store`, `FRONTEND_URL=https://fitmap.store`입니다. 두 환경의 `IMAGE_TAG`는 같아야 합니다.

**소스가 있는 개발 PC에서 운영 이미지를 빌드하고 Docker Hub에 업로드합니다.**

```sh
docker login
docker compose -f docker-compose.build.yml --env-file .env build
docker compose -f docker-compose.build.yml --env-file .env push
```

**Ubuntu 서버에서 새 이미지를 내려받아 실행합니다.**

```sh
cd /home/ubuntu/fitmap
docker compose -f docker-compose.prod.yml --env-file .env pull
docker compose -f docker-compose.prod.yml --env-file .env up -d
docker compose -f docker-compose.prod.yml --env-file .env ps
```

프런트엔드 화면·이미지·메타 태그만 변경했다면 개발 PC에서 `build frontend`, `push frontend`를 실행하고, 서버에서 `pull frontend` 후 `up -d`를 실행하면 됩니다. `frontend/server/`의 외부 API 코드를 변경하면 `api` 이미지도 다시 빌드·업로드해야 합니다.

`docker-compose.yml`의 개발 이미지는 Vite(5173)를 실행합니다. 운영 이미지는 반드시 `docker-compose.build.yml`로 빌드해야 Nginx(80)가 실행됩니다. `up -d`만 실행하면 Docker Hub의 최신 이미지를 새로 내려받지 않으므로 먼저 `pull`을 실행합니다.

`frontend`와 `api`의 `healthy` 상태를 확인합니다. 도메인·환경변수·데이터 보존 설정과 프런트엔드만 배포하는 전체 명령은 [배포 안내](deploy/README.md)를 참고하세요.

### 2-B. 직접 실행

**Node.js 22.18 이상(22.x), Java 21, Maven**을 준비합니다. 아래 테스트 명령은 TypeScript를 직접 실행할 수 있는 Node 버전을 기준으로 합니다.

터미널 1:

```powershell
cd backend
mvn spring-boot:run
```

터미널 2:

```powershell
cd frontend
npm ci
npm run dev
```

Vite가 출력하는 주소로 접속합니다. 5173 포트가 사용 중이면 다른 포트가 선택될 수 있습니다. 직접 실행할 때 DB 기본 경로는 `backend/data/fitmap.mv.db`입니다.

## 위치 처리 기준

위치가 필요한 페이지에 진입하면 브라우저 위치를 요청하며, 버튼으로 다시 조회할 수 있습니다. 별도의 IP 기반 위치 API나 특정 지역으로 고정하는 대체 좌표는 사용하지 않습니다.

| 용도 | 처리 기준 |
| --- | --- |
| 대시보드·운동 추천의 환경 정보 | 유효한 좌표이면 보고된 위치 오차가 커도 해당 좌표로 날씨·대기질 API 조회 |
| 주변 장소 페이지 | 위치 오차 크기에 관계없이 유효한 좌표로 지도와 장소 목록 표시 |
| 운동 정보의 이동 거리·경로 기록 | 위치 오차 크기에 관계없이 유효한 좌표를 사용하며 이동량 필터 적용 |

- 정확도는 기기가 보고한 추정 오차이며 실제 위치 일치를 보장하지 않습니다. 대시보드의 주변 장소 요약은 일반 위치 조회 기준을 따릅니다.
- 이동 거리는 마지막으로 인정한 위치부터 계산합니다. 최소 이동 기준은 `max(5m, min(50m, 위치 오차 × 0.5))`이고, 1km 이상의 단일 이동은 제외합니다.
- 운동 정보 화면을 연 동안 이동을 측정합니다. 화면을 나갔다 다시 들어오면 화면의 거리 누적은 초기화되며, 로그인한 사용자의 저장 경로는 한국 시간 날짜별로 조회할 수 있습니다.
- 45초 동안 정밀 신호를 기다리는 별도 기능은 사용하지 않습니다. 일반 위치 조회 제한 시간은 20초입니다.
- 위치 기능에는 브라우저 권한이 필요합니다. 휴대폰에서 일반 HTTP 내부 IP 주소로 접속하면 제한될 수 있으므로 HTTPS를 사용하세요. 로컬 개발은 `localhost`를 사용합니다.

## 운동 추천과 오류 처리

러닝·걷기·자전거·등산·수영별 기본값에 기온·강수·바람·자외선·미세먼지 조건을 반영합니다. 시간·강도·예상 칼로리는 앱의 규칙 기반 계산값이며 외부 API가 제공하는 개인별 운동 처방이 아닙니다.

- 강수 또는 미세먼지로 실내 운동을 권장하면 자외선 조건이 시간대를 덮어쓰지 않습니다.
- 위치 확인 중·위치 실패·날씨 조회 중·날씨 실패·정보 없음을 구분합니다.
- 조회가 실패하면 위치 재확인 또는 날씨 재조회 버튼을 제공합니다.
- 주변 장소의 초기 필터는 비가 오면 `실내`, 그 외에는 `전체`이며 사용자가 변경할 수 있습니다.

## 계정과 데이터

이름·닉네임·이메일, 비밀번호 해시, 세션, 즐겨찾기, 이동 경로 위치 점을 H2에 저장합니다. 비밀번호는 BCrypt 해시로 저장하고 세션은 `fitmap_session` HttpOnly 쿠키를 사용합니다. 서버에는 세션 토큰 원문 대신 SHA-256 해시를 저장합니다. 로그인 유지 시 세션은 30일, 해제 시 서버 세션은 1일 동안 유효하며 브라우저에는 세션 쿠키를 설정합니다.

로그인 링크는 복귀 경로를 `returnTo`로 전달합니다. 회원가입 화면을 거쳐도 유지하며, 허용된 내부 페이지로만 복귀합니다. 복귀 경로가 없거나 잘못되면 대시보드로 이동합니다.

인증·즐겨찾기·경로 API 목록과 서버 환경 변수는 [백엔드 README](backend/README.md)를 참고하세요. 마이페이지는 기존 API를 사용하며 프로필 수정 기능은 아직 제공하지 않습니다.

## 장소 이미지와 링크 미리보기

즐겨찾기는 장소의 세부 분류와 이름에 따라 주차장·수영장·체육관 등 시설 유형별 SVG를 표시합니다. 공원·등산·스포츠·편의시설 이미지와 유형을 알 수 없는 장소의 기본 이미지도 제공합니다. 이미지는 실제 장소 사진이 아닌 대표 일러스트입니다.

| 파일 | 용도 |
| --- | --- |
| `frontend/public/images/places/*.svg` | 즐겨찾기 시설 유형별 이미지 |
| `frontend/public/favicon.svg`, `favicon.ico` | 브라우저 탭 아이콘 |
| `frontend/public/apple-touch-icon.png` | 모바일 홈 화면 아이콘 |
| `frontend/public/images/fitmap-share.png` | 카카오톡 등 링크 공유 이미지, 1200×630 |
| `frontend/public/images/fitmap-share.svg` | 공유 이미지의 편집용 원본 |
| `frontend/index.html` | 파비콘 연결, 설명, Open Graph·Twitter 메타 태그 |

공유 이미지는 `https://fitmap.store/images/fitmap-share.png` 절대 주소로 연결합니다. 도메인을 바꾸면 `frontend/index.html`의 공유 주소와 이미지 주소도 변경해야 합니다. SVG 공유 원본만 수정하면 PNG가 자동 갱신되지는 않으므로 PNG도 다시 내보냅니다.

이미지와 메타 태그를 수정한 뒤에는 프런트엔드를 다시 빌드·배포합니다. 배포된 이미지와 메타 태그가 정상인데 카카오톡에 이전 내용이 남으면 [카카오톡 URL 메타정보 관리](https://developers.kakao.com/tool/debugger/sharing)에서 공유한 URL의 캐시를 초기화한 후 링크를 다시 전송합니다.

## 프로젝트 구조

```text
Capstone/
├─ backend/
│  ├─ src/main/java/com/fitmap/backend/  # 인증·즐겨찾기·경로 API
│  ├─ src/main/resources/               # 설정·DB 스키마
│  └─ src/test/                         # 백엔드 테스트
├─ frontend/
│  ├─ public/                           # 파비콘·공유 이미지·시설 SVG
│  ├─ server/                           # 외부 API 중계·회귀 테스트
│  ├─ src/api/                          # API 클라이언트
│  ├─ src/components/                   # 공통 UI·지도
│  ├─ src/hooks/                        # 위치·이동 거리·날짜별 경로
│  ├─ src/pages/                        # 페이지와 스타일
│  ├─ src/utils/                        # 추천·위치 정확도·로그인 복귀
│  ├─ index.html                        # 페이지 메타데이터
│  ├─ Dockerfile.prod                   # 운영 Nginx·Node API 빌드
│  ├─ .env.example
│  └─ API_SETUP.md
├─ deploy/                              # Caddy 설정·Ubuntu 배포 안내
├─ docker-compose.yml                   # 로컬 Vite 개발 환경
├─ docker-compose.build.yml             # 운영 이미지 빌드·업로드
├─ docker-compose.prod.yml              # 운영 이미지 실행
├─ .env.example                         # 배포 환경변수 예시
└─ README.md
```

## 검사와 테스트

프로젝트 루트에서 프런트엔드 검사:

```powershell
npm --prefix frontend run build
npm --prefix frontend run lint
node --test --test-isolation=none frontend/server/*.test.ts
```

백엔드 검사:

```powershell
cd backend
mvn test
```

프런트엔드 테스트는 외부 API 응답 처리, 운동 추천 충돌, 위치 정확도, 짧은 이동 누적, 로그인 복귀를 검증합니다. 테스트 통과와 별개로 실제 API 키·위치 수신·로그인 계정을 사용한 동작 확인이 필요합니다.

## 문제 해결

| 증상 | 확인할 항목 |
| --- | --- |
| 지도만 표시되지 않음 | JavaScript 키, 실제 접속 도메인·포트 등록, 카카오맵 사용 설정 |
| 주변 장소가 표시되지 않음 | 위치 권한, 유효한 위치 좌표, 카카오 REST 키 |
| 날씨·대기질 조회 실패 | 인증키·활용 승인, 요청 한도, 재시도 안내 |
| 로그인·즐겨찾기 조회 실패 | Spring Boot 실행 여부, `AUTH_API_TARGET`, 로그인 상태 |
| 휴대폰에서 위치 사용 불가 | HTTPS 접속, 기기·브라우저 위치 권한 |
| 운영 프런트엔드가 `unhealthy` | 로그에 Vite·5173이 나오면 개발용 이미지가 배포된 상태. 운영 빌드·업로드 후 서버에서 다시 `pull` |
| Docker 개발 환경에서 새 SVG가 안 보임 | 이미지 URL이 HTML을 반환하는지 확인하고 `docker compose restart frontend` 실행 |
| 카카오톡 미리보기에 이미지가 없음 | 배포된 이미지 응답·HTML의 `og:image` 확인 후 카카오톡 URL 캐시 초기화 |

`dist` 파일만 정적 배포하면 외부 API 중계와 인증 서버가 함께 제공되지 않습니다. 운영 배포에서는 `/api/fitmap/*` 중계와 `/api/auth/*` 백엔드 연결을 별도로 구성해야 합니다.
