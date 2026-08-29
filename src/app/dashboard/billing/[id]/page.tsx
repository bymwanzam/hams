import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getInvoice,
  recordPayment,
  voidInvoice,
  hasBillingAccess,
} from "../actions";
import { invoiceStatusBadgeClass, paymentMethodLabel, PAYMENT_METHODS } from "../labels";
import AccessRestricted from "../AccessRestricted";

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await hasBillingAccess())) {
    return <AccessRestricted />;
  }

  const { id } = await params;
  const { error } = await searchParams;

  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = Number(invoice.totalAmount) - paid;
  const isVoid = invoice.status === "VOID";
  const isPaid = invoice.status === "PAID";
  const recordPaymentWithId = recordPayment.bind(null, invoice.id);
  const voidInvoiceWithId = voidInvoice.bind(null, invoice.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400">
            <Link
              href={`/dashboard/patients/${invoice.patient.id}`}
              className="hover:underline"
            >
              {invoice.patient.hospitalNumber}
            </Link>
          </p>
          <h1 className="text-xl font-semibold text-slate-800">
            {invoice.patient.firstName} {invoice.patient.lastName}
          </h1>
          <p className="text-sm text-slate-500">
            Invoice created {new Date(invoice.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/billing/${invoice.id}/print`}
            className="text-sm text-blue-600 hover:underline"
          >
            Print Invoice
          </Link>
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${invoiceStatusBadgeClass(invoice.status)}`}
          >
            {invoice.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Description</th>
              <th className="text-left px-4 py-2">Qty</th>
              <th className="text-left px-4 py-2">Unit Price</th>
              <th className="text-left px-4 py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((li) => (
              <tr key={li.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{li.description}</td>
                <td className="px-4 py-2">{li.quantity}</td>
                <td className="px-4 py-2">{li.unitPrice.toString()}</td>
                <td className="px-4 py-2">
                  {(Number(li.unitPrice) * li.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 font-medium">
              <td className="px-4 py-2" colSpan={3}>
                Total
              </td>
              <td className="px-4 py-2">{invoice.totalAmount.toString()}</td>
            </tr>
            <tr className="text-slate-500">
              <td className="px-4 py-2" colSpan={3}>
                Paid
              </td>
              <td className="px-4 py-2">{paid.toFixed(2)}</td>
            </tr>
            <tr className="font-medium">
              <td className="px-4 py-2" colSpan={3}>
                Balance
              </td>
              <td className="px-4 py-2">{balance.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Payments</h2>
        {invoice.payments.length === 0 ? (
          <p className="text-sm text-slate-400">No payments recorded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {invoice.payments.map((p) => (
              <li key={p.id} className="py-2 flex items-center justify-between">
                <span>
                  {paymentMethodLabel(p.method)}
                  {p.reference && (
                    <span className="text-slate-400"> — {p.reference}</span>
                  )}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-slate-400 text-xs">
                    {new Date(p.paidAt).toLocaleString()}
                  </span>
                  <span className="font-medium">
                    GHS {Number(p.amount).toFixed(2)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}

        {!isVoid && !isPaid && (
          <form
            action={recordPaymentWithId}
            className="flex items-end gap-2 pt-2 border-t border-slate-100 mt-2"
          >
            <div className="w-28">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Amount (GHS)
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={balance > 0 ? balance : undefined}
                required
                defaultValue={balance > 0 ? balance.toFixed(2) : undefined}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Method
              </label>
              <select
                name="method"
                className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {paymentMethodLabel(m)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Reference
              </label>
              <input
                name="reference"
                placeholder="Transaction ID, cheque no., etc."
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
            >
              Record Payment
            </button>
          </form>
        )}
      </div>

      {!isVoid && invoice.payments.length === 0 && (
        <form action={voidInvoiceWithId}>
          <button
            type="submit"
            className="text-sm text-red-600 hover:underline"
          >
            Void Invoice
          </button>
        </form>
      )}
    </div>
  );
}
