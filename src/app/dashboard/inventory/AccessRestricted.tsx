export default function AccessRestricted() {
  return (
    <div className="max-w-lg bg-white border border-slate-200 rounded-xl p-6">
      <h1 className="text-lg font-semibold text-slate-800 mb-1">
        Inventory Access Restricted
      </h1>
      <p className="text-sm text-slate-500">
        This module is restricted to stores/inventory staff. If you need
        access, contact your system administrator to update your account
        role.
      </p>
    </div>
  );
}
