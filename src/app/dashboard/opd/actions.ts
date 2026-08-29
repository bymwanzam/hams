"use server";

import { prisma } from "@/lib/prisma";

// Arrived patients not yet called in to a consultation — this is where the
// "Call In" action now lives (moved off the Patient Queue, which front desk
// uses purely for routing/department reassignment; starting the actual
// consultation is a clinical decision the doctor makes here).
export async function listWaitingArrivals(query: string) {
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
    include: { patient: true },
    orderBy: { arrivedAt: "asc" },
  });
}

// Active OPD cases: patients currently being seen (or waiting to be) who
// haven't yet been sent home or admitted. This is a focused lens onto the
// same Encounter data the Consultations module manages — OPD is one
// EncounterType among several (Tele-health, Emergency, Follow-up, Ward
// Round), surfaced here as its own worklist since it's the highest-volume,
// most time-sensitive one: a patient is either discharged home from here,
// or escalated into a ward admission.
export async function listActiveOpdEncounters(query: string) {
  return prisma.encounter.findMany({
    where: {
      type: "OPD",
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
