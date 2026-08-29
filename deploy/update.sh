#!/usr/bin/env bash
# Deploys an updated copy of this app onto a server already provisioned by
# install.sh. Run as root, from inside a checked-out copy of the updated
# source:
#   sudo bash deploy/update.sh
set -euo pipefail

APP_DIR="/opt/hams"
APP_USER="hams"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ $EUID -ne 0 ]]; then
  echo "Run this as root: sudo bash deploy/update.sh" >&2
  exit 1
fi

run_as_app() {
  sudo -u "$APP_USER" -H bash -c "cd '$APP_DIR' && $1"
}

echo "==> Stopping the app (Postgres and its data are untouched)"
systemctl stop hams-app.service

echo "==> Syncing updated source to $APP_DIR"
rsync -a --delete \
  --exclude node_modules --exclude .next --exclude .git --exclude backups --exclude .env \
  "$SOURCE_DIR"/ "$APP_DIR"/
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

echo "==> Installing dependencies"
run_as_app "npm ci"

echo "==> Generating Prisma client"
run_as_app "npm run db:generate"

echo "==> Applying any new database migrations"
run_as_app "npm run db:migrate:deploy"

echo "==> Rebuilding"
run_as_app "npm run build"

echo "==> Re-installing systemd units (in case they changed) and restarting"
cp "$APP_DIR/deploy/hams-db.service" /etc/systemd/system/hams-db.service
cp "$APP_DIR/deploy/hams-app.service" /etc/systemd/system/hams-app.service
chmod +x "$APP_DIR/deploy/wait-for-postgres.sh"
systemctl daemon-reload
systemctl restart hams-db.service
systemctl restart hams-app.service

echo "Done. Check status: systemctl status hams-app"
