import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoice, hasBillingAccess } from "../../actions";
import { invoiceStatusBadgeClass, paymentMethodLabel } from "../../labels";
import { getFacility, DEFAULT_ORG_NAME } from "@/lib/facility";
import PrintButton from "../../PrintButton";
import AccessRestricted from "../../AccessRestricted";

export default async function PrintInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await hasBillingAccess())) {
    return <AccessRestricted />;
  }

  const { id } = await params;
  const [invoice, facility] = await Promise.all([
    getInvoice(id),
    getFacility(),
  ]);
  if (!invoice) notFound();

  const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = Number(invoice.totalAmount) - paid;

  return (
    <div className="space-y-6 print:space-y-0">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="page-title">
            Print Invoice
          </h1>
          <p className="text-muted">
            <Link
              href={`/dashboard/billing/${invoice.id}`}
              className="btn btn-ghost"
            >
              ← Back to invoice
            </Link>
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="panel mx-auto max-w-2xl p-8 print:max-w-none print:border-0 print:p-0">
        <div className="flex items-start justify-between matrix-divider pb-6 mb-6">
          <div>
            <p className="text-lg font-bold text-[color:var(--color-text)]">
              {facility?.name ?? DEFAULT_ORG_NAME}
            </p>
            {facility?.address && (
              <p className="text-muted">{facility.address}</p>
            )}
            {facility?.phone && (
              <p className="text-muted">{facility.phone}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[var(--color-neutral-400)] tracking-wide">
              INVOICE
            </p>
            <p className="eyebrow mt-1">
              #{invoice.id.slice(-8).toUpperCase()}
            </p>
            <p className="eyebrow">
              {new Date(invoice.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="eyebrow uppercase tracking-wide mb-1">
              Billed To
            </p>
            <p className="font-[600]">
              {invoice.patient.firstName} {invoice.patient.lastName}
            </p>
            <p className="text-muted">
              {invoice.patient.hospitalNumber}
            </p>
            {invoice.patient.phone && (
              <p className="text-muted">{invoice.patient.phone}</p>
            )}
            {invoice.patient.nhisNumber && (
              <p className="text-muted">
                NHIS: {invoice.patient.nhisNumber}
              </p>
            )}
          </div>
          <span
            className={`${invoiceStatusBadgeClass(invoice.status)}`}
          >
            {invoice.status.replace("_", " ")}
          </span>
        </div>

        <table className="table mb-6">
          <thead>
            <tr className="matrix-divider ">
              <th className="text-left py-2">Description</th>
              <th className="text-right py-2">Qty</th>
              <th className="text-right py-2">Unit Price</th>
              <th className="text-right py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((li) => (
              <tr key={li.id} className="matrix-divider">
                <td className="py-2">{li.description}</td>
                <td className="py-2 text-right">{li.quantity}</td>
                <td className="py-2 text-right">{li.unitPrice.toString()}</td>
                <td className="py-2 text-right">
                  {(Number(li.unitPrice) * li.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-8">
          <div className="w-56 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted">Total</span>
              <span className="font-medium">
                GHS {invoice.totalAmount.toString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Paid</span>
              <span>GHS {paid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between matrix-divider pt-1 font-semibold text-[color:var(--color-text)]">
              <span>Balance Due</span>
              <span>GHS {balance.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {invoice.payments.length > 0 && (
          <div className="mb-8">
            <p className="eyebrow uppercase tracking-wide mb-2">
              Payments Received
            </p>
            <ul className="text-sm list">
              {invoice.payments.map((p) => (
                <li key={p.id} className="py-1.5 flex justify-between">
                  <span>
                    {new Date(p.paidAt).toLocaleDateString()} —{" "}
                    {paymentMethodLabel(p.method)}
                    {p.reference && ` (${p.reference})`}
                  </span>
                  <span>GHS {Number(p.amount).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="eyebrow text-center matrix-divider pt-4">
          Thank you. Please retain this invoice for your records.
        </p>
      </div>
    </div>
  );
}
