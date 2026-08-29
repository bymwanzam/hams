import { getFacility } from "@/lib/facility";
import { saveFacility } from "./actions";
import FacilityFormFields from "./FacilityFormFields";

export default async function HospitalSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const facility = await getFacility();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="page-title">Hospital Setup</h1>
        <p className="text-muted">
          Register the hospital this system runs for. Its name is shown on the
          sidebar, the login page, the browser tab, patient ID cards, and
          invoice and report headers.
        </p>
      </div>

      {saved && (
        <p className="callout callout-success">
          Hospital details saved.
        </p>
      )}

      <form
        action={saveFacility}
        className="card gap-4"
      >
        <FacilityFormFields
          defaults={
            facility
              ? {
                  name: facility.name,
                  address: facility.address,
                  phone: facility.phone,
                }
              : undefined
          }
        />

        <div className="pt-2">
          <button
            type="submit"
            className="btn btn-primary"
          >
            {facility ? "Save Changes" : "Register Hospital"}
          </button>
        </div>
      </form>
    </div>
  );
}
