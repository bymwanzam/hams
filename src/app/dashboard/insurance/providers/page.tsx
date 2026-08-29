import Link from "next/link";
import { listProviders, hasInsuranceAccess } from "../actions";
import AccessRestricted from "../AccessRestricted";

export default async function ProvidersPage() {
  if (!(await hasInsuranceAccess())) {
    return <AccessRestricted />;
  }

  const providers = await listProviders();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Insurance Providers
          </h1>
          <p className="text-muted">
            <Link href="/dashboard/insurance" className="btn btn-ghost">
              ← Claims
            </Link>
          </p>
        </div>
        <Link
          href="/dashboard/insurance/providers/new"
          className="btn btn-primary"
        >
          + Add Provider
        </Link>
      </div>

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Policies</th>
              <th>Claims</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {providers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted">
                  No providers yet.
                </td>
              </tr>
            )}
            {providers.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2 font-[600]">{p.name}</td>
                <td className="px-4 py-2 text-muted">{p.type}</td>
                <td className="px-4 py-2 text-muted">{p._count.policies}</td>
                <td className="px-4 py-2 text-muted">{p._count.claims}</td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/dashboard/insurance/providers/${p.id}/edit`}
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
