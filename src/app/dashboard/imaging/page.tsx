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
        <h1 className="text-xl font-semibold text-slate-800">
          Diagnostic Imaging
        </h1>
        <p className="text-sm text-slate-500">
          Studies ordered by doctors, awaiting processing.
        </p>
      </div>

      <form className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by patient, hospital no. or study"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {orders.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-400">
            No imaging orders waiting to be processed.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/dashboard/imaging/${o.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">{o.modality}</p>
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
