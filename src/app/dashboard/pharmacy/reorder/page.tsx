import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/ui";
import { getFacilityName } from "@/lib/facility";
import { suggestedReorderQty } from "@/lib/stock";
import { hasPharmacyAccess } from "../actions";
import AccessRestricted from "../AccessRestricted";

export default async function PharmacyReorderPage() {
  if (!(await hasPharmacyAccess())) {
    return <AccessRestricted />;
  }

  const [drugs, facilityName] = await Promise.all([
    prisma.drug.findMany({ orderBy: { name: "asc" } }),
    getFacilityName(),
  ]);
  const belowPar = drugs.filter((d) => d.quantityOnHand <= d.reorderLevel);

  return (
    <div className="space-y-6 print:space-y-3">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="page-title">Purchase Order — Reorder List</h1>
          <p className="text-muted">
            <Link href="/dashboard/pharmacy" className="btn btn-ghost">
              ← Pharmacy &amp; Inventory
            </Link>
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="hidden text-center print:block">
        <p className="text-lg font-bold">{facilityName}</p>
        <p className="text-sm">Pharmacy Reorder List</p>
        <p className="text-muted text-xs">{new Date().toLocaleDateString()}</p>
      </div>

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Drug</th>
              <th>On Hand</th>
              <th>Reorder Level</th>
              <th>Suggested Qty</th>
            </tr>
          </thead>
          <tbody>
            {belowPar.length === 0 && (
              <tr>
                <td colSpan={4} className="text-muted py-8 text-center">
                  Nothing is at or below its reorder level.
                </td>
              </tr>
            )}
            {belowPar.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-2 font-[600]">{d.name}</td>
                <td className="px-4 py-2">{d.quantityOnHand}</td>
                <td className="px-4 py-2 text-muted">{d.reorderLevel}</td>
                <td className="px-4 py-2 font-[600]">
                  {suggestedReorderQty(d.quantityOnHand, d.reorderLevel)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
