import type { ReactNode } from "react";
import { cn } from "./cn";
import { statusTone, humaniseStatus, type Tone } from "@/lib/status";

const toneCls: Record<Tone | "accent" | "outline", string> = {
  neutral: "tag-neutral",
  info: "tag-info",
  success: "tag-success",
  danger: "tag-danger",
  accent: "tag-accent",
  outline: "tag-outline",
};

/** A small tinted label. */
export function Tag({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone | "accent" | "outline";
  className?: string;
  children: ReactNode;
}) {
  return <span className={cn("tag", toneCls[tone], className)}>{children}</span>;
}

/**
 * A status enum rendered as a tag — tone comes from the central
 * `src/lib/status.ts` map, label is the humanised enum unless `children`
 * override it.
 */
export function StatusBadge({
  status,
  children,
  className,
}: {
  status: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Tag tone={statusTone(status)} className={className}>
      {children ?? humaniseStatus(status)}
    </Tag>
  );
}
