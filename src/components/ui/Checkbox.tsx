import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

/** A native checkbox with a Modernist square accent, plus an inline label. */
export function Checkbox({
  label,
  className,
  ...rest
}: ComponentProps<"input"> & { label?: ReactNode }) {
  const input = <input type="checkbox" className={cn("check", className)} {...rest} />;
  if (!label) return input;
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      {input}
      {label}
    </label>
  );
}
