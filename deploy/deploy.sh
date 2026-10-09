#!/usr/bin/env bash
# Build and activate a release on the server. Installed to /srv/logman/deploy.sh,
# runs as the `logman` user.
#
#   deploy.sh <tag>              clone <tag>, build, migrate, activate
#   deploy.sh --activate <tag>   switch to an already-built release (rollback)
#
# From your machine:
#   ssh <server> 'sudo -iu logman /srv/logman/deploy.sh v0.11.0'
set -euo pipefail

APP=/srv/logman
REPO="${LOGMAN_REPO:-git@github.com:qbitsk/logman-pb.git}"
KEEP_RELEASES=3
HEALTH_URL=http://127.0.0.1:3000/login

die() { echo "✘ $*" >&2; exit 1; }

[ "$(id -un)" = logman ] || die "run as the logman user: sudo -iu logman $0 $*"

activate() {
  local rel="$1"
  ln -sfn "$rel" "$APP/current.tmp"
  mv -Tf "$APP/current.tmp" "$APP/current"   # atomic symlink swap
  sudo /usr/bin/systemctl restart logman

  for _ in $(seq 1 30); do
    if curl -fsS -o /dev/null "$HEALTH_URL"; then
      echo "✔ $(basename "$rel") is live"
      return 0
    fi
    sleep 1
  done
  die "$(basename "$rel") did not answer on $HEALTH_URL — check: journalctl -u logman -n 100"
}

prune() {
  local cur
  cur="$(readlink -f "$APP/current")"
  ls -1dt "$APP"/releases/*/ 2>/dev/null | sed 's:/$::' | grep -vxF "$cur" \
    | tail -n +"$KEEP_RELEASES" | xargs -r rm -rf
}

if [ "${1:-}" = "--activate" ]; then
  TAG="${2:?usage: deploy.sh --activate <tag>}"
  [ -d "$APP/releases/$TAG" ] || die "no release $TAG in $APP/releases"
  activate "$APP/releases/$TAG"
  exit 0
fi

TAG="${1:?usage: deploy.sh <tag> | deploy.sh --activate <tag>}"
REL="$APP/releases/$TAG"
[ -e "$REL" ] && die "$REL already exists (use --activate $TAG, or remove it to rebuild)"
[ -f "$APP/shared/.env" ] || die "missing $APP/shared/.env"

trap 'echo "✘ deploy of $TAG failed; the live release is unchanged" >&2; rm -rf "$REL"' ERR

git clone --quiet --depth 1 --branch "$TAG" "$REPO" "$REL"
ln -s "$APP/shared/.env" "$REL/.env"
cd "$REL"

set -a; . "$APP/shared/.env"; set +a
export NEXT_TELEMETRY_DISABLED=1

npm ci --include=dev --no-audit --no-fund   # devDeps are needed to build and migrate
npm run build
npm run db:migrate   # keep migrations backward-compatible: --activate does not undo them

trap - ERR
activate "$REL"
prune
