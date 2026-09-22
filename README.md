# FitMap

FitMap은 현재 위치의 날씨와 대기질을 확인하고, 운동 정보를 살펴보며, 주변 운동 장소를 찾는 웹 서비스입니다. 로그인하면 장소 즐겨찾기와 날짜별 이동 경로를 저장할 수 있습니다.

## 주요 기능

| 화면 | 기능 |
| --- | --- |
| 홈 `/dashboard` | 현재 위치, 날씨, 대기질, 자외선지수, 운동 추천과 주변 장소 요약 |
| 운동 정보 `/exercise` | 운동별 가이드, 현재 환경에 따른 추천, 이동 거리와 지도 경로 |
| 주변 장소 `/places` | 카카오 지도와 장소 검색, 실내·실외 필터, 즐겨찾기 추가·해제 |
| 즐겨찾기 `/favorites` | 계정별 저장 장소 조회, 검색·분류·정렬, 즐겨찾기 해제 |
| 로그인·회원가입 `/login`, `/signup` | Spring Boot 세션 인증 |

주변 장소 화면은 비가 오면 처음에 `실내` 필터를, 그 외에는 `전체` 필터를 선택합니다. 사용자가 필터를 직접 바꿀 수 있습니다. 즐겨찾기는 계정별로 저장되며, 이동 경로는 한국 시간 날짜를 기준으로 나뉩니다. 운동 정보 화면의 이동 거리 측정은 화면을 연 뒤 수집한 위치를 기준으로 합니다.

## 기술 구성

- **프런트엔드:** React, TypeScript, Vite, SCSS
- **백엔드:** Java 21, Spring Boot, JDBC, H2
- **지도·장소·주소:** Kakao Maps JavaScript SDK와 Kakao Local API
- **날씨:** 기상청 단기예보 API
- **대기질:** AirKorea API. 연결이 지연되면 Open-Meteo 추정치를 출처 표시와 함께 사용
- **자외선지수:** Open-Meteo
- **현재 위치:** 브라우저 Geolocation API

브라우저는 Vite 서버의 `/api/fitmap/*`에서 날씨·장소 정보를 받고, `/api/auth/*` 요청은 Spring Boot 서버로 전달됩니다. 외부 API 키는 Vite 서버에서 읽으며, `VITE_KAKAO_JAVASCRIPT_KEY`만 지도 SDK를 위해 브라우저에 제공됩니다.

## 실행하기

### Docker Compose

1. `frontend/.env.example`을 `frontend/.env.local`로 복사합니다.
2. `frontend/.env.local`에 실제 API 키를 입력합니다.
3. 프로젝트 루트에서 실행합니다.

```powershell
docker compose up -d --build
```

웹 화면은 [http://localhost:5173](http://localhost:5173), Spring Boot 서버는 `http://localhost:8080`에서 열립니다. `8080`의 `/`로 접속하면 웹 화면으로 이동합니다. 로그는 `docker compose logs -f`로 확인하고, 종료는 `docker compose down`을 사용합니다. 로그인·즐겨찾기·경로 데이터는 Docker의 `auth-data` 볼륨에 보존됩니다.

### 직접 실행하기

Node.js 22, Java 21, Maven이 필요합니다. 터미널 두 개에서 각각 실행합니다.

```powershell
cd backend
mvn spring-boot:run
```

```powershell
cd frontend
Copy-Item .env.example .env.local
# .env.local에 API 키를 입력한 뒤 실행
npm ci
npm run dev
```

직접 실행할 때 H2 파일은 기본적으로 `backend/data/fitmap.mv.db`에 저장됩니다. 브라우저 위치 권한을 허용해야 현재 위치를 사용하는 기능이 동작합니다.

## API 키 설정

`frontend/.env.example`에 필요한 변수와 설명이 있습니다.

| 변수 | 용도 |
| --- | --- |
| `KAKAO_REST_API_KEY` | 카카오 장소 검색·주소 조회 |
| `VITE_KAKAO_JAVASCRIPT_KEY` | 브라우저 카카오 지도 |
| `KMA_SERVICE_KEY` | 기상청 날씨 조회용 공공데이터포털 키 |
| `AIRKOREA_SERVICE_KEY` | AirKorea 측정소·대기질 조회용 공공데이터포털 키 |

키를 바꾼 뒤에는 프런트엔드 서버를 재시작하세요. `.env.local`에는 실제 키가 들어가므로 저장소에 올리지 마세요. 기상청과 AirKorea 키는 공공데이터포털에서 해당 서비스의 활용 승인이 필요합니다.

## 저장되는 데이터와 백엔드 API

Spring Boot는 사용자, 로그인 세션, 즐겨찾기 장소, 이동 경로의 위치 점을 H2에 저장합니다. 세션은 `fitmap_session` HttpOnly 쿠키로 유지되며, 비밀번호는 BCrypt 해시로 저장합니다.

| 메서드 | 경로 | 내용 |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | 회원가입 |
| `POST` | `/api/auth/login` | 로그인 |
| `GET` | `/api/auth/me` | 현재 로그인 사용자 |
| `POST` | `/api/auth/logout` | 로그아웃 |
| `GET` | `/api/auth/favorites` | 내 즐겨찾기 목록 |
| `PUT` | `/api/auth/favorites/{placeId}` | 장소 즐겨찾기 저장 |
| `DELETE` | `/api/auth/favorites/{placeId}` | 장소 즐겨찾기 해제 |
| `POST` | `/api/auth/routes` | 이동 경로 위치 점 저장 |
| `GET` | `/api/auth/routes?date=YYYY-MM-DD` | 날짜별 이동 경로 |
| `GET` | `/api/auth/routes/dates` | 경로가 저장된 날짜 목록 |

즐겨찾기와 경로 API는 로그인이 필요합니다. `PUT /api/auth/favorites/{placeId}`에는 장소의 `id`, `name`, `category`, `address`, `distance`, `latitude`, `longitude`, `url`을 JSON으로 보냅니다. `POST /api/auth/routes`에는 위치 점의 UUID `id`, `latitude`, `longitude`, ISO 8601 형식의 `recordedAt`을 보냅니다. 자세한 응답 형식과 서버 설정은 [백엔드 README](backend/README.md)에 있습니다.

## 프로젝트 구조

```text
Capstone/
├─ backend/
│  ├─ src/main/java/com/fitmap/backend/  # 인증·즐겨찾기·경로 API
│  ├─ src/main/resources/                # Spring 설정·DB 스키마
│  └─ README.md
├─ frontend/
│  ├─ server/                            # Vite의 외부 API 중계
│  ├─ src/api/                           # 화면에서 호출하는 API
│  ├─ src/components/                    # 공통 UI·지도
│  ├─ src/hooks/                         # 위치·경로·화면 데이터
│  ├─ src/pages/                         # 화면
│  ├─ .env.example
│  └─ package.json
├─ docker-compose.yml
└─ README.md
```

## 확인 명령

```powershell
cd frontend
npm run build
node --test server/api.test.ts
```

```powershell
cd backend
mvn test
```
