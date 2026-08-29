import Link from "next/link";
import { createDrug, hasPharmacyAccess } from "../../actions";
import DrugFormFields from "../DrugFormFields";
import AccessRestricted from "../../AccessRestricted";

export default async function NewDrugPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await hasPharmacyAccess())) {
    return <AccessRestricted />;
  }

  const { error } = await searchParams;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Add Drug</h1>
        <p className="text-sm text-slate-500">
          <Link
            href="/dashboard/pharmacy/drugs"
            className="text-blue-600 hover:underline"
          >
            ← Back to formulary
          </Link>
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <form
        action={createDrug}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <DrugFormFields />

        <div className="pt-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Save Drug
          </button>
        </div>
      </form>
    </div>
  );
}
