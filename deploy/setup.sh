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
sudo apt-get install -y python3.12-venv git ffmpeg nginx certbot python3-certbot-nginx
sudo mkdir -p "$APP" && sudo chown ubuntu:ubuntu "$APP"
[ -d "$APP/.git" ] || git clone https://github.com/NafisaSherzodovna/mediatsiya-ai.git "$APP"
[ -d "$APP/backend/.venv" ] || python3.12 -m venv "$APP/backend/.venv"

sudo cp "$APP/deploy/mediatsiya.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable mediatsiya
FRESH=$([ -f "$APP/backend/db.sqlite3" ] || echo 1)
bash "$APP/deploy/deploy.sh"
# demo data only on the first run: --wipe later would delete real cases
[ -z "$FRESH" ] || (cd "$APP/backend" && set -a && . /etc/mediatsiya.env && set +a && .venv/bin/python manage.py seed_demo && .venv/bin/python manage.py changepassword admin)  # admin123 is public in the repo

# HTTPS without a domain: <ip-with-dashes>.sslip.io resolves to this server (needs the Elastic IP attached first)
T=$(curl -fsSX PUT http://169.254.169.254/latest/api/token -H "X-aws-ec2-metadata-token-ttl-seconds: 60")
IP=$(curl -fsS -H "X-aws-ec2-metadata-token: $T" http://169.254.169.254/latest/meta-data/public-ipv4)
HOST="${IP//./-}.sslip.io"
sed "s/HOST/$HOST/" "$APP/deploy/nginx.conf" | sudo tee /etc/nginx/sites-available/mediatsiya >/dev/null
sudo ln -sf /etc/nginx/sites-available/mediatsiya /etc/nginx/sites-enabled/mediatsiya
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d "$HOST" --non-interactive --agree-tos --register-unsafely-without-email --redirect
curl -fsS "https://$HOST/api/health" && echo && echo "Backend: https://$HOST"
