import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getFacilityName } from "@/lib/facility";
import PrintButton from "../PrintButton";

function calculateAge(dateOfBirth: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > dateOfBirth.getMonth() ||
    (now.getMonth() === dateOfBirth.getMonth() &&
      now.getDate() >= dateOfBirth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

// Deterministic decorative bar widths for the footer "barcode" — purely
// visual (not a real, scannable barcode), varied per patient using their
// hospital number so cards don't all look identical.
function barcodeWidths(seed: string): number[] {
  const bars: number[] = [];
  for (let i = 0; i < 28; i++) {
    const code = seed.charCodeAt(i % seed.length) + i;
    bars.push((code % 3) + 1);
  }
  return bars;
}

export default async function IdCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      encounters: { orderBy: { startedAt: "asc" }, take: 1 },
    },
  });

  if (!patient) notFound();

  const firstVisit = patient.encounters[0]?.startedAt ?? patient.createdAt;
  const facilityName = await getFacilityName();
  const bars = barcodeWidths(patient.hospitalNumber);

  return (
    <div className="space-y-6 print:space-y-0">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="page-title">
            Patient ID Card
          </h1>
          <p className="text-muted">
            <Link
              href={`/dashboard/patients/${patient.id}`}
              className="btn btn-ghost"
            >
              ← Back to patient
            </Link>
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="flex justify-center print:block">
        <div
          className="relative overflow-hidden"
          style={{
            width: "3.375in",
            height: "2.125in",
            background: "var(--color-bg)",
            border: "1px solid var(--color-text)",
          }}
        >
          <div className="flex h-full flex-col">
            {/* Ink header band */}
            <div
              className="flex items-baseline justify-between px-3 py-1.5"
              style={{
                background: "var(--color-text)",
                color: "var(--color-bg)",
                borderBottom: "2px solid var(--color-accent)",
              }}
            >
              <p className="text-[11px] font-[800] leading-tight uppercase tracking-wide">
                {facilityName}
              </p>
              <p className="text-[7px] font-[600] leading-tight uppercase tracking-wider">
                Patient ID Card
              </p>
            </div>

            <div className="flex items-center gap-3 px-3 pt-2">
              {patient.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={patient.photoUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-full object-cover border-[3px] border-white shadow"
                />
              ) : (
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center text-lg font-[700]"
                  style={{
                    border: "1px solid var(--color-text)",
                    background: "var(--color-surface)",
                  }}
                >
                  {patient.firstName[0]}
                  {patient.lastName[0]}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-[13px] font-[800] leading-tight text-[color:var(--color-text)]">
                  {patient.firstName} {patient.lastName}
                </p>
                <p className="text-[10px] font-[600] leading-tight text-[color:var(--color-accent-700)]">
                  {calculateAge(patient.dateOfBirth)} yrs &middot; {patient.gender}
                </p>
              </div>
            </div>

            <div className="mt-2.5 grid grid-cols-3 gap-x-2 px-3">
              <InfoField label="Patient No." value={patient.hospitalNumber} />
              <InfoField
                label="D.O.B"
                value={new Date(patient.dateOfBirth).toLocaleDateString()}
              />
              <InfoField
                label="1st Visit"
                value={new Date(firstVisit).toLocaleDateString()}
              />
            </div>

            <div className="mt-auto flex items-end justify-between px-3 pb-2">
              <div className="flex items-center gap-1">
                <div
                  className="h-3.5 w-3.5"
                  style={{ background: "var(--color-accent)" }}
                  aria-hidden="true"
                />
                <span className="text-[7px] font-[800] tracking-wide text-[color:var(--color-text)]">
                  BIT
                </span>
              </div>
              <div className="flex h-5 items-end gap-[1.5px]" aria-hidden="true">
                {bars.map((w, i) => (
                  <div
                    key={i}
                    style={{
                      width: `${w}px`,
                      height: "100%",
                      background: "var(--color-text)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="eyebrow text-center print:hidden">
        Card size: standard CR-80 (3.375in × 2.125in). Use &quot;Actual
        size&quot; / 100% scale and enable background graphics in your
        browser&apos;s print dialog.
      </p>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="leading-tight min-w-0">
      <p className="text-[7.5px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="text-[10px] font-bold text-[color:var(--color-text)] truncate">
        {value}
      </p>
    </div>
  );
}
