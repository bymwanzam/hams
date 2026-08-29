import Link from "next/link";
import { createProvider, hasInsuranceAccess } from "../../actions";
import ProviderFormFields from "../ProviderFormFields";
import AccessRestricted from "../../AccessRestricted";

export default async function NewProviderPage() {
  if (!(await hasInsuranceAccess())) {
    return <AccessRestricted />;
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="page-title">Add Provider</h1>
        <p className="text-muted">
          <Link
            href="/dashboard/insurance/providers"
            className="btn btn-ghost"
          >
            ← Back to providers
          </Link>
        </p>
      </div>

      <form
        action={createProvider}
        className="card gap-4"
      >
        <ProviderFormFields />

        <div className="pt-2">
          <button
            type="submit"
            className="btn btn-primary"
          >
            Save Provider
          </button>
        </div>
      </form>
    </div>
  );
}
