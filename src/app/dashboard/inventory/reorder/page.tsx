import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/ui";
import { getFacilityName } from "@/lib/facility";
import { suggestedReorderQty } from "@/lib/stock";
import { hasInventoryAccess } from "../actions";
import AccessRestricted from "../AccessRestricted";

export default async function InventoryReorderPage() {
  if (!(await hasInventoryAccess())) {
    return <AccessRestricted />;
  }

  const [items, facilityName] = await Promise.all([
    prisma.inventoryItem.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    getFacilityName(),
  ]);
  const belowPar = items.filter((i) => i.quantityOnHand <= i.reorderLevel);

  return (
    <div className="space-y-6 print:space-y-3">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="page-title">Purchase Order — Reorder List</h1>
          <p className="text-muted">
            <Link href="/dashboard/inventory" className="btn btn-ghost">
              ← Inventory &amp; Procurement
            </Link>
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="hidden text-center print:block">
        <p className="text-lg font-bold">{facilityName}</p>
        <p className="text-sm">Inventory Reorder List</p>
        <p className="text-muted text-xs">{new Date().toLocaleDateString()}</p>
      </div>

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>On Hand</th>
              <th>Reorder Level</th>
              <th>Suggested Qty</th>
            </tr>
          </thead>
          <tbody>
            {belowPar.length === 0 && (
              <tr>
                <td colSpan={5} className="text-muted py-8 text-center">
                  Nothing is at or below its reorder level.
                </td>
              </tr>
            )}
            {belowPar.map((i) => (
              <tr key={i.id}>
                <td className="px-4 py-2 font-[600]">{i.name}</td>
                <td className="px-4 py-2 text-muted">{i.category ?? "—"}</td>
                <td className="px-4 py-2">{i.quantityOnHand}</td>
                <td className="px-4 py-2 text-muted">{i.reorderLevel}</td>
                <td className="px-4 py-2 font-[600]">
                  {suggestedReorderQty(i.quantityOnHand, i.reorderLevel)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
