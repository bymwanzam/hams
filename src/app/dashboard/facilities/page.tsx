import Link from "next/link";
import { listFacilities, deleteFacility } from "./actions";
import DeleteFacilityButton from "./DeleteFacilityButton";

export default async function FacilitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const facilities = await listFacilities();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Hospital Setup
          </h1>
          <p className="text-sm text-slate-500">
            Configure the hospital(s) this system runs for. The main hospital
            names the whole system on the sidebar, login page and ID cards.
          </p>
        </div>
        <Link
          href="/dashboard/facilities/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + Add Hospital / Branch
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {facilities.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-8 text-center text-sm text-slate-400">
          No hospital configured yet.{" "}
          <Link
            href="/dashboard/facilities/new"
            className="text-blue-600 hover:underline"
          >
            Set up your hospital
          </Link>
          .
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Code</th>
                <th className="text-left px-4 py-2">Address</th>
                <th className="text-left px-4 py-2">Phone</th>
                <th className="text-left px-4 py-2">Staff</th>
                <th className="text-left px-4 py-2">Patients</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {facilities.map((f) => (
                <tr
                  key={f.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      {f.name}
                      {f.isMain && (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">
                          Main
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-slate-500">{f.code}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {f.address ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {f.phone ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {f._count.users}
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {f._count.patients}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/dashboard/facilities/${f.id}/edit`}
                        className="text-sm text-slate-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <DeleteFacilityButton
                        action={deleteFacility.bind(null, f.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
