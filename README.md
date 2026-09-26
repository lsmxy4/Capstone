# FitMap

현재 위치의 날씨·대기질을 바탕으로 운동을 추천하고 주변 운동 장소를 찾는 웹 서비스입니다. 로그인하면 즐겨찾기와 날짜별 이동 경로를 저장하고 마이페이지에서 확인할 수 있습니다.

## 주요 화면

| 화면 | 경로 | 기능 |
| --- | --- | --- |
| 서비스 소개 | `/` | 서비스 안내, 로그인·회원가입 진입 |
| 대시보드 | `/dashboard` | 날씨·대기질·자외선, 운동 선택과 추천, 주변 장소 요약 |
| 운동 정보 | `/exercise` | 운동별 가이드, 추천 시간·강도, 이동 거리 측정과 날짜별 경로 |
| 주변 장소 | `/places` | 지도, 반경 10km 장소 검색, 실내·실외 필터, 즐겨찾기 |
| 즐겨찾기 | `/favorites` | 저장한 장소 검색·분류·정렬·삭제, 길찾기 |
| 마이페이지 | `/mypage` | 이름·이메일, 저장 장소 수, 경로 기록 날짜, 최근 저장 장소, 로그아웃 |
| 로그인·회원가입 | `/login`, `/signup` | 세션 인증, 로그인 후 원래 페이지로 복귀 |

화면은 크림·딥그린 테마와 반응형 레이아웃을 사용합니다. 게스트는 기본 정보를 둘러볼 수 있으며, 즐겨찾기와 서버 경로 저장에는 로그인이 필요합니다. 사이드바에서 처음 화면으로 돌아갈 수 있습니다.

## 기술 구성

- **프런트엔드:** React 19, TypeScript, Vite 8, SCSS
- **백엔드:** Java 21, Spring Boot, JDBC, H2
- **지도·장소·주소:** Kakao Maps JavaScript SDK, Kakao Local API
- **날씨:** 기상청 초단기실황·단기예보
- **대기질:** AirKorea, 조회 실패 시 Open-Meteo 추정치로 대체
- **자외선:** Open-Meteo
- **위치:** 브라우저 Geolocation API

```text
브라우저
  └─ Vite 서버 (기본 5173)
      ├─ /api/fitmap/* → 카카오·기상청·AirKorea·Open-Meteo
      └─ /api/auth/*   → Spring Boot (기본 8080) → H2
```

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
| `KMA_SERVICE_KEY` | 기상청 초단기실황·단기예보 |
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
| 주변 장소 페이지 | 고정밀 위치를 요청하고, 보고된 오차가 **100m 초과**이면 지도와 장소 목록 표시 차단 |
| 운동 정보의 이동 거리·경로 기록 | 오차 **100m 이내**인 위치만 측정·저장 대상으로 사용 |

- 정확도는 기기가 보고한 추정 오차이며 실제 위치 일치를 보장하지 않습니다. 대시보드의 주변 장소 요약은 일반 위치 조회 기준을 따릅니다.
- 이동 거리는 마지막으로 인정한 위치부터 계산합니다. 최소 이동 기준은 `max(5m, 위치 오차 × 0.5)`이고, 1km 이상의 단일 이동은 제외합니다.
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

이름·이메일, 세션, 즐겨찾기, 이동 경로 위치 점을 H2에 저장합니다. 비밀번호는 BCrypt 해시로 저장하고 세션은 `fitmap_session` HttpOnly 쿠키를 사용합니다.

로그인 링크는 복귀 경로를 `returnTo`로 전달합니다. 회원가입 화면을 거쳐도 유지하며, 허용된 내부 페이지로만 복귀합니다. 복귀 경로가 없거나 잘못되면 대시보드로 이동합니다.

인증·즐겨찾기·경로 API 목록과 서버 환경 변수는 [백엔드 README](backend/README.md)를 참고하세요. 마이페이지는 기존 API를 사용하며 프로필 수정 기능은 아직 제공하지 않습니다.

## 프로젝트 구조

```text
Capstone/
├─ backend/
│  ├─ src/main/java/com/fitmap/backend/  # 인증·즐겨찾기·경로 API
│  ├─ src/main/resources/               # 설정·DB 스키마
│  └─ src/test/                         # 백엔드 테스트
├─ frontend/
│  ├─ server/                           # 외부 API 중계·회귀 테스트
│  ├─ src/api/                          # API 클라이언트
│  ├─ src/components/                   # 공통 UI·지도
│  ├─ src/hooks/                        # 위치·이동 거리·날짜별 경로
│  ├─ src/pages/                        # 페이지와 스타일
│  ├─ src/utils/                        # 추천·위치 정확도·로그인 복귀
│  ├─ .env.example
│  └─ API_SETUP.md
├─ docker-compose.yml
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
| 주변 장소가 표시되지 않음 | 위치 권한, 보고된 오차 100m 기준, 카카오 REST 키 |
| 날씨·대기질 조회 실패 | 인증키·활용 승인, 요청 한도, 재시도 안내 |
| 로그인·즐겨찾기 조회 실패 | Spring Boot 실행 여부, `AUTH_API_TARGET`, 로그인 상태 |
| 휴대폰에서 위치 사용 불가 | HTTPS 접속, 기기·브라우저 위치 권한 |

`dist` 파일만 정적 배포하면 외부 API 중계와 인증 서버가 함께 제공되지 않습니다. 운영 배포에서는 `/api/fitmap/*` 중계와 `/api/auth/*` 백엔드 연결을 별도로 구성해야 합니다.
