"use client";

import { useState } from "react";
import { createPrescription } from "./actions";

type DrugOption = { id: string; name: string; form: string | null };

export default function PrescriptionForm({
  encounterId,
  patientId,
  drugs,
}: {
  encounterId: string;
  patientId: string;
  drugs: DrugOption[];
}) {
  const [rowKeys, setRowKeys] = useState<number[]>([1]);
  const [nextKey, setNextKey] = useState(2);

  return (
    <form action={createPrescription} className="space-y-3">
      <input type="hidden" name="encounterId" value={encounterId} />
      <input type="hidden" name="patientId" value={patientId} />

      <div className="space-y-2">
        {rowKeys.map((key, i) => (
          <div key={key} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-4">
              {i === 0 && (
                <label className="form-label">
                  Drug
                </label>
              )}
              <select
                name="drugId"
                required
                defaultValue=""
                className="input input-sm"
              >
                <option value="" disabled>
                  Select drug…
                </option>
                {drugs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                    {d.form ? ` (${d.form})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              {i === 0 && (
                <label className="form-label">
                  Dosage
                </label>
              )}
              <input
                name="dosage"
                required
                placeholder="e.g. 500mg"
                className="input input-sm"
              />
            </div>
            <div className="col-span-2">
              {i === 0 && (
                <label className="form-label">
                  Frequency
                </label>
              )}
              <input
                name="frequency"
                required
                placeholder="e.g. TDS"
                className="input input-sm"
              />
            </div>
            <div className="col-span-1">
              {i === 0 && (
                <label className="form-label">
                  Days
                </label>
              )}
              <input
                name="durationDays"
                type="number"
                min={1}
                required
                defaultValue={5}
                className="input input-sm"
              />
            </div>
            <div className="col-span-2">
              {i === 0 && (
                <label className="form-label">
                  Quantity
                </label>
              )}
              <input
                name="quantity"
                type="number"
                min={1}
                required
                defaultValue={1}
                className="input input-sm"
              />
            </div>
            <div className="col-span-1">
              {rowKeys.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setRowKeys((keys) => keys.filter((k) => k !== key))
                  }
                  className="btn btn-ghost"
                  aria-label="Remove drug"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 pt-1">
        <button
          type="button"
          onClick={() => {
            setRowKeys((keys) => [...keys, nextKey]);
            setNextKey((k) => k + 1);
          }}
          className="btn btn-ghost"
        >
          + Add another drug
        </button>
        <button
          type="submit"
          className="ml-auto btn btn-primary"
        >
          Save Prescription
        </button>
      </div>
    </form>
  );
}
