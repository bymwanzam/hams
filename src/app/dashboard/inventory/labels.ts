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
      return "bg-green-100 text-green-700";
    case "ISSUE":
      return "bg-slate-100 text-slate-600";
    case "ADJUSTMENT":
      return "bg-amber-100 text-amber-700";
    case "TRANSFER":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-slate-100 text-slate-600";
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
