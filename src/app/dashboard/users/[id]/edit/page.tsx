import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateUser, hasUsersAccess } from "../../actions";
import UserFormFields from "../../UserFormFields";
import AccessRestricted from "../../AccessRestricted";

export default async function EditUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await hasUsersAccess())) {
    return <AccessRestricted />;
  }

  const { id } = await params;
  const { error } = await searchParams;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  const updateUserWithId = updateUser.bind(null, user.id);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">
          Edit {user.firstName} {user.lastName}
        </h1>
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
        action={updateUserWithId}
        className="card gap-4"
      >
        <UserFormFields
          isEdit
          defaults={{
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            username: user.username,
            role: user.role,
            isActive: user.isActive,
          }}
        />

        <div className="pt-2 flex gap-3">
          <button
            type="submit"
            className="btn btn-primary"
          >
            Save Changes
          </button>
          <Link
            href="/dashboard/users"
            className="btn btn-ghost"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
