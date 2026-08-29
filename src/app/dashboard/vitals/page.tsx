import {
  listArrivedAppointments,
  listAdmittedPatients,
  hasVitalsAccess,
} from "./actions";
import { recordVitals } from "../appointments/actions";
import { recordAdmissionVitals } from "../wards/actions";
import { serviceTypeLabel } from "../appointments/labels";
import AccessRestricted from "./AccessRestricted";

function timeAgo(date: Date): string {
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default async function VitalsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!(await hasVitalsAccess())) {
    return <AccessRestricted />;
  }

  const { q } = await searchParams;
  const [arrivals, admitted] = await Promise.all([
    listArrivedAppointments(q ?? ""),
    listAdmittedPatients(q ?? ""),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Vital Signs</h1>
        <p className="text-sm text-slate-500">
          Chart vitals for patients waiting in OPD and for admitted
          inpatients.
        </p>
      </div>

      <form className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by patient name or hospital no."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      {/* OPD arrivals */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">
          Waiting in OPD
        </h2>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {arrivals.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">
              No arrived patients waiting.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {arrivals.map((a) => (
                <li key={a.id} className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">
                        {a.patient.firstName} {a.patient.lastName}
                        <span className="text-slate-400 font-normal">
                          {" "}
                          · {a.patient.hospitalNumber}
                        </span>
                      </p>
                      <p className="text-xs text-slate-400">
                        {serviceTypeLabel(a.serviceType)}
                        {a.vitalSigns[0]
                          ? ` · Last recorded ${timeAgo(a.vitalSigns[0].recordedAt)}`
                          : " · Not recorded yet"}
                      </p>
                    </div>
                  </div>
                  <details className="mt-2">
                    <summary className="text-xs text-blue-600 cursor-pointer select-none">
                      + Record Vitals
                    </summary>
                    <form
                      action={recordVitals}
                      className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4"
                    >
                      <input type="hidden" name="appointmentId" value={a.id} />
                      <input
                        type="hidden"
                        name="patientId"
                        value={a.patient.id}
                      />
                      <VitalField label="Temp (°C)" name="temperatureC" step="0.1" />
                      <VitalField label="Pulse (bpm)" name="pulseBpm" />
                      <VitalField label="Resp. Rate" name="respirationRate" />
                      <VitalField label="SpO2 (%)" name="spo2" />
                      <VitalField label="BP Systolic" name="bpSystolic" />
                      <VitalField label="BP Diastolic" name="bpDiastolic" />
                      <VitalField label="Weight (kg)" name="weightKg" step="0.1" />
                      <VitalField label="Height (cm)" name="heightCm" step="0.1" />
                      <div className="col-span-2 sm:col-span-4">
                        <button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-md"
                        >
                          Save Vitals
                        </button>
                      </div>
                    </form>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Admitted patients */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">
          Admitted Patients
        </h2>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {admitted.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">
              No patients currently admitted.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {admitted.map((a) => (
                <li key={a.id} className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">
                        {a.patient.firstName} {a.patient.lastName}
                        <span className="text-slate-400 font-normal">
                          {" "}
                          · {a.patient.hospitalNumber}
                        </span>
                      </p>
                      <p className="text-xs text-slate-400">
                        {a.bed.ward.name}, Bed {a.bed.label}
                        {a.vitalSigns[0]
                          ? ` · Last recorded ${timeAgo(a.vitalSigns[0].recordedAt)}`
                          : " · Not recorded yet"}
                      </p>
                    </div>
                  </div>
                  <details className="mt-2">
                    <summary className="text-xs text-blue-600 cursor-pointer select-none">
                      + Record Vitals
                    </summary>
                    <form
                      action={recordAdmissionVitals.bind(null, a.id)}
                      className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4"
                    >
                      <VitalField label="Temp (°C)" name="temperatureC" step="0.1" />
                      <VitalField label="Pulse (bpm)" name="pulseBpm" />
                      <VitalField label="Resp. Rate" name="respirationRate" />
                      <VitalField label="SpO2 (%)" name="spo2" />
                      <VitalField label="BP Systolic" name="bpSystolic" />
                      <VitalField label="BP Diastolic" name="bpDiastolic" />
                      <VitalField label="Weight (kg)" name="weightKg" step="0.1" />
                      <VitalField label="Height (cm)" name="heightCm" step="0.1" />
                      <div className="col-span-2 sm:col-span-4">
                        <button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-md"
                        >
                          Save Vitals
                        </button>
                      </div>
                    </form>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
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
