export function orderStatusBadgeClass(status: string): string {
  switch (status) {
    case "ORDERED":
      return "bg-slate-100 text-slate-600";
    case "SCHEDULED":
      return "bg-blue-100 text-blue-700";
    case "COMPLETED":
      return "bg-green-100 text-green-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export const IMAGING_ORDER_STATUSES = [
  "ORDERED",
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
] as const;
