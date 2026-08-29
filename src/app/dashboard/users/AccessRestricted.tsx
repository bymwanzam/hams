export default function AccessRestricted() {
  return (
    <div className="max-w-lg card">
      <h1 className="mb-1">
        Users &amp; Roles Access Restricted
      </h1>
      <p className="text-muted">
        Creating accounts and assigning roles is restricted to
        administrators. Contact your system administrator if you need a new
        account or a role change.
      </p>
    </div>
  );
}
