import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn";

type Props = Omit<ComponentProps<typeof Link>, "className" | "children"> & {
  className?: string;
  children: ReactNode;
};

/** Inline text action — `← Back`, `Edit`, `+ Add …`. Renders `.btn-ghost`. */
export function LinkButton({ className, children, ...rest }: Props) {
  return (
    <Link className={cn("btn btn-ghost", className)} {...rest}>
      {children}
    </Link>
  );
}
