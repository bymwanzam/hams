// Automatic backup scheduling. Runs inside the same Node process as the
// Next.js server (see ../instrumentation.ts) rather than relying on an
// external cron daemon, so a self-hosted install works with zero extra
// setup — set BACKUP_AUTO_ENABLED=false in .env to turn it off (e.g. if a
// hospital IT team prefers driving backups from their own external cron
// hitting a script instead).
import { createBackup, listBackups } from "./backup";

const globalForScheduler = globalThis as unknown as {
  hamsBackupSchedulerStarted?: boolean;
};

function intervalMs(): number {
  const hours = Number(process.env.BACKUP_INTERVAL_HOURS ?? 24);
  return (Number.isFinite(hours) && hours > 0 ? hours : 24) * 60 * 60 * 1000;
}

async function runAutomaticBackup(): Promise<void> {
  try {
    await createBackup("automatic");
  } catch (error) {
    console.error(
      "[backup] automatic backup failed:",
      error instanceof Error ? error.message : error
    );
  }
}

// On startup, back-date the schedule from the last automatic backup on
// disk (rather than always waiting a full interval after every restart),
// so a server that restarts periodically still gets backups roughly on
// the configured cadence instead of the interval effectively resetting
// every time the app restarts.
async function msUntilNextRun(): Promise<number> {
  const interval = intervalMs();
  try {
    const last = (await listBackups()).find((b) => b.trigger === "automatic");
    if (!last) return 60_000; // no automatic backup yet — run soon after boot
    const elapsed = Date.now() - last.createdAt.getTime();
    return Math.max(interval - elapsed, 60_000);
  } catch {
    return interval;
  }
}

export async function startBackupScheduler(): Promise<void> {
  if (process.env.BACKUP_AUTO_ENABLED === "false") return;
  // Guards against double-scheduling on hot reload in `next dev`; register()
  // itself is only called once per server instance per Next.js's docs, but
  // this is a cheap extra safety net for a timer that otherwise runs for
  // the life of the process.
  if (globalForScheduler.hamsBackupSchedulerStarted) return;
  globalForScheduler.hamsBackupSchedulerStarted = true;

  const delay = await msUntilNextRun();
  setTimeout(() => {
    void runAutomaticBackup();
    setInterval(() => void runAutomaticBackup(), intervalMs());
  }, delay);
}
