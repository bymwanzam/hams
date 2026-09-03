import { auth } from "@/auth";

// Resolving "who is acting" for the audit trail. Kept in its own module
// (no `prisma` import) so both src/lib/audit.ts and the Prisma client
// extension in src/lib/prisma.ts can use it without an import cycle.

export type AuditActor = { userId: string | null; actorLabel: string | null };

const NO_ACTOR: AuditActor = { userId: null, actorLabel: null };

/**
 * The current signed-in user, from the JWT session (no database hit).
 * Returns nulls when called outside a request scope — the seed script, the
 * automatic backup timer, migrations — so audit writes from those paths are
 * simply attributed to "System".
 */
export async function currentActor(): Promise<AuditActor> {
  try {
    const session = await auth();
    const user = session?.user as
      | { id?: string; name?: string; email?: string; role?: string }
      | undefined;
    if (!user?.id) return NO_ACTOR;
    const name = user.name ?? user.email ?? "Unknown";
    return {
      userId: user.id,
      actorLabel: user.role ? `${name} · ${user.role}` : name,
    };
  } catch {
    return NO_ACTOR;
  }
}
