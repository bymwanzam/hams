import { createPatient } from "../actions";
import PatientFormFields from "../PatientFormFields";

export default async function NewPatientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">
          Register Patient
        </h1>
        <p className="text-sm text-slate-500">
          A hospital number is generated automatically on save.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <form
        action={createPatient}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <PatientFormFields />

        <div className="pt-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Save Patient
          </button>
        </div>
      </form>
    </div>
  );
}
