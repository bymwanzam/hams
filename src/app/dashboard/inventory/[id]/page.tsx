import Link from "next/link";
import { notFound } from "next/navigation";
import { getItem, recordTransaction, hasInventoryAccess } from "../actions";
import {
  STOCK_TRANSACTION_TYPES,
  transactionTypeLabel,
  transactionTypeBadgeClass,
} from "../labels";
import AccessRestricted from "../AccessRestricted";

export default async function ItemDetailPage({
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
  const item = await getItem(id);
  if (!item) notFound();

  const recordTransactionWithId = recordTransaction.bind(null, item.id);
  const lowStock = item.quantityOnHand <= item.reorderLevel;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400">
            <Link href="/dashboard/inventory" className="hover:underline">
              ← Inventory
            </Link>
          </p>
          <h1 className="text-xl font-semibold text-slate-800">{item.name}</h1>
          <p className="text-sm text-slate-500">
            {item.category ?? "Uncategorized"}
            {item.unit && ` · ${item.unit}`}
          </p>
        </div>
        <Link
          href={`/dashboard/inventory/${item.id}/edit`}
          className="text-sm text-blue-600 hover:underline"
        >
          Edit
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-slate-400">On Hand</p>
          <p
            className={
              item.quantityOnHand === 0
                ? "text-red-600 font-semibold text-lg"
                : lowStock
                  ? "text-amber-600 font-semibold text-lg"
                  : "text-slate-800 font-semibold text-lg"
            }
          >
            {item.quantityOnHand}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Reorder Level</p>
          <p className="text-slate-700">{item.reorderLevel}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">
          Record Transaction
        </h2>
        <form
          action={recordTransactionWithId}
          className="flex items-end gap-2 flex-wrap"
        >
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Type
            </label>
            <select
              name="type"
              required
              defaultValue="RECEIPT"
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              {STOCK_TRANSACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {transactionTypeLabel(t)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              required
              className="w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Reference
            </label>
            <input
              name="reference"
              placeholder="Supplier, requisition no., etc."
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Save
          </button>
        </form>
        <p className="text-xs text-slate-400">
          Receipts and adjustments add to stock; issues and transfers
          subtract. Enter positive numbers — the direction is set by type.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">
          Transaction History
        </h2>
        {item.stockTransactions.length === 0 ? (
          <p className="text-sm text-slate-400">No transactions recorded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {item.stockTransactions.map((t) => (
              <li key={t.id} className="py-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${transactionTypeBadgeClass(t.type)}`}
                  >
                    {t.type}
                  </span>
                  {t.reference && (
                    <span className="text-slate-400">{t.reference}</span>
                  )}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-slate-400 text-xs">
                    {new Date(t.createdAt).toLocaleString()}
                  </span>
                  <span
                    className={
                      t.quantity >= 0
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    }
                  >
                    {t.quantity >= 0 ? "+" : ""}
                    {t.quantity}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
