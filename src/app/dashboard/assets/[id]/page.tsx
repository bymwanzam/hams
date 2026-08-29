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
          <p className="eyebrow">
            <Link href="/dashboard/assets" className="hover:underline">
              ← Fixed Assets
            </Link>
          </p>
          <h1 className="page-title">{asset.name}</h1>
          <p className="text-muted">
            {asset.tag} · {asset.category ?? "Uncategorized"}
          </p>
        </div>
        <Link
          href={`/dashboard/assets/${asset.id}/edit`}
          className="btn btn-ghost"
        >
          Edit
        </Link>
      </div>

      {error && (
        <p className="callout callout-danger">
          {error}
        </p>
      )}

      <div className="card grid grid-cols-2 gap-4">
        <div>
          <p className="eyebrow">Purchase Date</p>
          <p className="text-[color:var(--color-text)]">
            {asset.purchaseDate
              ? new Date(asset.purchaseDate).toLocaleDateString()
              : "—"}
          </p>
        </div>
        <div>
          <p className="eyebrow">Purchase Value</p>
          <p className="text-[color:var(--color-text)]">
            {asset.purchaseValue != null
              ? Number(asset.purchaseValue).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "—"}
          </p>
        </div>
        <div>
          <p className="eyebrow">Status</p>
          <span
            className={`${assetStatusBadgeClass(asset.status)}`}
          >
            {assetStatusLabel(asset.status)}
          </span>
        </div>
      </div>

      <div className="card gap-3">
        <h2 className="card-title">Update Status</h2>
        <form action={updateStatusWithId} className="flex items-end gap-2 flex-wrap">
          <div>
            <label className="form-label">
              Status
            </label>
            <select
              name="status"
              required
              defaultValue={asset.status}
              className="input input-sm"
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
            className="btn btn-primary"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
}
