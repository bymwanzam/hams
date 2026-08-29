import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deletePatient } from "../actions";
import DeletePatientButton from "../DeletePatientButton";
import { serviceTypeLabel, statusBadgeClass } from "../../appointments/labels";

export default async function PatientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      // Appointments and encounters are deliberately separate histories on
      // the same patient: an appointment is the booking (one row per visit
      // scheduled), an encounter is the consultation that happens once
      // they're called in (one row per visit actually held) — see
      // `callInPatient` in encounters/actions.ts. Both accumulate here
      // rather than either one being overwritten by the next visit.
      appointments: { orderBy: { scheduledAt: "desc" }, take: 5 },
      encounters: { orderBy: { startedAt: "desc" }, take: 5 },
      admissions: { orderBy: { admittedAt: "desc" }, take: 5 },
      invoices: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!patient) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {patient.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={patient.photoUrl}
              alt={`${patient.firstName} ${patient.lastName}`}
              className="w-16 h-16 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-lg font-medium">
              {patient.firstName[0]}
              {patient.lastName[0]}
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400">{patient.hospitalNumber}</p>
            <h1 className="text-xl font-semibold text-slate-800">
              {patient.firstName} {patient.lastName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/id-cards/${patient.id}`}
            className="text-sm text-blue-600 hover:underline"
          >
            Print ID Card
          </Link>
          <Link
            href={`/dashboard/patients/${patient.id}/edit`}
            className="text-sm text-slate-600 hover:underline"
          >
            Edit
          </Link>
          <DeletePatientButton action={deletePatient.bind(null, patient.id)} />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-2 gap-4 text-sm">
        <Info label="Gender" value={patient.gender} />
        <Info
          label="Date of Birth"
          value={new Date(patient.dateOfBirth).toLocaleDateString()}
        />
        <Info label="Phone" value={patient.phone ?? "—"} />
        <Info label="Email" value={patient.email ?? "—"} />
        <Info label="Blood Group" value={patient.bloodGroup ?? "—"} />
        <Info label="Address" value={patient.address ?? "—"} />
        <Info label="Next of Kin" value={patient.nextOfKinName ?? "—"} />
        <Info label="Next of Kin Phone" value={patient.nextOfKinPhone ?? "—"} />
        <Info label="NHIS Number" value={patient.nhisNumber ?? "—"} />
        <Info label="Ghana Card Number" value={patient.ghanaCardNumber ?? "—"} />
      </div>

      <Section
        title="Appointments"
        action={
          <Link
            href={`/dashboard/appointments/new?patientId=${patient.id}`}
            className="text-sm text-blue-600 hover:underline"
          >
            + Book
          </Link>
        }
      >
        {patient.appointments.length === 0 ? (
          <Empty text="No appointments booked yet." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {patient.appointments.map(
              (a: (typeof patient.appointments)[number]) => (
                <li key={a.id} className="py-2 text-sm">
                  <Link
                    href={`/dashboard/appointments/${a.id}`}
                    className="flex justify-between hover:underline"
                  >
                    <span>
                      {serviceTypeLabel(a.serviceType)}
                      {a.department && (
                        <span className="text-slate-400"> — {a.department}</span>
                      )}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-slate-400">
                        {new Date(a.scheduledAt).toLocaleString()}
                      </span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(a.status)}`}
                      >
                        {a.status.replace("_", " ")}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            )}
          </ul>
        )}
      </Section>

      {/* Each row here is a separate consultation record (see
          callInPatient in encounters/actions.ts) — a returning patient
          accumulates a new entry per visit rather than an existing one
          being reused or overwritten. */}
      <Section title="Recent Encounters">
        {patient.encounters.length === 0 ? (
          <Empty text="No consultations recorded yet." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {patient.encounters.map((e: (typeof patient.encounters)[number]) => (
              <li key={e.id} className="py-2 text-sm">
                <Link
                  href={`/dashboard/encounters/${e.id}`}
                  className="flex justify-between hover:underline"
                >
                  <span>{e.type} — {e.status}</span>
                  <span className="text-slate-400">
                    {new Date(e.startedAt).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Admissions">
        {patient.admissions.length === 0 ? (
          <Empty text="No admissions recorded yet." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {patient.admissions.map((a: (typeof patient.admissions)[number]) => (
              <li key={a.id} className="py-2 text-sm flex justify-between">
                <span>{a.status}</span>
                <span className="text-slate-400">
                  {new Date(a.admittedAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Invoices">
        {patient.invoices.length === 0 ? (
          <Empty text="No invoices yet." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {patient.invoices.map((i: (typeof patient.invoices)[number]) => (
              <li key={i.id} className="py-2 text-sm flex justify-between">
                <span>{i.status}</span>
                <span className="text-slate-400">
                  GHS {i.totalAmount.toString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-slate-700">{value}</p>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-slate-400">{text}</p>;
}
