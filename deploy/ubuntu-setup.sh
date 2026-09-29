#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo 'Run: sudo bash deploy/ubuntu-setup.sh' >&2
  exit 1
fi
source /etc/os-release
if [[ ${ID:-} != ubuntu ]]; then
  echo 'This installer is for Ubuntu. Use the Docker installation guide for your OS.' >&2
  exit 1
fi
if command -v docker >/dev/null 2>&1; then
  docker version
  docker compose version
  echo 'Docker is already installed. Existing installation was preserved.'
  exit 0
fi

# Official Docker apt repository: https://docs.docker.com/engine/install/ubuntu/
apt-get update
apt-get install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
cat > /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: ${UBUNTU_CODENAME:-$VERSION_CODENAME}
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
docker version
docker compose version
