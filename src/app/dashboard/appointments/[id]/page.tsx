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
          <p className="eyebrow">
            <Link
              href={`/dashboard/patients/${appointment.patient.id}`}
              className="hover:underline"
            >
              {appointment.patient.hospitalNumber}
            </Link>
          </p>
          <h1 className="page-title">
            {appointment.patient.firstName} {appointment.patient.lastName}
          </h1>
          <p className="text-muted">
            {serviceTypeLabel(appointment.serviceType)}
            {appointment.serviceType === "SPECIALIST" &&
              appointment.department &&
              ` — ${appointment.department}`}
          </p>
        </div>
        <span
          className={`${statusBadgeClass(appointment.status)}`}
        >
          {appointment.status}
        </span>
      </div>

      <div className="card grid grid-cols-2 gap-4">
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
          <p className="eyebrow mb-1">Update Status</p>
          <form action={updateAppointmentStatus} className="flex gap-2">
            <input type="hidden" name="appointmentId" value={appointment.id} />
            <select
              name="status"
              defaultValue={appointment.status}
              className="input input-sm"
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
              className="btn btn-ghost"
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
            className="btn btn-secondary"
          >
            Record Arrival Now
          </button>
        </form>
      )}

      {canReassignService && (
        <div className="card">
          <details>
            <summary className="card-title cursor-pointer select-none">
              Reassign Service / Department
            </summary>
            <p className="eyebrow mt-1 mb-3">
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
                className="btn btn-primary"
              >
                Save
              </button>
            </form>
          </details>
        </div>
      )}

      <div className="card gap-4">
        <h2 className="card-title">Vital Signs</h2>

        {appointment.vitalSigns.length === 0 ? (
          <p className="text-muted">No vitals recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Recorded</th>
                  <th>Temp (°C)</th>
                  <th>Pulse (bpm)</th>
                  <th>Resp. Rate</th>
                  <th>BP</th>
                  <th>SpO2 (%)</th>
                  <th>Weight (kg)</th>
                  <th>Height (cm)</th>
                </tr>
              </thead>
              <tbody>
                {appointment.vitalSigns.map((v) => (
                  <tr key={v.id}>
                    <td className="py-1 pr-4 text-muted">
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
          <summary className="text-sm cursor-pointer select-none text-[color:var(--color-accent)]">
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
                className="btn btn-primary"
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
      <p className="eyebrow">{label}</p>
      <p className="text-[color:var(--color-text)]">{value}</p>
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
      <label className="form-label">
        {label}
      </label>
      <input
        type="number"
        step={step}
        name={name}
        className="input input-sm"
      />
    </div>
  );
}
