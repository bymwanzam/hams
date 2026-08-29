import Link from "next/link";
import { notFound } from "next/navigation";
import { getUnit, updateUnitStatus, hasBloodBankAccess } from "../actions";
import {
  BLOOD_BANK_STATUSES,
  unitStatusLabel,
  unitStatusBadgeClass,
} from "../labels";
import AccessRestricted from "../AccessRestricted";

export default async function UnitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await hasBloodBankAccess())) {
    return <AccessRestricted />;
  }

  const { id } = await params;
  const unit = await getUnit(id);
  if (!unit) notFound();

  const isExpired =
    new Date(unit.expiresAt) < new Date() &&
    (unit.status === "AVAILABLE" || unit.status === "RESERVED");
  const updateStatusWithId = updateUnitStatus.bind(null, unit.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="eyebrow">
            <Link href="/dashboard/blood-bank" className="hover:underline">
              ← Blood Bank
            </Link>
          </p>
          <h1 className="page-title">
            {unit.bloodGroup} · {unit.volumeMl} mL
          </h1>
        </div>
        <Link
          href={`/dashboard/blood-bank/${unit.id}/edit`}
          className="btn btn-ghost"
        >
          Edit
        </Link>
      </div>

      {isExpired && (
        <p className="callout callout-danger">
          This unit expired on {new Date(unit.expiresAt).toLocaleDateString()}{" "}
          and should be marked Discarded.
        </p>
      )}

      <div className="card grid grid-cols-2 gap-4">
        <div>
          <p className="eyebrow">Collected</p>
          <p className="text-[color:var(--color-text)]">
            {new Date(unit.collectedAt).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="eyebrow">Expires</p>
          <p className="text-[color:var(--color-text)]">
            {new Date(unit.expiresAt).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="eyebrow">Status</p>
          <span
            className={`${unitStatusBadgeClass(unit.status)}`}
          >
            {unitStatusLabel(unit.status)}
          </span>
        </div>
      </div>

      <div className="card gap-3">
        <h2 className="card-title">Update Status</h2>
        <form action={updateStatusWithId} className="flex items-end gap-2 flex-wrap">
          <div>
            <label className="form-label">
              Status
            </label>
            <select
              name="status"
              required
              defaultValue={unit.status}
              className="input input-sm"
            >
              {BLOOD_BANK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {unitStatusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
          >
            Save
          </button>
        </form>
        <p className="eyebrow">
          Reserve a unit once it&apos;s matched to a patient, then mark it
          Used once transfused.
        </p>
      </div>
    </div>
  );
}
