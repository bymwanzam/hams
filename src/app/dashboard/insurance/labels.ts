export const CLAIM_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "PAID",
] as const;

export function claimStatusBadgeClass(status: string): string {
  switch (status) {
    case "SUBMITTED":
    case "APPROVED":
      return "tag tag-info";
    case "REJECTED":
      return "tag tag-danger";
    case "PAID":
      return "tag tag-success";
    case "DRAFT":
    default:
      return "tag tag-neutral";
  }
}

export const PROVIDER_TYPES = ["NHIS", "Private", "Corporate"];

export function policyExpiryClass(expiryDate: Date | null): string {
  if (!expiryDate) return "text-muted";
  const now = new Date();
  if (expiryDate < now)
    return "text-[var(--color-accent-700)] font-[600]";
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (expiryDate < thirtyDays)
    return "text-[var(--color-accent-700)] font-[600]";
  return "text-muted";
}
