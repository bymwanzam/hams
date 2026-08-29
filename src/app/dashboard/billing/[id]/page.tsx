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
          <p className="eyebrow">
            <Link
              href={`/dashboard/patients/${invoice.patient.id}`}
              className="hover:underline"
            >
              {invoice.patient.hospitalNumber}
            </Link>
          </p>
          <h1 className="page-title">
            {invoice.patient.firstName} {invoice.patient.lastName}
          </h1>
          <p className="text-muted">
            Invoice created {new Date(invoice.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/billing/${invoice.id}/print`}
            className="btn btn-ghost"
          >
            Print Invoice
          </Link>
          <span
            className={`${invoiceStatusBadgeClass(invoice.status)}`}
          >
            {invoice.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {error && (
        <p className="callout callout-danger">
          {error}
        </p>
      )}

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((li) => (
              <tr key={li.id}>
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
            <tr className="matrix-divider font-medium">
              <td className="px-4 py-2" colSpan={3}>
                Total
              </td>
              <td className="px-4 py-2">{invoice.totalAmount.toString()}</td>
            </tr>
            <tr className="text-muted">
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

      <div className="card gap-3">
        <h2 className="card-title">Payments</h2>
        {invoice.payments.length === 0 ? (
          <p className="text-muted">No payments recorded yet.</p>
        ) : (
          <ul className="list text-sm">
            {invoice.payments.map((p) => (
              <li key={p.id} className="py-2 flex items-center justify-between">
                <span>
                  {paymentMethodLabel(p.method)}
                  {p.reference && (
                    <span className="text-muted"> — {p.reference}</span>
                  )}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-muted text-xs">
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
            className="flex items-end gap-2 pt-2  mt-2"
          >
            <div className="w-28">
              <label className="form-label">
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
                className="input input-sm"
              />
            </div>
            <div>
              <label className="form-label">
                Method
              </label>
              <select
                name="method"
                className="input input-sm"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {paymentMethodLabel(m)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="form-label">
                Reference
              </label>
              <input
                name="reference"
                placeholder="Transaction ID, cheque no., etc."
                className="input input-sm"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
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
            className="btn btn-ghost"
          >
            Void Invoice
          </button>
        </form>
      )}
    </div>
  );
}
