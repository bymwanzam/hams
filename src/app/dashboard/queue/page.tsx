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
          <h1 className="page-title">
            Patient Queue
          </h1>
          <p className="text-muted">
            Live queue across departments — refreshes automatically. Open a
            patient to view details or route them to a different department.
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="tag tag-info">
            {waitingCount} waiting
          </span>
          <span className="tag tag-info">
            {inProgressCount} in progress
          </span>
        </div>
      </div>

      {groups.size === 0 ? (
        <div className="panel px-4 py-10 text-center text-sm text-muted">
          No patients currently waiting. Patients appear here once their
          arrival is recorded on their{" "}
          <Link
            href="/dashboard/appointments"
            className="btn btn-ghost"
          >
            appointment
          </Link>
          .
        </div>
      ) : (
        Array.from(groups.entries()).map(([group, entries]) => (
          <div
            key={group}
            className="panel"
          >
            <div className="panel-head flex items-center justify-between">
              <h2 className="card-title">{group}</h2>
              <span className="eyebrow">
                {entries.length} in queue
              </span>
            </div>
            <ul className="list">
              {entries.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/dashboard/appointments/${a.id}`}
                    className="row-link"
                  >
                    <div className="min-w-0">
                      <p className="font-[600]">
                        {a.patient.firstName} {a.patient.lastName}
                      </p>
                      <p className="eyebrow">
                        {a.patient.hospitalNumber}
                        {a.arrivedAt &&
                          ` · waiting ${minutesWaiting(a.arrivedAt)} min`}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 ${statusBadgeClass(a.status)}`}
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
