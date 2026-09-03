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
  type StockStatus,
} from "@/lib/stock";
import { hasPharmacyAccess } from "./actions";
import AccessRestricted from "./AccessRestricted";

const SEVERITY: Record<StockStatus, number> = {
  OUT: 0,
  EXPIRING: 1,
  LOW: 2,
  IN_STOCK: 3,
};

export default async function PharmacyDashboardPage() {
  if (!(await hasPharmacyAccess())) {
    return <AccessRestricted />;
  }

  const [drugs, dispensedAgg] = await Promise.all([
    prisma.drug.findMany({ orderBy: { name: "asc" } }),
    prisma.dispenseItem.aggregate({
      _sum: { quantity: true },
      where: { dispense: { dispensedAt: { gte: startOfToday() } } },
    }),
  ]);

  const lowStock = drugs.filter((d) => d.quantityOnHand <= d.reorderLevel);
  const expiringSoon = drugs.filter((d) => isExpiringWithin(d.expiryDate, 30));
  const dispensedToday = dispensedAgg._sum.quantity ?? 0;

  const register = [...drugs]
    .map((d) => ({ d, status: stockStatus(d.quantityOnHand, d.reorderLevel, d.expiryDate) }))
    .sort((a, b) => {
      const s = SEVERITY[a.status] - SEVERITY[b.status];
      if (s !== 0) return s;
      return (daysUntil(a.d.expiryDate) ?? 1e9) - (daysUntil(b.d.expiryDate) ?? 1e9);
    })
    .slice(0, 8);

  const alerts = [
    ...lowStock.map((d) => ({
      key: `low-${d.id}`,
      name: d.name,
      sub: `Reorder ${suggestedReorderQty(d.quantityOnHand, d.reorderLevel)} units`,
      tone: "warning" as const,
    })),
    ...expiringSoon.map((d) => {
      const n = daysUntil(d.expiryDate);
      return {
        key: `exp-${d.id}`,
        name: d.name,
        sub: n !== null && n < 0 ? "Expired" : `Expires in ${n} days`,
        tone: "critical" as const,
      };
    }),
  ].slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="page-title">Pharmacy &amp; Inventory Management</h1>
          <p className="text-muted">Drug formulary, stock levels and dispensing.</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted">
            Last synced{" "}
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <Link href="/dashboard/pharmacy/drugs" className="btn btn-ghost">
            Manage Drug Formulary →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total SKUs" value={drugs.length} accent="sky" />
        <StatCard label="Low Stock Items" value={lowStock.length} accent="amber" />
        <StatCard label="Expiring in 30 Days" value={expiringSoon.length} accent="red" />
        <StatCard label="Dispensed Today" value={dispensedToday} accent="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="card gap-4">
          <h2 className="card-title">Stock Register</h2>
          <div className="overflow-x-auto">
            <table className="table text-sm">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Batch</th>
                  <th>Qty</th>
                  <th>Expiry</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {register.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-muted py-8 text-center">
                      No drugs in the formulary yet.
                    </td>
                  </tr>
                )}
                {register.map(({ d, status }) => (
                  <tr key={d.id}>
                    <td className="px-4 py-2">
                      <Link
                        href={`/dashboard/pharmacy/drugs/${d.id}/edit`}
                        className="font-[600] hover:underline"
                        style={{ color: "var(--color-text)" }}
                      >
                        {d.name}
                      </Link>
                      {d.genericName && <p className="eyebrow">{d.genericName}</p>}
                    </td>
                    <td className="px-4 py-2 text-muted">{d.batchNumber ?? "—"}</td>
                    <td className="px-4 py-2">{d.quantityOnHand}</td>
                    <td className="px-4 py-2 text-muted">{formatExpiry(d.expiryDate)}</td>
                    <td className="px-4 py-2">
                      <Tag tone={stockStatusTone(status)}>{stockStatusLabel(status)}</Tag>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/pharmacy/dispense" className="btn btn-primary">
              Dispense Prescription
            </Link>
            <Link href="/dashboard/pharmacy/grn" className="btn btn-secondary">
              Add Stock (GRN)
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
          <Link href="/dashboard/pharmacy/reorder" className="btn btn-secondary btn-block">
            Raise Purchase Order
          </Link>
        </div>
      </div>
    </div>
  );
}
