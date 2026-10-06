# FitMap Spring Boot 백엔드

Java 21과 Maven이 필요합니다. `mvn spring-boot:run`으로 실행하거나 프로젝트 루트에서 `docker compose up --build`를 사용하세요. 기본 포트는 8080입니다. 웹 화면은 `http://localhost:5173`에서 열립니다. 백엔드 기본 주소(`http://localhost:8080/`)로 접속하면 웹 화면으로 이동합니다.

H2 데이터베이스는 기본적으로 `backend/data/fitmap.mv.db`에 저장됩니다. Docker Compose에서는 `auth-data` 볼륨에 유지됩니다. 기존 Node 서버의 `auth.json` 데이터는 자동 이전되지 않습니다.

| 메서드 | 경로 | 기능 |
| --- | --- | --- |
| GET | `/api/auth/email-available?email=...` | 이메일 사용 가능 여부 |
| POST | `/api/auth/signup` | 회원가입 |
| POST | `/api/auth/login` | 로그인 및 세션 쿠키 발급 |
| GET | `/api/auth/me` | 현재 사용자 조회 |
| POST | `/api/auth/logout` | 로그아웃 |
| POST | `/api/auth/routes` | 로그인한 사용자의 위치 점 저장 |
| GET | `/api/auth/routes?date=YYYY-MM-DD` | 한국 시간 날짜별 경로 조회 |
| GET | `/api/auth/routes/dates` | 경로가 저장된 날짜 목록 |
| GET | `/api/auth/favorites` | 로그인한 사용자의 즐겨찾기 목록 |
| PUT | `/api/auth/favorites/{placeId}` | 장소를 즐겨찾기에 저장 |
| DELETE | `/api/auth/favorites/{placeId}` | 즐겨찾기 해제 |

회원가입 JSON에는 `name`, `nickname`, `email`, `password`, `agreeTerms: true`, `agreePrivacy: true`가 필요합니다. 비밀번호는 BCrypt 해시로 저장합니다. 로그인 시 `fitmap_session` HttpOnly 쿠키를 발급하고 서버에는 세션 토큰의 SHA-256 해시만 저장합니다. 로그인 유지 시 세션은 30일 동안 유효합니다. `keepLoggedIn: false`이면 서버 세션은 1일 동안 유효하며 쿠키에는 별도 만료 기간을 설정하지 않습니다.

카카오 로그인과 비밀번호 재설정 API는 아직 제공하지 않으며 로그인 화면에서도 비활성 상태로 표시합니다. 날씨·주변 장소 등의 `/api/fitmap/*` 요청은 별도 Node.js API 서버가 담당합니다.

환경 변수: `PORT`, `JDBC_URL`, `DB_USER`, `DB_PASSWORD`, `COOKIE_SECURE`, `FRONTEND_URL`. HTTPS 운영 환경에서는 `COOKIE_SECURE=true`를 설정하세요. 테스트는 `mvn test`로 실행합니다.

운동 정보 페이지는 위치 권한을 받은 뒤 정확도와 이동 거리 조건을 통과한 위치 점을 저장합니다. `POST /api/auth/routes`에는 `id`(UUID), `latitude`, `longitude`, `recordedAt`(ISO 8601)을 보냅니다. 서버가 `recordedAt`을 한국 시간 날짜로 변환해 `route_points`에 저장합니다. 기록은 로그인한 사용자에게만 허용되며, 날짜를 지정하지 않은 조회는 오늘 경로를 반환합니다.

즐겨찾기 저장에는 카카오 장소 정보 `id`, `name`, `category`, `address`, `distance`, `latitude`, `longitude`, `url`을 JSON으로 보냅니다. 응답은 `{ "favorite": { ... } }`입니다. 목록 응답은 `{ "favorites": [{ ...장소 정보, "savedAt": "..." }] }`이며 최신 저장 순입니다. 모든 경로는 로그인 세션 쿠키가 필요합니다. 프런트엔드 즐겨찾기 페이지에서는 `src/api/favorites.ts`의 `getFavorites()`와 `removeFavorite()`을 사용할 수 있습니다.
