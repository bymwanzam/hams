export default function AccessRestricted() {
  return (
    <div className="max-w-lg bg-white border border-slate-200 rounded-xl p-6">
      <h1 className="text-lg font-semibold text-slate-800 mb-1">
        Data Backup Access Restricted
      </h1>
      <p className="text-sm text-slate-500">
        Creating, downloading and deleting backups is restricted to
        administrators, since a backup file contains a full copy of every
        patient record in the system. Contact your system administrator if
        you need a backup.
      </p>
    </div>
  );
}
