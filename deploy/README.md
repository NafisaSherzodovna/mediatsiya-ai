# EC2 deploy (role A)

Backend: `https://<ip-with-dashes>.sslip.io` (nginx + Let's Encrypt in front of gunicorn on 127.0.0.1:8000). Netlify proxies `/api/*` and `/admin/*` to it.

## 1. AWS console, region eu-central-1 (Frankfurt)

1. EC2 → Launch instance: Ubuntu Server 24.04 LTS, `t3.small`, 20 GB gp3, a new key pair (keep the `.pem` private).
2. Security group: SSH 22 from *My IP* only; HTTP 80 and HTTPS 443 from `0.0.0.0/0`.
3. Elastic IPs → Allocate → Associate with the instance (before `setup.sh`: the sslip.io name and the certificate use this IP).
4. Billing → Budgets → monthly cost budget $20 with an e-mail alert.

Rough cost (checked 2026-11-20): public IPv4 $0.005/h (attached Elastic IPs are charged too, aws.amazon.com/vpc/pricing),
t3.small about $0.021/h (instances.vantage.sh, taxminiy). About $19/month plus the disk: **stop or terminate the instance
and release the Elastic IP after the hackathon.**

## 2. One-time server setup

```
ssh -i key.pem ubuntu@<ELASTIC_IP>
curl -fsSL https://raw.githubusercontent.com/NafisaSherzodovna/mediatsiya-ai/main/deploy/setup.sh -o setup.sh && bash setup.sh
```

It asks for `GEMINI_API_KEYS` and `DEMO_RESET_KEY` (from the team chat), generates `DJANGO_SECRET_KEY`, writes
`/etc/mediatsiya.env` (root:ubuntu, 640), installs the systemd unit, runs `deploy.sh`, seeds the demo data, asks for a new
`admin` password, then sets up nginx and the certificate. Put the printed `https://…sslip.io` into `netlify.toml`.

## 3. Every update

```
ssh -i key.pem ubuntu@<ELASTIC_IP> bash /srv/mediatsiya/deploy/deploy.sh
```

Logs: `journalctl -u mediatsiya -f`. Check from the laptop: `curl https://<ip-with-dashes>.sslip.io/api/health` → `{"ok": true, "ai": true}`.
