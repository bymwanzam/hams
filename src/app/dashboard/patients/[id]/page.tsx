import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deletePatient } from "../actions";
import { serviceTypeLabel } from "../../appointments/labels";
import {
  PageHeader,
  Button,
  LinkButton,
  ConfirmButton,
  InfoGrid,
  Info,
  SectionCard,
  List,
  EmptyState,
  StatusBadge,
  ErrorBanner,
} from "@/components/ui";

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
      <ErrorBanner>{error}</ErrorBanner>

      <PageHeader
        eyebrow={patient.hospitalNumber}
        title={
          <span className="flex items-center gap-4">
            {patient.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={patient.photoUrl}
                alt={`${patient.firstName} ${patient.lastName}`}
                className="h-14 w-14 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center bg-[var(--color-neutral-200)] text-lg font-medium text-[var(--color-neutral-600)]">
                {patient.firstName[0]}
                {patient.lastName[0]}
              </span>
            )}
            <span>
              {patient.firstName} {patient.lastName}
            </span>
          </span>
        }
        actions={
          <>
            <LinkButton href={`/dashboard/id-cards/${patient.id}`}>
              Print ID Card
            </LinkButton>
            <Button href={`/dashboard/patients/${patient.id}/edit`} variant="secondary">
              Edit
            </Button>
            <ConfirmButton
              action={deletePatient.bind(null, patient.id)}
              label="Delete"
              confirmTitle="Delete this patient?"
              confirmBody="This cannot be undone, and will fail if the patient has any recorded visits, appointments, or invoices."
              confirmLabel="Delete patient"
            />
          </>
        }
      />

      <InfoGrid accented>
        <Info label="Gender" value={patient.gender} />
        <Info
          label="Date of Birth"
          value={new Date(patient.dateOfBirth).toLocaleDateString()}
        />
        <Info label="Phone" value={patient.phone ?? "—"} />
        <Info label="Email" value={patient.email ?? "—"} />
        <Info label="Blood Group" value={patient.bloodGroup ?? "—"} />
        <Info
          label="Insurance Status"
          value={patient.insuranceStatus === "INSURED" ? "Insured" : "Cash"}
        />
        <Info label="Address" value={patient.address ?? "—"} />
        <Info label="Next of Kin" value={patient.nextOfKinName ?? "—"} />
        <Info label="Next of Kin Phone" value={patient.nextOfKinPhone ?? "—"} />
        <Info label="NHIS Number" value={patient.nhisNumber ?? "—"} />
        <Info label="Ghana Card Number" value={patient.ghanaCardNumber ?? "—"} />
      </InfoGrid>

      <SectionCard
        title="Appointments"
        action={
          <LinkButton href={`/dashboard/appointments/new?patientId=${patient.id}`}>
            + Book
          </LinkButton>
        }
      >
        {patient.appointments.length === 0 ? (
          <EmptyState>No appointments booked yet.</EmptyState>
        ) : (
          <List>
            {patient.appointments.map(
              (a: (typeof patient.appointments)[number]) => (
                <li key={a.id} className="py-2 text-sm">
                  <Link
                    href={`/dashboard/appointments/${a.id}`}
                    className="flex justify-between gap-2 no-underline"
                  >
                    <span>
                      {serviceTypeLabel(a.serviceType)}
                      {a.department && (
                        <span className="text-muted"> — {a.department}</span>
                      )}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-muted">
                        {new Date(a.scheduledAt).toLocaleString()}
                      </span>
                      <StatusBadge status={a.status} />
                    </span>
                  </Link>
                </li>
              )
            )}
          </List>
        )}
      </SectionCard>

      {/* Each row here is a separate consultation record (see
          callInPatient in encounters/actions.ts) — a returning patient
          accumulates a new entry per visit rather than an existing one
          being reused or overwritten. */}
      <SectionCard title="Recent Encounters">
        {patient.encounters.length === 0 ? (
          <EmptyState>No consultations recorded yet.</EmptyState>
        ) : (
          <List>
            {patient.encounters.map((e: (typeof patient.encounters)[number]) => (
              <li key={e.id} className="py-2 text-sm">
                <Link
                  href={`/dashboard/encounters/${e.id}`}
                  className="flex justify-between gap-2 no-underline"
                >
                  <span>
                    {e.type} — {e.status}
                  </span>
                  <span className="text-muted">
                    {new Date(e.startedAt).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </List>
        )}
      </SectionCard>

      <SectionCard title="Admissions">
        {patient.admissions.length === 0 ? (
          <EmptyState>No admissions recorded yet.</EmptyState>
        ) : (
          <List>
            {patient.admissions.map((a: (typeof patient.admissions)[number]) => (
              <li key={a.id} className="flex justify-between py-2 text-sm">
                <span>{a.status}</span>
                <span className="text-muted">
                  {new Date(a.admittedAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </List>
        )}
      </SectionCard>

      <SectionCard title="Invoices">
        {patient.invoices.length === 0 ? (
          <EmptyState>No invoices yet.</EmptyState>
        ) : (
          <List>
            {patient.invoices.map((i: (typeof patient.invoices)[number]) => (
              <li key={i.id} className="flex justify-between py-2 text-sm">
                <span>{i.status}</span>
                <span className="text-muted">
                  GHS {i.totalAmount.toString()}
                </span>
              </li>
            ))}
          </List>
        )}
      </SectionCard>
    </div>
  );
}
