# BIT Health Systems — Hospital Administration & Management System

Self-hosted hospital administration and management system. See
[`ARCHITECTURE.md`](./ARCHITECTURE.md) for the design and full module map.

## Local / on-prem setup

**Requirements:** Node.js 20+, Docker (for Postgres) or an existing
PostgreSQL 14+ server.

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL (or point .env at your own on-prem instance)
docker compose up -d

# 3. Configure environment
cp .env.example .env   # then edit DATABASE_URL / NEXTAUTH_SECRET

# 4. Generate the Prisma client and create the database schema
npm run db:generate
npm run db:migrate

# 5. Seed an initial admin user + facility
npm run db:seed

# 6. Run the app
npm run dev
```

Visit `http://localhost:3000`, log in with:

```
email:    admin@hospital.local
password: ChangeMe123!
```

**Change this password immediately** (a proper "change password" flow is a
good next module to build, in `src/app/dashboard/users`).

Then go to **Hospital Setup** (`/dashboard/facilities`) and rename the seeded
"Main Hospital" facility to your actual hospital's name, address and phone
number. This is the one thing every new deployment needs to do — the hospital
name you set as "main" there is what shows up on the sidebar, the login page,
the browser tab title, and patient ID cards. The same codebase can be
deployed per-hospital just by pointing it at a fresh database and running
through this setup step with that hospital's own details.

## Backups

**Requires the PostgreSQL client tools** (`pg_dump`/`pg_restore`) installed
on the server the app runs on — separate from the `postgres:16` server
image `docker-compose.yml` runs, since `pg_dump` is a client tool. Install
the `postgresql-client` package (Debian/Ubuntu: `apt install
postgresql-client`) or the matching client tools for your OS; on Windows,
the PostgreSQL installer includes them. If `pg_dump` isn't on `PATH`, set
`PG_DUMP_PATH` in `.env` to its full path.

Go to **Data Backup** (`/dashboard/backup`, ADMIN role only):

- **Manual** — click "Backup Now" any time.
- **Automatic** — runs on its own on a schedule (every 24 hours by
  default) as long as the app process (`npm start`) is running; no extra
  cron setup needed. Configure `BACKUP_AUTO_ENABLED`,
  `BACKUP_INTERVAL_HOURS`, `BACKUP_RETENTION_COUNT`, and `BACKUP_DIR` in
  `.env` — see `.env.example`.

Both write a `pg_dump` custom-format file to `BACKUP_DIR` (`./backups` by
default, gitignored). The oldest backups beyond `BACKUP_RETENTION_COUNT`
are deleted automatically after each new one. Download any backup from
that page — do this regularly for anything you need to survive the loss of
the server itself, since a backup that only ever lives on the same disk as
the database isn't a real disaster-recovery plan.

**To restore** a backup onto a running Postgres instance:

```bash
pg_restore --dbname="$DATABASE_URL" --clean --if-exists --no-owner hams-backup-manual-20260826T140000.dump
```

`--clean --if-exists` drops existing objects first, so this is meant for
restoring into an empty or disposable database, not merging into one with
live data.

## Facility deployment (Linux — boots straight to running)

For a hospital's own server (bare metal or VM, Ubuntu/Debian), `deploy/`
automates the whole thing: Postgres and the app both start on their own
when the machine powers on, so the only manual step for anyone after that
is opening a browser.

```bash
# On the target server, from a checked-out copy of this repo:
sudo bash deploy/install.sh
```

This one script:

1. Installs Docker Engine, Node.js 20, and the PostgreSQL client tools
   (`pg_dump`, for backups) if they aren't already present.
2. Creates a dedicated, unprivileged `hams` system user and deploys the
   app to `/opt/hams`, owned by that user.
3. Generates a fresh `.env` with a random database password and
   `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` set to this machine's LAN IP —
   edit `/opt/hams/.env` afterwards if it has more than one network
   interface or you'd rather use a LAN hostname.
4. Starts Postgres, runs migrations and the seed script, and builds the
   app.
5. Installs two systemd services — `hams-db` (Postgres, via Docker
   Compose) and `hams-app` (the Next.js app, run as the `hams` user) —
   and enables both, so `systemctl` starts them automatically on every
   boot, in the right order, before any user logs in.
6. Opens firewall port 3000 if `ufw` is active.

When it finishes, it prints the LAN URL to open and the default admin
login — change that password immediately, then go to **Hospital Setup**
and rename the seeded facility (see above). From then on, power-cycling
the server is the entire deployment story: no console, no login, no
manual `npm start` — walk up to any machine on the LAN and open the URL.

Useful commands afterwards:

```bash
systemctl status hams-app hams-db   # is it running?
journalctl -u hams-app -f           # tail the app's logs
sudo systemctl restart hams-app     # restart just the app
```

**Updating** the app later (new code, same server): copy/pull the updated
source anywhere on the box and run `sudo bash deploy/update.sh` from
inside it — it re-syncs `/opt/hams`, migrates, rebuilds, and restarts
`hams-app` without touching Postgres or its data.

**Not on Linux, or deploying by hand?** The manual equivalent `deploy/`
automates is:

```bash
npm ci
docker compose up -d
npm run db:generate
npm run db:migrate:deploy   # `prisma migrate deploy` — safe for existing data, unlike `db:migrate`
npm run db:seed
npm run build
npm start
```

Whichever way you start it, run the app behind a reverse proxy (nginx/
Caddy) with TLS if it needs to be reachable beyond the hospital's own LAN.
Point `NEXTAUTH_URL` and `DATABASE_URL` at your production values in
`.env` either way.

## Project structure

```
prisma/schema.prisma       # full data model, organized by module
src/lib/modules.ts         # module registry — drives sidebar + dashboard
src/app/dashboard/         # one folder per module
  patients/                # ← fully built reference module
    page.tsx               #   list + search
    new/page.tsx            #   creation form
    [id]/page.tsx            #   detail view
    actions.ts              #   server actions (writes)
  appointments/ pharmacy/ lab/ ...   # scaffolded, "coming soon" stub pages
src/auth.ts                 # NextAuth config (credentials login)
src/components/Sidebar.tsx  # nav generated from the module registry
```

## Adding a new module

1. Model its data in `prisma/schema.prisma`, run `npm run db:migrate`.
2. Add it to one of the groups in `src/lib/modules.ts` and flip its
   `status` to `"live"`.
3. Replace the auto-generated stub in `src/app/dashboard/<slug>/page.tsx`
   with a real list page, following the `patients` module as a template.
4. Add `actions.ts` for any writes, `new/page.tsx` and `[id]/page.tsx` as
   needed.
5. Add `src/app/dashboard/<slug>/layout.tsx` — copy an existing module's
   (e.g. `surgery/layout.tsx`), it's a 10-line wrapper that stamps the
   module's group accent color onto every page under it. Without it the
   module renders in plain white/no accent instead of matching its group.

## Status

Live modules: authentication, dashboard overview, Patient Registration,
Appointments, Patient Queue, ID Card Printing, OPD, Vital Signs,
Consultations, Wards & Admissions, Surgery & Theatre, Emergency /
Ambulatory, Pharmacy & Dispensary, Laboratory, Diagnostic Imaging, Blood
Bank, Billing & Payments, Insurance & NHIS Claims, Inventory &
Procurement, Fixed Assets, Documents, Hospital Setup, HR & Payroll,
Users & Roles, Reports & Analytics, and Data Backup — every module in the
source product's feature list is now built.
