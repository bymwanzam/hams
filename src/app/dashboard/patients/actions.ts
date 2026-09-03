"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { recordAudit, changedFields } from "@/lib/audit";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const PatientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().min(1),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  nextOfKinName: z.string().optional(),
  nextOfKinPhone: z.string().optional(),
  bloodGroup: z.string().optional(),
  nhisNumber: z.string().optional(),
  ghanaCardNumber: z.string().optional(),
  insuranceStatus: z.enum(["INSURED", "CASH"]).default("CASH"),
});

function parsePatientForm(formData: FormData) {
  return PatientSchema.parse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    dateOfBirth: formData.get("dateOfBirth"),
    gender: formData.get("gender"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    address: formData.get("address") || undefined,
    nextOfKinName: formData.get("nextOfKinName") || undefined,
    nextOfKinPhone: formData.get("nextOfKinPhone") || undefined,
    bloodGroup: formData.get("bloodGroup") || undefined,
    nhisNumber: formData.get("nhisNumber") || undefined,
    ghanaCardNumber: formData.get("ghanaCardNumber") || undefined,
    insuranceStatus: formData.get("insuranceStatus") || undefined,
  });
}

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "patients");
const MAX_PHOTO_BYTES = 4 * 1024 * 1024; // 4MB
const ALLOWED_PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Saves the uploaded patient photo to public/uploads/patients and returns
// the URL to store on the Patient record. Returns undefined if no photo
// was submitted.
async function savePatientPhoto(file: File | null): Promise<string | undefined> {
  if (!file || file.size === 0) return undefined;

  const extension = ALLOWED_PHOTO_TYPES[file.type];
  if (!extension) {
    throw new Error("Photo must be a JPEG, PNG or WebP image");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("Photo must be smaller than 4MB");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return `/uploads/patients/${filename}`;
}

// Best-effort removal of a previously uploaded photo (e.g. when replaced or
// the patient is deleted). Never throws — a stale file is a minor cleanup
// issue, not something that should block the mutation.
async function deletePatientPhoto(photoUrl: string | null | undefined) {
  if (!photoUrl || !photoUrl.startsWith("/uploads/patients/")) return;
  try {
    await unlink(path.join(process.cwd(), "public", photoUrl));
  } catch {
    // File already gone or inaccessible — nothing to do.
  }
}

async function generateHospitalNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.patient.count();
  return `HAM-${year}-${String(count + 1).padStart(5, "0")}`;
}

// Field(s) responsible for a P2002 unique-constraint violation, mapped to a
// human-readable name for the error banner.
const UNIQUE_FIELD_LABELS: Record<string, string> = {
  nhisNumber: "NHIS number",
  ghanaCardNumber: "Ghana Card number",
  cardId: "Card ID",
};

function uniqueConstraintMessage(error: unknown): string | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = (error.meta?.target as string[] | undefined) ?? [];
    const field = target.find((f) => f in UNIQUE_FIELD_LABELS);
    const label = field ? UNIQUE_FIELD_LABELS[field] : "value";
    return `That ${label} is already registered to another patient.`;
  }
  return null;
}

export async function createPatient(formData: FormData) {
  const parsed = parsePatientForm(formData);

  const photoFile = formData.get("photo");
  const photoUrl = await savePatientPhoto(
    photoFile instanceof File ? photoFile : null
  );

  const hospitalNumber = await generateHospitalNumber();

  let patientId: string;
  try {
    const patient = await prisma.patient.create({
      data: {
        hospitalNumber,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        dateOfBirth: new Date(parsed.dateOfBirth),
        gender: parsed.gender,
        phone: parsed.phone,
        email: parsed.email || undefined,
        address: parsed.address,
        nextOfKinName: parsed.nextOfKinName,
        nextOfKinPhone: parsed.nextOfKinPhone,
        bloodGroup: parsed.bloodGroup,
        nhisNumber: parsed.nhisNumber,
        ghanaCardNumber: parsed.ghanaCardNumber,
        insuranceStatus: parsed.insuranceStatus,
        photoUrl,
      },
    });
    patientId = patient.id;
  } catch (error) {
    const message = uniqueConstraintMessage(error);
    if (message) {
      redirect(`/dashboard/patients/new?error=${encodeURIComponent(message)}`);
    }
    throw error;
  }

  await recordAudit({
    action: "PATIENT_CREATED",
    entity: "Patient",
    entityId: patientId,
    metadata: { hospitalNumber },
  });

  revalidatePath("/dashboard/patients");
  redirect(`/dashboard/patients/${patientId}`);
}

export async function updatePatient(id: string, formData: FormData) {
  const existing = await prisma.patient.findUnique({ where: { id } });
  if (!existing) {
    redirect("/dashboard/patients");
  }

  const parsed = parsePatientForm(formData);

  const photoFile = formData.get("photo");
  const newPhotoUrl = await savePatientPhoto(
    photoFile instanceof File ? photoFile : null
  );

  try {
    await prisma.patient.update({
      where: { id },
      data: {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        dateOfBirth: new Date(parsed.dateOfBirth),
        gender: parsed.gender,
        phone: parsed.phone,
        email: parsed.email || undefined,
        address: parsed.address,
        nextOfKinName: parsed.nextOfKinName,
        nextOfKinPhone: parsed.nextOfKinPhone,
        bloodGroup: parsed.bloodGroup,
        nhisNumber: parsed.nhisNumber,
        ghanaCardNumber: parsed.ghanaCardNumber,
        insuranceStatus: parsed.insuranceStatus,
        ...(newPhotoUrl ? { photoUrl: newPhotoUrl } : {}),
      },
    });
  } catch (error) {
    const message = uniqueConstraintMessage(error);
    if (message) {
      redirect(
        `/dashboard/patients/${id}/edit?error=${encodeURIComponent(message)}`
      );
    }
    throw error;
  }

  if (newPhotoUrl) {
    await deletePatientPhoto(existing.photoUrl);
  }

  await recordAudit({
    action: "PATIENT_UPDATED",
    entity: "Patient",
    entityId: id,
    metadata: {
      changed: changedFields(
        existing as unknown as Record<string, unknown>,
        {
          ...(parsed as unknown as Record<string, unknown>),
          ...(newPhotoUrl ? { photoUrl: newPhotoUrl } : {}),
        }
      ),
    },
  });

  revalidatePath("/dashboard/patients");
  revalidatePath(`/dashboard/patients/${id}`);
  redirect(`/dashboard/patients/${id}`);
}

export async function deletePatient(id: string) {
  const existing = await prisma.patient.findUnique({ where: { id } });
  if (!existing) {
    redirect("/dashboard/patients");
  }

  try {
    await prisma.patient.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      redirect(
        `/dashboard/patients/${id}?error=${encodeURIComponent(
          "This patient has recorded visits, appointments, or other history and can't be deleted. Consider editing their record instead."
        )}`
      );
    }
    throw error;
  }

  await deletePatientPhoto(existing.photoUrl);

  await recordAudit({
    action: "PATIENT_DELETED",
    entity: "Patient",
    entityId: id,
    metadata: {
      hospitalNumber: existing.hospitalNumber,
      name: `${existing.firstName} ${existing.lastName}`,
    },
  });

  revalidatePath("/dashboard/patients");
  redirect("/dashboard/patients");
}

export async function searchPatients(query: string) {
  if (!query) {
    return prisma.patient.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
    });
  }

  return prisma.patient.findMany({
    where: {
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { hospitalNumber: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 25,
  });
}
