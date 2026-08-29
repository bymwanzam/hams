export default function AccessRestricted() {
  return (
    <div className="max-w-lg card">
      <h1 className="mb-1">
        Diagnostic Imaging Access Restricted
      </h1>
      <p className="text-muted">
        This module is restricted to imaging staff. If you need access,
        contact your system administrator to update your account role.
      </p>
    </div>
  );
}
