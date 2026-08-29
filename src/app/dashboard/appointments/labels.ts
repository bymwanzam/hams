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

export function statusBadgeClass(status: string): string {
  switch (status) {
    case "SCHEDULED":
      return "bg-slate-100 text-slate-600";
    case "CONFIRMED":
      return "bg-blue-100 text-blue-700";
    case "ARRIVED":
      return "bg-amber-100 text-amber-700";
    case "IN_PROGRESS":
      return "bg-indigo-100 text-indigo-700";
    case "COMPLETED":
      return "bg-green-100 text-green-700";
    case "NO_SHOW":
      return "bg-red-100 text-red-700";
    case "CANCELLED":
      return "bg-slate-100 text-slate-400";
    default:
      return "bg-slate-100 text-slate-600";
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
