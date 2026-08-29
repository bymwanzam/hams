import { formatBytes } from "@/lib/backup";
import { deleteBackupAction, hasBackupAccess, listBackups, runManualBackup } from "./actions";
import AccessRestricted from "./AccessRestricted";
import DeleteBackupButton from "./DeleteBackupButton";

function autoScheduleSummary(): string {
  if (process.env.BACKUP_AUTO_ENABLED === "false") {
    return "Automatic backups are turned off (BACKUP_AUTO_ENABLED=false).";
  }
  const hours = Number(process.env.BACKUP_INTERVAL_HOURS ?? 24);
  const every = Number.isFinite(hours) && hours > 0 ? hours : 24;
  const retention = Number(process.env.BACKUP_RETENTION_COUNT ?? 14);
  return `Automatic backups run every ${every} hour${every === 1 ? "" : "s"}, keeping the most recent ${
    Number.isFinite(retention) && retention > 0 ? retention : 14
  } backups (manual and automatic combined) and deleting older ones.`;
}

export default async function BackupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  if (!(await hasBackupAccess())) {
    return <AccessRestricted />;
  }

  const { error, success } = await searchParams;
  const backups = await listBackups();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Data Backup</h1>
          <p className="text-muted">{autoScheduleSummary()}</p>
        </div>
        <form action={runManualBackup}>
          <button
            type="submit"
            className="btn btn-primary"
          >
            Backup Now
          </button>
        </form>
      </div>

      {error && (
        <p className="callout callout-danger">
          {error}
        </p>
      )}
      {success && (
        <p className="callout callout-success">
          Backup completed successfully.
        </p>
      )}

      {backups.length === 0 ? (
        <div className="panel px-4 py-8 text-center text-sm text-muted">
          No backups yet. Click &quot;Backup Now&quot; to create one.
        </div>
      ) : (
        <div className="panel">
          <table className="table">
            <thead>
              <tr>
                <th>Created</th>
                <th>Type</th>
                <th>Size</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr
                  key={b.filename}
                 
                >
                  <td className="px-4 py-2 text-[color:var(--color-text)]">
                    {b.createdAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`${
                        b.trigger === "manual"
                          ? "tag tag-info"
                          : "tag tag-neutral"
                      }`}
                    >
                      {b.trigger === "manual" ? "Manual" : "Automatic"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted">
                    {formatBytes(b.sizeBytes)}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-3">
                      <a
                        href={`/api/backup/${b.filename}`}
                        className="btn btn-ghost"
                      >
                        Download
                      </a>
                      <DeleteBackupButton
                        action={deleteBackupAction.bind(null, b.filename)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="eyebrow">
        Backups are `pg_dump` custom-format dumps stored on this server at{" "}
        <code>{process.env.BACKUP_DIR || "./backups"}</code>. Download important
        backups to off-site storage — a copy that only lives on the same
        server as the database it backs up isn&apos;t a real disaster-recovery
        plan. To restore one, see README.md &gt; Backups.
      </p>
    </div>
  );
}
