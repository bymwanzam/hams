import Link from "next/link";
import { listActiveOpdEncounters, listWaitingArrivals } from "./actions";
import { encounterStatusBadgeClass } from "../encounters/labels";
import { serviceTypeLabel } from "../appointments/labels";
import { callInPatient } from "../encounters/actions";

export default async function OpdPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [waiting, encounters] = await Promise.all([
    listWaitingArrivals(q ?? ""),
    listActiveOpdEncounters(q ?? ""),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">OPD</h1>
          <p className="text-sm text-slate-500">
            Outpatients currently being seen — each case ends in going home
            or being admitted to a ward.
          </p>
        </div>
        <Link
          href="/dashboard/encounters/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + New Consultation
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

      {/* Waiting to be called in */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">
          Waiting to be Called In
        </h2>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {waiting.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">
              No arrived patients waiting.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {waiting.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">
                      {a.patient.firstName} {a.patient.lastName}
                      <span className="text-slate-400 font-normal">
                        {" "}
                        · {a.patient.hospitalNumber}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {serviceTypeLabel(a.serviceType)}
                      {a.serviceType === "SPECIALIST" &&
                        a.department &&
                        ` — ${a.department}`}
                    </p>
                  </div>
                  <form action={callInPatient.bind(null, a.id)}>
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-1.5 rounded-md shrink-0"
                    >
                      Call In
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Active consultations */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">
          Active Consultations
        </h2>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {encounters.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-400">
              No active OPD cases. New cases arrive here from{" "}
              <Link
                href="/dashboard/queue"
                className="text-blue-600 hover:underline"
              >
                Patient Queue
              </Link>{" "}
              (call them in above) or via &quot;+ New Consultation&quot;.
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
