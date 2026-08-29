import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  dischargePatient,
  referPatient,
  recordDeath,
  setMalariaCase,
  recordAdmissionVitals,
  addNurseNote,
  addFluidBalanceEntry,
  requestBlood,
} from "../actions";
import { startWardRound } from "../../encounters/actions";
import {
  encounterTypeLabel,
  encounterStatusBadgeClass,
} from "../../encounters/labels";
import {
  BLOOD_GROUPS,
  BLOOD_URGENCIES,
  bloodRequestStatusLabel,
  bloodRequestStatusBadgeClass,
  bloodUrgencyLabel,
  bloodUrgencyBadgeClass,
} from "../../blood-bank/labels";
import {
  admissionStatusBadgeClass,
  daysAdmitted,
  fluidBalanceTotals,
} from "../labels";
import MalariaCaseToggle from "../MalariaCaseToggle";
import TemperatureChart from "../TemperatureChart";

export default async function AdmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const admission = await prisma.admission.findUnique({
    where: { id },
    include: {
      patient: true,
      bed: { include: { ward: true } },
      encounters: {
        include: { attendingProvider: true },
        orderBy: { startedAt: "desc" },
      },
      vitalSigns: { orderBy: { recordedAt: "desc" } },
      nurseNotes: {
        include: { author: true },
        orderBy: { createdAt: "desc" },
      },
      fluidBalanceEntries: {
        include: { author: true },
        orderBy: { recordedAt: "desc" },
      },
      bloodRequests: {
        orderBy: { requestedAt: "desc" },
      },
    },
  });

  if (!admission) notFound();

  const isActive = admission.status === "ADMITTED";
  const startWardRoundWithId = startWardRound.bind(null, admission.id);
  const dischargeWithId = dischargePatient.bind(null, admission.id);
  const referWithId = referPatient.bind(null, admission.id);
  const recordDeathWithId = recordDeath.bind(null, admission.id);
  const setMalariaCaseWithId = setMalariaCase.bind(null, admission.id);
  const recordVitalsWithId = recordAdmissionVitals.bind(null, admission.id);
  const addNurseNoteWithId = addNurseNote.bind(null, admission.id);
  const addFluidBalanceEntryWithId = addFluidBalanceEntry.bind(
    null,
    admission.id
  );
  const requestBloodWithId = requestBlood.bind(null, admission.id);

  // Chronological (oldest first) for the trend chart, vs. the vitalSigns
  // table above which reads newest-first as a log.
  const temperaturePoints = admission.vitalSigns
    .filter((v) => v.temperatureC != null)
    .map((v) => ({
      recordedAt: v.recordedAt.toISOString(),
      temperatureC: v.temperatureC as number,
    }))
    .reverse();

  const fluidTotals = fluidBalanceTotals(admission.fluidBalanceEntries);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400">
            <Link
              href={`/dashboard/patients/${admission.patient.id}`}
              className="hover:underline"
            >
              {admission.patient.hospitalNumber}
            </Link>
          </p>
          <h1 className="text-xl font-semibold text-slate-800">
            {admission.patient.firstName} {admission.patient.lastName}
          </h1>
          <p className="text-sm text-slate-500">
            {admission.bed.ward.name}, Bed {admission.bed.label} &middot;{" "}
            Admitted {new Date(admission.admittedAt).toLocaleDateString()} (
            {daysAdmitted(admission.admittedAt, admission.dischargedAt)} day
            {daysAdmitted(admission.admittedAt, admission.dischargedAt) === 1
              ? ""
              : "s"}
            )
          </p>
        </div>
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${admissionStatusBadgeClass(admission.status)}`}
        >
          {admission.status}
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-2 gap-4 text-sm">
        <Info label="Admission Notes" value={admission.admissionNotes ?? "—"} />
        {admission.status === "DISCHARGED" && (
          <Info label="Discharge Notes" value={admission.dischargeNotes ?? "—"} />
        )}
        {admission.status === "TRANSFERRED" && (
          <>
            <Info label="Referred To" value={admission.referredTo ?? "—"} />
            <Info label="Referral Reason" value={admission.referralReason ?? "—"} />
          </>
        )}
        {admission.status === "DECEASED" && (
          <Info label="Cause of Death" value={admission.causeOfDeath ?? "—"} />
        )}
        <div>
          <p className="text-xs text-slate-400 mb-1">Malaria Case</p>
          <MalariaCaseToggle
            action={setMalariaCaseWithId}
            defaultChecked={admission.isMalariaCase}
          />
        </div>
      </div>

      {isActive && (
        <form action={startWardRoundWithId}>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Start Ward Round
          </button>
        </form>
      )}

      {/* Ward round history */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">
          Rounds &amp; Reviews
        </h2>
        {admission.encounters.length === 0 ? (
          <p className="text-sm text-slate-400">
            No ward rounds recorded yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {admission.encounters.map((e) => (
              <li key={e.id} className="py-2 text-sm">
                <Link
                  href={`/dashboard/encounters/${e.id}`}
                  className="flex items-center justify-between hover:underline"
                >
                  <span>
                    {new Date(e.startedAt).toLocaleString()}
                    {e.attendingProvider &&
                      ` · ${e.attendingProvider.firstName} ${e.attendingProvider.lastName}`}
                    {e.principalDiagnosis && (
                      <span className="text-slate-400">
                        {" "}
                        — {e.principalDiagnosis}
                      </span>
                    )}
                  </span>
                  <span
                    className={`shrink-0 ml-3 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${encounterStatusBadgeClass(e.status)}`}
                  >
                    {encounterTypeLabel(e.type)}: {e.status.replace("_", " ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Vital signs */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Vital Signs</h2>
        {admission.vitalSigns.length === 0 ? (
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
                {admission.vitalSigns.map((v) => (
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

        {isActive && (
          <details className="pt-2">
            <summary className="text-sm text-blue-600 cursor-pointer select-none">
              + Record Vital Signs
            </summary>
            <form
              action={recordVitalsWithId}
              className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4"
            >
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
        )}
      </div>

      {/* Temperature chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">
          Temperature Chart
        </h2>
        <TemperatureChart points={temperaturePoints} />
      </div>

      {/* Fluid balance chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">
          Fluid Balance Chart
        </h2>

        {admission.fluidBalanceEntries.length === 0 ? (
          <p className="text-sm text-slate-400">
            No fluid balance entries recorded yet.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span className="text-slate-500">
                Total intake:{" "}
                <span className="font-medium text-slate-800">
                  {fluidTotals.intakeMl} mL
                </span>
              </span>
              <span className="text-slate-500">
                Total output:{" "}
                <span className="font-medium text-slate-800">
                  {fluidTotals.outputMl} mL
                </span>
              </span>
              <span className="text-slate-500">
                Balance:{" "}
                <span className="font-medium text-slate-800">
                  {fluidTotals.balanceMl > 0 ? "+" : ""}
                  {fluidTotals.balanceMl} mL
                </span>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="text-left py-1 pr-4">Recorded</th>
                    <th className="text-left py-1 pr-4">Oral (mL)</th>
                    <th className="text-left py-1 pr-4">IV (mL)</th>
                    <th className="text-left py-1 pr-4">Other In (mL)</th>
                    <th className="text-left py-1 pr-4">Urine (mL)</th>
                    <th className="text-left py-1 pr-4">Other Out (mL)</th>
                    <th className="text-left py-1 pr-4">Recorded By</th>
                    <th className="text-left py-1 pr-4">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {admission.fluidBalanceEntries.map((f) => (
                    <tr key={f.id} className="border-t border-slate-100">
                      <td className="py-1 pr-4 text-slate-400">
                        {new Date(f.recordedAt).toLocaleString()}
                      </td>
                      <td className="py-1 pr-4">{f.oralIntakeMl ?? "—"}</td>
                      <td className="py-1 pr-4">{f.ivIntakeMl ?? "—"}</td>
                      <td className="py-1 pr-4">{f.otherIntakeMl ?? "—"}</td>
                      <td className="py-1 pr-4">{f.urineOutputMl ?? "—"}</td>
                      <td className="py-1 pr-4">{f.otherOutputMl ?? "—"}</td>
                      <td className="py-1 pr-4 text-slate-500">
                        {f.author.firstName} {f.author.lastName}
                      </td>
                      <td className="py-1 pr-4 text-slate-500">
                        {f.notes ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {isActive && (
          <details className="pt-2">
            <summary className="text-sm text-blue-600 cursor-pointer select-none">
              + Record Fluid Balance
            </summary>
            <form
              action={addFluidBalanceEntryWithId}
              className="mt-4 space-y-3"
            >
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">
                  Intake
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <FluidField label="Oral (mL)" name="oralIntakeMl" />
                  <FluidField label="IV (mL)" name="ivIntakeMl" />
                  <FluidField label="Other (mL)" name="otherIntakeMl" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">
                  Output
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <FluidField label="Urine (mL)" name="urineOutputMl" />
                  <FluidField label="Other (mL)" name="otherOutputMl" />
                </div>
              </div>
              <textarea
                name="notes"
                rows={2}
                placeholder="Notes (optional)"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
              >
                Save Entry
              </button>
            </form>
          </details>
        )}
      </div>

      {/* Nurses' notes */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">
          Nurses&apos; Notes
        </h2>
        {admission.nurseNotes.length === 0 ? (
          <p className="text-sm text-slate-400">No nursing notes yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {admission.nurseNotes.map((n) => (
              <li key={n.id} className="py-2 space-y-0.5">
                <p className="text-xs text-slate-400">
                  {new Date(n.createdAt).toLocaleString()} ·{" "}
                  {n.author.firstName} {n.author.lastName}
                </p>
                <p className="text-slate-700">{n.note}</p>
                {n.management && (
                  <p className="text-slate-500">
                    <span className="text-slate-400">Action taken:</span>{" "}
                    {n.management}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        {isActive && (
          <details className="pt-2">
            <summary className="text-sm text-blue-600 cursor-pointer select-none">
              + Add Note
            </summary>
            <form action={addNurseNoteWithId} className="mt-3 space-y-3">
              <textarea
                name="note"
                required
                rows={2}
                placeholder="Observation / note"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                name="management"
                rows={2}
                placeholder="Action taken (optional)"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
              >
                Save Note
              </button>
            </form>
          </details>
        )}
      </div>

      {/* Blood requests */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">
          Blood Requests
        </h2>
        {admission.bloodRequests.length === 0 ? (
          <p className="text-sm text-slate-400">
            No blood requested for this admission yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {admission.bloodRequests.map((r) => (
              <li key={r.id} className="py-2 flex items-center justify-between gap-3">
                <span>
                  {r.bloodGroup} · {r.unitsNeeded} unit
                  {r.unitsNeeded === 1 ? "" : "s"}
                  <span className="text-slate-400">
                    {" "}
                    — {r.indication}
                  </span>
                  <span className="block text-xs text-slate-400">
                    {new Date(r.requestedAt).toLocaleString()}
                  </span>
                </span>
                <span className="shrink-0 flex items-center gap-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs ${bloodUrgencyBadgeClass(r.urgency)}`}
                  >
                    {bloodUrgencyLabel(r.urgency)}
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${bloodRequestStatusBadgeClass(r.status)}`}
                  >
                    {bloodRequestStatusLabel(r.status)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}

        {isActive && (
          <details className="pt-2">
            <summary className="text-sm text-blue-600 cursor-pointer select-none">
              + Request Blood
            </summary>
            <form
              action={requestBloodWithId}
              className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Blood Group
                </label>
                <select
                  name="bloodGroup"
                  required
                  defaultValue={admission.patient.bloodGroup ?? ""}
                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {BLOOD_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Units Needed
                </label>
                <input
                  type="number"
                  name="unitsNeeded"
                  min={1}
                  required
                  defaultValue={1}
                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Urgency
                </label>
                <select
                  name="urgency"
                  required
                  defaultValue="ROUTINE"
                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                >
                  {BLOOD_URGENCIES.map((u) => (
                    <option key={u} value={u}>
                      {bloodUrgencyLabel(u)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 sm:col-span-4">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Indication
                </label>
                <textarea
                  name="indication"
                  required
                  rows={2}
                  placeholder="Reason for transfusion — e.g. Hb 5.2 g/dL, active bleeding…"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2 sm:col-span-4 pt-2">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-md"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </details>
        )}
      </div>

      {isActive && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h2 className="text-sm font-semibold text-slate-700">Discharge</h2>
            <form action={dischargeWithId} className="space-y-3">
              <textarea
                name="dischargeNotes"
                rows={3}
                placeholder="Condition on discharge, follow-up instructions…"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-md"
              >
                Discharge Patient
              </button>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h2 className="text-sm font-semibold text-slate-700">
              Refer (No Improvement)
            </h2>
            <form action={referWithId} className="space-y-3">
              <input
                name="referredTo"
                required
                placeholder="Referred to (facility / specialist)"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                name="referralReason"
                required
                rows={2}
                placeholder="Reason for referral"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-md"
              >
                Refer Patient
              </button>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <h2 className="text-sm font-semibold text-slate-700">
              Record Death
            </h2>
            <form action={recordDeathWithId} className="space-y-3">
              <textarea
                name="causeOfDeath"
                required
                rows={3}
                placeholder="Cause of death"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-md"
              >
                Record Death
              </button>
            </form>
          </div>
        </div>
      )}
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

function FluidField({ label, name }: { label: string; name: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">
        {label}
      </label>
      <input
        type="number"
        min={0}
        name={name}
        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
