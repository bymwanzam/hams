// Central role → module map. Only the roles below are scoped to a specific
// area of the app; every other role (ADMIN, HR, IT_SUPPORT) is
// unrestricted, same as the rest of this app's modules today. ADMIN always
// has full access regardless of this map.
//
// This is the single source of truth for "who can see/use what" — used by
// `proxy.ts` (fast, optimistic redirect/hide for page requests and the POST
// requests Server Actions submit to the same route) and, close to the data,
// by each restricted module's own actions (e.g. `pharmacy/actions.ts`),
// per the Next.js auth guide's recommendation not to rely on the proxy
// alone: node_modules/next/dist/docs/01-app/02-guides/authentication.md.
export const ROLE_MODULE_ACCESS: Record<string, string[]> = {
  HEALTH_OFFICER: ["patients", "appointments", "queue", "id-cards"],
  // Includes "patients" too: doctors constantly link into a patient's
  // chart (demographics, history) from encounters, wards and appointments
  // — they need read access to that record even though Health Officer owns
  // registering/editing it.
  DOCTOR: ["opd", "encounters", "wards", "surgery", "emergency", "patients"],
  // OPD/front-desk nursing: charts vitals for arrived outpatients only —
  // no ward access, unlike Ward Nurse below.
  OPD_NURSE: ["vitals", "patients"],
  // Inpatient/ward nursing. Vitals is where nurses chart observations
  // (recording moved out of the doctor-facing Consultations page); Wards
  // gives them the same admission access as Doctor, for nurse notes, the
  // fluid balance chart, and ward-round context — both live on the
  // admission detail page under Wards & Admissions.
  WARD_NURSE: ["vitals", "wards", "patients"],
  PHARMACIST: ["pharmacy"],
  // Blood banking is run out of the laboratory in most hospitals this
  // size — same staff as the Laboratory module.
  LAB_TECH: ["lab", "blood-bank"],
  IMAGING_OFFICER: ["imaging"],
  // NHIS/private insurance claims are a finance function alongside billing.
  ACCOUNTANT: ["billing", "insurance"],
  // Fixed Assets is grouped with Inventory & Procurement — same
  // stores/procurement team owns both registers in practice.
  INVENTORY_MANAGER: ["inventory", "assets"],
};

// Modules locked to an explicit role list regardless of the "unscoped
// roles are unrestricted" default above. Creating accounts and assigning
// roles is sensitive enough that it shouldn't fall open to every unscoped
// role (Nurse, Accountant, HR, Inventory Manager, IT Support) just because
// nobody named them in ROLE_MODULE_ACCESS. Backups are the same: a backup
// file is a full copy of every patient record in the system, and deleting
// one is unrecoverable. The audit trail is a compliance/IT function, so it
// adds IT Support alongside ADMIN.
const RESTRICTED_TO: Record<string, string[]> = {
  users: ["ADMIN"],
  backup: ["ADMIN"],
  audit: ["ADMIN", "IT_SUPPORT"],
};

// Roles with an entry in ROLE_MODULE_ACCESS are restricted to it; every
// other role (including ADMIN, handled separately) is unrestricted, except
// for the RESTRICTED_TO slugs which are locked to their listed roles.
export function roleHasModuleAccess(
  role: string | undefined | null,
  slug: string
): boolean {
  if (role === "ADMIN") return true;
  const restrictedTo = RESTRICTED_TO[slug];
  if (restrictedTo) return !!role && restrictedTo.includes(role);
  if (!role) return false;
  const allowed = ROLE_MODULE_ACCESS[role];
  if (!allowed) return true; // role isn't scoped -> unrestricted
  return allowed.includes(slug);
}

// Filters MODULE_GROUPS down to what this role can actually open, for the
// sidebar and dashboard module grid — so a scoped role doesn't see menu
// items proxy.ts would just bounce them out of. Empty groups are dropped.
export function filterModuleGroupsForRole<
  G extends { group: string; modules: { slug: string }[] },
>(groups: G[], role: string | undefined | null): G[] {
  return groups
    .map((g) => ({
      ...g,
      modules: g.modules.filter((m) => roleHasModuleAccess(role, m.slug)),
    }))
    .filter((g) => g.modules.length > 0);
}
