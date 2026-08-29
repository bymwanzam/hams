import { prisma } from "@/lib/prisma";

// Shown wherever no hospital has been configured yet (fresh install, before
// the "Hospital Setup" module has been used) — the software's own name, not
// any particular hospital's.
export const DEFAULT_ORG_NAME = "BIT Health Systems";

// The single hospital this deployment runs for. Each self-hosted deployment
// runs for exactly one hospital, whose profile is created by the seed and
// edited in place from the Hospital Setup module, so this is the one source
// of truth for display branding (sidebar, login page, page title, ID card
// fallback, invoice and report headers, etc.).
export async function getFacility() {
  return prisma.facility.findFirst({ orderBy: { createdAt: "asc" } });
}

export async function getFacilityName(): Promise<string> {
  const facility = await getFacility();
  return facility?.name ?? DEFAULT_ORG_NAME;
}
