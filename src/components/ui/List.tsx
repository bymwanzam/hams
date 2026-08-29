import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

/**
 * A divide-list — replaces `ul.divide-y divide-slate-100`. The `.list` class
 * is the hook the staggered-row entrance animation keys off (globals.css).
 */
export function List({ className, children, ...rest }: ComponentProps<"ul">) {
  return (
    <ul className={cn("list", className)} {...rest}>
      {children}
    </ul>
  );
}

interface RowProps {
  href?: string;
  /** Add the 2px group-accent left rule. */
  accented?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * One list row. With `href` it's a clickable `.row-link` (hover nudge);
 * without, a plain padded `<li>` body.
 */
export function ListRow({ href, accented, className, children }: RowProps) {
  if (href) {
    return (
      <li>
        <Link
          href={href}
          className={cn("row-link", accented && "is-accented", className)}
        >
          {children}
        </Link>
      </li>
    );
  }
  return <li className={cn("px-4 py-3 text-sm", className)}>{children}</li>;
}
