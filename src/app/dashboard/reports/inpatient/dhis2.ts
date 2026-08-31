import type { getInpatientReport, InpatientRowCounts, MalariaSummary } from "./queries";

// Flattens the Inpatient Admissions & Deaths report into cell codes for the
// DHIS2 mapping file (config/dhis2-mapping.json, section "inpatient").
//   - `${countKey}|${ageGroup}` for the 8 admission/death disaggregations
//   - `malaria|${admitted|died}|${under5|5plus}|${Male|Female}` for the
//     malaria summary rows

type InpatientReport = Awaited<ReturnType<typeof getInpatientReport>>;

const COUNT_KEYS: (keyof InpatientRowCounts)[] = [
  "insuredAdmissionMale",
  "insuredAdmissionFemale",
  "insuredDeathMale",
  "insuredDeathFemale",
  "uninsuredAdmissionMale",
  "uninsuredAdmissionFemale",
  "uninsuredDeathMale",
  "uninsuredDeathFemale",
];

// MalariaSummary key -> pipe-form code suffix.
const MALARIA_CODES: Record<keyof MalariaSummary, string> = {
  admittedUnder5Male: "malaria|admitted|under5|Male",
  admittedUnder5Female: "malaria|admitted|under5|Female",
  admitted5PlusMale: "malaria|admitted|5plus|Male",
  admitted5PlusFemale: "malaria|admitted|5plus|Female",
  diedUnder5Male: "malaria|died|under5|Male",
  diedUnder5Female: "malaria|died|under5|Female",
  died5PlusMale: "malaria|died|5plus|Male",
  died5PlusFemale: "malaria|died|5plus|Female",
};

export function inpatientCells(report: InpatientReport): { code: string; value: number }[] {
  const cells: { code: string; value: number }[] = [];
  for (const row of report.rows) {
    for (const key of COUNT_KEYS) {
      cells.push({ code: `${key}|${row.label}`, value: row.counts[key] });
    }
  }
  for (const key of Object.keys(MALARIA_CODES) as (keyof MalariaSummary)[]) {
    cells.push({ code: MALARIA_CODES[key], value: report.malaria[key] });
  }
  return cells;
}
