// Small display helpers shared across the appointments module pages.

export function serviceTypeLabel(serviceType: string): string {
  switch (serviceType) {
    case "GENERAL_OPD_ADULT":
      return "General OPD (Adult)";
    case "GENERAL_OPD_CHILD":
      return "General OPD (Child)";
    case "SPECIALIST":
      return "Specialist";
    default:
      return serviceType;
  }
}

// Returns the Modernist tag classes for an appointment status. The 4-tone
// palette (neutral / info / success / danger) lives in globals.css; the
// mapping rationale is in src/lib/status.ts.
export function statusBadgeClass(status: string): string {
  switch (status) {
    case "CONFIRMED":
    case "ARRIVED":
    case "IN_PROGRESS":
      return "tag tag-info";
    case "COMPLETED":
      return "tag tag-success";
    case "NO_SHOW":
      return "tag tag-danger";
    case "SCHEDULED":
    case "CANCELLED":
    default:
      return "tag tag-neutral";
  }
}

// Curated list of common specialist clinics. Free-text isn't offered here to
// keep department names consistent for reporting; extend this list as new
// clinics are added.
export const SPECIALIST_DEPARTMENTS = [
  "Cardiology",
  "Dermatology",
  "ENT",
  "Gynaecology & Obstetrics",
  "Neurology",
  "Ophthalmology",
  "Orthopaedics",
  "Paediatrics (Specialist)",
  "Psychiatry",
  "Surgery",
  "Urology",
];
