"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "./cn";
import { statusTone, humaniseStatus, type Tone } from "@/lib/status";

const toneCls: Record<Tone | "accent" | "outline", string> = {
  neutral: "tag-neutral",
  info: "tag-info",
  success: "tag-success",
  warning: "tag-warning",
  danger: "tag-danger",
  critical: "tag-critical",
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

// Must match `.tag-flash`'s animation-duration in globals.css.
const FLASH_MS = 420;

/**
 * A status enum rendered as a tag — tone comes from the central
 * `src/lib/status.ts` map, label is the humanised enum unless `children`
 * override it.
 *
 * When `status` changes on an already-mounted badge (PENDING → COMPLETED,
 * say), it briefly plays `.tag-flash` so the transition is felt as an
 * event, not just a silent re-render. First mount doesn't flash.
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
  const prevStatus = useRef(status);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (prevStatus.current === status) return;
    prevStatus.current = status;
    setFlashing(true);
    const t = setTimeout(() => setFlashing(false), FLASH_MS);
    return () => clearTimeout(t);
  }, [status]);

  return (
    <Tag tone={statusTone(status)} className={cn(flashing && "tag-flash", className)}>
      {children ?? humaniseStatus(status)}
    </Tag>
  );
}
