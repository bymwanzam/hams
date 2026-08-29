"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { roleHasModuleAccess } from "@/lib/access";
import { LAB_ORDER_STATUSES } from "./labels";

export async function hasLabAccess(): Promise<boolean> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return roleHasModuleAccess(role, "lab");
}

async function requireLabAccess(): Promise<void> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!roleHasModuleAccess(role, "lab")) {
    throw new Error("Laboratory access is restricted to lab staff.");
  }
}

// ----------------------------------------------------------------------------
// Orders / worklist
// ----------------------------------------------------------------------------

const orderInclude = {
  patient: true,
  test: true,
  orderedBy: true,
} satisfies Prisma.LabOrderInclude;

export async function listPendingLabOrders(query: string) {
  return prisma.labOrder.findMany({
    where: {
      status: { notIn: ["COMPLETED", "CANCELLED"] },
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
              { test: { name: { contains: query, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: orderInclude,
    orderBy: { orderedAt: "asc" },
  });
}

export async function getLabOrder(id: string) {
  return prisma.labOrder.findUnique({
    where: { id },
    include: orderInclude,
  });
}

const StatusSchema = z.object({
  status: z.enum(LAB_ORDER_STATUSES),
});

export async function updateOrderStatus(orderId: string, formData: FormData) {
  await requireLabAccess();
  const parsed = StatusSchema.parse({ status: formData.get("status") });

  // Completing an order this way (rather than through "Record Result")
  // would leave it marked done with no result ever saved. Require the
  // result to already be on file — recordResult() is the only path that's
  // allowed to set COMPLETED directly.
  if (parsed.status === "COMPLETED") {
    const order = await prisma.labOrder.findUnique({ where: { id: orderId } });
    if (!order?.resultValue) {
      redirect(
        `/dashboard/lab/${orderId}?error=${encodeURIComponent(
          "Save the result first — the order completes automatically once a result is recorded."
        )}`
      );
    }
  }

  await prisma.labOrder.update({
    where: { id: orderId },
    data: { status: parsed.status },
  });

  revalidatePath(`/dashboard/lab/${orderId}`);
  revalidatePath("/dashboard/lab");
  revalidatePath("/dashboard/encounters");
}

const ResultSchema = z.object({
  resultValue: z.string().min(1),
  resultUnit: z.string().optional(),
  referenceRange: z.string().optional(),
  analyzerRef: z.string().optional(),
});

export async function recordResult(orderId: string, formData: FormData) {
  await requireLabAccess();
  const parsed = ResultSchema.parse({
    resultValue: formData.get("resultValue"),
    resultUnit: formData.get("resultUnit") || undefined,
    referenceRange: formData.get("referenceRange") || undefined,
    analyzerRef: formData.get("analyzerRef") || undefined,
  });

  await prisma.labOrder.update({
    where: { id: orderId },
    data: {
      resultValue: parsed.resultValue,
      resultUnit: parsed.resultUnit,
      referenceRange: parsed.referenceRange,
      analyzerRef: parsed.analyzerRef,
      status: "COMPLETED",
      resultedAt: new Date(),
    },
  });

  revalidatePath(`/dashboard/lab/${orderId}`);
  revalidatePath("/dashboard/lab");
  revalidatePath("/dashboard/encounters");
}

// ----------------------------------------------------------------------------
// Test catalog
// ----------------------------------------------------------------------------

export async function listTests(query: string) {
  return prisma.labTest.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { code: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

const TestSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  category: z.string().optional(),
  sampleType: z.string().optional(),
  price: z.coerce.number().min(0),
  isAvailable: z.coerce.boolean(),
});

function parseTestForm(formData: FormData) {
  return TestSchema.parse({
    name: formData.get("name"),
    code: formData.get("code"),
    category: formData.get("category") || undefined,
    sampleType: formData.get("sampleType") || undefined,
    price: formData.get("price"),
    isAvailable: formData.get("isAvailable") === "on",
  });
}

function codeConflictMessage(error: unknown): string | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "A test with that code already exists.";
  }
  return null;
}

export async function createTest(formData: FormData) {
  await requireLabAccess();
  const parsed = parseTestForm(formData);

  try {
    await prisma.labTest.create({ data: parsed });
  } catch (error) {
    const message = codeConflictMessage(error);
    if (message) {
      redirect(`/dashboard/lab/catalog/new?error=${encodeURIComponent(message)}`);
    }
    throw error;
  }

  revalidatePath("/dashboard/lab/catalog");
  redirect("/dashboard/lab/catalog");
}

export async function updateTest(id: string, formData: FormData) {
  await requireLabAccess();
  const parsed = parseTestForm(formData);

  try {
    await prisma.labTest.update({ where: { id }, data: parsed });
  } catch (error) {
    const message = codeConflictMessage(error);
    if (message) {
      redirect(
        `/dashboard/lab/catalog/${id}/edit?error=${encodeURIComponent(message)}`
      );
    }
    throw error;
  }

  revalidatePath("/dashboard/lab/catalog");
  revalidatePath("/dashboard/encounters");
  redirect("/dashboard/lab/catalog");
}
