import Link from "next/link";
import { auth } from "@/auth";
import { getFacilityName } from "@/lib/facility";
import { AGE_GROUPS_SHORT } from "@/lib/ageGroups";
import PrintButton from "./PrintButton";
import { Dhis2PushButton } from "../Dhis2PushButton";
import { pushOpdMorbidityToDhis2 } from "../dhis2-actions";
import {
  getMorbidityReport,
  ageTotals,
  totalMale,
  totalFemale,
  grandTotal,
  type ElementCounts,
} from "./queries";

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// 1 label + 12 male + 12 female + 2 gender totals + 12 age totals + 1 grand total.
const COL_COUNT = 40;

export default async function MorbidityReportPage({
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
  const toExclusive = new Date(toInclusive.getTime() + 24 * 60 * 60 * 1000);

  const [report, facilityName, session] = await Promise.all([
    getMorbidityReport(from, toExclusive),
    getFacilityName(),
    auth(),
  ]);
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";

  return (
    <div className="space-y-6 print:space-y-3">
      {/* Wide statutory matrix — print it landscape so all 39 value columns fit. */}
      <style>{"@media print{@page{size:A4 landscape;margin:8mm}}"}</style>

      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="page-title">OPD Morbidity Report</h1>
          <p className="text-muted">
            <Link href="/dashboard/reports" className="btn btn-ghost">
              ← Reports &amp; Analytics
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dhis2PushButton
            action={pushOpdMorbidityToDhis2}
            reportTitle="OPD Morbidity"
            from={toDateInputValue(from)}
            to={toDateInputValue(toInclusive)}
            isAdmin={isAdmin}
            facilityName={facilityName}
          />
          <a
            href={`/dashboard/reports/morbidity/export?from=${toDateInputValue(from)}&to=${toDateInputValue(toInclusive)}`}
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
          <label className="form-label">From</label>
          <input
            type="date"
            name="from"
            defaultValue={toDateInputValue(from)}
            className="input input-sm"
          />
        </div>
        <div>
          <label className="form-label">To</label>
          <input
            type="date"
            name="to"
            defaultValue={toDateInputValue(toInclusive)}
            className="input input-sm"
          />
        </div>
        <button type="submit" className="btn btn-secondary">
          Apply
        </button>
      </form>

      <div className="hidden print:block text-center mb-2">
        <p className="font-bold text-lg">{facilityName}</p>
        <p className="text-sm">OPD Monthly Morbidity Report</p>
        <p className="text-xs text-muted">
          {from.toLocaleDateString()} – {toInclusive.toLocaleDateString()}
        </p>
      </div>

      <p className="text-muted print:hidden">
        {from.toLocaleDateString()} – {toInclusive.toLocaleDateString()} ·{" "}
        {report.encounterCount} OPD/emergency visit
        {report.encounterCount === 1 ? "" : "s"} · {report.diagnosisCount} diagnos
        {report.diagnosisCount === 1 ? "is" : "es"} classified
        {report.otherGenderCount > 0 &&
          ` (${report.otherGenderCount} excluded — gender recorded as Other)`}
      </p>

      <div className="panel overflow-x-auto print:border-0">
        <table className="table text-[11px] text-center border-collapse whitespace-nowrap">
          <thead className="font-semibold text-[color:var(--color-text)]">
            <tr>
              <th
                rowSpan={2}
                className="matrix-cell text-left align-bottom sticky left-0 z-20 bg-[color:var(--color-surface)]"
              >
                DATA ELEMENT
              </th>
              <th colSpan={12} className="matrix-cell">
                MALE
              </th>
              <th colSpan={12} className="matrix-cell">
                FEMALE
              </th>
              <th colSpan={2} className="matrix-cell">
                TOTAL
              </th>
              <th colSpan={12} className="matrix-cell">
                BY AGE GROUP (M+F)
              </th>
              <th rowSpan={2} className="matrix-cell align-bottom">
                TOTAL
              </th>
            </tr>
            <tr>
              {AGE_GROUPS_SHORT.map((a) => (
                <th key={`m-${a}`} className="matrix-cell">
                  {a}
                </th>
              ))}
              {AGE_GROUPS_SHORT.map((a) => (
                <th key={`f-${a}`} className="matrix-cell">
                  {a}
                </th>
              ))}
              <th className="matrix-cell">M</th>
              <th className="matrix-cell">F</th>
              {AGE_GROUPS_SHORT.map((a) => (
                <th key={`t-${a}`} className="matrix-cell">
                  {a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.sections.map((section) => (
              <SectionBlock key={section.title} title={section.title} rows={section.rows} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionBlock({
  title,
  rows,
}: {
  title: string;
  rows: { key: string; label: string; counts: ElementCounts }[];
}) {
  return (
    <>
      <tr>
        <td
          colSpan={COL_COUNT}
          className="matrix-cell text-left font-semibold uppercase tracking-wide bg-[color:var(--color-text)] text-[color:var(--color-surface)] p-0"
        >
          {/* Sticky on an inner span, not the colspan cell — a sticky
              colspan <td> in a border-collapse table renders unreliably. */}
          <span className="sticky left-0 inline-block px-2 py-[6px]">{title}</span>
        </td>
      </tr>
      {rows.map((r) => (
        <DataRow key={r.key} label={r.label} counts={r.counts} />
      ))}
    </>
  );
}

function DataRow({ label, counts }: { label: string; counts: ElementCounts }) {
  const byAge = ageTotals(counts);
  const m = totalMale(counts);
  const f = totalFemale(counts);
  return (
    <tr>
      <td className="matrix-cell text-left font-normal whitespace-normal min-w-[220px] sticky left-0 z-10 bg-[color:var(--color-surface)]">
        {label}
      </td>
      {counts.male.map((v, i) => (
        <Cell key={`m${i}`} v={v} />
      ))}
      {counts.female.map((v, i) => (
        <Cell key={`f${i}`} v={v} />
      ))}
      <Cell v={m} bold />
      <Cell v={f} bold />
      {byAge.map((v, i) => (
        <Cell key={`t${i}`} v={v} />
      ))}
      <Cell v={grandTotal(counts)} bold />
    </tr>
  );
}

function Cell({ v, bold = false }: { v: number; bold?: boolean }) {
  return (
    <td className={`matrix-cell ${bold ? "font-semibold" : ""}`}>{v}</td>
  );
}
