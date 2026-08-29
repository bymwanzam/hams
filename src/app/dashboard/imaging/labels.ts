export function orderStatusBadgeClass(status: string): string {
  switch (status) {
    case "SCHEDULED":
      return "tag tag-info";
    case "COMPLETED":
      return "tag tag-success";
    case "CANCELLED":
      return "tag tag-danger";
    case "ORDERED":
    default:
      return "tag tag-neutral";
  }
}

export const IMAGING_ORDER_STATUSES = [
  "ORDERED",
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
] as const;
