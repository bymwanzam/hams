export default function AccessRestricted() {
  return (
    <div className="max-w-lg card">
      <h1 className="mb-1">
        Data Backup Access Restricted
      </h1>
      <p className="text-muted">
        Creating, downloading and deleting backups is restricted to
        administrators, since a backup file contains a full copy of every
        patient record in the system. Contact your system administrator if
        you need a backup.
      </p>
    </div>
  );
}
