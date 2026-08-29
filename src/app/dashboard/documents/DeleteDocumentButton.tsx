"use client";

import { ConfirmButton } from "@/components/ui";

export default function DeleteDocumentButton({
  action,
}: {
  action: () => Promise<void>;
}) {
  return (
    <ConfirmButton
      action={action}
      label="Delete"
      confirmTitle="Delete this document?"
      confirmBody="This can't be undone."
      confirmLabel="Delete document"
    />
  );
}
