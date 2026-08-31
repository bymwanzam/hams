// Shared age-band classification for statutory-style reports (OPD
// attendance, inpatient admissions/deaths). Age is always computed as of a
// specific event date (visit, admission, death) rather than "today", so a
// report for a past period reflects the patient's age at that time.

export const AGE_GROUPS = [
  "0-28 days",
  "1-11 months",
  "1-4 Years",
  "5-9 Years",
  "10-14 Years",
  "15-17 Years",
  "18-19 Years",
  "20-34 Years",
  "35-49 Years",
  "50-59 Years",
  "60-69 Years",
  "70 Yrs & Above",
] as const;

// Compact column headers for the wide morbidity matrix (12 age bands ×
// Male + Female + totals). Same order as AGE_GROUPS.
export const AGE_GROUPS_SHORT = [
  "<28d",
  "1-11m",
  "1-4",
  "5-9",
  "10-14",
  "15-17",
  "18-19",
  "20-34",
  "35-49",
  "50-59",
  "60-69",
  "70+",
] as const;

export function ageInCompletedYears(dob: Date, at: Date): number {
  let years = at.getFullYear() - dob.getFullYear();
  const hadBirthdayThisYear =
    at.getMonth() > dob.getMonth() ||
    (at.getMonth() === dob.getMonth() && at.getDate() >= dob.getDate());
  if (!hadBirthdayThisYear) years -= 1;
  return years;
}

export function classifyAge(dob: Date, at: Date): (typeof AGE_GROUPS)[number] {
  const ageInDays = Math.floor((at.getTime() - dob.getTime()) / 86_400_000);
  if (ageInDays <= 28) return "0-28 days";

  const years = ageInCompletedYears(dob, at);
  if (years < 1) return "1-11 months";
  if (years <= 4) return "1-4 Years";
  if (years <= 9) return "5-9 Years";
  if (years <= 14) return "10-14 Years";
  if (years <= 17) return "15-17 Years";
  if (years <= 19) return "18-19 Years";
  if (years <= 34) return "20-34 Years";
  if (years <= 49) return "35-49 Years";
  if (years <= 59) return "50-59 Years";
  if (years <= 69) return "60-69 Years";
  return "70 Yrs & Above";
}
