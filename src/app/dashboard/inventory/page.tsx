import Link from "next/link";
import { listItems, hasInventoryAccess } from "./actions";
import AccessRestricted from "./AccessRestricted";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!(await hasInventoryAccess())) {
    return <AccessRestricted />;
  }

  const { q } = await searchParams;
  const items = await listItems(q ?? "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Inventory &amp; Procurement
          </h1>
          <p className="text-muted">
            Stores, stock and supply chain management.
          </p>
        </div>
        <Link
          href="/dashboard/inventory/new"
          className="btn btn-primary"
        >
          + Add Item
        </Link>
      </div>

      <form className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name or category"
          className="input"
        />
      </form>

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Unit</th>
              <th>On Hand</th>
              <th>Reorder Level</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted">
                  No inventory items yet.
                </td>
              </tr>
            )}
            {items.map((item) => {
              const lowStock = item.quantityOnHand <= item.reorderLevel;
              return (
                <tr key={item.id}>
                  <td className="px-4 py-2">
                    <Link
                      href={`/dashboard/inventory/${item.id}`}
                      className="btn btn-ghost font-medium"
                    >
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-muted">
                    {item.category ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-muted">{item.unit ?? "—"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        item.quantityOnHand === 0
                          ? "text-[color:var(--color-accent-700)] font-[600]"
                          : lowStock
                            ? "text-[color:var(--color-accent-700)] font-[600]"
                            : "text-muted"
                      }
                    >
                      {item.quantityOnHand}
                    </span>
                    {lowStock && item.quantityOnHand > 0 && (
                      <span className="ml-1 text-[10px] text-[color:var(--color-accent-700)]">low</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted">{item.reorderLevel}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
