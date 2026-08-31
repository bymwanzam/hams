import Link from "next/link";
import { auth } from "@/auth";
import { getInpatientReport } from "./queries";
import { getFacilityName } from "@/lib/facility";
import PrintButton from "./PrintButton";
import { Dhis2PushButton } from "../Dhis2PushButton";
import { pushInpatientToDhis2 } from "../dhis2-actions";

function toDateInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function InpatientReportPage({
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
    getInpatientReport(from, toExclusive),
    getFacilityName(),
    auth(),
  ]);
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";

  return (
    <div className="space-y-6 print:space-y-3">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="page-title">
            Inpatient Admissions &amp; Deaths Report
          </h1>
          <p className="text-muted">
            <Link href="/dashboard/reports" className="btn btn-ghost">
              ← Reports &amp; Analytics
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dhis2PushButton
            action={pushInpatientToDhis2}
            reportTitle="Inpatient Admissions & Deaths"
            from={toDateInputValue(from)}
            to={toDateInputValue(toInclusive)}
            isAdmin={isAdmin}
            facilityName={facilityName}
          />
          <a
            href={`/dashboard/reports/inpatient/export?from=${toDateInputValue(from)}&to=${toDateInputValue(toInclusive)}`}
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
        <p className="text-sm">Inpatient Admissions &amp; Deaths Report</p>
        <p className="text-xs text-muted">
          {from.toLocaleDateString()} – {toInclusive.toLocaleDateString()}
        </p>
      </div>

      <p className="text-muted print:hidden">
        {from.toLocaleDateString()} – {toInclusive.toLocaleDateString()} ·{" "}
        {report.totalAdmissions} admission{report.totalAdmissions === 1 ? "" : "s"},{" "}
        {report.totalDeaths} death{report.totalDeaths === 1 ? "" : "s"}
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
            </tr>
            <tr>
              <th colSpan={2} className="matrix-cell">
                ADMISSION
              </th>
              <th colSpan={2} className="matrix-cell">
                DEATH
              </th>
              <th colSpan={2} className="matrix-cell">
                ADMISSION
              </th>
              <th colSpan={2} className="matrix-cell">
                DEATH
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
            </tr>
          </thead>
          <tbody>
            {report.rows.map((r) => (
              <tr key={r.label}>
                <td className="matrix-cell text-left">
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
            <tr className="font-[600] bg-[var(--color-surface)]">
              <td className="matrix-cell text-left">
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

      <div className="panel overflow-x-auto print:border-0 print:mt-4">
        <table className="table text-xs text-center border-collapse">
          <thead className="font-semibold text-[color:var(--color-text)]">
            <tr>
              <th className="matrix-cell text-left">
                SUMMARY OF INPATIENT MALARIA CASES
              </th>
              <th className="matrix-cell">MALE</th>
              <th className="matrix-cell">FEMALE</th>
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
    <td className="matrix-cell">{v}</td>
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
      <td className="matrix-cell text-left">{label}</td>
      <Cell v={male} />
      <Cell v={female} />
    </tr>
  );
}
