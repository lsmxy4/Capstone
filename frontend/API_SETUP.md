# FitMap API 연결 안내

전체 실행 방법은 [프로젝트 README](../README.md), 계정·즐겨찾기·경로 API는 [백엔드 README](../backend/README.md)를 참고하세요.

## 환경 변수

`frontend/.env.example`을 `.env.local`로 복사하고 값을 입력합니다. 기존 설정 파일이 있으면 덮어쓰지 않습니다.

| 변수 | 설정 |
| --- | --- |
| `KAKAO_REST_API_KEY` | 카카오 REST API 키. 주소·장소 조회에 사용 |
| `VITE_KAKAO_JAVASCRIPT_KEY` | 카카오 JavaScript 키. 지도 표시에 사용 |
| `KMA_SERVICE_KEY` | 기상청 단기예보 조회서비스의 일반 인증키(Decoding) |
| `AIRKOREA_SERVICE_KEY` | AirKorea 측정소·대기오염 조회서비스 인증키 |
| `AUTH_API_TARGET` | Spring Boot 주소. 기본 `http://localhost:8080`, Compose에서는 `http://backend:8080` |

카카오 앱에 실제 웹 접속 주소(기본 `http://localhost:5173`)를 SDK 도메인으로 등록하고 카카오맵 사용 설정을 확인합니다. 포트나 배포 주소가 달라지면 해당 주소도 확인하세요. 공공데이터포털 키는 해당 서비스 활용 승인이 필요합니다.

환경 변수를 변경하면 Vite 서버를 재시작합니다. 지도 SDK 키 이외의 키에는 `VITE_` 접두사를 붙이지 마세요. `.env.local`은 커밋하지 않습니다.

## 데이터 흐름

| 프런트엔드 API | 데이터 출처·용도 |
| --- | --- |
| `/api/fitmap/weather` | 기상청 초단기실황·단기예보 |
| `/api/fitmap/region` | 카카오 좌표 → 주소 |
| `/api/fitmap/places` | 카카오 주변 장소 검색 |
| `/api/fitmap/air-quality` | AirKorea, 실패 시 Open-Meteo 추정치 |
| `/api/fitmap/uv` | Open-Meteo 자외선지수 |
| `/api/auth/*` | Spring Boot의 인증·즐겨찾기·경로 API |

위치 자체는 브라우저 Geolocation API에서 받습니다. API 키가 필요하지 않으며, 관련 페이지 진입 시 자동 요청하고 버튼으로 재조회합니다. 별도 IP 위치 서비스는 연결되어 있지 않습니다. 위치 권한을 거부하면 임의 좌표로 대체하지 않습니다.

일반 페이지는 오차가 큰 유효 좌표도 API 조회에 사용합니다. 주변 장소 페이지는 오차 100m 초과 시 표시를 막습니다. 운동 경로 측정·저장도 오차 100m 이내의 위치만 사용합니다. 자세한 기준은 루트 README의 위치 처리 항목을 참고하세요.

## 데이터 해석

- 온도·습도·풍속은 최신 가용 초단기실황이며 관측 시각은 KST로 표시합니다.
- 강수확률과 강수가 없는 경우의 하늘 상태는 단기예보를 사용합니다. 강수 중에는 관측 강수형태를 우선합니다.
- AirKorea 자료는 가까운 측정소의 관측값입니다. Open-Meteo로 대체하면 출처·안내와 함께 PM10·PM2.5 추정치를 표시하고 오존은 표시하지 않습니다.
- 자외선은 현재 구현에서 Open-Meteo를 직접 사용합니다. 기상청 생활기상지수 API는 호출하지 않습니다.
- 장소는 운동별 키워드, 반경 10km, 직선거리 기준입니다. 실제 이동 거리나 무료 이용 여부를 보장하지 않습니다.
- 운동 추천 시간·강도·칼로리는 앱 내부 규칙으로 계산합니다.

## 배포와 확인

외부 API 중계는 `server/api.ts`의 Vite 개발·preview 미들웨어입니다. 정적 `dist`만 배포하면 동작하지 않습니다. 운영 서버에는 동일한 `/api/fitmap/*` 경로와 Spring Boot의 `/api/auth/*` 연결을 구성해야 합니다.

프로젝트 루트에서:

```powershell
npm --prefix frontend run build
node --test --test-isolation=none frontend/server/*.test.ts
```

Node.js 22.18 이상(22.x)을 기준으로 합니다. 테스트는 합성 응답을 사용하므로 실제 키의 유효성·서비스 활용 승인·기기 위치 정확도까지 검증하지 않습니다.
