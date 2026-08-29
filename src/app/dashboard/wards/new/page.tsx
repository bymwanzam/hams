import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { searchPatients } from "../../patients/actions";
import { admitPatient } from "../actions";

export default async function AdmitPatientPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string; q?: string; error?: string }>;
}) {
  const { patientId, q, error } = await searchParams;

  if (!patientId) {
    const patients = q ? await searchPatients(q) : [];

    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="page-title">
            Admit Patient
          </h1>
          <p className="text-muted">
            First, find the patient being admitted.
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
                      href={`/dashboard/wards/new?patientId=${p.id}`}
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
        <Link href="/dashboard/wards/new" className="btn btn-ghost">
          ← Search again
        </Link>
      </div>
    );
  }

  const wards = await prisma.ward.findMany({
    include: {
      beds: { where: { isOccupied: false }, orderBy: { label: "asc" } },
    },
    orderBy: { name: "asc" },
  });
  const freeBeds = wards.filter((w) => w.beds.length > 0);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">Admit Patient</h1>
        <p className="text-muted">
          For{" "}
          <span className="font-medium text-[color:var(--color-text)]">
            {patient.firstName} {patient.lastName}
          </span>{" "}
          ({patient.hospitalNumber}).{" "}
          <Link href="/dashboard/wards/new" className="btn btn-ghost">
            Change patient
          </Link>
        </p>
      </div>

      {error && (
        <p className="callout callout-danger">
          {error}
        </p>
      )}

      {freeBeds.length === 0 ? (
        <p className="text-muted card">
          No free beds right now.{" "}
          <Link href="/dashboard/wards" className="btn btn-ghost">
            Set up a ward or bed
          </Link>{" "}
          first.
        </p>
      ) : (
        <form
          action={admitPatient}
          className="card gap-4"
        >
          <input type="hidden" name="patientId" value={patient.id} />

          <div>
            <label className="form-label">
              Bed
            </label>
            <select
              name="bedId"
              required
              defaultValue=""
              className="input"
            >
              <option value="" disabled>
                Select a free bed…
              </option>
              {freeBeds.map((w) => (
                <optgroup key={w.id} label={w.name}>
                  {w.beds.map((b) => (
                    <option key={b.id} value={b.id}>
                      {w.name}, Bed {b.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">
              Admission Notes
            </label>
            <textarea
              name="admissionNotes"
              rows={3}
              placeholder="Reason for admission, presenting condition, etc."
              className="input"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="btn btn-primary"
            >
              Admit Patient
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
