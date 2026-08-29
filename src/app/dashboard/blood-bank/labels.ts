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
      return "bg-green-100 text-green-700";
    case "RESERVED":
      return "bg-amber-100 text-amber-700";
    case "USED":
      return "bg-slate-100 text-slate-600";
    case "DISCARDED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
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
      return "bg-blue-100 text-blue-700";
    case "RESERVED":
      return "bg-amber-100 text-amber-700";
    case "ISSUED":
      return "bg-green-100 text-green-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
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
    case "ROUTINE":
      return "bg-slate-100 text-slate-600";
    case "URGENT":
      return "bg-amber-100 text-amber-800 font-semibold";
    case "EMERGENCY":
      return "bg-red-600 text-white font-semibold";
    default:
      return "bg-slate-100 text-slate-600";
  }
}
