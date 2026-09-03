# Modernist — how this app adopted it

`src/design-system/` is an **upstream snapshot** of the "Modernist" Claude
Design project (`claude.ai/design`, project id
`826534f8-ea0b-4fbb-9dd2-2d474cf8d640`). It is **reference only** — nothing in
this directory is imported by the Next.js build.

> **Why these notes are not in `README.md`.** The upstream snapshot ships its
> own `readme.md`. On a case-insensitive filesystem (Windows, and macOS by
> default) that file *is* `README.md`, so every `/design-sync` overwrites the
> app's own notes with upstream's. Keep app-specific guidance in this file —
> `ADOPTION.md` has no upstream counterpart — and let `README.md` be a clean,
> always-overwritable copy of upstream's guidance.

## What is actually live

- `src/app/globals.css` is the compiled layer: the token set (Tailwind v4
  `@theme` plus a plain `:root`), the base element rules, and the component
  layer (`.btn`, `.card`, `.table`, `.field`/`.input`, `.tag`, `.dialog`,
  `.hr`, `.list`, `.row-link`, `.panel`, …) inside `@layer components` so
  Tailwind **layout** utilities still win over it.
- `src/components/ui/` is the React layer — thin wrappers that emit those
  classes (`Button`, `Card`, `PageHeader`, `Table`, `List`, `Field`, `Input`,
  `Tag`, `StatusBadge`, `StatCard`, `Dialog`, `ConfirmButton`, `PrintButton`,
  `AccessRestricted`, …). Build new screens from these; don't re-introduce raw
  Tailwind colour / `bg-white` / `rounded-*` "look" utilities in markup.
- In the snapshot, `styles.css` is the source of truth for the look,
  `readme.md` is upstream's written guidance, and `theme.json` is the
  machine-readable parameter record.

To re-sync after the design system changes upstream, run `/design-sync` (the
`DesignSync` tool), then re-port any token or component changes into
`src/app/globals.css` by hand. Check `git diff` afterwards — see the warning
above about `readme.md`.

## Where the app deliberately departs from upstream

- **Fonts** come from `next/font/google` (`Archivo`) in `src/app/layout.tsx`,
  which exposes `--font-archivo`; `globals.css` maps that onto
  `--font-heading` / `--font-body`. The Google Fonts `@import` in the
  snapshot's `styles.css` is *not* used, so there is no runtime webfont fetch.
- **Per-module group colour** is preserved. Modernist is mono, but the app
  keeps six group hues (`ACCENT_HEX` in `src/lib/modules.ts`) and renders them
  the Modernist way — a flat 2px left rule on `.card-accent` / `.panel` /
  `.row-link.is-accented`, driven by `[data-accent="…"] { --group-accent: … }`
  in `globals.css`, with each module's `layout.tsx` stamping the attribute.
  Red (`--color-accent`) stays reserved for the primary action and emphasis;
  it is never a group hue.
- **Status tones** are a 6-tone semantic palette — `neutral` / `info` /
  `success` / `warning` / `danger` / `critical` — mapped in `src/lib/status.ts`
  and rendered by the `.tag-*` variants in the component layer. This is a
  deliberate, minimal departure from strict mono because the clinical
  worklists depend on the signal. `critical` additionally carries a solid fill
  and a slow pulse so triage-urgent rows (EMERGENCY, URGENT, DECEASED) outrank
  routine `danger` at a glance.
- **Light only.** The app ships no dark-mode variants anywhere.

See also the "Visual system" section of [`ARCHITECTURE.md`](../../ARCHITECTURE.md).
