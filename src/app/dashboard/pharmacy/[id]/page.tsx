import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPrescriptionForDispensing,
  dispensePrescription,
  hasPharmacyAccess,
} from "../actions";
import { dispensedQuantities } from "@/lib/prescriptions";
import AccessRestricted from "../AccessRestricted";

export default async function DispensePrescriptionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await hasPharmacyAccess())) {
    return <AccessRestricted />;
  }

  const { id } = await params;
  const { error } = await searchParams;

  const prescription = await getPrescriptionForDispensing(id);
  if (!prescription) notFound();

  const dispensed = dispensedQuantities(prescription);
  const dispensePrescriptionWithId = dispensePrescription.bind(null, prescription.id);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="eyebrow">
          <Link href="/dashboard/pharmacy" className="hover:underline">
            ← Pharmacy queue
          </Link>
        </p>
        <h1 className="page-title">
          <Link
            href={`/dashboard/patients/${prescription.patient.id}`}
            className="hover:underline"
          >
            {prescription.patient.firstName} {prescription.patient.lastName}
          </Link>
        </h1>
        <p className="text-muted">
          {prescription.patient.hospitalNumber} · Prescribed by{" "}
          {prescription.prescribedBy.firstName} {prescription.prescribedBy.lastName}{" "}
          on {new Date(prescription.createdAt).toLocaleString()}
        </p>
      </div>

      {error && (
        <p className="callout callout-danger">
          {error}
        </p>
      )}

      <form
        action={dispensePrescriptionWithId}
        className="panel"
      >
        <table className="table">
          <thead>
            <tr>
              <th className="w-8" />
              <th className="text-left px-3 py-2">Drug</th>
              <th className="text-left px-3 py-2">Directions</th>
              <th className="text-left px-3 py-2">Prescribed</th>
              <th className="text-left px-3 py-2">Already Given</th>
              <th className="text-left px-3 py-2">In Stock</th>
              <th className="text-left px-3 py-2">Dispense Now</th>
            </tr>
          </thead>
          <tbody>
            {prescription.items.map((item) => {
              const given = dispensed.get(item.drugId) ?? 0;
              const remaining = Math.max(0, item.quantity - given);
              const suggested = Math.min(remaining, item.drug.quantityOnHand);
              const canDispense =
                remaining > 0 && item.drug.isAvailable && item.drug.quantityOnHand > 0;

              return (
                <tr key={item.id} className=" align-top">
                  <td className="px-3 py-3">
                    {canDispense && (
                      <input
                        type="checkbox"
                        name="dispenseItem"
                        value={item.drugId}
                        defaultChecked
                        className="mt-1 check"
                      />
                    )}
                    <input type="hidden" name="drugId" value={item.drugId} />
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-[600]">{item.drug.name}</p>
                    <span
                      className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        item.drug.nhisCovered
                          ? "tag tag-info"
                          : "tag tag-neutral"
                      }`}
                    >
                      {item.drug.nhisCovered ? "NHIS" : "Cash"}
                    </span>
                    {!item.drug.isAvailable && (
                      <p className="text-xs text-[color:var(--color-accent-700)] mt-1">Marked unavailable</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-muted">
                    {item.dosage}, {item.frequency}, {item.durationDays} day
                    {item.durationDays === 1 ? "" : "s"}
                  </td>
                  <td className="px-3 py-3">{item.quantity}</td>
                  <td className="px-3 py-3">{given}</td>
                  <td className="px-3 py-3">
                    <span
                      className={
                        item.drug.quantityOnHand === 0
                          ? "text-[color:var(--color-accent-700)] font-[600]"
                          : item.drug.quantityOnHand <= item.drug.reorderLevel
                            ? "text-[color:var(--color-accent-700)] font-[600]"
                            : "text-muted"
                      }
                    >
                      {item.drug.quantityOnHand}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {remaining === 0 ? (
                      <span className="text-[color:var(--color-success-ink)] text-xs font-[600]">
                        Fully given
                      </span>
                    ) : canDispense ? (
                      <input
                        type="number"
                        name="quantity"
                        min={1}
                        max={remaining}
                        defaultValue={suggested || undefined}
                        className="w-20 input input-sm"
                      />
                    ) : (
                      <span className="text-[color:var(--color-accent-700)] text-xs">Out of stock</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="px-4 py-3 ">
          <button
            type="submit"
            className="btn btn-primary"
          >
            Dispense Selected
          </button>
        </div>
      </form>

      {prescription.dispenses.length > 0 && (
        <div className="card">
          <h2 className="card-title mb-2">
            Dispensing History
          </h2>
          <ul className="list text-sm">
            {prescription.dispenses.map((d) => (
              <li key={d.id} className="py-2">
                <p className="text-muted text-xs">
                  {new Date(d.dispensedAt).toLocaleString()}
                </p>
                <p>
                  {d.items
                    .map((i) => {
                      const drug = prescription.items.find(
                        (pi) => pi.drugId === i.drugId
                      )?.drug;
                      return `${drug?.name ?? "Drug"} ×${i.quantity}`;
                    })
                    .join(", ")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
