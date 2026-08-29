export const SURGERY_STATUSES = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

export function surgeryStatusBadgeClass(status: string): string {
  switch (status) {
    case "SCHEDULED":
    case "IN_PROGRESS":
      return "tag tag-info";
    case "COMPLETED":
      return "tag tag-success";
    case "CANCELLED":
      return "tag tag-danger";
    default:
      return "tag tag-neutral";
  }
}

export const SURGERY_PAYMENT_TYPES = ["CASH", "INSURANCE"] as const;

export function paymentTypeLabel(type: string): string {
  switch (type) {
    case "CASH":
      return "Cash / Self-pay";
    case "INSURANCE":
      return "Insurance";
    default:
      return type;
  }
}

export function paymentTypeBadgeClass(type: string): string {
  switch (type) {
    case "INSURANCE":
      return "tag tag-info";
    case "CASH":
    default:
      return "tag tag-neutral";
  }
}
