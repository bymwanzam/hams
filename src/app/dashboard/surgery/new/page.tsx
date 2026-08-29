import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { searchPatients } from "../../patients/actions";
import { scheduleSurgery, listSurgeons } from "../actions";
import { SURGERY_PAYMENT_TYPES, paymentTypeLabel } from "../labels";

export default async function NewSurgeryPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string; q?: string }>;
}) {
  const { patientId, q } = await searchParams;

  if (!patientId) {
    const patients = q ? await searchPatients(q) : [];

    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Schedule Surgery
          </h1>
          <p className="text-sm text-slate-500">
            First, find the patient this surgery is for.
          </p>
        </div>

        <form className="max-w-sm">
          <input
            type="text"
            name="q"
            defaultValue={q}
            autoFocus
            placeholder="Search by name, hospital no. or phone"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        {q && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {patients.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">
                No patients found.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {patients.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/dashboard/surgery/new?patientId=${p.id}`}
                      className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50"
                    >
                      <span>
                        {p.firstName} {p.lastName}
                        <span className="text-slate-400"> · {p.hospitalNumber}</span>
                      </span>
                      <span className="text-slate-400">{p.phone ?? ""}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }

  const [patient, surgeons] = await Promise.all([
    prisma.patient.findUnique({ where: { id: patientId } }),
    listSurgeons(),
  ]);

  if (!patient) {
    return (
      <div className="max-w-2xl space-y-4">
        <p className="text-sm text-red-600">Patient not found.</p>
        <Link
          href="/dashboard/surgery/new"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Search again
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">
          Schedule Surgery
        </h1>
        <p className="text-sm text-slate-500">
          For{" "}
          <span className="font-medium text-slate-700">
            {patient.firstName} {patient.lastName}
          </span>{" "}
          ({patient.hospitalNumber}).{" "}
          <Link href="/dashboard/surgery/new" className="text-blue-600 hover:underline">
            Change patient
          </Link>
        </p>
      </div>

      <form
        action={scheduleSurgery}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <input type="hidden" name="patientId" value={patient.id} />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Procedure
          </label>
          <input
            name="procedure"
            required
            placeholder="e.g. Appendectomy"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Theatre
            </label>
            <input
              name="theatre"
              placeholder="e.g. Theatre 2"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Scheduled For
            </label>
            <input
              type="datetime-local"
              name="scheduledAt"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Surgeon
            </label>
            <select
              name="surgeonId"
              required
              defaultValue=""
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Select…
              </option>
              {surgeons.map((s) => (
                <option key={s.id} value={s.id}>
                  Dr. {s.firstName} {s.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Anesthetist (optional)
            </label>
            <select
              name="anesthetistId"
              defaultValue=""
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">— None —</option>
              {surgeons.map((s) => (
                <option key={s.id} value={s.id}>
                  Dr. {s.firstName} {s.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Payment Type
          </label>
          <select
            name="paymentType"
            required
            defaultValue="CASH"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {SURGERY_PAYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {paymentTypeLabel(t)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Pre-op Notes / Indication
          </label>
          <textarea
            name="notes"
            rows={2}
            placeholder="Reason for surgery, relevant history"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Schedule Surgery
          </button>
        </div>
      </form>
    </div>
  );
}
