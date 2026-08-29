import { prisma } from "@/lib/prisma";
import { AGE_GROUPS, classifyAge } from "@/lib/ageGroups";

// Standard OPD attendance register breakdown: age group × insurance status ×
// new/old attendance × gender. "New" attendance is an OPD-type encounter,
// "Old" (follow-up) is a FOLLOW_UP-type encounter — the two already map
// directly onto EncounterType, so no extra tracking was needed. "Insured"
// is simply whether the patient has an NHIS number on file.
//
// This report only ever queries Encounter rows of type OPD/FOLLOW_UP — ward
// rounds (type WARD_ROUND) are never included here, so a patient's inpatient
// stay is never counted as an OPD attendance. See the Inpatient report
// (reports/inpatient) for admissions/deaths, which counts Admission records
// instead — a structurally separate model, so the same clinical episode
// (e.g. seen in OPD, then admitted) legitimately appears once in each
// report without being double-counted in either one.

export { AGE_GROUPS };

function emptyRow() {
  return {
    insuredNewMale: 0,
    insuredNewFemale: 0,
    insuredOldMale: 0,
    insuredOldFemale: 0,
    uninsuredNewMale: 0,
    uninsuredNewFemale: 0,
    uninsuredOldMale: 0,
    uninsuredOldFemale: 0,
  };
}

export type OpdRowCounts = ReturnType<typeof emptyRow>;

export function rowTotalMale(r: OpdRowCounts) {
  return r.insuredNewMale + r.insuredOldMale + r.uninsuredNewMale + r.uninsuredOldMale;
}

export function rowTotalFemale(r: OpdRowCounts) {
  return (
    r.insuredNewFemale + r.insuredOldFemale + r.uninsuredNewFemale + r.uninsuredOldFemale
  );
}

// `from` inclusive, `to` exclusive.
export async function getOpdReport(from: Date, to: Date) {
  const encounters = await prisma.encounter.findMany({
    where: {
      type: { in: ["OPD", "FOLLOW_UP"] },
      startedAt: { gte: from, lt: to },
    },
    include: { patient: true },
  });

  const byAgeGroup = new Map<string, OpdRowCounts>();
  for (const g of AGE_GROUPS) byAgeGroup.set(g, emptyRow());

  let otherGenderCount = 0;

  for (const e of encounters) {
    const { patient } = e;
    if (patient.gender !== "MALE" && patient.gender !== "FEMALE") {
      otherGenderCount++;
      continue;
    }

    const ageGroup = classifyAge(patient.dateOfBirth, e.startedAt);
    const row = byAgeGroup.get(ageGroup)!;
    const insured = !!patient.nhisNumber;
    const isNew = e.type === "OPD";
    const gender = patient.gender === "MALE" ? "Male" : "Female";
    const key = `${insured ? "insured" : "uninsured"}${isNew ? "New" : "Old"}${gender}` as keyof OpdRowCounts;
    row[key] += 1;
  }

  const total = emptyRow();
  for (const g of AGE_GROUPS) {
    const row = byAgeGroup.get(g)!;
    (Object.keys(total) as (keyof OpdRowCounts)[]).forEach((k) => {
      total[k] += row[k];
    });
  }

  return {
    rows: AGE_GROUPS.map((g) => ({ label: g, counts: byAgeGroup.get(g)! })),
    total,
    otherGenderCount,
    totalVisits: encounters.length,
  };
}
