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
          <h1 className="text-xl font-semibold text-slate-800">
            Billing &amp; Payments
          </h1>
          <p className="text-sm text-slate-500">
            Invoices, cash / mobile money / card payments.
          </p>
        </div>
        <Link
          href="/dashboard/billing/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
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
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Patient</th>
              <th className="text-left px-4 py-2">Created</th>
              <th className="text-left px-4 py-2">Total (GHS)</th>
              <th className="text-left px-4 py-2">Paid (GHS)</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
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
                <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link
                      href={`/dashboard/billing/${inv.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {inv.patient.firstName} {inv.patient.lastName}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {inv.patient.hospitalNumber}
                    </p>
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">{inv.totalAmount.toString()}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {paid.toFixed(2)}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${invoiceStatusBadgeClass(inv.status)}`}
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
