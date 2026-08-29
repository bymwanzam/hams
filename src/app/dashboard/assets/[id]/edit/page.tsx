import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateAsset, hasAssetsAccess } from "../../actions";
import AssetFormFields from "../../AssetFormFields";
import AccessRestricted from "../../AccessRestricted";

export default async function EditAssetPage({
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
  const asset = await prisma.fixedAsset.findUnique({ where: { id } });
  if (!asset) notFound();

  const updateAssetWithId = updateAsset.bind(null, asset.id);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">
          Edit {asset.name}
        </h1>
        <p className="text-sm text-slate-500">
          <Link
            href={`/dashboard/assets/${asset.id}`}
            className="text-blue-600 hover:underline"
          >
            ← Back to asset
          </Link>
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <form
        action={updateAssetWithId}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <AssetFormFields
          defaults={{
            name: asset.name,
            tag: asset.tag,
            category: asset.category,
            purchaseDate: asset.purchaseDate,
            purchaseValue: asset.purchaseValue?.toString(),
          }}
        />

        <div className="pt-2 flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Save Changes
          </button>
          <Link
            href={`/dashboard/assets/${asset.id}`}
            className="text-sm text-slate-500 hover:text-slate-800 px-4 py-2"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
