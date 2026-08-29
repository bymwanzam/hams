export const STOCK_TRANSACTION_TYPES = [
  "RECEIPT",
  "ISSUE",
  "ADJUSTMENT",
  "TRANSFER",
] as const;

export function transactionTypeLabel(type: string): string {
  switch (type) {
    case "RECEIPT":
      return "Receipt (stock in)";
    case "ISSUE":
      return "Issue (stock out)";
    case "ADJUSTMENT":
      return "Adjustment (+/-)";
    case "TRANSFER":
      return "Transfer out";
    default:
      return type;
  }
}

export function transactionTypeBadgeClass(type: string): string {
  switch (type) {
    case "RECEIPT":
      return "tag tag-success";
    case "ADJUSTMENT":
    case "TRANSFER":
      return "tag tag-info";
    case "ISSUE":
    default:
      return "tag tag-neutral";
  }
}

export const INVENTORY_CATEGORIES = [
  "Medical Consumables",
  "Personal Protective Equipment",
  "Surgical Supplies",
  "Cleaning & Sanitation",
  "Equipment",
  "Stationery & Office",
  "Other",
];
