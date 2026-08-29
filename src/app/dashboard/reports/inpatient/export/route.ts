import { getInpatientReport } from "../queries";
import { getFacilityName } from "@/lib/facility";
import { excelFileResponse, type ExcelSheetSpec } from "@/lib/excel";

// Same from/to handling as inpatient/page.tsx, so the export always matches
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
    getInpatientReport(from, toExclusive),
    getFacilityName(),
  ]);

  const dateRangeLine = `${from.toLocaleDateString()} - ${toInclusive.toLocaleDateString()}`;

  const admissionsSheet: ExcelSheetSpec = {
    name: "Admissions & Deaths",
    titleLines: [facilityName, "Inpatient Admissions & Deaths Report", dateRangeLine],
    columns: [
      { header: "Age Group", width: 18 },
      { header: "Insured Admission Male" },
      { header: "Insured Admission Female" },
      { header: "Insured Death Male" },
      { header: "Insured Death Female" },
      { header: "Uninsured Admission Male" },
      { header: "Uninsured Admission Female" },
      { header: "Uninsured Death Male" },
      { header: "Uninsured Death Female" },
    ],
    rows: report.rows.map((r) => [
      r.label,
      r.counts.insuredAdmissionMale,
      r.counts.insuredAdmissionFemale,
      r.counts.insuredDeathMale,
      r.counts.insuredDeathFemale,
      r.counts.uninsuredAdmissionMale,
      r.counts.uninsuredAdmissionFemale,
      r.counts.uninsuredDeathMale,
      r.counts.uninsuredDeathFemale,
    ]),
    totalRow: [
      "Total All Ages",
      report.total.insuredAdmissionMale,
      report.total.insuredAdmissionFemale,
      report.total.insuredDeathMale,
      report.total.insuredDeathFemale,
      report.total.uninsuredAdmissionMale,
      report.total.uninsuredAdmissionFemale,
      report.total.uninsuredDeathMale,
      report.total.uninsuredDeathFemale,
    ],
  };

  const malariaSheet: ExcelSheetSpec = {
    name: "Malaria Summary",
    titleLines: [facilityName, "Summary of Inpatient Malaria Cases", dateRangeLine],
    columns: [
      { header: "Category", width: 46 },
      { header: "Male" },
      { header: "Female" },
    ],
    rows: [
      [
        "Patients below 5 years of age admitted with malaria",
        report.malaria.admittedUnder5Male,
        report.malaria.admittedUnder5Female,
      ],
      [
        "Patients 5 years and above admitted with malaria",
        report.malaria.admitted5PlusMale,
        report.malaria.admitted5PlusFemale,
      ],
      [
        "Patients below 5 years of age dying of malaria",
        report.malaria.diedUnder5Male,
        report.malaria.diedUnder5Female,
      ],
      [
        "Patients 5 years and above dying of malaria",
        report.malaria.died5PlusMale,
        report.malaria.died5PlusFemale,
      ],
    ],
  };

  return excelFileResponse(
    [admissionsSheet, malariaSheet],
    `inpatient-report-${from.toISOString().slice(0, 10)}-to-${toInclusive
      .toISOString()
      .slice(0, 10)}.xlsx`
  );
}
