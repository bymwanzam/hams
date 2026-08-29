import type { ReactNode } from "react";
import { cn } from "./cn";
import { Card } from "./Card";

/** A label + value pair for detail pages. */
export function Info({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-1">{label}</p>
      <p className="mb-0">{value ?? "—"}</p>
    </div>
  );
}

/** The two-column info card at the top of a detail page. */
export function InfoGrid({
  columns = 2,
  accented,
  className,
  children,
}: {
  columns?: 2 | 3 | 4;
  accented?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const cols = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" }[columns];
  return (
    <Card accented={accented} className={cn("grid gap-4", cols, className)}>
      {children}
    </Card>
  );
}
