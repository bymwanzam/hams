import Link from "next/link";
import { searchEncounters } from "./actions";
import { encounterTypeLabel, encounterStatusBadgeClass } from "./labels";

type EncounterRow = Awaited<ReturnType<typeof searchEncounters>>[number];

export default async function EncountersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const encounters = await searchEncounters(q ?? "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Consultations
          </h1>
          <p className="text-muted">
            Clinic visits, tele-health, vitals &amp; diagnosis.
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

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Type</th>
              <th>Provider</th>
              <th>Started</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {encounters.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted">
                  No consultations found.
                </td>
              </tr>
            )}
            {encounters.map((e: EncounterRow) => (
              <tr
                key={e.id}
               
              >
                <td className="px-4 py-2">
                  <Link
                    href={`/dashboard/encounters/${e.id}`}
                    className="btn btn-ghost"
                  >
                    {e.patient.firstName} {e.patient.lastName}
                  </Link>
                  <p className="eyebrow">
                    {e.patient.hospitalNumber}
                  </p>
                </td>
                <td className="px-4 py-2">{encounterTypeLabel(e.type)}</td>
                <td className="px-4 py-2 text-muted">
                  {e.attendingProvider
                    ? `${e.attendingProvider.firstName} ${e.attendingProvider.lastName}`
                    : "—"}
                </td>
                <td className="px-4 py-2">
                  {new Date(e.startedAt).toLocaleString()}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`${encounterStatusBadgeClass(e.status)}`}
                  >
                    {e.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
