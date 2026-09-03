"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordAudit, changedFields } from "@/lib/audit";

async function currentUserId(): Promise<string | undefined> {
  const session = await auth();
  return (session?.user as { id?: string } | undefined)?.id;
}

export async function searchEncounters(query: string) {
  const where = query
    ? {
        OR: [
          { patient: { firstName: { contains: query, mode: "insensitive" as const } } },
          { patient: { lastName: { contains: query, mode: "insensitive" as const } } },
          { patient: { hospitalNumber: { contains: query, mode: "insensitive" as const } } },
        ],
      }
    : {};

  return prisma.encounter.findMany({
    where,
    include: { patient: true, attendingProvider: true },
    orderBy: { startedAt: "desc" },
    take: 25,
  });
}

// Called from the Queue's "Call In" action. Starts (or resumes) the
// consultation for an arrived appointment and sends the doctor straight
// into it.
export async function callInPatient(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { encounter: true },
  });
  if (!appointment) redirect("/dashboard/queue");

  let encounterId = appointment.encounter?.id;

  if (!encounterId) {
    const userId = await currentUserId();
    const encounter = await prisma.encounter.create({
      data: {
        patientId: appointment.patientId,
        appointmentId: appointment.id,
        // Every appointment service (general or specialist OPD) maps to the
        // OPD encounter type; the specialist department context stays on
        // the Appointment itself.
        type: "OPD",
        status: "IN_PROGRESS",
        chiefComplaint: appointment.notes || undefined,
        attendingProviderId: userId,
      },
    });
    encounterId = encounter.id;
  } else {
    await prisma.encounter.update({
      where: { id: encounterId },
      data: { status: "IN_PROGRESS" },
    });
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "IN_PROGRESS" },
  });

  revalidatePath("/dashboard/queue");
  revalidatePath("/dashboard/encounters");
  redirect(`/dashboard/encounters/${encounterId}`);
}

// Called from an Admission's "Start Ward Round" button. Each round/review
// during a stay is its own Encounter, so this always creates a new one
// rather than resuming a prior round — that's what lets each round record
// its own diagnosis, orders and prescriptions independently.
export async function startWardRound(admissionId: string) {
  const admission = await prisma.admission.findUnique({
    where: { id: admissionId },
  });
  if (!admission) redirect("/dashboard/wards");

  const userId = await currentUserId();
  const encounter = await prisma.encounter.create({
    data: {
      patientId: admission.patientId,
      admissionId: admission.id,
      type: "WARD_ROUND",
      status: "IN_PROGRESS",
      attendingProviderId: userId,
    },
  });

  revalidatePath(`/dashboard/wards/${admissionId}`);
  revalidatePath("/dashboard/encounters");
  redirect(`/dashboard/encounters/${encounter.id}`);
}

const StartEncounterSchema = z.object({
  patientId: z.string().min(1),
  type: z.enum(["OPD", "TELEHEALTH", "EMERGENCY", "FOLLOW_UP"]),
  chiefComplaint: z.string().optional(),
});

// Starts an ad-hoc consultation not tied to a booked appointment (walk-in,
// emergency, tele-health).
export async function startEncounter(formData: FormData) {
  const parsed = StartEncounterSchema.parse({
    patientId: formData.get("patientId"),
    type: formData.get("type"),
    chiefComplaint: formData.get("chiefComplaint") || undefined,
  });

  const userId = await currentUserId();

  const encounter = await prisma.encounter.create({
    data: {
      patientId: parsed.patientId,
      type: parsed.type,
      status: "IN_PROGRESS",
      chiefComplaint: parsed.chiefComplaint,
      attendingProviderId: userId,
    },
  });

  await recordAudit({
    action: "ENCOUNTER_STARTED",
    entity: "Encounter",
    entityId: encounter.id,
    metadata: { patientId: parsed.patientId, type: parsed.type },
  });

  revalidatePath("/dashboard/encounters");
  redirect(`/dashboard/encounters/${encounter.id}`);
}

const ConsultationSchema = z.object({
  chiefComplaint: z.string().optional(),
  historyOfPresentingComplaint: z.string().optional(),
  pastMedicalHistory: z.string().optional(),
  pastSurgicalHistory: z.string().optional(),
  drugHistory: z.string().optional(),
  allergies: z.string().optional(),
  familyHistory: z.string().optional(),
  socialHistory: z.string().optional(),
  reviewOfSystems: z.string().optional(),
  examinationFindings: z.string().optional(),
  principalDiagnosis: z.string().optional(),
  additionalDiagnosis: z.string().optional(),
  managementPlan: z.string().optional(),
  notes: z.string().optional(),
});

export async function updateConsultation(id: string, formData: FormData) {
  const parsed = ConsultationSchema.parse({
    chiefComplaint: formData.get("chiefComplaint") || undefined,
    historyOfPresentingComplaint:
      formData.get("historyOfPresentingComplaint") || undefined,
    pastMedicalHistory: formData.get("pastMedicalHistory") || undefined,
    pastSurgicalHistory: formData.get("pastSurgicalHistory") || undefined,
    drugHistory: formData.get("drugHistory") || undefined,
    allergies: formData.get("allergies") || undefined,
    familyHistory: formData.get("familyHistory") || undefined,
    socialHistory: formData.get("socialHistory") || undefined,
    reviewOfSystems: formData.get("reviewOfSystems") || undefined,
    examinationFindings: formData.get("examinationFindings") || undefined,
    principalDiagnosis: formData.get("principalDiagnosis") || undefined,
    additionalDiagnosis: formData.get("additionalDiagnosis") || undefined,
    managementPlan: formData.get("managementPlan") || undefined,
    notes: formData.get("notes") || undefined,
  });

  const existing = await prisma.encounter.findUnique({ where: { id } });

  await prisma.encounter.update({
    where: { id },
    data: parsed,
  });

  await recordAudit({
    action: "CONSULTATION_UPDATED",
    entity: "Encounter",
    entityId: id,
    metadata: {
      changed: changedFields(
        existing as unknown as Record<string, unknown>,
        parsed as unknown as Record<string, unknown>
      ),
    },
  });

  revalidatePath(`/dashboard/encounters/${id}`);
}

export async function completeConsultation(id: string) {
  const encounter = await prisma.encounter.update({
    where: { id },
    data: { status: "COMPLETED", endedAt: new Date() },
  });

  await recordAudit({
    action: "CONSULTATION_COMPLETED",
    entity: "Encounter",
    entityId: id,
    metadata: {
      patientId: encounter.patientId,
      hasDiagnosis: Boolean(encounter.principalDiagnosis),
    },
  });

  if (encounter.appointmentId) {
    await prisma.appointment.update({
      where: { id: encounter.appointmentId },
      data: { status: "COMPLETED" },
    });
  }

  revalidatePath(`/dashboard/encounters/${id}`);
  revalidatePath("/dashboard/encounters");
  revalidatePath("/dashboard/queue");

  if (encounter.admissionId) {
    revalidatePath(`/dashboard/wards/${encounter.admissionId}`);
    redirect(`/dashboard/wards/${encounter.admissionId}`);
  }

  redirect("/dashboard/encounters");
}

const LabOrderSchema = z.object({
  encounterId: z.string().min(1),
  patientId: z.string().min(1),
  testId: z.string().min(1),
});

export async function orderLabTest(formData: FormData) {
  const parsed = LabOrderSchema.parse({
    encounterId: formData.get("encounterId"),
    patientId: formData.get("patientId"),
    testId: formData.get("testId"),
  });

  const userId = await currentUserId();
  if (!userId) throw new Error("Unauthorized");

  const order = await prisma.labOrder.create({
    data: {
      encounterId: parsed.encounterId,
      patientId: parsed.patientId,
      testId: parsed.testId,
      orderedById: userId,
    },
  });

  await recordAudit({
    action: "LAB_ORDERED",
    entity: "LabOrder",
    entityId: order.id,
    metadata: { encounterId: parsed.encounterId, patientId: parsed.patientId, testId: parsed.testId },
  });

  revalidatePath(`/dashboard/encounters/${parsed.encounterId}`);
}

const ImagingOrderSchema = z.object({
  encounterId: z.string().min(1),
  patientId: z.string().min(1),
  modality: z.string().min(1),
});

export async function orderImaging(formData: FormData) {
  const parsed = ImagingOrderSchema.parse({
    encounterId: formData.get("encounterId"),
    patientId: formData.get("patientId"),
    modality: formData.get("modality"),
  });

  const userId = await currentUserId();
  if (!userId) throw new Error("Unauthorized");

  const order = await prisma.imagingOrder.create({
    data: {
      encounterId: parsed.encounterId,
      patientId: parsed.patientId,
      modality: parsed.modality,
      orderedById: userId,
    },
  });

  await recordAudit({
    action: "IMAGING_ORDERED",
    entity: "ImagingOrder",
    entityId: order.id,
    metadata: { encounterId: parsed.encounterId, patientId: parsed.patientId, modality: parsed.modality },
  });

  revalidatePath(`/dashboard/encounters/${parsed.encounterId}`);
}

const LabResultSchema = z.object({
  resultValue: z.string().min(1),
  resultUnit: z.string().optional(),
  referenceRange: z.string().optional(),
});

export async function recordLabResult(labOrderId: string, formData: FormData) {
  const parsed = LabResultSchema.parse({
    resultValue: formData.get("resultValue"),
    resultUnit: formData.get("resultUnit") || undefined,
    referenceRange: formData.get("referenceRange") || undefined,
  });

  const order = await prisma.labOrder.update({
    where: { id: labOrderId },
    data: {
      resultValue: parsed.resultValue,
      resultUnit: parsed.resultUnit,
      referenceRange: parsed.referenceRange,
      status: "COMPLETED",
      resultedAt: new Date(),
    },
  });

  await recordAudit({
    action: "LAB_RESULT_RECORDED",
    entity: "LabOrder",
    entityId: labOrderId,
    metadata: { patientId: order.patientId, testId: order.testId },
  });

  if (order.encounterId) {
    revalidatePath(`/dashboard/encounters/${order.encounterId}`);
  }
}

export async function cancelLabOrder(labOrderId: string) {
  const order = await prisma.labOrder.update({
    where: { id: labOrderId },
    data: { status: "CANCELLED" },
  });

  await recordAudit({
    action: "LAB_ORDER_CANCELLED",
    entity: "LabOrder",
    entityId: labOrderId,
    metadata: { patientId: order.patientId },
  });

  if (order.encounterId) {
    revalidatePath(`/dashboard/encounters/${order.encounterId}`);
  }
}

const ImagingResultSchema = z.object({
  reportText: z.string().min(1),
});

export async function recordImagingResult(
  imagingOrderId: string,
  formData: FormData
) {
  const parsed = ImagingResultSchema.parse({
    reportText: formData.get("reportText"),
  });

  const order = await prisma.imagingOrder.update({
    where: { id: imagingOrderId },
    data: {
      reportText: parsed.reportText,
      status: "COMPLETED",
      reportedAt: new Date(),
    },
  });

  await recordAudit({
    action: "IMAGING_REPORT_RECORDED",
    entity: "ImagingOrder",
    entityId: imagingOrderId,
    metadata: { patientId: order.patientId, modality: order.modality },
  });

  if (order.encounterId) {
    revalidatePath(`/dashboard/encounters/${order.encounterId}`);
  }
}

export async function cancelImagingOrder(imagingOrderId: string) {
  const order = await prisma.imagingOrder.update({
    where: { id: imagingOrderId },
    data: { status: "CANCELLED" },
  });

  await recordAudit({
    action: "IMAGING_ORDER_CANCELLED",
    entity: "ImagingOrder",
    entityId: imagingOrderId,
    metadata: { patientId: order.patientId },
  });

  if (order.encounterId) {
    revalidatePath(`/dashboard/encounters/${order.encounterId}`);
  }
}

// Disposition for an OPD case that isn't improving enough to go home:
// closes out this OPD encounter and sends the doctor straight into
// admitting the patient to a ward.
export async function admitFromEncounter(encounterId: string) {
  const encounter = await prisma.encounter.update({
    where: { id: encounterId },
    data: { status: "COMPLETED", endedAt: new Date() },
  });

  await recordAudit({
    action: "ADMIT_FROM_ENCOUNTER",
    entity: "Encounter",
    entityId: encounterId,
    metadata: { patientId: encounter.patientId },
  });

  revalidatePath(`/dashboard/encounters/${encounterId}`);
  revalidatePath("/dashboard/encounters");
  revalidatePath("/dashboard/opd");
  redirect(`/dashboard/wards/new?patientId=${encounter.patientId}`);
}

// Prescriptions have a variable number of drug lines, so the form submits
// parallel arrays (one value per line, same order) rather than a fixed set
// of named fields — read back with FormData.getAll and zipped by index.
export async function createPrescription(formData: FormData) {
  const encounterId = formData.get("encounterId") as string;
  const patientId = formData.get("patientId") as string;
  const drugIds = formData.getAll("drugId") as string[];
  const dosages = formData.getAll("dosage") as string[];
  const frequencies = formData.getAll("frequency") as string[];
  const durations = formData.getAll("durationDays") as string[];
  const quantities = formData.getAll("quantity") as string[];

  const userId = await currentUserId();
  if (!userId) throw new Error("Unauthorized");

  const items = drugIds
    .map((drugId, i) => ({
      drugId,
      dosage: dosages[i]?.trim() ?? "",
      frequency: frequencies[i]?.trim() ?? "",
      durationDays: Number.parseInt(durations[i], 10),
      quantity: Number.parseInt(quantities[i], 10),
    }))
    .filter(
      (item) =>
        item.drugId &&
        item.dosage &&
        item.frequency &&
        Number.isFinite(item.durationDays) &&
        item.durationDays > 0 &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0
    );

  if (items.length === 0) return;

  const prescription = await prisma.prescription.create({
    data: {
      patientId,
      encounterId,
      prescribedById: userId,
      items: { create: items },
    },
  });

  await recordAudit({
    action: "PRESCRIPTION_CREATED",
    entity: "Prescription",
    entityId: prescription.id,
    metadata: { patientId, encounterId, itemCount: items.length },
  });

  revalidatePath(`/dashboard/encounters/${encounterId}`);
}
