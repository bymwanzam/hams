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
        <h1 className="text-xl font-semibold text-slate-800">Add Document</h1>
        <p className="text-sm text-slate-500">
          <Link href="/dashboard/documents" className="text-blue-600 hover:underline">
            ← Back to documents
          </Link>
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {!patientId && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">
            Link to a Patient (optional)
          </h2>
          <p className="text-xs text-slate-400">
            Search to attach this document to a patient&apos;s record, or
            leave it unlinked to upload it as an administrative document.
          </p>
          <form className="max-w-sm">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search by name, hospital no. or phone"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>
          {q && (
            <div className="border border-slate-200 rounded-md overflow-hidden">
              {patients.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">
                  No patients found.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {patients.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/dashboard/documents/new?patientId=${p.id}`}
                        className="flex items-center justify-between px-4 py-2 text-sm hover:bg-slate-50"
                      >
                        <span>
                          {p.firstName} {p.lastName}
                          <span className="text-slate-400"> · {p.hospitalNumber}</span>
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
        <p className="text-sm text-slate-500">
          Attaching to{" "}
          <span className="font-medium text-slate-700">
            {patient.firstName} {patient.lastName}
          </span>{" "}
          ({patient.hospitalNumber}).{" "}
          <Link href="/dashboard/documents/new" className="text-blue-600 hover:underline">
            Change / remove patient
          </Link>
        </p>
      )}

      {patientId && !patient && (
        <p className="text-sm text-red-600">
          Patient not found.{" "}
          <Link href="/dashboard/documents/new" className="text-blue-600 hover:underline">
            Search again
          </Link>
        </p>
      )}

      <form
        action={uploadDocument}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        {patientId && patient && (
          <input type="hidden" name="patientId" value={patientId} />
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Title
          </label>
          <input
            name="title"
            required
            placeholder="e.g. Signed consent form"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            File
          </label>
          <input
            type="file"
            name="file"
            required
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="w-full text-sm"
          />
          <p className="text-xs text-slate-400 mt-1">
            PDF, JPEG, PNG or WebP, up to 10MB.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Upload Document
          </button>
        </div>
      </form>
    </div>
  );
}
