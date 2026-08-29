import Link from "next/link";
import { listPolicies, hasInsuranceAccess } from "../actions";
import { policyExpiryClass } from "../labels";
import AccessRestricted from "../AccessRestricted";

export default async function PoliciesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!(await hasInsuranceAccess())) {
    return <AccessRestricted />;
  }

  const { q } = await searchParams;
  const policies = await listPolicies(q ?? "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Patient Insurance Policies
          </h1>
          <p className="text-sm text-slate-500">
            <Link href="/dashboard/insurance" className="text-blue-600 hover:underline">
              ← Claims
            </Link>
          </p>
        </div>
        <Link
          href="/dashboard/insurance/policies/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + Add Policy
        </Link>
      </div>

      <form className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by patient or policy number"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Patient</th>
              <th className="text-left px-4 py-2">Provider</th>
              <th className="text-left px-4 py-2">Policy No.</th>
              <th className="text-left px-4 py-2">Expiry</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {policies.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No policies found.
                </td>
              </tr>
            )}
            {policies.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link
                    href={`/dashboard/patients/${p.patient.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {p.patient.firstName} {p.patient.lastName}
                  </Link>
                  <p className="text-xs text-slate-400">
                    {p.patient.hospitalNumber}
                  </p>
                </td>
                <td className="px-4 py-2 text-slate-500">{p.provider.name}</td>
                <td className="px-4 py-2 text-slate-500">{p.policyNumber}</td>
                <td className={`px-4 py-2 ${policyExpiryClass(p.expiryDate)}`}>
                  {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/dashboard/insurance/policies/${p.id}/edit`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
