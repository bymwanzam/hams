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
          <h1 className="text-xl font-semibold text-slate-800">
            Insurance Providers
          </h1>
          <p className="text-sm text-slate-500">
            <Link href="/dashboard/insurance" className="text-blue-600 hover:underline">
              ← Claims
            </Link>
          </p>
        </div>
        <Link
          href="/dashboard/insurance/providers/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + Add Provider
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-left px-4 py-2">Policies</th>
              <th className="text-left px-4 py-2">Claims</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {providers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No providers yet.
                </td>
              </tr>
            )}
            {providers.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-800">{p.name}</td>
                <td className="px-4 py-2 text-slate-500">{p.type}</td>
                <td className="px-4 py-2 text-slate-500">{p._count.policies}</td>
                <td className="px-4 py-2 text-slate-500">{p._count.claims}</td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/dashboard/insurance/providers/${p.id}/edit`}
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
