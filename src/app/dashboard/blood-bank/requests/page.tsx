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
          <p className="eyebrow">
            <Link href="/dashboard/blood-bank" className="hover:underline">
              ← Blood Bank
            </Link>
          </p>
          <h1 className="page-title">
            Blood Requests
          </h1>
          <p className="text-muted">
            Requests from wards, awaiting a match from stock.
          </p>
        </div>
      </div>

      <form className="flex items-end gap-3">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="input"
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
          className="btn btn-secondary"
        >
          Filter
        </button>
      </form>

      <div className="panel">
        {requests.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            No blood requests match this filter.
          </p>
        ) : (
          <ul className="list">
            {requests.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/dashboard/blood-bank/requests/${r.id}`}
                  className="row-link"
                >
                  <div className="min-w-0">
                    <p className="font-[600]">
                      {r.patient.firstName} {r.patient.lastName}
                      <span className="text-muted font-normal">
                        {" "}
                        · {r.patient.hospitalNumber}
                      </span>
                    </p>
                    <p className="eyebrow">
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
                      className={`${bloodUrgencyBadgeClass(r.urgency)}`}
                    >
                      {bloodUrgencyLabel(r.urgency)}
                    </span>
                    <span
                      className={`${bloodRequestStatusBadgeClass(r.status)}`}
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
