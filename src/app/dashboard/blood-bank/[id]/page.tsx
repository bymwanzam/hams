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
          <p className="text-xs text-slate-400">
            <Link href="/dashboard/blood-bank" className="hover:underline">
              ← Blood Bank
            </Link>
          </p>
          <h1 className="text-xl font-semibold text-slate-800">
            {unit.bloodGroup} · {unit.volumeMl} mL
          </h1>
        </div>
        <Link
          href={`/dashboard/blood-bank/${unit.id}/edit`}
          className="text-sm text-blue-600 hover:underline"
        >
          Edit
        </Link>
      </div>

      {isExpired && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          This unit expired on {new Date(unit.expiresAt).toLocaleDateString()}{" "}
          and should be marked Discarded.
        </p>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-slate-400">Collected</p>
          <p className="text-slate-700">
            {new Date(unit.collectedAt).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Expires</p>
          <p className="text-slate-700">
            {new Date(unit.expiresAt).toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Status</p>
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${unitStatusBadgeClass(unit.status)}`}
          >
            {unitStatusLabel(unit.status)}
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Update Status</h2>
        <form action={updateStatusWithId} className="flex items-end gap-2 flex-wrap">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Status
            </label>
            <select
              name="status"
              required
              defaultValue={unit.status}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
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
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Save
          </button>
        </form>
        <p className="text-xs text-slate-400">
          Reserve a unit once it&apos;s matched to a patient, then mark it
          Used once transfused.
        </p>
      </div>
    </div>
  );
}
