"use client";

import { useState } from "react";
import { USER_ROLES, roleLabel, roleScopeDescription } from "./labels";

type UserDefaults = {
  firstName?: string;
  lastName?: string;
  email?: string;
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
        label={isEdit ? "New Password" : "Password"}
        name="password"
        type="password"
        required={!isEdit}
        placeholder={isEdit ? "Leave blank to keep current password" : undefined}
      />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Role
        </label>
        <select
          name="role"
          required
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {USER_ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-400 mt-1">
          {roleScopeDescription(role)}
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={d.isActive ?? true}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
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
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
