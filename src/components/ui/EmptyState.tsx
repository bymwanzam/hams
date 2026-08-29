import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * "Nothing here yet" copy. `boxed` wraps it in a panel for a standalone
 * empty page; unboxed is the inline note inside an existing section.
 */
export function EmptyState({
  children,
  boxed = false,
  className,
}: {
  children: ReactNode;
  boxed?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-muted text-sm mb-0",
        boxed && "panel px-4 py-10 text-center",
        className,
      )}
    >
      {children}
    </p>
  );
}
