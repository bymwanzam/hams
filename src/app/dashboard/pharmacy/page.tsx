import Link from "next/link";
import { listPendingPrescriptions, hasPharmacyAccess } from "./actions";
import {
  prescriptionDispenseStatus,
  dispenseStatusLabel,
  dispenseStatusBadgeClass,
} from "@/lib/prescriptions";
import AccessRestricted from "./AccessRestricted";

export default async function PharmacyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!(await hasPharmacyAccess())) {
    return <AccessRestricted />;
  }

  const { q } = await searchParams;
  const prescriptions = await listPendingPrescriptions(q ?? "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Pharmacy &amp; Dispensary
          </h1>
          <p className="text-sm text-slate-500">
            Prescriptions awaiting dispensing.
          </p>
        </div>
        <Link
          href="/dashboard/pharmacy/drugs"
          className="text-sm text-blue-600 hover:underline"
        >
          Manage Drug Formulary →
        </Link>
      </div>

      <form className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by patient name or hospital no."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {prescriptions.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-400">
            No prescriptions waiting to be dispensed.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {prescriptions.map((rx) => {
              const status = prescriptionDispenseStatus(rx);
              return (
                <li key={rx.id}>
                  <Link
                    href={`/dashboard/pharmacy/${rx.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">
                        {rx.patient.firstName} {rx.patient.lastName}
                        <span className="text-slate-400 font-normal">
                          {" "}
                          · {rx.patient.hospitalNumber}
                        </span>
                      </p>
                      <p className="text-xs text-slate-400">
                        {rx.items.length} item{rx.items.length === 1 ? "" : "s"}{" "}
                        · Prescribed by {rx.prescribedBy.firstName}{" "}
                        {rx.prescribedBy.lastName} on{" "}
                        {new Date(rx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${dispenseStatusBadgeClass(status)}`}
                    >
                      {dispenseStatusLabel(status)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
