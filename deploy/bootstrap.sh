#!/usr/bin/env bash
# One-time server setup for Ubuntu 24.04. Run as root from a copy of this
# deploy/ directory on the server:
#
#   sudo APP_HOST=logman.firma.local PG_MAJOR=17 ./bootstrap.sh
#
#   APP_HOST  canonical hostname (or fixed IP) users will open — required
#   PG_MAJOR  PostgreSQL major version; must be >= the Supabase version — required
#
# Safe to re-run: existing users, databases and the shared .env are kept.
set -euo pipefail

: "${APP_HOST:?set APP_HOST, e.g. APP_HOST=logman.firma.local}"
: "${PG_MAJOR:?set PG_MAJOR to the Supabase Postgres major version (select version();)}"
[ "$(id -u)" -eq 0 ] || { echo "run as root" >&2; exit 1; }

HERE="$(cd "$(dirname "$0")" && pwd)"
APP=/srv/logman
export DEBIAN_FRONTEND=noninteractive

echo "── packages"
apt-get update
apt-get upgrade -y
apt-get install -y ca-certificates curl git nginx rsync ufw unattended-upgrades postgresql-common
timedatectl set-timezone Europe/Bratislava

echo "── node 24"
if ! node --version 2>/dev/null | grep -q '^v24\.'; then
  curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
  apt-get install -y nodejs
fi

echo "── postgresql $PG_MAJOR (PGDG)"
install -d /usr/share/postgresql-common/pgdg
curl -fsSL -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc https://www.postgresql.org/media/keys/ACCC4CF8.asc
. /etc/os-release
echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $VERSION_CODENAME-pgdg main" \
  > /etc/apt/sources.list.d/pgdg.list
apt-get update
apt-get install -y "postgresql-$PG_MAJOR"

# The app and `sudo -u postgres psql` below assume this cluster owns port 5432.
pg_port=$(pg_lsclusters -h | awk -v v="$PG_MAJOR" '$1==v && $2=="main" {print $3}')
if [ "$pg_port" != 5432 ]; then
  echo "postgresql $PG_MAJOR/main listens on port ${pg_port:-?}, expected 5432 — another cluster exists, see pg_lsclusters" >&2
  exit 1
fi

echo "── swap"
mem_mb=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
if [ "$mem_mb" -lt 4000 ] && ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "── firewall"
ufw allow OpenSSH
ufw allow 80/tcp
ufw --force enable

echo "── app user and layout"
id logman >/dev/null 2>&1 || adduser --system --group --shell /bin/bash --home "$APP" logman
mkdir -p "$APP/releases" "$APP/shared"
install -o logman -g logman -m 0755 "$HERE/deploy.sh" "$APP/deploy.sh"
chown logman:logman "$APP" "$APP/releases" "$APP/shared"

echo 'logman ALL=(root) NOPASSWD: /usr/bin/systemctl restart logman' > /etc/sudoers.d/logman
chmod 0440 /etc/sudoers.d/logman
visudo -cf /etc/sudoers.d/logman

if [ ! -f "$APP/.ssh/id_ed25519" ]; then
  sudo -u logman mkdir -p -m 700 "$APP/.ssh"
  sudo -u logman ssh-keygen -q -t ed25519 -N "" -C "logman@$(hostname)" -f "$APP/.ssh/id_ed25519"
fi
sudo -u logman sh -c "ssh-keyscan -t ed25519 github.com >> $APP/.ssh/known_hosts 2>/dev/null; sort -u -o $APP/.ssh/known_hosts $APP/.ssh/known_hosts"

echo "── database"
if ! sudo -u postgres psql -tAc "select 1 from pg_roles where rolname='logman'" | grep -q 1; then
  DB_PASSWORD="$(openssl rand -hex 24)"
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE ROLE logman LOGIN PASSWORD '$DB_PASSWORD'"
fi
if ! sudo -u postgres psql -tAc "select 1 from pg_database where datname='logman'" | grep -q 1; then
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE DATABASE logman OWNER logman"
fi
# Timestamps are `timestamp without time zone`, written as UTC by Drizzle —
# defaultNow() must agree (Supabase runs in UTC).
sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER DATABASE logman SET timezone TO 'UTC'"

echo "── shared .env"
if [ ! -f "$APP/shared/.env" ] && [ -z "${DB_PASSWORD:-}" ]; then
  echo "⚠ role logman already existed, so its password is unknown — write $APP/shared/.env by hand (see .env.example)" >&2
elif [ ! -f "$APP/shared/.env" ]; then
  cat > "$APP/shared/.env" <<EOF
DATABASE_URL="postgresql://logman:$DB_PASSWORD@127.0.0.1:5432/logman"
BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
BETTER_AUTH_URL="http://$APP_HOST"
NEXT_PUBLIC_APP_URL="http://$APP_HOST"
INTERNAL_APP_URL="http://127.0.0.1:3000"
LOG_LEVEL="info"
RESEND_API_KEY="re_CHANGE_ME"
EMAIL_FROM="noreply@CHANGE_ME"
ADMIN_EMAIL="CHANGE_ME"
EOF
  chown logman:logman "$APP/shared/.env"
  chmod 0600 "$APP/shared/.env"
fi

echo "── systemd"
install -m 0644 "$HERE/logman.service" /etc/systemd/system/logman.service
systemctl daemon-reload
systemctl enable logman   # started by the first deploy

echo "── nginx"
sed "s/__APP_HOST__/$APP_HOST/g" "$HERE/nginx/logman.conf" > /etc/nginx/sites-available/logman
ln -sfn /etc/nginx/sites-available/logman /etc/nginx/sites-enabled/logman
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "── backups"
install -d -o postgres -g postgres -m 0750 /var/backups/logman
install -m 0755 "$HERE/backup.sh" /usr/local/bin/logman-backup
install -m 0644 "$HERE/logman-backup.cron" /etc/cron.d/logman-backup

echo "── journald size cap"
mkdir -p /etc/systemd/journald.conf.d
printf '[Journal]\nSystemMaxUse=500M\n' > /etc/systemd/journald.conf.d/logman.conf
systemctl restart systemd-journald

cat <<EOF

✔ Bootstrap done. Next steps:
  1. Add this deploy key (read-only) to github.com/qbitsk/logman-pb → Settings → Deploy keys:
     $(cat "$APP/.ssh/id_ed25519.pub")
  2. Fill in RESEND_API_KEY, EMAIL_FROM, ADMIN_EMAIL in $APP/shared/.env
  3. Restore the Supabase data (deploy/README.md → "Migrating data from Supabase")
  4. sudo -iu logman $APP/deploy.sh <tag>
EOF
