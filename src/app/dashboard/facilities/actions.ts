"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const FacilitySchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  isMain: z.coerce.boolean(),
});

function parseFacilityForm(formData: FormData) {
  return FacilitySchema.parse({
    name: formData.get("name"),
    code: formData.get("code"),
    address: formData.get("address") || undefined,
    phone: formData.get("phone") || undefined,
    isMain: formData.get("isMain") === "on",
  });
}

function codeConflictMessage(error: unknown): string | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "That facility code is already in use. Choose a different one.";
  }
  return null;
}

export async function createFacility(formData: FormData) {
  const parsed = parseFacilityForm(formData);

  let facilityId: string;
  try {
    facilityId = await prisma.$transaction(async (tx) => {
      if (parsed.isMain) {
        await tx.facility.updateMany({
          where: { isMain: true },
          data: { isMain: false },
        });
      }
      const facility = await tx.facility.create({
        data: {
          name: parsed.name,
          code: parsed.code,
          address: parsed.address,
          phone: parsed.phone,
          isMain: parsed.isMain,
        },
      });
      return facility.id;
    });
  } catch (error) {
    const message = codeConflictMessage(error);
    if (message) {
      redirect(`/dashboard/facilities/new?error=${encodeURIComponent(message)}`);
    }
    throw error;
  }

  revalidatePath("/dashboard/facilities");
  revalidatePath("/dashboard");
  redirect(`/dashboard/facilities/${facilityId}/edit`);
}

export async function updateFacility(id: string, formData: FormData) {
  const existing = await prisma.facility.findUnique({ where: { id } });
  if (!existing) {
    redirect("/dashboard/facilities");
  }

  const parsed = parseFacilityForm(formData);

  try {
    await prisma.$transaction(async (tx) => {
      if (parsed.isMain && !existing.isMain) {
        await tx.facility.updateMany({
          where: { isMain: true },
          data: { isMain: false },
        });
      }
      await tx.facility.update({
        where: { id },
        data: {
          name: parsed.name,
          code: parsed.code,
          address: parsed.address,
          phone: parsed.phone,
          isMain: parsed.isMain,
        },
      });
    });
  } catch (error) {
    const message = codeConflictMessage(error);
    if (message) {
      redirect(
        `/dashboard/facilities/${id}/edit?error=${encodeURIComponent(message)}`
      );
    }
    throw error;
  }

  revalidatePath("/dashboard/facilities");
  revalidatePath("/dashboard");
  redirect("/dashboard/facilities");
}

export async function deleteFacility(id: string) {
  const existing = await prisma.facility.findUnique({ where: { id } });
  if (!existing) {
    redirect("/dashboard/facilities");
  }

  try {
    await prisma.facility.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      redirect(
        `/dashboard/facilities?error=${encodeURIComponent(
          "This facility has staff, patients, or other records attached and can't be deleted. Reassign them first."
        )}`
      );
    }
    throw error;
  }

  revalidatePath("/dashboard/facilities");
  revalidatePath("/dashboard");
  redirect("/dashboard/facilities");
}

export async function listFacilities() {
  return prisma.facility.findMany({
    orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { users: true, patients: true } },
    },
  });
}
