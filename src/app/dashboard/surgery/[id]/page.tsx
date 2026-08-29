import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getSurgery,
  updateSurgeryStatus,
  recordOperativeNote,
  updatePaymentType,
} from "../actions";
import {
  surgeryStatusBadgeClass,
  SURGERY_STATUSES,
  SURGERY_PAYMENT_TYPES,
  paymentTypeLabel,
  paymentTypeBadgeClass,
} from "../labels";

export default async function SurgeryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const surgery = await getSurgery(id);
  if (!surgery) notFound();

  const isResolved = surgery.status === "COMPLETED" || surgery.status === "CANCELLED";
  const updateStatusWithId = updateSurgeryStatus.bind(null, surgery.id);
  const recordNoteWithId = recordOperativeNote.bind(null, surgery.id);
  const updatePaymentTypeWithId = updatePaymentType.bind(null, surgery.id);
  // COMPLETED is reachable only through "Record Operative Note" below — it
  // isn't a choice in this dropdown, so status can't jump to done without
  // an operative report actually being saved.
  const manualStatuses = SURGERY_STATUSES.filter((s) => s !== "COMPLETED");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-xs text-slate-400">
          <Link href="/dashboard/surgery" className="hover:underline">
            ← Surgery &amp; Theatre
          </Link>
        </p>
        <h1 className="text-xl font-semibold text-slate-800">
          {surgery.procedure}
        </h1>
        <p className="text-sm text-slate-500">
          <Link
            href={`/dashboard/patients/${surgery.patient.id}`}
            className="hover:underline"
          >
            {surgery.patient.firstName} {surgery.patient.lastName} ·{" "}
            {surgery.patient.hospitalNumber}
          </Link>
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-2 gap-4 text-sm">
        <Info label="Theatre" value={surgery.theatre ?? "—"} />
        <Info
          label="Scheduled For"
          value={new Date(surgery.scheduledAt).toLocaleString()}
        />
        <Info
          label="Surgeon"
          value={`Dr. ${surgery.surgeon.firstName} ${surgery.surgeon.lastName}`}
        />
        <Info
          label="Anesthetist"
          value={
            surgery.anesthetist
              ? `Dr. ${surgery.anesthetist.firstName} ${surgery.anesthetist.lastName}`
              : "—"
          }
        />
        {surgery.startedAt && (
          <Info
            label="Started"
            value={new Date(surgery.startedAt).toLocaleString()}
          />
        )}
        {surgery.endedAt && (
          <Info
            label="Ended"
            value={new Date(surgery.endedAt).toLocaleString()}
          />
        )}
        <div>
          <p className="text-xs text-slate-400 mb-1">Status</p>
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${surgeryStatusBadgeClass(surgery.status)}`}
          >
            {surgery.status.replace("_", " ")}
          </span>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">Payment Type</p>
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${paymentTypeBadgeClass(surgery.paymentType)}`}
          >
            {paymentTypeLabel(surgery.paymentType)}
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">
          Update Payment Type
        </h2>
        <form action={updatePaymentTypeWithId} className="flex items-end gap-2">
          <select
            name="paymentType"
            defaultValue={surgery.paymentType}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            {SURGERY_PAYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {paymentTypeLabel(t)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Update
          </button>
        </form>
        <p className="text-xs text-slate-400 mt-2">
          Change this if a pre-authorization is denied and the patient
          switches to paying cash, or vice versa.
        </p>
      </div>

      {surgery.notes && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">
            Pre-op Notes
          </h2>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">
            {surgery.notes}
          </p>
        </div>
      )}

      {!isResolved && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">
            Update Status
          </h2>
          <form action={updateStatusWithId} className="flex items-end gap-2">
            <select
              name="status"
              defaultValue={surgery.status}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              {manualStatuses.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-md"
            >
              Update
            </button>
          </form>
          <p className="text-xs text-slate-400 mt-2">
            Mark In Progress once the patient is in theatre. Recording an
            operative note below marks it Completed automatically.
          </p>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">
          Operative Note
        </h2>

        {surgery.status === "COMPLETED" && surgery.operativeNote ? (
          <div className="text-sm bg-slate-50 rounded-md px-3 py-2 space-y-1">
            <p className="text-slate-800 whitespace-pre-wrap">
              {surgery.operativeNote}
            </p>
            <p className="text-xs text-slate-400">
              Recorded{" "}
              {surgery.endedAt && new Date(surgery.endedAt).toLocaleString()}
            </p>
          </div>
        ) : isResolved ? (
          <p className="text-sm text-slate-400">
            This surgery was cancelled before an operative note was
            recorded.
          </p>
        ) : (
          <form action={recordNoteWithId} className="space-y-3">
            <textarea
              name="operativeNote"
              required
              rows={4}
              placeholder="Findings, procedure performed, complications, post-op instructions"
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
            >
              Save Note &amp; Complete
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-slate-700">{value}</p>
    </div>
  );
}
