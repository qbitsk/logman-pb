# deploy/

Config files and scripts for the self-hosted deployment (Ubuntu 24.04, local PostgreSQL).
The step-by-step guide is in the main [README → Self-hosted Deployment](../README.md#self-hosted-deployment-ubuntu-2404).

| File | Installed to | Purpose |
|---|---|---|
| `deploy.sh` | `/opt/logman/deploy.sh` | Build and activate a release (`deploy.sh <tag>`), roll back (`deploy.sh --activate <tag>`) |
| `logman.service` | `/etc/systemd/system/logman.service` | systemd unit running `next start` on `127.0.0.1:3000` |
| `nginx/logman.conf` | `/etc/nginx/sites-available/logman` | HTTP reverse proxy; replace `__APP_HOST__` with the hostname |
| `backup.sh` | `/usr/local/bin/logman-backup` | Nightly `pg_dump`, 14-day retention, optional rsync off-server |
| `logman-backup.cron` | `/etc/cron.d/logman-backup` | Runs the backup at 02:30 as `postgres` |
| `bootstrap.sh` | — (run once as root) | Optional: automates the README's first-time setup steps 1–12 (`sudo APP_HOST=… PG_MAJOR=… ./bootstrap.sh`) |
