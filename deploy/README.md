# Ubuntu 서버 배포

루트 `docker-compose.yml`은 로컬 개발용, `docker-compose.prod.yml`은 배포용입니다.
배포는 Nginx 프런트엔드, Node 날씨·장소 API, Spring Boot 백엔드, HTTPS용 Caddy로 구성합니다.

```text
브라우저 → Caddy(443/HTTPS) → Nginx
                            ├─ /              React 빌드 파일
                            ├─ /api/auth/     Spring Boot:8080
                            └─ /api/fitmap/   Node API:3000
```

## Docker Hub 이미지 배포 순서

### 1. 소스가 있는 개발 PC에서 빌드·업로드

```bash
docker login
docker compose --env-file .env -f docker-compose.build.yml build
docker compose --env-file .env -f docker-compose.build.yml push
```

이미지는 `kauer7816/fitmap-frontend`, `kauer7816/fitmap-backend`, `kauer7816/fitmap-api` 세 개입니다.
`IMAGE_TAG` 기본값은 `latest`이며 빌드 PC와 Ubuntu 서버에 같은 태그를 설정합니다.
기존 프런트엔드 이미지도 `web` 타깃으로 빌드해야 Nginx 설정과 상태 검사가 포함됩니다.
Node 날씨·장소 API용 `fitmap-api` 이미지도 반드시 업로드해야 합니다.

### 2. Ubuntu 서버에 배포 파일 복사

서버에는 `docker-compose.prod.yml`, `.env`, `.env.example`, `deploy/Caddyfile`이 필요합니다.
스크립트를 사용하려면 `deploy/ubuntu-deploy.sh`도 복사합니다. frontend/backend 소스 폴더는 필요하지 않습니다.

```bash
cd /home/ubuntu/fitmap
docker compose --env-file .env -f docker-compose.prod.yml pull
docker compose --env-file .env -f docker-compose.prod.yml up -d --no-build
```

비공개 이미지라면 Ubuntu 서버에서도 `docker login`이 필요합니다.

## 1. 우분투 준비

Ubuntu 22.04/24.04 LTS에서 [Docker 공식 설치 안내](https://docs.docker.com/engine/install/ubuntu/)의 apt 저장소 방식으로 Docker Engine과 Compose 플러그인을 설치합니다.
서버에 Java, Maven, Node, Nginx를 따로 설치할 필요는 없습니다. 각 컨테이너에 포함됩니다.

프로젝트를 복사한 Ubuntu 서버에서 설치 스크립트를 실행할 수 있습니다. 기존 Docker가 있으면 재설치하지 않고 버전을 확인합니다.

```bash
cd ~/Capstone
sudo bash deploy/ubuntu-setup.sh
```

```bash
sudo systemctl enable --now docker
sudo docker version
sudo docker compose version
```

## 배포 파일 구조

| 파일 | 역할 |
| --- | --- |
| `docker-compose.yml` | 로컬 개발 |
| `docker-compose.prod.yml` | Ubuntu 배포 서비스 연결 |
| `.env` | 배포 주소·DB 비밀번호·API 키 |
| `.dockerignore` | 빌드에서 비밀키·로컬 데이터 제외 |
| `frontend/Dockerfile.prod` | React 빌드, Nginx 웹 이미지, Node API 이미지 |
| `frontend/nginx.conf` | 화면 제공과 `/api/auth/`, `/api/fitmap/` 프록시 |
| `backend/Dockerfile` | Java 21 기반 Spring Boot 이미지 |
| `backend/src/main/resources/application.properties` | 환경변수 기반 DB·쿠키 설정 |
| `deploy/Caddyfile` | 도메인의 HTTPS 인증서 발급·갱신 |
| `deploy/ubuntu-setup.sh` | Ubuntu Docker 설치 |
| `deploy/ubuntu-deploy.sh` | 설정 검사 후 이미지 다운로드·기동 |

현재 프로젝트의 인증 컨트롤러와 상대경로 API 호출을 그대로 사용합니다.
스크린샷의 다른 프로젝트에 있는 `SecurityConfig.java`, `LoginService.java` 파일을 새로 만들 필요는 없습니다.
Ubuntu 호스트에서 Linux 컨테이너로 실행하며, `.gitattributes`로 셸 스크립트의 LF 줄바꿈을 유지합니다.

## 2. 프로젝트와 환경변수

프로젝트를 서버의 `~/Capstone`에 복사하거나 Git으로 내려받습니다. Git에 없는 `.env`는 서버에서 직접 작성합니다.

```bash
cd ~/Capstone
test -f .env || cp .env.example .env
chmod 600 .env
nano .env
# DB_PASSWORD에 넣을 새 비밀번호가 필요할 때
openssl rand -hex 24
```

`.env`의 API 키 5개와 DB_PASSWORD를 모두 채웁니다. 이미 DB를 만든 경우 기존 비밀번호를 사용합니다.
`SITE_ADDRESS=fitmap.example.com`, `FRONTEND_URL=https://fitmap.example.com`은 실제 도메인으로 변경합니다.

## 3. 실행

1. 서버에 Docker와 Compose를 설치하고 배포 파일을 복사합니다.
2. 루트 `.env.example`을 `.env`로 복사하고 값을 입력합니다. 기존 `.env`는 덮어쓰지 마세요.
3. `SITE_ADDRESS`에는 도메인만, `FRONTEND_URL`에는 `https://`를 포함한 주소를 입력합니다.
4. 도메인의 DNS를 서버 IP에 연결하고 80·443 포트를 엽니다. Caddy가 HTTPS 인증서를 발급합니다.
5. 카카오 JavaScript SDK 허용 도메인에 배포 주소를 등록합니다.
6. 프로젝트 루트에서 실행합니다.

```bash
cd ~/Capstone
sudo bash deploy/ubuntu-deploy.sh
sudo docker compose -f docker-compose.prod.yml logs -f
```

스크립트는 환경변수를 검사하고 빌드·실행 후 준비 상태를 기다립니다. 코드 수정 후 같은 명령으로 재배포합니다.
중지는 `sudo docker compose -f docker-compose.prod.yml down`을 사용합니다.

## 주요 파일

| 파일 | 역할 |
| --- | --- |
| `docker-compose.yml` | 로컬 개발용 |
| `docker-compose.prod.yml` | Ubuntu 배포용 서비스 구성 |
| `.env` | 서버 도메인·API 키·DB 비밀번호 |
| `frontend/Dockerfile.prod` | Nginx 웹 이미지와 Node API 이미지 빌드 |
| `frontend/nginx.conf` | React 라우팅, API 프록시, 정적 파일 캐시 |
| `backend/Dockerfile` | Java 21 백엔드 빌드·실행 |
| `backend/src/main/resources/application.properties` | 환경변수로 DB·쿠키·공개 주소 설정 |
| `deploy/Caddyfile` | HTTPS 인증서와 프록시 |
| `deploy/ubuntu-deploy.sh` | Ubuntu 배포 명령 |

프런트엔드는 기존 `/api/...` 상대 경로를 사용하므로 서버 IP를 소스에 하드코딩하지 않습니다.

로컬 개발은 기존 `docker compose up -d --no-build`와 `frontend/.env.local`을 사용합니다.
배포 환경변수는 루트 `.env`에서 읽습니다. 실제 키는 Git과 이미지에 포함하지 않습니다.
`VITE_KAKAO_JAVASCRIPT_KEY`는 브라우저용 공개 키이며 변경 후 이미지를 다시 빌드해야 합니다.
서버용 키 변경 후에는 위 배포 명령을 다시 실행합니다.

`KMA_API_HUB_KEY`에는 AWS 매분자료와 지상관측 지점정보(AWS) 활용 승인이 필요합니다.
`KMA_SERVICE_KEY`는 강수확률·하늘 상태 예보에 사용합니다.

DB는 `auth-data` 볼륨에 보존됩니다. 운영 데이터가 필요하면 `down -v`를 사용하지 마세요.
기존 DB 볼륨을 사용할 때는 기존 DB 비밀번호를 유지합니다.
배포는 `capstone-prod` 프로젝트를 사용하므로 로컬 개발 컨테이너와 DB 볼륨이 분리됩니다.

도메인 없이 HTTP 동작만 확인하려면 `SITE_ADDRESS=:80`, `FRONTEND_URL=http://서버IP`,
`COOKIE_SECURE=false`로 설정할 수 있습니다. 휴대폰 등 외부 접속에서 위치 기능을 쓰려면 HTTPS가 필요합니다.
