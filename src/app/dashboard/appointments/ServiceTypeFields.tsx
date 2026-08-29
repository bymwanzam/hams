"use client";

import { useState } from "react";
import { SPECIALIST_DEPARTMENTS } from "./labels";

type ServiceType = "GENERAL_OPD_ADULT" | "GENERAL_OPD_CHILD" | "SPECIALIST";

export default function ServiceTypeFields({
  defaultServiceType = "GENERAL_OPD_ADULT",
  defaultDepartment = "",
}: {
  defaultServiceType?: ServiceType;
  defaultDepartment?: string;
}) {
  const [serviceType, setServiceType] = useState<ServiceType>(defaultServiceType);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Service
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["GENERAL_OPD_ADULT", "General OPD (Adult)"],
              ["GENERAL_OPD_CHILD", "General OPD (Child)"],
              ["SPECIALIST", "Specialist"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={`flex items-center justify-center text-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer ${
                serviceType === value
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-300 text-slate-600"
              }`}
            >
              <input
                type="radio"
                name="serviceType"
                value={value}
                checked={serviceType === value}
                onChange={() => setServiceType(value)}
                className="sr-only"
                required
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {serviceType === "SPECIALIST" && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Specialist Department
          </label>
          <select
            name="department"
            required
            defaultValue={defaultDepartment}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Select department…
            </option>
            {SPECIALIST_DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
