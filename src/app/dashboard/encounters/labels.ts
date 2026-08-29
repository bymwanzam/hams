// Small display helpers shared across the consultations (encounters) module.

export function encounterTypeLabel(type: string): string {
  switch (type) {
    case "OPD":
      return "OPD";
    case "TELEHEALTH":
      return "Tele-health";
    case "EMERGENCY":
      return "Emergency";
    case "FOLLOW_UP":
      return "Follow-up";
    case "WARD_ROUND":
      return "Ward Round";
    default:
      return type;
  }
}

export function encounterStatusBadgeClass(status: string): string {
  switch (status) {
    case "WAITING":
    case "IN_PROGRESS":
      return "tag tag-info";
    case "COMPLETED":
      return "tag tag-success";
    case "CANCELLED":
    default:
      return "tag tag-neutral";
  }
}

export function orderStatusBadgeClass(status: string): string {
  switch (status) {
    case "SPECIMEN_COLLECTED":
    case "SCHEDULED":
    case "IN_PROGRESS":
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

// Imaging/diagnostic studies a doctor can request. ImagingOrder.modality is a
// free-text field in the schema (no catalog table), so this curated list
// keeps values consistent for reporting — same approach as the appointments
// module's specialist department list.
export const IMAGING_MODALITIES = [
  "X-Ray",
  "Ultrasound Scan",
  "CT Scan",
  "MRI",
  "ECG",
  "Mammography",
  "Doppler Ultrasound",
];
