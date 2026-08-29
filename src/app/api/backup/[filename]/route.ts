// Authenticated backup download. Not under /dashboard, so proxy.ts's
// role gate doesn't cover it — this route enforces the same ADMIN-only
// access itself, close to the data, the same way a restricted module's
// actions.ts does (see src/lib/access.ts).
import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { auth } from "@/auth";
import { roleHasModuleAccess } from "@/lib/access";
import { BackupError, resolveBackupPath } from "@/lib/backup";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !roleHasModuleAccess(role, "backup")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { filename } = await params;

  let filePath: string;
  try {
    filePath = resolveBackupPath(filename);
  } catch (error) {
    const message =
      error instanceof BackupError ? error.message : "Invalid backup filename.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  let size: number;
  try {
    size = (await stat(filePath)).size;
  } catch {
    return NextResponse.json({ error: "Backup not found." }, { status: 404 });
  }

  const stream = Readable.toWeb(
    createReadStream(filePath)
  ) as ReadableStream<Uint8Array>;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(size),
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
