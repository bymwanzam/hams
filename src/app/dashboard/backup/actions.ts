"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  BackupError,
  createBackup,
  deleteBackup as deleteBackupFile,
  listBackups as listBackupFiles,
} from "@/lib/backup";
import { roleHasModuleAccess } from "@/lib/access";

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
  try {
    await createBackup("manual");
  } catch (error) {
    errorMessage =
      error instanceof BackupError
        ? error.message
        : "Backup failed. Check the server logs for details.";
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

  revalidatePath("/dashboard/backup");
  if (errorMessage) {
    redirect(`/dashboard/backup?error=${encodeURIComponent(errorMessage)}`);
  }
  redirect("/dashboard/backup");
}
