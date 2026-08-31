import type { getOpdReport, OpdRowCounts } from "./queries";

// Flattens the OPD Attendance report into stable, human-readable cell codes
// for the DHIS2 mapping file (config/dhis2-mapping.json, section
// "opd-attendance"). One code per disaggregated count × age band —
// `${countKey}|${ageGroup}`, e.g. "insuredNewMale|20-34 Years". Derived
// row/column totals are not emitted; DHIS2 aggregates from the leaves.

type OpdReport = Awaited<ReturnType<typeof getOpdReport>>;

const COUNT_KEYS: (keyof OpdRowCounts)[] = [
  "insuredNewMale",
  "insuredNewFemale",
  "insuredOldMale",
  "insuredOldFemale",
  "uninsuredNewMale",
  "uninsuredNewFemale",
  "uninsuredOldMale",
  "uninsuredOldFemale",
];

export function opdAttendanceCells(report: OpdReport): { code: string; value: number }[] {
  const cells: { code: string; value: number }[] = [];
  for (const row of report.rows) {
    for (const key of COUNT_KEYS) {
      cells.push({ code: `${key}|${row.label}`, value: row.counts[key] });
    }
  }
  return cells;
}
