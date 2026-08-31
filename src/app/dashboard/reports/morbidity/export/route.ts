import { getMorbidityReport, totalMale, totalFemale, grandTotal } from "../queries";
import { getFacilityName } from "@/lib/facility";
import { AGE_GROUPS_SHORT } from "@/lib/ageGroups";
import { excelFileResponse, type ExcelSheetSpec } from "@/lib/excel";

// Same from/to handling as morbidity/page.tsx, so the export always matches
// the date range currently on screen when "Export to Excel" is clicked.
// The sheet uses a flat one-row header (Section, Data Element, then a column
// per age band × gender) rather than the merged on-screen header — that's
// what makes it sortable and pivot-friendly in Excel.
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
    getMorbidityReport(from, toExclusive),
    getFacilityName(),
  ]);

  const columns = [
    { header: "Section", width: 28 },
    { header: "Data Element", width: 44 },
    ...AGE_GROUPS_SHORT.map((a) => ({ header: `M ${a}` })),
    ...AGE_GROUPS_SHORT.map((a) => ({ header: `F ${a}` })),
    { header: "Total M" },
    { header: "Total F" },
    { header: "Total" },
  ];

  const rows: (string | number)[][] = report.sections.flatMap((section) =>
    section.rows.map((r) => [
      section.title,
      r.label,
      ...r.counts.male,
      ...r.counts.female,
      totalMale(r.counts),
      totalFemale(r.counts),
      grandTotal(r.counts),
    ])
  );

  const sheet: ExcelSheetSpec = {
    name: "OPD Morbidity",
    titleLines: [
      facilityName,
      "OPD Monthly Morbidity Report",
      `${from.toLocaleDateString()} - ${toInclusive.toLocaleDateString()}`,
    ],
    columns,
    rows,
  };

  return excelFileResponse(
    [sheet],
    `opd-morbidity-${from.toISOString().slice(0, 10)}-to-${toInclusive
      .toISOString()
      .slice(0, 10)}.xlsx`
  );
}
