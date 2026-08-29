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
        <h1 className="text-xl font-semibold text-slate-800">
          Add Staff Record
        </h1>
        <p className="text-sm text-slate-500">
          <Link href="/dashboard/hr" className="text-blue-600 hover:underline">
            ← Back to HR
          </Link>
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {users.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-2">
          <p className="text-sm text-slate-600">
            Every existing user account already has a staff record. Create a
            login account first in{" "}
            <Link
              href="/dashboard/users/new"
              className="text-blue-600 hover:underline"
            >
              Users &amp; Roles
            </Link>
            , then come back here to add their employment details.
          </p>
        </div>
      ) : (
        <form
          action={createEmployee}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          <EmployeeFormFields users={users} />

          <div className="pt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
            >
              Save Staff Record
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
