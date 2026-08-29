import type { ComponentProps } from "react";
import { cn } from "./cn";

type Size = "md" | "sm";

const sizeCls = (s: Size) => (s === "sm" ? "input-sm" : undefined);

export function Input({
  size = "md",
  className,
  ...rest
}: Omit<ComponentProps<"input">, "size"> & { size?: Size }) {
  return <input className={cn("input", sizeCls(size), className)} {...rest} />;
}

export function Textarea({
  className,
  ...rest
}: ComponentProps<"textarea">) {
  return <textarea className={cn("input", className)} {...rest} />;
}

export function Select({
  size = "md",
  className,
  children,
  ...rest
}: Omit<ComponentProps<"select">, "size"> & { size?: Size }) {
  return (
    <select className={cn("input", sizeCls(size), className)} {...rest}>
      {children}
    </select>
  );
}

export function FileInput({ className, ...rest }: ComponentProps<"input">) {
  return (
    <input
      type="file"
      className={cn(
        "text-muted w-full text-sm",
        "file:mr-3 file:border-0 file:bg-[var(--color-neutral-200)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--color-text)] hover:file:bg-[var(--color-neutral-300)]",
        className,
      )}
      {...rest}
    />
  );
}
