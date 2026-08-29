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
        <p className="text-xs text-slate-400">
          <Link href="/dashboard/imaging" className="hover:underline">
            ← Diagnostic Imaging
          </Link>
        </p>
        <h1 className="text-xl font-semibold text-slate-800">{order.modality}</h1>
        <p className="text-sm text-slate-500">
          <Link
            href={`/dashboard/patients/${order.patient.id}`}
            className="hover:underline"
          >
            {order.patient.firstName} {order.patient.lastName} ·{" "}
            {order.patient.hospitalNumber}
          </Link>
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-2 gap-4 text-sm">
        <Info
          label="Ordered By"
          value={`${order.orderedBy.firstName} ${order.orderedBy.lastName}`}
        />
        <Info
          label="Ordered At"
          value={new Date(order.orderedAt).toLocaleString()}
        />
        <div>
          <p className="text-xs text-slate-400 mb-1">Status</p>
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${orderStatusBadgeClass(order.status)}`}
          >
            {order.status}
          </span>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {!isResolved && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">
            Update Status
          </h2>
          <form action={updateStatusWithId} className="flex items-end gap-2">
            <select
              name="status"
              defaultValue={order.status}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              {manualStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-md"
            >
              Update
            </button>
          </form>
          <p className="text-xs text-slate-400 mt-2">
            Track scheduling here. Recording a report below marks it
            Completed automatically.
          </p>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Report</h2>

        {order.status === "COMPLETED" && order.reportText ? (
          <div className="text-sm bg-slate-50 rounded-md px-3 py-2 space-y-1">
            <p className="text-slate-800 whitespace-pre-wrap">
              {order.reportText}
            </p>
            {order.pacsStudyUid && (
              <p className="text-slate-500">
                PACS study UID: {order.pacsStudyUid}
              </p>
            )}
            <p className="text-xs text-slate-400">
              Recorded{" "}
              {order.reportedAt && new Date(order.reportedAt).toLocaleString()}
            </p>
          </div>
        ) : isResolved ? (
          <p className="text-sm text-slate-400">
            This order was cancelled before a report was recorded.
          </p>
        ) : (
          <form action={recordReportWithId} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Findings / Report
              </label>
              <textarea
                name="reportText"
                required
                rows={4}
                placeholder="Radiology findings and impression"
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                PACS Study UID (optional)
              </label>
              <input
                name="pacsStudyUid"
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
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
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-slate-700">{value}</p>
    </div>
  );
}
