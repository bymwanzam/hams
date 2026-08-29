export const BLOOD_GROUPS = [
  "O+",
  "O-",
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
] as const;

export const BLOOD_BANK_STATUSES = [
  "AVAILABLE",
  "RESERVED",
  "USED",
  "DISCARDED",
] as const;

export function unitStatusLabel(status: string): string {
  switch (status) {
    case "AVAILABLE":
      return "Available";
    case "RESERVED":
      return "Reserved";
    case "USED":
      return "Used";
    case "DISCARDED":
      return "Discarded";
    default:
      return status;
  }
}

export function unitStatusBadgeClass(status: string): string {
  switch (status) {
    case "AVAILABLE":
      return "tag tag-success";
    case "RESERVED":
      return "tag tag-info";
    case "DISCARDED":
      return "tag tag-danger";
    case "USED":
    default:
      return "tag tag-neutral";
  }
}

// A doctor's request (from the Wards module) for blood to be issued for an
// admitted patient — see BloodRequest in schema.prisma. Kept here rather
// than in the wards module since Blood Bank owns the fulfillment workflow
// (matching/reserving/issuing units); wards imports these the same way it
// already imports encounter labels for the ward-round history it shows.
export const BLOOD_REQUEST_STATUSES = [
  "REQUESTED",
  "RESERVED",
  "ISSUED",
  "CANCELLED",
] as const;

export const BLOOD_URGENCIES = ["ROUTINE", "URGENT", "EMERGENCY"] as const;

export function bloodRequestStatusLabel(status: string): string {
  switch (status) {
    case "REQUESTED":
      return "Requested";
    case "RESERVED":
      return "Reserved";
    case "ISSUED":
      return "Issued";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

export function bloodRequestStatusBadgeClass(status: string): string {
  switch (status) {
    case "REQUESTED":
    case "RESERVED":
      return "tag tag-info";
    case "ISSUED":
      return "tag tag-success";
    case "CANCELLED":
      return "tag tag-neutral";
    default:
      return "tag tag-neutral";
  }
}

export function bloodUrgencyLabel(urgency: string): string {
  switch (urgency) {
    case "ROUTINE":
      return "Routine";
    case "URGENT":
      return "Urgent";
    case "EMERGENCY":
      return "Emergency";
    default:
      return urgency;
  }
}

// Deliberately louder than the status badges above — urgency is the one
// signal that should draw the eye across a shared worklist of requests
// from several wards at once.
export function bloodUrgencyBadgeClass(urgency: string): string {
  switch (urgency) {
    case "URGENT":
      return "tag tag-danger";
    case "EMERGENCY":
      return "tag tag-alert";
    case "ROUTINE":
    default:
      return "tag tag-neutral";
  }
}
