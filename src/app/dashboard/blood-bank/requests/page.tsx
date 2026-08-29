import Link from "next/link";
import { listBloodRequests, hasBloodBankAccess } from "../actions";
import {
  BLOOD_REQUEST_STATUSES,
  bloodRequestStatusLabel,
  bloodRequestStatusBadgeClass,
  bloodUrgencyLabel,
  bloodUrgencyBadgeClass,
} from "../labels";
import AccessRestricted from "../AccessRestricted";

export default async function BloodRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!(await hasBloodBankAccess())) {
    return <AccessRestricted />;
  }

  const { status } = await searchParams;
  const requests = await listBloodRequests(status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">
            <Link href="/dashboard/blood-bank" className="hover:underline">
              ← Blood Bank
            </Link>
          </p>
          <h1 className="text-xl font-semibold text-slate-800">
            Blood Requests
          </h1>
          <p className="text-sm text-slate-500">
            Requests from wards, awaiting a match from stock.
          </p>
        </div>
      </div>

      <form className="flex items-end gap-3">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Open (Requested + Reserved)</option>
          {BLOOD_REQUEST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {bloodRequestStatusLabel(s)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="text-sm text-slate-600 hover:text-slate-900 border border-slate-300 rounded-md px-4 py-2"
        >
          Filter
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {requests.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-400">
            No blood requests match this filter.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {requests.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/dashboard/blood-bank/requests/${r.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">
                      {r.patient.firstName} {r.patient.lastName}
                      <span className="text-slate-400 font-normal">
                        {" "}
                        · {r.patient.hospitalNumber}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {r.bloodGroup} · {r.unitsNeeded} unit
                      {r.unitsNeeded === 1 ? "" : "s"} ·{" "}
                      {r.admission.bed.ward.name}, Bed{" "}
                      {r.admission.bed.label} · requested by{" "}
                      {r.requestedBy.firstName} {r.requestedBy.lastName} ·{" "}
                      {new Date(r.requestedAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="shrink-0 flex items-center gap-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs ${bloodUrgencyBadgeClass(r.urgency)}`}
                    >
                      {bloodUrgencyLabel(r.urgency)}
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${bloodRequestStatusBadgeClass(r.status)}`}
                    >
                      {bloodRequestStatusLabel(r.status)}
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
