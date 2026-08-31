import Link from "next/link";
import { auth } from "@/auth";
import { getOpdReport, rowTotalMale, rowTotalFemale } from "./queries";
import { getFacilityName } from "@/lib/facility";
import PrintButton from "./PrintButton";
import { Dhis2PushButton } from "../Dhis2PushButton";
import { pushOpdAttendanceToDhis2 } from "../dhis2-actions";

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function OpdReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    dhis2?: string;
    dhis2error?: string;
  }>;
}) {
  const { from: fromParam, to: toParam, dhis2, dhis2error } = await searchParams;

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const from = fromParam ? new Date(fromParam) : defaultFrom;
  const toInclusive = toParam ? new Date(toParam) : defaultTo;
  // Query uses an exclusive upper bound so the picked "to" day is fully included.
  const toExclusive = new Date(toInclusive.getTime() + 24 * 60 * 60 * 1000);

  const [report, facilityName, session] = await Promise.all([
    getOpdReport(from, toExclusive),
    getFacilityName(),
    auth(),
  ]);
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";

  return (
    <div className="space-y-6 print:space-y-3">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="page-title">
            OPD Attendance Report
          </h1>
          <p className="text-muted">
            <Link href="/dashboard/reports" className="btn btn-ghost">
              ← Reports &amp; Analytics
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dhis2PushButton
            action={pushOpdAttendanceToDhis2}
            reportTitle="OPD Attendance"
            from={toDateInputValue(from)}
            to={toDateInputValue(toInclusive)}
            isAdmin={isAdmin}
            facilityName={facilityName}
          />
          <a
            href={`/dashboard/reports/opd/export?from=${toDateInputValue(from)}&to=${toDateInputValue(toInclusive)}`}
            className="btn btn-secondary"
          >
            Export to Excel
          </a>
          <PrintButton />
        </div>
      </div>

      {dhis2 && (
        <p className="callout callout-success print:hidden">DHIS2: {dhis2}</p>
      )}
      {dhis2error && (
        <p className="callout callout-danger print:hidden">DHIS2: {dhis2error}</p>
      )}

      <form className="flex items-end gap-3 print:hidden">
        <div>
          <label className="form-label">
            From
          </label>
          <input
            type="date"
            name="from"
            defaultValue={toDateInputValue(from)}
            className="input input-sm"
          />
        </div>
        <div>
          <label className="form-label">
            To
          </label>
          <input
            type="date"
            name="to"
            defaultValue={toDateInputValue(toInclusive)}
            className="input input-sm"
          />
        </div>
        <button
          type="submit"
          className="btn btn-secondary"
        >
          Apply
        </button>
      </form>

      <div className="hidden print:block text-center mb-2">
        <p className="font-bold text-lg">{facilityName}</p>
        <p className="text-sm">OPD Attendance Report</p>
        <p className="text-xs text-muted">
          {from.toLocaleDateString()} – {toInclusive.toLocaleDateString()}
        </p>
      </div>

      <p className="text-muted print:hidden">
        {from.toLocaleDateString()} – {toInclusive.toLocaleDateString()} ·{" "}
        {report.totalVisits} OPD visit{report.totalVisits === 1 ? "" : "s"}
        {report.otherGenderCount > 0 &&
          ` (${report.otherGenderCount} excluded from Male/Female columns — gender recorded as Other)`}
      </p>

      <div className="panel overflow-x-auto print:border-0">
        <table className="table text-xs text-center border-collapse">
          <thead className="font-semibold text-[color:var(--color-text)]">
            <tr>
              <th rowSpan={3} className="matrix-cell text-left align-bottom">
                AGE GROUPS
              </th>
              <th colSpan={4} className="matrix-cell">
                INSURED PATIENTS
              </th>
              <th colSpan={4} className="matrix-cell">
                NON-INSURED PATIENTS
              </th>
              <th rowSpan={2} colSpan={2} className="matrix-cell align-middle">
                TOTAL
              </th>
            </tr>
            <tr>
              <th colSpan={2} className="matrix-cell">
                NEW
              </th>
              <th colSpan={2} className="matrix-cell">
                OLD
              </th>
              <th colSpan={2} className="matrix-cell">
                NEW
              </th>
              <th colSpan={2} className="matrix-cell">
                OLD
              </th>
            </tr>
            <tr>
              <th className="matrix-cell">MALE</th>
              <th className="matrix-cell">FEMALE</th>
              <th className="matrix-cell">MALE</th>
              <th className="matrix-cell">FEMALE</th>
              <th className="matrix-cell">MALE</th>
              <th className="matrix-cell">FEMALE</th>
              <th className="matrix-cell">MALE</th>
              <th className="matrix-cell">FEMALE</th>
              <th className="matrix-cell">MALE</th>
              <th className="matrix-cell">FEMALE</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.map((r) => (
              <tr key={r.label}>
                <td className="matrix-cell text-left">
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
            <tr className="font-[600] bg-[var(--color-surface)]">
              <td className="matrix-cell text-left">
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
      className={`matrix-cell ${bold ? "font-semibold" : ""}`}
    >
      {v}
    </td>
  );
}
