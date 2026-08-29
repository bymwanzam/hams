"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const AppointmentSchema = z
  .object({
    patientId: z.string().min(1),
    serviceType: z.enum(["GENERAL_OPD_ADULT", "GENERAL_OPD_CHILD", "SPECIALIST"]),
    department: z.string().optional(),
    scheduledAt: z.string().min(1),
    notes: z.string().optional(),
  })
  .refine(
    (data) => data.serviceType !== "SPECIALIST" || !!data.department?.trim(),
    { message: "Department is required for specialist appointments", path: ["department"] }
  );

export async function createAppointment(formData: FormData) {
  const parsed = AppointmentSchema.parse({
    patientId: formData.get("patientId"),
    serviceType: formData.get("serviceType"),
    department: formData.get("department") || undefined,
    scheduledAt: formData.get("scheduledAt"),
    notes: formData.get("notes") || undefined,
  });

  const appointment = await prisma.appointment.create({
    data: {
      patientId: parsed.patientId,
      serviceType: parsed.serviceType,
      department: parsed.serviceType === "SPECIALIST" ? parsed.department : null,
      scheduledAt: new Date(parsed.scheduledAt),
      notes: parsed.notes,
    },
  });

  revalidatePath("/dashboard/appointments");
  redirect(`/dashboard/appointments/${appointment.id}`);
}

export async function searchAppointments(query: string) {
  if (!query) {
    return prisma.appointment.findMany({
      include: { patient: true },
      orderBy: { scheduledAt: "desc" },
      take: 25,
    });
  }

  return prisma.appointment.findMany({
    where: {
      OR: [
        { patient: { firstName: { contains: query, mode: "insensitive" } } },
        { patient: { lastName: { contains: query, mode: "insensitive" } } },
        { patient: { hospitalNumber: { contains: query, mode: "insensitive" } } },
        { department: { contains: query, mode: "insensitive" } },
      ],
    },
    include: { patient: true },
    orderBy: { scheduledAt: "desc" },
    take: 25,
  });
}

const AppointmentServiceSchema = z
  .object({
    serviceType: z.enum(["GENERAL_OPD_ADULT", "GENERAL_OPD_CHILD", "SPECIALIST"]),
    department: z.string().optional(),
  })
  .refine(
    (data) => data.serviceType !== "SPECIALIST" || !!data.department?.trim(),
    { message: "Department is required for specialist appointments", path: ["department"] }
  );

// Lets front desk correct which department/service an appointment is
// queued under (e.g. re-route from General OPD to a Specialist clinic)
// before the patient is called in. Only meaningful pre-consultation, so
// callers should only expose this while the appointment hasn't moved past
// ARRIVED yet.
export async function updateAppointmentService(
  appointmentId: string,
  formData: FormData
) {
  const parsed = AppointmentServiceSchema.parse({
    serviceType: formData.get("serviceType"),
    department: formData.get("department") || undefined,
  });

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      serviceType: parsed.serviceType,
      department: parsed.serviceType === "SPECIALIST" ? parsed.department : null,
    },
  });

  revalidatePath(`/dashboard/appointments/${appointmentId}`);
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/queue");
}

export async function recordArrival(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });
  if (!appointment) return;

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      arrivedAt: new Date(),
      status: appointment.status === "SCHEDULED" ? "ARRIVED" : appointment.status,
    },
  });

  revalidatePath(`/dashboard/appointments/${appointmentId}`);
  revalidatePath("/dashboard/queue");
}

const VitalSignSchema = z.object({
  appointmentId: z.string().min(1),
  patientId: z.string().min(1),
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

export async function recordVitals(formData: FormData) {
  const parsed = VitalSignSchema.parse({
    appointmentId: formData.get("appointmentId"),
    patientId: formData.get("patientId"),
    temperatureC: formData.get("temperatureC") || undefined,
    pulseBpm: formData.get("pulseBpm") || undefined,
    respirationRate: formData.get("respirationRate") || undefined,
    bpSystolic: formData.get("bpSystolic") || undefined,
    bpDiastolic: formData.get("bpDiastolic") || undefined,
    spo2: formData.get("spo2") || undefined,
    weightKg: formData.get("weightKg") || undefined,
    heightCm: formData.get("heightCm") || undefined,
  });

  await prisma.vitalSign.create({
    data: {
      appointmentId: parsed.appointmentId,
      patientId: parsed.patientId,
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

  revalidatePath(`/dashboard/appointments/${parsed.appointmentId}`);
}

const STATUS_VALUES = [
  "SCHEDULED",
  "CONFIRMED",
  "ARRIVED",
  "IN_PROGRESS",
  "COMPLETED",
  "NO_SHOW",
  "CANCELLED",
] as const;

export async function updateAppointmentStatus(formData: FormData) {
  const appointmentId = formData.get("appointmentId") as string;
  const status = z.enum(STATUS_VALUES).parse(formData.get("status"));

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status },
  });

  revalidatePath(`/dashboard/appointments/${appointmentId}`);
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/queue");
}
