import { prisma } from "@/lib/prisma";

// Read-only aggregate queries for the Reports dashboard. Not a "use server"
// actions file since nothing here mutates data — plain async functions
// called directly from the (server component) page, same as the main
// dashboard overview does with its stat counts.

export async function getReportsData() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalPatients,
    activeAdmissions,
    appointmentsToday,
    appointmentsByService,
    specialistByDepartment,
    encountersByType,
    encountersByStatus,
    labOrdersByStatus,
    unavailableLabTests,
    invoiceTotalAgg,
    totalCollectedAgg,
    collected30DaysAgg,
    paymentsByMethod,
    dispenseGroups,
    drugs,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.admission.count({ where: { status: "ADMITTED" } }),
    prisma.appointment.count({
      where: { scheduledAt: { gte: startOfToday, lt: endOfToday } },
    }),
    prisma.appointment.groupBy({ by: ["serviceType"], _count: true }),
    prisma.appointment.groupBy({
      by: ["department"],
      where: { serviceType: "SPECIALIST", department: { not: null } },
      _count: true,
    }),
    prisma.encounter.groupBy({ by: ["type"], _count: true }),
    prisma.encounter.groupBy({ by: ["status"], _count: true }),
    prisma.labOrder.groupBy({ by: ["status"], _count: true }),
    prisma.labTest.count({ where: { isAvailable: false } }),
    prisma.invoice.aggregate({ _sum: { totalAmount: true } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { gte: last30Days } },
    }),
    prisma.payment.groupBy({
      by: ["method"],
      _sum: { amount: true },
      where: { paidAt: { gte: last30Days } },
    }),
    prisma.dispenseItem.groupBy({
      by: ["drugId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.drug.findMany(),
  ]);

  const drugMap = new Map(drugs.map((d) => [d.id, d]));
  const topDrugs = dispenseGroups
    .map((g) => ({
      drug: drugMap.get(g.drugId),
      quantity: g._sum.quantity ?? 0,
    }))
    .filter((d): d is { drug: (typeof drugs)[number]; quantity: number } => !!d.drug);

  const lowStockDrugs = drugs
    .filter((d) => d.quantityOnHand <= d.reorderLevel)
    .sort((a, b) => a.quantityOnHand - b.quantityOnHand);

  const totalInvoiced = Number(invoiceTotalAgg._sum.totalAmount ?? 0);
  const totalCollected = Number(totalCollectedAgg._sum.amount ?? 0);
  const collectedLast30Days = Number(collected30DaysAgg._sum.amount ?? 0);
  const outstanding = totalInvoiced - totalCollected;

  return {
    totalPatients,
    activeAdmissions,
    appointmentsToday,
    appointmentsByService: appointmentsByService.map((g) => ({
      key: g.serviceType,
      count: g._count,
    })),
    specialistByDepartment: specialistByDepartment.map((g) => ({
      key: g.department ?? "Unspecified",
      count: g._count,
    })),
    encountersByType: encountersByType.map((g) => ({
      key: g.type,
      count: g._count,
    })),
    encountersByStatus: encountersByStatus.map((g) => ({
      key: g.status,
      count: g._count,
    })),
    labOrdersByStatus: labOrdersByStatus.map((g) => ({
      key: g.status,
      count: g._count,
    })),
    unavailableLabTests,
    totalInvoiced,
    totalCollected,
    collectedLast30Days,
    outstanding,
    paymentsByMethod: paymentsByMethod.map((g) => ({
      key: g.method,
      amount: Number(g._sum.amount ?? 0),
    })),
    topDrugs,
    lowStockDrugs,
  };
}
