import { humaniseStatus, type Tone } from "@/lib/status";

// Presentation helpers for the Audit Trail table. Action codes are the
// SCREAMING_SNAKE verbs written by recordAudit() (src/lib/audit.ts) and the
// automatic tier in src/lib/prisma.ts (CREATE / UPDATE / DELETE / ...).

export function auditActionLabel(action: string): string {
  return humaniseStatus(action);
}

export function auditActionTone(action: string): Tone {
  if (action === "DEATH_RECORDED") return "critical";
  if (action === "LOGIN_FAILED") return "danger";
  if (
    action.endsWith("_DELETED") ||
    action.endsWith("_VOIDED") ||
    action.endsWith("_CANCELLED") ||
    action.startsWith("DELETE")
  ) {
    return "danger";
  }
  if (
    action === "LOGIN_SUCCESS" ||
    action.endsWith("_CREATED") ||
    action.endsWith("_DISPENSED") ||
    action.endsWith("_FULFILLED") ||
    action.startsWith("CREATE")
  ) {
    return "success";
  }
  if (action === "LOGOUT") return "neutral";
  if (
    action.endsWith("_UPDATED") ||
    action.endsWith("_STATUS_CHANGED") ||
    action.endsWith("_RECORDED") ||
    action.endsWith("_SUBMITTED") ||
    action.endsWith("_ORDERED") ||
    action.startsWith("UPDATE") ||
    action.startsWith("UPSERT")
  ) {
    return "info";
  }
  return "neutral";
}

type AuditEntryLike = {
  user: { firstName: string; lastName: string; role: string } | null;
  metadata: unknown;
};

/** "Jane Doe · DOCTOR", falling back to the captured label, then "System". */
export function auditActorText(entry: AuditEntryLike): string {
  if (entry.user) {
    return `${entry.user.firstName} ${entry.user.lastName} · ${entry.user.role}`;
  }
  const m = entry.metadata as Record<string, unknown> | null;
  if (m && typeof m.actorLabel === "string" && m.actorLabel) return m.actorLabel;
  return "System";
}

/** A compact one-line summary of an entry's metadata for the Details column. */
export function auditDetailText(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object") return "";
  const m = metadata as Record<string, unknown>;
  const parts: string[] = [];
  const list = (v: unknown) => (Array.isArray(v) ? (v as unknown[]).map(String) : []);

  const changed = list(m.changed);
  if (changed.length) parts.push(`changed: ${changed.join(", ")}`);
  const keys = list(m.keys);
  if (keys.length) parts.push(`fields: ${keys.join(", ")}`);
  if (typeof m.identifier === "string") parts.push(`identifier: ${m.identifier}`);
  if (typeof m.reason === "string") parts.push(m.reason);
  if (typeof m.status === "string") parts.push(`→ ${m.status}`);
  if (typeof m.from === "string" && typeof m.to === "string") {
    parts.push(`${m.from} → ${m.to}`);
  }
  if (m.roleChanged) parts.push("role changed");
  if (m.deactivated) parts.push("deactivated");
  if (m.passwordReset) parts.push("password reset");
  if (typeof m.amount === "string" || typeof m.amount === "number") {
    parts.push(`amount ${m.amount}`);
  }
  if (typeof m.procedure === "string") parts.push(m.procedure);
  return parts.join(" · ");
}
