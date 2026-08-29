"use client";

import { useState } from "react";

export default function ManualLineItems() {
  const [rowKeys, setRowKeys] = useState<number[]>([]);
  const [nextKey, setNextKey] = useState(1);

  return (
    <div className="space-y-2">
      {rowKeys.map((key, i) => (
        <div key={key} className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-6">
            {i === 0 && (
              <label className="form-label">
                Description
              </label>
            )}
            <input
              name="description"
              required
              placeholder="e.g. Consultation Fee"
              className="input input-sm"
            />
          </div>
          <div className="col-span-2">
            {i === 0 && (
              <label className="form-label">
                Qty
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
          <div className="col-span-3">
            {i === 0 && (
              <label className="form-label">
                Unit Price (GHS)
              </label>
            )}
            <input
              name="unitPrice"
              type="number"
              step="0.01"
              min={0}
              required
              className="input input-sm"
            />
          </div>
          <div className="col-span-1">
            <button
              type="button"
              onClick={() => setRowKeys((keys) => keys.filter((k) => k !== key))}
              className="btn btn-ghost"
              aria-label="Remove line item"
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => {
          setRowKeys((keys) => [...keys, nextKey]);
          setNextKey((k) => k + 1);
        }}
        className="btn btn-ghost"
      >
        + Add Line Item
      </button>
    </div>
  );
}
