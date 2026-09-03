import { prisma } from "@/lib/prisma";
import { currentActor, type AuditActor } from "@/lib/audit-actor";

// Explicit audit-trail recording. Call this from a server action after a
// mutation succeeds (and before any redirect) to record who did what, with
// a meaningful action code and a small metadata blob. See the Audit Trail
// module (src/app/dashboard/audit) for the viewer, and src/lib/prisma.ts
// for the automatic catch-all tier that covers models not instrumented
// here.
//
// Action codes are SCREAMING_SNAKE verbs — PATIENT_UPDATED, INVOICE_VOIDED,
// LOGIN_FAILED — and `entity` is the domain object they act on ("Patient",
// "Invoice", "Auth"). Keep `metadata` free of raw PII: record changed field
// *names*, ids and reasons, not old/new values.

export type { AuditActor };

export interface RecordAuditInput {
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  /** Override the actor — auth events pass the user that just signed in/out. */
  actor?: AuditActor;
}

export async function recordAudit(input: RecordAuditInput): Promise<void> {
  try {
    const actor = input.actor ?? (await currentActor());
    await prisma.auditLog.create({
      data: {
        userId: actor.userId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        metadata: {
          ...(input.metadata ?? {}),
          // Kept as text so "who" survives a later user-record deletion,
          // which would null out `userId`.
          ...(actor.actorLabel ? { actorLabel: actor.actorLabel } : {}),
        },
      },
    });
  } catch (err) {
    // An audit write must never break the user's action.
    console.error(`[audit] failed to record ${input.action}`, err);
  }
}

/**
 * The subset of `next` object keys that changed between two records, for
 * `metadata.changed`. Compares with `String()` coercion so Date/Decimal
 * differences are caught without importing their types.
 */
export function changedFields(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown>
): string[] {
  if (!before) return Object.keys(after);
  return Object.keys(after).filter(
    (k) => String(before[k] ?? "") !== String(after[k] ?? "")
  );
}
