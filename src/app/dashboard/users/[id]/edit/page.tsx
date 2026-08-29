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
        <h1 className="text-xl font-semibold text-slate-800">
          Edit {user.firstName} {user.lastName}
        </h1>
        <p className="text-sm text-slate-500">
          <Link href="/dashboard/users" className="text-blue-600 hover:underline">
            ← Back to Users
          </Link>
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <form
        action={updateUserWithId}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <UserFormFields
          isEdit
          defaults={{
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
          }}
        />

        <div className="pt-2 flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Save Changes
          </button>
          <Link
            href="/dashboard/users"
            className="text-sm text-slate-500 hover:text-slate-800 px-4 py-2"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
