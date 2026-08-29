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
        <h1 className="page-title">Add Blood Unit</h1>
        <p className="text-muted">
          <Link href="/dashboard/blood-bank" className="btn btn-ghost">
            ← Back to blood bank
          </Link>
        </p>
      </div>

      <form
        action={createUnit}
        className="card gap-4"
      >
        <UnitFormFields />

        <div className="pt-2">
          <button
            type="submit"
            className="btn btn-primary"
          >
            Save Unit
          </button>
        </div>
      </form>
    </div>
  );
}
