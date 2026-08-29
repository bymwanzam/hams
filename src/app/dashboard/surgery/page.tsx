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
          <h1 className="text-xl font-semibold text-slate-800">
            Surgery &amp; Theatre
          </h1>
          <p className="text-sm text-slate-500">
            Scheduled and in-progress cases across all theatres.
          </p>
        </div>
        <Link
          href="/dashboard/surgery/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
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
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {surgeries.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-400">
            No surgeries scheduled or in progress.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {surgeries.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/dashboard/surgery/${s.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">
                      {s.procedure}
                      {s.theatre && (
                        <span className="text-slate-400 font-normal">
                          {" "}
                          · {s.theatre}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">
                      {s.patient.firstName} {s.patient.lastName} ·{" "}
                      {s.patient.hospitalNumber} · Dr. {s.surgeon.firstName}{" "}
                      {s.surgeon.lastName} ·{" "}
                      {new Date(s.scheduledAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="shrink-0 flex items-center gap-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${paymentTypeBadgeClass(s.paymentType)}`}
                    >
                      {paymentTypeLabel(s.paymentType)}
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${surgeryStatusBadgeClass(s.status)}`}
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
