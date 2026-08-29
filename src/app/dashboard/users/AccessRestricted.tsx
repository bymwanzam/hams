export default function AccessRestricted() {
  return (
    <div className="max-w-lg bg-white border border-slate-200 rounded-xl p-6">
      <h1 className="text-lg font-semibold text-slate-800 mb-1">
        Users &amp; Roles Access Restricted
      </h1>
      <p className="text-sm text-slate-500">
        Creating accounts and assigning roles is restricted to
        administrators. Contact your system administrator if you need a new
        account or a role change.
      </p>
    </div>
  );
}
