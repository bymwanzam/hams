import { PrismaClient, type Prisma } from "@prisma/client";
import { currentActor } from "@/lib/audit-actor";

// Note the import cycle prisma -> audit-actor -> auth -> prisma: it is safe
// because none of these modules touch the others at top-level evaluation
// (auth.ts builds its NextAuth config without calling `prisma`, currentActor
// only calls `auth()` at request time, and logAuto only runs post-write).

// Prevent creating a new PrismaClient on every hot-reload in dev
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

// Automatic audit tier: models NOT covered by an explicit recordAudit()
// call in a server action (see src/lib/audit.ts). Writes to these get a
// generic AuditLog entry so nothing slips through uninstrumented. The
// high-value clinical/financial models are deliberately absent here — they
// are logged explicitly, with intent, and listing them would double-log.
const AUTO_AUDIT_MODELS = new Set<string>([
  "InventoryItem",
  "StockTransaction",
  "FixedAsset",
  "Document",
  "Appointment",
  "Ward",
  "Bed",
  "InsuranceProvider",
  "InsurancePolicy",
  "AttendanceRecord",
  "Notification",
]);

const WRITE_OPS = new Set([
  "create",
  "update",
  "upsert",
  "delete",
  "createMany",
  "updateMany",
  "deleteMany",
]);

function createPrismaClient() {
  const base = new PrismaClient();

  async function logAuto(
    model: string,
    operation: string,
    args: unknown,
    result: unknown
  ): Promise<void> {
    try {
      const actor = await currentActor();
      const data = (args as { data?: Record<string, unknown> } | undefined)?.data;
      const id = (result as { id?: string } | undefined)?.id ?? null;
      await base.auditLog.create({
        data: {
          userId: actor.userId,
          action: operation.toUpperCase(),
          entity: model,
          entityId: id,
          metadata: {
            auto: true,
            op: operation,
            ...(data && !Array.isArray(data)
              ? { keys: Object.keys(data) }
              : {}),
            ...(actor.actorLabel ? { actorLabel: actor.actorLabel } : {}),
          } as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      console.error(`[audit] auto-log failed for ${model}.${operation}`, err);
    }
  }

  return base.$extends({
    name: "audit",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const result = await query(args);
          if (
            model &&
            model !== "AuditLog" &&
            WRITE_OPS.has(operation) &&
            AUTO_AUDIT_MODELS.has(model)
          ) {
            // Fire-and-forget: never delay or fail the actual write, and
            // never run inside a caller's interactive transaction.
            void logAuto(model, operation, args, result);
          }
          return result;
        },
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
