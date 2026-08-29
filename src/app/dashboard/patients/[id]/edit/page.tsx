import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updatePatient } from "../../actions";
import PatientFormFields from "../../PatientFormFields";
import { PageHeader, Card, Button, LinkButton, ErrorBanner } from "@/components/ui";

export default async function EditPatientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient) notFound();

  const updatePatientWithId = updatePatient.bind(null, patient.id);

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        eyebrow={patient.hospitalNumber}
        title={`Edit ${patient.firstName} ${patient.lastName}`}
        subtitle={
          <LinkButton href={`/dashboard/patients/${patient.id}`}>
            ← Back to patient
          </LinkButton>
        }
      />

      <ErrorBanner>{error}</ErrorBanner>

      <form action={updatePatientWithId} className="space-y-4">
        <Card className="gap-4">
          <PatientFormFields
            currentPhotoUrl={patient.photoUrl}
            defaults={{
              firstName: patient.firstName,
              lastName: patient.lastName,
              dateOfBirth: patient.dateOfBirth.toISOString().slice(0, 10),
              gender: patient.gender,
              phone: patient.phone,
              email: patient.email,
              address: patient.address,
              nextOfKinName: patient.nextOfKinName,
              nextOfKinPhone: patient.nextOfKinPhone,
              bloodGroup: patient.bloodGroup,
              nhisNumber: patient.nhisNumber,
              ghanaCardNumber: patient.ghanaCardNumber,
              insuranceStatus: patient.insuranceStatus,
            }}
          />
        </Card>

        <div className="flex gap-3 pt-2">
          <Button type="submit" variant="primary">
            Save Changes
          </Button>
          <LinkButton href={`/dashboard/patients/${patient.id}`}>Cancel</LinkButton>
        </div>
      </form>
    </div>
  );
}
