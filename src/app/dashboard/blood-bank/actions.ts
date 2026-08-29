"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { roleHasModuleAccess } from "@/lib/access";
import { Prisma, type BloodRequestStatus } from "@prisma/client";
import {
  BLOOD_GROUPS,
  BLOOD_BANK_STATUSES,
  BLOOD_REQUEST_STATUSES,
} from "./labels";

export async function hasBloodBankAccess(): Promise<boolean> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return roleHasModuleAccess(role, "blood-bank");
}

async function requireBloodBankAccess(): Promise<void> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!roleHasModuleAccess(role, "blood-bank")) {
    throw new Error("Blood Bank access is restricted to laboratory staff.");
  }
}

export async function listUnits(query: string, status?: string) {
  return prisma.bloodBankUnit.findMany({
    where: {
      AND: [
        query ? { bloodGroup: { contains: query, mode: "insensitive" } } : {},
        status ? { status } : {},
      ],
    },
    orderBy: [{ expiresAt: "asc" }],
  });
}

// Units currently safe to issue, grouped by blood group — the at-a-glance
// stock strip at the top of the worklist. A unit past its expiry is never
// counted here even if nobody has gotten around to marking it Discarded
// yet, so this always reflects what's actually transfusable right now.
export async function getAvailableCountsByGroup(): Promise<
  Record<string, number>
> {
  const counts = await prisma.bloodBankUnit.groupBy({
    by: ["bloodGroup"],
    where: { status: "AVAILABLE", expiresAt: { gt: new Date() } },
    _count: { _all: true },
  });
  return Object.fromEntries(counts.map((c) => [c.bloodGroup, c._count._all]));
}

export async function getUnit(id: string) {
  return prisma.bloodBankUnit.findUnique({ where: { id } });
}

const UnitSchema = z.object({
  bloodGroup: z.enum(BLOOD_GROUPS),
  volumeMl: z.coerce.number().int().min(1),
  collectedAt: z.string().min(1),
  expiresAt: z.string().min(1),
});

function parseUnitForm(formData: FormData) {
  return UnitSchema.parse({
    bloodGroup: formData.get("bloodGroup"),
    volumeMl: formData.get("volumeMl"),
    collectedAt: formData.get("collectedAt"),
    expiresAt: formData.get("expiresAt"),
  });
}

export async function createUnit(formData: FormData) {
  await requireBloodBankAccess();
  const parsed = parseUnitForm(formData);

  await prisma.bloodBankUnit.create({
    data: {
      bloodGroup: parsed.bloodGroup,
      volumeMl: parsed.volumeMl,
      collectedAt: new Date(parsed.collectedAt),
      expiresAt: new Date(parsed.expiresAt),
    },
  });

  revalidatePath("/dashboard/blood-bank");
  redirect("/dashboard/blood-bank");
}

export async function updateUnit(id: string, formData: FormData) {
  await requireBloodBankAccess();
  const parsed = parseUnitForm(formData);

  await prisma.bloodBankUnit.update({
    where: { id },
    data: {
      bloodGroup: parsed.bloodGroup,
      volumeMl: parsed.volumeMl,
      collectedAt: new Date(parsed.collectedAt),
      expiresAt: new Date(parsed.expiresAt),
    },
  });

  revalidatePath("/dashboard/blood-bank");
  revalidatePath(`/dashboard/blood-bank/${id}`);
  redirect(`/dashboard/blood-bank/${id}`);
}

const StatusSchema = z.object({
  status: z.enum(BLOOD_BANK_STATUSES),
});

export async function updateUnitStatus(id: string, formData: FormData) {
  await requireBloodBankAccess();
  const parsed = StatusSchema.parse({ status: formData.get("status") });

  await prisma.bloodBankUnit.update({
    where: { id },
    data: { status: parsed.status },
  });

  revalidatePath(`/dashboard/blood-bank/${id}`);
  revalidatePath("/dashboard/blood-bank");
}

// ----------------------------------------------------------------------------
// Blood requests — doctors submit these from a patient's admission (see
// wards/actions.ts `requestBlood`); everything from here down is the
// blood-bank side of fulfilling them.
// ----------------------------------------------------------------------------

const requestInclude = {
  patient: true,
  admission: { include: { bed: { include: { ward: true } } } },
  requestedBy: true,
  units: true,
} satisfies Prisma.BloodRequestInclude;

// Higher urgency first, then oldest first within the same urgency — so
// an EMERGENCY request submitted a minute ago still sorts above a ROUTINE
// one that's been sitting for a day.
const URGENCY_RANK: Record<string, number> = {
  EMERGENCY: 0,
  URGENT: 1,
  ROUTINE: 2,
};

export async function listBloodRequests(status?: string) {
  await requireBloodBankAccess();
  // Only trust `status` if it's actually one of the known values — it
  // comes straight from a URL search param — otherwise fall back to the
  // default "open" view rather than letting an unrecognized value through
  // to Prisma.
  const validStatus = BLOOD_REQUEST_STATUSES.includes(
    status as BloodRequestStatus
  )
    ? (status as BloodRequestStatus)
    : undefined;

  const requests = await prisma.bloodRequest.findMany({
    where: validStatus
      ? { status: validStatus }
      : { status: { in: ["REQUESTED", "RESERVED"] } },
    include: requestInclude,
    orderBy: { requestedAt: "asc" },
  });
  return requests.sort(
    (a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency]
  );
}

export async function getBloodRequest(id: string) {
  await requireBloodBankAccess();
  return prisma.bloodRequest.findUnique({
    where: { id },
    include: requestInclude,
  });
}

// Units eligible to be reserved against a request: right blood group,
// actually in stock, and not already past their expiry.
export async function listAvailableUnitsForGroup(bloodGroup: string) {
  await requireBloodBankAccess();
  return prisma.bloodBankUnit.findMany({
    where: {
      bloodGroup,
      status: "AVAILABLE",
      expiresAt: { gt: new Date() },
    },
    orderBy: { expiresAt: "asc" },
  });
}

const ReserveSchema = z.object({
  unitIds: z.array(z.string().min(1)).min(1),
});

// Matches the selected units to this request. Doesn't require reaching
// `unitsNeeded` in one go — staff can come back and reserve more later if
// the first pass doesn't cover it — but any reservation is enough to move
// the request out of the plain "Requested" queue and into "Reserved".
export async function reserveUnitsForRequest(
  requestId: string,
  formData: FormData
) {
  await requireBloodBankAccess();
  const parsed = ReserveSchema.parse({ unitIds: formData.getAll("unitIds") });

  await prisma.$transaction(async (tx) => {
    const { count } = await tx.bloodBankUnit.updateMany({
      where: { id: { in: parsed.unitIds }, status: "AVAILABLE" },
      data: { status: "RESERVED", bloodRequestId: requestId },
    });
    if (count > 0) {
      await tx.bloodRequest.update({
        where: { id: requestId },
        data: { status: "RESERVED" },
      });
    }
  });

  revalidatePath(`/dashboard/blood-bank/requests/${requestId}`);
  revalidatePath("/dashboard/blood-bank/requests");
}

// Marks the request fulfilled and its reserved units transfused. Kept
// separate from reserving so "matched to this patient" and "actually
// given" stay distinguishable in the audit trail, same as Surgery's
// separate schedule/status-update/operative-note steps.
export async function issueBloodRequest(requestId: string) {
  await requireBloodBankAccess();

  await prisma.$transaction(async (tx) => {
    await tx.bloodBankUnit.updateMany({
      where: { bloodRequestId: requestId, status: "RESERVED" },
      data: { status: "USED" },
    });
    await tx.bloodRequest.update({
      where: { id: requestId },
      data: { status: "ISSUED", fulfilledAt: new Date() },
    });
  });

  revalidatePath(`/dashboard/blood-bank/requests/${requestId}`);
  revalidatePath("/dashboard/blood-bank/requests");
  revalidatePath("/dashboard/blood-bank");
}

// Cancelling a request releases any units already reserved against it back
// to the available pool rather than stranding them as permanently
// RESERVED with no request left to fulfill.
export async function cancelBloodRequest(requestId: string) {
  await requireBloodBankAccess();

  await prisma.$transaction(async (tx) => {
    await tx.bloodBankUnit.updateMany({
      where: { bloodRequestId: requestId, status: "RESERVED" },
      data: { status: "AVAILABLE", bloodRequestId: null },
    });
    await tx.bloodRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED" },
    });
  });

  revalidatePath(`/dashboard/blood-bank/requests/${requestId}`);
  revalidatePath("/dashboard/blood-bank/requests");
  revalidatePath("/dashboard/blood-bank");
}
