# BIT Health Systems — Architecture

A self-hosted Hospital Administration & Management System, modeled on the
module map of commercial HAMS/HIS products (front desk, clinical, pharmacy,
lab, imaging, billing/insurance, inventory, HR, and more).

## Stack

| Layer      | Choice                                   | Why |
|------------|-------------------------------------------|-----|
| Framework  | Next.js 16 (App Router, TypeScript)       | Single codebase for UI + API via Server Actions/Route Handlers; good fit for an on-prem deploy (one Node process). |
| Database   | PostgreSQL                                | Relational integrity matters a lot here (billing ↔ invoices ↔ payments, admissions ↔ beds, etc.); mature, self-hostable, well understood by hospital IT teams. |
| ORM        | Prisma                                    | Schema-as-code, type-safe queries, straightforward migrations for a system that will evolve module by module. |
| Auth       | NextAuth (Credentials provider)           | Username/password against the local `User` table, JWT sessions. Swappable for SSO/LDAP later — hospitals often want to plug into an existing directory. |
| Styling    | Tailwind CSS                              | Fast to build consistent internal-tool UI with. |

## Why this shape

Hospital systems are wide (20+ modules) but each module is fairly shallow
individually (a handful of entities, standard CRUD + a few workflows). So the
architecture optimizes for:

1. **One schema, clearly segmented.** `prisma/schema.prisma` is organized in
   named blocks per module (front desk, clinical, pharmacy, lab, imaging,
   billing, inventory, HR, etc.), all in one file so cross-module
   relationships (e.g. an `Encounter` linking to `Prescription`s and
   `LabOrder`s) stay simple foreign keys instead of cross-service API calls.
2. **A single module registry drives navigation.** `src/lib/modules.ts` is
   the list of every module, its route, and whether it's built yet. The
   sidebar and the dashboard's module grid are both generated from this file,
   so adding a new module to the map is a one-line change, and every module
   is visible (as "planned") even before it's implemented — useful for
   demoing scope to stakeholders and for onboarding new engineers.
3. **A working vertical slice (Patients) as the template.** Rather than
   stub every module identically, `src/app/dashboard/patients/` is a fully
   wired example: list + search page, a creation form using a Server Action,
   and a detail page pulling related records (encounters, admissions,
   invoices). Every other module should follow this same shape:
   - `page.tsx` — list/search (Server Component, queries Prisma directly)
   - `actions.ts` — `"use server"` functions for writes (create/update),
     validated with `zod`
   - `new/page.tsx` — creation form posting to a server action
   - `[id]/page.tsx` — detail view

## Data model highlights

- `Patient` is the hub entity — encounters, admissions, prescriptions, lab
  orders, imaging orders, invoices, and insurance policies all hang off it.
- `Facility` is a **single** hospital-profile row (name, address, phone),
  created by the seed and edited in place from the Hospital Setup module. It
  carries no child relations — it exists only to brand the deployment
  (sidebar, login page, browser tab, patient ID cards, invoice and report
  headers), read via `getFacility`/`getFacilityName` in `src/lib/facility.ts`.
- Analyzer/PACS/RIS integration is modeled as a nullable external-reference
  field (`LabOrder.analyzerRef`, `ImagingOrder.pacsStudyUid`) rather than a
  hard dependency — real integration work (HL7/DICOM) is a separate,
  later effort per the module it touches.
- Money fields use `Decimal`, never `Float`, for billing correctness.

## Auth & access control

- `User.role` is an enum (`ADMIN`, `DOCTOR`, `OPD_NURSE`, `WARD_NURSE`,
  `HEALTH_OFFICER`, `PHARMACIST`, `LAB_TECH`, `IMAGING_OFFICER`,
  `ACCOUNTANT`, `HR`, `INVENTORY_MANAGER`, `IT_SUPPORT`).
- Every route under `/dashboard` is gated by `src/app/dashboard/layout.tsx`,
  which redirects unauthenticated users to `/login`.
- Role-based route/action restrictions (e.g. only `PHARMACIST` can dispense)
  are not yet enforced per-module — add checks in each module's `actions.ts`
  as it's built, using `session.user.role` from `auth()`.

## Deployment (self-hosted / on-prem)

- `docker-compose.yml` runs PostgreSQL only — the intended pattern is
  Postgres in a container, the Next.js app run directly on the hospital's
  server (`npm run build && npm start`) or containerized separately once
  you're ready to package a Docker image for the app too.
- All config is via `.env` (`DATABASE_URL`, `AUTH_SECRET`,
  `AUTH_URL`) — no cloud services required.
- `deploy/install.sh` automates a full Linux facility install end to end —
  Docker/Node/`pg_dump`, an unprivileged `hams` service user, the app at
  `/opt/hams`, migrations/seed/build, and two systemd units
  (`deploy/hams-db.service`, `deploy/hams-app.service`) enabled so both
  start on every boot with no manual step beyond opening the browser
  afterwards. `deploy/update.sh` re-deploys new code onto an
  already-provisioned server. See README.md > Facility deployment.
- Database backups (manual, from `/dashboard/backup`, and automatic, on a
  timer started from `src/instrumentation.ts`) run as `pg_dump` inside the
  same Node process — see `src/lib/backup.ts` and README.md > Backups.

## Build history

Every module in `src/lib/modules.ts` is now `"live"`, built in roughly this
order, following clinical/operational dependency: Patient Registration →
Appointments → Encounters/Consultations → Wards & Admissions → Pharmacy →
Lab & Imaging → Billing & Insurance → Inventory, HR, Assets, Blood Bank,
Reports → Documents → Emergency/Ambulatory → Surgery & Theatre. Surgery
was the one module with no pre-existing schema to build against — it
required adding a new `Surgery` model/`SurgeryStatus` enum and a real
migration (`add_surgery_module`), rather than wiring up an already-live
table the way the others in that later batch did.

Extending the system further from here means adding a new module the same
way: model it in `prisma/schema.prisma`, run `npm run db:migrate`, add it to
a group and flip its `status` to `"live"` in `src/lib/modules.ts`, and build
its route under `src/app/dashboard/<slug>/` following the `patients/` (plain
CRUD) or `lab/`/`imaging/` (order worklist) shape, whichever fits — plus a
`layout.tsx` in that folder (copy any existing module's) so its pages pick
up its group's accent color; see "Visual system" below.

## Visual system — "Modernist"

The UI follows the **Modernist** design system (a Claude Design project).
It is flat and architectural: Archivo throughout, **0px radius**, strong
**2px rules** as the only dividers, a light ground (`--color-bg` /
`--color-surface` / ink `--color-text`), and a **single red accent**
(`--color-accent`) reserved for the primary action and small emphasis,
with 100–900 OKLCH ramps (`--color-neutral-*`, `--color-accent-*`).

- `src/design-system/` is a vendored, **reference-only** snapshot of the
  upstream project (`styles.css`, `readme.md`, `theme.json`, the
  `foundations/` and `components/` HTML). Nothing there is compiled.
  Re-sync with `/design-sync` and re-port changes into `globals.css`.
  `src/design-system/ADOPTION.md` records where this app departs from
  upstream and why. Keep app-specific notes **there**, never in a
  `README.md` beside the snapshot: upstream ships its own `readme.md`, so on
  a case-insensitive filesystem (Windows, default macOS) a sync silently
  overwrites `README.md` — which is exactly how the previous notes were lost.
- `src/app/globals.css` is the live layer: the Modernist token set (in
  Tailwind v4 `@theme` + a plain `:root`), the base element rules, and the
  component layer (`.btn`, `.card`, `.table`, `.field`/`.input`, `.tag`,
  `.dialog`, `.hr`, `.list`, `.row-link`, `.panel`, …) inside
  `@layer components` so Tailwind **layout** utilities still win.
- `src/components/ui/` is the React layer — thin wrappers that emit those
  classes (`Button`, `Card`, `PageHeader`, `Table`, `List`, `Field`,
  `Input`, `Tag`, `StatusBadge`, `Dialog`, `ConfirmButton`, `PrintButton`,
  `AccessRestricted`, …). Build new screens from these; don't re-introduce
  raw Tailwind colour/`bg-white`/`rounded-*` "look" utilities in markup.
- Fonts come from `next/font/google` (`Archivo`) in `src/app/layout.tsx`,
  exposed as `--font-archivo` — no runtime webfont fetch.

### Per-module group accent

Each module group still has one identity hue (`Accent` / `ACCENT_HEX` in
`src/lib/modules.ts`, `[data-accent="…"]` in `globals.css`). A module's
`layout.tsx` stamps `data-accent` on a `className="contents"` wrapper;
globals.css turns that into a **flat 2px left rule** on `.card-accent` /
`.row-link.is-accented` (Modernist-style, no soft stripe). Red is never a
group colour. The sidebar and dashboard grid read `getModuleAccent` /
`ACCENT_HEX` directly for their inline 2px rules since they mix groups on
one page.

### Status colour

`src/lib/status.ts` maps every raw status enum to a **4-tone** semantic
palette — `neutral` / `info` / `success` / `danger` — rendered by the
`.tag-*` classes and the `<Tag>` / `<StatusBadge>` components. This is a
deliberate, minimal step away from strict mono: clinical worklists rely on
the signal. The per-module `labels.ts` files keep their text/option maps;
their old `*BadgeClass()` helpers now return `.tag` classes.

### Motion

All motion (card hover-lift, list-row stagger-in, button press feedback,
sidebar slide) is plain CSS restricted to
`transform`/`opacity`/`box-shadow`/`border-color` — compositor-only, no
layout — gated behind `@media (prefers-reduced-motion: no-preference)`.
The selectors hook the Modernist component classes (`.card`, `.list`,
`.row-link`, `main button[type="submit"]`, `aside`). No JS animation
library; keep it that way.
