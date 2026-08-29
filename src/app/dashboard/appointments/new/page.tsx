import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { searchPatients } from "../../patients/actions";
import { createAppointment } from "../actions";
import ServiceTypeFields from "../ServiceTypeFields";

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string; q?: string; notes?: string }>;
}) {
  const { patientId, q, notes } = await searchParams;

  if (!patientId) {
    const patients = q ? await searchPatients(q) : [];

    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="page-title">
            Book Appointment
          </h1>
          <p className="text-muted">
            First, find the patient this appointment is for.
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
                No patients found.{" "}
                <Link
                  href="/dashboard/patients/new"
                  className="btn btn-ghost"
                >
                  Register a new patient
                </Link>
                .
              </p>
            ) : (
              <ul className="list">
                {patients.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/dashboard/appointments/new?patientId=${p.id}${
                        notes ? `&notes=${encodeURIComponent(notes)}` : ""
                      }`}
                      className="row-link"
                    >
                      <span>
                        {p.firstName} {p.lastName}
                        <span className="text-muted">
                          {" "}
                          · {p.hospitalNumber}
                        </span>
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

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });

  if (!patient) {
    return (
      <div className="max-w-2xl space-y-4">
        <p className="btn btn-ghost">Patient not found.</p>
        <Link
          href="/dashboard/appointments/new"
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
          Book Appointment
        </h1>
        <p className="text-muted">
          For{" "}
          <span className="font-medium text-[color:var(--color-text)]">
            {patient.firstName} {patient.lastName}
          </span>{" "}
          ({patient.hospitalNumber}).{" "}
          <Link
            href="/dashboard/appointments/new"
            className="btn btn-ghost"
          >
            Change patient
          </Link>
        </p>
      </div>

      <form
        action={createAppointment}
        className="card gap-4"
      >
        <input type="hidden" name="patientId" value={patient.id} />

        <ServiceTypeFields />

        <div>
          <label className="form-label">
            Scheduled Date & Time
          </label>
          <input
            type="datetime-local"
            name="scheduledAt"
            required
            className="input"
          />
        </div>

        <div>
          <label className="form-label">
            Notes
          </label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={notes}
            className="input"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="btn btn-primary"
          >
            Save Appointment
          </button>
        </div>
      </form>
    </div>
  );
}
