import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getLabOrder,
  updateOrderStatus,
  recordResult,
  hasLabAccess,
} from "../actions";
import { orderStatusBadgeClass, LAB_ORDER_STATUSES } from "../labels";
import AccessRestricted from "../AccessRestricted";

export default async function LabOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await hasLabAccess())) {
    return <AccessRestricted />;
  }

  const { id } = await params;
  const { error } = await searchParams;
  const order = await getLabOrder(id);
  if (!order) notFound();

  const isResolved = order.status === "COMPLETED" || order.status === "CANCELLED";
  const updateStatusWithId = updateOrderStatus.bind(null, order.id);
  const recordResultWithId = recordResult.bind(null, order.id);
  // COMPLETED is reachable only through "Record Result" below — it isn't a
  // choice in this dropdown, so status can't jump to done without a result
  // actually being saved.
  const manualStatuses = LAB_ORDER_STATUSES.filter((s) => s !== "COMPLETED");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="eyebrow">
          <Link href="/dashboard/lab" className="hover:underline">
            ← Laboratory
          </Link>
        </p>
        <h1 className="page-title">
          {order.test.name}
        </h1>
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
        <Info label="Category" value={order.test.category ?? "—"} />
        <Info label="Sample Type" value={order.test.sampleType ?? "—"} />
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
            {order.status.replace("_", " ")}
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
                  {s.replace("_", " ")}
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
            Track specimen collection and processing here. Recording a
            result below marks it Completed automatically.
          </p>
        </div>
      )}

      <div className="card gap-4">
        <h2 className="card-title">Result</h2>

        {order.status === "COMPLETED" && order.resultValue ? (
          <div className="text-sm panel px-3 py-2 space-y-1">
            <p>
              <span className="text-muted">Result:</span>{" "}
              <span className="font-[600]">
                {order.resultValue}
                {order.resultUnit && ` ${order.resultUnit}`}
              </span>
            </p>
            {order.referenceRange && (
              <p className="text-muted">
                Reference range: {order.referenceRange}
              </p>
            )}
            {order.analyzerRef && (
              <p className="text-muted">Analyzer ref: {order.analyzerRef}</p>
            )}
            <p className="eyebrow">
              Recorded {order.resultedAt && new Date(order.resultedAt).toLocaleString()}
            </p>
          </div>
        ) : isResolved ? (
          <p className="text-muted">
            This order was cancelled before a result was recorded.
          </p>
        ) : (
          <form action={recordResultWithId} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Result Value" name="resultValue" required />
              <Field label="Unit" name="resultUnit" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Reference Range" name="referenceRange" />
              <Field label="Analyzer Ref." name="analyzerRef" />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Save Result &amp; Complete
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

function Field({
  label,
  name,
  required = false,
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="form-label">
        {label}
      </label>
      <input
        name={name}
        required={required}
        className="input input-sm"
      />
    </div>
  );
}
