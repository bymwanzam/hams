export function orderStatusBadgeClass(status: string): string {
  switch (status) {
    case "SPECIMEN_COLLECTED":
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
