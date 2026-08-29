"use client";

import { useState, type ReactNode } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

interface Props {
  /** The server action to run on confirm. */
  action: (formData: FormData) => void | Promise<void>;
  /** Hidden inputs to submit with the action. */
  hidden?: Record<string, string>;
  label: ReactNode;
  confirmTitle: ReactNode;
  confirmBody: ReactNode;
  confirmLabel?: ReactNode;
  /** Style of the trigger. Defaults to a ghost text button. */
  variant?: "primary" | "secondary" | "ghost";
}

/**
 * A destructive action gated by a Modernist dialog (replaces raw
 * `window.confirm`). The trigger opens the dialog; confirming submits the
 * wrapped form to `action`.
 */
export function ConfirmButton({
  action,
  hidden,
  label,
  confirmTitle,
  confirmBody,
  confirmLabel = "Confirm",
  variant = "ghost",
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={confirmTitle}
        actions={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <form action={action}>
              {hidden
                ? Object.entries(hidden).map(([k, v]) => (
                    <input key={k} type="hidden" name={k} value={v} />
                  ))
                : null}
              <Button variant="primary" type="submit">
                {confirmLabel}
              </Button>
            </form>
          </>
        }
      >
        {confirmBody}
      </Dialog>
    </>
  );
}
