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
          <h1 className="text-xl font-semibold text-slate-800">
            Laboratory
          </h1>
          <p className="text-sm text-slate-500">
            Tests ordered by doctors, awaiting processing.
          </p>
        </div>
        <Link
          href="/dashboard/lab/catalog"
          className="text-sm text-blue-600 hover:underline"
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
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {orders.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-400">
            No lab orders waiting to be processed.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/dashboard/lab/${o.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">
                      {o.test.name}
                      {o.test.category && (
                        <span className="text-slate-400 font-normal">
                          {" "}
                          · {o.test.category}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">
                      {o.patient.firstName} {o.patient.lastName} ·{" "}
                      {o.patient.hospitalNumber} · Ordered by{" "}
                      {o.orderedBy.firstName} {o.orderedBy.lastName} on{" "}
                      {new Date(o.orderedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${orderStatusBadgeClass(o.status)}`}
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
