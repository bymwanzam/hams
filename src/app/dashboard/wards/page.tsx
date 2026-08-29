import Link from "next/link";
import { listWards, searchActiveAdmissions, createWard, addBed } from "./actions";
import { admissionStatusBadgeClass, daysAdmitted } from "./labels";

export default async function WardsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string }>;
}) {
  const { q, error } = await searchParams;
  const [wards, admissions] = await Promise.all([
    listWards(),
    searchActiveAdmissions(q ?? ""),
  ]);

  const totalBeds = wards.reduce((sum, w) => sum + w.beds.length, 0);
  const freeBeds = wards.reduce(
    (sum, w) => sum + w.beds.filter((b) => b.admissions.length === 0).length,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Wards &amp; Admissions
          </h1>
          <p className="text-muted">
            {freeBeds} of {totalBeds} beds free across {wards.length} ward
            {wards.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Link
          href="/dashboard/wards/new"
          className="btn btn-primary"
        >
          + Admit Patient
        </Link>
      </div>

      {error && (
        <p className="callout callout-danger">
          {error}
        </p>
      )}

      {/* Ward / bed map */}
      <div className="card gap-4">
        <div className="flex items-center justify-between">
          <h2 className="card-title">Wards</h2>
          <details className="text-sm">
            <summary className="btn btn-ghost cursor-pointer select-none">
              + Add Ward / Bed
            </summary>
            <div className="mt-3 space-y-4 max-w-sm">
              <form action={createWard} className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="form-label">
                    New Ward Name
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Male Medical Ward"
                    className="input input-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-secondary"
                >
                  Add Ward
                </button>
              </form>

              {wards.length > 0 && (
                <form action={addBed} className="flex items-end gap-2">
                  <div>
                    <label className="form-label">
                      Ward
                    </label>
                    <select
                      name="wardId"
                      required
                      className="input input-sm"
                    >
                      {wards.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="form-label">
                      New Bed Label
                    </label>
                    <input
                      name="label"
                      required
                      placeholder="e.g. B4"
                      className="input input-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-secondary"
                  >
                    Add Bed
                  </button>
                </form>
              )}
            </div>
          </details>
        </div>

        {wards.length === 0 ? (
          <p className="text-muted">
            No wards set up yet. Use &quot;+ Add Ward / Bed&quot; above to get
            started.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wards.map((w) => (
              <div key={w.id} className="panel p-3">
                <p className="card-title mb-2">
                  {w.name}
                </p>
                {w.beds.length === 0 ? (
                  <p className="eyebrow">No beds yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {w.beds.map((b) => {
                      const admission = b.admissions[0];
                      return (
                        <div
                          key={b.id}
                          title={
                            admission
                              ? `${admission.patient.firstName} ${admission.patient.lastName}`
                              : "Free"
                          }
                          className={`flex h-9 w-9 items-center justify-center text-[10px] font-medium ${
                            admission ? "tag tag-info" : "tag tag-neutral"
                          }`}
                        >
                          {b.label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active admissions */}
      <div>
        <form className="max-w-sm mb-3">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search admitted patients"
            className="input"
          />
        </form>

        <div className="panel">
          <table className="table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Ward / Bed</th>
                <th>Admitted</th>
                <th>Days</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {admissions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted">
                    No patients currently admitted.
                  </td>
                </tr>
              )}
              {admissions.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2">
                    <Link
                      href={`/dashboard/wards/${a.id}`}
                      className="btn btn-ghost"
                    >
                      {a.patient.firstName} {a.patient.lastName}
                    </Link>
                    <p className="eyebrow">
                      {a.patient.hospitalNumber}
                    </p>
                  </td>
                  <td className="px-4 py-2 text-muted">
                    {a.bed.ward.name}, Bed {a.bed.label}
                  </td>
                  <td className="px-4 py-2 text-muted">
                    {new Date(a.admittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-muted">
                    {daysAdmitted(a.admittedAt)}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`${admissionStatusBadgeClass(a.status)}`}
                    >
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
