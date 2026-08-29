export function admissionStatusBadgeClass(status: string): string {
  switch (status) {
    case "ADMITTED":
    case "TRANSFERRED":
      return "tag tag-info";
    case "DISCHARGED":
      return "tag tag-success";
    case "DECEASED":
      return "tag tag-strong";
    default:
      return "tag tag-neutral";
  }
}

export function daysAdmitted(admittedAt: Date, until?: Date | null): number {
  const end = until ?? new Date();
  const ms = end.getTime() - admittedAt.getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

interface FluidBalanceLike {
  oralIntakeMl: number | null;
  ivIntakeMl: number | null;
  otherIntakeMl: number | null;
  urineOutputMl: number | null;
  otherOutputMl: number | null;
}

// Running totals across every fluid balance entry recorded for the stay —
// the at-a-glance numbers a fluid balance chart exists to answer, so the
// page doesn't make a reader add up the table themselves.
export function fluidBalanceTotals(entries: FluidBalanceLike[]) {
  let intakeMl = 0;
  let outputMl = 0;
  for (const e of entries) {
    intakeMl += (e.oralIntakeMl ?? 0) + (e.ivIntakeMl ?? 0) + (e.otherIntakeMl ?? 0);
    outputMl += (e.urineOutputMl ?? 0) + (e.otherOutputMl ?? 0);
  }
  return { intakeMl, outputMl, balanceMl: intakeMl - outputMl };
}
