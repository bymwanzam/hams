import Link from "next/link";
import { listClaims, hasInsuranceAccess } from "./actions";
import { claimStatusBadgeClass } from "./labels";
import AccessRestricted from "./AccessRestricted";

export default async function InsurancePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!(await hasInsuranceAccess())) {
    return <AccessRestricted />;
  }

  const { q } = await searchParams;
  const claims = await listClaims(q ?? "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Insurance &amp; NHIS Claims
          </h1>
          <p className="text-muted">
            Private, corporate and national insurance claims.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/insurance/policies"
            className="btn btn-ghost"
          >
            Patient Policies
          </Link>
          <Link
            href="/dashboard/insurance/providers"
            className="btn btn-ghost"
          >
            Providers
          </Link>
          <Link
            href="/dashboard/insurance/new"
            className="btn btn-primary"
          >
            + New Claim
          </Link>
        </div>
      </div>

      <form className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by patient, hospital no. or provider"
          className="input"
        />
      </form>

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Provider</th>
              <th>Amount (GHS)</th>
              <th>Invoice</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {claims.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted">
                  No claims found.
                </td>
              </tr>
            )}
            {claims.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2">
                  <Link
                    href={`/dashboard/insurance/${c.id}`}
                    className="btn btn-ghost"
                  >
                    {c.patient.firstName} {c.patient.lastName}
                  </Link>
                  <p className="eyebrow">
                    {c.patient.hospitalNumber}
                  </p>
                </td>
                <td className="px-4 py-2 text-muted">{c.provider.name}</td>
                <td className="px-4 py-2">{c.amount.toString()}</td>
                <td className="px-4 py-2 text-muted">
                  {c.invoice ? (
                    <Link
                      href={`/dashboard/billing/${c.invoice.id}`}
                      className="hover:underline"
                    >
                      #{c.invoice.id.slice(-8).toUpperCase()}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`${claimStatusBadgeClass(c.status)}`}
                  >
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
