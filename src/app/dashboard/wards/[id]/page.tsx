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
          <p className="eyebrow">
            <Link
              href={`/dashboard/patients/${admission.patient.id}`}
              className="hover:underline"
            >
              {admission.patient.hospitalNumber}
            </Link>
          </p>
          <h1 className="page-title">
            {admission.patient.firstName} {admission.patient.lastName}
          </h1>
          <p className="text-muted">
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
          className={`${admissionStatusBadgeClass(admission.status)}`}
        >
          {admission.status}
        </span>
      </div>

      <div className="card grid grid-cols-2 gap-4">
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
          <p className="eyebrow mb-1">Malaria Case</p>
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
            className="btn btn-primary"
          >
            Start Ward Round
          </button>
        </form>
      )}

      {/* Ward round history */}
      <div className="card gap-3">
        <h2 className="card-title">
          Rounds &amp; Reviews
        </h2>
        {admission.encounters.length === 0 ? (
          <p className="text-muted">
            No ward rounds recorded yet.
          </p>
        ) : (
          <ul className="list">
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
                      <span className="text-muted">
                        {" "}
                        — {e.principalDiagnosis}
                      </span>
                    )}
                  </span>
                  <span
                    className={`shrink-0 ml-3 ${encounterStatusBadgeClass(e.status)}`}
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
      <div className="card gap-3">
        <h2 className="card-title">Vital Signs</h2>
        {admission.vitalSigns.length === 0 ? (
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
                {admission.vitalSigns.map((v) => (
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

        {isActive && (
          <details className="pt-2">
            <summary className="text-sm cursor-pointer select-none text-[color:var(--color-accent)]">
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
                  className="btn btn-primary"
                >
                  Save Vitals
                </button>
              </div>
            </form>
          </details>
        )}
      </div>

      {/* Temperature chart */}
      <div className="card gap-3">
        <h2 className="card-title">
          Temperature Chart
        </h2>
        <TemperatureChart points={temperaturePoints} />
      </div>

      {/* Fluid balance chart */}
      <div className="card gap-3">
        <h2 className="card-title">
          Fluid Balance Chart
        </h2>

        {admission.fluidBalanceEntries.length === 0 ? (
          <p className="text-muted">
            No fluid balance entries recorded yet.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span className="text-muted">
                Total intake:{" "}
                <span className="font-[600]">
                  {fluidTotals.intakeMl} mL
                </span>
              </span>
              <span className="text-muted">
                Total output:{" "}
                <span className="font-[600]">
                  {fluidTotals.outputMl} mL
                </span>
              </span>
              <span className="text-muted">
                Balance:{" "}
                <span className="font-[600]">
                  {fluidTotals.balanceMl > 0 ? "+" : ""}
                  {fluidTotals.balanceMl} mL
                </span>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Recorded</th>
                    <th>Oral (mL)</th>
                    <th>IV (mL)</th>
                    <th>Other In (mL)</th>
                    <th>Urine (mL)</th>
                    <th>Other Out (mL)</th>
                    <th>Recorded By</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {admission.fluidBalanceEntries.map((f) => (
                    <tr key={f.id}>
                      <td className="py-1 pr-4 text-muted">
                        {new Date(f.recordedAt).toLocaleString()}
                      </td>
                      <td className="py-1 pr-4">{f.oralIntakeMl ?? "—"}</td>
                      <td className="py-1 pr-4">{f.ivIntakeMl ?? "—"}</td>
                      <td className="py-1 pr-4">{f.otherIntakeMl ?? "—"}</td>
                      <td className="py-1 pr-4">{f.urineOutputMl ?? "—"}</td>
                      <td className="py-1 pr-4">{f.otherOutputMl ?? "—"}</td>
                      <td className="py-1 pr-4 text-muted">
                        {f.author.firstName} {f.author.lastName}
                      </td>
                      <td className="py-1 pr-4 text-muted">
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
            <summary className="text-sm cursor-pointer select-none text-[color:var(--color-accent)]">
              + Record Fluid Balance
            </summary>
            <form
              action={addFluidBalanceEntryWithId}
              className="mt-4 space-y-3"
            >
              <div>
                <p className="text-xs font-medium text-muted mb-1">
                  Intake
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <FluidField label="Oral (mL)" name="oralIntakeMl" />
                  <FluidField label="IV (mL)" name="ivIntakeMl" />
                  <FluidField label="Other (mL)" name="otherIntakeMl" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted mb-1">
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
                className="input"
              />
              <button
                type="submit"
                className="btn btn-primary"
              >
                Save Entry
              </button>
            </form>
          </details>
        )}
      </div>

      {/* Nurses' notes */}
      <div className="card gap-3">
        <h2 className="card-title">
          Nurses&apos; Notes
        </h2>
        {admission.nurseNotes.length === 0 ? (
          <p className="text-muted">No nursing notes yet.</p>
        ) : (
          <ul className="list text-sm">
            {admission.nurseNotes.map((n) => (
              <li key={n.id} className="py-2 space-y-0.5">
                <p className="eyebrow">
                  {new Date(n.createdAt).toLocaleString()} ·{" "}
                  {n.author.firstName} {n.author.lastName}
                </p>
                <p className="text-[color:var(--color-text)]">{n.note}</p>
                {n.management && (
                  <p className="text-muted">
                    <span className="text-muted">Action taken:</span>{" "}
                    {n.management}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        {isActive && (
          <details className="pt-2">
            <summary className="text-sm cursor-pointer select-none text-[color:var(--color-accent)]">
              + Add Note
            </summary>
            <form action={addNurseNoteWithId} className="mt-3 space-y-3">
              <textarea
                name="note"
                required
                rows={2}
                placeholder="Observation / note"
                className="input"
              />
              <textarea
                name="management"
                rows={2}
                placeholder="Action taken (optional)"
                className="input"
              />
              <button
                type="submit"
                className="btn btn-primary"
              >
                Save Note
              </button>
            </form>
          </details>
        )}
      </div>

      {/* Blood requests */}
      <div className="card gap-3">
        <h2 className="card-title">
          Blood Requests
        </h2>
        {admission.bloodRequests.length === 0 ? (
          <p className="text-muted">
            No blood requested for this admission yet.
          </p>
        ) : (
          <ul className="list text-sm">
            {admission.bloodRequests.map((r) => (
              <li key={r.id} className="py-2 flex items-center justify-between gap-3">
                <span>
                  {r.bloodGroup} · {r.unitsNeeded} unit
                  {r.unitsNeeded === 1 ? "" : "s"}
                  <span className="text-muted">
                    {" "}
                    — {r.indication}
                  </span>
                  <span className="block eyebrow">
                    {new Date(r.requestedAt).toLocaleString()}
                  </span>
                </span>
                <span className="shrink-0 flex items-center gap-2">
                  <span
                    className={`${bloodUrgencyBadgeClass(r.urgency)}`}
                  >
                    {bloodUrgencyLabel(r.urgency)}
                  </span>
                  <span
                    className={`${bloodRequestStatusBadgeClass(r.status)}`}
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
            <summary className="text-sm cursor-pointer select-none text-[color:var(--color-accent)]">
              + Request Blood
            </summary>
            <form
              action={requestBloodWithId}
              className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4"
            >
              <div>
                <label className="form-label">
                  Blood Group
                </label>
                <select
                  name="bloodGroup"
                  required
                  defaultValue={admission.patient.bloodGroup ?? ""}
                  className="input input-sm"
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
                <label className="form-label">
                  Units Needed
                </label>
                <input
                  type="number"
                  name="unitsNeeded"
                  min={1}
                  required
                  defaultValue={1}
                  className="input input-sm"
                />
              </div>
              <div>
                <label className="form-label">
                  Urgency
                </label>
                <select
                  name="urgency"
                  required
                  defaultValue="ROUTINE"
                  className="input input-sm"
                >
                  {BLOOD_URGENCIES.map((u) => (
                    <option key={u} value={u}>
                      {bloodUrgencyLabel(u)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 sm:col-span-4">
                <label className="form-label">
                  Indication
                </label>
                <textarea
                  name="indication"
                  required
                  rows={2}
                  placeholder="Reason for transfusion — e.g. Hb 5.2 g/dL, active bleeding…"
                  className="input"
                />
              </div>

              <div className="col-span-2 sm:col-span-4 pt-2">
                <button
                  type="submit"
                  className="btn btn-primary"
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
          <div className="card gap-3">
            <h2 className="card-title">Discharge</h2>
            <form action={dischargeWithId} className="space-y-3">
              <textarea
                name="dischargeNotes"
                rows={3}
                placeholder="Condition on discharge, follow-up instructions…"
                className="input"
              />
              <button
                type="submit"
                className="btn btn-secondary"
              >
                Discharge Patient
              </button>
            </form>
          </div>

          <div className="card gap-3">
            <h2 className="card-title">
              Refer (No Improvement)
            </h2>
            <form action={referWithId} className="space-y-3">
              <input
                name="referredTo"
                required
                placeholder="Referred to (facility / specialist)"
                className="input"
              />
              <textarea
                name="referralReason"
                required
                rows={2}
                placeholder="Reason for referral"
                className="input"
              />
              <button
                type="submit"
                className="btn btn-secondary"
              >
                Refer Patient
              </button>
            </form>
          </div>

          <div className="card gap-3">
            <h2 className="card-title">
              Record Death
            </h2>
            <form action={recordDeathWithId} className="space-y-3">
              <textarea
                name="causeOfDeath"
                required
                rows={3}
                placeholder="Cause of death"
                className="input"
              />
              <button
                type="submit"
                className="btn btn-secondary"
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

function FluidField({ label, name }: { label: string; name: string }) {
  return (
    <div>
      <label className="form-label">
        {label}
      </label>
      <input
        type="number"
        min={0}
        name={name}
        className="input input-sm"
      />
    </div>
  );
}
