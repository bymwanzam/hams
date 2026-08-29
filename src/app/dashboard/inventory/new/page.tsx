import Link from "next/link";
import { createItem, hasInventoryAccess } from "../actions";
import ItemFormFields from "../ItemFormFields";
import AccessRestricted from "../AccessRestricted";

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await hasInventoryAccess())) {
    return <AccessRestricted />;
  }

  const { error } = await searchParams;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Add Item</h1>
        <p className="text-sm text-slate-500">
          <Link href="/dashboard/inventory" className="text-blue-600 hover:underline">
            ← Back to inventory
          </Link>
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <form
        action={createItem}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <ItemFormFields showStartingQuantity />

        <div className="pt-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Save Item
          </button>
        </div>
      </form>
    </div>
  );
}
