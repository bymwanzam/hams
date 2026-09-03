import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatCard, Tag } from "@/components/ui";
import {
  stockStatus,
  stockStatusLabel,
  stockStatusTone,
  suggestedReorderQty,
  isExpiringWithin,
  daysUntil,
  formatExpiry,
  startOfToday,
} from "@/lib/stock";
import { listItems, hasInventoryAccess } from "./actions";
import AccessRestricted from "./AccessRestricted";

export default async function InventoryDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!(await hasInventoryAccess())) {
    return <AccessRestricted />;
  }

  const { q } = await searchParams;
  const [items, allItems, issuedAgg] = await Promise.all([
    listItems(q ?? ""),
    prisma.inventoryItem.findMany(),
    prisma.stockTransaction.aggregate({
      _sum: { quantity: true },
      where: { type: "ISSUE", createdAt: { gte: startOfToday() } },
    }),
  ]);

  const lowStock = allItems.filter((i) => i.quantityOnHand <= i.reorderLevel);
  const expiringSoon = allItems.filter((i) => isExpiringWithin(i.expiryDate, 30));
  const issuedToday = Math.abs(issuedAgg._sum.quantity ?? 0);

  const alerts = [
    ...lowStock.map((i) => ({
      key: `low-${i.id}`,
      name: i.name,
      sub: `Reorder ${suggestedReorderQty(i.quantityOnHand, i.reorderLevel)} ${i.unit ?? "units"}`,
      tone: "warning" as const,
    })),
    ...expiringSoon.map((i) => {
      const n = daysUntil(i.expiryDate);
      return {
        key: `exp-${i.id}`,
        name: i.name,
        sub: n !== null && n < 0 ? "Expired" : `Expires in ${n} days`,
        tone: "critical" as const,
      };
    }),
  ].slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="page-title">Inventory &amp; Procurement</h1>
          <p className="text-muted">Stores, stock levels and supply chain.</p>
        </div>
        <span className="text-muted text-sm">
          Last synced{" "}
          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total SKUs" value={allItems.length} accent="sky" />
        <StatCard label="Low Stock Items" value={lowStock.length} accent="amber" />
        <StatCard label="Expiring in 30 Days" value={expiringSoon.length} accent="red" />
        <StatCard label="Issued Today" value={issuedToday} accent="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="card gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="card-title">Stock Register</h2>
            <form>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search by name or category"
                className="input input-sm w-56"
              />
            </form>
          </div>
          <div className="overflow-x-auto">
            <table className="table text-sm">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Batch</th>
                  <th>Qty</th>
                  <th>Expiry</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-muted py-8 text-center">
                      No inventory items match.
                    </td>
                  </tr>
                )}
                {items.map((item) => {
                  const status = stockStatus(
                    item.quantityOnHand,
                    item.reorderLevel,
                    item.expiryDate
                  );
                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-2">
                        <Link
                          href={`/dashboard/inventory/${item.id}`}
                          className="font-[600] hover:underline"
                          style={{ color: "var(--color-text)" }}
                        >
                          {item.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-muted">{item.category ?? "—"}</td>
                      <td className="px-4 py-2 text-muted">
                        {item.batchNumber ?? "—"}
                      </td>
                      <td className="px-4 py-2">{item.quantityOnHand}</td>
                      <td className="px-4 py-2 text-muted">
                        {formatExpiry(item.expiryDate)}
                      </td>
                      <td className="px-4 py-2">
                        <Tag tone={stockStatusTone(status)}>
                          {stockStatusLabel(status)}
                        </Tag>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/inventory/new" className="btn btn-primary">
              + Add Item
            </Link>
            <Link href="/dashboard/inventory/reorder" className="btn btn-secondary">
              Raise Purchase Order
            </Link>
          </div>
        </div>

        <div
          className="card gap-3"
          style={{
            background: "color-mix(in srgb, var(--color-text) 3%, var(--color-surface))",
          }}
        >
          <h2 className="card-title">Reorder Alerts</h2>
          {alerts.length === 0 ? (
            <p className="text-muted text-sm">Nothing needs attention right now.</p>
          ) : (
            <ul className="space-y-2">
              {alerts.map((a) => (
                <li
                  key={a.key}
                  className="border-l-2 bg-[var(--color-surface)] px-3 py-2"
                  style={{
                    borderColor:
                      a.tone === "critical"
                        ? "var(--color-accent)"
                        : "var(--color-warn-ink)",
                  }}
                >
                  <p className="font-[600] text-[color:var(--color-text)]">{a.name}</p>
                  <p className="text-muted text-xs">{a.sub}</p>
                </li>
              ))}
            </ul>
          )}
          <p className="text-muted text-xs">
            {lowStock.length} item{lowStock.length === 1 ? "" : "s"} at or under par
            level.
          </p>
          <Link
            href="/dashboard/inventory/reorder"
            className="btn btn-secondary btn-block"
          >
            Raise Purchase Order
          </Link>
        </div>
      </div>
    </div>
  );
}
