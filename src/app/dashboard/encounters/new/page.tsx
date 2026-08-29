import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { searchPatients } from "../../patients/actions";
import { startEncounter } from "../actions";

export default async function NewEncounterPage({
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
            New Consultation
          </h1>
          <p className="text-muted">
            First, find the patient this consultation is for. Patients with a
            booked appointment should instead be called in from the{" "}
            <Link href="/dashboard/queue" className="btn btn-ghost">
              Patient Queue
            </Link>
            .
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
                      href={`/dashboard/encounters/new?patientId=${p.id}`}
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
          href="/dashboard/encounters/new"
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
          New Consultation
        </h1>
        <p className="text-muted">
          For{" "}
          <span className="font-medium text-[color:var(--color-text)]">
            {patient.firstName} {patient.lastName}
          </span>{" "}
          ({patient.hospitalNumber}).{" "}
          <Link
            href="/dashboard/encounters/new"
            className="btn btn-ghost"
          >
            Change patient
          </Link>
        </p>
      </div>

      <form
        action={startEncounter}
        className="card gap-4"
      >
        <input type="hidden" name="patientId" value={patient.id} />

        <div>
          <label className="form-label">
            Visit Type
          </label>
          <select
            name="type"
            required
            defaultValue="OPD"
            className="input"
          >
            <option value="OPD">OPD</option>
            <option value="TELEHEALTH">Tele-health</option>
            <option value="EMERGENCY">Emergency</option>
            <option value="FOLLOW_UP">Follow-up</option>
          </select>
        </div>

        <div>
          <label className="form-label">
            Chief Complaint
          </label>
          <textarea
            name="chiefComplaint"
            rows={2}
            placeholder="e.g. Fever and headache for 3 days"
            className="input"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="btn btn-primary"
          >
            Start Consultation
          </button>
        </div>
      </form>
    </div>
  );
}
