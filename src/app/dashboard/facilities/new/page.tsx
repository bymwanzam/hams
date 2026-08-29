import Link from "next/link";
import { createFacility } from "../actions";
import FacilityFormFields from "../FacilityFormFields";

export default async function NewFacilityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">
          Set Up Hospital
        </h1>
        <p className="text-sm text-slate-500">
          <Link
            href="/dashboard/facilities"
            className="text-blue-600 hover:underline"
          >
            ← Back to Hospital Setup
          </Link>
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <form
        action={createFacility}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <FacilityFormFields />

        <div className="pt-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Save Hospital
          </button>
        </div>
      </form>
    </div>
  );
}
