import Link from "next/link";
import { createUnit, hasBloodBankAccess } from "../actions";
import UnitFormFields from "../UnitFormFields";
import AccessRestricted from "../AccessRestricted";

export default async function NewUnitPage() {
  if (!(await hasBloodBankAccess())) {
    return <AccessRestricted />;
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Add Blood Unit</h1>
        <p className="text-sm text-slate-500">
          <Link href="/dashboard/blood-bank" className="text-blue-600 hover:underline">
            ← Back to blood bank
          </Link>
        </p>
      </div>

      <form
        action={createUnit}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <UnitFormFields />

        <div className="pt-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Save Unit
          </button>
        </div>
      </form>
    </div>
  );
}
