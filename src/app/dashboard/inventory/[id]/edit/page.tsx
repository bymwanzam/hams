import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateItem, hasInventoryAccess } from "../../actions";
import ItemFormFields from "../../ItemFormFields";
import AccessRestricted from "../../AccessRestricted";

export default async function EditItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await hasInventoryAccess())) {
    return <AccessRestricted />;
  }

  const { id } = await params;
  const { error } = await searchParams;
  const item = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!item) notFound();

  const updateItemWithId = updateItem.bind(null, item.id);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="page-title">
          Edit {item.name}
        </h1>
        <p className="text-muted">
          <Link
            href={`/dashboard/inventory/${item.id}`}
            className="btn btn-ghost"
          >
            ← Back to item
          </Link>
        </p>
      </div>

      {error && (
        <p className="callout callout-danger">
          {error}
        </p>
      )}

      <form
        action={updateItemWithId}
        className="card gap-4"
      >
        <ItemFormFields
          defaults={{
            name: item.name,
            category: item.category,
            unit: item.unit,
            reorderLevel: item.reorderLevel,
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
            href={`/dashboard/inventory/${item.id}`}
            className="btn btn-ghost"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
