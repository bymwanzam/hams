import Link from "next/link";
import { searchPatients } from "./actions";

type PatientRow = Awaited<ReturnType<typeof searchPatients>>[number];

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const patients = await searchPatients(q ?? "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Patient Registration
          </h1>
          <p className="text-sm text-slate-500">
            Front desk / OPD / IPD registration.
          </p>
        </div>
        <Link
          href="/dashboard/patients/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + Register Patient
        </Link>
      </div>

      <form className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name, hospital no. or phone"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Hospital No.</th>
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Gender</th>
              <th className="text-left px-4 py-2">Phone</th>
              <th className="text-left px-4 py-2">Registered</th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No patients found.
                </td>
              </tr>
            )}
            {patients.map((p: PatientRow) => (
              <tr
                key={p.id}
                className="border-t border-slate-100 hover:bg-slate-50"
              >
                <td className="px-4 py-2">
                  <Link
                    href={`/dashboard/patients/${p.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {p.hospitalNumber}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    {p.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photoUrl}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-[10px] font-medium">
                        {p.firstName[0]}
                        {p.lastName[0]}
                      </div>
                    )}
                    {p.firstName} {p.lastName}
                  </div>
                </td>
                <td className="px-4 py-2">{p.gender}</td>
                <td className="px-4 py-2">{p.phone ?? "—"}</td>
                <td className="px-4 py-2">
                  {new Date(p.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
