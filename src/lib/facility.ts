import { prisma } from "@/lib/prisma";

// Shown wherever no hospital has been configured yet (fresh install, before
// the "Hospital Setup" module has been used) — the software's own name, not
// any particular hospital's.
export const DEFAULT_ORG_NAME = "BIT Health Systems";

// The hospital this deployment is currently branded for: the Facility
// flagged isMain, or — if none has been marked yet — whichever facility was
// created first. Each self-hosted deployment is expected to run for a single
// hospital (with optional branches), configured via the Hospital Setup
// module, so this is the one source of truth for display branding
// (sidebar, login page, page title, ID card fallback, etc.).
export async function getPrimaryFacility() {
  return (
    (await prisma.facility.findFirst({ where: { isMain: true } })) ??
    (await prisma.facility.findFirst({ orderBy: { createdAt: "asc" } }))
  );
}

export async function getPrimaryFacilityName(): Promise<string> {
  const facility = await getPrimaryFacility();
  return facility?.name ?? DEFAULT_ORG_NAME;
}
