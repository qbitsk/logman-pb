#!/usr/bin/env bash
# Deploy from your machine: optionally bump + tag the version, push it, then run
# /opt/logman/deploy.sh on the server over SSH as the `logman` user.
#
#   deploy/release.sh patch|minor|major   npm version <bump>, push main + tag, deploy it
#   deploy/release.sh <tag>               deploy an existing tag (must be on origin)
#   deploy/release.sh                     deploy the version in package.json
#   deploy/release.sh --activate <tag>    switch to an already-built release (rollback)
#   deploy/release.sh --releases          list built releases and the active one
#   deploy/release.sh --status            systemctl status logman
#   deploy/release.sh --logs              follow the app log (logman must be in systemd-journal)
#   deploy/release.sh --sync-script       upload deploy/deploy.sh to the server
#
# Options: -y  skip the confirmation prompt
# Env:     LOGMAN_SSH  SSH target (default: logman@logman-server-linux)
set -euo pipefail

SSH_TARGET="${LOGMAN_SSH:-logman@logman-server-linux}"
APP=/opt/logman

die() { echo "✘ $*" >&2; exit 1; }
usage() { sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'; exit "${1:-0}"; }

cd "$(git rev-parse --show-toplevel)"

YES=0
args=()
for a in "$@"; do
  case "$a" in
    -y|--yes) YES=1 ;;
    -h|--help) usage ;;
    *) args+=("$a") ;;
  esac
done
set -- "${args[@]+"${args[@]}"}"

valid_tag() { [[ "$1" =~ ^[A-Za-z0-9._-]+$ ]] || die "invalid tag: $1"; }

confirm() {
  [ "$YES" = 1 ] && return 0
  read -r -p "$1 [y/N] " ans
  [[ "$ans" =~ ^[yY]$ ]] || die "aborted"
}

tag_on_origin() {
  git ls-remote --exit-code --tags origin "refs/tags/$1" >/dev/null 2>&1
}

pkg_version() { node -p "require('./package.json').version"; }

# Bumping creates a commit on main, so the tree must be clean and not behind origin.
check_main() {
  [ "$(git branch --show-current)" = main ] || die "not on main"
  [ -z "$(git status --porcelain)" ] || die "uncommitted changes — commit or stash them first"
  git fetch --quiet origin main
  git merge-base --is-ancestor origin/main HEAD || die "main is behind origin/main — pull first"
}

deploy_tag() {
  local tag="$1"
  valid_tag "$tag"
  tag_on_origin "$tag" || die "tag $tag is not on origin — push it first: git push origin $tag"
  confirm "Deploy $tag to $SSH_TARGET?"
  echo "→ deploying $tag on $SSH_TARGET"
  ssh -t "$SSH_TARGET" "$APP/deploy.sh $tag"
}

case "${1:-}" in
  patch|minor|major)
    check_main
    confirm "Bump $(pkg_version) ($1), push to origin and deploy to $SSH_TARGET?"
    YES=1   # one confirmation covers the whole release
    npm version "$1"
    TAG="$(pkg_version)"
    git push origin main
    git push origin "refs/tags/$TAG"
    deploy_tag "$TAG"
    ;;
  --activate)
    TAG="${2:?usage: release.sh --activate <tag>}"
    valid_tag "$TAG"
    confirm "Activate release $TAG on $SSH_TARGET?"
    ssh -t "$SSH_TARGET" "$APP/deploy.sh --activate $TAG"
    ;;
  --releases)
    ssh "$SSH_TARGET" "ls -1t $APP/releases; echo; echo \"active: \$(basename \"\$(readlink $APP/current)\")\""
    ;;
  --status)
    ssh -t "$SSH_TARGET" "systemctl status logman --no-pager"
    ;;
  --logs)
    ssh -t "$SSH_TARGET" "journalctl -u logman -n 100 -f"
    ;;
  --sync-script)
    confirm "Replace $APP/deploy.sh on $SSH_TARGET with deploy/deploy.sh?"
    # Write to a temp file and rename, so a deploy running right now isn't affected.
    ssh "$SSH_TARGET" "cat > $APP/deploy.sh.new && chmod 755 $APP/deploy.sh.new && mv -f $APP/deploy.sh.new $APP/deploy.sh" \
      < deploy/deploy.sh
    echo "✔ $APP/deploy.sh updated"
    ;;
  -*)
    usage 1
    ;;
  "")
    deploy_tag "$(pkg_version)"
    ;;
  *)
    deploy_tag "$1"
    ;;
esac
