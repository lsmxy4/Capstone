# FitMap Spring Boot 인증 서버

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

회원가입 JSON에는 `name`, `nickname`, `email`, `password`, `agreeTerms: true`, `agreePrivacy: true`가 필요합니다. 응답 형식은 기존 프런트엔드와 같습니다. 비밀번호는 BCrypt 해시로 저장하며, 로그인 세션은 30일 유효한 HttpOnly 쿠키입니다. 서버에는 세션 토큰의 SHA-256 해시만 저장합니다.

환경 변수: `PORT`, `JDBC_URL`, `DB_USER`, `DB_PASSWORD`, `COOKIE_SECURE`, `FRONTEND_URL`. HTTPS 운영 환경에서는 `COOKIE_SECURE=true`를 설정하세요. 테스트는 `mvn test`로 실행합니다.

운동 정보 페이지는 위치 권한을 받은 뒤 정확도와 이동 거리 조건을 통과한 위치 점을 저장합니다. `POST /api/auth/routes`에는 `id`(UUID), `latitude`, `longitude`, `recordedAt`(ISO 8601)을 보냅니다. 서버가 `recordedAt`을 한국 시간 날짜로 변환해 `route_points`에 저장합니다. 기록은 로그인한 사용자에게만 허용되며, 날짜를 지정하지 않은 조회는 오늘 경로를 반환합니다.
