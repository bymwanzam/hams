import Link from "next/link";
import { createEmployee, listUnlinkedUsers, hasHrAccess } from "../actions";
import EmployeeFormFields from "../EmployeeFormFields";
import AccessRestricted from "../AccessRestricted";

export default async function NewEmployeePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await hasHrAccess())) {
    return <AccessRestricted />;
  }

  const { error } = await searchParams;
  const users = await listUnlinkedUsers();

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="page-title">
          Add Staff Record
        </h1>
        <p className="text-muted">
          <Link href="/dashboard/hr" className="btn btn-ghost">
            ← Back to HR
          </Link>
        </p>
      </div>

      {error && (
        <p className="callout callout-danger">
          {error}
        </p>
      )}

      {users.length === 0 ? (
        <div className="card gap-2">
          <p className="text-sm text-muted">
            Every existing user account already has a staff record. Create a
            login account first in{" "}
            <Link
              href="/dashboard/users/new"
              className="btn btn-ghost"
            >
              Users &amp; Roles
            </Link>
            , then come back here to add their employment details.
          </p>
        </div>
      ) : (
        <form
          action={createEmployee}
          className="card gap-4"
        >
          <EmployeeFormFields users={users} />

          <div className="pt-2">
            <button
              type="submit"
              className="btn btn-primary"
            >
              Save Staff Record
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
