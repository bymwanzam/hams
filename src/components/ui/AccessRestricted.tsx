import type { ReactNode } from "react";
import { Card, CardTitle } from "./Card";

/**
 * Shown in place of a module's page when the signed-in role isn't scoped to
 * it. Replaces the 12 near-identical per-module copies.
 */
export function AccessRestricted({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <Card className="max-w-lg gap-2">
      <CardTitle>{title}</CardTitle>
      <p className="text-muted mb-0 text-sm">
        {children ??
          "You don't have access to this module. If you need it, contact your system administrator to update your account role."}
      </p>
    </Card>
  );
}
