"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  Dhis2Error,
  periodFromRange,
  pushDataValueSet,
  type Dhis2PushResult,
  type Dhis2ReportKey,
} from "@/lib/dhis2";
import { getOpdReport } from "./opd/queries";
import { opdAttendanceCells } from "./opd/dhis2";
import { getInpatientReport } from "./inpatient/queries";
import { inpatientCells } from "./inpatient/dhis2";
import { getMorbidityReport } from "./morbidity/queries";
import { morbidityCells } from "./morbidity/dhis2";

// ADMIN-only, like the backup module: pushing figures into the national
// HMIS is a sensitive, outward-facing action. proxy.ts leaves
// /dashboard/reports open to any signed-in user, so this check is the real
// gate (defence in depth — the report pages also only render the button
// for admins).
async function requireAdmin(): Promise<void> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") {
    throw new Error("Only administrators can push reports to DHIS2.");
  }
}

function summarise(res: Dhis2PushResult): string {
  const parts = [
    `${res.counts.imported} imported`,
    `${res.counts.updated} updated`,
    `${res.counts.ignored} ignored`,
  ];
  if (res.skipped.length) {
    parts.push(`${res.skipped.length} cell${res.skipped.length === 1 ? "" : "s"} unmapped`);
  }
  if (res.conflicts.length) {
    parts.push(`${res.conflicts.length} conflict${res.conflicts.length === 1 ? "" : "s"}`);
  }
  return `${res.dryRun ? "Dry run — " : ""}${parts.join(", ")}`;
}

async function run(
  slug: string,
  reportKey: Dhis2ReportKey,
  formData: FormData,
  buildCells: (from: Date, toExclusive: Date) => Promise<{ code: string; value: number }[]>
): Promise<void> {
  await requireAdmin();

  const back = `/dashboard/reports/${slug}`;
  const from = new Date(String(formData.get("from") ?? ""));
  const toInclusive = new Date(String(formData.get("to") ?? ""));

  let target: string;
  try {
    const period = periodFromRange(from, toInclusive);
    if (!period) {
      throw new Dhis2Error(
        "Set the date range to exactly one calendar month (the 1st to the last day) before pushing to DHIS2."
      );
    }
    const toExclusive = new Date(toInclusive.getTime() + 24 * 60 * 60 * 1000);
    const cells = await buildCells(from, toExclusive);
    const res = await pushDataValueSet({ reportKey, period, cells });
    target = `${back}?dhis2=${encodeURIComponent(summarise(res))}`;
  } catch (err) {
    const message =
      err instanceof Dhis2Error
        ? err.message
        : "Push to DHIS2 failed. Check the server logs for details.";
    target = `${back}?dhis2error=${encodeURIComponent(message)}`;
  }

  revalidatePath(back);
  redirect(target);
}

export async function pushOpdAttendanceToDhis2(formData: FormData) {
  await run("opd", "opd-attendance", formData, async (from, toExclusive) =>
    opdAttendanceCells(await getOpdReport(from, toExclusive))
  );
}

export async function pushOpdMorbidityToDhis2(formData: FormData) {
  await run("morbidity", "opd-morbidity", formData, async (from, toExclusive) =>
    morbidityCells(await getMorbidityReport(from, toExclusive))
  );
}

export async function pushInpatientToDhis2(formData: FormData) {
  await run("inpatient", "inpatient", formData, async (from, toExclusive) =>
    inpatientCells(await getInpatientReport(from, toExclusive))
  );
}
