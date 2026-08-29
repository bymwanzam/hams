import { createPatient } from "../actions";
import PatientFormFields from "../PatientFormFields";
import { PageHeader, Card, Button, ErrorBanner } from "@/components/ui";

export default async function NewPatientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Register Patient"
        subtitle="A hospital number is generated automatically on save."
      />

      <ErrorBanner>{error}</ErrorBanner>

      <form action={createPatient} className="space-y-4">
        <Card className="gap-4">
          <PatientFormFields />
        </Card>

        <div className="pt-2">
          <Button type="submit" variant="primary">
            Save Patient
          </Button>
        </div>
      </form>
    </div>
  );
}
