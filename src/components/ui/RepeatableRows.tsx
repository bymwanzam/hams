"use client";

import { useState, type ReactNode } from "react";
import { Button } from "./Button";

let counter = 0;
const nextKey = () => `r${counter++}`;

interface Props {
  /** Render one row. `first` is true for the top row (show field labels there only). */
  renderRow: (rowKey: string, first: boolean) => ReactNode;
  addLabel: ReactNode;
  /** Rows present on first render. */
  initialRows?: number;
  /** Keep at least this many rows. */
  minRows?: number;
}

/**
 * Generic add/remove row list for line-item style editors (manual invoice
 * lines, prescription drugs). Flush-left "+ add" control below the rows.
 */
export function RepeatableRows({
  renderRow,
  addLabel,
  initialRows = 1,
  minRows = 0,
}: Props) {
  const [keys, setKeys] = useState<string[]>(() =>
    Array.from({ length: Math.max(initialRows, minRows) }, nextKey),
  );

  return (
    <div className="space-y-2">
      {keys.map((k, i) => (
        <div key={k} className="grid grid-cols-12 items-end gap-2">
          <div className="col-span-11">{renderRow(k, i === 0)}</div>
          <div className="col-span-1">
            {keys.length > minRows ? (
              <Button
                variant="ghost"
                aria-label="Remove row"
                onClick={() => setKeys((cur) => cur.filter((x) => x !== k))}
              >
                ✕
              </Button>
            ) : null}
          </div>
        </div>
      ))}
      <Button variant="ghost" onClick={() => setKeys((cur) => [...cur, nextKey()])}>
        {addLabel}
      </Button>
    </div>
  );
}
