"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prescriptionDispenseStatus } from "@/lib/prescriptions";
import { roleHasModuleAccess } from "@/lib/access";

// Pages use this to decide whether to render pharmacy screens at all;
// mutating actions below re-check independently since they're reachable
// directly via POST regardless of what the UI renders. The role→module map
// itself lives in src/lib/access.ts (shared with proxy.ts and every other
// gated module).
export async function hasPharmacyAccess(): Promise<boolean> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return roleHasModuleAccess(role, "pharmacy");
}

async function requirePharmacyAccess(): Promise<string> {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || !roleHasModuleAccess(user.role, "pharmacy")) {
    throw new Error("Pharmacy access is restricted to pharmacy staff.");
  }
  return user.id;
}

// ----------------------------------------------------------------------------
// Drug formulary
// ----------------------------------------------------------------------------

const DrugSchema = z.object({
  name: z.string().min(1),
  genericName: z.string().optional(),
  form: z.string().optional(),
  unit: z.string().optional(),
  unitPrice: z.coerce.number().min(0),
  quantityOnHand: z.coerce.number().int().min(0),
  reorderLevel: z.coerce.number().int().min(0),
  nhisCovered: z.coerce.boolean(),
  isAvailable: z.coerce.boolean(),
});

function parseDrugForm(formData: FormData) {
  return DrugSchema.parse({
    name: formData.get("name"),
    genericName: formData.get("genericName") || undefined,
    form: formData.get("form") || undefined,
    unit: formData.get("unit") || undefined,
    unitPrice: formData.get("unitPrice"),
    quantityOnHand: formData.get("quantityOnHand"),
    reorderLevel: formData.get("reorderLevel"),
    nhisCovered: formData.get("nhisCovered") === "on",
    isAvailable: formData.get("isAvailable") === "on",
  });
}

function drugNameConflictMessage(error: unknown): string | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "A drug with that name already exists in the formulary.";
  }
  return null;
}

export async function listDrugs(query: string) {
  if (!query) {
    return prisma.drug.findMany({ orderBy: { name: "asc" } });
  }
  return prisma.drug.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { genericName: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { name: "asc" },
  });
}

export async function createDrug(formData: FormData) {
  await requirePharmacyAccess();
  const parsed = parseDrugForm(formData);

  try {
    await prisma.drug.create({ data: parsed });
  } catch (error) {
    const message = drugNameConflictMessage(error);
    if (message) {
      redirect(`/dashboard/pharmacy/drugs/new?error=${encodeURIComponent(message)}`);
    }
    throw error;
  }

  revalidatePath("/dashboard/pharmacy/drugs");
  redirect("/dashboard/pharmacy/drugs");
}

export async function updateDrug(id: string, formData: FormData) {
  await requirePharmacyAccess();
  const parsed = parseDrugForm(formData);

  try {
    await prisma.drug.update({ where: { id }, data: parsed });
  } catch (error) {
    const message = drugNameConflictMessage(error);
    if (message) {
      redirect(
        `/dashboard/pharmacy/drugs/${id}/edit?error=${encodeURIComponent(message)}`
      );
    }
    throw error;
  }

  revalidatePath("/dashboard/pharmacy/drugs");
  revalidatePath("/dashboard/encounters");
  redirect("/dashboard/pharmacy/drugs");
}

// ----------------------------------------------------------------------------
// Dispensing
// ----------------------------------------------------------------------------

const prescriptionInclude = {
  patient: true,
  prescribedBy: true,
  items: { include: { drug: true } },
  dispenses: { include: { items: true } },
} satisfies Prisma.PrescriptionInclude;

export async function listPendingPrescriptions(query: string) {
  const prescriptions = await prisma.prescription.findMany({
    where: query
      ? {
          OR: [
            { patient: { firstName: { contains: query, mode: "insensitive" } } },
            { patient: { lastName: { contains: query, mode: "insensitive" } } },
            {
              patient: {
                hospitalNumber: { contains: query, mode: "insensitive" },
              },
            },
          ],
        }
      : undefined,
    include: prescriptionInclude,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return prescriptions.filter(
    (rx) => prescriptionDispenseStatus(rx) !== "COMPLETE"
  );
}

export async function getPrescriptionForDispensing(id: string) {
  return prisma.prescription.findUnique({
    where: { id },
    include: prescriptionInclude,
  });
}

export async function dispensePrescription(
  prescriptionId: string,
  formData: FormData
) {
  const userId = await requirePharmacyAccess();

  const drugIds = formData.getAll("drugId") as string[];
  const quantities = formData.getAll("quantity") as string[];
  const checkedDrugIds = new Set(formData.getAll("dispenseItem") as string[]);

  const itemsToDispense = drugIds
    .map((drugId, i) => ({
      drugId,
      quantity: Number.parseInt(quantities[i], 10),
    }))
    .filter(
      (item) =>
        checkedDrugIds.has(item.drugId) &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0
    );

  if (itemsToDispense.length === 0) {
    redirect(
      `/dashboard/pharmacy/${prescriptionId}?error=${encodeURIComponent(
        "Select at least one item with a quantity to dispense."
      )}`
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of itemsToDispense) {
        const drug = await tx.drug.findUnique({ where: { id: item.drugId } });
        if (!drug) throw new Error("Drug not found.");
        if (drug.quantityOnHand < item.quantity) {
          throw new Error(
            `Only ${drug.quantityOnHand} of ${drug.name} in stock — reduce the quantity or restock first.`
          );
        }
      }

      await tx.dispense.create({
        data: {
          prescriptionId,
          dispensedById: userId,
          items: { create: itemsToDispense },
        },
      });

      for (const item of itemsToDispense) {
        await tx.drug.update({
          where: { id: item.drugId },
          data: { quantityOnHand: { decrement: item.quantity } },
        });
      }
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to dispense.";
    redirect(
      `/dashboard/pharmacy/${prescriptionId}?error=${encodeURIComponent(message)}`
    );
  }

  revalidatePath(`/dashboard/pharmacy/${prescriptionId}`);
  revalidatePath("/dashboard/pharmacy");
  revalidatePath("/dashboard/pharmacy/drugs");
  revalidatePath("/dashboard/encounters");
  redirect("/dashboard/pharmacy");
}
