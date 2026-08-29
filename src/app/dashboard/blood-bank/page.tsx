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
          <h1 className="page-title">Blood Bank</h1>
          <p className="text-muted">
            Blood unit inventory and issuance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/blood-bank/requests"
            className="relative btn btn-secondary"
          >
            Ward Requests
            {pendingRequests.length > 0 && (
              <span className="tag tag-alert ml-2">{pendingRequests.length}</span>
            )}
          </Link>
          <Link
            href="/dashboard/blood-bank/new"
            className="btn btn-primary"
          >
            + Add Unit
          </Link>
        </div>
      </div>

      {pendingRequests.some((r) => r.urgency === "EMERGENCY") && (
        <p className="callout callout-danger">
          There{"'"}s an EMERGENCY blood request awaiting a match —{" "}
          <Link href="/dashboard/blood-bank/requests" className="underline">
            view ward requests
          </Link>
          .
        </p>
      )}

      <div>
        <h2 className="card-title mb-2">
          Available Stock by Group
        </h2>
        <div className="flex flex-wrap gap-2">
          {BLOOD_GROUPS.map((g) => {
            const count = availableCounts[g] ?? 0;
            return (
              <span
                key={g}
                className={`text-sm ${
                  count === 0
                    ? "tag tag-neutral"
                    : count <= 2
                      ? "tag tag-info"
                      : "tag tag-success"
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
            className="input"
          />
        </div>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="input"
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
          className="btn btn-secondary"
        >
          Filter
        </button>
      </form>

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Blood Group</th>
              <th>Volume</th>
              <th>Collected</th>
              <th>Expires</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {units.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted">
                  No blood units recorded yet.
                </td>
              </tr>
            )}
            {units.map((unit) => {
              const isExpired =
                new Date(unit.expiresAt) < new Date() &&
                (unit.status === "AVAILABLE" || unit.status === "RESERVED");
              return (
                <tr key={unit.id}>
                  <td className="px-4 py-2">
                    <Link
                      href={`/dashboard/blood-bank/${unit.id}`}
                      className="btn btn-ghost font-medium"
                    >
                      {unit.bloodGroup}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-muted">{unit.volumeMl} mL</td>
                  <td className="px-4 py-2 text-muted">
                    {new Date(unit.collectedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-muted">
                    {new Date(unit.expiresAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`${unitStatusBadgeClass(unit.status)}`}
                    >
                      {unitStatusLabel(unit.status)}
                    </span>
                    {isExpired && (
                      <span className="ml-1 text-[10px] text-[color:var(--color-accent-700)] font-[600]">
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
