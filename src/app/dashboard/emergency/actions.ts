"use server";

import { prisma } from "@/lib/prisma";

// Active emergency cases: patients currently being seen (or waiting to be)
// who haven't yet been sent home or admitted. Emergency cases arrive
// unscheduled — unlike OPD there's no appointment/arrival queue feeding
// this list, so it's just the "New Consultation" flow with Emergency
// picked as the visit type. This is a focused lens onto the same Encounter
// data the Consultations module manages, same as OPD's worklist.
export async function listActiveEmergencyEncounters(query: string) {
  return prisma.encounter.findMany({
    where: {
      type: "EMERGENCY",
      status: { in: ["WAITING", "IN_PROGRESS"] },
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
    include: { patient: true, attendingProvider: true },
    orderBy: { startedAt: "asc" },
  });
}
