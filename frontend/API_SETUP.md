# FitMap API 연결

## 실행

1. `.env.example`을 `.env.local`로 복사합니다.
2. `KAKAO_REST_API_KEY`에 카카오 앱의 REST API 키를 입력합니다.
3. `VITE_KAKAO_JAVASCRIPT_KEY`에 같은 카카오 앱의 **JavaScript 키**를 입력하고, 카카오 디벨로퍼스에서 `http://localhost:5173`을 JavaScript SDK 도메인으로 등록합니다.
4. 카카오 디벨로퍼스의 **카카오맵 > 사용 설정**을 ON으로 설정합니다.
5. `KMA_SERVICE_KEY`에 공공데이터포털 기상청 단기예보 조회서비스의 **일반 인증키(Decoding)** 를 입력합니다.
6. `AIRKOREA_SERVICE_KEY`에 공공데이터포털 AirKorea API의 **일반 인증키**를 입력합니다. URL Encoding 형태와 Decoding 형태를 모두 지원합니다.
7. `npm run dev`를 재시작합니다.
8. 대시보드에서 브라우저 위치 권한을 허용합니다.

Geolocation은 별도 키가 없습니다. localhost 또는 HTTPS에서 사용합니다.
위치는 버튼을 누를 때만 요청하며, 좌표는 날씨·주소·주변 장소 조회에 사용합니다.
위치를 거부하거나 조회에 실패하면 오류를 표시하며, 서울 등의 임의 좌표로 바꾸지 않습니다.

## 신청할 서비스

- 카카오 [로컬 API](https://developers.kakao.com/docs/latest/ko/local/dev-guide): 좌표→행정구역, 키워드 주변 장소 검색. 앱의 사용 권한·쿼터를 확인하세요. 현재 화면은 검색 결과와 카카오맵 링크를 사용하므로 지도 JavaScript SDK 키는 필요 없습니다.
- [기상청 단기예보 조회서비스](https://www.data.go.kr/data/15084084/openapi.do): 초단기실황(getUltraSrtNcst)과 단기예보(getVilageFcst). API허브의 authKey와는 다른 인증키입니다.
- [기상청 생활기상지수 조회서비스(4.0)](https://www.data.go.kr/data/15085288/openapi.do): 현재 행정동의 자외선지수를 조회합니다. `KMA_SERVICE_KEY`를 재사용하지만 별도 활용신청이 필요합니다.
- 기상청 생활기상지수 요청이 거절되거나 자료가 없으면 [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api)의 현재 자외선지수로 자동 대체합니다.
- AirKorea [측정소정보 조회서비스](https://www.data.go.kr/data/15073877/openapi.do)와 [대기오염정보 조회서비스](https://www.data.go.kr/data/15073861/openapi.do): 현재 좌표에서 가까운 측정소를 찾고 PM10, PM2.5, 오존의 최신 1시간 측정값을 조회합니다. 두 서비스 모두 활용신청이 필요합니다.
- [Geolocation](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition): 브라우저 위치 조회.

## 데이터 의미

- 온도·습도·풍속: 최신 가용 초단기실황 관측값. 화면에 관측 시각(KST)을 표시합니다.
- 강수확률·강수가 없는 경우 하늘상태: 현재 시간대의 단기예보. 강수 중에는 관측 강수형태를 우선합니다.
- 발표 지연을 고려하여 실황은 40분, 단기예보는 70분의 여유를 두고 발표 시각을 선택합니다. API에서 아직 자료를 제공하지 않으면 오류를 표시합니다.
- AirKorea가 응답하면 PM10·PM2.5·오존은 가까운 측정소의 최신 관측값입니다. 일시적인 AirKorea 오류가 지속되면 Open-Meteo 모델의 현재 PM10·PM2.5 추정치를 표시하고 출처를 명시합니다. 이때 오존은 표시하지 않습니다. 자외선은 별도 API에서 조회합니다.
- 운동 추천 수치는 화면 예시이며 기상청에서 계산한 값이 아닙니다.
- 주변 장소는 선택 운동에 따른 키워드, 반경 10km, 직선거리 기준입니다. 검색 결과만으로 무료 여부를 판단하지 않습니다.

## 구조 및 배포

브라우저 → `/api/fitmap/weather`, `/region`, `/places` → 서버 → 기상청/카카오

키는 서버 코드에서만 읽습니다. `VITE_` 접두사를 붙이지 마세요. `.env.local`은 Git 제외 대상입니다.
현재 서버는 Vite 개발/preview 미들웨어입니다. **정적 dist 파일만 배포하면 API가 동작하지 않습니다.**
운영 시 팀 백엔드에 `server/api.ts`의 요청·정규화 로직을 옮겨 같은 경로를 제공하고, 사용자 인증·요청 제한을 추가하세요.
클라이언트 요청 취소와 서버 외부 호출 시간 제한을 적용했습니다. 외부 API 오류 원문이나 인증키는 브라우저 응답에 포함하지 않습니다.

## 확인

```sh
node --experimental-strip-types --test server/api.test.ts
npm run build
```

테스트는 합성 응답을 사용하며 실서비스 키 유효성·활용 승인까지 검증하지 않습니다.
