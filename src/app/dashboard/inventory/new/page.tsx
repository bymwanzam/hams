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
        <h1 className="page-title">Add Item</h1>
        <p className="text-muted">
          <Link href="/dashboard/inventory" className="btn btn-ghost">
            ← Back to inventory
          </Link>
        </p>
      </div>

      {error && (
        <p className="callout callout-danger">
          {error}
        </p>
      )}

      <form
        action={createItem}
        className="card gap-4"
      >
        <ItemFormFields showStartingQuantity />

        <div className="pt-2">
          <button
            type="submit"
            className="btn btn-primary"
          >
            Save Item
          </button>
        </div>
      </form>
    </div>
  );
}
