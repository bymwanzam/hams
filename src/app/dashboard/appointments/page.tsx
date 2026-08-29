import Link from "next/link";
import { searchAppointments } from "./actions";
import { serviceTypeLabel, statusBadgeClass } from "./labels";

type AppointmentRow = Awaited<ReturnType<typeof searchAppointments>>[number];

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const appointments = await searchAppointments(q ?? "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Appointments
          </h1>
          <p className="text-muted">
            Schedule and manage patient appointments.
          </p>
        </div>
        <Link
          href="/dashboard/appointments/new"
          className="btn btn-primary"
        >
          + Book Appointment
        </Link>
      </div>

      <form className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by patient, hospital no. or department"
          className="input"
        />
      </form>

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Service</th>
              <th>Scheduled</th>
              <th>Arrived</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted">
                  No appointments found.
                </td>
              </tr>
            )}
            {appointments.map((a: AppointmentRow) => (
              <tr
                key={a.id}
               
              >
                <td className="px-4 py-2">
                  <Link
                    href={`/dashboard/appointments/${a.id}`}
                    className="btn btn-ghost"
                  >
                    {a.patient.firstName} {a.patient.lastName}
                  </Link>
                  <p className="eyebrow">
                    {a.patient.hospitalNumber}
                  </p>
                </td>
                <td className="px-4 py-2">
                  {serviceTypeLabel(a.serviceType)}
                  {a.serviceType === "SPECIALIST" && a.department && (
                    <p className="eyebrow">{a.department}</p>
                  )}
                </td>
                <td className="px-4 py-2">
                  {new Date(a.scheduledAt).toLocaleString()}
                </td>
                <td className="px-4 py-2">
                  {a.arrivedAt
                    ? new Date(a.arrivedAt).toLocaleTimeString()
                    : "—"}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`${statusBadgeClass(a.status)}`}
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
  );
}
