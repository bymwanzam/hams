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
      return "bg-green-100 text-green-700";
    case "IN_STORE":
      return "bg-slate-100 text-slate-600";
    case "UNDER_MAINTENANCE":
      return "bg-amber-100 text-amber-700";
    case "DISPOSED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}
