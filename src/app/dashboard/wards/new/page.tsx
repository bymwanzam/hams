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
          <h1 className="text-xl font-semibold text-slate-800">
            Admit Patient
          </h1>
          <p className="text-sm text-slate-500">
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
                      href={`/dashboard/wards/new?patientId=${p.id}`}
                      className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50"
                    >
                      <span>
                        {p.firstName} {p.lastName}
                        <span className="text-slate-400">
                          {" "}
                          · {p.hospitalNumber}
                        </span>
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

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });

  if (!patient) {
    return (
      <div className="max-w-2xl space-y-4">
        <p className="text-sm text-red-600">Patient not found.</p>
        <Link href="/dashboard/wards/new" className="text-sm text-blue-600 hover:underline">
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
        <h1 className="text-xl font-semibold text-slate-800">Admit Patient</h1>
        <p className="text-sm text-slate-500">
          For{" "}
          <span className="font-medium text-slate-700">
            {patient.firstName} {patient.lastName}
          </span>{" "}
          ({patient.hospitalNumber}).{" "}
          <Link href="/dashboard/wards/new" className="text-blue-600 hover:underline">
            Change patient
          </Link>
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {freeBeds.length === 0 ? (
        <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-6">
          No free beds right now.{" "}
          <Link href="/dashboard/wards" className="text-blue-600 hover:underline">
            Set up a ward or bed
          </Link>{" "}
          first.
        </p>
      ) : (
        <form
          action={admitPatient}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          <input type="hidden" name="patientId" value={patient.id} />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Bed
            </label>
            <select
              name="bedId"
              required
              defaultValue=""
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Admission Notes
            </label>
            <textarea
              name="admissionNotes"
              rows={3}
              placeholder="Reason for admission, presenting condition, etc."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
            >
              Admit Patient
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
