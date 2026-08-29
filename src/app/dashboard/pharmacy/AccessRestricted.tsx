export default function AccessRestricted() {
  return (
    <div className="max-w-lg card">
      <h1 className="mb-1">
        Pharmacy Access Restricted
      </h1>
      <p className="text-muted">
        This module is restricted to pharmacy staff. If you need access,
        contact your system administrator to update your account role.
      </p>
    </div>
  );
}
