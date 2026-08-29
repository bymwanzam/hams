#!/usr/bin/env bash
# Best-effort wait for Postgres to accept connections before hams-app
# starts, so a request that arrives right at boot doesn't race the
# database. Bounded so a genuinely broken database doesn't hang boot
# forever — if it times out, the app starts anyway; systemd's
# Restart=on-failure on hams-app.service covers the rest.
set -u

HOST="${PGHOST:-127.0.0.1}"
PORT="${PGPORT:-5432}"
MAX_WAIT_SECONDS=30

for _ in $(seq 1 "$MAX_WAIT_SECONDS"); do
  if pg_isready -h "$HOST" -p "$PORT" -q; then
    exit 0
  fi
  sleep 1
done

echo "wait-for-postgres: Postgres not ready after ${MAX_WAIT_SECONDS}s — starting the app anyway." >&2
exit 0
