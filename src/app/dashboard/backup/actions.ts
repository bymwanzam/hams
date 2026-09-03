"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  BackupError,
  createBackup,
  deleteBackup as deleteBackupFile,
  listBackups as listBackupFiles,
  type BackupFile,
} from "@/lib/backup";
import { roleHasModuleAccess } from "@/lib/access";
import { recordAudit } from "@/lib/audit";

export async function hasBackupAccess(): Promise<boolean> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return roleHasModuleAccess(role, "backup");
}

async function requireBackupAccess(): Promise<void> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!roleHasModuleAccess(role, "backup")) {
    throw new Error("Only administrators can manage backups.");
  }
}

export async function listBackups() {
  await requireBackupAccess();
  return listBackupFiles();
}

export async function runManualBackup() {
  await requireBackupAccess();

  let errorMessage: string | null = null;
  let created: BackupFile | null = null;
  try {
    created = await createBackup("manual");
  } catch (error) {
    errorMessage =
      error instanceof BackupError
        ? error.message
        : "Backup failed. Check the server logs for details.";
  }

  // Recorded before the redirect below, which throws. Backups touch no
  // Prisma model, so neither audit tier in src/lib/prisma.ts sees them —
  // without this the whole module leaves no trail.
  if (created) {
    await recordAudit({
      action: "BACKUP_CREATED",
      entity: "Backup",
      entityId: created.filename,
      metadata: { trigger: "manual", sizeBytes: created.sizeBytes },
    });
  } else {
    await recordAudit({
      action: "BACKUP_FAILED",
      entity: "Backup",
      metadata: { trigger: "manual", reason: errorMessage },
    });
  }

  revalidatePath("/dashboard/backup");
  if (errorMessage) {
    redirect(`/dashboard/backup?error=${encodeURIComponent(errorMessage)}`);
  }
  redirect("/dashboard/backup?success=1");
}

export async function deleteBackupAction(filename: string) {
  await requireBackupAccess();

  let errorMessage: string | null = null;
  try {
    await deleteBackupFile(filename);
  } catch {
    errorMessage = "Could not delete that backup file.";
  }

  await recordAudit({
    action: errorMessage ? "BACKUP_DELETE_FAILED" : "BACKUP_DELETED",
    entity: "Backup",
    entityId: filename,
    ...(errorMessage ? { metadata: { reason: errorMessage } } : {}),
  });

  revalidatePath("/dashboard/backup");
  if (errorMessage) {
    redirect(`/dashboard/backup?error=${encodeURIComponent(errorMessage)}`);
  }
  redirect("/dashboard/backup");
}
