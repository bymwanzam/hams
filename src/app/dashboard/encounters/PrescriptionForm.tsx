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
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Drug
                </label>
              )}
              <select
                name="drugId"
                required
                defaultValue=""
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
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
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Dosage
                </label>
              )}
              <input
                name="dosage"
                required
                placeholder="e.g. 500mg"
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="col-span-2">
              {i === 0 && (
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Frequency
                </label>
              )}
              <input
                name="frequency"
                required
                placeholder="e.g. TDS"
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="col-span-1">
              {i === 0 && (
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Days
                </label>
              )}
              <input
                name="durationDays"
                type="number"
                min={1}
                required
                defaultValue={5}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="col-span-2">
              {i === 0 && (
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Quantity
                </label>
              )}
              <input
                name="quantity"
                type="number"
                min={1}
                required
                defaultValue={1}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="col-span-1">
              {rowKeys.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setRowKeys((keys) => keys.filter((k) => k !== key))
                  }
                  className="text-red-500 hover:text-red-700 text-sm px-2 py-1.5"
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
          className="text-sm text-blue-600 hover:underline"
        >
          + Add another drug
        </button>
        <button
          type="submit"
          className="ml-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          Save Prescription
        </button>
      </div>
    </form>
  );
}
