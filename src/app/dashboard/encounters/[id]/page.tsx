import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  updateConsultation,
  completeConsultation,
  orderLabTest,
  orderImaging,
  recordLabResult,
  cancelLabOrder,
  recordImagingResult,
  cancelImagingOrder,
  admitFromEncounter,
} from "../actions";
import {
  encounterTypeLabel,
  encounterStatusBadgeClass,
  orderStatusBadgeClass,
  IMAGING_MODALITIES,
} from "../labels";
import PrescriptionForm from "../PrescriptionForm";
import CancelOrderButton from "../CancelOrderButton";
import { COMMON_DIAGNOSES } from "../diagnoses";
import {
  prescriptionDispenseStatus,
  dispenseStatusLabel,
  dispenseStatusBadgeClass,
} from "@/lib/prescriptions";

export default async function EncounterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const encounter = await prisma.encounter.findUnique({
    where: { id },
    include: {
      patient: true,
      attendingProvider: true,
      appointment: {
        include: { vitalSigns: { orderBy: { recordedAt: "desc" } } },
      },
      admission: {
        include: { bed: { include: { ward: true } } },
      },
      vitalSigns: { orderBy: { recordedAt: "desc" } },
      labOrders: { include: { test: true }, orderBy: { orderedAt: "desc" } },
      imagingOrders: { orderBy: { orderedAt: "desc" } },
      prescriptions: {
        include: {
          items: { include: { drug: true } },
          dispenses: { include: { items: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!encounter) notFound();

  const labTests = await prisma.labTest.findMany({
    where: { isAvailable: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  const labTestsByCategory = new Map<string, typeof labTests>();
  for (const t of labTests) {
    const key = t.category ?? "Other";
    if (!labTestsByCategory.has(key)) labTestsByCategory.set(key, []);
    labTestsByCategory.get(key)!.push(t);
  }
  const drugs = await prisma.drug.findMany({ orderBy: { name: "asc" } });

  const allVitals = [
    ...encounter.vitalSigns,
    ...(encounter.appointment?.vitalSigns ?? []),
  ].sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());

  const isCompleted = encounter.status === "COMPLETED";
  const isOpd = encounter.type === "OPD";
  const updateConsultationWithId = updateConsultation.bind(null, encounter.id);
  const completeConsultationWithId = completeConsultation.bind(null, encounter.id);
  const admitFromEncounterWithId = admitFromEncounter.bind(null, encounter.id);

  return (
    <div className="space-y-6 max-w-4xl">
      <datalist id="common-diagnoses">
        {COMMON_DIAGNOSES.map((d) => (
          <option key={d} value={d} />
        ))}
      </datalist>

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400">
            <Link
              href={`/dashboard/patients/${encounter.patient.id}`}
              className="hover:underline"
            >
              {encounter.patient.hospitalNumber}
            </Link>
          </p>
          <h1 className="text-xl font-semibold text-slate-800">
            {encounter.patient.firstName} {encounter.patient.lastName}
          </h1>
          <p className="text-sm text-slate-500">
            {encounterTypeLabel(encounter.type)} &middot; Started{" "}
            {new Date(encounter.startedAt).toLocaleString()}
            {encounter.attendingProvider &&
              ` · ${encounter.attendingProvider.firstName} ${encounter.attendingProvider.lastName}`}
          </p>
          {encounter.admission && (
            <p className="text-sm text-slate-500">
              <Link
                href={`/dashboard/wards/${encounter.admission.id}`}
                className="text-blue-600 hover:underline"
              >
                ← Back to admission
              </Link>{" "}
              &middot; {encounter.admission.bed.ward.name}, Bed{" "}
              {encounter.admission.bed.label}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${encounterStatusBadgeClass(encounter.status)}`}
          >
            {encounter.status.replace("_", " ")}
          </span>
          {/* Books a separate Appointment row for this same patient — the
              next visit gets its own new Encounter when it's called in
              (see callInPatient), distinct from this one rather than
              reopening or overwriting it. */}
          <Link
            href={`/dashboard/appointments/new?patientId=${encounter.patient.id}&notes=${encodeURIComponent(
              `Follow-up from ${encounterTypeLabel(encounter.type)} consultation on ${new Date(encounter.startedAt).toLocaleDateString()}${encounter.principalDiagnosis ? ` (${encounter.principalDiagnosis})` : ""}.`
            )}`}
            className="text-sm text-blue-600 hover:underline whitespace-nowrap"
          >
            + Schedule Follow-up
          </Link>
          {!isCompleted && (
            <div className="flex items-center gap-2">
              {isOpd && (
                <form action={admitFromEncounterWithId}>
                  <button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-md"
                  >
                    Admit to Ward
                  </button>
                </form>
              )}
              <form action={completeConsultationWithId}>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-md"
                >
                  {isOpd ? "Discharge Home" : "Complete Consultation"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Vitals */}
      <Section title="Vital Signs">
        {allVitals.length === 0 ? (
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
                {allVitals.map((v) => (
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

        <p className="text-xs text-slate-400 pt-2">
          View only here — vitals are charted by nursing staff in the{" "}
          <Link href="/dashboard/vitals" className="text-blue-600 hover:underline">
            Vital Signs
          </Link>{" "}
          module.
        </p>
      </Section>

      {/* History, examination, diagnosis & plan */}
      <Section title="Consultation Notes">
        <form action={updateConsultationWithId} className="space-y-4">
          <fieldset disabled={isCompleted} className="space-y-4">
            <TextAreaField
              label="Chief Complaint"
              name="chiefComplaint"
              defaultValue={encounter.chiefComplaint}
            />
            <TextAreaField
              label="History of Presenting Complaint"
              name="historyOfPresentingComplaint"
              defaultValue={encounter.historyOfPresentingComplaint}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextAreaField
                label="Past Medical History"
                name="pastMedicalHistory"
                defaultValue={encounter.pastMedicalHistory}
              />
              <TextAreaField
                label="Past Surgical History"
                name="pastSurgicalHistory"
                defaultValue={encounter.pastSurgicalHistory}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TextAreaField
                label="Drug History (current medications)"
                name="drugHistory"
                defaultValue={encounter.drugHistory}
              />
              <TextAreaField
                label="Allergies"
                name="allergies"
                defaultValue={encounter.allergies}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TextAreaField
                label="Family History"
                name="familyHistory"
                defaultValue={encounter.familyHistory}
              />
              <TextAreaField
                label="Social History"
                name="socialHistory"
                placeholder="Smoking, alcohol, occupation, etc."
                defaultValue={encounter.socialHistory}
              />
            </div>
            <TextAreaField
              label="Review of Systems"
              name="reviewOfSystems"
              defaultValue={encounter.reviewOfSystems}
            />
            <TextAreaField
              label="Examination Findings"
              name="examinationFindings"
              defaultValue={encounter.examinationFindings}
            />
            <div className="grid grid-cols-2 gap-4">
              <DiagnosisField
                label="Principal Diagnosis"
                name="principalDiagnosis"
                defaultValue={encounter.principalDiagnosis}
              />
              <DiagnosisField
                label="Additional Diagnosis"
                name="additionalDiagnosis"
                defaultValue={encounter.additionalDiagnosis}
                placeholder="Comma-separate if more than one"
              />
            </div>
            <TextAreaField
              label="Management Plan"
              name="managementPlan"
              defaultValue={encounter.managementPlan}
            />
            <TextAreaField
              label="Additional Notes"
              name="notes"
              defaultValue={encounter.notes}
            />
          </fieldset>

          {!isCompleted && (
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
            >
              Save Consultation Notes
            </button>
          )}
        </form>
      </Section>

      {/* Lab orders */}
      <Section title="Laboratory Tests">
        {encounter.labOrders.length === 0 ? (
          <p className="text-sm text-slate-400">No lab tests ordered yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {encounter.labOrders.map((o) => {
              const isResolved = o.status === "COMPLETED" || o.status === "CANCELLED";
              return (
                <li key={o.id} className="py-2 text-sm space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span>{o.test.name}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-slate-400 text-xs">
                        {new Date(o.orderedAt).toLocaleDateString()}
                      </span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${orderStatusBadgeClass(o.status)}`}
                      >
                        {o.status.replace("_", " ")}
                      </span>
                      {!isResolved && (
                        <CancelOrderButton action={cancelLabOrder.bind(null, o.id)} />
                      )}
                    </span>
                  </div>

                  {o.status === "COMPLETED" && o.resultValue && (
                    <p className="text-xs bg-slate-50 rounded px-2 py-1.5">
                      Result:{" "}
                      <span className="font-medium text-slate-800">
                        {o.resultValue}
                        {o.resultUnit && ` ${o.resultUnit}`}
                      </span>
                      {o.referenceRange && (
                        <span className="text-slate-400">
                          {" "}
                          (ref: {o.referenceRange})
                        </span>
                      )}
                    </p>
                  )}

                  {!isResolved && (
                    <details>
                      <summary className="text-xs text-blue-600 cursor-pointer select-none">
                        + Record Result
                      </summary>
                      <form
                        action={recordLabResult.bind(null, o.id)}
                        className="mt-2 flex items-end gap-2"
                      >
                        <input
                          name="resultValue"
                          required
                          placeholder="Result value"
                          className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
                        />
                        <input
                          name="resultUnit"
                          placeholder="Unit"
                          className="w-20 rounded-md border border-slate-300 px-2 py-1 text-xs"
                        />
                        <input
                          name="referenceRange"
                          placeholder="Ref. range"
                          className="w-28 rounded-md border border-slate-300 px-2 py-1 text-xs"
                        />
                        <button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-md"
                        >
                          Save
                        </button>
                      </form>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {!isCompleted && (
          <form action={orderLabTest} className="flex items-end gap-3 pt-3">
            <input type="hidden" name="encounterId" value={encounter.id} />
            <input type="hidden" name="patientId" value={encounter.patient.id} />
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Request a Lab Test
              </label>
              <select
                name="testId"
                required
                defaultValue=""
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Select test…
                </option>
                {Array.from(labTestsByCategory.entries()).map(
                  ([category, tests]) => (
                    <optgroup key={category} label={category}>
                      {tests.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </optgroup>
                  )
                )}
              </select>
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
            >
              Order
            </button>
          </form>
        )}
      </Section>

      {/* Imaging / screening orders */}
      <Section title="Imaging &amp; Screening">
        {encounter.imagingOrders.length === 0 ? (
          <p className="text-sm text-slate-400">
            No imaging or screening studies ordered yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {encounter.imagingOrders.map((o) => {
              const isResolved = o.status === "COMPLETED" || o.status === "CANCELLED";
              return (
                <li key={o.id} className="py-2 text-sm space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span>{o.modality}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-slate-400 text-xs">
                        {new Date(o.orderedAt).toLocaleDateString()}
                      </span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${orderStatusBadgeClass(o.status)}`}
                      >
                        {o.status.replace("_", " ")}
                      </span>
                      {!isResolved && (
                        <CancelOrderButton
                          action={cancelImagingOrder.bind(null, o.id)}
                        />
                      )}
                    </span>
                  </div>

                  {o.status === "COMPLETED" && o.reportText && (
                    <p className="text-xs bg-slate-50 rounded px-2 py-1.5 text-slate-700">
                      {o.reportText}
                    </p>
                  )}

                  {!isResolved && (
                    <details>
                      <summary className="text-xs text-blue-600 cursor-pointer select-none">
                        + Record Result
                      </summary>
                      <form
                        action={recordImagingResult.bind(null, o.id)}
                        className="mt-2 flex items-end gap-2"
                      >
                        <textarea
                          name="reportText"
                          required
                          rows={2}
                          placeholder="Findings / report"
                          className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs"
                        />
                        <button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-md"
                        >
                          Save
                        </button>
                      </form>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {!isCompleted && (
          <form action={orderImaging} className="flex items-end gap-3 pt-3">
            <input type="hidden" name="encounterId" value={encounter.id} />
            <input type="hidden" name="patientId" value={encounter.patient.id} />
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Request Imaging / Screening
              </label>
              <select
                name="modality"
                required
                defaultValue=""
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Select study…
                </option>
                {IMAGING_MODALITIES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
            >
              Order
            </button>
          </form>
        )}
      </Section>

      {/* Prescriptions */}
      <Section title="Prescriptions">
        {encounter.prescriptions.length === 0 ? (
          <p className="text-sm text-slate-400">No prescriptions written yet.</p>
        ) : (
          <div className="space-y-3">
            {encounter.prescriptions.map((rx) => (
              <div
                key={rx.id}
                className="border border-slate-200 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">
                    {new Date(rx.createdAt).toLocaleString()}
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${dispenseStatusBadgeClass(prescriptionDispenseStatus(rx))}`}
                  >
                    {dispenseStatusLabel(prescriptionDispenseStatus(rx))}
                  </span>
                </div>
                <ul className="text-sm divide-y divide-slate-100">
                  {rx.items.map((item) => (
                    <li key={item.id} className="py-1.5 flex justify-between">
                      <span>
                        {item.drug.name}
                        <span
                          className={`ml-1.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            item.drug.nhisCovered
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {item.drug.nhisCovered ? "NHIS" : "Cash"}
                        </span>
                        <span className="text-slate-400">
                          {" "}
                          — {item.dosage}, {item.frequency}, {item.durationDays}{" "}
                          day{item.durationDays === 1 ? "" : "s"}
                        </span>
                      </span>
                      <span className="text-slate-500">×{item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {!isCompleted && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-700 mb-2 mt-3">
              New Prescription
            </p>
            {drugs.length === 0 ? (
              <p className="text-sm text-slate-400">
                No drugs in the formulary yet.
              </p>
            ) : (
              <PrescriptionForm
                encounterId={encounter.id}
                patientId={encounter.patient.id}
                drugs={drugs}
              />
            )}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      {children}
    </div>
  );
}

function TextAreaField({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <textarea
        name={name}
        rows={2}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
      />
    </div>
  );
}

// Free text with browser-native autocomplete against COMMON_DIAGNOSES (a
// <datalist>, rendered once for the page) — lets the doctor pick a
// suggested diagnosis or type one that isn't listed, without any
// client-side JS.
function DiagnosisField({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        name={name}
        list="common-diagnoses"
        placeholder={placeholder ?? "Type or select a diagnosis…"}
        defaultValue={defaultValue ?? undefined}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
      />
    </div>
  );
}

