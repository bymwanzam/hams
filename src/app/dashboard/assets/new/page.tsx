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
        <h1 className="text-xl font-semibold text-slate-800">Add Asset</h1>
        <p className="text-sm text-slate-500">
          <Link href="/dashboard/assets" className="text-blue-600 hover:underline">
            ← Back to assets
          </Link>
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <form
        action={createAsset}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <AssetFormFields />

        <div className="pt-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Save Asset
          </button>
        </div>
      </form>
    </div>
  );
}
