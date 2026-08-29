import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { serviceTypeLabel, statusBadgeClass } from "../appointments/labels";
import AutoRefresh from "./AutoRefresh";

function minutesWaiting(arrivedAt: Date): number {
  return Math.max(0, Math.round((Date.now() - arrivedAt.getTime()) / 60000));
}

function groupLabel(a: { serviceType: string; department: string | null }) {
  return a.serviceType === "SPECIALIST" && a.department
    ? `Specialist — ${a.department}`
    : serviceTypeLabel(a.serviceType);
}

export default async function QueuePage() {
  const appointments = await prisma.appointment.findMany({
    where: { status: { in: ["ARRIVED", "IN_PROGRESS"] } },
    include: { patient: true },
    orderBy: { arrivedAt: "asc" },
  });

  const groups = new Map<string, typeof appointments>();
  for (const a of appointments) {
    const key = groupLabel(a);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(a);
  }

  const waitingCount = appointments.filter((a) => a.status === "ARRIVED").length;
  const inProgressCount = appointments.filter(
    (a) => a.status === "IN_PROGRESS"
  ).length;

  return (
    <div className="space-y-6">
      <AutoRefresh />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Patient Queue
          </h1>
          <p className="text-sm text-slate-500">
            Live queue across departments — refreshes automatically. Open a
            patient to view details or route them to a different department.
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="px-3 py-1.5 rounded-md bg-amber-50 text-amber-700 font-medium">
            {waitingCount} waiting
          </span>
          <span className="px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 font-medium">
            {inProgressCount} in progress
          </span>
        </div>
      </div>

      {groups.size === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-10 text-center text-sm text-slate-400">
          No patients currently waiting. Patients appear here once their
          arrival is recorded on their{" "}
          <Link
            href="/dashboard/appointments"
            className="text-blue-600 hover:underline"
          >
            appointment
          </Link>
          .
        </div>
      ) : (
        Array.from(groups.entries()).map(([group, entries]) => (
          <div
            key={group}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden"
          >
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">{group}</h2>
              <span className="text-xs text-slate-400">
                {entries.length} in queue
              </span>
            </div>
            <ul className="divide-y divide-slate-100">
              {entries.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/dashboard/appointments/${a.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">
                        {a.patient.firstName} {a.patient.lastName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {a.patient.hospitalNumber}
                        {a.arrivedAt &&
                          ` · waiting ${minutesWaiting(a.arrivedAt)} min`}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(a.status)}`}
                    >
                      {a.status.replace("_", " ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
