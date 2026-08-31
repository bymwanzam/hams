// Central registry of every BIT Health Systems module. This drives the sidebar navigation
// and the auto-generated "coming soon" pages for modules not yet built.
// Add a new module here first, then build its route under /dashboard/<slug>
// to promote it from "planned" to "live".

export type ModuleStatus = "live" | "planned";

// One accent per group, used app-wide (sidebar, dashboard cards, and each
// module's own pages via its `layout.tsx`) so a user can tell which area
// of the hospital they're in at a glance. Kept to a fixed palette — see
// `ACCENT_STYLES` in globals.css for the actual color values — rather than
// letting modules pick arbitrary colors, so the effect stays legible
// instead of turning into visual noise.
export type Accent =
  | "sky"
  | "emerald"
  | "violet"
  | "amber"
  | "teal"
  | "indigo";

export interface ModuleDef {
  slug: string;
  label: string;
  description: string;
  status: ModuleStatus;
}

export interface ModuleGroup {
  group: string;
  accent: Accent;
  modules: ModuleDef[];
}

export const MODULE_GROUPS: ModuleGroup[] = [
  {
    group: "Front Desk",
    accent: "sky",
    modules: [
      {
        slug: "patients",
        label: "Patient Registration",
        description: "Register and search patients, OPD/IPD front desk.",
        status: "live",
      },
      {
        slug: "appointments",
        label: "Appointments",
        description: "Schedule and manage patient appointments.",
        status: "live",
      },
      {
        slug: "queue",
        label: "Patient Queue",
        description: "Live queue management across departments.",
        status: "live",
      },
      {
        slug: "id-cards",
        label: "ID Card Printing",
        description: "Print patient ID cards with photo and hospital number.",
        status: "live",
      },
    ],
  },
  {
    group: "Clinical",
    accent: "emerald",
    modules: [
      {
        slug: "opd",
        label: "OPD",
        description: "Outpatient cases — treat and send home, or admit.",
        status: "live",
      },
      {
        slug: "vitals",
        label: "Vital Signs",
        description: "Chart vitals for arrived and admitted patients.",
        status: "live",
      },
      {
        slug: "encounters",
        label: "Consultations",
        description: "Clinic visits, tele-health, diagnosis & orders.",
        status: "live",
      },
      {
        slug: "wards",
        label: "Wards & Admissions",
        description: "Admissions, transfers, discharges, bed management.",
        status: "live",
      },
      {
        slug: "surgery",
        label: "Surgery & Theatre",
        description: "Surgery, anesthesia and theatre scheduling.",
        status: "live",
      },
      {
        slug: "emergency",
        label: "Emergency / Ambulatory",
        description: "Emergency case intake, walk-in or ambulance-arrival.",
        status: "live",
      },
    ],
  },
  {
    group: "Pharmacy, Lab & Imaging",
    accent: "violet",
    modules: [
      {
        slug: "pharmacy",
        label: "Pharmacy & Dispensary",
        description: "Drug inventory, prescriptions and dispensing.",
        status: "live",
      },
      {
        slug: "lab",
        label: "Laboratory",
        description: "Lab orders, results, analyzer integration.",
        status: "live",
      },
      {
        slug: "imaging",
        label: "Diagnostic Imaging",
        description: "Imaging orders, PACS/RIS integration.",
        status: "live",
      },
      {
        slug: "blood-bank",
        label: "Blood Bank",
        description: "Blood unit inventory and issuance.",
        status: "live",
      },
    ],
  },
  {
    group: "Billing & Insurance",
    accent: "amber",
    modules: [
      {
        slug: "billing",
        label: "Billing & Payments",
        description: "Invoices, cash / mobile money / card payments.",
        status: "live",
      },
      {
        slug: "insurance",
        label: "Insurance & NHIS Claims",
        description: "Private, corporate and national insurance claims.",
        status: "live",
      },
    ],
  },
  {
    group: "Operations",
    accent: "teal",
    modules: [
      {
        slug: "inventory",
        label: "Inventory & Procurement",
        description: "Stores, stock and supply chain management.",
        status: "live",
      },
      {
        slug: "assets",
        label: "Fixed Assets",
        description: "Asset register and tracking.",
        status: "live",
      },
      {
        slug: "documents",
        label: "Documents",
        description: "Patient and administrative document storage.",
        status: "live",
      },
    ],
  },
  {
    group: "Administration",
    accent: "indigo",
    modules: [
      {
        slug: "facilities",
        label: "Hospital Setup",
        description: "Configure your hospital's name and contact details.",
        status: "live",
      },
      {
        slug: "hr",
        label: "HR & Payroll",
        description: "Staff records, payroll, biometric attendance.",
        status: "live",
      },
      {
        slug: "users",
        label: "Users & Roles",
        description: "System users, roles and permissions.",
        status: "live",
      },
      {
        slug: "reports",
        label: "Reports & Analytics",
        description: "Dashboards, statutory reports, BI.",
        status: "live",
      },
      {
        slug: "backup",
        label: "Data Backup",
        description: "Manual and automatic database backups.",
        status: "live",
      },
    ],
  },
];

export const ALL_MODULES: ModuleDef[] = MODULE_GROUPS.flatMap((g) => g.modules);

export function getModule(slug: string): ModuleDef | undefined {
  return ALL_MODULES.find((m) => m.slug === slug);
}

// Hex values for each group's identity hue — kept in sync by hand with the
// matching `[data-accent="…"]` blocks in globals.css (which turn the hue
// into a flat 2px left rule on `.card-accent` / `.row-link.is-accented`,
// the Modernist way). Needed here as well for the sidebar and the dashboard
// module grid, which mix groups on one page and set the 2px rule inline
// from a module's slug rather than relying on a `data-accent` ancestor.
// Red (`--color-accent`) is the design system's own accent and is never a
// group colour.
// Calm Clinical: the group hues are pulled down to sit inside the warm
// palette rather than shout over it. Keep these `500` values in step with
// the `[data-accent="…"]` rules in globals.css.
export const ACCENT_HEX: Record<Accent, { 50: string; 500: string; 700: string }> = {
  sky: { 50: "#eef3f6", 500: "#5b8aa6", 700: "#3d6076" },
  emerald: { 50: "#eef4ef", 500: "#5b8f6f", 700: "#3d6b4f" },
  violet: { 50: "#f2f0f6", 500: "#8172a8", 700: "#5c4f7e" },
  amber: { 50: "#f6f0e6", 500: "#b08442", 700: "#835f2c" },
  teal: { 50: "#eaf3f1", 500: "#3f8b82", 700: "#2c655e" },
  indigo: { 50: "#eef0f5", 500: "#6b6f9c", 700: "#4c4f74" },
};

// Which group's accent color a module belongs to — used by the sidebar,
// the dashboard's module grid, and every module's `layout.tsx` (which
// stamps this onto a `data-accent` attribute picked up by globals.css).
// Falls back to "sky" so a module added here without wiring up a group
// still renders instead of erroring.
export function getModuleAccent(slug: string): Accent {
  return (
    MODULE_GROUPS.find((g) => g.modules.some((m) => m.slug === slug))
      ?.accent ?? "sky"
  );
}
