import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmployee, updateEmployee, hasHrAccess } from "../../actions";
import EmployeeFormFields from "../../EmployeeFormFields";
import AccessRestricted from "../../AccessRestricted";

export default async function EditEmployeePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await hasHrAccess())) {
    return <AccessRestricted />;
  }

  const { id } = await params;
  const { error } = await searchParams;
  const employee = await getEmployee(id);
  if (!employee) notFound();

  const updateEmployeeWithId = updateEmployee.bind(null, employee.id);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="page-title">
          Edit {employee.user.firstName} {employee.user.lastName}
        </h1>
        <p className="text-muted">
          <Link
            href={`/dashboard/hr/${employee.id}`}
            className="btn btn-ghost"
          >
            ← Back to staff record
          </Link>
        </p>
      </div>

      {error && (
        <p className="callout callout-danger">
          {error}
        </p>
      )}

      <div className="panel px-4 py-2 text-xs text-muted">
        Linked account: {employee.user.email} — change the account itself in
        Users &amp; Roles.
      </div>

      <form
        action={updateEmployeeWithId}
        className="card gap-4"
      >
        <EmployeeFormFields
          defaults={{
            staffNumber: employee.staffNumber,
            department: employee.department,
            position: employee.position,
            salary: employee.salary.toString(),
            hireDate: employee.hireDate.toISOString().slice(0, 10),
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
            href={`/dashboard/hr/${employee.id}`}
            className="btn btn-ghost"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
