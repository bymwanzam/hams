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
          <h1 className="page-title">
            Drug Formulary
          </h1>
          <p className="text-muted">
            <Link href="/dashboard/pharmacy" className="btn btn-ghost">
              ← Pharmacy queue
            </Link>
          </p>
        </div>
        <Link
          href="/dashboard/pharmacy/drugs/new"
          className="btn btn-primary"
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
          className="input"
        />
      </form>

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Drug</th>
              <th>Form</th>
              <th>Price (GHS)</th>
              <th>In Stock</th>
              <th>Coverage</th>
              <th>Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {drugs.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted">
                  No drugs in the formulary yet.
                </td>
              </tr>
            )}
            {drugs.map((d) => {
              const lowStock = d.quantityOnHand <= d.reorderLevel;
              return (
                <tr key={d.id}>
                  <td className="px-4 py-2">
                    <p className="font-[600]">{d.name}</p>
                    {d.genericName && (
                      <p className="eyebrow">{d.genericName}</p>
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted">{d.form ?? "—"}</td>
                  <td className="px-4 py-2 text-muted">
                    {d.unitPrice.toString()}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        d.quantityOnHand === 0
                          ? "text-[color:var(--color-accent-700)] font-[600]"
                          : lowStock
                            ? "text-[color:var(--color-accent-700)] font-[600]"
                            : "text-muted"
                      }
                    >
                      {d.quantityOnHand}
                    </span>
                    {lowStock && d.quantityOnHand > 0 && (
                      <span className="ml-1 text-[10px] text-[color:var(--color-accent-700)]">low</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        d.nhisCovered
                          ? "tag tag-info"
                          : "tag tag-neutral"
                      }`}
                    >
                      {d.nhisCovered ? "NHIS" : "Cash"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`${
                        d.isAvailable
                          ? "tag tag-success"
                          : "tag tag-danger"
                      }`}
                    >
                      {d.isAvailable ? "Available" : "Not Available"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/dashboard/pharmacy/drugs/${d.id}/edit`}
                      className="btn btn-ghost"
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
