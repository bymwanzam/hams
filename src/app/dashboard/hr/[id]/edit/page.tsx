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
        <h1 className="text-xl font-semibold text-slate-800">
          Edit {employee.user.firstName} {employee.user.lastName}
        </h1>
        <p className="text-sm text-slate-500">
          <Link
            href={`/dashboard/hr/${employee.id}`}
            className="text-blue-600 hover:underline"
          >
            ← Back to staff record
          </Link>
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-500">
        Linked account: {employee.user.email} — change the account itself in
        Users &amp; Roles.
      </div>

      <form
        action={updateEmployeeWithId}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
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
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Save Changes
          </button>
          <Link
            href={`/dashboard/hr/${employee.id}`}
            className="text-sm text-slate-500 hover:text-slate-800 px-4 py-2"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
