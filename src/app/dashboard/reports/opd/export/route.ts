import { getOpdReport, rowTotalMale, rowTotalFemale } from "../queries";
import { getFacilityName } from "@/lib/facility";
import { excelFileResponse, type ExcelSheetSpec } from "@/lib/excel";

// Same from/to handling as opd/page.tsx, so the export always matches
// whatever date range is currently on screen when "Export to Excel" is
// clicked (the button links here with the same ?from=&to= query params).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from") ?? undefined;
  const toParam = searchParams.get("to") ?? undefined;

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const from = fromParam ? new Date(fromParam) : defaultFrom;
  const toInclusive = toParam ? new Date(toParam) : defaultTo;
  const toExclusive = new Date(toInclusive.getTime() + 24 * 60 * 60 * 1000);

  const [report, facilityName] = await Promise.all([
    getOpdReport(from, toExclusive),
    getFacilityName(),
  ]);

  const sheet: ExcelSheetSpec = {
    name: "OPD Attendance",
    titleLines: [
      facilityName,
      "OPD Attendance Report",
      `${from.toLocaleDateString()} - ${toInclusive.toLocaleDateString()}`,
    ],
    columns: [
      { header: "Age Group", width: 18 },
      { header: "Insured New Male" },
      { header: "Insured New Female" },
      { header: "Insured Old Male" },
      { header: "Insured Old Female" },
      { header: "Uninsured New Male" },
      { header: "Uninsured New Female" },
      { header: "Uninsured Old Male" },
      { header: "Uninsured Old Female" },
      { header: "Total Male" },
      { header: "Total Female" },
    ],
    rows: report.rows.map((r) => [
      r.label,
      r.counts.insuredNewMale,
      r.counts.insuredNewFemale,
      r.counts.insuredOldMale,
      r.counts.insuredOldFemale,
      r.counts.uninsuredNewMale,
      r.counts.uninsuredNewFemale,
      r.counts.uninsuredOldMale,
      r.counts.uninsuredOldFemale,
      rowTotalMale(r.counts),
      rowTotalFemale(r.counts),
    ]),
    totalRow: [
      "Total All Ages",
      report.total.insuredNewMale,
      report.total.insuredNewFemale,
      report.total.insuredOldMale,
      report.total.insuredOldFemale,
      report.total.uninsuredNewMale,
      report.total.uninsuredNewFemale,
      report.total.uninsuredOldMale,
      report.total.uninsuredOldFemale,
      rowTotalMale(report.total),
      rowTotalFemale(report.total),
    ],
  };

  return excelFileResponse(
    [sheet],
    `opd-attendance-${from.toISOString().slice(0, 10)}-to-${toInclusive
      .toISOString()
      .slice(0, 10)}.xlsx`
  );
}
