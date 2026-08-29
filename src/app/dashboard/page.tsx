import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { MODULE_GROUPS, getModule, ACCENT_HEX } from "@/lib/modules";
import { filterModuleGroupsForRole } from "@/lib/access";
import GroupHeading from "@/components/GroupHeading";

// One distinct color per stat tile, purely so the row reads as three
// separate figures at a glance rather than one undifferentiated block.
const STAT_ACCENTS = ["sky", "emerald", "amber"] as const;

export default async function DashboardHome({
  searchParams,
}: {
  searchParams: Promise<{ restricted?: string }>;
}) {
  const { restricted } = await searchParams;

  const [patientCount, admissionCount, appointmentCount, session] =
    await Promise.all([
      prisma.patient.count(),
      prisma.admission.count({ where: { status: "ADMITTED" } }),
      prisma.appointment.count({ where: { status: "SCHEDULED" } }),
      auth(),
    ]);

  const role = (session?.user as { role?: string } | undefined)?.role;
  const visibleGroups = filterModuleGroupsForRole(MODULE_GROUPS, role);
  const restrictedModule = restricted ? getModule(restricted) : undefined;

  const stats = [
    { label: "Registered Patients", value: patientCount },
    { label: "Currently Admitted", value: admissionCount },
    { label: "Upcoming Appointments", value: appointmentCount },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Overview</h1>
        <p className="text-sm text-slate-500">
          Snapshot across the hospital&apos;s live modules.
        </p>
      </div>

      {restricted && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          You don&apos;t have access to{" "}
          {restrictedModule ? restrictedModule.label : "that module"} with
          your current role.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s, i) => {
          const color = ACCENT_HEX[STAT_ACCENTS[i]];
          return (
            <div
              key={s.label}
              className="bg-white border border-slate-200 rounded-xl p-5"
              style={{ borderLeftWidth: 3, borderLeftColor: color[500] }}
            >
              <p className="text-2xl font-semibold text-slate-800">{s.value}</p>
              <p className="text-sm text-slate-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-6">
        {visibleGroups.map((group) => {
          const color = ACCENT_HEX[group.accent];
          return (
            <div key={group.group}>
              <GroupHeading
                label={group.group}
                accent={group.accent}
                variant="section"
              />
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.modules.map((m) => (
                  <Link
                    key={m.slug}
                    href={`/dashboard/${m.slug}`}
                    className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-sm transition"
                    style={{ borderLeftWidth: 3, borderLeftColor: color[500] }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-800">
                        {m.label}
                      </p>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          m.status === "live"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {m.status === "live" ? "live" : "planned"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{m.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
