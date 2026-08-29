export const SURGERY_STATUSES = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

export function surgeryStatusBadgeClass(status: string): string {
  switch (status) {
    case "SCHEDULED":
      return "bg-blue-100 text-blue-700";
    case "IN_PROGRESS":
      return "bg-indigo-100 text-indigo-700";
    case "COMPLETED":
      return "bg-green-100 text-green-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
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
    case "CASH":
      return "bg-slate-100 text-slate-600";
    case "INSURANCE":
      return "bg-teal-100 text-teal-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}
