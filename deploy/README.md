# Ubuntu 서버 배포

소스가 있는 개발 PC에서 이미지를 빌드해 Docker Hub에 올리고, Ubuntu 서버에서 이미지를 내려받아 실행합니다.
로컬 개발은 `docker-compose.yml`, 이미지 빌드는 `docker-compose.build.yml`, 서버 배포는 `docker-compose.prod.yml`을 사용합니다.

```text
브라우저 → Caddy(443/HTTPS) → frontend:80 (Nginx)
                            ├─ /              React 빌드 파일
                            ├─ /api/auth/     backend:8080 (Spring Boot)
                            └─ /api/fitmap/   api:3000 (Node)
```

운영 프런트엔드는 `frontend/Dockerfile.prod`의 `web` 타깃으로 빌드한 Nginx 이미지입니다.
`5173` 포트의 Vite 개발 서버는 로컬 개발용입니다.

## 1. Ubuntu 서버 준비

Ubuntu 22.04/24.04 LTS에서 [Docker 공식 설치 안내](https://docs.docker.com/engine/install/ubuntu/)의 apt 저장소 방식으로 Docker Engine과 Compose 플러그인을 설치합니다.
Java, Maven, Node, Nginx는 각 이미지에 포함되므로 서버에 따로 설치할 필요가 없습니다.

저장소를 서버에 복사했다면 프로젝트 루트에서 설치 스크립트를 실행할 수 있습니다. 기존 Docker가 있으면 재설치하지 않고 버전을 확인합니다.

```bash
sudo bash deploy/ubuntu-setup.sh
sudo systemctl enable --now docker
sudo docker version
sudo docker compose version
```

아래 서버 명령은 배포 디렉터리를 `/home/ubuntu/fitmap`으로 가정합니다. 실제 경로에 맞게 바꾸세요.
Docker 실행 권한이 없는 계정은 서버의 `docker` 명령 앞에 `sudo`를 붙입니다.

## 2. 배포 파일과 환경변수 준비

서버에는 `docker-compose.prod.yml`, `.env`, `.env.example`, `deploy/Caddyfile`이 필요합니다.
스크립트를 사용하려면 `deploy/ubuntu-deploy.sh`도 복사합니다. 이미지로 실행하므로 `frontend/`, `backend/` 소스 폴더는 필요하지 않습니다.

```bash
cd /home/ubuntu/fitmap
test -f .env || cp .env.example .env
chmod 600 .env
nano .env
# DB_PASSWORD에 넣을 새 비밀번호가 필요할 때
openssl rand -hex 24
```

`.env.example`을 참고해 API 키와 `DB_PASSWORD`를 채웁니다. 이미 DB를 만든 경우 기존 비밀번호를 사용합니다.
`SITE_ADDRESS`에는 도메인만, `FRONTEND_URL`에는 `https://`를 포함한 공개 주소를 입력합니다.
예: `SITE_ADDRESS=fitmap.store`, `FRONTEND_URL=https://fitmap.store`.
도메인의 DNS를 서버 IP에 연결하고 80·443 포트를 엽니다. Caddy가 HTTPS 인증서를 발급·갱신합니다.
카카오 JavaScript SDK 허용 도메인에도 배포 주소를 등록합니다.

개발 PC의 프로젝트 루트에도 `.env`를 준비하고 `IMAGE_TAG`, `VITE_KAKAO_JAVASCRIPT_KEY`를 설정합니다.
`IMAGE_TAG` 기본값은 `latest`이며 빌드 PC와 서버에서 같은 태그를 사용합니다.
서버용 키와 DB 비밀번호는 Git이나 이미지에 포함하지 않습니다.
`VITE_KAKAO_JAVASCRIPT_KEY`는 빌드 결과에 포함되는 브라우저용 공개 키입니다.

`KMA_API_HUB_KEY`에는 AWS 매분자료와 지상관측 지점정보(AWS) 활용 승인이 필요합니다.
`KMA_SERVICE_KEY`는 강수확률·하늘 상태 예보에 사용합니다.

## 3. 개발 PC에서 이미지 빌드·업로드

전체 소스가 있는 개발 PC의 프로젝트 루트에서 실행합니다.

```bash
docker login
docker compose --env-file .env -f docker-compose.build.yml build
docker compose --env-file .env -f docker-compose.build.yml push
```

이미지는 `kauer7816/fitmap-frontend`, `kauer7816/fitmap-api`, `kauer7816/fitmap-backend` 세 개입니다.
빌드 Compose에 프런트엔드 `web` 타깃과 Node API `api` 타깃이 지정되어 있습니다.
최초 배포 시 세 이미지 모두 업로드해야 합니다.

## 4. Ubuntu 서버에서 이미지 다운로드·실행

개발 PC의 업로드가 끝나면 서버에서 실행합니다. 비공개 이미지라면 서버에서도 `docker login`이 필요합니다.

```bash
cd /home/ubuntu/fitmap
docker compose --env-file .env -f docker-compose.prod.yml config --quiet
docker compose --env-file .env -f docker-compose.prod.yml pull
docker compose --env-file .env -f docker-compose.prod.yml up -d --no-build --wait --wait-timeout 180
docker compose --env-file .env -f docker-compose.prod.yml ps
```

스크립트를 복사했다면 같은 디렉터리에서 다음 명령으로 설정 검사, 이미지 다운로드, 실행과 준비 상태 확인을 할 수 있습니다.

```bash
sudo bash deploy/ubuntu-deploy.sh
```

스크립트는 서버에서 소스를 빌드하지 않습니다. 코드 수정은 개발 PC에서 빌드·업로드한 뒤 서버에서 다시 배포해야 반영됩니다.
서버용 환경변수만 변경했다면 서버 배포 명령을 다시 실행합니다.
`VITE_KAKAO_JAVASCRIPT_KEY` 변경은 개발 PC에서 프런트엔드를 다시 빌드·업로드해야 합니다.

## 5. 프런트엔드만 수정했을 때

화면, 문구, 파비콘, 공유 이미지 또는 HTML 메타 태그만 수정했다면 프런트엔드 이미지만 갱신할 수 있습니다.
기존 운영 환경에서 API와 백엔드가 정상 실행 중일 때 사용합니다.

개발 PC의 프로젝트 루트:

```bash
docker compose --env-file .env -f docker-compose.build.yml build frontend
docker compose --env-file .env -f docker-compose.build.yml push frontend
```

Ubuntu 서버:

```bash
cd /home/ubuntu/fitmap
docker compose --env-file .env -f docker-compose.prod.yml pull frontend
docker compose --env-file .env -f docker-compose.prod.yml up -d --no-build --no-deps --wait --wait-timeout 180 frontend
docker compose --env-file .env -f docker-compose.prod.yml ps
```

이때 기존 배포와 같은 `IMAGE_TAG`를 사용합니다. 세 서비스가 하나의 `IMAGE_TAG`를 공유하므로 태그를 새로 바꿀 때는 세 이미지를 모두 빌드·업로드한 뒤 전체 배포합니다.
`frontend/server/` 변경은 `api` 이미지, 백엔드 코드 변경은 `backend` 이미지도 빌드·업로드해야 합니다.

## 상태 확인과 문제 해결

```bash
docker compose --env-file .env -f docker-compose.prod.yml ps
docker compose --env-file .env -f docker-compose.prod.yml logs --tail=100 frontend api backend proxy
docker compose --env-file .env -f docker-compose.prod.yml exec frontend wget -q -O - http://127.0.0.1/healthz
curl -I https://fitmap.store/
```

마지막 URL은 실제 배포 주소에 맞게 변경합니다. 프런트엔드와 Node API는 건강 상태 검사를 사용하며, 백엔드와 Caddy는 실행 상태 및 로그로 확인합니다.
로그를 계속 보려면 `logs --tail=100 -f`를 사용합니다.

### 프런트엔드가 unhealthy이거나 Caddy가 시작하지 않을 때

운영 상태 검사는 프런트엔드 컨테이너의 80번 포트로 요청합니다. 로그에 Vite와 `5173` 포트가 보이면 개발용 이미지가 올라간 것입니다.
개발 PC에서 위의 `docker-compose.build.yml` 명령으로 `frontend`를 다시 빌드·업로드하고, 서버에서 이미지를 내려받아 교체합니다.
최초 배포가 프런트엔드 준비 상태에서 중단됐다면 전체 `up -d --no-build --wait --wait-timeout 180` 명령도 다시 실행해 Caddy를 시작합니다.

Nginx 이미지인데도 문제가 이어지면 각 서비스의 로그를 확인합니다.
`api`가 정상 상태가 되어야 프런트엔드가 시작되고, 프런트엔드가 정상 상태가 되어야 Caddy가 시작됩니다.

### 파비콘·카카오톡 공유 미리보기가 이전 이미지로 보일 때

파비콘은 `frontend/public/favicon.ico`, `favicon.svg`, `apple-touch-icon.png`에 있고,
공유 이미지는 `frontend/public/images/fitmap-share.png`에 있습니다. Open Graph·Twitter 메타 태그는 `frontend/index.html`에 있습니다.
이 파일들도 이미지 빌드에 포함되므로 수정 후 프런트엔드를 빌드·업로드·재배포해야 합니다.

1. 배포 주소의 `/favicon.ico`, `/favicon.svg`, `/images/fitmap-share.png`를 직접 열어 최신 파일인지 확인합니다.
2. 브라우저에서 강력 새로고침하거나 시크릿 창으로 확인합니다. 파비콘을 다시 교체하면 `index.html`의 파비콘 URL 버전 값도 갱신할 수 있습니다.
3. 사이트 파일이 최신인데 카카오톡 미리보기가 이전 상태라면 [카카오 공유 디버거](https://developers.kakao.com/tool/debugger/sharing)에서 공유 URL의 캐시를 초기화한 뒤 새로 공유해 확인합니다.

현재 `og:url`, `og:image`, `twitter:image`는 `https://fitmap.store`를 사용합니다.
도메인을 바꾸면 `frontend/index.html`의 해당 절대 URL도 변경하고 프런트엔드를 다시 배포합니다. 서버의 `FRONTEND_URL` 변경만으로 HTML 메타 태그가 바뀌지는 않습니다.

## 데이터 보존과 중지

```bash
docker compose --env-file .env -f docker-compose.prod.yml down
```

DB는 `auth-data` 볼륨에 보존됩니다. 운영 데이터가 필요하면 볼륨을 삭제하는 `down -v`를 사용하지 마세요.
기존 DB 볼륨을 사용할 때는 기존 DB 비밀번호를 유지합니다.
운영 Compose는 `capstone-prod` 프로젝트 이름을 사용해 기본 로컬 개발 컨테이너·DB 볼륨과 분리됩니다.

도메인 없이 HTTP 동작만 확인하려면 `SITE_ADDRESS=:80`, `FRONTEND_URL=http://서버IP`, `COOKIE_SECURE=false`로 설정할 수 있습니다.
휴대폰 등 외부 접속에서 위치 기능을 쓰려면 HTTPS가 필요합니다.

## 주요 파일

| 파일 | 역할 |
| --- | --- |
| `docker-compose.yml` | Vite 기반 로컬 개발 |
| `docker-compose.build.yml` | 개발 PC에서 세 이미지 빌드·업로드 |
| `docker-compose.prod.yml` | Ubuntu 배포 서비스·이미지·볼륨 구성 |
| `.env.example` | 배포 환경변수 예시 |
| `.dockerignore` | 빌드에서 비밀키·로컬 데이터 제외 |
| `frontend/Dockerfile.prod` | React 빌드, Nginx 웹 이미지, Node API 이미지 |
| `frontend/nginx.conf` | React 라우팅, API 프록시, 정적 파일 캐시 |
| `backend/Dockerfile` | Java 21 백엔드 빌드·실행 |
| `backend/src/main/resources/application.properties` | 환경변수 기반 DB·쿠키·공개 주소 설정 |
| `deploy/Caddyfile` | HTTPS 인증서와 Nginx 프록시 |
| `deploy/ubuntu-setup.sh` | Ubuntu Docker 설치 |
| `deploy/ubuntu-deploy.sh` | 설정 검사 후 이미지 다운로드·실행·준비 상태 확인 |

프런트엔드는 `/api/...` 상대 경로로 API를 호출하므로 서버 IP를 소스에 하드코딩하지 않습니다.
Ubuntu 호스트에서 Linux 컨테이너로 실행하며, `.gitattributes`로 셸 스크립트의 LF 줄바꿈을 유지합니다.
