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
          <h1 className="text-xl font-semibold text-slate-800">Data Backup</h1>
          <p className="text-sm text-slate-500">{autoScheduleSummary()}</p>
        </div>
        <form action={runManualBackup}>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Backup Now
          </button>
        </form>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          Backup completed successfully.
        </p>
      )}

      {backups.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-8 text-center text-sm text-slate-400">
          No backups yet. Click &quot;Backup Now&quot; to create one.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Created</th>
                <th className="text-left px-4 py-2">Type</th>
                <th className="text-left px-4 py-2">Size</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr
                  key={b.filename}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-2 text-slate-700">
                    {b.createdAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        b.trigger === "manual"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {b.trigger === "manual" ? "Manual" : "Automatic"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {formatBytes(b.sizeBytes)}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-3">
                      <a
                        href={`/api/backup/${b.filename}`}
                        className="text-sm text-blue-600 hover:underline"
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

      <p className="text-xs text-slate-400">
        Backups are `pg_dump` custom-format dumps stored on this server at{" "}
        <code>{process.env.BACKUP_DIR || "./backups"}</code>. Download important
        backups to off-site storage — a copy that only lives on the same
        server as the database it backs up isn&apos;t a real disaster-recovery
        plan. To restore one, see README.md &gt; Backups.
      </p>
    </div>
  );
}
