export function invoiceStatusBadgeClass(status: string): string {
  switch (status) {
    case "PARTIALLY_PAID":
      return "tag tag-info";
    case "PAID":
      return "tag tag-success";
    case "VOID":
      return "tag tag-danger line-through";
    case "PENDING":
    default:
      return "tag tag-neutral";
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
