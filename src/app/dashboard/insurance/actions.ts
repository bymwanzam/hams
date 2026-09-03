"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { roleHasModuleAccess } from "@/lib/access";
import { recordAudit } from "@/lib/audit";

export async function hasInsuranceAccess(): Promise<boolean> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return roleHasModuleAccess(role, "insurance");
}

async function requireInsuranceAccess(): Promise<void> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!roleHasModuleAccess(role, "insurance")) {
    throw new Error("Insurance access is restricted to accounts staff.");
  }
}

// ----------------------------------------------------------------------------
// Claims
// ----------------------------------------------------------------------------

const claimInclude = {
  patient: true,
  provider: true,
  invoice: true,
} satisfies Prisma.InsuranceClaimInclude;

export async function listClaims(query: string) {
  return prisma.insuranceClaim.findMany({
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
            { provider: { name: { contains: query, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: claimInclude,
    orderBy: { id: "desc" },
    take: 100,
  });
}

export async function getClaim(id: string) {
  return prisma.insuranceClaim.findUnique({
    where: { id },
    include: claimInclude,
  });
}

// Policies + recent invoices for a patient, to help pick the provider and
// the bill being claimed for when starting a new claim.
export async function getPatientClaimContext(patientId: string) {
  const [policies, invoices] = await Promise.all([
    prisma.insurancePolicy.findMany({
      where: { patientId },
      include: { provider: true },
    }),
    prisma.invoice.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  return { policies, invoices };
}

const CreateClaimSchema = z.object({
  patientId: z.string().min(1),
  providerId: z.string().min(1),
  invoiceId: z.string().optional(),
  amount: z.coerce.number().positive(),
});

export async function createClaim(formData: FormData) {
  await requireInsuranceAccess();
  const parsed = CreateClaimSchema.parse({
    patientId: formData.get("patientId"),
    providerId: formData.get("providerId"),
    invoiceId: formData.get("invoiceId") || undefined,
    amount: formData.get("amount"),
  });

  const claim = await prisma.insuranceClaim.create({
    data: {
      patientId: parsed.patientId,
      providerId: parsed.providerId,
      invoiceId: parsed.invoiceId,
      amount: parsed.amount,
    },
  });

  await recordAudit({
    action: "CLAIM_CREATED",
    entity: "InsuranceClaim",
    entityId: claim.id,
    metadata: {
      patientId: parsed.patientId,
      providerId: parsed.providerId,
      amount: String(parsed.amount),
    },
  });

  revalidatePath("/dashboard/insurance");
  redirect(`/dashboard/insurance/${claim.id}`);
}

export async function submitClaim(claimId: string) {
  await requireInsuranceAccess();
  await prisma.insuranceClaim.update({
    where: { id: claimId },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });

  await recordAudit({
    action: "CLAIM_SUBMITTED",
    entity: "InsuranceClaim",
    entityId: claimId,
    metadata: { status: "SUBMITTED" },
  });

  revalidatePath(`/dashboard/insurance/${claimId}`);
  revalidatePath("/dashboard/insurance");
}

const RespondSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().optional(),
});

export async function respondClaim(claimId: string, formData: FormData) {
  await requireInsuranceAccess();
  const parsed = RespondSchema.parse({
    decision: formData.get("decision"),
    notes: formData.get("notes") || undefined,
  });

  await prisma.insuranceClaim.update({
    where: { id: claimId },
    data: {
      status: parsed.decision,
      respondedAt: new Date(),
      notes: parsed.notes,
    },
  });

  await recordAudit({
    action: "CLAIM_STATUS_CHANGED",
    entity: "InsuranceClaim",
    entityId: claimId,
    metadata: { status: parsed.decision },
  });

  revalidatePath(`/dashboard/insurance/${claimId}`);
  revalidatePath("/dashboard/insurance");
}

// Marks a claim paid and, if it's linked to an invoice, records the payout
// as a Payment against that invoice (method INSURANCE) and recomputes the
// invoice's status — the same reconciliation Billing's own recordPayment
// does, so a paid claim actually settles the bill rather than just
// changing its own status in isolation.
export async function markClaimPaid(claimId: string) {
  await requireInsuranceAccess();

  const claim = await prisma.insuranceClaim.findUnique({
    where: { id: claimId },
    include: { invoice: { include: { payments: true } } },
  });
  if (!claim) redirect("/dashboard/insurance");

  await prisma.$transaction(async (tx) => {
    await tx.insuranceClaim.update({
      where: { id: claimId },
      data: { status: "PAID" },
    });

    if (claim.invoice) {
      await tx.payment.create({
        data: {
          invoiceId: claim.invoice.id,
          amount: claim.amount,
          method: "INSURANCE",
          reference: `Insurance claim ${claim.id}`,
        },
      });

      const paidSoFar =
        claim.invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0) +
        Number(claim.amount);
      const total = Number(claim.invoice.totalAmount);
      const status =
        paidSoFar >= total ? "PAID" : paidSoFar > 0 ? "PARTIALLY_PAID" : "PENDING";

      await tx.invoice.update({
        where: { id: claim.invoice.id },
        data: { status },
      });
    }
  });

  await recordAudit({
    action: "CLAIM_PAID",
    entity: "InsuranceClaim",
    entityId: claimId,
    metadata: {
      amount: String(claim.amount),
      invoiceId: claim.invoice?.id,
    },
  });

  revalidatePath(`/dashboard/insurance/${claimId}`);
  revalidatePath("/dashboard/insurance");
  revalidatePath("/dashboard/billing");
  if (claim.invoice) revalidatePath(`/dashboard/billing/${claim.invoice.id}`);
}

// ----------------------------------------------------------------------------
// Providers
// ----------------------------------------------------------------------------

export async function listProviders() {
  return prisma.insuranceProvider.findMany({
    include: { _count: { select: { policies: true, claims: true } } },
    orderBy: { name: "asc" },
  });
}

const ProviderSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
});

export async function createProvider(formData: FormData) {
  await requireInsuranceAccess();
  const parsed = ProviderSchema.parse({
    name: formData.get("name"),
    type: formData.get("type"),
  });

  await prisma.insuranceProvider.create({ data: parsed });

  revalidatePath("/dashboard/insurance/providers");
  redirect("/dashboard/insurance/providers");
}

export async function updateProvider(id: string, formData: FormData) {
  await requireInsuranceAccess();
  const parsed = ProviderSchema.parse({
    name: formData.get("name"),
    type: formData.get("type"),
  });

  await prisma.insuranceProvider.update({ where: { id }, data: parsed });

  revalidatePath("/dashboard/insurance/providers");
  redirect("/dashboard/insurance/providers");
}

// ----------------------------------------------------------------------------
// Patient policies
// ----------------------------------------------------------------------------

export async function listPolicies(query: string) {
  return prisma.insurancePolicy.findMany({
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
            { policyNumber: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { patient: true, provider: true },
    orderBy: { id: "desc" },
    take: 100,
  });
}

const PolicySchema = z.object({
  providerId: z.string().min(1),
  policyNumber: z.string().min(1),
  expiryDate: z.string().optional(),
});

export async function createPolicy(formData: FormData) {
  await requireInsuranceAccess();
  const patientId = formData.get("patientId") as string;
  const parsed = PolicySchema.parse({
    providerId: formData.get("providerId"),
    policyNumber: formData.get("policyNumber"),
    expiryDate: formData.get("expiryDate") || undefined,
  });

  await prisma.insurancePolicy.create({
    data: {
      patientId,
      providerId: parsed.providerId,
      policyNumber: parsed.policyNumber,
      expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : undefined,
    },
  });

  revalidatePath("/dashboard/insurance/policies");
  redirect("/dashboard/insurance/policies");
}

export async function updatePolicy(id: string, formData: FormData) {
  await requireInsuranceAccess();
  const parsed = PolicySchema.parse({
    providerId: formData.get("providerId"),
    policyNumber: formData.get("policyNumber"),
    expiryDate: formData.get("expiryDate") || undefined,
  });

  await prisma.insurancePolicy.update({
    where: { id },
    data: {
      providerId: parsed.providerId,
      policyNumber: parsed.policyNumber,
      expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : null,
    },
  });

  revalidatePath("/dashboard/insurance/policies");
  redirect("/dashboard/insurance/policies");
}
