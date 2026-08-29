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
          <h1 className="page-title">
            Pharmacy &amp; Dispensary
          </h1>
          <p className="text-muted">
            Prescriptions awaiting dispensing.
          </p>
        </div>
        <Link
          href="/dashboard/pharmacy/drugs"
          className="btn btn-ghost"
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
          className="input"
        />
      </form>

      <div className="panel">
        {prescriptions.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            No prescriptions waiting to be dispensed.
          </p>
        ) : (
          <ul className="list">
            {prescriptions.map((rx) => {
              const status = prescriptionDispenseStatus(rx);
              return (
                <li key={rx.id}>
                  <Link
                    href={`/dashboard/pharmacy/${rx.id}`}
                    className="row-link"
                  >
                    <div className="min-w-0">
                      <p className="font-[600]">
                        {rx.patient.firstName} {rx.patient.lastName}
                        <span className="text-muted font-normal">
                          {" "}
                          · {rx.patient.hospitalNumber}
                        </span>
                      </p>
                      <p className="eyebrow">
                        {rx.items.length} item{rx.items.length === 1 ? "" : "s"}{" "}
                        · Prescribed by {rx.prescribedBy.firstName}{" "}
                        {rx.prescribedBy.lastName} on{" "}
                        {new Date(rx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 ${dispenseStatusBadgeClass(status)}`}
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
