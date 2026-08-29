// Runs once when a new Next.js server instance starts (see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md).
// Used here to kick off the automatic database backup schedule — see
// ./lib/backup-scheduler.ts and README.md > Backups.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startBackupScheduler } = await import("./lib/backup-scheduler");
    await startBackupScheduler();
  }
}
