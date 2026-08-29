import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { MODULE_GROUPS, getModule, ACCENT_HEX } from "@/lib/modules";
import { filterModuleGroupsForRole } from "@/lib/access";
import GroupHeading from "@/components/GroupHeading";
import {
  Card,
  CardKicker,
  CardTitle,
  CardBody,
  Callout,
  Hr,
  Tag,
} from "@/components/ui";

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
        <h1>Overview</h1>
        <p className="text-muted mb-0">
          Snapshot across the hospital&apos;s live modules.
        </p>
      </div>

      {restricted && (
        <Callout tone="warning">
          You don&apos;t have access to{" "}
          {restrictedModule ? restrictedModule.label : "that module"} with your
          current role.
        </Callout>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s, i) => {
          const color = ACCENT_HEX[STAT_ACCENTS[i]];
          return (
            <Card
              key={s.label}
              style={{ borderLeft: `2px solid ${color[500]}` }}
            >
              <CardKicker>{s.label}</CardKicker>
              <p className="mb-0 text-[28px] leading-none font-[800]">
                {s.value}
              </p>
            </Card>
          );
        })}
      </div>

      <div className="space-y-8">
        {visibleGroups.map((group) => {
          const color = ACCENT_HEX[group.accent];
          return (
            <div key={group.group}>
              <GroupHeading label={group.group} accent={group.accent} />
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.modules.map((m) => (
                  <Card
                    key={m.slug}
                    href={`/dashboard/${m.slug}`}
                    style={{ borderLeft: `2px solid ${color[500]}` }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle>{m.label}</CardTitle>
                      <Tag tone={m.status === "live" ? "success" : "neutral"}>
                        {m.status}
                      </Tag>
                    </div>
                    <CardBody>{m.description}</CardBody>
                  </Card>
                ))}
              </div>
              <Hr />
            </div>
          );
        })}
      </div>
    </div>
  );
}
