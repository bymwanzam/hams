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
          <h1 className="page-title">
            Emergency / Ambulatory
          </h1>
          <p className="text-muted">
            Emergency cases currently being seen — each case ends in going
            home or being admitted to a ward.
          </p>
        </div>
        <Link
          href="/dashboard/encounters/new"
          className="btn btn-primary"
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
          className="input"
        />
      </form>

      <div className="panel">
        {encounters.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            No active emergency cases. Start one from{" "}
            <Link
              href="/dashboard/encounters/new"
              className="btn btn-ghost"
            >
              New Consultation
            </Link>{" "}
            — pick a patient, then choose &quot;Emergency&quot; as the visit
            type.
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
