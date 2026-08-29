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
        <p className="text-xs text-slate-400">
          <Link href="/dashboard/pharmacy" className="hover:underline">
            ← Pharmacy queue
          </Link>
        </p>
        <h1 className="text-xl font-semibold text-slate-800">
          <Link
            href={`/dashboard/patients/${prescription.patient.id}`}
            className="hover:underline"
          >
            {prescription.patient.firstName} {prescription.patient.lastName}
          </Link>
        </h1>
        <p className="text-sm text-slate-500">
          {prescription.patient.hospitalNumber} · Prescribed by{" "}
          {prescription.prescribedBy.firstName} {prescription.prescribedBy.lastName}{" "}
          on {new Date(prescription.createdAt).toLocaleString()}
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <form
        action={dispensePrescriptionWithId}
        className="bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
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
                <tr key={item.id} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-3">
                    {canDispense && (
                      <input
                        type="checkbox"
                        name="dispenseItem"
                        value={item.drugId}
                        defaultChecked
                        className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    )}
                    <input type="hidden" name="drugId" value={item.drugId} />
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-slate-800">{item.drug.name}</p>
                    <span
                      className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        item.drug.nhisCovered
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.drug.nhisCovered ? "NHIS" : "Cash"}
                    </span>
                    {!item.drug.isAvailable && (
                      <p className="text-xs text-red-500 mt-1">Marked unavailable</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-slate-500">
                    {item.dosage}, {item.frequency}, {item.durationDays} day
                    {item.durationDays === 1 ? "" : "s"}
                  </td>
                  <td className="px-3 py-3">{item.quantity}</td>
                  <td className="px-3 py-3">{given}</td>
                  <td className="px-3 py-3">
                    <span
                      className={
                        item.drug.quantityOnHand === 0
                          ? "text-red-600 font-medium"
                          : item.drug.quantityOnHand <= item.drug.reorderLevel
                            ? "text-amber-600 font-medium"
                            : "text-slate-600"
                      }
                    >
                      {item.drug.quantityOnHand}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {remaining === 0 ? (
                      <span className="text-green-600 text-xs font-medium">
                        Fully given
                      </span>
                    ) : canDispense ? (
                      <input
                        type="number"
                        name="quantity"
                        min={1}
                        max={remaining}
                        defaultValue={suggested || undefined}
                        className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                      />
                    ) : (
                      <span className="text-red-500 text-xs">Out of stock</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="px-4 py-3 border-t border-slate-100">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Dispense Selected
          </button>
        </div>
      </form>

      {prescription.dispenses.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">
            Dispensing History
          </h2>
          <ul className="divide-y divide-slate-100 text-sm">
            {prescription.dispenses.map((d) => (
              <li key={d.id} className="py-2">
                <p className="text-slate-500 text-xs">
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
