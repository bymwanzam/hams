import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  recordArrival,
  recordVitals,
  updateAppointmentStatus,
  updateAppointmentService,
} from "../actions";
import { serviceTypeLabel, statusBadgeClass } from "../labels";
import ServiceTypeFields from "../ServiceTypeFields";

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: true,
      vitalSigns: { orderBy: { recordedAt: "desc" } },
    },
  });

  if (!appointment) notFound();

  const recordArrivalWithId = recordArrival.bind(null, appointment.id);
  const updateAppointmentServiceWithId = updateAppointmentService.bind(
    null,
    appointment.id
  );
  // Reassigning department only makes sense before a doctor has actually
  // started seeing the patient.
  const canReassignService = ["SCHEDULED", "CONFIRMED", "ARRIVED"].includes(
    appointment.status
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400">
            <Link
              href={`/dashboard/patients/${appointment.patient.id}`}
              className="hover:underline"
            >
              {appointment.patient.hospitalNumber}
            </Link>
          </p>
          <h1 className="text-xl font-semibold text-slate-800">
            {appointment.patient.firstName} {appointment.patient.lastName}
          </h1>
          <p className="text-sm text-slate-500">
            {serviceTypeLabel(appointment.serviceType)}
            {appointment.serviceType === "SPECIALIST" &&
              appointment.department &&
              ` — ${appointment.department}`}
          </p>
        </div>
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(appointment.status)}`}
        >
          {appointment.status}
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-2 gap-4 text-sm">
        <Info
          label="Scheduled"
          value={new Date(appointment.scheduledAt).toLocaleString()}
        />
        <Info
          label="Time of Arrival"
          value={
            appointment.arrivedAt
              ? new Date(appointment.arrivedAt).toLocaleString()
              : "Not arrived yet"
          }
        />
        <Info label="Notes" value={appointment.notes ?? "—"} />
        <div>
          <p className="text-xs text-slate-400 mb-1">Update Status</p>
          <form action={updateAppointmentStatus} className="flex gap-2">
            <input type="hidden" name="appointmentId" value={appointment.id} />
            <select
              name="status"
              defaultValue={appointment.status}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            >
              {[
                "SCHEDULED",
                "CONFIRMED",
                "ARRIVED",
                "IN_PROGRESS",
                "COMPLETED",
                "NO_SHOW",
                "CANCELLED",
              ].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="text-sm text-blue-600 hover:underline"
            >
              Update
            </button>
          </form>
        </div>
      </div>

      {!appointment.arrivedAt && (
        <form action={recordArrivalWithId}>
          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Record Arrival Now
          </button>
        </form>
      )}

      {canReassignService && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <details>
            <summary className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
              Reassign Service / Department
            </summary>
            <p className="text-xs text-slate-400 mt-1 mb-3">
              Route this patient to a different queue — e.g. move them from
              General OPD to a Specialist clinic, or fix a mis-assigned
              department.
            </p>
            <form
              action={updateAppointmentServiceWithId}
              className="space-y-4"
            >
              <ServiceTypeFields
                defaultServiceType={appointment.serviceType}
                defaultDepartment={appointment.department ?? ""}
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
              >
                Save
              </button>
            </form>
          </details>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Vital Signs</h2>

        {appointment.vitalSigns.length === 0 ? (
          <p className="text-sm text-slate-400">No vitals recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left py-1 pr-4">Recorded</th>
                  <th className="text-left py-1 pr-4">Temp (°C)</th>
                  <th className="text-left py-1 pr-4">Pulse (bpm)</th>
                  <th className="text-left py-1 pr-4">Resp. Rate</th>
                  <th className="text-left py-1 pr-4">BP</th>
                  <th className="text-left py-1 pr-4">SpO2 (%)</th>
                  <th className="text-left py-1 pr-4">Weight (kg)</th>
                  <th className="text-left py-1 pr-4">Height (cm)</th>
                </tr>
              </thead>
              <tbody>
                {appointment.vitalSigns.map((v) => (
                  <tr key={v.id} className="border-t border-slate-100">
                    <td className="py-1 pr-4 text-slate-400">
                      {new Date(v.recordedAt).toLocaleString()}
                    </td>
                    <td className="py-1 pr-4">{v.temperatureC ?? "—"}</td>
                    <td className="py-1 pr-4">{v.pulseBpm ?? "—"}</td>
                    <td className="py-1 pr-4">{v.respirationRate ?? "—"}</td>
                    <td className="py-1 pr-4">
                      {v.bpSystolic && v.bpDiastolic
                        ? `${v.bpSystolic}/${v.bpDiastolic}`
                        : "—"}
                    </td>
                    <td className="py-1 pr-4">{v.spo2 ?? "—"}</td>
                    <td className="py-1 pr-4">{v.weightKg ?? "—"}</td>
                    <td className="py-1 pr-4">{v.heightCm ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <details className="pt-2">
          <summary className="text-sm text-blue-600 cursor-pointer select-none">
            + Record Vital Signs
          </summary>
          <form
            action={recordVitals}
            className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            <input type="hidden" name="appointmentId" value={appointment.id} />
            <input
              type="hidden"
              name="patientId"
              value={appointment.patient.id}
            />
            <VitalField label="Temp (°C)" name="temperatureC" step="0.1" />
            <VitalField label="Pulse (bpm)" name="pulseBpm" />
            <VitalField label="Resp. Rate" name="respirationRate" />
            <VitalField label="SpO2 (%)" name="spo2" />
            <VitalField label="BP Systolic" name="bpSystolic" />
            <VitalField label="BP Diastolic" name="bpDiastolic" />
            <VitalField label="Weight (kg)" name="weightKg" step="0.1" />
            <VitalField label="Height (cm)" name="heightCm" step="0.1" />

            <div className="col-span-2 sm:col-span-4 pt-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
              >
                Save Vitals
              </button>
            </div>
          </form>
        </details>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-slate-700">{value}</p>
    </div>
  );
}

function VitalField({
  label,
  name,
  step,
}: {
  label: string;
  name: string;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">
        {label}
      </label>
      <input
        type="number"
        step={step}
        name={name}
        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
