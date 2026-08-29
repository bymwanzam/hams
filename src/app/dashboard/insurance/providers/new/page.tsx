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
        <h1 className="text-xl font-semibold text-slate-800">Add Provider</h1>
        <p className="text-sm text-slate-500">
          <Link
            href="/dashboard/insurance/providers"
            className="text-blue-600 hover:underline"
          >
            ← Back to providers
          </Link>
        </p>
      </div>

      <form
        action={createProvider}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <ProviderFormFields />

        <div className="pt-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Save Provider
          </button>
        </div>
      </form>
    </div>
  );
}
