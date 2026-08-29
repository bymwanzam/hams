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
          <h1 className="text-xl font-semibold text-slate-800">
            Appointments
          </h1>
          <p className="text-sm text-slate-500">
            Schedule and manage patient appointments.
          </p>
        </div>
        <Link
          href="/dashboard/appointments/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
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
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Patient</th>
              <th className="text-left px-4 py-2">Service</th>
              <th className="text-left px-4 py-2">Scheduled</th>
              <th className="text-left px-4 py-2">Arrived</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No appointments found.
                </td>
              </tr>
            )}
            {appointments.map((a: AppointmentRow) => (
              <tr
                key={a.id}
                className="border-t border-slate-100 hover:bg-slate-50"
              >
                <td className="px-4 py-2">
                  <Link
                    href={`/dashboard/appointments/${a.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {a.patient.firstName} {a.patient.lastName}
                  </Link>
                  <p className="text-xs text-slate-400">
                    {a.patient.hospitalNumber}
                  </p>
                </td>
                <td className="px-4 py-2">
                  {serviceTypeLabel(a.serviceType)}
                  {a.serviceType === "SPECIALIST" && a.department && (
                    <p className="text-xs text-slate-400">{a.department}</p>
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
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(a.status)}`}
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
