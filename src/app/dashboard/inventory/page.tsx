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
          <h1 className="text-xl font-semibold text-slate-800">
            Inventory &amp; Procurement
          </h1>
          <p className="text-sm text-slate-500">
            Stores, stock and supply chain management.
          </p>
        </div>
        <Link
          href="/dashboard/inventory/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
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
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Item</th>
              <th className="text-left px-4 py-2">Category</th>
              <th className="text-left px-4 py-2">Unit</th>
              <th className="text-left px-4 py-2">On Hand</th>
              <th className="text-left px-4 py-2">Reorder Level</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No inventory items yet.
                </td>
              </tr>
            )}
            {items.map((item) => {
              const lowStock = item.quantityOnHand <= item.reorderLevel;
              return (
                <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link
                      href={`/dashboard/inventory/${item.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {item.category ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{item.unit ?? "—"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        item.quantityOnHand === 0
                          ? "text-red-600 font-medium"
                          : lowStock
                            ? "text-amber-600 font-medium"
                            : "text-slate-600"
                      }
                    >
                      {item.quantityOnHand}
                    </span>
                    {lowStock && item.quantityOnHand > 0 && (
                      <span className="ml-1 text-[10px] text-amber-600">low</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{item.reorderLevel}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
