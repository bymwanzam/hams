import Link from "next/link";
import { createAsset, hasAssetsAccess } from "../actions";
import AssetFormFields from "../AssetFormFields";
import AccessRestricted from "../AccessRestricted";

export default async function NewAssetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await hasAssetsAccess())) {
    return <AccessRestricted />;
  }

  const { error } = await searchParams;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="page-title">Add Asset</h1>
        <p className="text-muted">
          <Link href="/dashboard/assets" className="btn btn-ghost">
            ← Back to assets
          </Link>
        </p>
      </div>

      {error && (
        <p className="callout callout-danger">
          {error}
        </p>
      )}

      <form
        action={createAsset}
        className="card gap-4"
      >
        <AssetFormFields />

        <div className="pt-2">
          <button
            type="submit"
            className="btn btn-primary"
          >
            Save Asset
          </button>
        </div>
      </form>
    </div>
  );
}
