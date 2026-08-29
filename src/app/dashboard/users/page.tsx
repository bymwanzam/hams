import Link from "next/link";
import { listUsers, hasUsersAccess } from "./actions";
import { roleLabel } from "./labels";
import AccessRestricted from "./AccessRestricted";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!(await hasUsersAccess())) {
    return <AccessRestricted />;
  }

  const { q } = await searchParams;
  const users = await listUsers(q ?? "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Users &amp; Roles
          </h1>
          <p className="text-muted">
            System users, roles and permissions.
          </p>
        </div>
        <Link
          href="/dashboard/users/new"
          className="btn btn-primary"
        >
          + Add User
        </Link>
      </div>

      <form className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name, email or username"
          className="input"
        />
      </form>

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted">
                  No users found.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2 font-[600]">
                  {u.firstName} {u.lastName}
                </td>
                <td className="px-4 py-2 text-muted">{u.email}</td>
                <td className="px-4 py-2 text-muted">{u.username ?? "—"}</td>
                <td className="px-4 py-2">
                  <span className="tag tag-neutral">
                    {roleLabel(u.role)}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`${
                      u.isActive
                        ? "tag tag-success"
                        : "tag tag-danger"
                    }`}
                  >
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <Link
                    href={`/dashboard/users/${u.id}/edit`}
                    className="btn btn-ghost"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
