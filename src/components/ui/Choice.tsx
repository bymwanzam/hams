import type { ReactNode } from "react";

interface Option {
  value: string;
  label: ReactNode;
}

/**
 * Segmented control on native radio inputs — no script. `name` groups them;
 * the checked option fills with the accent.
 */
export function Segmented({
  name,
  options,
  defaultValue,
  ariaLabel,
}: {
  name: string;
  options: Option[];
  defaultValue?: string;
  ariaLabel?: string;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        <label className="seg-opt" key={o.value}>
          <input
            type="radio"
            name={name}
            value={o.value}
            defaultChecked={defaultValue === o.value}
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

/** A vertical list of native radios with the Modernist dot. */
export function RadioGroup({
  name,
  options,
  defaultValue,
  ariaLabel,
}: {
  name: string;
  options: Option[];
  defaultValue?: string;
  ariaLabel?: string;
}) {
  return (
    <div className="grid gap-1" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        <label className="radio" key={o.value}>
          <input
            type="radio"
            name={name}
            value={o.value}
            defaultChecked={defaultValue === o.value}
          />
          <span className="dot" />
          {o.label}
        </label>
      ))}
    </div>
  );
}
