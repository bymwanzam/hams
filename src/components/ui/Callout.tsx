import type { ReactNode } from "react";
import { cn } from "./cn";

type Tone = "danger" | "warning" | "info";

const toneCls: Record<Tone, string> = {
  danger: "border-l-2 border-[var(--color-accent)] bg-[var(--color-accent-100)] text-[var(--color-accent-800)]",
  warning: "border-l-2 border-[var(--color-neutral-500)] bg-[var(--color-neutral-100)]",
  info: "border-l-2 border-[var(--color-info-ink)] bg-[var(--color-info-tint)] text-[var(--color-info-ink)]",
};

/** An inline notice — validation errors, access warnings. */
export function Callout({
  tone = "info",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("px-3 py-2 text-sm", toneCls[tone], className)} role="status">
      {children}
    </div>
  );
}

/** Shorthand for the near-universal form error banner fed by `?error=`. */
export function ErrorBanner({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <Callout tone="danger">{children}</Callout>;
}
