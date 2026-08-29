import { DEPARTMENTS } from "./labels";

type EmployeeDefaults = {
  staffNumber?: string;
  department?: string;
  position?: string;
  salary?: number | string;
  hireDate?: string; // yyyy-mm-dd
};

type UserOption = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export default function EmployeeFormFields({
  defaults,
  users,
}: {
  defaults?: EmployeeDefaults;
  // Present only on the create form — the set of login accounts eligible to
  // become a staff record. Omitted on edit, where the linked account is
  // fixed and shown separately by the page.
  users?: UserOption[];
}) {
  const d = defaults ?? {};

  return (
    <>
      {users && (
        <div>
          <label className="form-label">
            Staff Account
          </label>
          <select
            name="userId"
            required
            defaultValue=""
            className="input"
          >
            <option value="" disabled>
              Select a user account…
            </option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName} ({u.email})
              </option>
            ))}
          </select>
          <p className="mt-1 eyebrow">
            Only accounts without an existing staff record are listed. Create
            the login first in Users &amp; Roles if the person isn&apos;t
            here yet.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">
            Staff Number
          </label>
          <input
            name="staffNumber"
            required
            defaultValue={d.staffNumber}
            placeholder="e.g. STF-0001"
            className="input"
          />
        </div>
        <div>
          <label className="form-label">
            Department
          </label>
          <select
            name="department"
            required
            defaultValue={d.department ?? ""}
            className="input"
          >
            <option value="" disabled>
              Select department…
            </option>
            {DEPARTMENTS.map((dep) => (
              <option key={dep} value={dep}>
                {dep}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">
            Position
          </label>
          <input
            name="position"
            required
            defaultValue={d.position}
            placeholder="e.g. Staff Nurse, Ward Attendant"
            className="input"
          />
        </div>
        <div>
          <label className="form-label">
            Monthly Salary (GHS)
          </label>
          <input
            type="number"
            name="salary"
            step="0.01"
            min="0"
            required
            defaultValue={d.salary?.toString()}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="form-label">
          Hire Date
        </label>
        <input
          type="date"
          name="hireDate"
          required
          defaultValue={d.hireDate}
          className="input"
        />
      </div>
    </>
  );
}
