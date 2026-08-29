import Link from "next/link";
import {
  listUnits,
  getAvailableCountsByGroup,
  listBloodRequests,
  hasBloodBankAccess,
} from "./actions";
import {
  BLOOD_GROUPS,
  BLOOD_BANK_STATUSES,
  unitStatusLabel,
  unitStatusBadgeClass,
} from "./labels";
import AccessRestricted from "./AccessRestricted";

export default async function BloodBankPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  if (!(await hasBloodBankAccess())) {
    return <AccessRestricted />;
  }

  const { q, status } = await searchParams;
  const [units, availableCounts, pendingRequests] = await Promise.all([
    listUnits(q ?? "", status),
    getAvailableCountsByGroup(),
    listBloodRequests(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Blood Bank</h1>
          <p className="text-sm text-slate-500">
            Blood unit inventory and issuance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/blood-bank/requests"
            className="relative border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2 rounded-md"
          >
            Ward Requests
            {pendingRequests.length > 0 && (
              <span className="ml-2 inline-block bg-red-600 text-white text-xs font-semibold rounded-full px-1.5 py-0.5">
                {pendingRequests.length}
              </span>
            )}
          </Link>
          <Link
            href="/dashboard/blood-bank/new"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            + Add Unit
          </Link>
        </div>
      </div>

      {pendingRequests.some((r) => r.urgency === "EMERGENCY") && (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          There{"'"}s an EMERGENCY blood request awaiting a match —{" "}
          <Link href="/dashboard/blood-bank/requests" className="underline">
            view ward requests
          </Link>
          .
        </p>
      )}

      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">
          Available Stock by Group
        </h2>
        <div className="flex flex-wrap gap-2">
          {BLOOD_GROUPS.map((g) => {
            const count = availableCounts[g] ?? 0;
            return (
              <span
                key={g}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  count === 0
                    ? "bg-slate-100 text-slate-400"
                    : count <= 2
                      ? "bg-amber-50 text-amber-700"
                      : "bg-green-50 text-green-700"
                }`}
              >
                {g}: {count}
              </span>
            );
          })}
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-3">
        <div className="max-w-sm flex-1 min-w-[160px]">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by blood group"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {BLOOD_BANK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {unitStatusLabel(s)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="text-sm text-slate-600 hover:text-slate-900 border border-slate-300 rounded-md px-4 py-2"
        >
          Filter
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Blood Group</th>
              <th className="text-left px-4 py-2">Volume</th>
              <th className="text-left px-4 py-2">Collected</th>
              <th className="text-left px-4 py-2">Expires</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {units.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No blood units recorded yet.
                </td>
              </tr>
            )}
            {units.map((unit) => {
              const isExpired =
                new Date(unit.expiresAt) < new Date() &&
                (unit.status === "AVAILABLE" || unit.status === "RESERVED");
              return (
                <tr key={unit.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link
                      href={`/dashboard/blood-bank/${unit.id}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {unit.bloodGroup}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-500">{unit.volumeMl} mL</td>
                  <td className="px-4 py-2 text-slate-500">
                    {new Date(unit.collectedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {new Date(unit.expiresAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${unitStatusBadgeClass(unit.status)}`}
                    >
                      {unitStatusLabel(unit.status)}
                    </span>
                    {isExpired && (
                      <span className="ml-1 text-[10px] text-red-600 font-medium">
                        expired
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
