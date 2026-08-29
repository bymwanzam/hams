export const ASSET_CATEGORIES = [
  "Medical Equipment",
  "IT Equipment",
  "Furniture & Fixtures",
  "Vehicles",
  "Building & Facilities",
  "Office Equipment",
  "Other",
];

export const ASSET_STATUSES = [
  "IN_USE",
  "IN_STORE",
  "UNDER_MAINTENANCE",
  "DISPOSED",
] as const;

export function assetStatusLabel(status: string): string {
  switch (status) {
    case "IN_USE":
      return "In Use";
    case "IN_STORE":
      return "In Store";
    case "UNDER_MAINTENANCE":
      return "Under Maintenance";
    case "DISPOSED":
      return "Disposed";
    default:
      return status;
  }
}

export function assetStatusBadgeClass(status: string): string {
  switch (status) {
    case "IN_USE":
      return "tag tag-success";
    case "UNDER_MAINTENANCE":
    case "DISPOSED":
      return "tag tag-danger";
    case "IN_STORE":
    default:
      return "tag tag-neutral";
  }
}
