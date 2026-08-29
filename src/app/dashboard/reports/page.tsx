import Link from "next/link";
import { getReportsData } from "./queries";
import BarList from "./BarList";
import { serviceTypeLabel } from "../appointments/labels";
import { encounterTypeLabel } from "../encounters/labels";
import { paymentMethodLabel } from "../billing/labels";

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const GHS = (n: number) =>
  `GHS ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default async function ReportsPage() {
  const data = await getReportsData();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Reports &amp; Analytics
          </h1>
          <p className="text-muted">
            Snapshot across front desk, clinical, laboratory, pharmacy and
            billing.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/dashboard/reports/opd"
            className="btn btn-ghost"
          >
            OPD Attendance Report →
          </Link>
          <Link
            href="/dashboard/reports/inpatient"
            className="btn btn-ghost"
          >
            Inpatient Report →
          </Link>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Registered Patients" value={data.totalPatients} />
        <StatCard label="Currently Admitted" value={data.activeAdmissions} />
        <StatCard label="Appointments Today" value={data.appointmentsToday} />
        <StatCard
          label="Outstanding Balance"
          value={GHS(data.outstanding)}
          tone={data.outstanding > 0 ? "amber" : "green"}
        />
      </div>

      {/* Front desk */}
      <Section title="Appointments">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="eyebrow mb-2">
              By Service
            </p>
            <BarList
              items={data.appointmentsByService.map((g) => ({
                label: serviceTypeLabel(g.key),
                value: g.count,
              }))}
            />
          </div>
          <div>
            <p className="eyebrow mb-2">
              By Specialist Department
            </p>
            <BarList
              items={data.specialistByDepartment.map((g) => ({
                label: g.key,
                value: g.count,
              }))}
            />
          </div>
        </div>
      </Section>

      {/* Clinical */}
      <Section title="Consultations">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="eyebrow mb-2">
              By Type
            </p>
            <BarList
              items={data.encountersByType.map((g) => ({
                label: encounterTypeLabel(g.key),
                value: g.count,
              }))}
            />
          </div>
          <div>
            <p className="eyebrow mb-2">
              By Status
            </p>
            <BarList
              items={data.encountersByStatus.map((g) => ({
                label: titleCase(g.key),
                value: g.count,
              }))}
            />
          </div>
        </div>
      </Section>

      {/* Laboratory */}
      <Section title="Laboratory">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="eyebrow mb-2">
              Orders by Status
            </p>
            <BarList
              items={data.labOrdersByStatus.map((g) => ({
                label: titleCase(g.key),
                value: g.count,
              }))}
            />
          </div>
          <div>
            <p className="eyebrow mb-2">
              Catalog Health
            </p>
            <p className="text-sm text-muted">
              {data.unavailableLabTests === 0 ? (
                "All tests currently available."
              ) : (
                <>
                  <span className="font-[600] text-[color:var(--color-accent-700)]">
                    {data.unavailableLabTests}
                  </span>{" "}
                  test{data.unavailableLabTests === 1 ? "" : "s"} marked not
                  available.
                </>
              )}
            </p>
          </div>
        </div>
      </Section>

      {/* Pharmacy */}
      <Section title="Pharmacy">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="eyebrow mb-2">
              Top Dispensed Drugs
            </p>
            <BarList
              items={data.topDrugs.map((d) => ({
                label: d.drug.name,
                value: d.quantity,
              }))}
            />
          </div>
          <div>
            <p className="eyebrow mb-2">
              Low Stock
            </p>
            {data.lowStockDrugs.length === 0 ? (
              <p className="text-muted">
                No drugs at or below reorder level.
              </p>
            ) : (
              <ul className="text-sm list">
                {data.lowStockDrugs.map((d) => (
                  <li key={d.id} className="py-1.5 flex justify-between">
                    <span>{d.name}</span>
                    <span
                      className={
                        d.quantityOnHand === 0
                          ? "text-[color:var(--color-accent-700)] font-[700]"
                          : "text-[color:var(--color-accent-700)] font-[600]"
                      }
                    >
                      {d.quantityOnHand} / {d.reorderLevel}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Section>

      {/* Billing */}
      <Section title="Billing &amp; Revenue">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard label="Total Invoiced" value={GHS(data.totalInvoiced)} />
          <StatCard label="Total Collected" value={GHS(data.totalCollected)} />
          <StatCard
            label="Collected (Last 30 Days)"
            value={GHS(data.collectedLast30Days)}
          />
        </div>
        <p className="eyebrow mb-2">
          Collected by Method (Last 30 Days)
        </p>
        <BarList
          items={data.paymentsByMethod.map((g) => ({
            label: paymentMethodLabel(g.key),
            value: g.amount,
          }))}
          formatValue={GHS}
        />
      </Section>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "amber" | "green";
}) {
  const valueClass =
    tone === "amber" || tone === "green"
      ? "text-[color:var(--color-accent-700)]"
      : "text-[color:var(--color-text)]";

  return (
    <div className="card">
      <p className="card-kicker">{label}</p>
      <p className={`text-[26px] font-[800] leading-none ${valueClass}`}>{value}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <h2 className="card-title mb-4">{title}</h2>
      {children}
    </div>
  );
}
