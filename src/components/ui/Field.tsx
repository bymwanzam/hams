import type { ReactNode } from "react";
import { cn } from "./cn";

interface Props {
  label: ReactNode;
  htmlFor?: string;
  /** Help text under the control. */
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** `.field` wrapper — label above the control, optional hint below. */
export function Field({ label, htmlFor, hint, className, children }: Props) {
  return (
    <div className={cn("field", className)}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint ? <p className="text-muted mt-1 mb-0 text-xs">{hint}</p> : null}
    </div>
  );
}
