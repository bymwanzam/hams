import Link from "next/link";
import { notFound } from "next/navigation";
import { getAsset, updateAssetStatus, hasAssetsAccess } from "../actions";
import { ASSET_STATUSES, assetStatusLabel, assetStatusBadgeClass } from "../labels";
import AccessRestricted from "../AccessRestricted";

export default async function AssetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await hasAssetsAccess())) {
    return <AccessRestricted />;
  }

  const { id } = await params;
  const { error } = await searchParams;
  const asset = await getAsset(id);
  if (!asset) notFound();

  const updateStatusWithId = updateAssetStatus.bind(null, asset.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400">
            <Link href="/dashboard/assets" className="hover:underline">
              ← Fixed Assets
            </Link>
          </p>
          <h1 className="text-xl font-semibold text-slate-800">{asset.name}</h1>
          <p className="text-sm text-slate-500">
            {asset.tag} · {asset.category ?? "Uncategorized"}
          </p>
        </div>
        <Link
          href={`/dashboard/assets/${asset.id}/edit`}
          className="text-sm text-blue-600 hover:underline"
        >
          Edit
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-slate-400">Purchase Date</p>
          <p className="text-slate-700">
            {asset.purchaseDate
              ? new Date(asset.purchaseDate).toLocaleDateString()
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Purchase Value</p>
          <p className="text-slate-700">
            {asset.purchaseValue != null
              ? Number(asset.purchaseValue).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Status</p>
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${assetStatusBadgeClass(asset.status)}`}
          >
            {assetStatusLabel(asset.status)}
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Update Status</h2>
        <form action={updateStatusWithId} className="flex items-end gap-2 flex-wrap">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Status
            </label>
            <select
              name="status"
              required
              defaultValue={asset.status}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              {ASSET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {assetStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
}
