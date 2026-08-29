import Link from "next/link";
import { listInvoices, hasBillingAccess } from "./actions";
import { invoiceStatusBadgeClass } from "./labels";
import AccessRestricted from "./AccessRestricted";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!(await hasBillingAccess())) {
    return <AccessRestricted />;
  }

  const { q } = await searchParams;
  const invoices = await listInvoices(q ?? "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Billing &amp; Payments
          </h1>
          <p className="text-muted">
            Invoices, cash / mobile money / card payments.
          </p>
        </div>
        <Link
          href="/dashboard/billing/new"
          className="btn btn-primary"
        >
          + New Invoice
        </Link>
      </div>

      <form className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by patient name or hospital no."
          className="input"
        />
      </form>

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Created</th>
              <th>Total (GHS)</th>
              <th>Paid (GHS)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted">
                  No invoices found.
                </td>
              </tr>
            )}
            {invoices.map((inv) => {
              const paid = inv.payments.reduce(
                (sum, p) => sum + Number(p.amount),
                0
              );
              return (
                <tr key={inv.id}>
                  <td className="px-4 py-2">
                    <Link
                      href={`/dashboard/billing/${inv.id}`}
                      className="btn btn-ghost"
                    >
                      {inv.patient.firstName} {inv.patient.lastName}
                    </Link>
                    <p className="eyebrow">
                      {inv.patient.hospitalNumber}
                    </p>
                  </td>
                  <td className="px-4 py-2 text-muted">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">{inv.totalAmount.toString()}</td>
                  <td className="px-4 py-2 text-muted">
                    {paid.toFixed(2)}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`${invoiceStatusBadgeClass(inv.status)}`}
                    >
                      {inv.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
