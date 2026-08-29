import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getImagingOrder,
  updateOrderStatus,
  recordReport,
  hasImagingAccess,
} from "../actions";
import { orderStatusBadgeClass, IMAGING_ORDER_STATUSES } from "../labels";
import AccessRestricted from "../AccessRestricted";

export default async function ImagingOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await hasImagingAccess())) {
    return <AccessRestricted />;
  }

  const { id } = await params;
  const { error } = await searchParams;
  const order = await getImagingOrder(id);
  if (!order) notFound();

  const isResolved = order.status === "COMPLETED" || order.status === "CANCELLED";
  const updateStatusWithId = updateOrderStatus.bind(null, order.id);
  const recordReportWithId = recordReport.bind(null, order.id);
  // COMPLETED is reachable only through "Record Report" below — it isn't a
  // choice in this dropdown, so status can't jump to done without a report
  // actually being saved.
  const manualStatuses = IMAGING_ORDER_STATUSES.filter((s) => s !== "COMPLETED");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="eyebrow">
          <Link href="/dashboard/imaging" className="hover:underline">
            ← Diagnostic Imaging
          </Link>
        </p>
        <h1 className="page-title">{order.modality}</h1>
        <p className="text-muted">
          <Link
            href={`/dashboard/patients/${order.patient.id}`}
            className="hover:underline"
          >
            {order.patient.firstName} {order.patient.lastName} ·{" "}
            {order.patient.hospitalNumber}
          </Link>
        </p>
      </div>

      <div className="card grid grid-cols-2 gap-4">
        <Info
          label="Ordered By"
          value={`${order.orderedBy.firstName} ${order.orderedBy.lastName}`}
        />
        <Info
          label="Ordered At"
          value={new Date(order.orderedAt).toLocaleString()}
        />
        <div>
          <p className="eyebrow mb-1">Status</p>
          <span
            className={`${orderStatusBadgeClass(order.status)}`}
          >
            {order.status}
          </span>
        </div>
      </div>

      {error && (
        <p className="callout callout-danger">
          {error}
        </p>
      )}

      {!isResolved && (
        <div className="card">
          <h2 className="card-title mb-2">
            Update Status
          </h2>
          <form action={updateStatusWithId} className="flex items-end gap-2">
            <select
              name="status"
              defaultValue={order.status}
              className="input input-sm"
            >
              {manualStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="btn btn-secondary"
            >
              Update
            </button>
          </form>
          <p className="eyebrow mt-2">
            Track scheduling here. Recording a report below marks it
            Completed automatically.
          </p>
        </div>
      )}

      <div className="card gap-4">
        <h2 className="card-title">Report</h2>

        {order.status === "COMPLETED" && order.reportText ? (
          <div className="text-sm panel px-3 py-2 space-y-1">
            <p className="whitespace-pre-wrap">
              {order.reportText}
            </p>
            {order.pacsStudyUid && (
              <p className="text-muted">
                PACS study UID: {order.pacsStudyUid}
              </p>
            )}
            <p className="eyebrow">
              Recorded{" "}
              {order.reportedAt && new Date(order.reportedAt).toLocaleString()}
            </p>
          </div>
        ) : isResolved ? (
          <p className="text-muted">
            This order was cancelled before a report was recorded.
          </p>
        ) : (
          <form action={recordReportWithId} className="space-y-3">
            <div>
              <label className="form-label">
                Findings / Report
              </label>
              <textarea
                name="reportText"
                required
                rows={4}
                placeholder="Radiology findings and impression"
                className="input input-sm"
              />
            </div>
            <div>
              <label className="form-label">
                PACS Study UID (optional)
              </label>
              <input
                name="pacsStudyUid"
                className="input input-sm"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Save Report &amp; Complete
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="text-[color:var(--color-text)]">{value}</p>
    </div>
  );
}
