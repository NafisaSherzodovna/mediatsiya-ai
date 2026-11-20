#!/usr/bin/env bash
# Pull main and restart. Run on EC2 as ubuntu: bash /srv/mediatsiya/deploy/deploy.sh
set -euo pipefail
cd /srv/mediatsiya
git pull --ff-only
cd backend
set -a; . /etc/mediatsiya.env; set +a  # manage.py needs DJANGO_SECRET_KEY too
.venv/bin/pip install -q -r requirements.txt
.venv/bin/python manage.py migrate --noinput
.venv/bin/python manage.py collectstatic --noinput -v0
sudo systemctl restart mediatsiya
sleep 3
curl -fsS localhost:8000/api/health && echo
