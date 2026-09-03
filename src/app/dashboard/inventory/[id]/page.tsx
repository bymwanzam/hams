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
          <p className="eyebrow">
            <Link href="/dashboard/inventory" className="hover:underline">
              ← Inventory
            </Link>
          </p>
          <h1 className="page-title">{item.name}</h1>
          <p className="text-muted">
            {item.category ?? "Uncategorized"}
            {item.unit && ` · ${item.unit}`}
          </p>
        </div>
        <Link
          href={`/dashboard/inventory/${item.id}/edit`}
          className="btn btn-ghost"
        >
          Edit
        </Link>
      </div>

      {error && (
        <p className="callout callout-danger">
          {error}
        </p>
      )}

      <div className="card grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="eyebrow">On Hand</p>
          <p
            className={
              item.quantityOnHand === 0
                ? "text-[color:var(--color-accent-700)] font-[700] text-lg"
                : lowStock
                  ? "text-[color:var(--color-accent-700)] font-[700] text-lg"
                  : "text-[color:var(--color-text)] font-semibold text-lg"
            }
          >
            {item.quantityOnHand}
          </p>
        </div>
        <div>
          <p className="eyebrow">Reorder Level</p>
          <p className="text-[color:var(--color-text)]">{item.reorderLevel}</p>
        </div>
        <div>
          <p className="eyebrow">Current Batch</p>
          <p className="text-[color:var(--color-text)]">
            {item.batchNumber ?? "—"}
          </p>
        </div>
        <div>
          <p className="eyebrow">Expiry</p>
          <p className="text-[color:var(--color-text)]">
            {item.expiryDate
              ? new Date(item.expiryDate).toLocaleDateString()
              : "—"}
          </p>
        </div>
      </div>

      <div className="card gap-3">
        <h2 className="card-title">
          Record Transaction
        </h2>
        <form
          action={recordTransactionWithId}
          className="flex items-end gap-2 flex-wrap"
        >
          <div>
            <label className="form-label">
              Type
            </label>
            <select
              name="type"
              required
              defaultValue="RECEIPT"
              className="input input-sm"
            >
              {STOCK_TRANSACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {transactionTypeLabel(t)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              required
              className="w-24 input input-sm"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="form-label">
              Reference
            </label>
            <input
              name="reference"
              placeholder="Supplier, requisition no., etc."
              className="input input-sm"
            />
          </div>
          <div>
            <label className="form-label">Batch No.</label>
            <input name="batchNumber" className="w-28 input input-sm" />
          </div>
          <div>
            <label className="form-label">Expiry</label>
            <input type="date" name="expiryDate" className="input input-sm" />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
          >
            Save
          </button>
        </form>
        <p className="eyebrow">
          Receipts and adjustments add to stock; issues and transfers
          subtract. Enter positive numbers — the direction is set by type.
          Batch and expiry apply to receipts and become the item&apos;s
          current stock lot.
        </p>
      </div>

      <div className="card gap-3">
        <h2 className="card-title">
          Transaction History
        </h2>
        {item.stockTransactions.length === 0 ? (
          <p className="text-muted">No transactions recorded yet.</p>
        ) : (
          <ul className="list text-sm">
            {item.stockTransactions.map((t) => (
              <li key={t.id} className="py-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className={`${transactionTypeBadgeClass(t.type)}`}
                  >
                    {t.type}
                  </span>
                  {t.reference && (
                    <span className="text-muted">{t.reference}</span>
                  )}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-muted text-xs">
                    {new Date(t.createdAt).toLocaleString()}
                  </span>
                  <span
                    className={
                      t.quantity >= 0
                        ? "text-[color:var(--color-success-ink)] font-[600]"
                        : "text-[color:var(--color-accent-700)] font-[600]"
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
