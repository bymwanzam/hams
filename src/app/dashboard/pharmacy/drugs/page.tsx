import Link from "next/link";
import { listDrugs, hasPharmacyAccess } from "../actions";
import AccessRestricted from "../AccessRestricted";

export default async function DrugsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!(await hasPharmacyAccess())) {
    return <AccessRestricted />;
  }

  const { q } = await searchParams;
  const drugs = await listDrugs(q ?? "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Drug Formulary
          </h1>
          <p className="text-sm text-slate-500">
            <Link href="/dashboard/pharmacy" className="text-blue-600 hover:underline">
              ← Pharmacy queue
            </Link>
          </p>
        </div>
        <Link
          href="/dashboard/pharmacy/drugs/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + Add Drug
        </Link>
      </div>

      <form className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by drug or generic name"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Drug</th>
              <th className="text-left px-4 py-2">Form</th>
              <th className="text-left px-4 py-2">Price (GHS)</th>
              <th className="text-left px-4 py-2">In Stock</th>
              <th className="text-left px-4 py-2">Coverage</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {drugs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No drugs in the formulary yet.
                </td>
              </tr>
            )}
            {drugs.map((d) => {
              const lowStock = d.quantityOnHand <= d.reorderLevel;
              return (
                <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <p className="font-medium text-slate-800">{d.name}</p>
                    {d.genericName && (
                      <p className="text-xs text-slate-400">{d.genericName}</p>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{d.form ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {d.unitPrice.toString()}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        d.quantityOnHand === 0
                          ? "text-red-600 font-medium"
                          : lowStock
                            ? "text-amber-600 font-medium"
                            : "text-slate-600"
                      }
                    >
                      {d.quantityOnHand}
                    </span>
                    {lowStock && d.quantityOnHand > 0 && (
                      <span className="ml-1 text-[10px] text-amber-600">low</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        d.nhisCovered
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {d.nhisCovered ? "NHIS" : "Cash"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        d.isAvailable
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {d.isAvailable ? "Available" : "Not Available"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/dashboard/pharmacy/drugs/${d.id}/edit`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
