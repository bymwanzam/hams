#!/usr/bin/env bash
# One-time provisioning for a fresh Ubuntu/Debian server. Installs Docker,
# Node.js 22, and the PostgreSQL client tools (for pg_dump backups);
# deploys this app to /opt/hams; and wires Postgres + the app to start
# automatically on every boot via systemd — the only manual step left is
# opening the browser. See README.md > Facility deployment.
#
# Run as root, from inside a checked-out copy of this repo:
#   sudo bash deploy/install.sh
#
# Safe to re-run: steps that are already done (Docker/Node already
# installed, .env already written) are skipped or no-ops.
set -euo pipefail

APP_DIR="/opt/hams"
APP_USER="hams"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ $EUID -ne 0 ]]; then
  echo "Run this as root: sudo bash deploy/install.sh" >&2
  exit 1
fi

run_as_app() {
  sudo -u "$APP_USER" -H bash -c "cd '$APP_DIR' && $1"
}

# `npm ci` pulls a lot over the network; facility links are often thin and
# flaky. .npmrc already tunes timeouts/retries — this retries the whole
# command a few times on top of that, cleaning a half-written tree first.
run_as_app_retry() {
  local attempt
  for attempt in 1 2 3; do
    run_as_app "$1" && return 0
    echo "    (attempt $attempt failed; retrying in 15s)" >&2
    sleep 15
  done
  run_as_app "$1"
}

echo "==> [1/11] Installing prerequisites"
apt-get update -y
apt-get install -y ca-certificates curl gnupg rsync openssl

echo "==> [2/11] Installing Docker Engine (if missing)"
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi
systemctl enable --now docker

echo "==> [3/11] Installing Node.js 22 (if missing)"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v22.* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

echo "==> [4/11] Installing PostgreSQL client tools (for pg_dump backups)"
if ! command -v pg_dump >/dev/null 2>&1; then
  apt-get install -y postgresql-client || apt-get install -y postgresql-client-16
fi

echo "==> [5/11] Creating service user '$APP_USER'"
id -u "$APP_USER" &>/dev/null || \
  useradd --system --create-home --home-dir "$APP_DIR" --shell /usr/sbin/nologin "$APP_USER"

echo "==> [6/11] Deploying application files to $APP_DIR"
mkdir -p "$APP_DIR"
rsync -a --delete \
  --exclude node_modules --exclude .next --exclude .git --exclude backups --exclude .env \
  "$SOURCE_DIR"/ "$APP_DIR"/

echo "==> [7/11] Writing production .env"
if [[ ! -f "$APP_DIR/.env" ]]; then
  DB_PASSWORD="$(openssl rand -hex 24)"
  AUTH_SECRET="$(openssl rand -base64 32)"
  LAN_IP="$(hostname -I | awk '{print $1}')"
  cat > "$APP_DIR/.env" <<EOF
DATABASE_URL="postgresql://hams_user:${DB_PASSWORD}@127.0.0.1:5432/hams_db?schema=public"
POSTGRES_USER=hams_user
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=hams_db
AUTH_SECRET="${AUTH_SECRET}"
AUTH_URL="http://${LAN_IP}:3000"
EOF
  echo "    Generated a new DB password, AUTH_SECRET, and AUTH_URL=http://${LAN_IP}:3000"
  echo "    *** If this server has more than one network interface, or you want staff"
  echo "    *** to reach it by a LAN hostname instead of an IP, edit $APP_DIR/.env now"
  echo "    *** (AUTH_URL) and re-run: systemctl restart hams-app"
else
  echo "    $APP_DIR/.env already exists — leaving it as-is."
fi
chown "$APP_USER":"$APP_USER" "$APP_DIR/.env"
chmod 600 "$APP_DIR/.env"
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

echo "==> [8/11] Starting PostgreSQL"
cd "$APP_DIR"
docker compose up -d
echo -n "    Waiting for Postgres to accept connections"
for _ in $(seq 1 30); do
  pg_isready -h 127.0.0.1 -p 5432 -q && break
  echo -n "."
  sleep 1
done
echo

echo "==> [9/11] Installing dependencies, generating client, migrating, seeding"
run_as_app_retry "npm ci"
run_as_app "npm run db:generate"
run_as_app "npm run db:migrate:deploy"
run_as_app "npm run db:seed"

echo "==> [10/11] Building production bundle"
run_as_app "npm run build"

echo "==> [11/11] Installing and enabling systemd services"
cp "$APP_DIR/deploy/hams-db.service" /etc/systemd/system/hams-db.service
cp "$APP_DIR/deploy/hams-app.service" /etc/systemd/system/hams-app.service
chmod +x "$APP_DIR/deploy/wait-for-postgres.sh"
systemctl daemon-reload
systemctl enable --now hams-db.service
systemctl enable --now hams-app.service

if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  echo "    Opening firewall port 3000 (ufw is active)"
  ufw allow 3000/tcp
fi

echo
echo "================================================================"
echo " Done. HAMS now starts automatically on every boot — Postgres,"
echo " then the app — with no manual steps."
echo
echo " Open:  http://$(hostname -I | awk '{print $1}'):3000"
echo " Login: admin@hospital.local / ChangeMe123!"
echo "        Change this password immediately, then go to Hospital Setup"
echo "        and rename the seeded facility to this hospital's own name."
echo
echo " Check status:  systemctl status hams-app hams-db"
echo " View logs:     journalctl -u hams-app -f"
echo " Update later:  sudo bash deploy/update.sh  (from an updated checkout)"
echo "================================================================"
