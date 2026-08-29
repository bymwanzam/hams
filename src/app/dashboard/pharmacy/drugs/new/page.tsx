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
        <h1 className="page-title">Add Drug</h1>
        <p className="text-muted">
          <Link
            href="/dashboard/pharmacy/drugs"
            className="btn btn-ghost"
          >
            ← Back to formulary
          </Link>
        </p>
      </div>

      {error && (
        <p className="callout callout-danger">
          {error}
        </p>
      )}

      <form
        action={createDrug}
        className="card gap-4"
      >
        <DrugFormFields />

        <div className="pt-2">
          <button
            type="submit"
            className="btn btn-primary"
          >
            Save Drug
          </button>
        </div>
      </form>
    </div>
  );
}
