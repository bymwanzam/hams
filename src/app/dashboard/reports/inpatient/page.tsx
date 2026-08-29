import Link from "next/link";
import { getInpatientReport } from "./queries";
import { getPrimaryFacilityName } from "@/lib/facility";
import PrintButton from "./PrintButton";

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function InpatientReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from: fromParam, to: toParam } = await searchParams;

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const from = fromParam ? new Date(fromParam) : defaultFrom;
  const toInclusive = toParam ? new Date(toParam) : defaultTo;
  const toExclusive = new Date(toInclusive.getTime() + 24 * 60 * 60 * 1000);

  const [report, facilityName] = await Promise.all([
    getInpatientReport(from, toExclusive),
    getPrimaryFacilityName(),
  ]);

  return (
    <div className="space-y-6 print:space-y-3">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Inpatient Admissions &amp; Deaths Report
          </h1>
          <p className="text-sm text-slate-500">
            <Link href="/dashboard/reports" className="text-blue-600 hover:underline">
              ← Reports &amp; Analytics
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/dashboard/reports/inpatient/export?from=${toDateInputValue(from)}&to=${toDateInputValue(toInclusive)}`}
            className="bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Export to Excel
          </a>
          <PrintButton />
        </div>
      </div>

      <form className="flex items-end gap-3 print:hidden">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            From
          </label>
          <input
            type="date"
            name="from"
            defaultValue={toDateInputValue(from)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            To
          </label>
          <input
            type="date"
            name="to"
            defaultValue={toDateInputValue(toInclusive)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          Apply
        </button>
      </form>

      <div className="hidden print:block text-center mb-2">
        <p className="font-bold text-lg">{facilityName}</p>
        <p className="text-sm">Inpatient Admissions &amp; Deaths Report</p>
        <p className="text-xs text-slate-500">
          {from.toLocaleDateString()} – {toInclusive.toLocaleDateString()}
        </p>
      </div>

      <p className="text-sm text-slate-500 print:hidden">
        {from.toLocaleDateString()} – {toInclusive.toLocaleDateString()} ·{" "}
        {report.totalAdmissions} admission{report.totalAdmissions === 1 ? "" : "s"},{" "}
        {report.totalDeaths} death{report.totalDeaths === 1 ? "" : "s"}
        {report.otherGenderCount > 0 &&
          ` (${report.otherGenderCount} excluded from Male/Female columns — gender recorded as Other)`}
      </p>

      <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl print:border-0 print:rounded-none">
        <table className="w-full text-xs text-center border-collapse">
          <thead className="font-semibold text-slate-700">
            <tr>
              <th rowSpan={3} className="border border-slate-300 px-2 py-2 text-left align-bottom">
                AGE GROUPS
              </th>
              <th colSpan={4} className="border border-slate-300 px-2 py-1.5">
                INSURED PATIENTS
              </th>
              <th colSpan={4} className="border border-slate-300 px-2 py-1.5">
                NON-INSURED PATIENTS
              </th>
            </tr>
            <tr>
              <th colSpan={2} className="border border-slate-300 px-2 py-1.5">
                ADMISSION
              </th>
              <th colSpan={2} className="border border-slate-300 px-2 py-1.5">
                DEATH
              </th>
              <th colSpan={2} className="border border-slate-300 px-2 py-1.5">
                ADMISSION
              </th>
              <th colSpan={2} className="border border-slate-300 px-2 py-1.5">
                DEATH
              </th>
            </tr>
            <tr>
              <th className="border border-slate-300 px-2 py-1.5">MALE</th>
              <th className="border border-slate-300 px-2 py-1.5">FEMALE</th>
              <th className="border border-slate-300 px-2 py-1.5">MALE</th>
              <th className="border border-slate-300 px-2 py-1.5">FEMALE</th>
              <th className="border border-slate-300 px-2 py-1.5">MALE</th>
              <th className="border border-slate-300 px-2 py-1.5">FEMALE</th>
              <th className="border border-slate-300 px-2 py-1.5">MALE</th>
              <th className="border border-slate-300 px-2 py-1.5">FEMALE</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.map((r) => (
              <tr key={r.label}>
                <td className="border border-slate-300 px-2 py-1.5 text-left">
                  {r.label}
                </td>
                <Cell v={r.counts.insuredAdmissionMale} />
                <Cell v={r.counts.insuredAdmissionFemale} />
                <Cell v={r.counts.insuredDeathMale} />
                <Cell v={r.counts.insuredDeathFemale} />
                <Cell v={r.counts.uninsuredAdmissionMale} />
                <Cell v={r.counts.uninsuredAdmissionFemale} />
                <Cell v={r.counts.uninsuredDeathMale} />
                <Cell v={r.counts.uninsuredDeathFemale} />
              </tr>
            ))}
            <tr className="font-semibold bg-slate-50">
              <td className="border border-slate-300 px-2 py-1.5 text-left">
                Total All Ages
              </td>
              <Cell v={report.total.insuredAdmissionMale} />
              <Cell v={report.total.insuredAdmissionFemale} />
              <Cell v={report.total.insuredDeathMale} />
              <Cell v={report.total.insuredDeathFemale} />
              <Cell v={report.total.uninsuredAdmissionMale} />
              <Cell v={report.total.uninsuredAdmissionFemale} />
              <Cell v={report.total.uninsuredDeathMale} />
              <Cell v={report.total.uninsuredDeathFemale} />
            </tr>
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl print:border-0 print:rounded-none print:mt-4">
        <table className="w-full text-xs text-center border-collapse">
          <thead className="font-semibold text-slate-700">
            <tr>
              <th className="border border-slate-300 px-3 py-2 text-left">
                SUMMARY OF INPATIENT MALARIA CASES
              </th>
              <th className="border border-slate-300 px-2 py-2">MALE</th>
              <th className="border border-slate-300 px-2 py-2">FEMALE</th>
            </tr>
          </thead>
          <tbody>
            <MalariaRow
              label="Number of Patients below 5 years of Age Admitted with Malaria"
              male={report.malaria.admittedUnder5Male}
              female={report.malaria.admittedUnder5Female}
            />
            <MalariaRow
              label="Number of Patients 5 years and above Admitted with Malaria"
              male={report.malaria.admitted5PlusMale}
              female={report.malaria.admitted5PlusFemale}
            />
            <MalariaRow
              label="Number of Patients below 5 years of Age Dying of Malaria"
              male={report.malaria.diedUnder5Male}
              female={report.malaria.diedUnder5Female}
            />
            <MalariaRow
              label="Number of Patients 5 years and above Dying of Malaria"
              male={report.malaria.died5PlusMale}
              female={report.malaria.died5PlusFemale}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Cell({ v }: { v: number }) {
  return (
    <td className="border border-slate-300 px-2 py-1.5">{v === 0 ? "—" : v}</td>
  );
}

function MalariaRow({
  label,
  male,
  female,
}: {
  label: string;
  male: number;
  female: number;
}) {
  return (
    <tr>
      <td className="border border-slate-300 px-3 py-1.5 text-left">{label}</td>
      <Cell v={male} />
      <Cell v={female} />
    </tr>
  );
}
