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
          <h1 className="page-title">
            Fixed Assets
          </h1>
          <p className="text-muted">Asset register and tracking.</p>
        </div>
        <Link
          href="/dashboard/assets/new"
          className="btn btn-primary"
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
            className="input"
          />
        </div>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="input"
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
          className="btn btn-secondary"
        >
          Filter
        </button>
      </form>

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Tag</th>
              <th>Category</th>
              <th>Purchase Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted">
                  No fixed assets recorded yet.
                </td>
              </tr>
            )}
            {assets.map((asset) => (
              <tr key={asset.id}>
                <td className="px-4 py-2">
                  <Link
                    href={`/dashboard/assets/${asset.id}`}
                    className="btn btn-ghost font-medium"
                  >
                    {asset.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-muted">{asset.tag}</td>
                <td className="px-4 py-2 text-muted">
                  {asset.category ?? "—"}
                </td>
                <td className="px-4 py-2 text-muted">
                  {asset.purchaseValue != null
                    ? Number(asset.purchaseValue).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "—"}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`${assetStatusBadgeClass(asset.status)}`}
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
