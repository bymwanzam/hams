"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { recordAudit } from "@/lib/audit";
import { SURGERY_STATUSES, SURGERY_PAYMENT_TYPES } from "./labels";

// Surgeons and anesthetists are both drawn from DOCTOR accounts — there's
// no separate ANESTHETIST role in this system yet.
export async function listSurgeons() {
  return prisma.user.findMany({
    where: { role: "DOCTOR", isActive: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });
}

const surgeryInclude = {
  patient: true,
  surgeon: true,
  anesthetist: true,
} satisfies Prisma.SurgeryInclude;

export async function listSurgeries(query: string) {
  return prisma.surgery.findMany({
    where: {
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      ...(query
        ? {
            OR: [
              { patient: { firstName: { contains: query, mode: "insensitive" } } },
              { patient: { lastName: { contains: query, mode: "insensitive" } } },
              {
                patient: {
                  hospitalNumber: { contains: query, mode: "insensitive" },
                },
              },
              { procedure: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: surgeryInclude,
    orderBy: { scheduledAt: "asc" },
  });
}

export async function getSurgery(id: string) {
  return prisma.surgery.findUnique({
    where: { id },
    include: surgeryInclude,
  });
}

const ScheduleSchema = z.object({
  patientId: z.string().min(1),
  procedure: z.string().min(1),
  theatre: z.string().optional(),
  surgeonId: z.string().min(1),
  anesthetistId: z.string().optional(),
  paymentType: z.enum(SURGERY_PAYMENT_TYPES),
  scheduledAt: z.string().min(1),
  notes: z.string().optional(),
});

export async function scheduleSurgery(formData: FormData) {
  const parsed = ScheduleSchema.parse({
    patientId: formData.get("patientId"),
    procedure: formData.get("procedure"),
    theatre: formData.get("theatre") || undefined,
    surgeonId: formData.get("surgeonId"),
    anesthetistId: formData.get("anesthetistId") || undefined,
    paymentType: formData.get("paymentType"),
    scheduledAt: formData.get("scheduledAt"),
    notes: formData.get("notes") || undefined,
  });

  const surgery = await prisma.surgery.create({
    data: {
      patientId: parsed.patientId,
      procedure: parsed.procedure,
      theatre: parsed.theatre,
      surgeonId: parsed.surgeonId,
      anesthetistId: parsed.anesthetistId,
      paymentType: parsed.paymentType,
      scheduledAt: new Date(parsed.scheduledAt),
      notes: parsed.notes,
    },
  });

  await recordAudit({
    action: "SURGERY_SCHEDULED",
    entity: "Surgery",
    entityId: surgery.id,
    metadata: {
      patientId: parsed.patientId,
      procedure: parsed.procedure,
      surgeonId: parsed.surgeonId,
    },
  });

  revalidatePath("/dashboard/surgery");
  redirect(`/dashboard/surgery/${surgery.id}`);
}

const PaymentTypeSchema = z.object({
  paymentType: z.enum(SURGERY_PAYMENT_TYPES),
});

// Kept editable after scheduling — a case classified INSURANCE can turn
// into CASH if a pre-authorization is denied, and front desk needs to be
// able to reflect that without touching anything else on the record.
export async function updatePaymentType(id: string, formData: FormData) {
  const parsed = PaymentTypeSchema.parse({
    paymentType: formData.get("paymentType"),
  });

  await prisma.surgery.update({
    where: { id },
    data: { paymentType: parsed.paymentType },
  });

  await recordAudit({
    action: "SURGERY_PAYMENT_TYPE_CHANGED",
    entity: "Surgery",
    entityId: id,
    metadata: { paymentType: parsed.paymentType },
  });

  revalidatePath(`/dashboard/surgery/${id}`);
  revalidatePath("/dashboard/surgery");
}

const StatusSchema = z.object({
  status: z.enum(SURGERY_STATUSES),
});

export async function updateSurgeryStatus(id: string, formData: FormData) {
  const parsed = StatusSchema.parse({ status: formData.get("status") });

  const data: Prisma.SurgeryUpdateInput = { status: parsed.status };
  if (parsed.status === "IN_PROGRESS") {
    const existing = await prisma.surgery.findUnique({ where: { id } });
    if (!existing?.startedAt) data.startedAt = new Date();
  }

  await prisma.surgery.update({ where: { id }, data });

  await recordAudit({
    action: "SURGERY_STATUS_CHANGED",
    entity: "Surgery",
    entityId: id,
    metadata: { status: parsed.status },
  });

  revalidatePath(`/dashboard/surgery/${id}`);
  revalidatePath("/dashboard/surgery");
}

const OperativeNoteSchema = z.object({
  operativeNote: z.string().min(1),
});

// The only path allowed to mark a surgery COMPLETED — same guardrail as
// Lab/Imaging results: it shouldn't be possible to close out a case with
// no operative report ever recorded.
export async function recordOperativeNote(id: string, formData: FormData) {
  const parsed = OperativeNoteSchema.parse({
    operativeNote: formData.get("operativeNote"),
  });

  await prisma.surgery.update({
    where: { id },
    data: {
      operativeNote: parsed.operativeNote,
      status: "COMPLETED",
      endedAt: new Date(),
    },
  });

  await recordAudit({
    action: "SURGERY_COMPLETED",
    entity: "Surgery",
    entityId: id,
    metadata: { operativeNoteRecorded: true },
  });

  revalidatePath(`/dashboard/surgery/${id}`);
  revalidatePath("/dashboard/surgery");
}
