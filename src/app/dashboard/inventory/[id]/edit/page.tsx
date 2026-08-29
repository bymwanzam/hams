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
        <h1 className="text-xl font-semibold text-slate-800">
          Edit {item.name}
        </h1>
        <p className="text-sm text-slate-500">
          <Link
            href={`/dashboard/inventory/${item.id}`}
            className="text-blue-600 hover:underline"
          >
            ← Back to item
          </Link>
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <form
        action={updateItemWithId}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
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
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Save Changes
          </button>
          <Link
            href={`/dashboard/inventory/${item.id}`}
            className="text-sm text-slate-500 hover:text-slate-800 px-4 py-2"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
