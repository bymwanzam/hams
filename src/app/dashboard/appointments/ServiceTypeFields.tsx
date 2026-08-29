"use client";

import { useState } from "react";
import { SPECIALIST_DEPARTMENTS } from "./labels";
import { Field, Select } from "@/components/ui";

type ServiceType = "GENERAL_OPD_ADULT" | "GENERAL_OPD_CHILD" | "SPECIALIST";

const OPTIONS: [ServiceType, string][] = [
  ["GENERAL_OPD_ADULT", "General OPD (Adult)"],
  ["GENERAL_OPD_CHILD", "General OPD (Child)"],
  ["SPECIALIST", "Specialist"],
];

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
      <Field label="Service">
        <div className="seg" role="radiogroup" aria-label="Service">
          {OPTIONS.map(([value, label]) => (
            <label className="seg-opt" key={value}>
              <input
                type="radio"
                name="serviceType"
                value={value}
                checked={serviceType === value}
                onChange={() => setServiceType(value)}
                required
              />
              {label}
            </label>
          ))}
        </div>
      </Field>

      {serviceType === "SPECIALIST" && (
        <Field label="Specialist Department" htmlFor="stf-dept">
          <Select id="stf-dept" name="department" required defaultValue={defaultDepartment}>
            <option value="" disabled>
              Select department…
            </option>
            {SPECIALIST_DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
      )}
    </div>
  );
}
