// Shared vitals helpers for the two places a VitalSign row is written:
// outpatient charting on an appointment (src/app/dashboard/appointments) and
// nurse-charted inpatient observations on an admission
// (src/app/dashboard/wards). Both modules keep their own zod schema; what is
// shared here is the field vocabulary the audit trail reports on.

/** The clinical measurement fields on a VitalSign, in charting order. */
export const VITAL_FIELDS = [
  "temperatureC",
  "pulseBpm",
  "respirationRate",
  "bpSystolic",
  "bpDiastolic",
  "spo2",
  "heightCm",
  "weightKg",
] as const;

export type VitalField = (typeof VITAL_FIELDS)[number];

/**
 * Which measurements were actually filled in on a charting form — the field
 * *names* only. The readings are clinical data and stay in the VitalSign
 * row; audit metadata records what was charted, not the values (see the
 * metadata rule in src/lib/audit.ts).
 */
export function chartedVitalKeys(
  input: Partial<Record<VitalField, unknown>>
): VitalField[] {
  return VITAL_FIELDS.filter((f) => {
    const v = input[f];
    return v !== undefined && v !== null && v !== "";
  });
}
