import Link from "next/link";
import { getOpdReport, rowTotalMale, rowTotalFemale } from "./queries";
import { getFacilityName } from "@/lib/facility";
import PrintButton from "./PrintButton";

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function OpdReportPage({
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
  // Query uses an exclusive upper bound so the picked "to" day is fully included.
  const toExclusive = new Date(toInclusive.getTime() + 24 * 60 * 60 * 1000);

  const [report, facilityName] = await Promise.all([
    getOpdReport(from, toExclusive),
    getFacilityName(),
  ]);

  return (
    <div className="space-y-6 print:space-y-3">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            OPD Attendance Report
          </h1>
          <p className="text-sm text-slate-500">
            <Link href="/dashboard/reports" className="text-blue-600 hover:underline">
              ← Reports &amp; Analytics
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/dashboard/reports/opd/export?from=${toDateInputValue(from)}&to=${toDateInputValue(toInclusive)}`}
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
        <p className="text-sm">OPD Attendance Report</p>
        <p className="text-xs text-slate-500">
          {from.toLocaleDateString()} – {toInclusive.toLocaleDateString()}
        </p>
      </div>

      <p className="text-sm text-slate-500 print:hidden">
        {from.toLocaleDateString()} – {toInclusive.toLocaleDateString()} ·{" "}
        {report.totalVisits} OPD visit{report.totalVisits === 1 ? "" : "s"}
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
              <th rowSpan={2} colSpan={2} className="border border-slate-300 px-2 py-1.5 align-middle">
                TOTAL
              </th>
            </tr>
            <tr>
              <th colSpan={2} className="border border-slate-300 px-2 py-1.5">
                NEW
              </th>
              <th colSpan={2} className="border border-slate-300 px-2 py-1.5">
                OLD
              </th>
              <th colSpan={2} className="border border-slate-300 px-2 py-1.5">
                NEW
              </th>
              <th colSpan={2} className="border border-slate-300 px-2 py-1.5">
                OLD
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
                <Cell v={r.counts.insuredNewMale} />
                <Cell v={r.counts.insuredNewFemale} />
                <Cell v={r.counts.insuredOldMale} />
                <Cell v={r.counts.insuredOldFemale} />
                <Cell v={r.counts.uninsuredNewMale} />
                <Cell v={r.counts.uninsuredNewFemale} />
                <Cell v={r.counts.uninsuredOldMale} />
                <Cell v={r.counts.uninsuredOldFemale} />
                <Cell v={rowTotalMale(r.counts)} bold />
                <Cell v={rowTotalFemale(r.counts)} bold />
              </tr>
            ))}
            <tr className="font-semibold bg-slate-50">
              <td className="border border-slate-300 px-2 py-1.5 text-left">
                Total All Ages
              </td>
              <Cell v={report.total.insuredNewMale} />
              <Cell v={report.total.insuredNewFemale} />
              <Cell v={report.total.insuredOldMale} />
              <Cell v={report.total.insuredOldFemale} />
              <Cell v={report.total.uninsuredNewMale} />
              <Cell v={report.total.uninsuredNewFemale} />
              <Cell v={report.total.uninsuredOldMale} />
              <Cell v={report.total.uninsuredOldFemale} />
              <Cell v={rowTotalMale(report.total)} bold />
              <Cell v={rowTotalFemale(report.total)} bold />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Cell({ v, bold = false }: { v: number; bold?: boolean }) {
  return (
    <td
      className={`border border-slate-300 px-2 py-1.5 ${bold ? "font-semibold" : ""}`}
    >
      {v === 0 ? "—" : v}
    </td>
  );
}
