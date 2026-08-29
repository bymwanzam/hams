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
        <h1 className="text-xl font-semibold text-slate-800">Hospital Setup</h1>
        <p className="text-sm text-slate-500">
          Register the hospital this system runs for. Its name is shown on the
          sidebar, the login page, the browser tab, patient ID cards, and
          invoice and report headers.
        </p>
      </div>

      {saved && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          Hospital details saved.
        </p>
      )}

      <form
        action={saveFacility}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
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
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            {facility ? "Save Changes" : "Register Hospital"}
          </button>
        </div>
      </form>
    </div>
  );
}
