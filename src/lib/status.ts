// Central semantic status → tone map for the whole app.
//
// The Modernist design system is strictly mono, but the clinical worklists
// lean on colour to read at a glance (a critical result, an overdue invoice,
// a cancelled order). So the app keeps a deliberate, minimal 5-tone palette —
// neutral / info / success / danger / critical — rendered by the `.tag-*`
// classes in globals.css and the <Tag> / <StatusBadge> components.
//
// This replaces the ~20 `*BadgeClass()` helpers that used to live one-per
// module in each `labels.ts` and returned raw Tailwind `bg-x-100 text-x-700`
// pairs. The old 6-tone vocabulary collapses here: "info" and "in progress"
// merge into `info`; a standalone amber "warning" becomes `danger` when it
// means "needs attention", else `neutral`.
//
// `critical` is deliberately split out from `danger`: both read as "red",
// but `danger` is routine friction (a void invoice, a no-show) while
// `critical` is triage-urgent (an emergency admission, a STAT lab flag) and
// carries a solid fill + pulse so it can't be missed on a busy worklist.

export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "critical";

const TONE_BY_STATUS: Record<string, Tone> = {
  // — not started / inert —
  SCHEDULED: "neutral",
  PENDING: "neutral",
  DRAFT: "neutral",
  ORDERED: "neutral",
  IN_STORE: "neutral",
  ISSUE: "neutral",
  USED: "neutral",
  RESERVED: "neutral",
  CANCELLED: "neutral",
  ROUTINE: "neutral",
  CASH: "neutral",

  // — active / in flight —
  CONFIRMED: "info",
  SUBMITTED: "info",
  IN_PROGRESS: "info",
  WAITING: "info",
  ARRIVED: "info",
  APPROVED: "info",
  SPECIMEN_COLLECTED: "info",
  ADMITTED: "info",
  TRANSFERRED: "info",
  TRANSFER: "info",
  REQUESTED: "info",
  ADJUSTMENT: "info",
  PARTIALLY_PAID: "info",
  INSURANCE: "info",

  // — done well —
  COMPLETED: "success",
  PAID: "success",
  IN_USE: "success",
  AVAILABLE: "success",
  DISCHARGED: "success",
  ISSUED: "success",
  RECEIPT: "success",

  // — failed / needs attention —
  NO_SHOW: "danger",
  REJECTED: "danger",
  VOID: "danger",
  DISPOSED: "danger",
  DISCARDED: "danger",
  UNDER_MAINTENANCE: "danger",

  // — triage-urgent / life-safety: must outrank routine danger at a glance —
  URGENT: "critical",
  EMERGENCY: "critical",
  DECEASED: "critical",
};

/** Semantic tone for a raw enum status string. Unknown values read neutral. */
export function statusTone(status: string | null | undefined): Tone {
  if (!status) return "neutral";
  return TONE_BY_STATUS[status] ?? "neutral";
}

/** Humanise a raw enum ("SPECIMEN_COLLECTED" → "Specimen collected"). */
export function humaniseStatus(status: string): string {
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}
