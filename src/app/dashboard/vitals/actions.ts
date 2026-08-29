"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { roleHasModuleAccess } from "@/lib/access";

export async function hasVitalsAccess(): Promise<boolean> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return roleHasModuleAccess(role, "vitals");
}

// Arrived-but-not-yet-called-in appointments — the OPD/front-desk side of
// vitals charting.
export async function listArrivedAppointments(query: string) {
  return prisma.appointment.findMany({
    where: {
      status: "ARRIVED",
      ...(query
        ? {
            patient: {
              OR: [
                { firstName: { contains: query, mode: "insensitive" } },
                { lastName: { contains: query, mode: "insensitive" } },
                { hospitalNumber: { contains: query, mode: "insensitive" } },
              ],
            },
          }
        : {}),
    },
    include: {
      patient: true,
      vitalSigns: { orderBy: { recordedAt: "desc" }, take: 1 },
    },
    orderBy: { arrivedAt: "asc" },
  });
}

// Currently admitted patients — the inpatient side of vitals charting,
// independent of whether a doctor's ward round is active.
export async function listAdmittedPatients(query: string) {
  return prisma.admission.findMany({
    where: {
      status: "ADMITTED",
      ...(query
        ? {
            patient: {
              OR: [
                { firstName: { contains: query, mode: "insensitive" } },
                { lastName: { contains: query, mode: "insensitive" } },
                { hospitalNumber: { contains: query, mode: "insensitive" } },
              ],
            },
          }
        : {}),
    },
    include: {
      patient: true,
      bed: { include: { ward: true } },
      vitalSigns: { orderBy: { recordedAt: "desc" }, take: 1 },
    },
    orderBy: { admittedAt: "desc" },
  });
}
