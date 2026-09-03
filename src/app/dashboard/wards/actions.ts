"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { getFacility } from "@/lib/facility";
import { recordAudit } from "@/lib/audit";
import { chartedVitalKeys } from "@/lib/vitals";
import { BLOOD_GROUPS, BLOOD_URGENCIES } from "../blood-bank/labels";

async function currentUserId(): Promise<string | undefined> {
  const session = await auth();
  return (session?.user as { id?: string } | undefined)?.id;
}

export async function listWards() {
  return prisma.ward.findMany({
    include: {
      beds: {
        include: {
          admissions: {
            where: { status: "ADMITTED" },
            include: { patient: true },
            take: 1,
          },
        },
        orderBy: { label: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function searchActiveAdmissions(query: string) {
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
    include: { patient: true, bed: { include: { ward: true } } },
    orderBy: { admittedAt: "desc" },
  });
}

const WardSchema = z.object({
  name: z.string().min(1),
});

function wardNameConflictMessage(error: unknown): string | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "A ward with that name already exists.";
  }
  return null;
}

export async function createWard(formData: FormData) {
  const parsed = WardSchema.parse({ name: formData.get("name") });

  const facility = await getFacility();
  if (!facility) {
    redirect(
      `/dashboard/wards?error=${encodeURIComponent(
        "Set up your hospital in Hospital Setup before adding wards."
      )}`
    );
  }

  try {
    await prisma.ward.create({
      data: { name: parsed.name },
    });
  } catch (error) {
    const message = wardNameConflictMessage(error);
    if (message) {
      redirect(`/dashboard/wards?error=${encodeURIComponent(message)}`);
    }
    throw error;
  }

  revalidatePath("/dashboard/wards");
}

const BedSchema = z.object({
  wardId: z.string().min(1),
  label: z.string().min(1),
});

export async function addBed(formData: FormData) {
  const parsed = BedSchema.parse({
    wardId: formData.get("wardId"),
    label: formData.get("label"),
  });

  await prisma.bed.create({
    data: { wardId: parsed.wardId, label: parsed.label },
  });

  revalidatePath("/dashboard/wards");
}

const AdmitSchema = z.object({
  patientId: z.string().min(1),
  bedId: z.string().min(1),
  admissionNotes: z.string().optional(),
});

export async function admitPatient(formData: FormData) {
  const parsed = AdmitSchema.parse({
    patientId: formData.get("patientId"),
    bedId: formData.get("bedId"),
    admissionNotes: formData.get("admissionNotes") || undefined,
  });

  const bed = await prisma.bed.findUnique({ where: { id: parsed.bedId } });
  if (!bed || bed.isOccupied) {
    redirect(
      `/dashboard/wards/new?patientId=${parsed.patientId}&error=${encodeURIComponent(
        "That bed is no longer free. Pick another one."
      )}`
    );
  }

  const admission = await prisma.$transaction(async (tx) => {
    const created = await tx.admission.create({
      data: {
        patientId: parsed.patientId,
        bedId: parsed.bedId,
        admissionNotes: parsed.admissionNotes,
      },
    });
    await tx.bed.update({
      where: { id: parsed.bedId },
      data: { isOccupied: true },
    });
    return created;
  });

  await recordAudit({
    action: "ADMISSION_CREATED",
    entity: "Admission",
    entityId: admission.id,
    metadata: { patientId: parsed.patientId, bedId: parsed.bedId },
  });

  revalidatePath("/dashboard/wards");
  redirect(`/dashboard/wards/${admission.id}`);
}

const DischargeSchema = z.object({
  dischargeNotes: z.string().optional(),
});

export async function dischargePatient(admissionId: string, formData: FormData) {
  const parsed = DischargeSchema.parse({
    dischargeNotes: formData.get("dischargeNotes") || undefined,
  });

  const admission = await prisma.admission.findUnique({
    where: { id: admissionId },
  });
  if (!admission) redirect("/dashboard/wards");

  await prisma.$transaction(async (tx) => {
    await tx.admission.update({
      where: { id: admissionId },
      data: {
        status: "DISCHARGED",
        dischargedAt: new Date(),
        dischargeNotes: parsed.dischargeNotes,
      },
    });
    await tx.bed.update({
      where: { id: admission.bedId },
      data: { isOccupied: false },
    });
  });

  await recordAudit({
    action: "PATIENT_DISCHARGED",
    entity: "Admission",
    entityId: admissionId,
    metadata: { patientId: admission.patientId },
  });

  revalidatePath("/dashboard/wards");
  revalidatePath(`/dashboard/wards/${admissionId}`);
}

const ReferSchema = z.object({
  referredTo: z.string().min(1),
  referralReason: z.string().min(1),
});

// Refers the patient elsewhere (another facility/specialist) because
// they're not improving under current care — frees up the bed the same way
// a discharge would.
export async function referPatient(admissionId: string, formData: FormData) {
  const parsed = ReferSchema.parse({
    referredTo: formData.get("referredTo"),
    referralReason: formData.get("referralReason"),
  });

  const admission = await prisma.admission.findUnique({
    where: { id: admissionId },
  });
  if (!admission) redirect("/dashboard/wards");

  await prisma.$transaction(async (tx) => {
    await tx.admission.update({
      where: { id: admissionId },
      data: {
        status: "TRANSFERRED",
        dischargedAt: new Date(),
        referredTo: parsed.referredTo,
        referralReason: parsed.referralReason,
      },
    });
    await tx.bed.update({
      where: { id: admission.bedId },
      data: { isOccupied: false },
    });
  });

  await recordAudit({
    action: "PATIENT_TRANSFERRED",
    entity: "Admission",
    entityId: admissionId,
    metadata: { patientId: admission.patientId, referredTo: parsed.referredTo },
  });

  revalidatePath("/dashboard/wards");
  revalidatePath(`/dashboard/wards/${admissionId}`);
}

const DeathSchema = z.object({
  causeOfDeath: z.string().min(1),
});

// Records an inpatient death — dischargedAt doubles as date of death, same
// as the discharge/referral outcomes, and frees the bed the same way.
export async function recordDeath(admissionId: string, formData: FormData) {
  const parsed = DeathSchema.parse({
    causeOfDeath: formData.get("causeOfDeath"),
  });

  const admission = await prisma.admission.findUnique({
    where: { id: admissionId },
  });
  if (!admission) redirect("/dashboard/wards");

  await prisma.$transaction(async (tx) => {
    await tx.admission.update({
      where: { id: admissionId },
      data: {
        status: "DECEASED",
        dischargedAt: new Date(),
        causeOfDeath: parsed.causeOfDeath,
      },
    });
    await tx.bed.update({
      where: { id: admission.bedId },
      data: { isOccupied: false },
    });
  });

  await recordAudit({
    action: "DEATH_RECORDED",
    entity: "Admission",
    entityId: admissionId,
    metadata: { patientId: admission.patientId },
  });

  revalidatePath("/dashboard/wards");
  revalidatePath(`/dashboard/wards/${admissionId}`);
}

// Flags/unflags the admitting diagnosis as malaria — feeds the inpatient
// malaria summary report. Not gated to active admissions since a diagnosis
// (e.g. from a lab result) can be confirmed after the fact.
export async function setMalariaCase(admissionId: string, formData: FormData) {
  await prisma.admission.update({
    where: { id: admissionId },
    data: { isMalariaCase: formData.get("isMalariaCase") === "on" },
  });

  revalidatePath(`/dashboard/wards/${admissionId}`);
}

const VitalSignSchema = z.object({
  temperatureC: z.string().optional(),
  pulseBpm: z.string().optional(),
  respirationRate: z.string().optional(),
  bpSystolic: z.string().optional(),
  bpDiastolic: z.string().optional(),
  spo2: z.string().optional(),
  weightKg: z.string().optional(),
  heightCm: z.string().optional(),
});

function toFloat(v?: string) {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function toInt(v?: string) {
  if (!v) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

// Nurse-charted vitals for an inpatient — not tied to a specific ward-round
// Encounter, so they can be recorded on a regular schedule regardless of
// whether a doctor's round is in progress.
export async function recordAdmissionVitals(
  admissionId: string,
  formData: FormData
) {
  const admission = await prisma.admission.findUnique({
    where: { id: admissionId },
  });
  if (!admission) redirect("/dashboard/wards");

  const parsed = VitalSignSchema.parse({
    temperatureC: formData.get("temperatureC") || undefined,
    pulseBpm: formData.get("pulseBpm") || undefined,
    respirationRate: formData.get("respirationRate") || undefined,
    bpSystolic: formData.get("bpSystolic") || undefined,
    bpDiastolic: formData.get("bpDiastolic") || undefined,
    spo2: formData.get("spo2") || undefined,
    weightKg: formData.get("weightKg") || undefined,
    heightCm: formData.get("heightCm") || undefined,
  });

  const created = await prisma.vitalSign.create({
    data: {
      admissionId,
      patientId: admission.patientId,
      temperatureC: toFloat(parsed.temperatureC),
      pulseBpm: toInt(parsed.pulseBpm),
      respirationRate: toInt(parsed.respirationRate),
      bpSystolic: toInt(parsed.bpSystolic),
      bpDiastolic: toInt(parsed.bpDiastolic),
      spo2: toInt(parsed.spo2),
      weightKg: toFloat(parsed.weightKg),
      heightCm: toFloat(parsed.heightCm),
    },
  });

  await recordAudit({
    action: "VITALS_RECORDED",
    entity: "VitalSign",
    entityId: created.id,
    metadata: {
      patientId: admission.patientId,
      admissionId,
      keys: chartedVitalKeys(parsed),
    },
  });

  revalidatePath(`/dashboard/wards/${admissionId}`);
  revalidatePath("/dashboard/vitals");
}

const NurseNoteSchema = z.object({
  note: z.string().min(1),
  management: z.string().optional(),
});

// A running nursing-care log for the stay — distinct from the doctor's
// ward-round Encounters (diagnosis/orders/prescriptions).
export async function addNurseNote(admissionId: string, formData: FormData) {
  const parsed = NurseNoteSchema.parse({
    note: formData.get("note"),
    management: formData.get("management") || undefined,
  });

  const userId = await currentUserId();
  if (!userId) throw new Error("Unauthorized");

  await prisma.nurseNote.create({
    data: {
      admissionId,
      authorId: userId,
      note: parsed.note,
      management: parsed.management,
    },
  });

  revalidatePath(`/dashboard/wards/${admissionId}`);
}

const FluidBalanceSchema = z.object({
  oralIntakeMl: z.string().optional(),
  ivIntakeMl: z.string().optional(),
  otherIntakeMl: z.string().optional(),
  urineOutputMl: z.string().optional(),
  otherOutputMl: z.string().optional(),
  notes: z.string().optional(),
});

// Fluid balance / intake-output chart — a running ward-nursing log of
// fluids in (by route) and out (by route) over the stay, distinct from
// NurseNote's free-text observations and from VitalSign's point-in-time
// readings. Every field is optional — an entry only records what was
// actually measured that round.
export async function addFluidBalanceEntry(
  admissionId: string,
  formData: FormData
) {
  const parsed = FluidBalanceSchema.parse({
    oralIntakeMl: formData.get("oralIntakeMl") || undefined,
    ivIntakeMl: formData.get("ivIntakeMl") || undefined,
    otherIntakeMl: formData.get("otherIntakeMl") || undefined,
    urineOutputMl: formData.get("urineOutputMl") || undefined,
    otherOutputMl: formData.get("otherOutputMl") || undefined,
    notes: formData.get("notes") || undefined,
  });

  const userId = await currentUserId();
  if (!userId) throw new Error("Unauthorized");

  await prisma.fluidBalanceEntry.create({
    data: {
      admissionId,
      authorId: userId,
      oralIntakeMl: toInt(parsed.oralIntakeMl),
      ivIntakeMl: toInt(parsed.ivIntakeMl),
      otherIntakeMl: toInt(parsed.otherIntakeMl),
      urineOutputMl: toInt(parsed.urineOutputMl),
      otherOutputMl: toInt(parsed.otherOutputMl),
      notes: parsed.notes,
    },
  });

  revalidatePath(`/dashboard/wards/${admissionId}`);
}

const BloodRequestSchema = z.object({
  bloodGroup: z.enum(BLOOD_GROUPS),
  unitsNeeded: z.coerce.number().int().min(1),
  urgency: z.enum(BLOOD_URGENCIES),
  indication: z.string().min(1),
});

// A doctor's request, from the ward, for blood to be issued for this
// admission — picked up from the Blood Bank module's "Ward Requests" queue
// and matched to actual units there (see blood-bank/actions.ts).
export async function requestBlood(admissionId: string, formData: FormData) {
  const parsed = BloodRequestSchema.parse({
    bloodGroup: formData.get("bloodGroup"),
    unitsNeeded: formData.get("unitsNeeded"),
    urgency: formData.get("urgency"),
    indication: formData.get("indication"),
  });

  const admission = await prisma.admission.findUnique({
    where: { id: admissionId },
  });
  if (!admission) redirect("/dashboard/wards");

  const userId = await currentUserId();
  if (!userId) throw new Error("Unauthorized");

  const request = await prisma.bloodRequest.create({
    data: {
      patientId: admission.patientId,
      admissionId,
      requestedById: userId,
      bloodGroup: parsed.bloodGroup,
      unitsNeeded: parsed.unitsNeeded,
      urgency: parsed.urgency,
      indication: parsed.indication,
    },
  });

  await recordAudit({
    action: "BLOOD_REQUEST_CREATED",
    entity: "BloodRequest",
    entityId: request.id,
    metadata: {
      patientId: admission.patientId,
      bloodGroup: parsed.bloodGroup,
      unitsNeeded: parsed.unitsNeeded,
      urgency: parsed.urgency,
    },
  });

  revalidatePath(`/dashboard/wards/${admissionId}`);
  revalidatePath("/dashboard/blood-bank");
  revalidatePath("/dashboard/blood-bank/requests");
}
