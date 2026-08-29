"use client";

import { useState } from "react";
import { USER_ROLES, roleLabel, roleScopeDescription } from "./labels";

type UserDefaults = {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string | null;
  role?: string;
  isActive?: boolean;
};

export default function UserFormFields({
  defaults,
  isEdit = false,
}: {
  defaults?: UserDefaults;
  isEdit?: boolean;
}) {
  const d = defaults ?? {};
  const [role, setRole] = useState(d.role ?? "HEALTH_OFFICER");

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="First Name"
          name="firstName"
          defaultValue={d.firstName}
          required
        />
        <Field
          label="Last Name"
          name="lastName"
          defaultValue={d.lastName}
          required
        />
      </div>

      <Field
        label="Email"
        name="email"
        type="email"
        defaultValue={d.email}
        required
      />

      <Field
        label="Username"
        name="username"
        defaultValue={d.username ?? undefined}
        placeholder="Optional — an alternative to email at login"
      />

      <Field
        label={isEdit ? "New Password" : "Password"}
        name="password"
        type="password"
        required={!isEdit}
        placeholder={isEdit ? "Leave blank to keep current password" : undefined}
      />

      <div>
        <label className="form-label">
          Role
        </label>
        <select
          name="role"
          required
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="input"
        >
          {USER_ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
        <p className="eyebrow mt-1">
          {roleScopeDescription(role)}
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-[color:var(--color-text)]">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={d.isActive ?? true}
          className="check"
        />
        Active (can sign in)
      </label>
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | null;
}) {
  return (
    <div>
      <label className="form-label">
        {label}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
        className="input"
      />
    </div>
  );
}
