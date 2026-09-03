import type { Tone } from "@/lib/status";

// Shared stock-level logic for the Pharmacy and Inventory dashboards
// (src/app/dashboard/pharmacy, src/app/dashboard/inventory). A single
// current batch/expiry is tracked per Drug / InventoryItem — see the
// schema comments — so "expiring" is a property of the whole line, not of
// individual lots.

export type StockStatus = "OUT" | "EXPIRING" | "LOW" | "IN_STOCK";

/** Days from now until `date` (negative if already past). */
export function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

export function isExpiringWithin(
  date: Date | string | null | undefined,
  days: number
): boolean {
  const n = daysUntil(date);
  return n !== null && n <= days;
}

/**
 * The single worst thing about a stock line, in precedence order:
 * out of stock → expiring within 30 days → at/under reorder level → fine.
 */
export function stockStatus(
  quantityOnHand: number,
  reorderLevel: number,
  expiryDate: Date | string | null | undefined
): StockStatus {
  if (quantityOnHand <= 0) return "OUT";
  if (isExpiringWithin(expiryDate, 30)) return "EXPIRING";
  if (quantityOnHand <= reorderLevel) return "LOW";
  return "IN_STOCK";
}

export function stockStatusLabel(s: StockStatus): string {
  switch (s) {
    case "OUT":
      return "Out of Stock";
    case "EXPIRING":
      return "Expiring Soon";
    case "LOW":
      return "Low Stock";
    case "IN_STOCK":
      return "In Stock";
  }
}

export function stockStatusTone(s: StockStatus): Tone {
  switch (s) {
    case "OUT":
      return "danger";
    case "EXPIRING":
      return "critical";
    case "LOW":
      return "warning";
    case "IN_STOCK":
      return "success";
  }
}

/** Suggested quantity to order back up to roughly twice the reorder level. */
export function suggestedReorderQty(
  quantityOnHand: number,
  reorderLevel: number
): number {
  return Math.max(reorderLevel, reorderLevel * 2 - quantityOnHand);
}

/** "06 / 2027" for the stock register's Expiry column. */
export function formatExpiry(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getMonth() + 1).padStart(2, "0")} / ${d.getFullYear()}`;
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
