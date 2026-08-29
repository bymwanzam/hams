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
      return "bg-amber-100 text-amber-700";
    case "IN_PROGRESS":
      return "bg-indigo-100 text-indigo-700";
    case "COMPLETED":
      return "bg-green-100 text-green-700";
    case "CANCELLED":
      return "bg-slate-100 text-slate-400";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function orderStatusBadgeClass(status: string): string {
  switch (status) {
    case "ORDERED":
      return "bg-slate-100 text-slate-600";
    case "SPECIMEN_COLLECTED":
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
