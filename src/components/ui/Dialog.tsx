"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children?: ReactNode;
  /** Footer actions (right-aligned). */
  actions?: ReactNode;
}

// Must match the `dialog-backdrop-out` / `dialog-panel-out` duration in
// globals.css. Kept as a constant so the two stay in sync deliberately
// rather than by coincidence.
const EXIT_MS = 140;

/** A modal at the top elevation over a neutral-900 scrim. Fades/scales in on
 *  open and plays a matching exit animation before unmounting on close —
 *  see the `dialog-*-in` / `dialog-*-out` keyframes in globals.css. */
export function Dialog({ open, onClose, title, children, actions }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Keeps the dialog mounted for EXIT_MS after `open` goes false, so the
  // closing animation gets a chance to play instead of the panel just
  // disappearing on the frame `open` flips.
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      setClosing(false);
      return;
    }
    if (!rendered) return;
    setClosing(true);
    const t = setTimeout(() => {
      setRendered(false);
      setClosing(false);
    }, EXIT_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!rendered) return null;

  return (
    <div
      className="dialog-backdrop"
      data-state={closing ? "closing" : "open"}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        tabIndex={-1}
      >
        <div className="dialog-title">{title}</div>
        {children ? <div className="dialog-body">{children}</div> : null}
        {actions ? <div className="dialog-actions">{actions}</div> : null}
      </div>
    </div>
  );
}
