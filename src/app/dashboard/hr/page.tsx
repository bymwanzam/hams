import Link from "next/link";
import { listEmployees, hasHrAccess } from "./actions";
import AccessRestricted from "./AccessRestricted";

export default async function HrPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!(await hasHrAccess())) {
    return <AccessRestricted />;
  }

  const { q } = await searchParams;
  const employees = await listEmployees(q ?? "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            HR &amp; Payroll
          </h1>
          <p className="text-sm text-slate-500">
            Staff records, payroll, biometric attendance.
          </p>
        </div>
        <Link
          href="/dashboard/hr/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + Add Staff Record
        </Link>
      </div>

      <form className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name, staff #, department"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Staff #</th>
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Department</th>
              <th className="text-left px-4 py-2">Position</th>
              <th className="text-left px-4 py-2">Hire Date</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No staff records yet.
                </td>
              </tr>
            )}
            {employees.map((emp) => (
              <tr key={emp.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link
                    href={`/dashboard/hr/${emp.id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {emp.staffNumber}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-700">
                  {emp.user.firstName} {emp.user.lastName}
                </td>
                <td className="px-4 py-2 text-slate-500">{emp.department}</td>
                <td className="px-4 py-2 text-slate-500">{emp.position}</td>
                <td className="px-4 py-2 text-slate-500">
                  {new Date(emp.hireDate).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
