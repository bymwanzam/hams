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
          <p className="eyebrow">
            <Link href="/dashboard/hr" className="hover:underline">
              ← HR &amp; Payroll
            </Link>
          </p>
          <h1 className="page-title">
            {employee.user.firstName} {employee.user.lastName}
          </h1>
          <p className="text-muted">
            {employee.position} · {employee.department}
          </p>
        </div>
        <Link
          href={`/dashboard/hr/${employee.id}/edit`}
          className="btn btn-ghost"
        >
          Edit
        </Link>
      </div>

      <div className="card grid grid-cols-2 gap-4">
        <div>
          <p className="eyebrow">Staff Number</p>
          <p className="text-[color:var(--color-text)]">{employee.staffNumber}</p>
        </div>
        <div>
          <p className="eyebrow">Email</p>
          <p className="text-[color:var(--color-text)]">{employee.user.email}</p>
        </div>
        <div>
          <p className="eyebrow">Monthly Salary</p>
          <p className="text-[color:var(--color-text)]">
            GHS {Number(employee.salary).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="eyebrow">Hire Date</p>
          <p className="text-[color:var(--color-text)]">
            {new Date(employee.hireDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="card gap-3">
        <div className="flex items-center justify-between">
          <h2 className="card-title">Attendance</h2>
          <form action={openRecord ? clockOutWithId : clockInWithId}>
            <button
              type="submit"
              className={
                openRecord
                  ? "btn btn-secondary"
                  : "btn btn-secondary"
              }
            >
              {openRecord ? "Clock Out" : "Clock In"}
            </button>
          </form>
        </div>
        {openRecord && (
          <p className="text-xs text-[color:var(--color-accent-700)]">
            Clocked in since {new Date(openRecord.clockIn).toLocaleString()}
          </p>
        )}

        {employee.attendance.length === 0 ? (
          <p className="text-muted">No attendance recorded yet.</p>
        ) : (
          <ul className="list text-sm">
            {employee.attendance.map((a) => (
              <li key={a.id} className="py-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="tag tag-neutral">
                    {attendanceMethodLabel(a.method)}
                  </span>
                  <span className="text-muted">
                    {new Date(a.clockIn).toLocaleString()}
                    {a.clockOut &&
                      ` → ${new Date(a.clockOut).toLocaleTimeString()}`}
                  </span>
                </span>
                <span className="text-muted text-xs">
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
