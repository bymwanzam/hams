# Modernist — vendored design system

This directory is an **upstream snapshot** of the "Modernist" Claude Design
project (`claude.ai/design`, project id `826534f8-ea0b-4fbb-9dd2-2d474cf8d640`).

- It is **reference only**. Nothing here is imported by the Next.js build.
- The **live** consumers of the system are:
  - `src/app/globals.css` — the token layer (`:root` custom properties) and the
    component layer (`.btn`, `.card`, `.table`, `.field`/`.input`, `.tag`,
    `.dialog`, `.hr`, …) are ported from `styles.css` below.
  - `src/components/ui/` — thin React wrappers that emit those classes.
- `styles.css` is the source of truth for the look. `readme.md` is the written
  guidance. `theme.json` is the machine-readable parameter record.
- To re-sync after the design system changes upstream, run `/design-sync`
  (the `DesignSync` tool) and re-port any token/component changes into
  `src/app/globals.css`, keeping this snapshot in step.

## What the app changed on adoption

- **Fonts** come from `next/font/google` (`Archivo`) in `src/app/layout.tsx`,
  not the Google Fonts `@import` in `styles.css` — so there is no runtime
  webfont fetch. `--font-heading` / `--font-body` in `globals.css` point at
  the `next/font` CSS variable.
- **Per-module group colour** is preserved (see `src/lib/modules.ts`,
  `ACCENT_HEX`). Modernist is mono; the app keeps the six group hues but
  renders them the Modernist way — a flat 2px left rule on `.card` /
  `.row-link`, driven by `[data-accent="…"] { --group-accent: … }` in
  `globals.css`. Red (`--color-accent`) stays reserved for the primary action
  and emphasis.
- **Status badges** use a 4-tone semantic palette (`neutral` / `info` /
  `success` / `danger`) via `src/lib/status.ts` and `.tag-*` variants added to
  the component layer — a deliberate, minimal departure from strict mono
  because the clinical worklists depend on the signal.
