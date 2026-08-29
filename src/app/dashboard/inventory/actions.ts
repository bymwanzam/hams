"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { roleHasModuleAccess } from "@/lib/access";
import { getFacility } from "@/lib/facility";
import { STOCK_TRANSACTION_TYPES } from "./labels";

export async function hasInventoryAccess(): Promise<boolean> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return roleHasModuleAccess(role, "inventory");
}

async function requireInventoryAccess(): Promise<void> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!roleHasModuleAccess(role, "inventory")) {
    throw new Error("Inventory access is restricted to stores/inventory staff.");
  }
}

export async function listItems(query: string) {
  return prisma.inventoryItem.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function getItem(id: string) {
  return prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      stockTransactions: { orderBy: { createdAt: "desc" } },
    },
  });
}

const ItemSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  unit: z.string().optional(),
  reorderLevel: z.coerce.number().int().min(0),
});

function nameConflictMessage(error: unknown): string | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "An item with that name already exists.";
  }
  return null;
}

export async function createItem(formData: FormData) {
  await requireInventoryAccess();
  const parsed = ItemSchema.parse({
    name: formData.get("name"),
    category: formData.get("category") || undefined,
    unit: formData.get("unit") || undefined,
    reorderLevel: formData.get("reorderLevel"),
  });
  const startingQuantity = Number.parseInt(
    (formData.get("quantityOnHand") as string) || "0",
    10
  );

  const facility = await getFacility();
  if (!facility) {
    redirect(
      `/dashboard/inventory/new?error=${encodeURIComponent(
        "Set up your hospital in Hospital Setup before adding inventory."
      )}`
    );
  }

  try {
    await prisma.inventoryItem.create({
      data: {
        ...parsed,
        quantityOnHand: Number.isFinite(startingQuantity) ? startingQuantity : 0,
      },
    });
  } catch (error) {
    const message = nameConflictMessage(error);
    if (message) {
      redirect(`/dashboard/inventory/new?error=${encodeURIComponent(message)}`);
    }
    throw error;
  }

  revalidatePath("/dashboard/inventory");
  redirect("/dashboard/inventory");
}

export async function updateItem(id: string, formData: FormData) {
  await requireInventoryAccess();
  const parsed = ItemSchema.parse({
    name: formData.get("name"),
    category: formData.get("category") || undefined,
    unit: formData.get("unit") || undefined,
    reorderLevel: formData.get("reorderLevel"),
  });

  try {
    await prisma.inventoryItem.update({ where: { id }, data: parsed });
  } catch (error) {
    const message = nameConflictMessage(error);
    if (message) {
      redirect(
        `/dashboard/inventory/${id}/edit?error=${encodeURIComponent(message)}`
      );
    }
    throw error;
  }

  revalidatePath("/dashboard/inventory");
  revalidatePath(`/dashboard/inventory/${id}`);
  redirect(`/dashboard/inventory/${id}`);
}

const TransactionSchema = z.object({
  type: z.enum(STOCK_TRANSACTION_TYPES),
  quantity: z.coerce.number().int(),
  reference: z.string().optional(),
});

// RECEIPT and ADJUSTMENT are entered as the exact signed change (a receipt
// is always positive; an adjustment can correct up or down). ISSUE and
// TRANSFER are entered as a positive count of how many are going out, and
// applied as a negative delta here — stock can't be issued/transferred
// below zero.
export async function recordTransaction(itemId: string, formData: FormData) {
  await requireInventoryAccess();
  const parsed = TransactionSchema.parse({
    type: formData.get("type"),
    quantity: formData.get("quantity"),
    reference: formData.get("reference") || undefined,
  });

  const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) redirect("/dashboard/inventory");

  const outbound = parsed.type === "ISSUE" || parsed.type === "TRANSFER";
  const delta = outbound ? -Math.abs(parsed.quantity) : parsed.quantity;

  if (outbound && item.quantityOnHand + delta < 0) {
    redirect(
      `/dashboard/inventory/${itemId}?error=${encodeURIComponent(
        `Only ${item.quantityOnHand} ${item.unit ?? "unit(s)"} in stock — reduce the quantity.`
      )}`
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockTransaction.create({
      data: {
        itemId,
        type: parsed.type,
        quantity: delta,
        reference: parsed.reference,
      },
    });
    await tx.inventoryItem.update({
      where: { id: itemId },
      data: { quantityOnHand: { increment: delta } },
    });
  });

  revalidatePath(`/dashboard/inventory/${itemId}`);
  revalidatePath("/dashboard/inventory");
}
