import Link from "next/link";
import { listActiveEmergencyEncounters } from "./actions";
import { encounterStatusBadgeClass } from "../encounters/labels";

export default async function EmergencyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const encounters = await listActiveEmergencyEncounters(q ?? "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Emergency / Ambulatory
          </h1>
          <p className="text-sm text-slate-500">
            Emergency cases currently being seen — each case ends in going
            home or being admitted to a ward.
          </p>
        </div>
        <Link
          href="/dashboard/encounters/new"
          className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + New Emergency Case
        </Link>
      </div>

      <form className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by patient name or hospital no."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {encounters.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-400">
            No active emergency cases. Start one from{" "}
            <Link
              href="/dashboard/encounters/new"
              className="text-blue-600 hover:underline"
            >
              New Consultation
            </Link>{" "}
            — pick a patient, then choose &quot;Emergency&quot; as the visit
            type.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {encounters.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/dashboard/encounters/${e.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">
                      {e.patient.firstName} {e.patient.lastName}
                      <span className="text-slate-400 font-normal">
                        {" "}
                        · {e.patient.hospitalNumber}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Started {new Date(e.startedAt).toLocaleString()}
                      {e.attendingProvider &&
                        ` · ${e.attendingProvider.firstName} ${e.attendingProvider.lastName}`}
                      {e.chiefComplaint && ` · ${e.chiefComplaint}`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${encounterStatusBadgeClass(e.status)}`}
                  >
                    {e.status.replace("_", " ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-slate-400">
        Looking for a discharged or admitted case?{" "}
        <Link href="/dashboard/encounters" className="text-blue-600 hover:underline">
          Search all consultations
        </Link>
        .
      </p>
    </div>
  );
}
