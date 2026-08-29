"use client";

import { ConfirmButton } from "@/components/ui";

export default function CancelOrderButton({
  action,
}: {
  action: () => Promise<void>;
}) {
  return (
    <ConfirmButton
      action={action}
      label="Remove"
      confirmTitle="Remove this order?"
      confirmBody="This can't be undone."
      confirmLabel="Remove order"
    />
  );
}
