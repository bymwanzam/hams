import Link from "next/link";
import { createTest, hasLabAccess } from "../../actions";
import TestFormFields from "../TestFormFields";
import AccessRestricted from "../../AccessRestricted";

export default async function NewTestPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await hasLabAccess())) {
    return <AccessRestricted />;
  }

  const { error } = await searchParams;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Add Test</h1>
        <p className="text-sm text-slate-500">
          <Link
            href="/dashboard/lab/catalog"
            className="text-blue-600 hover:underline"
          >
            ← Back to catalog
          </Link>
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <form
        action={createTest}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <TestFormFields />

        <div className="pt-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Save Test
          </button>
        </div>
      </form>
    </div>
  );
}
