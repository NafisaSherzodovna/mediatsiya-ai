#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu 24.04 EC2 instance. Run as ubuntu:
#   curl -fsSL https://raw.githubusercontent.com/NafisaSherzodovna/mediatsiya-ai/main/deploy/setup.sh -o setup.sh && bash setup.sh
set -euo pipefail
APP=/srv/mediatsiya
# Secrets come from the team privately, never from git. Asked first: apt-get would eat piped stdin.
if [ ! -f /etc/mediatsiya.env ]; then
  read -rsp "GEMINI_API_KEYS (key1,key2): " GEMINI; echo
  read -rsp "DEMO_RESET_KEY (empty = generate): " DEMO; echo
  SECRET=$(head -c 48 /dev/urandom | base64 | tr -d '/+=')
  DEMO=${DEMO:-$(head -c 16 /dev/urandom | base64 | tr -d '/+=')}
  printf 'DJANGO_SECRET_KEY=%s\nDEBUG=0\nGEMINI_API_KEYS=%s\nDEMO_RESET_KEY=%s\n' "$SECRET" "$GEMINI" "$DEMO" \
    | sudo tee /etc/mediatsiya.env >/dev/null
  sudo chown root:ubuntu /etc/mediatsiya.env
  sudo chmod 640 /etc/mediatsiya.env
fi

sudo apt-get update -y
sudo apt-get install -y python3.12-venv git ffmpeg
sudo mkdir -p "$APP" && sudo chown ubuntu:ubuntu "$APP"
[ -d "$APP/.git" ] || git clone https://github.com/NafisaSherzodovna/mediatsiya-ai.git "$APP"
[ -d "$APP/backend/.venv" ] || python3.12 -m venv "$APP/backend/.venv"

sudo cp "$APP/deploy/mediatsiya.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mediatsiya
bash "$APP/deploy/deploy.sh"
