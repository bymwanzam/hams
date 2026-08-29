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
          <h1 className="text-xl font-semibold text-slate-800">
            Wards &amp; Admissions
          </h1>
          <p className="text-sm text-slate-500">
            {freeBeds} of {totalBeds} beds free across {wards.length} ward
            {wards.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Link
          href="/dashboard/wards/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + Admit Patient
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {/* Ward / bed map */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Wards</h2>
          <details className="text-sm">
            <summary className="text-blue-600 hover:underline cursor-pointer select-none">
              + Add Ward / Bed
            </summary>
            <div className="mt-3 space-y-4 max-w-sm">
              <form action={createWard} className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    New Ward Name
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Male Medical Ward"
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-md"
                >
                  Add Ward
                </button>
              </form>

              {wards.length > 0 && (
                <form action={addBed} className="flex items-end gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Ward
                    </label>
                    <select
                      name="wardId"
                      required
                      className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    >
                      {wards.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      New Bed Label
                    </label>
                    <input
                      name="label"
                      required
                      placeholder="e.g. B4"
                      className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-md"
                  >
                    Add Bed
                  </button>
                </form>
              )}
            </div>
          </details>
        </div>

        {wards.length === 0 ? (
          <p className="text-sm text-slate-400">
            No wards set up yet. Use &quot;+ Add Ward / Bed&quot; above to get
            started.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wards.map((w) => (
              <div key={w.id} className="border border-slate-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-slate-700 mb-2">
                  {w.name}
                </p>
                {w.beds.length === 0 ? (
                  <p className="text-xs text-slate-400">No beds yet.</p>
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
                          className={`w-9 h-9 rounded-md flex items-center justify-center text-[10px] font-medium ${
                            admission
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-slate-100 text-slate-400"
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
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Patient</th>
                <th className="text-left px-4 py-2">Ward / Bed</th>
                <th className="text-left px-4 py-2">Admitted</th>
                <th className="text-left px-4 py-2">Days</th>
                <th className="text-left px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {admissions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No patients currently admitted.
                  </td>
                </tr>
              )}
              {admissions.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link
                      href={`/dashboard/wards/${a.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {a.patient.firstName} {a.patient.lastName}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {a.patient.hospitalNumber}
                    </p>
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {a.bed.ward.name}, Bed {a.bed.label}
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {new Date(a.admittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {daysAdmitted(a.admittedAt)}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${admissionStatusBadgeClass(a.status)}`}
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
