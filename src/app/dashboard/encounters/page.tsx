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
          <h1 className="text-xl font-semibold text-slate-800">
            Consultations
          </h1>
          <p className="text-sm text-slate-500">
            Clinic visits, tele-health, vitals &amp; diagnosis.
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

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Patient</th>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-left px-4 py-2">Provider</th>
              <th className="text-left px-4 py-2">Started</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {encounters.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No consultations found.
                </td>
              </tr>
            )}
            {encounters.map((e: EncounterRow) => (
              <tr
                key={e.id}
                className="border-t border-slate-100 hover:bg-slate-50"
              >
                <td className="px-4 py-2">
                  <Link
                    href={`/dashboard/encounters/${e.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {e.patient.firstName} {e.patient.lastName}
                  </Link>
                  <p className="text-xs text-slate-400">
                    {e.patient.hospitalNumber}
                  </p>
                </td>
                <td className="px-4 py-2">{encounterTypeLabel(e.type)}</td>
                <td className="px-4 py-2 text-slate-500">
                  {e.attendingProvider
                    ? `${e.attendingProvider.firstName} ${e.attendingProvider.lastName}`
                    : "—"}
                </td>
                <td className="px-4 py-2">
                  {new Date(e.startedAt).toLocaleString()}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${encounterStatusBadgeClass(e.status)}`}
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
