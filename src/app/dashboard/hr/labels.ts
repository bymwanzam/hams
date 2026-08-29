export const DEPARTMENTS = [
  "Administration",
  "Medical / Clinical",
  "Nursing",
  "Pharmacy",
  "Laboratory",
  "Radiology / Imaging",
  "Front Desk / Records",
  "Finance / Billing",
  "Human Resources",
  "Stores / Procurement",
  "IT",
  "Facilities & Maintenance",
  "Other",
];

export function attendanceMethodLabel(method: string): string {
  switch (method) {
    case "BIOMETRIC":
      return "Biometric";
    case "MANUAL":
      return "Manual entry";
    default:
      return method;
  }
}
