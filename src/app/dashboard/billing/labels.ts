export function invoiceStatusBadgeClass(status: string): string {
  switch (status) {
    case "PENDING":
      return "bg-slate-100 text-slate-600";
    case "PARTIALLY_PAID":
      return "bg-amber-100 text-amber-700";
    case "PAID":
      return "bg-green-100 text-green-700";
    case "VOID":
      return "bg-red-100 text-red-400 line-through";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export const PAYMENT_METHODS = [
  "CASH",
  "MOBILE_MONEY",
  "CHEQUE",
  "CARD",
  "INSURANCE",
] as const;

export function paymentMethodLabel(method: string): string {
  switch (method) {
    case "CASH":
      return "Cash";
    case "MOBILE_MONEY":
      return "Mobile Money";
    case "CHEQUE":
      return "Cheque";
    case "CARD":
      return "Card";
    case "INSURANCE":
      return "Insurance";
    default:
      return method;
  }
}
