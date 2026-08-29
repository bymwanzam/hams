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
          <h1 className="text-xl font-semibold text-slate-800">
            Insurance &amp; NHIS Claims
          </h1>
          <p className="text-sm text-slate-500">
            Private, corporate and national insurance claims.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/insurance/policies"
            className="text-sm text-blue-600 hover:underline"
          >
            Patient Policies
          </Link>
          <Link
            href="/dashboard/insurance/providers"
            className="text-sm text-blue-600 hover:underline"
          >
            Providers
          </Link>
          <Link
            href="/dashboard/insurance/new"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
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
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Patient</th>
              <th className="text-left px-4 py-2">Provider</th>
              <th className="text-left px-4 py-2">Amount (GHS)</th>
              <th className="text-left px-4 py-2">Invoice</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {claims.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No claims found.
                </td>
              </tr>
            )}
            {claims.map((c) => (
              <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link
                    href={`/dashboard/insurance/${c.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {c.patient.firstName} {c.patient.lastName}
                  </Link>
                  <p className="text-xs text-slate-400">
                    {c.patient.hospitalNumber}
                  </p>
                </td>
                <td className="px-4 py-2 text-slate-500">{c.provider.name}</td>
                <td className="px-4 py-2">{c.amount.toString()}</td>
                <td className="px-4 py-2 text-slate-500">
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
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${claimStatusBadgeClass(c.status)}`}
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
