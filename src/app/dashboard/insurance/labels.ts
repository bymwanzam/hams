export const CLAIM_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "PAID",
] as const;

export function claimStatusBadgeClass(status: string): string {
  switch (status) {
    case "DRAFT":
      return "bg-slate-100 text-slate-600";
    case "SUBMITTED":
      return "bg-blue-100 text-blue-700";
    case "APPROVED":
      return "bg-indigo-100 text-indigo-700";
    case "REJECTED":
      return "bg-red-100 text-red-700";
    case "PAID":
      return "bg-green-100 text-green-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export const PROVIDER_TYPES = ["NHIS", "Private", "Corporate"];

export function policyExpiryClass(expiryDate: Date | null): string {
  if (!expiryDate) return "text-slate-500";
  const now = new Date();
  if (expiryDate < now) return "text-red-600 font-medium";
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (expiryDate < thirtyDays) return "text-amber-600 font-medium";
  return "text-slate-500";
}
