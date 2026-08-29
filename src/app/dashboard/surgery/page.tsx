import Link from "next/link";
import { listSurgeries } from "./actions";
import {
  surgeryStatusBadgeClass,
  paymentTypeLabel,
  paymentTypeBadgeClass,
} from "./labels";

export default async function SurgeryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const surgeries = await listSurgeries(q ?? "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Surgery &amp; Theatre
          </h1>
          <p className="text-muted">
            Scheduled and in-progress cases across all theatres.
          </p>
        </div>
        <Link
          href="/dashboard/surgery/new"
          className="btn btn-primary"
        >
          + Schedule Surgery
        </Link>
      </div>

      <form className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by patient, hospital no. or procedure"
          className="input"
        />
      </form>

      <div className="panel">
        {surgeries.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            No surgeries scheduled or in progress.
          </p>
        ) : (
          <ul className="list">
            {surgeries.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/dashboard/surgery/${s.id}`}
                  className="row-link"
                >
                  <div className="min-w-0">
                    <p className="font-[600]">
                      {s.procedure}
                      {s.theatre && (
                        <span className="text-muted font-normal">
                          {" "}
                          · {s.theatre}
                        </span>
                      )}
                    </p>
                    <p className="eyebrow">
                      {s.patient.firstName} {s.patient.lastName} ·{" "}
                      {s.patient.hospitalNumber} · Dr. {s.surgeon.firstName}{" "}
                      {s.surgeon.lastName} ·{" "}
                      {new Date(s.scheduledAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="shrink-0 flex items-center gap-2">
                    <span
                      className={`${paymentTypeBadgeClass(s.paymentType)}`}
                    >
                      {paymentTypeLabel(s.paymentType)}
                    </span>
                    <span
                      className={`${surgeryStatusBadgeClass(s.status)}`}
                    >
                      {s.status.replace("_", " ")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
