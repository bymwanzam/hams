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
          <h1 className="page-title">OPD</h1>
          <p className="text-muted">
            Outpatients currently being seen — each case ends in going home
            or being admitted to a ward.
          </p>
        </div>
        <Link
          href="/dashboard/encounters/new"
          className="btn btn-primary"
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
          className="input"
        />
      </form>

      {/* Waiting to be called in */}
      <div>
        <h2 className="card-title mb-2">
          Waiting to be Called In
        </h2>
        <div className="panel">
          {waiting.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              No arrived patients waiting.
            </p>
          ) : (
            <ul className="list">
              {waiting.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-[600]">
                      {a.patient.firstName} {a.patient.lastName}
                      <span className="text-muted font-normal">
                        {" "}
                        · {a.patient.hospitalNumber}
                      </span>
                    </p>
                    <p className="eyebrow">
                      {serviceTypeLabel(a.serviceType)}
                      {a.serviceType === "SPECIALIST" &&
                        a.department &&
                        ` — ${a.department}`}
                    </p>
                  </div>
                  <form action={callInPatient.bind(null, a.id)}>
                    <button
                      type="submit"
                      className="btn btn-primary shrink-0"
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
        <h2 className="card-title mb-2">
          Active Consultations
        </h2>
        <div className="panel">
          {encounters.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">
              No active OPD cases. New cases arrive here from{" "}
              <Link
                href="/dashboard/queue"
                className="btn btn-ghost"
              >
                Patient Queue
              </Link>{" "}
              (call them in above) or via &quot;+ New Consultation&quot;.
            </p>
          ) : (
            <ul className="list">
              {encounters.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/dashboard/encounters/${e.id}`}
                    className="row-link"
                  >
                    <div className="min-w-0">
                      <p className="font-[600]">
                        {e.patient.firstName} {e.patient.lastName}
                        <span className="text-muted font-normal">
                          {" "}
                          · {e.patient.hospitalNumber}
                        </span>
                      </p>
                      <p className="eyebrow">
                        Started {new Date(e.startedAt).toLocaleString()}
                        {e.attendingProvider &&
                          ` · ${e.attendingProvider.firstName} ${e.attendingProvider.lastName}`}
                        {e.chiefComplaint && ` · ${e.chiefComplaint}`}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 ${encounterStatusBadgeClass(e.status)}`}
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

      <p className="eyebrow">
        Looking for a discharged or admitted case?{" "}
        <Link href="/dashboard/encounters" className="btn btn-ghost">
          Search all consultations
        </Link>
        .
      </p>
    </div>
  );
}
