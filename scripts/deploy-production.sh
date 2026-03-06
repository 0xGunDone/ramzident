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

  local changed=0

  if grep -q "^WorkingDirectory=" "$SERVICE_FILE" && ! grep -Fq "WorkingDirectory=${APP_DIR}" "$SERVICE_FILE"; then
    log "Syncing WorkingDirectory in ${SERVICE_FILE}"
    run_root sed -i.bak "s|^WorkingDirectory=.*|WorkingDirectory=${APP_DIR}|" "$SERVICE_FILE"
    changed=1
  fi

  if grep -q "^EnvironmentFile=" "$SERVICE_FILE" && ! grep -Fq "EnvironmentFile=${APP_DIR}/.env" "$SERVICE_FILE"; then
    log "Syncing EnvironmentFile in ${SERVICE_FILE}"
    run_root sed -i.bak "s|^EnvironmentFile=.*|EnvironmentFile=${APP_DIR}/.env|" "$SERVICE_FILE"
    changed=1
  fi

  if ! grep -q "^ProtectSystem=full" "$SERVICE_FILE"; then
    if [ "$changed" -eq 1 ]; then
      run_root systemctl daemon-reload
    fi
    return
  fi

  if grep -Fq "$APP_DIR" "$SERVICE_FILE"; then
    if [ "$changed" -eq 1 ]; then
      run_root systemctl daemon-reload
    fi
    return
  fi

  log "Adding ${APP_DIR} to ReadWritePaths in ${SERVICE_FILE}"

  if grep -q "^ReadWritePaths=" "$SERVICE_FILE"; then
    run_root sed -i.bak "/^ReadWritePaths=/ s|\$| ${APP_DIR}|" "$SERVICE_FILE"
  else
    run_root sh -c "printf '\nReadWritePaths=%s\n' '$APP_DIR' >> '$SERVICE_FILE'"
  fi

  changed=1

  if [ "$changed" -eq 1 ]; then
    run_root systemctl daemon-reload
  fi
}

prewarm_routes() {
  local site_url="${SITE_URL:-}"

  if [ -z "$site_url" ] && [ -f "${APP_DIR}/.env" ]; then
    site_url="$(grep -E '^SITE_URL=' "${APP_DIR}/.env" | tail -n 1 | cut -d= -f2- | tr -d '"' || true)"
  fi

  if [ -z "$site_url" ]; then
    return
  fi

  log "Prewarming homepage and OG routes"
  run_as_app "curl -fsS '${site_url}/' >/dev/null"
  run_as_app "curl -fsS '${site_url}/opengraph-image' >/dev/null"
  run_as_app "curl -fsS '${site_url}/twitter-image' >/dev/null"
}

sync_service_paths() {
  sync_service_writable_path
}

main() {
  require_repo

  log "Deploying ${APP_DIR}"
  ensure_repo_ownership
  ensure_writable_paths
  sync_service_paths

  log "Pulling ${DEPLOY_REMOTE}/${DEPLOY_BRANCH}"
  run_as_app "cd '$APP_DIR' && git pull --ff-only '$DEPLOY_REMOTE' '$DEPLOY_BRANCH'"

  ensure_repo_ownership
  ensure_writable_paths
  sync_service_paths

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
  run_root systemctl daemon-reload
  run_root systemctl restart "$SERVICE_NAME"
  prewarm_routes

  log "Deployment complete"
}

main "$@"
