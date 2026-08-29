import Link from "next/link";
import { createUser, hasUsersAccess } from "../actions";
import UserFormFields from "../UserFormFields";
import AccessRestricted from "../AccessRestricted";

export default async function NewUserPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await hasUsersAccess())) {
    return <AccessRestricted />;
  }

  const { error } = await searchParams;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">Add User</h1>
        <p className="text-muted">
          <Link href="/dashboard/users" className="btn btn-ghost">
            ← Back to Users
          </Link>
        </p>
      </div>

      {error && (
        <p className="callout callout-danger">
          {error}
        </p>
      )}

      <form
        action={createUser}
        className="card gap-4"
      >
        <UserFormFields />

        <div className="pt-2">
          <button
            type="submit"
            className="btn btn-primary"
          >
            Save User
          </button>
        </div>
      </form>
    </div>
  );
}
