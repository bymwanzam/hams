import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { searchPatients } from "../../patients/actions";
import { uploadDocument } from "../actions";

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string; q?: string; error?: string }>;
}) {
  const { patientId, q, error } = await searchParams;

  const patient = patientId
    ? await prisma.patient.findUnique({ where: { id: patientId } })
    : null;
  const patients = !patientId && q ? await searchPatients(q) : [];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">Add Document</h1>
        <p className="text-muted">
          <Link href="/dashboard/documents" className="btn btn-ghost">
            ← Back to documents
          </Link>
        </p>
      </div>

      {error && (
        <p className="callout callout-danger">
          {error}
        </p>
      )}

      {!patientId && (
        <div className="card gap-3">
          <h2 className="card-title">
            Link to a Patient (optional)
          </h2>
          <p className="eyebrow">
            Search to attach this document to a patient&apos;s record, or
            leave it unlinked to upload it as an administrative document.
          </p>
          <form className="max-w-sm">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search by name, hospital no. or phone"
              className="input"
            />
          </form>
          {q && (
            <div className="panel overflow-hidden">
              {patients.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">
                  No patients found.
                </p>
              ) : (
                <ul className="list">
                  {patients.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/dashboard/documents/new?patientId=${p.id}`}
                        className="row-link"
                      >
                        <span>
                          {p.firstName} {p.lastName}
                          <span className="text-muted"> · {p.hospitalNumber}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {patientId && patient && (
        <p className="text-muted">
          Attaching to{" "}
          <span className="font-medium text-[color:var(--color-text)]">
            {patient.firstName} {patient.lastName}
          </span>{" "}
          ({patient.hospitalNumber}).{" "}
          <Link href="/dashboard/documents/new" className="btn btn-ghost">
            Change / remove patient
          </Link>
        </p>
      )}

      {patientId && !patient && (
        <p className="btn btn-ghost">
          Patient not found.{" "}
          <Link href="/dashboard/documents/new" className="btn btn-ghost">
            Search again
          </Link>
        </p>
      )}

      <form
        action={uploadDocument}
        className="card gap-4"
      >
        {patientId && patient && (
          <input type="hidden" name="patientId" value={patientId} />
        )}

        <div>
          <label className="form-label">
            Title
          </label>
          <input
            name="title"
            required
            placeholder="e.g. Signed consent form"
            className="input"
          />
        </div>

        <div>
          <label className="form-label">
            File
          </label>
          <input
            type="file"
            name="file"
            required
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="w-full text-sm"
          />
          <p className="eyebrow mt-1">
            PDF, JPEG, PNG or WebP, up to 10MB.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="btn btn-primary"
          >
            Upload Document
          </button>
        </div>
      </form>
    </div>
  );
}
