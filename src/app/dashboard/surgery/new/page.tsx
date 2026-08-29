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
          <h1 className="page-title">
            Schedule Surgery
          </h1>
          <p className="text-muted">
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
            className="input"
          />
        </form>

        {q && (
          <div className="panel">
            {patients.length === 0 ? (
              <p className="px-4 py-8 text-center text-muted">
                No patients found.
              </p>
            ) : (
              <ul className="list">
                {patients.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/dashboard/surgery/new?patientId=${p.id}`}
                      className="row-link"
                    >
                      <span>
                        {p.firstName} {p.lastName}
                        <span className="text-muted"> · {p.hospitalNumber}</span>
                      </span>
                      <span className="text-muted">{p.phone ?? ""}</span>
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
        <p className="btn btn-ghost">Patient not found.</p>
        <Link
          href="/dashboard/surgery/new"
          className="btn btn-ghost"
        >
          ← Search again
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">
          Schedule Surgery
        </h1>
        <p className="text-muted">
          For{" "}
          <span className="font-medium text-[color:var(--color-text)]">
            {patient.firstName} {patient.lastName}
          </span>{" "}
          ({patient.hospitalNumber}).{" "}
          <Link href="/dashboard/surgery/new" className="btn btn-ghost">
            Change patient
          </Link>
        </p>
      </div>

      <form
        action={scheduleSurgery}
        className="card gap-4"
      >
        <input type="hidden" name="patientId" value={patient.id} />

        <div>
          <label className="form-label">
            Procedure
          </label>
          <input
            name="procedure"
            required
            placeholder="e.g. Appendectomy"
            className="input"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">
              Theatre
            </label>
            <input
              name="theatre"
              placeholder="e.g. Theatre 2"
              className="input"
            />
          </div>
          <div>
            <label className="form-label">
              Scheduled For
            </label>
            <input
              type="datetime-local"
              name="scheduledAt"
              required
              className="input"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">
              Surgeon
            </label>
            <select
              name="surgeonId"
              required
              defaultValue=""
              className="input"
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
            <label className="form-label">
              Anesthetist (optional)
            </label>
            <select
              name="anesthetistId"
              defaultValue=""
              className="input"
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
          <label className="form-label">
            Payment Type
          </label>
          <select
            name="paymentType"
            required
            defaultValue="CASH"
            className="input"
          >
            {SURGERY_PAYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {paymentTypeLabel(t)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">
            Pre-op Notes / Indication
          </label>
          <textarea
            name="notes"
            rows={2}
            placeholder="Reason for surgery, relevant history"
            className="input"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="btn btn-primary"
          >
            Schedule Surgery
          </button>
        </div>
      </form>
    </div>
  );
}
