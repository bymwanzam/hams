import Link from "next/link";
import { listAssets, hasAssetsAccess } from "./actions";
import { ASSET_STATUSES, assetStatusLabel, assetStatusBadgeClass } from "./labels";
import AccessRestricted from "./AccessRestricted";

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  if (!(await hasAssetsAccess())) {
    return <AccessRestricted />;
  }

  const { q, status } = await searchParams;
  const assets = await listAssets(q ?? "", status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Fixed Assets
          </h1>
          <p className="text-sm text-slate-500">Asset register and tracking.</p>
        </div>
        <Link
          href="/dashboard/assets/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + Add Asset
        </Link>
      </div>

      <form className="flex flex-wrap items-end gap-3">
        <div className="max-w-sm flex-1 min-w-[200px]">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by name, tag or category"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {ASSET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {assetStatusLabel(s)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="text-sm text-slate-600 hover:text-slate-900 border border-slate-300 rounded-md px-4 py-2"
        >
          Filter
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Asset</th>
              <th className="text-left px-4 py-2">Tag</th>
              <th className="text-left px-4 py-2">Category</th>
              <th className="text-left px-4 py-2">Purchase Value</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No fixed assets recorded yet.
                </td>
              </tr>
            )}
            {assets.map((asset) => (
              <tr key={asset.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link
                    href={`/dashboard/assets/${asset.id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {asset.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-500">{asset.tag}</td>
                <td className="px-4 py-2 text-slate-500">
                  {asset.category ?? "—"}
                </td>
                <td className="px-4 py-2 text-slate-500">
                  {asset.purchaseValue != null
                    ? Number(asset.purchaseValue).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "—"}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${assetStatusBadgeClass(asset.status)}`}
                  >
                    {assetStatusLabel(asset.status)}
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
