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
          <h1 className="page-title">
            HR &amp; Payroll
          </h1>
          <p className="text-muted">
            Staff records, payroll, biometric attendance.
          </p>
        </div>
        <Link
          href="/dashboard/hr/new"
          className="btn btn-primary"
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
          className="input"
        />
      </form>

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Staff #</th>
              <th>Name</th>
              <th>Department</th>
              <th>Position</th>
              <th>Hire Date</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted">
                  No staff records yet.
                </td>
              </tr>
            )}
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td className="px-4 py-2">
                  <Link
                    href={`/dashboard/hr/${emp.id}`}
                    className="btn btn-ghost font-medium"
                  >
                    {emp.staffNumber}
                  </Link>
                </td>
                <td className="px-4 py-2 text-[color:var(--color-text)]">
                  {emp.user.firstName} {emp.user.lastName}
                </td>
                <td className="px-4 py-2 text-muted">{emp.department}</td>
                <td className="px-4 py-2 text-muted">{emp.position}</td>
                <td className="px-4 py-2 text-muted">
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
