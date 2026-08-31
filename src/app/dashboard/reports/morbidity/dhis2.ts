import { AGE_GROUPS } from "@/lib/ageGroups";
import type { getMorbidityReport } from "./queries";

// Flattens the OPD Morbidity report into cell codes for the DHIS2 mapping
// file (config/dhis2-mapping.json, section "opd-morbidity"). One code per
// data element × sex × age band — `${elementKey}|${M|F}|${ageGroup}`, e.g.
// "uncomplicated_malaria_treated|M|20-34 Years". ~2640 codes; any not
// present in the mapping file are skipped and reported back.

type MorbidityReport = Awaited<ReturnType<typeof getMorbidityReport>>;

export function morbidityCells(report: MorbidityReport): { code: string; value: number }[] {
  const cells: { code: string; value: number }[] = [];
  for (const section of report.sections) {
    for (const row of section.rows) {
      AGE_GROUPS.forEach((ageGroup, i) => {
        cells.push({ code: `${row.key}|M|${ageGroup}`, value: row.counts.male[i] });
        cells.push({ code: `${row.key}|F|${ageGroup}`, value: row.counts.female[i] });
      });
    }
  }
  return cells;
}
