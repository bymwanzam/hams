// Shared logic for working out how much of a prescription has been
// dispensed so far. A Prescription can be fulfilled across more than one
// Dispense event (e.g. partial stock today, the rest once restocked), so
// "dispensed" isn't a single boolean — it's derived by summing dispensed
// quantities per drug across all of a prescription's Dispense records and
// comparing against what was prescribed. Used by both the Consultations
// module (to show doctors dispensing status) and the Pharmacy module (to
// find what's still outstanding).

export type PrescriptionForStatus = {
  items: { drugId: string; quantity: number }[];
  dispenses: { items: { drugId: string; quantity: number }[] }[];
};

export type DispenseStatus = "PENDING" | "PARTIAL" | "COMPLETE";

export function dispensedQuantities(rx: PrescriptionForStatus): Map<string, number> {
  const map = new Map<string, number>();
  for (const dispense of rx.dispenses) {
    for (const item of dispense.items) {
      map.set(item.drugId, (map.get(item.drugId) ?? 0) + item.quantity);
    }
  }
  return map;
}

export function prescriptionDispenseStatus(rx: PrescriptionForStatus): DispenseStatus {
  const dispensed = dispensedQuantities(rx);
  let anyDispensed = false;
  let allComplete = true;

  for (const item of rx.items) {
    const got = dispensed.get(item.drugId) ?? 0;
    if (got > 0) anyDispensed = true;
    if (got < item.quantity) allComplete = false;
  }

  if (allComplete) return "COMPLETE";
  if (anyDispensed) return "PARTIAL";
  return "PENDING";
}

export function dispenseStatusLabel(status: DispenseStatus): string {
  switch (status) {
    case "COMPLETE":
      return "Fully Dispensed";
    case "PARTIAL":
      return "Partially Dispensed";
    case "PENDING":
      return "Pending Dispensing";
  }
}

export function dispenseStatusBadgeClass(status: DispenseStatus): string {
  switch (status) {
    case "COMPLETE":
      return "bg-green-100 text-green-700";
    case "PARTIAL":
      return "bg-amber-100 text-amber-700";
    case "PENDING":
      return "bg-slate-100 text-slate-600";
  }
}
