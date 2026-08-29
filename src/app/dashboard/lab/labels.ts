export function orderStatusBadgeClass(status: string): string {
  switch (status) {
    case "ORDERED":
      return "bg-slate-100 text-slate-600";
    case "SPECIMEN_COLLECTED":
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

export const LAB_ORDER_STATUSES = [
  "ORDERED",
  "SPECIMEN_COLLECTED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

// Standard sections a clinic's lab is organized into. Free-text is still
// allowed on the test form for anything not covered here.
export const LAB_TEST_CATEGORIES = [
  "Hematology",
  "Clinical Chemistry",
  "Serology & Immunology",
  "Microbiology",
  "Urinalysis",
  "Endocrinology",
  "Parasitology",
];

export const SAMPLE_TYPES = ["Blood", "Urine", "Stool", "Sputum", "Swab", "Other"];
