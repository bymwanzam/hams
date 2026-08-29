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
          <h1 className="text-xl font-semibold text-slate-800">
            New Consultation
          </h1>
          <p className="text-sm text-slate-500">
            First, find the patient this consultation is for. Patients with a
            booked appointment should instead be called in from the{" "}
            <Link href="/dashboard/queue" className="text-blue-600 hover:underline">
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
                      href={`/dashboard/encounters/new?patientId=${p.id}`}
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
        <Link
          href="/dashboard/encounters/new"
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
          New Consultation
        </h1>
        <p className="text-sm text-slate-500">
          For{" "}
          <span className="font-medium text-slate-700">
            {patient.firstName} {patient.lastName}
          </span>{" "}
          ({patient.hospitalNumber}).{" "}
          <Link
            href="/dashboard/encounters/new"
            className="text-blue-600 hover:underline"
          >
            Change patient
          </Link>
        </p>
      </div>

      <form
        action={startEncounter}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <input type="hidden" name="patientId" value={patient.id} />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Visit Type
          </label>
          <select
            name="type"
            required
            defaultValue="OPD"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="OPD">OPD</option>
            <option value="TELEHEALTH">Tele-health</option>
            <option value="EMERGENCY">Emergency</option>
            <option value="FOLLOW_UP">Follow-up</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Chief Complaint
          </label>
          <textarea
            name="chiefComplaint"
            rows={2}
            placeholder="e.g. Fever and headache for 3 days"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Start Consultation
          </button>
        </div>
      </form>
    </div>
  );
}
