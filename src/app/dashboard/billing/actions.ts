"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { roleHasModuleAccess } from "@/lib/access";
import { recordAudit } from "@/lib/audit";
import { PAYMENT_METHODS } from "./labels";

export async function hasBillingAccess(): Promise<boolean> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return roleHasModuleAccess(role, "billing");
}

async function requireBillingAccess(): Promise<void> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!roleHasModuleAccess(role, "billing")) {
    throw new Error("Billing access is restricted to accounts staff.");
  }
}

export async function listInvoices(query: string) {
  return prisma.invoice.findMany({
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
    include: { patient: true, payments: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getInvoice(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      patient: true,
      lineItems: true,
      payments: { orderBy: { paidAt: "desc" } },
    },
  });
}

// Completed lab tests and dispensed drugs for this patient that haven't
// been put on an invoice yet — the pool "New Invoice" pulls suggested
// charges from. A line item's labOrderId/dispenseItemId link (both unique)
// is what keeps something from being billed twice.
export async function getUnbilledCharges(patientId: string) {
  const [labOrders, dispenseItems] = await Promise.all([
    prisma.labOrder.findMany({
      where: { patientId, status: "COMPLETED", invoiceLineItem: null },
      include: { test: true },
      orderBy: { orderedAt: "desc" },
    }),
    prisma.dispenseItem.findMany({
      where: {
        invoiceLineItem: null,
        dispense: { prescription: { patientId } },
      },
      include: { drug: true, dispense: true },
      orderBy: { dispense: { dispensedAt: "desc" } },
    }),
  ]);

  return { labOrders, dispenseItems };
}

export async function createInvoice(formData: FormData) {
  await requireBillingAccess();

  const patientId = formData.get("patientId") as string;
  const labOrderIds = formData.getAll("labOrderId") as string[];
  const dispenseItemIds = formData.getAll("dispenseItemId") as string[];
  const descriptions = formData.getAll("description") as string[];
  const quantities = formData.getAll("quantity") as string[];
  const unitPrices = formData.getAll("unitPrice") as string[];

  const manualItems = descriptions
    .map((description, i) => ({
      description: description?.trim(),
      quantity: Number.parseInt(quantities[i], 10),
      unitPrice: Number.parseFloat(unitPrices[i]),
    }))
    .filter(
      (item): item is { description: string; quantity: number; unitPrice: number } =>
        !!item.description &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0 &&
        Number.isFinite(item.unitPrice) &&
        item.unitPrice >= 0
    );

  const [labOrders, dispenseItems] = await Promise.all([
    labOrderIds.length
      ? prisma.labOrder.findMany({
          where: { id: { in: labOrderIds } },
          include: { test: true },
        })
      : Promise.resolve([]),
    dispenseItemIds.length
      ? prisma.dispenseItem.findMany({
          where: { id: { in: dispenseItemIds } },
          include: { drug: true },
        })
      : Promise.resolve([]),
  ]);

  if (labOrders.length === 0 && dispenseItems.length === 0 && manualItems.length === 0) {
    redirect(
      `/dashboard/billing/new?patientId=${patientId}&error=${encodeURIComponent(
        "Select at least one charge, or add a line item."
      )}`
    );
  }

  const lineItemsData = [
    ...labOrders.map((o) => ({
      description: `Lab: ${o.test.name}`,
      quantity: 1,
      unitPrice: Number(o.test.price),
      labOrderId: o.id,
    })),
    ...dispenseItems.map((di) => ({
      description: `Drug: ${di.drug.name}`,
      quantity: di.quantity,
      unitPrice: Number(di.drug.unitPrice),
      dispenseItemId: di.id,
    })),
    ...manualItems,
  ];

  const totalAmount = lineItemsData.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const invoice = await prisma.invoice.create({
    data: {
      patientId,
      totalAmount,
      lineItems: { create: lineItemsData },
    },
  });

  await recordAudit({
    action: "INVOICE_CREATED",
    entity: "Invoice",
    entityId: invoice.id,
    metadata: {
      patientId,
      totalAmount: String(totalAmount),
      lineItems: lineItemsData.length,
    },
  });

  revalidatePath("/dashboard/billing");
  redirect(`/dashboard/billing/${invoice.id}`);
}

const PaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  method: z.enum(PAYMENT_METHODS),
  reference: z.string().optional(),
});

export async function recordPayment(invoiceId: string, formData: FormData) {
  await requireBillingAccess();

  const parsed = PaymentSchema.parse({
    amount: formData.get("amount"),
    method: formData.get("method"),
    reference: formData.get("reference") || undefined,
  });

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });
  if (!invoice) redirect("/dashboard/billing");

  if (invoice.status === "VOID") {
    redirect(
      `/dashboard/billing/${invoiceId}?error=${encodeURIComponent(
        "This invoice is void — payments can't be recorded against it."
      )}`
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        invoiceId,
        amount: parsed.amount,
        method: parsed.method,
        reference: parsed.reference,
      },
    });

    const paidSoFar =
      invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0) +
      parsed.amount;
    const total = Number(invoice.totalAmount);
    const status =
      paidSoFar >= total ? "PAID" : paidSoFar > 0 ? "PARTIALLY_PAID" : "PENDING";

    await tx.invoice.update({ where: { id: invoiceId }, data: { status } });
  });

  await recordAudit({
    action: "PAYMENT_RECORDED",
    entity: "Invoice",
    entityId: invoiceId,
    metadata: {
      patientId: invoice.patientId,
      amount: String(parsed.amount),
      method: parsed.method,
    },
  });

  revalidatePath(`/dashboard/billing/${invoiceId}`);
  revalidatePath("/dashboard/billing");
}

export async function voidInvoice(invoiceId: string) {
  await requireBillingAccess();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });
  if (!invoice) redirect("/dashboard/billing");

  if (invoice.payments.length > 0) {
    redirect(
      `/dashboard/billing/${invoiceId}?error=${encodeURIComponent(
        "Can't void an invoice that already has payments recorded."
      )}`
    );
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "VOID" },
  });

  await recordAudit({
    action: "INVOICE_VOIDED",
    entity: "Invoice",
    entityId: invoiceId,
    metadata: { patientId: invoice.patientId, totalAmount: String(invoice.totalAmount) },
  });

  revalidatePath(`/dashboard/billing/${invoiceId}`);
  revalidatePath("/dashboard/billing");
}
