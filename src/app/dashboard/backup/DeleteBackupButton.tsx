"use client";

import { ConfirmButton } from "@/components/ui";

export default function DeleteBackupButton({
  action,
}: {
  action: () => Promise<void>;
}) {
  return (
    <ConfirmButton
      action={action}
      label="Delete"
      confirmTitle="Delete this backup file?"
      confirmBody="This cannot be undone — make sure you don't need it before removing it."
      confirmLabel="Delete backup"
    />
  );
}
