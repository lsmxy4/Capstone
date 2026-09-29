#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  echo 'Install Docker Engine and the Docker Compose plugin first. See deploy/README.md.' >&2
  exit 1
fi
if [[ ! -f .env ]]; then
  cp .env.example .env
  chmod 600 .env
  echo 'Created .env. Fill domain, DB password and API keys, then run this script again.' >&2
  exit 1
fi
chmod 600 .env
if grep -Eq '^[[:space:]]*(SITE_ADDRESS|FRONTEND_URL)=.*example\.com' .env; then
  echo 'Replace the example domain in SITE_ADDRESS and FRONTEND_URL in .env.' >&2
  exit 1
fi
docker compose --env-file .env -f docker-compose.prod.yml config --quiet
docker compose --env-file .env -f docker-compose.prod.yml up -d --build --wait --wait-timeout 180
docker compose --env-file .env -f docker-compose.prod.yml ps
