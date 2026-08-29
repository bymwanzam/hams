import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

/** A Modernist data table. Wrap in a <Card flush> for the bordered surface. */
export function Table({ className, children, ...rest }: ComponentProps<"table">) {
  return (
    <table className={cn("table", className)} {...rest}>
      {children}
    </table>
  );
}

export function Th({
  align,
  className,
  children,
  ...rest
}: ComponentProps<"th"> & { align?: "left" | "right" }) {
  return (
    <th data-align={align === "right" ? "right" : undefined} className={className} {...rest}>
      {children}
    </th>
  );
}

export function Td({
  align,
  className,
  children,
  ...rest
}: ComponentProps<"td"> & { align?: "left" | "right" }) {
  return (
    <td data-align={align === "right" ? "right" : undefined} className={className} {...rest}>
      {children}
    </td>
  );
}

/** Full-width "no rows" cell. */
export function TableEmpty({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-muted py-8 text-center">
        {children}
      </td>
    </tr>
  );
}
