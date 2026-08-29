import Link from "next/link";
import { listPendingImagingOrders, hasImagingAccess } from "./actions";
import { orderStatusBadgeClass } from "./labels";
import AccessRestricted from "./AccessRestricted";

export default async function ImagingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!(await hasImagingAccess())) {
    return <AccessRestricted />;
  }

  const { q } = await searchParams;
  const orders = await listPendingImagingOrders(q ?? "");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">
          Diagnostic Imaging
        </h1>
        <p className="text-muted">
          Studies ordered by doctors, awaiting processing.
        </p>
      </div>

      <form className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by patient, hospital no. or study"
          className="input"
        />
      </form>

      <div className="panel">
        {orders.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            No imaging orders waiting to be processed.
          </p>
        ) : (
          <ul className="list">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/dashboard/imaging/${o.id}`}
                  className="row-link"
                >
                  <div className="min-w-0">
                    <p className="font-[600]">{o.modality}</p>
                    <p className="eyebrow">
                      {o.patient.firstName} {o.patient.lastName} ·{" "}
                      {o.patient.hospitalNumber} · Ordered by{" "}
                      {o.orderedBy.firstName} {o.orderedBy.lastName} on{" "}
                      {new Date(o.orderedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 ${orderStatusBadgeClass(o.status)}`}
                  >
                    {o.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
