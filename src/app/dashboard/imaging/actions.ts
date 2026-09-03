"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { roleHasModuleAccess } from "@/lib/access";
import { recordAudit } from "@/lib/audit";
import { IMAGING_ORDER_STATUSES } from "./labels";

export async function hasImagingAccess(): Promise<boolean> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return roleHasModuleAccess(role, "imaging");
}

async function requireImagingAccess(): Promise<void> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!roleHasModuleAccess(role, "imaging")) {
    throw new Error("Diagnostic Imaging access is restricted to imaging staff.");
  }
}

const orderInclude = {
  patient: true,
  orderedBy: true,
} satisfies Prisma.ImagingOrderInclude;

export async function listPendingImagingOrders(query: string) {
  return prisma.imagingOrder.findMany({
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
              { modality: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: orderInclude,
    orderBy: { orderedAt: "asc" },
  });
}

export async function getImagingOrder(id: string) {
  return prisma.imagingOrder.findUnique({
    where: { id },
    include: orderInclude,
  });
}

const StatusSchema = z.object({
  status: z.enum(IMAGING_ORDER_STATUSES),
});

export async function updateOrderStatus(orderId: string, formData: FormData) {
  await requireImagingAccess();
  const parsed = StatusSchema.parse({ status: formData.get("status") });

  // Completing an order this way (rather than through "Record Report")
  // would leave it marked done with no report ever saved. Require the
  // report to already be on file — recordReport() is the only path that's
  // allowed to set COMPLETED directly.
  if (parsed.status === "COMPLETED") {
    const order = await prisma.imagingOrder.findUnique({ where: { id: orderId } });
    if (!order?.reportText) {
      redirect(
        `/dashboard/imaging/${orderId}?error=${encodeURIComponent(
          "Save the report first — the order completes automatically once a report is recorded."
        )}`
      );
    }
  }

  await prisma.imagingOrder.update({
    where: { id: orderId },
    data: { status: parsed.status },
  });

  await recordAudit({
    action:
      parsed.status === "CANCELLED"
        ? "IMAGING_ORDER_CANCELLED"
        : "IMAGING_ORDER_STATUS_CHANGED",
    entity: "ImagingOrder",
    entityId: orderId,
    metadata: { status: parsed.status },
  });

  revalidatePath(`/dashboard/imaging/${orderId}`);
  revalidatePath("/dashboard/imaging");
  revalidatePath("/dashboard/encounters");
}

const ReportSchema = z.object({
  reportText: z.string().min(1),
  pacsStudyUid: z.string().optional(),
});

export async function recordReport(orderId: string, formData: FormData) {
  await requireImagingAccess();
  const parsed = ReportSchema.parse({
    reportText: formData.get("reportText"),
    pacsStudyUid: formData.get("pacsStudyUid") || undefined,
  });

  const order = await prisma.imagingOrder.update({
    where: { id: orderId },
    data: {
      reportText: parsed.reportText,
      pacsStudyUid: parsed.pacsStudyUid,
      status: "COMPLETED",
      reportedAt: new Date(),
    },
  });

  await recordAudit({
    action: "IMAGING_REPORT_RECORDED",
    entity: "ImagingOrder",
    entityId: orderId,
    metadata: { patientId: order.patientId, modality: order.modality },
  });

  revalidatePath(`/dashboard/imaging/${orderId}`);
  revalidatePath("/dashboard/imaging");
  revalidatePath("/dashboard/encounters");
}
