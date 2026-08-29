import type { ReactNode } from "react";
import { cn } from "./cn";
import { Card } from "./Card";

interface Props {
  title: ReactNode;
  /** Right-aligned action beside the section title. */
  action?: ReactNode;
  accented?: boolean;
  className?: string;
  children: ReactNode;
}

/** A titled section on a detail page. */
export function SectionCard({ title, action, accented, className, children }: Props) {
  return (
    <Card accented={accented} className={cn("gap-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="card-title mb-0">{title}</h2>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </Card>
  );
}
