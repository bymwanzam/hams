import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBloodRequest,
  listAvailableUnitsForGroup,
  reserveUnitsForRequest,
  issueBloodRequest,
  cancelBloodRequest,
  hasBloodBankAccess,
} from "../../actions";
import {
  bloodRequestStatusLabel,
  bloodRequestStatusBadgeClass,
  bloodUrgencyLabel,
  bloodUrgencyBadgeClass,
} from "../../labels";
import AccessRestricted from "../../AccessRestricted";

export default async function BloodRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await hasBloodBankAccess())) {
    return <AccessRestricted />;
  }

  const { id } = await params;
  const request = await getBloodRequest(id);
  if (!request) notFound();

  const isOpen = request.status === "REQUESTED" || request.status === "RESERVED";
  const reservedUnits = request.units.filter((u) => u.status === "RESERVED");
  const availableUnits = isOpen
    ? await listAvailableUnitsForGroup(request.bloodGroup)
    : [];

  const reserveWithId = reserveUnitsForRequest.bind(null, request.id);
  const issueWithId = issueBloodRequest.bind(null, request.id);
  const cancelWithId = cancelBloodRequest.bind(null, request.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="eyebrow">
            <Link
              href="/dashboard/blood-bank/requests"
              className="hover:underline"
            >
              ← Blood Requests
            </Link>
          </p>
          <h1 className="page-title">
            {request.patient.firstName} {request.patient.lastName}
          </h1>
          <p className="text-muted">
            <Link
              href={`/dashboard/wards/${request.admission.id}`}
              className="hover:underline"
            >
              {request.admission.bed.ward.name}, Bed{" "}
              {request.admission.bed.label}
            </Link>
          </p>
        </div>
        <span className="flex items-center gap-2 shrink-0">
          <span
            className={`${bloodUrgencyBadgeClass(request.urgency)}`}
          >
            {bloodUrgencyLabel(request.urgency)}
          </span>
          <span
            className={`${bloodRequestStatusBadgeClass(request.status)}`}
          >
            {bloodRequestStatusLabel(request.status)}
          </span>
        </span>
      </div>

      <div className="card grid grid-cols-2 gap-4">
        <Info label="Blood Group" value={request.bloodGroup} />
        <Info label="Units Needed" value={String(request.unitsNeeded)} />
        <Info
          label="Requested By"
          value={`Dr. ${request.requestedBy.firstName} ${request.requestedBy.lastName}`}
        />
        <Info
          label="Requested At"
          value={new Date(request.requestedAt).toLocaleString()}
        />
        <div className="col-span-2">
          <p className="eyebrow">Indication</p>
          <p className="text-[color:var(--color-text)] whitespace-pre-wrap">
            {request.indication}
          </p>
        </div>
        {request.fulfilledAt && (
          <Info
            label="Issued At"
            value={new Date(request.fulfilledAt).toLocaleString()}
          />
        )}
      </div>

      <div className="card gap-3">
        <h2 className="card-title">
          Reserved Units
        </h2>
        {reservedUnits.length === 0 ? (
          <p className="text-muted">
            No units reserved against this request yet.
          </p>
        ) : (
          <ul className="list text-sm">
            {reservedUnits.map((u) => (
              <li key={u.id} className="py-2 flex items-center justify-between">
                <span>
                  {u.bloodGroup} · {u.volumeMl} mL
                </span>
                <span className="text-muted text-xs">
                  expires {new Date(u.expiresAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isOpen && (
        <div className="card gap-3">
          <h2 className="card-title">
            Reserve Units from Stock
          </h2>
          {availableUnits.length === 0 ? (
            <p className="text-muted">
              No {request.bloodGroup} units currently available. Check the
              main inventory once more stock is collected.
            </p>
          ) : (
            <form action={reserveWithId} className="space-y-3">
              <ul className="list text-sm panel">
                {availableUnits.map((u) => (
                  <li key={u.id} className="flex items-center gap-3 px-3 py-2">
                    <input
                      type="checkbox"
                      name="unitIds"
                      value={u.id}
                      id={`unit-${u.id}`}
                      className="check"
                    />
                    <label htmlFor={`unit-${u.id}`} className="flex-1">
                      {u.bloodGroup} · {u.volumeMl} mL
                    </label>
                    <span className="text-muted text-xs">
                      expires {new Date(u.expiresAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Reserve Selected Units
              </button>
            </form>
          )}
        </div>
      )}

      {isOpen && (
        <div className="flex flex-wrap gap-3">
          {reservedUnits.length > 0 && (
            <form action={issueWithId}>
              <button
                type="submit"
                className="btn btn-secondary"
              >
                Mark Issued / Transfused
              </button>
            </form>
          )}
          <form action={cancelWithId}>
            <button
              type="submit"
              className="btn btn-secondary"
            >
              Cancel Request
            </button>
          </form>
        </div>
      )}
      {isOpen && reservedUnits.length > 0 && (
        <p className="eyebrow">
          Marking this issued releases the units above for transfusion and
          closes the request out. Cancelling instead returns any reserved
          units above back to Available stock.
        </p>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="text-[color:var(--color-text)]">{value}</p>
    </div>
  );
}
