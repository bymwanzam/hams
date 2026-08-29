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
          <h1 className="text-xl font-semibold text-slate-800">
            Patient ID Card
          </h1>
          <p className="text-sm text-slate-500">
            <Link
              href={`/dashboard/patients/${patient.id}`}
              className="text-blue-600 hover:underline"
            >
              ← Back to patient
            </Link>
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="flex justify-center print:block">
        <div
          className="relative rounded-2xl border border-slate-300 bg-white shadow-sm overflow-hidden print:shadow-none print:border-slate-400"
          style={{ width: "3.375in", height: "2.125in" }}
        >
          {/* Decorative wave background */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 340 214"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0,0 H340 V58 C255,92 175,30 85,62 C48,76 18,60 0,48 Z"
              fill="#93c5fd"
            />
            <path
              d="M0,0 H340 V32 C265,64 185,10 95,40 C52,55 22,40 0,26 Z"
              fill="#1d4ed8"
            />
          </svg>

          <div className="relative z-10 flex flex-col h-full">
            <div className="pt-2 pr-3 text-right">
              <p className="text-white font-extrabold text-sm leading-tight">
                {facilityName}
              </p>
              <p className="text-blue-50 text-[8px] font-medium leading-tight">
                Patient ID Card
              </p>
            </div>

            <div className="flex items-center gap-3 px-3 pt-1.5">
              {patient.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={patient.photoUrl}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover border-[3px] border-white shadow shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full border-[3px] border-white shadow bg-slate-100 flex items-center justify-center text-slate-400 text-lg font-semibold shrink-0">
                  {patient.firstName[0]}
                  {patient.lastName[0]}
                </div>
              )}

              <div className="min-w-0">
                <p className="text-[13px] font-bold text-slate-900 leading-tight truncate">
                  {patient.firstName} {patient.lastName}
                </p>
                <p className="text-[10px] font-semibold text-blue-700 leading-tight">
                  {calculateAge(patient.dateOfBirth)} yrs &middot;{" "}
                  {patient.gender}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-x-2 px-3 mt-2.5">
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
                  className="w-4 h-4 bg-blue-700"
                  style={{
                    clipPath:
                      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  }}
                  aria-hidden="true"
                />
                <span className="text-[7px] font-bold text-slate-400 tracking-wide">
                  BIT
                </span>
              </div>
              <div
                className="flex items-end gap-[1.5px] h-5"
                aria-hidden="true"
              >
                {bars.map((w, i) => (
                  <div
                    key={i}
                    className="bg-slate-800"
                    style={{ width: `${w}px`, height: "100%" }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center print:hidden">
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
      <p className="text-[7.5px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-[10px] font-bold text-slate-900 truncate">
        {value}
      </p>
    </div>
  );
}
