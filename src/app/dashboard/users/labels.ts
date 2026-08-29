export const USER_ROLES = [
  "ADMIN",
  "DOCTOR",
  "OPD_NURSE",
  "WARD_NURSE",
  "HEALTH_OFFICER",
  "PHARMACIST",
  "LAB_TECH",
  "IMAGING_OFFICER",
  "ACCOUNTANT",
  "HR",
  "INVENTORY_MANAGER",
  "IT_SUPPORT",
] as const;

export function roleLabel(role: string): string {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "DOCTOR":
      return "Doctor";
    case "OPD_NURSE":
      return "OPD Nurse";
    case "WARD_NURSE":
      return "Ward Nurse";
    case "HEALTH_OFFICER":
      return "Health Officer";
    case "PHARMACIST":
      return "Pharmacist";
    case "LAB_TECH":
      return "Laboratory Technician";
    case "IMAGING_OFFICER":
      return "Imaging Officer";
    case "ACCOUNTANT":
      return "Accountant";
    case "HR":
      return "HR";
    case "INVENTORY_MANAGER":
      return "Inventory Manager";
    case "IT_SUPPORT":
      return "IT Support";
    default:
      return role;
  }
}

// What each role is scoped to, shown next to the role picker so whoever's
// creating the account can see the effect before saving. Keep this in sync
// with ROLE_MODULE_ACCESS in src/lib/access.ts.
export function roleScopeDescription(role: string): string {
  switch (role) {
    case "HEALTH_OFFICER":
      return "Front desk: patient registration, appointments, queue, ID cards.";
    case "DOCTOR":
      return "Clinical: OPD, consultations, wards, surgery, emergency.";
    case "OPD_NURSE":
      return "Vital signs only, for arrived outpatients.";
    case "WARD_NURSE":
      return "Vital signs, nurse notes and the fluid balance chart, for admitted patients.";
    case "PHARMACIST":
      return "Pharmacy & dispensary only.";
    case "LAB_TECH":
      return "Laboratory only.";
    case "IMAGING_OFFICER":
      return "Diagnostics & imaging only.";
    case "ADMIN":
      return "Full access to every module.";
    default:
      return "Not scoped to a specific module — full access, same as Admin.";
  }
}
