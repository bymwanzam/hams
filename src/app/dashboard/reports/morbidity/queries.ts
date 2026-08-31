import { prisma } from "@/lib/prisma";
import { AGE_GROUPS, classifyAge } from "@/lib/ageGroups";
import { MORBIDITY_TAXONOMY, classifyDiagnosis, splitDiagnoses } from "@/lib/morbidity";

// GHS OPD Monthly Morbidity return: for every disease "data element" in the
// taxonomy (src/lib/morbidity.ts), a count broken out by 12 age bands ×
// gender. Diagnoses come from the free-text Encounter.principalDiagnosis /
// additionalDiagnosis fields, one tally per diagnosis fragment (principal +
// each comma/semicolon/newline-separated additional), routed through
// classifyDiagnosis. Scope is OPD + FOLLOW_UP + EMERGENCY encounters — ward
// rounds are never included. See the OPD Attendance report (reports/opd) for
// the plain attendance headcount over the same encounter set.

export { AGE_GROUPS };

const N_AGE = AGE_GROUPS.length;

export type ElementCounts = { male: number[]; female: number[] };

function emptyCounts(): ElementCounts {
  return { male: new Array(N_AGE).fill(0), female: new Array(N_AGE).fill(0) };
}

export interface MorbidityReportRow {
  key: string;
  label: string;
  counts: ElementCounts;
}

export interface MorbidityReportSection {
  title: string;
  rows: MorbidityReportRow[];
}

export interface MorbidityReport {
  sections: MorbidityReportSection[];
  encounterCount: number;
  /** Diagnosis fragments actually placed into a row (excludes routine/non-morbidity entries). */
  diagnosisCount: number;
  /** Encounters skipped because the patient's gender is not Male/Female. */
  otherGenderCount: number;
}

export function ageTotals(c: ElementCounts): number[] {
  return Array.from({ length: N_AGE }, (_, i) => c.male[i] + c.female[i]);
}
export function totalMale(c: ElementCounts): number {
  return c.male.reduce((a, b) => a + b, 0);
}
export function totalFemale(c: ElementCounts): number {
  return c.female.reduce((a, b) => a + b, 0);
}
export function grandTotal(c: ElementCounts): number {
  return totalMale(c) + totalFemale(c);
}

// `from` inclusive, `to` exclusive.
export async function getMorbidityReport(from: Date, to: Date): Promise<MorbidityReport> {
  const encounters = await prisma.encounter.findMany({
    where: {
      type: { in: ["OPD", "FOLLOW_UP", "EMERGENCY"] },
      startedAt: { gte: from, lt: to },
    },
    include: { patient: true },
  });

  const counts = new Map<string, ElementCounts>();
  for (const section of MORBIDITY_TAXONOMY) {
    for (const el of section.elements) counts.set(el.key, emptyCounts());
  }

  let otherGenderCount = 0;
  let diagnosisCount = 0;

  for (const e of encounters) {
    const { patient } = e;
    if (patient.gender !== "MALE" && patient.gender !== "FEMALE") {
      otherGenderCount++;
      continue;
    }

    const ageIdx = AGE_GROUPS.indexOf(classifyAge(patient.dateOfBirth, e.startedAt));
    if (ageIdx < 0) continue;
    const genderKey: keyof ElementCounts = patient.gender === "MALE" ? "male" : "female";

    // "Re-Attendances" is one tally per follow-up visit, independent of any
    // diagnosis recorded. "Referrals" has no OPD source field (referrals
    // are only tracked on Admission) and stays 0.
    if (e.type === "FOLLOW_UP") {
      counts.get("re_attendances")![genderKey][ageIdx] += 1;
    }

    const fragments = [
      ...splitDiagnoses(e.principalDiagnosis),
      ...splitDiagnoses(e.additionalDiagnosis),
    ];
    for (const fragment of fragments) {
      const key = classifyDiagnosis(fragment);
      if (!key) continue;
      const bucket = counts.get(key);
      if (!bucket) continue;
      bucket[genderKey][ageIdx] += 1;
      diagnosisCount++;
    }
  }

  const sections: MorbidityReportSection[] = MORBIDITY_TAXONOMY.map((s) => ({
    title: s.title,
    rows: s.elements.map((el) => ({
      key: el.key,
      label: el.label,
      counts: counts.get(el.key)!,
    })),
  }));

  return {
    sections,
    encounterCount: encounters.length,
    diagnosisCount,
    otherGenderCount,
  };
}
