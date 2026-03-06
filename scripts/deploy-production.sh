#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-$(cd -- "$SCRIPT_DIR/.." && pwd)}"
APP_USER="${APP_USER:-ramzident}"
APP_GROUP="${APP_GROUP:-$APP_USER}"
SERVICE_NAME="${SERVICE_NAME:-ramzident}"
SERVICE_FILE="${SERVICE_FILE:-/etc/systemd/system/${SERVICE_NAME}.service}"
DEPLOY_REMOTE="${DEPLOY_REMOTE:-origin}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"

PRISMA_DIR="${APP_DIR}/prisma"
DB_FILE="${PRISMA_DIR}/dev.db"
UPLOADS_DIR="${APP_DIR}/public/uploads"

log() {
  printf "==> %s\n" "$*"
}

run_root() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  else
    sudo "$@"
  fi
}

run_as_app() {
  local cmd="$1"

  if [ "$(id -u)" -eq 0 ]; then
    su -s /bin/bash "$APP_USER" -c "$cmd"
  else
    sudo -u "$APP_USER" bash -lc "$cmd"
  fi
}

require_repo() {
  if [ ! -d "${APP_DIR}/.git" ]; then
    printf "Repository not found at %s\n" "$APP_DIR" >&2
    exit 1
  fi
}

ensure_repo_ownership() {
  log "Fixing repository ownership"
  run_root chown -R "${APP_USER}:${APP_GROUP}" "$APP_DIR"
}

ensure_writable_paths() {
  log "Ensuring writable Prisma and uploads paths"
  run_root install -d -m 755 -o "$APP_USER" -g "$APP_GROUP" "$PRISMA_DIR"
  run_root install -d -m 755 -o "$APP_USER" -g "$APP_GROUP" "$UPLOADS_DIR"
  run_root touch "$DB_FILE"
  run_root chown "${APP_USER}:${APP_GROUP}" "$DB_FILE"
  run_root chmod 664 "$DB_FILE"
  run_root chown -R "${APP_USER}:${APP_GROUP}" "$PRISMA_DIR" "$UPLOADS_DIR"
}

sync_service_writable_path() {
  if [ ! -f "$SERVICE_FILE" ]; then
    return
  fi

  if ! grep -q "^ProtectSystem=full" "$SERVICE_FILE"; then
    return
  fi

  if grep -Fq "$APP_DIR" "$SERVICE_FILE"; then
    return
  fi

  log "Adding ${APP_DIR} to ReadWritePaths in ${SERVICE_FILE}"

  if grep -q "^ReadWritePaths=" "$SERVICE_FILE"; then
    run_root sed -i.bak "/^ReadWritePaths=/ s|\$| ${APP_DIR}|" "$SERVICE_FILE"
  else
    run_root sh -c "printf '\nReadWritePaths=%s\n' '$APP_DIR' >> '$SERVICE_FILE'"
  fi

  run_root systemctl daemon-reload
}

main() {
  require_repo

  log "Deploying ${APP_DIR}"
  ensure_repo_ownership
  ensure_writable_paths
  sync_service_writable_path

  log "Pulling ${DEPLOY_REMOTE}/${DEPLOY_BRANCH}"
  run_as_app "cd '$APP_DIR' && git pull --ff-only '$DEPLOY_REMOTE' '$DEPLOY_BRANCH'"

  ensure_repo_ownership
  ensure_writable_paths

  log "Installing dependencies"
  run_as_app "cd '$APP_DIR' && npm install"

  log "Generating Prisma client"
  run_as_app "cd '$APP_DIR' && npx prisma generate"

  log "Applying database migrations"
  run_as_app "cd '$APP_DIR' && npx prisma migrate deploy"

  ensure_writable_paths

  log "Building application"
  run_as_app "cd '$APP_DIR' && npm run build"

  ensure_writable_paths

  log "Restarting ${SERVICE_NAME}"
  run_root systemctl restart "$SERVICE_NAME"

  log "Deployment complete"
}

main "$@"
