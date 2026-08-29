"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { roleHasModuleAccess } from "@/lib/access";
import { getFacility } from "@/lib/facility";
import { ASSET_STATUSES } from "./labels";

export async function hasAssetsAccess(): Promise<boolean> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return roleHasModuleAccess(role, "assets");
}

async function requireAssetsAccess(): Promise<void> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!roleHasModuleAccess(role, "assets")) {
    throw new Error("Fixed Assets access is restricted to stores/inventory staff.");
  }
}

export async function listAssets(query: string, status?: string) {
  return prisma.fixedAsset.findMany({
    where: {
      AND: [
        query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { tag: { contains: query, mode: "insensitive" } },
                { category: { contains: query, mode: "insensitive" } },
              ],
            }
          : {},
        status ? { status } : {},
      ],
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

export async function getAsset(id: string) {
  return prisma.fixedAsset.findUnique({ where: { id } });
}

const AssetSchema = z.object({
  name: z.string().min(1),
  tag: z.string().min(1),
  category: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchaseValue: z.coerce.number().min(0).optional(),
});

function tagConflictMessage(error: unknown): string | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "An asset with that tag already exists.";
  }
  return null;
}

export async function createAsset(formData: FormData) {
  await requireAssetsAccess();
  const parsed = AssetSchema.parse({
    name: formData.get("name"),
    tag: formData.get("tag"),
    category: formData.get("category") || undefined,
    purchaseDate: formData.get("purchaseDate") || undefined,
    purchaseValue: formData.get("purchaseValue") || undefined,
  });

  const facility = await getFacility();
  if (!facility) {
    redirect(
      `/dashboard/assets/new?error=${encodeURIComponent(
        "Set up your hospital in Hospital Setup before adding assets."
      )}`
    );
  }

  try {
    await prisma.fixedAsset.create({
      data: {
        name: parsed.name,
        tag: parsed.tag,
        category: parsed.category,
        purchaseDate: parsed.purchaseDate ? new Date(parsed.purchaseDate) : undefined,
        purchaseValue: parsed.purchaseValue,
      },
    });
  } catch (error) {
    const message = tagConflictMessage(error);
    if (message) {
      redirect(`/dashboard/assets/new?error=${encodeURIComponent(message)}`);
    }
    throw error;
  }

  revalidatePath("/dashboard/assets");
  redirect("/dashboard/assets");
}

export async function updateAsset(id: string, formData: FormData) {
  await requireAssetsAccess();
  const parsed = AssetSchema.parse({
    name: formData.get("name"),
    tag: formData.get("tag"),
    category: formData.get("category") || undefined,
    purchaseDate: formData.get("purchaseDate") || undefined,
    purchaseValue: formData.get("purchaseValue") || undefined,
  });

  try {
    await prisma.fixedAsset.update({
      where: { id },
      data: {
        name: parsed.name,
        tag: parsed.tag,
        category: parsed.category,
        purchaseDate: parsed.purchaseDate ? new Date(parsed.purchaseDate) : null,
        purchaseValue: parsed.purchaseValue ?? null,
      },
    });
  } catch (error) {
    const message = tagConflictMessage(error);
    if (message) {
      redirect(`/dashboard/assets/${id}/edit?error=${encodeURIComponent(message)}`);
    }
    throw error;
  }

  revalidatePath("/dashboard/assets");
  revalidatePath(`/dashboard/assets/${id}`);
  redirect(`/dashboard/assets/${id}`);
}

const StatusSchema = z.object({
  status: z.enum(ASSET_STATUSES),
});

export async function updateAssetStatus(id: string, formData: FormData) {
  await requireAssetsAccess();
  const parsed = StatusSchema.parse({ status: formData.get("status") });

  await prisma.fixedAsset.update({
    where: { id },
    data: { status: parsed.status },
  });

  revalidatePath(`/dashboard/assets/${id}`);
  revalidatePath("/dashboard/assets");
}
