// Database backup/restore core: dumps the whole Postgres database via
// `pg_dump` (custom format — compact, and restorable with `pg_restore`)
// into BACKUP_DIR. The filesystem is the source of truth for backup
// history (not a DB table) — that way backup history survives even if the
// database itself is the thing being restored. See README.md > Backups.
import { spawn } from "node:child_process";
import { mkdir, readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";

export type BackupTrigger = "manual" | "automatic";

export interface BackupFile {
  filename: string;
  trigger: BackupTrigger;
  createdAt: Date;
  sizeBytes: number;
}

export class BackupError extends Error {}

// hams-backup-<manual|automatic>-<YYYYMMDDTHHMMSS>.dump — the trigger and
// timestamp are encoded in the filename (rather than a sidecar file or DB
// row) so `listBackups` never has to trust anything but the directory
// listing, and this regex doubles as the path-traversal guard for
// delete/download (only filenames matching it are ever passed to fs calls).
const FILENAME_RE = /^hams-backup-(manual|automatic)-(\d{8}T\d{6})\.dump$/;

export function getBackupDir(): string {
  return process.env.BACKUP_DIR
    ? path.resolve(process.env.BACKUP_DIR)
    : path.join(process.cwd(), "backups");
}

async function ensureBackupDir(): Promise<string> {
  const dir = getBackupDir();
  await mkdir(dir, { recursive: true });
  return dir;
}

function formatTimestamp(date: Date): string {
  // 2026-08-26T14:30:00.000Z -> 20260826T143000
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "");
}

function parseTimestamp(ts: string): Date {
  const y = ts.slice(0, 4);
  const mo = ts.slice(4, 6);
  const d = ts.slice(6, 8);
  const h = ts.slice(9, 11);
  const mi = ts.slice(11, 13);
  const s = ts.slice(13, 15);
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
}

function assertSafeFilename(filename: string): void {
  if (!FILENAME_RE.test(filename)) {
    throw new BackupError("Invalid backup filename.");
  }
}

export function resolveBackupPath(filename: string): string {
  assertSafeFilename(filename);
  return path.join(getBackupDir(), filename);
}

export async function listBackups(): Promise<BackupFile[]> {
  const dir = await ensureBackupDir();
  const entries = await readdir(dir);

  const files: BackupFile[] = [];
  for (const entry of entries) {
    const match = FILENAME_RE.exec(entry);
    if (!match) continue;
    const [, trigger, ts] = match;
    const info = await stat(path.join(dir, entry));
    files.push({
      filename: entry,
      trigger: trigger as BackupTrigger,
      createdAt: parseTimestamp(ts),
      sizeBytes: info.size,
    });
  }

  return files.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// Deletes the oldest backups beyond BACKUP_RETENTION_COUNT (default 14).
// Applies across manual and automatic backups alike — a retention count
// isn't a substitute for taking an off-site copy of any backup an admin
// wants to keep permanently (download it instead).
async function pruneOldBackups(): Promise<void> {
  const retention = Number(process.env.BACKUP_RETENTION_COUNT ?? 14);
  if (!Number.isFinite(retention) || retention <= 0) return;

  const backups = await listBackups(); // newest first
  const dir = getBackupDir();
  for (const backup of backups.slice(retention)) {
    await unlink(path.join(dir, backup.filename)).catch(() => {});
  }
}

export async function createBackup(trigger: BackupTrigger): Promise<BackupFile> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new BackupError("DATABASE_URL is not configured.");
  }

  const dir = await ensureBackupDir();
  const now = new Date();
  const filename = `hams-backup-${trigger}-${formatTimestamp(now)}.dump`;
  const filePath = path.join(dir, filename);
  const pgDumpPath = process.env.PG_DUMP_PATH || "pg_dump";

  await new Promise<void>((resolve, reject) => {
    // spawn (not exec/shell) so the connection string — which contains the
    // DB password — never passes through a shell.
    const child = spawn(
      pgDumpPath,
      [
        "--dbname",
        databaseUrl,
        "--format",
        "custom",
        "--file",
        filePath,
        "--no-owner",
      ],
      { stdio: ["ignore", "ignore", "pipe"] }
    );

    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") {
        reject(
          new BackupError(
            `pg_dump was not found (looked for "${pgDumpPath}"). Install the PostgreSQL client tools on this server, or set PG_DUMP_PATH in .env to pg_dump's full path. See README.md > Backups.`
          )
        );
      } else {
        reject(new BackupError(`Failed to start pg_dump: ${error.message}`));
      }
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new BackupError(
            `pg_dump exited with code ${code}${stderr.trim() ? `: ${stderr.trim()}` : ""}`
          )
        );
      }
    });
  });

  await pruneOldBackups();

  const info = await stat(filePath);
  return { filename, trigger, createdAt: now, sizeBytes: info.size };
}

export async function deleteBackup(filename: string): Promise<void> {
  const filePath = resolveBackupPath(filename);
  await unlink(filePath);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(1)} ${units[i]}`;
}
