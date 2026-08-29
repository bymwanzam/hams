import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmployee, clockIn, clockOut, hasHrAccess } from "../actions";
import { attendanceMethodLabel } from "../labels";
import AccessRestricted from "../AccessRestricted";

function formatDuration(clockIn: Date, clockOut: Date | null): string {
  const end = clockOut ?? new Date();
  const minutes = Math.max(0, Math.round((end.getTime() - clockIn.getTime()) / 60000));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await hasHrAccess())) {
    return <AccessRestricted />;
  }

  const { id } = await params;
  const employee = await getEmployee(id);
  if (!employee) notFound();

  const clockInWithId = clockIn.bind(null, employee.id);
  const clockOutWithId = clockOut.bind(null, employee.id);
  const openRecord = employee.attendance.find((a) => a.clockOut === null);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400">
            <Link href="/dashboard/hr" className="hover:underline">
              ← HR &amp; Payroll
            </Link>
          </p>
          <h1 className="text-xl font-semibold text-slate-800">
            {employee.user.firstName} {employee.user.lastName}
          </h1>
          <p className="text-sm text-slate-500">
            {employee.position} · {employee.department}
          </p>
        </div>
        <Link
          href={`/dashboard/hr/${employee.id}/edit`}
          className="text-sm text-blue-600 hover:underline"
        >
          Edit
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-slate-400">Staff Number</p>
          <p className="text-slate-700">{employee.staffNumber}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Email</p>
          <p className="text-slate-700">{employee.user.email}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Monthly Salary</p>
          <p className="text-slate-700">
            GHS {Number(employee.salary).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Hire Date</p>
          <p className="text-slate-700">
            {new Date(employee.hireDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Attendance</h2>
          <form action={openRecord ? clockOutWithId : clockInWithId}>
            <button
              type="submit"
              className={
                openRecord
                  ? "bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-md"
                  : "bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-md"
              }
            >
              {openRecord ? "Clock Out" : "Clock In"}
            </button>
          </form>
        </div>
        {openRecord && (
          <p className="text-xs text-amber-600">
            Clocked in since {new Date(openRecord.clockIn).toLocaleString()}
          </p>
        )}

        {employee.attendance.length === 0 ? (
          <p className="text-sm text-slate-400">No attendance recorded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {employee.attendance.map((a) => (
              <li key={a.id} className="py-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    {attendanceMethodLabel(a.method)}
                  </span>
                  <span className="text-slate-600">
                    {new Date(a.clockIn).toLocaleString()}
                    {a.clockOut &&
                      ` → ${new Date(a.clockOut).toLocaleTimeString()}`}
                  </span>
                </span>
                <span className="text-slate-400 text-xs">
                  {formatDuration(a.clockIn, a.clockOut)}
                  {!a.clockOut && " (ongoing)"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
