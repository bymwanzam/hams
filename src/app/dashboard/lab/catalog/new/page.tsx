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
        <h1 className="page-title">Add Test</h1>
        <p className="text-muted">
          <Link
            href="/dashboard/lab/catalog"
            className="btn btn-ghost"
          >
            ← Back to catalog
          </Link>
        </p>
      </div>

      {error && (
        <p className="callout callout-danger">
          {error}
        </p>
      )}

      <form
        action={createTest}
        className="card gap-4"
      >
        <TestFormFields />

        <div className="pt-2">
          <button
            type="submit"
            className="btn btn-primary"
          >
            Save Test
          </button>
        </div>
      </form>
    </div>
  );
}
