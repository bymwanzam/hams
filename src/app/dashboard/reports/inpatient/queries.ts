import { prisma } from "@/lib/prisma";
import { AGE_GROUPS, classifyAge, ageInCompletedYears } from "@/lib/ageGroups";

// Inpatient admissions & deaths register: age group × insurance status ×
// admission/death × gender, plus a malaria summary. This report queries the
// Admission model exclusively — a structurally different model from the
// Encounter rows the OPD report counts, so there is no overlap between the
// two: a patient seen in OPD and then admitted legitimately shows up once
// in each (one OPD attendance, one admission), which is standard practice,
// not double-counting. Ward-round encounters during a stay are never
// counted in either report — they're clinical documentation, not a
// reportable attendance/admission event on their own.
//
// "Admission" counts new admissions whose admittedAt falls in the period.
// "Death" counts admissions whose outcome (dischargedAt, doubling as date
// of death) falls in the period and whose status is DECEASED — regardless
// of when the admission itself started, per standard reporting practice.

export { AGE_GROUPS };

function emptyRow() {
  return {
    insuredAdmissionMale: 0,
    insuredAdmissionFemale: 0,
    insuredDeathMale: 0,
    insuredDeathFemale: 0,
    uninsuredAdmissionMale: 0,
    uninsuredAdmissionFemale: 0,
    uninsuredDeathMale: 0,
    uninsuredDeathFemale: 0,
  };
}

export type InpatientRowCounts = ReturnType<typeof emptyRow>;

function emptyMalariaSummary() {
  return {
    admittedUnder5Male: 0,
    admittedUnder5Female: 0,
    admitted5PlusMale: 0,
    admitted5PlusFemale: 0,
    diedUnder5Male: 0,
    diedUnder5Female: 0,
    died5PlusMale: 0,
    died5PlusFemale: 0,
  };
}

export type MalariaSummary = ReturnType<typeof emptyMalariaSummary>;

// `from` inclusive, `to` exclusive, for both admissions and deaths.
export async function getInpatientReport(from: Date, to: Date) {
  const [admissionsInPeriod, deathsInPeriod] = await Promise.all([
    prisma.admission.findMany({
      where: { admittedAt: { gte: from, lt: to } },
      include: { patient: true },
    }),
    prisma.admission.findMany({
      where: {
        status: "DECEASED",
        dischargedAt: { gte: from, lt: to },
      },
      include: { patient: true },
    }),
  ]);

  const byAgeGroup = new Map<string, InpatientRowCounts>();
  for (const g of AGE_GROUPS) byAgeGroup.set(g, emptyRow());

  let otherGenderCount = 0;
  const malaria = emptyMalariaSummary();

  for (const a of admissionsInPeriod) {
    const { patient } = a;
    if (patient.gender !== "MALE" && patient.gender !== "FEMALE") {
      otherGenderCount++;
      continue;
    }

    const ageGroup = classifyAge(patient.dateOfBirth, a.admittedAt);
    const row = byAgeGroup.get(ageGroup)!;
    const insured = !!patient.nhisNumber;
    const gender = patient.gender === "MALE" ? "Male" : "Female";
    const key = `${insured ? "insured" : "uninsured"}Admission${gender}` as keyof InpatientRowCounts;
    row[key] += 1;

    if (a.isMalariaCase) {
      const under5 = ageInCompletedYears(patient.dateOfBirth, a.admittedAt) < 5;
      const field =
        `admitted${under5 ? "Under5" : "5Plus"}${gender}` as keyof MalariaSummary;
      malaria[field] += 1;
    }
  }

  for (const a of deathsInPeriod) {
    const { patient } = a;
    if (patient.gender !== "MALE" && patient.gender !== "FEMALE") {
      continue; // already reflected in otherGenderCount from the admission pass where applicable
    }

    const deathDate = a.dischargedAt ?? a.admittedAt;
    const ageGroup = classifyAge(patient.dateOfBirth, deathDate);
    const row = byAgeGroup.get(ageGroup)!;
    const insured = !!patient.nhisNumber;
    const gender = patient.gender === "MALE" ? "Male" : "Female";
    const key = `${insured ? "insured" : "uninsured"}Death${gender}` as keyof InpatientRowCounts;
    row[key] += 1;

    if (a.isMalariaCase) {
      const under5 = ageInCompletedYears(patient.dateOfBirth, deathDate) < 5;
      const field = `died${under5 ? "Under5" : "5Plus"}${gender}` as keyof MalariaSummary;
      malaria[field] += 1;
    }
  }

  const total = emptyRow();
  for (const g of AGE_GROUPS) {
    const row = byAgeGroup.get(g)!;
    (Object.keys(total) as (keyof InpatientRowCounts)[]).forEach((k) => {
      total[k] += row[k];
    });
  }

  return {
    rows: AGE_GROUPS.map((g) => ({ label: g, counts: byAgeGroup.get(g)! })),
    total,
    otherGenderCount,
    totalAdmissions: admissionsInPeriod.length,
    totalDeaths: deathsInPeriod.length,
    malaria,
  };
}
