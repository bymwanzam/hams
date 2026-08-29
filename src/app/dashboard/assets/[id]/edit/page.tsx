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
        <h1 className="page-title">
          Edit {asset.name}
        </h1>
        <p className="text-muted">
          <Link
            href={`/dashboard/assets/${asset.id}`}
            className="btn btn-ghost"
          >
            ← Back to asset
          </Link>
        </p>
      </div>

      {error && (
        <p className="callout callout-danger">
          {error}
        </p>
      )}

      <form
        action={updateAssetWithId}
        className="card gap-4"
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
            className="btn btn-primary"
          >
            Save Changes
          </button>
          <Link
            href={`/dashboard/assets/${asset.id}`}
            className="btn btn-ghost"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
