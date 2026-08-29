import Link from "next/link";
import { listPendingLabOrders, hasLabAccess } from "./actions";
import { orderStatusBadgeClass } from "./labels";
import AccessRestricted from "./AccessRestricted";

export default async function LabPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!(await hasLabAccess())) {
    return <AccessRestricted />;
  }

  const { q } = await searchParams;
  const orders = await listPendingLabOrders(q ?? "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Laboratory
          </h1>
          <p className="text-muted">
            Tests ordered by doctors, awaiting processing.
          </p>
        </div>
        <Link
          href="/dashboard/lab/catalog"
          className="btn btn-ghost"
        >
          Manage Test Catalog →
        </Link>
      </div>

      <form className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by patient, hospital no. or test"
          className="input"
        />
      </form>

      <div className="panel">
        {orders.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            No lab orders waiting to be processed.
          </p>
        ) : (
          <ul className="list">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/dashboard/lab/${o.id}`}
                  className="row-link"
                >
                  <div className="min-w-0">
                    <p className="font-[600]">
                      {o.test.name}
                      {o.test.category && (
                        <span className="text-muted font-normal">
                          {" "}
                          · {o.test.category}
                        </span>
                      )}
                    </p>
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
                    {o.status.replace("_", " ")}
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
