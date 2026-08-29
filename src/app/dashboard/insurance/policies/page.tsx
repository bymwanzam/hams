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
          <h1 className="page-title">
            Patient Insurance Policies
          </h1>
          <p className="text-muted">
            <Link href="/dashboard/insurance" className="btn btn-ghost">
              ← Claims
            </Link>
          </p>
        </div>
        <Link
          href="/dashboard/insurance/policies/new"
          className="btn btn-primary"
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
          className="input"
        />
      </form>

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Provider</th>
              <th>Policy No.</th>
              <th>Expiry</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {policies.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted">
                  No policies found.
                </td>
              </tr>
            )}
            {policies.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2">
                  <Link
                    href={`/dashboard/patients/${p.patient.id}`}
                    className="btn btn-ghost"
                  >
                    {p.patient.firstName} {p.patient.lastName}
                  </Link>
                  <p className="eyebrow">
                    {p.patient.hospitalNumber}
                  </p>
                </td>
                <td className="px-4 py-2 text-muted">{p.provider.name}</td>
                <td className="px-4 py-2 text-muted">{p.policyNumber}</td>
                <td className={`px-4 py-2 ${policyExpiryClass(p.expiryDate)}`}>
                  {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/dashboard/insurance/policies/${p.id}/edit`}
                    className="btn btn-ghost"
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
