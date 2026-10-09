#!/usr/bin/env bash
# Nightly PostgreSQL backup. Installed to /usr/local/bin/logman-backup and run
# as the `postgres` user from /etc/cron.d/logman-backup (peer auth, no password).
#
# Optional: set BACKUP_RSYNC_TARGET (e.g. backup@nas.local:/volume1/logman/) in
# the cron file to copy each dump off the server. The postgres user then needs
# an SSH key authorized on the target.
set -euo pipefail

DB="${BACKUP_DB:-logman}"
DIR="${BACKUP_DIR:-/var/backups/logman}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"

file="$DIR/$DB-$(date +%F_%H%M).dump"

pg_dump -Fc "$DB" > "$file.partial"
mv "$file.partial" "$file"

find "$DIR" -name "$DB-*.dump" -mtime +"$KEEP_DAYS" -delete

if [ -n "${BACKUP_RSYNC_TARGET:-}" ]; then
  rsync -a "$file" "$BACKUP_RSYNC_TARGET"
fi
