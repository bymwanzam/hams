import { auth } from "@/auth";
import { roleHasModuleAccess } from "@/lib/access";

// The Audit Trail is limited to ADMIN and IT_SUPPORT (see RESTRICTED_TO in
// src/lib/access.ts). Same shape as backup/actions.ts's hasBackupAccess.

export async function hasAuditAccess(): Promise<boolean> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return roleHasModuleAccess(role, "audit");
}
